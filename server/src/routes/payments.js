import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { collectPayment, checkPaymentStatus, parseTxStatus, normalizePhone, verifyPaymentOTP } from '../services/moolre.js'
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

      const otpRequired = moolreResult?.code === 'TP14'

      await supabase
        .from('payments')
        .update({ status: otpRequired ? 'pending' : 'processing' })
        .eq('id', payment.id)

      res.status(201).json({
        payment: { ...payment, status: otpRequired ? 'pending' : 'processing' },
        reference,
        fee: escavioFee,
        netAmount,
        otp_required: otpRequired,
        moolre: moolreResult,
        message: otpRequired
          ? 'OTP sent to your phone. Enter the code to proceed.'
          : 'Payment initiated. Check your phone for the MoMo approval prompt.',
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

router.post('/verify-otp', authenticate, async (req, res) => {
  try {
    const { payment_id, otp } = req.body

    if (!payment_id || !otp) {
      return res.status(400).json({ error: 'Payment ID and OTP are required' })
    }

    if (!/^\d{4,6}$/.test(otp)) {
      return res.status(400).json({ error: 'OTP must be 4-6 digits' })
    }

    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .select('*, leases(landlord_id, escrow_balance, monthly_amount, advance_months)')
      .eq('id', payment_id)
      .eq('payer_id', req.user.id)
      .single()

    if (payErr || !payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    if (!['pending', 'processing'].includes(payment.status)) {
      return res.status(400).json({ error: `Payment is already ${payment.status}` })
    }

    const { data: user } = await supabase
      .from('users')
      .select('phone')
      .eq('id', req.user.id)
      .single()

    const moolreResult = await verifyPaymentOTP({
      reference: payment.moolre_reference,
      otpcode: otp,
      phone: user?.phone,
      amount: payment.amount,
    })

    if (moolreResult?.code === 'TR099') {
      await supabase
        .from('payments')
        .update({ status: 'processing' })
        .eq('id', payment.id)

      return res.json({ status: 'pending', message: 'OTP verified. Approve the MoMo prompt on your phone.', moolre: moolreResult })
    }

    if (moolreResult?.code === 'TP17') {
      console.log(`[Payments] Phone verified (TP17), re-initiating payment with same ref ${payment.moolre_reference}`)
      const callbackUrl = env.appBaseUrl !== 'http://localhost:5000'
        ? `${env.appBaseUrl}/api/webhooks/moolre`
        : undefined

      const retryResult = await collectPayment({
        amount: payment.amount,
        phone: user?.phone,
        reference: payment.moolre_reference,
        callbackUrl,
      })

      console.log(`[Payments] Re-initiate result:`, JSON.stringify(retryResult))

      await supabase
        .from('payments')
        .update({ status: 'processing' })
        .eq('id', payment.id)

      if (retryResult?.code === 'TR099') {
        return res.json({ status: 'pending', message: 'Phone verified! Approve the MoMo prompt on your phone.', moolre: retryResult })
      }

      if (retryResult?.code === 'TP13') {
        const newRef = `${payment.moolre_reference}-${Date.now().toString(36)}`
        console.log(`[Payments] Duplicate ref, retrying with ${newRef}`)
        const retry2 = await collectPayment({ amount: payment.amount, phone: user?.phone, reference: newRef, callbackUrl })
        console.log(`[Payments] Retry2 result:`, JSON.stringify(retry2))
        await supabase.from('payments').update({ moolre_reference: newRef }).eq('id', payment.id)

        if (retry2?.code === 'TR099') {
          return res.json({ status: 'pending', message: 'Phone verified! Approve the MoMo prompt on your phone.', moolre: retry2 })
        }
        return res.json({ status: 'pending', message: 'Phone verified. Processing payment...', moolre: retry2 })
      }

      return res.json({ status: 'pending', message: 'Phone verified. Processing payment...', moolre: retryResult })
    }

    if (moolreResult?.code === 'TP15') {
      return res.json({ status: 'invalid_otp', message: 'Invalid verification code. Check your latest SMS and try again.' })
    }

    if (moolreResult?.code === 'TP14') {
      return res.json({ status: 'otp_required', message: 'A new code has been sent to your phone. Enter the latest code.' })
    }

    const txstatus = moolreResult?.data?.txstatus
    if (txstatus !== undefined) {
      const mapped = parseTxStatus(txstatus)
      if (mapped === 'success') {
        await supabase
          .from('payments')
          .update({ status: 'success', paid_at: new Date().toISOString() })
          .eq('id', payment.id)

        if (payment.leases && payment.type !== 'security_deposit') {
          const newEscrow = Number(payment.leases.escrow_balance || 0) + Number(payment.net_amount)
          await supabase
            .from('leases')
            .update({ escrow_balance: newEscrow })
            .eq('id', payment.lease_id)
        }

        return res.json({ status: 'success', message: 'Payment verified successfully', moolre: moolreResult })
      }

      if (mapped === 'failed') {
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('id', payment.id)
        return res.json({ status: 'failed', message: moolreResult?.message || 'Verification failed' })
      }
    }

    await supabase
      .from('payments')
      .update({ status: 'processing' })
      .eq('id', payment.id)

    res.json({ status: 'pending', message: 'Verification submitted, awaiting confirmation', moolre: moolreResult })
  } catch (err) {
    const msg = err.response?.data?.message || err.message
    console.error('[Payments] OTP verify error:', msg)
    res.status(502).json({ error: 'Verification failed', detail: msg })
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
