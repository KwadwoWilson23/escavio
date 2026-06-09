import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { sendSMS } from '../services/moolre.js'
import { processDisbursement } from '../services/disbursement.js'
import { sendPaymentReceipt } from '../services/whatsapp.js'
import { notifyBoth } from '../services/notify.js'

const router = Router()

router.post('/moolre', async (req, res) => {
  try {
    const { reference, status, amount } = req.body

    if (status !== 'success') {
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('moolre_reference', reference)

      return res.json({ received: true })
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('*, leases(*, properties(address)), payer:users!payments_payer_id_fkey(phone, full_name), recipient:users!payments_recipient_id_fkey(phone, full_name)')
      .eq('moolre_reference', reference)
      .single()

    if (!payment) return res.status(404).json({ error: 'Payment not found' })

    await supabase
      .from('payments')
      .update({ status: 'success', paid_at: new Date().toISOString() })
      .eq('id', payment.id)

    if (payment.type === 'tenant_collection') {
      const newBalance = (payment.leases?.escrow_balance || 0) + payment.amount

      await supabase
        .from('leases')
        .update({ escrow_balance: newBalance })
        .eq('id', payment.lease_id)

      const address = payment.leases?.properties?.address || 'your property'

      if (payment.payer?.phone) {
        await sendSMS({
          phone: payment.payer.phone,
          message: `Escavio: Your rent of GHS ${payment.amount.toFixed(2)} for ${address} has been received. Ref: ${reference}`,
        }).catch(() => {})
      }

      if (payment.recipient?.phone) {
        await sendSMS({
          phone: payment.recipient.phone,
          message: `Escavio: Rent payment of GHS ${payment.amount.toFixed(2)} received for ${address}. Ref: ${reference}`,
        }).catch(() => {})
      }

      if (payment.payer?.phone) {
        sendPaymentReceipt({
          phone: payment.payer.phone,
          name: payment.payer.full_name,
          amount: payment.amount.toFixed(2),
          property: address,
          reference,
        }).catch(() => {})
      }

      await notifyBoth({
        payerId: payment.payer_id,
        recipientId: payment.recipient_id,
        payerMsg: `Your rent of GHS ${payment.amount.toFixed(2)} for ${address} has been received. Ref: ${reference}`,
        recipientMsg: `Rent payment of GHS ${payment.amount.toFixed(2)} received for ${address}. Ref: ${reference}`,
        type: 'payment',
      }).catch(() => {})

      const updatedLease = { ...payment.leases, escrow_balance: newBalance }
      await processDisbursement(updatedLease)
    }

    res.json({ received: true })
  } catch (err) {
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

export default router
