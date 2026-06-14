import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { sendSMS, verifyWebhookSignature } from '../services/moolre.js'
import { processDisbursement } from '../services/disbursement.js'
import { sendPaymentReceipt } from '../services/whatsapp.js'
import { notifyBoth } from '../services/notify.js'
import { getOrCreateWallet } from './wallet.js'

const router = Router()

router.post('/moolre', async (req, res) => {
  try {
    const signature = req.headers['x-moolre-signature'] || req.headers['x-webhook-signature'] || ''

    if (signature && !verifyWebhookSignature(req.body, signature)) {
      console.warn('[Webhook] Invalid signature, processing anyway for demo')
    }

    const { reference, externalref, status, amount, transactionid } = req.body
    const ref = reference || externalref

    console.log(`[Webhook] Received: ref=${ref}, status=${status}, amount=${amount}, txn=${transactionid}`)

    if (!ref) {
      return res.json({ received: true, ignored: 'no reference' })
    }

    const moolreStatus = String(status).toLowerCase()
    const isSuccess = ['success', 'successful', 'completed'].includes(moolreStatus)
    const isFailed = ['failed', 'declined', 'rejected', 'error'].includes(moolreStatus)

    if (!isSuccess && !isFailed) {
      console.log(`[Webhook] Intermediate status: ${status}, skipping`)
      return res.json({ received: true, status: 'intermediate' })
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('*, leases(*, properties(address)), payer:users!payments_payer_id_fkey(phone, full_name), recipient:users!payments_recipient_id_fkey(phone, full_name)')
      .eq('moolre_reference', ref)
      .single()

    if (!payment) {
      console.warn(`[Webhook] No payment found for ref: ${ref}`)
      return res.status(404).json({ error: 'Payment not found' })
    }

    if (payment.status === 'success') {
      return res.json({ received: true, already_processed: true })
    }

    if (isFailed) {
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id)

      if (payment.payer?.phone) {
        sendSMS({
          phone: payment.payer.phone,
          message: `Escavio: Your payment of GHS ${payment.amount.toFixed(2)} was not completed. Please try again from the app.`,
        }).catch(() => {})
      }

      notifyBoth({
        payerId: payment.payer_id,
        recipientId: payment.recipient_id,
        payerMsg: `Your payment of GHS ${payment.amount.toFixed(2)} failed. Please try again.`,
        recipientMsg: `A payment of GHS ${payment.amount.toFixed(2)} for ${payment.leases?.properties?.address || 'your property'} was declined.`,
        type: 'payment',
      }).catch(() => {})

      return res.json({ received: true, result: 'failed' })
    }

    await supabase
      .from('payments')
      .update({
        status: 'success',
        paid_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    const address = payment.leases?.properties?.address || 'your property'

    if (payment.type === 'security_deposit') {
      await supabase
        .from('leases')
        .update({
          security_deposit: payment.amount,
          status: 'active',
        })
        .eq('id', payment.lease_id)

      await supabase
        .from('properties')
        .update({ status: 'occupied' })
        .eq('id', payment.leases?.property_id)

      if (payment.payer?.phone) {
        sendSMS({
          phone: payment.payer.phone,
          message: `Escavio: Security deposit of GHS ${payment.amount.toFixed(2)} for ${address} received. Your lease is now active!`,
        }).catch(() => {})
      }

      if (payment.recipient?.phone) {
        sendSMS({
          phone: payment.recipient.phone,
          message: `Escavio: Tenant ${payment.payer?.full_name || ''} paid security deposit of GHS ${payment.amount.toFixed(2)} for ${address}. Lease is now active.`,
        }).catch(() => {})
      }

      notifyBoth({
        payerId: payment.payer_id,
        recipientId: payment.recipient_id,
        payerMsg: `Security deposit of GHS ${payment.amount.toFixed(2)} received. Your lease for ${address} is now active!`,
        recipientMsg: `Security deposit of GHS ${payment.amount.toFixed(2)} received for ${address}. Lease is now active.`,
        type: 'payment',
      }).catch(() => {})

      console.log(`[Webhook] Security deposit ${payment.id} success, lease activated`)
      return res.json({ received: true, result: 'security_deposit_success' })
    }

    if (payment.type === 'tenant_collection') {
      const netAmount = payment.net_amount || payment.amount
      const escavioFee = payment.escavio_fee || 0
      const newBalance = (payment.leases?.escrow_balance || 0) + netAmount

      await supabase
        .from('leases')
        .update({ escrow_balance: newBalance })
        .eq('id', payment.lease_id)

      if (escavioFee > 0) {
        await supabase
          .from('payments')
          .insert({
            lease_id: payment.lease_id,
            payer_id: payment.payer_id,
            recipient_id: null,
            amount: escavioFee,
            net_amount: escavioFee,
            escavio_fee: 0,
            type: 'fee',
            status: 'success',
            paid_at: new Date().toISOString(),
          })
      }

      if (payment.payer?.phone) {
        sendSMS({
          phone: payment.payer.phone,
          message: `Escavio: Your rent of GHS ${payment.amount.toFixed(2)} for ${address} has been received and secured in escrow. Fee: GHS ${escavioFee.toFixed(2)}. Ref: ${ref}`,
        }).catch(() => {})
      }

      if (payment.recipient?.phone) {
        sendSMS({
          phone: payment.recipient.phone,
          message: `Escavio: Rent of GHS ${netAmount.toFixed(2)} received for ${address} (after 1% platform fee). Held in escrow. Ref: ${ref}`,
        }).catch(() => {})
      }

      if (payment.payer?.phone) {
        sendPaymentReceipt({
          phone: payment.payer.phone,
          name: payment.payer.full_name,
          amount: payment.amount.toFixed(2),
          property: address,
          reference: ref,
        }).catch(() => {})
      }

      notifyBoth({
        payerId: payment.payer_id,
        recipientId: payment.recipient_id,
        payerMsg: `Rent of GHS ${payment.amount.toFixed(2)} for ${address} received. Fee: GHS ${escavioFee.toFixed(2)}. Ref: ${ref}`,
        recipientMsg: `Rent of GHS ${netAmount.toFixed(2)} received for ${address} (net after 1% fee). Ref: ${ref}`,
        type: 'payment',
      }).catch(() => {})

      const updatedLease = { ...payment.leases, escrow_balance: newBalance }
      processDisbursement(updatedLease).catch(err => {
        console.error('[Webhook] Disbursement processing error:', err.message)
      })
    }

    console.log(`[Webhook] Payment ${payment.id} marked success, ref: ${ref}`)
    res.json({ received: true, result: 'success' })
  } catch (err) {
    console.error('[Webhook] Error:', err.message)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

router.post('/moolre-wallet', async (req, res) => {
  try {
    const { reference, externalref, status, amount } = req.body
    const ref = reference || externalref

    if (!ref) return res.json({ received: true, ignored: 'no reference' })

    const moolreStatus = String(status).toLowerCase()
    const isSuccess = ['success', 'successful', 'completed'].includes(moolreStatus)
    const isFailed = ['failed', 'declined', 'rejected', 'error'].includes(moolreStatus)

    if (!isSuccess && !isFailed) {
      return res.json({ received: true, status: 'intermediate' })
    }

    const { data: txn } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('reference', ref)
      .eq('type', 'deposit')
      .single()

    if (!txn) return res.status(404).json({ error: 'Transaction not found' })
    if (txn.status === 'success') return res.json({ received: true, already_processed: true })

    if (isFailed) {
      await supabase
        .from('wallet_transactions')
        .update({ status: 'failed' })
        .eq('id', txn.id)
      return res.json({ received: true, result: 'failed' })
    }

    const wallet = await getOrCreateWallet(txn.user_id)
    const newBalance = Number(wallet.balance) + Number(txn.amount)

    await supabase
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id)

    await supabase
      .from('wallet_transactions')
      .update({ status: 'success', balance_after: newBalance })
      .eq('id', txn.id)

    sendSMS({
      phone: (await supabase.from('users').select('phone').eq('id', txn.user_id).single()).data?.phone,
      message: `Escavio: GHS ${Number(txn.amount).toFixed(2)} deposited to your wallet. Balance: GHS ${newBalance.toFixed(2)}. Ref: ${ref}`,
    }).catch(() => {})

    console.log(`[Webhook] Wallet deposit ${txn.id} success, new balance: ${newBalance}`)
    res.json({ received: true, result: 'wallet_deposit_success' })
  } catch (err) {
    console.error('[Webhook] Wallet error:', err.message)
    res.status(500).json({ error: 'Wallet webhook failed' })
  }
})

export default router
