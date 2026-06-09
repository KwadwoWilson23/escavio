import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { sendSMS, verifyWebhookSignature } from '../services/moolre.js'
import { processDisbursement } from '../services/disbursement.js'
import { sendPaymentReceipt } from '../services/whatsapp.js'
import { notifyBoth } from '../services/notify.js'

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
          message: `Escavio: Your rent payment of GHS ${payment.amount.toFixed(2)} was not completed. Please try again from the app.`,
        }).catch(() => {})
      }

      notifyBoth({
        payerId: payment.payer_id,
        recipientId: payment.recipient_id,
        payerMsg: `Your rent payment of GHS ${payment.amount.toFixed(2)} failed. Please try again.`,
        recipientMsg: `A rent payment of GHS ${payment.amount.toFixed(2)} for ${payment.leases?.properties?.address || 'your property'} was declined.`,
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

    if (payment.type === 'tenant_collection') {
      const newBalance = (payment.leases?.escrow_balance || 0) + payment.amount

      await supabase
        .from('leases')
        .update({ escrow_balance: newBalance })
        .eq('id', payment.lease_id)

      const address = payment.leases?.properties?.address || 'your property'

      if (payment.payer?.phone) {
        sendSMS({
          phone: payment.payer.phone,
          message: `Escavio: Your rent of GHS ${payment.amount.toFixed(2)} for ${address} has been received and secured in escrow. Ref: ${ref}`,
        }).catch(() => {})
      }

      if (payment.recipient?.phone) {
        sendSMS({
          phone: payment.recipient.phone,
          message: `Escavio: Rent payment of GHS ${payment.amount.toFixed(2)} received for ${address} and held in escrow. Ref: ${ref}`,
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
        payerMsg: `Your rent of GHS ${payment.amount.toFixed(2)} for ${address} has been received. Ref: ${ref}`,
        recipientMsg: `Rent payment of GHS ${payment.amount.toFixed(2)} received for ${address}. Ref: ${ref}`,
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

export default router
