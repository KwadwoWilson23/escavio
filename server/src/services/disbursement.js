import { supabase } from '../config/supabase.js'
import { disbursePayment, sendSMS } from './moolre.js'

export async function processDisbursement(lease) {
  const { payout_mode, escrow_balance, monthly_amount, advance_months, landlord_id } = lease

  const { data: landlord } = await supabase
    .from('users')
    .select('phone, full_name')
    .eq('id', landlord_id)
    .single()

  if (!landlord?.phone) {
    console.error('[Disbursement] No landlord phone for lease:', lease.id)
    return null
  }

  let shouldDisburse = false
  let disburseAmount = 0

  switch (payout_mode) {
    case 'monthly':
      if (escrow_balance >= monthly_amount) {
        shouldDisburse = true
        disburseAmount = monthly_amount
      }
      break

    case 'lump_sum':
      if (escrow_balance >= monthly_amount * advance_months) {
        shouldDisburse = true
        disburseAmount = monthly_amount * advance_months
      }
      break

    case 'hybrid': {
      const halfTarget = (monthly_amount * advance_months) / 2
      if (!lease.advance_disbursed && escrow_balance >= halfTarget) {
        shouldDisburse = true
        disburseAmount = halfTarget
      } else if (lease.advance_disbursed && escrow_balance >= monthly_amount) {
        shouldDisburse = true
        disburseAmount = monthly_amount
      }
      break
    }
  }

  if (!shouldDisburse) return null

  const reference = `DSB-${lease.id.slice(0, 8)}-${Date.now()}`

  console.log(`[Disbursement] Processing GHS ${disburseAmount} to ${landlord.phone} for lease ${lease.id}, mode: ${payout_mode}`)

  try {
    const moolreResult = await disbursePayment({
      amount: disburseAmount,
      phone: landlord.phone,
      reference,
    })

    await supabase
      .from('payments')
      .insert({
        lease_id: lease.id,
        payer_id: null,
        recipient_id: landlord_id,
        amount: disburseAmount,
        moolre_reference: reference,
        type: 'landlord_disbursement',
        status: 'success',
        paid_at: new Date().toISOString(),
      })

    const newBalance = escrow_balance - disburseAmount
    const update = { escrow_balance: newBalance }
    if (payout_mode === 'hybrid' && !lease.advance_disbursed) {
      update.advance_disbursed = true
    }
    if (payout_mode === 'lump_sum') {
      update.advance_disbursed = true
    }

    await supabase
      .from('leases')
      .update(update)
      .eq('id', lease.id)

    sendSMS({
      phone: landlord.phone,
      message: `Escavio: GHS ${disburseAmount.toFixed(2)} has been sent to your wallet for ${lease.properties?.address || 'your property'}. Ref: ${reference}`,
    }).catch(err => {
      console.error('[Disbursement] SMS notification failed:', err.message)
    })

    console.log(`[Disbursement] Success: GHS ${disburseAmount} to ${landlord.full_name}, ref: ${reference}`)
    return { reference, amount: disburseAmount, moolre: moolreResult }
  } catch (err) {
    console.error('[Disbursement] Failed:', err.response?.status, err.response?.data || err.message)

    await supabase
      .from('payments')
      .insert({
        lease_id: lease.id,
        payer_id: null,
        recipient_id: landlord_id,
        amount: disburseAmount,
        moolre_reference: reference,
        type: 'landlord_disbursement',
        status: 'failed',
      })

    return null
  }
}

export async function checkOverduePayments() {
  const today = new Date().toISOString().split('T')[0]

  const { data: overdue } = await supabase
    .from('payments')
    .select('*, leases(*)')
    .eq('status', 'pending')
    .lt('due_date', today)

  if (!overdue) return

  for (const payment of overdue) {
    const daysOverdue = Math.floor(
      (Date.now() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24)
    )

    await supabase
      .from('payments')
      .update({ status: 'overdue' })
      .eq('id', payment.id)

    if (daysOverdue >= 7 && payment.leases?.status === 'active') {
      await supabase
        .from('leases')
        .update({ status: 'at_risk' })
        .eq('id', payment.lease_id)
    }

    if (daysOverdue >= 14) {
      const { data: existing } = await supabase
        .from('disputes')
        .select('id')
        .eq('lease_id', payment.lease_id)
        .eq('status', 'open')
        .single()

      if (!existing) {
        await supabase
          .from('disputes')
          .insert({
            lease_id: payment.lease_id,
            raised_by: payment.recipient_id,
            description: `Auto-generated: Payment overdue by ${daysOverdue} days. Amount: GHS ${payment.amount}`,
            status: 'open',
          })
      }
    }
  }
}
