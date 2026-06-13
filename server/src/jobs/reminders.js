import { supabase } from '../config/supabase.js'
import { sendPaymentReminder, sendOverdueNotice, sendLandlordAlert } from '../services/whatsapp.js'
import { sendSMS } from '../services/moolre.js'
import { generatePaymentReminder } from '../services/ai.js'
import { useSecurityDeposit } from '../services/disbursement.js'
import { notifyBoth } from '../services/notify.js'

export async function runDailyReminders() {
  console.log('[Reminders] Running daily check...')

  const { data: activeLeases } = await supabase
    .from('leases')
    .select('*, properties(address), tenant:users!leases_tenant_id_fkey(full_name, phone), landlord:users!leases_landlord_id_fkey(full_name, phone)')
    .in('status', ['active', 'at_risk'])

  if (!activeLeases) return

  for (const lease of activeLeases) {
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('lease_id', lease.id)
      .in('type', ['tenant_collection'])
      .order('due_date', { ascending: false })

    const overduePayments = (payments || []).filter(p => p.status === 'overdue')
    const address = lease.properties?.address || 'your property'

    for (const payment of overduePayments) {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24)
      )

      // Day 1: Friendly SMS reminder to tenant
      if (daysOverdue === 1 && lease.tenant?.phone) {
        try {
          await sendOverdueNotice({
            phone: lease.tenant.phone,
            name: lease.tenant.full_name,
            amount: payment.amount,
            property: address,
            daysOverdue: 1,
          })
        } catch {
          try {
            const aiMessage = await generatePaymentReminder(lease.tenant, payment.amount, -1, payments || [])
            await sendSMS({ phone: lease.tenant.phone, message: aiMessage })
          } catch {}
        }
      }

      // Day 3: Firmer notice + landlord notified
      if (daysOverdue === 3) {
        if (lease.tenant?.phone) {
          sendSMS({
            phone: lease.tenant.phone,
            message: `Escavio: Your rent of GHS ${payment.amount.toFixed(2)} for ${address} is 3 days overdue. Please pay immediately to avoid your security deposit being used. Your landlord has been notified.`,
          }).catch(() => {})
        }
        if (lease.landlord?.phone) {
          try {
            await sendLandlordAlert({
              phone: lease.landlord.phone,
              name: lease.landlord.full_name,
              tenantName: lease.tenant?.full_name || 'Tenant',
              amount: payment.amount,
              property: address,
              daysOverdue: 3,
            })
          } catch {}
        }

        notifyBoth({
          payerId: lease.tenant_id,
          recipientId: lease.landlord_id,
          payerMsg: `Rent of GHS ${payment.amount.toFixed(2)} for ${address} is 3 days overdue. Pay now to avoid security deposit usage.`,
          recipientMsg: `Tenant ${lease.tenant?.full_name || ''} is 3 days late on GHS ${payment.amount.toFixed(2)} for ${address}.`,
          type: 'payment',
        }).catch(() => {})
      }

      // Day 7: Use security deposit
      if (daysOverdue >= 7 && !lease.security_deposit_used && lease.security_deposit > 0) {
        console.log(`[Reminders] Day ${daysOverdue}: Using security deposit for lease ${lease.id}`)

        const result = await useSecurityDeposit(lease)

        if (result) {
          await supabase
            .from('payments')
            .update({ status: 'covered_by_deposit' })
            .eq('id', payment.id)

          if (lease.tenant?.phone) {
            sendSMS({
              phone: lease.tenant.phone,
              message: `Escavio: Your security deposit of GHS ${result.amount.toFixed(2)} has been used to cover your overdue rent for ${address}. Your deposit is now depleted. Further defaults may result in account suspension.`,
            }).catch(() => {})
          }
          if (lease.landlord?.phone) {
            sendSMS({
              phone: lease.landlord.phone,
              message: `Escavio: Tenant ${lease.tenant?.full_name || ''}'s security deposit has been applied to cover overdue rent for ${address}. GHS ${result.netAmount.toFixed(2)} added to escrow.`,
            }).catch(() => {})
          }
        }

        await supabase
          .from('leases')
          .update({ status: 'at_risk' })
          .eq('id', lease.id)
      }

      // Day 14: Auto-dispute + suspend tenant
      if (daysOverdue >= 14) {
        const { data: existing } = await supabase
          .from('disputes')
          .select('id')
          .eq('lease_id', lease.id)
          .eq('status', 'open')
          .single()

        if (!existing) {
          await supabase
            .from('disputes')
            .insert({
              lease_id: lease.id,
              raised_by: lease.landlord_id,
              description: `Auto-generated: Rent overdue by ${daysOverdue} days. Amount: GHS ${payment.amount}. Security deposit ${lease.security_deposit_used ? 'already used' : 'available'}.`,
              status: 'open',
            })
        }

        await supabase
          .from('leases')
          .update({ status: 'suspended' })
          .eq('id', lease.id)

        if (lease.tenant?.phone) {
          sendSMS({
            phone: lease.tenant.phone,
            message: `Escavio: Your lease for ${address} has been suspended due to ${daysOverdue} days of unpaid rent. An auto-dispute has been opened. Contact support to resolve.`,
          }).catch(() => {})
        }

        notifyBoth({
          payerId: lease.tenant_id,
          recipientId: lease.landlord_id,
          payerMsg: `Your lease for ${address} has been suspended. A dispute has been opened automatically.`,
          recipientMsg: `Lease for ${address} suspended. Auto-dispute opened for ${daysOverdue}-day default by ${lease.tenant?.full_name || 'tenant'}.`,
          type: 'dispute',
        }).catch(() => {})
      }

      // Day 30: Blacklist tenant
      if (daysOverdue >= 30) {
        await supabase
          .from('users')
          .update({ is_blacklisted: true })
          .eq('id', lease.tenant_id)

        await supabase
          .from('leases')
          .update({ status: 'defaulted' })
          .eq('id', lease.id)

        if (lease.tenant?.phone) {
          sendSMS({
            phone: lease.tenant.phone,
            message: `Escavio: Your account has been flagged due to 30+ days of unpaid rent for ${address}. You are now restricted from new leases. Contact support to appeal.`,
          }).catch(() => {})
        }

        notifyBoth({
          payerId: lease.tenant_id,
          recipientId: lease.landlord_id,
          payerMsg: `Your Escavio account has been restricted due to prolonged default. Contact support to resolve.`,
          recipientMsg: `Tenant ${lease.tenant?.full_name || ''} has been blacklisted for 30+ day default on ${address}. Lease terminated.`,
          type: 'dispute',
        }).catch(() => {})

        console.log(`[Reminders] Day 30: Blacklisted tenant ${lease.tenant_id} for lease ${lease.id}`)
      }
    }

    // Upcoming payment reminders (3 and 1 day before due)
    const nextDueDate = getNextDueDate(lease)
    if (nextDueDate) {
      const daysUntil = Math.floor(
        (nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      if ([3, 1].includes(daysUntil) && lease.tenant?.phone) {
        try {
          await sendPaymentReminder({
            phone: lease.tenant.phone,
            name: lease.tenant.full_name,
            amount: lease.monthly_amount,
            property: address,
            daysUntilDue: daysUntil,
          })
        } catch {
          try {
            const aiMessage = await generatePaymentReminder(
              lease.tenant,
              lease.monthly_amount,
              daysUntil,
              payments || []
            )
            await sendSMS({ phone: lease.tenant.phone, message: aiMessage })
          } catch {}
        }
      }
    }
  }

  console.log('[Reminders] Daily check complete.')
}

function getNextDueDate(lease) {
  const start = new Date(lease.start_date)
  const now = new Date()
  const day = start.getDate()

  const next = new Date(now.getFullYear(), now.getMonth(), day)
  if (next <= now) {
    next.setMonth(next.getMonth() + 1)
  }

  const end = new Date(lease.end_date)
  if (next > end) return null

  return next
}

export function startReminderSchedule() {
  runDailyReminders()
  setInterval(runDailyReminders, 24 * 60 * 60 * 1000)
  console.log('[Reminders] Scheduler started (runs every 24h)')
}
