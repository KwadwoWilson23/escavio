import { supabase } from '../config/supabase.js'
import { sendPaymentReminder, sendOverdueNotice, sendLandlordAlert } from '../services/whatsapp.js'
import { sendSMS } from '../services/moolre.js'
import { generatePaymentReminder } from '../services/ai.js'

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
      .order('due_date', { ascending: false })

    const overduePayments = (payments || []).filter(p => p.status === 'overdue')
    const pendingPayments = (payments || []).filter(p => p.status === 'pending')

    for (const payment of overduePayments) {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24)
      )

      if ([1, 3, 7, 14].includes(daysOverdue)) {
        if (lease.tenant?.phone) {
          try {
            await sendOverdueNotice({
              phone: lease.tenant.phone,
              name: lease.tenant.full_name,
              amount: payment.amount,
              property: lease.properties?.address || 'your property',
              daysOverdue,
            })
          } catch {
            try {
              const aiMessage = await generatePaymentReminder(
                lease.tenant,
                payment.amount,
                -daysOverdue,
                payments || []
              )
              await sendSMS({ phone: lease.tenant.phone, message: aiMessage })
            } catch {}
          }
        }

        if (daysOverdue >= 3 && lease.landlord?.phone) {
          try {
            await sendLandlordAlert({
              phone: lease.landlord.phone,
              name: lease.landlord.full_name,
              tenantName: lease.tenant?.full_name || 'Tenant',
              amount: payment.amount,
              property: lease.properties?.address || 'property',
              daysOverdue,
            })
          } catch {}
        }
      }
    }

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
            property: lease.properties?.address || 'your property',
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
