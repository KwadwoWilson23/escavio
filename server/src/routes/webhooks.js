import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { sendSMS, parseTxStatus } from '../services/moolre.js'
import { processDisbursement } from '../services/disbursement.js'
import { sendPaymentReceipt } from '../services/whatsapp.js'
import { notifyBoth } from '../services/notify.js'
import { getOrCreateWallet } from './wallet.js'

const router = Router()

router.post('/moolre', async (req, res) => {
  try {
    const payload = req.body
    const d = payload.data || {}

    const ref = d.externalref || payload.externalref || payload.reference
    const txstatus = d.txstatus ?? payload.txstatus ?? payload.status
    const amount = d.amount || payload.amount
    const transactionid = d.transactionid || payload.transactionid
    const payer = d.payer || payload.payer

    console.log(`[Webhook] Received: ref=${ref}, txstatus=${txstatus}, amount=${amount}, txn=${transactionid}, payer=${payer}`)
    console.log(`[Webhook] Raw payload:`, JSON.stringify(payload).slice(0, 500))

    if (!ref) {
      return res.json({ received: true, ignored: 'no reference' })
    }

    const status = parseTxStatus(txstatus)
    const isSuccess = status === 'success'
    const isFailed = status === 'failed'

    if (!isSuccess && !isFailed) {
      console.log(`[Webhook] Non-final status: txstatus=${txstatus} (${status}), skipping`)
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
    const payload = req.body
    const d = payload.data || {}

    const ref = d.externalref || payload.externalref || payload.reference
    const txstatus = d.txstatus ?? payload.txstatus ?? payload.status
    const amount = d.amount || payload.amount

    console.log(`[Webhook] Wallet callback: ref=${ref}, txstatus=${txstatus}, amount=${amount}`)

    if (!ref) return res.json({ received: true, ignored: 'no reference' })

    const status = parseTxStatus(txstatus)
    const isSuccess = status === 'success'
    const isFailed = status === 'failed'

    if (!isSuccess && !isFailed) {
      return res.json({ received: true, status: 'intermediate' })
    }

    const { data: txn } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('reference', ref)
      .single()

    if (!txn) return res.status(404).json({ error: 'Transaction not found' })
    if (txn.status === 'success') return res.json({ received: true, already_processed: true })

    const wallet = await getOrCreateWallet(txn.user_id)
    const { data: txnUser } = await supabase.from('users').select('phone').eq('id', txn.user_id).single()
    const userPhone = txnUser?.phone

    if (txn.type === 'withdrawal') {
      if (isFailed) {
        const restoredBalance = Number(wallet.balance) + Number(txn.amount)
        await supabase
          .from('wallets')
          .update({ balance: restoredBalance, updated_at: new Date().toISOString() })
          .eq('id', wallet.id)

        await supabase
          .from('wallet_transactions')
          .update({ status: 'failed', balance_after: restoredBalance })
          .eq('id', txn.id)

        if (userPhone) {
          sendSMS({
            phone: userPhone,
            message: `Escavio: Your withdrawal of GHS ${Number(txn.amount).toFixed(2)} failed. Your balance has been restored. Ref: ${ref}`,
          }).catch(() => {})
        }

        console.log(`[Webhook] Wallet withdrawal ${txn.id} failed, balance restored`)
        return res.json({ received: true, result: 'withdrawal_failed_restored' })
      }

      if (isSuccess) {
        await supabase
          .from('wallet_transactions')
          .update({ status: 'success' })
          .eq('id', txn.id)

        if (userPhone) {
          sendSMS({
            phone: userPhone,
            message: `Escavio: GHS ${Number(txn.amount).toFixed(2)} sent to your MoMo. Balance: GHS ${Number(wallet.balance).toFixed(2)}. Ref: ${ref}`,
          }).catch(() => {})
        }

        console.log(`[Webhook] Wallet withdrawal ${txn.id} success`)
        return res.json({ received: true, result: 'wallet_withdrawal_success' })
      }
    }

    if (isFailed) {
      await supabase
        .from('wallet_transactions')
        .update({ status: 'failed' })
        .eq('id', txn.id)
      return res.json({ received: true, result: 'failed' })
    }

    const newBalance = Number(wallet.balance) + Number(txn.amount)

    await supabase
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id)

    await supabase
      .from('wallet_transactions')
      .update({ status: 'success', balance_after: newBalance })
      .eq('id', txn.id)

    if (userPhone) {
      sendSMS({
        phone: userPhone,
        message: `Escavio: GHS ${Number(txn.amount).toFixed(2)} deposited to your wallet. Balance: GHS ${newBalance.toFixed(2)}. Ref: ${ref}`,
      }).catch(() => {})
    }

    console.log(`[Webhook] Wallet deposit ${txn.id} success, new balance: ${newBalance}`)
    res.json({ received: true, result: 'wallet_deposit_success' })
  } catch (err) {
    console.error('[Webhook] Wallet error:', err.message)
    res.status(500).json({ error: 'Wallet webhook failed' })
  }
})

export default router
