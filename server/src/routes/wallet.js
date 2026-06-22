import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { collectPayment, checkPaymentStatus, disbursePayment, parseTxStatus, normalizePhone, verifyPaymentOTP } from '../services/moolre.js'
import env from '../config/env.js'

const router = Router()

async function getOrCreateWallet(userId) {
  const { data: existing } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) return existing

  const { data: created, error } = await supabase
    .from('wallets')
    .insert({ user_id: userId, balance: 0, locked_balance: 0 })
    .select()
    .single()

  if (error) throw error
  return created
}

router.get('/balance', authenticate, async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id)
    res.json({
      balance: Number(wallet.balance),
      locked_balance: Number(wallet.locked_balance),
      total: Number(wallet.balance) + Number(wallet.locked_balance),
    })
  } catch (err) {
    console.error('[Wallet] Balance error:', err.message)
    res.status(500).json({ error: 'Failed to fetch wallet balance' })
  }
})

router.get('/transactions', authenticate, async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id)
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

router.post('/deposit', authenticate, async (req, res) => {
  try {
    const { amount, phone: altPhone } = req.body

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Minimum deposit is GHS 1.00' })
    }

    const { data: user } = await supabase
      .from('users')
      .select('phone, is_blacklisted')
      .eq('id', req.user.id)
      .single()

    if (user?.is_blacklisted) {
      return res.status(403).json({ error: 'Your account has been restricted. Contact support.' })
    }

    const depositPhone = altPhone ? normalizePhone(altPhone) : user?.phone
    if (!depositPhone) {
      return res.status(400).json({ error: 'No phone number provided' })
    }

    const wallet = await getOrCreateWallet(req.user.id)
    const reference = `WD-${req.user.id.slice(0, 8)}-${Date.now()}`
    const callbackUrl = env.appBaseUrl !== 'http://localhost:5000'
      ? `${env.appBaseUrl}/api/webhooks/moolre-wallet`
      : undefined

    const { data: txn, error: txnErr } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: req.user.id,
        type: 'deposit',
        amount: Number(amount),
        balance_after: Number(wallet.balance),
        description: altPhone ? `Wallet top-up via MoMo (${normalizePhone(altPhone)})` : 'Wallet top-up via MoMo',
        reference,
        status: 'pending',
      })
      .select()
      .single()

    if (txnErr) throw txnErr

    try {
      await collectPayment({
        amount: Number(amount),
        phone: depositPhone,
        reference,
        callbackUrl,
      })

      await supabase
        .from('wallet_transactions')
        .update({ status: 'pending' })
        .eq('id', txn.id)

      res.status(201).json({
        transaction_id: txn.id,
        reference,
        amount: Number(amount),
        message: 'Deposit initiated. Check your phone for the MoMo approval prompt.',
      })
    } catch (err) {
      await supabase
        .from('wallet_transactions')
        .update({ status: 'failed' })
        .eq('id', txn.id)

      res.status(502).json({
        error: 'Payment provider could not process your deposit',
        detail: err.response?.data?.message || err.message,
      })
    }
  } catch (err) {
    console.error('[Wallet] Deposit error:', err.message)
    res.status(500).json({ error: 'Deposit failed' })
  }
})

router.get('/deposit-status/:id', authenticate, async (req, res) => {
  try {
    const { data: txn } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()

    if (!txn) return res.status(404).json({ error: 'Transaction not found' })

    if (txn.status === 'pending' && txn.reference) {
      try {
        const moolreResult = await checkPaymentStatus(txn.reference)
        const txstatus = moolreResult?.data?.txstatus
        if (txstatus !== undefined) {
          const mapped = parseTxStatus(txstatus)
          if (mapped === 'success') {
            const wallet = await getOrCreateWallet(req.user.id)
            const newBalance = Number(wallet.balance) + Number(txn.amount)

            await supabase
              .from('wallets')
              .update({ balance: newBalance, updated_at: new Date().toISOString() })
              .eq('id', wallet.id)

            await supabase
              .from('wallet_transactions')
              .update({ status: 'success', balance_after: newBalance })
              .eq('id', txn.id)

            return res.json({ ...txn, status: 'success', balance_after: newBalance })
          }
          if (mapped === 'failed') {
            await supabase
              .from('wallet_transactions')
              .update({ status: 'failed' })
              .eq('id', txn.id)
            return res.json({ ...txn, status: 'failed' })
          }
        }
      } catch {}
    }

    res.json(txn)
  } catch (err) {
    res.status(500).json({ error: 'Failed to check deposit status' })
  }
})

