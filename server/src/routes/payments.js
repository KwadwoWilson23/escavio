import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { collectPayment, checkPaymentStatus, parseTxStatus, normalizePhone } from '../services/moolre.js'
import env from '../config/env.js'

const router = Router()

const ESCAVIO_FEE_RATE = 0.01

router.post('/initiate', authenticate, async (req, res) => {
  try {
    const { lease_id } = req.body

    const { data: user } = await supabase
      .from('users')
      .select('phone, full_name, is_blacklisted, is_verified')
      .eq('id', req.user.id)
      .single()

    if (user?.is_blacklisted) {
      return res.status(403).json({ error: 'Your account has been suspended due to payment defaults. Contact support.' })
    }

    if (!user?.phone) {
      return res.status(400).json({ error: 'No phone number on your account' })
    }

    const { data: lease, error: leaseErr } = await supabase
      .from('leases')
      .select('*, properties(address), landlord:users!leases_landlord_id_fkey(phone, full_name)')
      .eq('id', lease_id)
      .single()

    if (leaseErr || !lease) {
      return res.status(404).json({ error: 'Lease not found' })
    }

    if (lease.status !== 'active') {
      return res.status(400).json({ error: 'Lease is not active' })
    }

    const amount = lease.monthly_amount
    const escavioFee = Math.round(amount * ESCAVIO_FEE_RATE * 100) / 100
    const netAmount = Math.round((amount - escavioFee) * 100) / 100

    const reference = `COL-${lease_id.slice(0, 8)}-${Date.now()}`
    const callbackUrl = env.appBaseUrl !== 'http://localhost:5000'
      ? `${env.appBaseUrl}/api/webhooks/moolre`
      : undefined

    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        lease_id,
        payer_id: req.user.id,
        recipient_id: lease.landlord_id,
        amount,
        escavio_fee: escavioFee,
        net_amount: netAmount,
        moolre_reference: reference,
        type: 'tenant_collection',
        status: 'pending',
        due_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (payErr) throw payErr

    try {
      const moolreResult = await collectPayment({
        amount,
        phone: user.phone,
        reference,
        callbackUrl,
      })

      await supabase
        .from('payments')
        .update({ status: 'processing' })
        .eq('id', payment.id)

      res.status(201).json({
        payment: { ...payment, status: 'processing' },
        reference,
        fee: escavioFee,
        netAmount,
        moolre: moolreResult,
        message: 'Payment initiated. Check your phone for the MoMo approval prompt.',
      })
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message

      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id)

      res.status(502).json({
        error: 'Payment provider could not process your request',
        detail: errorMsg,
        payment_id: payment.id,
      })
    }
  } catch (err) {
    console.error('[Payments] Initiation error:', err.message)
    res.status(500).json({ error: 'Payment initiation failed. Please try again.' })
  }
})

router.post('/security-deposit', authenticate, async (req, res) => {
  try {
    const { lease_id } = req.body

    const { data: user } = await supabase
      .from('users')
      .select('phone, full_name, is_verified')
      .eq('id', req.user.id)
      .single()

    if (!user?.phone) {
      return res.status(400).json({ error: 'No phone number on your account' })
    }

    const { data: lease, error: leaseErr } = await supabase
      .from('leases')
      .select('*, properties(address)')
      .eq('id', lease_id)
      .single()

    if (leaseErr || !lease) {
      return res.status(404).json({ error: 'Lease not found' })
    }

    if (lease.tenant_id !== req.user.id) {
      return res.status(403).json({ error: 'This lease is not assigned to you' })
    }

    const depositAmount = lease.monthly_amount
    const reference = `DEP-${lease_id.slice(0, 8)}-${Date.now()}`
    const callbackUrl = env.appBaseUrl !== 'http://localhost:5000'
      ? `${env.appBaseUrl}/api/webhooks/moolre`
      : undefined

    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        lease_id,
        payer_id: req.user.id,
        recipient_id: lease.landlord_id,
        amount: depositAmount,
        escavio_fee: 0,
        net_amount: depositAmount,
        moolre_reference: reference,
        type: 'security_deposit',
        status: 'pending',
        due_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (payErr) throw payErr

    try {
      const moolreResult = await collectPayment({
        amount: depositAmount,
        phone: user.phone,
        reference,
        callbackUrl,
      })

      await supabase
        .from('payments')
        .update({ status: 'processing' })
        .eq('id', payment.id)

      res.status(201).json({
        payment: { ...payment, status: 'processing' },
        reference,
        moolre: moolreResult,
        message: 'Security deposit prompt sent to your phone.',
      })
    } catch (err) {
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id)

      res.status(502).json({ error: 'Payment provider could not process deposit', payment_id: payment.id })
    }
  } catch (err) {
    console.error('[Payments] Security deposit error:', err.message)
    res.status(500).json({ error: 'Security deposit failed' })
  }
})

router.get('/status/:id', authenticate, async (req, res) => {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('id, status, amount, escavio_fee, net_amount, moolre_reference, type, paid_at, created_at')
      .eq('id', req.params.id)
      .single()

    if (error || !payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    if (payment.status === 'processing' || payment.status === 'pending') {
      const moolreResult = await checkPaymentStatus(payment.moolre_reference)
      const txstatus = moolreResult?.data?.txstatus
      if (txstatus !== undefined) {
        const mapped = parseTxStatus(txstatus) === 'success' ? 'success'
          : parseTxStatus(txstatus) === 'failed' ? 'failed'
          : 'processing'
        if (mapped !== payment.status) {
          await supabase
            .from('payments')
            .update({
              status: mapped,
              ...(mapped === 'success' ? { paid_at: new Date().toISOString() } : {}),
            })
            .eq('id', payment.id)
          payment.status = mapped
        }
      }
    }

    res.json(payment)
  } catch (err) {
    console.error('[Payments] Status check error:', err.message)
    res.status(500).json({ error: 'Failed to check payment status' })
  }
})

router.get('/lease/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('lease_id', req.params.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' })
  }
})

export default router
