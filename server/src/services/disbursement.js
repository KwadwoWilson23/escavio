import { supabase } from '../config/supabase.js'
import { disbursePayment, validateName, sendSMS, parseTxStatus } from './moolre.js'
import { notifyBoth } from './notify.js'

const ESCAVIO_FEE_RATE = 0.01

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
  const netMonthly = Math.round(monthly_amount * (1 - ESCAVIO_FEE_RATE) * 100) / 100

  switch (payout_mode) {
    case 'monthly':
      if (escrow_balance >= netMonthly) {
        shouldDisburse = true
        disburseAmount = netMonthly
      }
      break

    case 'lump_sum':
      if (escrow_balance >= netMonthly * advance_months) {
        shouldDisburse = true
        disburseAmount = netMonthly * advance_months
      }
      break

    case 'hybrid': {
      const halfTarget = (netMonthly * advance_months) / 2
      if (!lease.advance_disbursed && escrow_balance >= halfTarget) {
        shouldDisburse = true
        disburseAmount = halfTarget
      } else if (lease.advance_disbursed && escrow_balance >= netMonthly) {
        shouldDisburse = true
        disburseAmount = netMonthly
      }
      break
    }
  }

  if (!shouldDisburse) return null

  const reference = `DSB-${lease.id.slice(0, 8)}-${Date.now()}`

  console.log(`[Disbursement] Processing GHS ${disburseAmount} to ${landlord.phone} for lease ${lease.id}, mode: ${payout_mode}`)

  const nameCheck = await validateName({ phone: landlord.phone })
  if (nameCheck?.status === 1) {
    console.log(`[Disbursement] Recipient confirmed: ${nameCheck.data}`)
  } else {
    console.warn(`[Disbursement] Name validation failed for ${landlord.phone}, proceeding anyway`)
  }

  try {
    const moolreResult = await disbursePayment({
      amount: disburseAmount,
      phone: landlord.phone,
      reference,
    })

    const txstatus = moolreResult?.data?.txstatus
    const transferStatus = parseTxStatus(txstatus)

    if (transferStatus === 'failed') {
      console.error(`[Disbursement] Transfer rejected by Moolre: txstatus=${txstatus}`)
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

    const paymentStatus = transferStatus === 'success' ? 'success' : 'processing'

    await supabase
      .from('payments')
      .insert({
        lease_id: lease.id,
        payer_id: null,
        recipient_id: landlord_id,
        amount: disburseAmount,
        net_amount: disburseAmount,
        escavio_fee: 0,
        moolre_reference: reference,
        type: 'landlord_disbursement',
        status: paymentStatus,
        ...(paymentStatus === 'success' ? { paid_at: new Date().toISOString() } : {}),
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

    const address = lease.properties?.address || 'your property'
    if (paymentStatus === 'success') {
      sendSMS({
        phone: landlord.phone,
        message: `Escavio: GHS ${disburseAmount.toFixed(2)} has been sent to your MoMo for ${address}. Ref: ${reference}`,
      }).catch(() => {})
    }

    console.log(`[Disbursement] ${paymentStatus}: GHS ${disburseAmount} to ${landlord.full_name}, ref: ${reference}`)
    return { reference, amount: disburseAmount, status: paymentStatus, moolre: moolreResult }
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

export async function useSecurityDeposit(lease) {
  if (!lease.security_deposit || lease.security_deposit <= 0 || lease.security_deposit_used) {
    console.log(`[Disbursement] No security deposit available for lease ${lease.id}`)
    return null
  }

  const depositAmount = lease.security_deposit
  const address = lease.properties?.address || 'the property'

  console.log(`[Disbursement] Using security deposit of GHS ${depositAmount} for lease ${lease.id}`)

  const netAmount = Math.round(depositAmount * (1 - ESCAVIO_FEE_RATE) * 100) / 100
  const escavioFee = Math.round(depositAmount * ESCAVIO_FEE_RATE * 100) / 100

  const newBalance = (lease.escrow_balance || 0) + netAmount

  await supabase
    .from('leases')
    .update({
      security_deposit_used: true,
      escrow_balance: newBalance,
    })
    .eq('id', lease.id)

  await supabase
    .from('payments')
    .insert({
      lease_id: lease.id,
      payer_id: lease.tenant_id,
      recipient_id: lease.landlord_id,
      amount: depositAmount,
      escavio_fee: escavioFee,
      net_amount: netAmount,
      type: 'security_deposit_used',
      status: 'success',
      paid_at: new Date().toISOString(),
    })

  if (escavioFee > 0) {
    await supabase
      .from('payments')
      .insert({
        lease_id: lease.id,
        payer_id: lease.tenant_id,
        recipient_id: null,
        amount: escavioFee,
        net_amount: escavioFee,
        escavio_fee: 0,
        type: 'fee',
        status: 'success',
        paid_at: new Date().toISOString(),
      })
  }

  notifyBoth({
    payerId: lease.tenant_id,
    recipientId: lease.landlord_id,
    payerMsg: `Your security deposit of GHS ${depositAmount.toFixed(2)} has been used to cover overdue rent for ${address}. Your deposit is now depleted.`,
    recipientMsg: `Security deposit of GHS ${netAmount.toFixed(2)} (net after 1% fee) applied to overdue rent for ${address}.`,
    type: 'payment',
  }).catch(() => {})

  const updatedLease = { ...lease, escrow_balance: newBalance }
  processDisbursement(updatedLease).catch(err => {
    console.error('[Disbursement] Post-deposit disbursement error:', err.message)
  })

  return { amount: depositAmount, netAmount }
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