router.post('/verify-otp', authenticate, async (req, res) => {
  try {
    const { transaction_id, otp } = req.body

    if (!transaction_id || !otp) {
      return res.status(400).json({ error: 'Transaction ID and OTP are required' })
    }

    if (!/^\d{4,6}$/.test(otp)) {
      return res.status(400).json({ error: 'OTP must be 4-6 digits' })
    }

    const { data: txn, error: txnErr } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('id', transaction_id)
      .eq('user_id', req.user.id)
      .single()

    if (txnErr || !txn) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    if (!['pending', 'processing'].includes(txn.status)) {
      return res.status(400).json({ error: `Transaction is already ${txn.status}` })
    }

    const { data: user } = await supabase
      .from('users')
      .select('phone')
      .eq('id', req.user.id)
      .single()

    const moolreResult = await verifyPaymentOTP({
      reference: txn.reference,
      otp,
      phone: user?.phone,
    })

    const txstatus = moolreResult?.data?.txstatus
    const mapped = parseTxStatus(txstatus)

    if (mapped === 'success') {
      const wallet = await getOrCreateWallet(req.user.id)
      const newBalance = Number(wallet.balance) + Number(txn.amount)

      await supabase
        .from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id)

      await supabase
        .from('wallet_transactions')
        .update({ status: 'success', balance_after: newBalance })
        .eq('id', txn.id)

      return res.json({ status: 'success', message: 'Deposit verified', balance: newBalance })
    }

    if (mapped === 'failed') {
      await supabase
        .from('wallet_transactions')
        .update({ status: 'failed' })
        .eq('id', txn.id)
      return res.json({ status: 'failed', message: moolreResult?.message || 'Verification failed' })
    }

    res.json({ status: 'pending', message: 'Verification submitted, awaiting confirmation', moolre: moolreResult })
  } catch (err) {
    const msg = err.response?.data?.message || err.message
    console.error('[Wallet] OTP verify error:', msg)
    res.status(502).json({ error: 'Verification failed', detail: msg })
  }
})

router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const { amount, phone: altPhone } = req.body

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Minimum withdrawal is GHS 1.00' })
    }

    const { data: user } = await supabase
      .from('users')
      .select('phone')
      .eq('id', req.user.id)
      .single()

    const withdrawPhone = altPhone ? normalizePhone(altPhone) : user?.phone
    if (!withdrawPhone) {
      return res.status(400).json({ error: 'No phone number provided' })
    }

    const wallet = await getOrCreateWallet(req.user.id)

    if (Number(wallet.balance) < amount) {
      return res.status(400).json({
        error: `Insufficient available balance. You have GHS ${Number(wallet.balance).toFixed(2)} available.`,
      })
    }

    const reference = `WW-${req.user.id.slice(0, 8)}-${Date.now()}`
    const newBalance = Number(wallet.balance) - Number(amount)

    await supabase
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id)

    try {
      await disbursePayment({
        amount: Number(amount),
        phone: withdrawPhone,
        reference,
      })

      await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: req.user.id,
          type: 'withdrawal',
          amount: Number(amount),
          balance_after: newBalance,
          description: 'Withdrawal to MoMo',
          reference,
          status: 'success',
        })

      res.json({
        message: `GHS ${Number(amount).toFixed(2)} sent to your MoMo wallet.`,
        balance: newBalance,
        reference,
      })
    } catch (err) {
      await supabase
        .from('wallets')
        .update({ balance: Number(wallet.balance), updated_at: new Date().toISOString() })
        .eq('id', wallet.id)

      res.status(502).json({ error: 'Withdrawal failed. Your balance has been restored.' })
    }
  } catch (err) {
    console.error('[Wallet] Withdraw error:', err.message)
    res.status(500).json({ error: 'Withdrawal failed' })
  }
})

export { getOrCreateWallet }
export default router
