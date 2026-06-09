import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { collectPayment, checkTransactionStatus, normalizePhone } from '../services/moolre.js'
import env from '../config/env.js'

const router = Router()

router.post('/initiate', authenticate, async (req, res) => {
  try {
    const { lease_id } = req.body

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

    const { data: user } = await supabase
      .from('users')
      .select('phone, full_name')
      .eq('id', req.user.id)
      .single()

    if (!user?.phone) {
      return res.status(400).json({ error: 'No phone number on your account' })
    }

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
        amount: lease.monthly_amount,
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
        amount: lease.monthly_amount,
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

router.get('/status/:id', authenticate, async (req, res) => {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('id, status, amount, moolre_reference, type, paid_at, created_at')
      .eq('id', req.params.id)
      .single()

    if (error || !payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    if (payment.status === 'processing' || payment.status === 'pending') {
      const moolreStatus = await checkTransactionStatus(payment.moolre_reference)
      if (moolreStatus?.data?.status) {
        const mapped = mapMoolreStatus(moolreStatus.data.status)
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

function mapMoolreStatus(moolreStatus) {
  const s = String(moolreStatus).toLowerCase()
  if (s === 'success' || s === 'completed' || s === 'successful') return 'success'
  if (s === 'failed' || s === 'declined' || s === 'rejected') return 'failed'
  if (s === 'pending' || s === 'processing' || s === 'initiated') return 'processing'
  return 'processing'
}

export default router
