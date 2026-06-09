import axios from 'axios'
import { supabase } from '../config/supabase.js'
import env from '../config/env.js'

const openrouter = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Authorization': `Bearer ${env.openrouterKey}`,
    'Content-Type': 'application/json',
  },
})

async function getUserByPhone(phone) {
  const cleaned = phone.replace(/\D/g, '')
  const variants = [cleaned, `0${cleaned.slice(-9)}`, `+233${cleaned.slice(-9)}`, `233${cleaned.slice(-9)}`]

  for (const variant of variants) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .or(`phone.eq.${variant}`)
      .single()
    if (data) return data
  }
  return null
}

async function getUserContext(user) {
  const col = user.role === 'landlord' ? 'landlord_id' : 'tenant_id'

  const { data: leases } = await supabase
    .from('leases')
    .select('*, properties(address, region), landlord:users!leases_landlord_id_fkey(full_name, phone), tenant:users!leases_tenant_id_fkey(full_name, phone)')
    .eq(col, user.id)
    .in('status', ['active', 'pending', 'at_risk'])

  const leaseIds = (leases || []).map(l => l.id)

  let payments = []
  if (leaseIds.length > 0) {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .in('lease_id', leaseIds)
      .order('created_at', { ascending: false })
      .limit(20)
    payments = data || []
  }

  let disputes = []
  const { data: d } = await supabase
    .from('disputes')
    .select('*, leases(properties(address))')
    .eq('raised_by', user.id)
    .order('created_at', { ascending: false })
    .limit(5)
  disputes = d || []

  return { leases: leases || [], payments, disputes }
}

async function getConversationHistory(phone, limit = 10) {
  const { data } = await supabase
    .from('conversations')
    .select('role, content, created_at')
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data || []).reverse()
}

async function saveMessage(userId, phone, role, content) {
  await supabase.from('conversations').insert({
    user_id: userId,
    phone,
    role,
    content,
  })
}

function buildSystemPrompt(user, context) {
  const { leases, payments, disputes } = context

  const leaseInfo = leases.map(l => {
    const paid = payments.filter(p => p.lease_id === l.id && p.type === 'tenant_collection' && p.status === 'success')
    const overdue = payments.filter(p => p.lease_id === l.id && p.status === 'overdue')
    return `- ${l.properties?.address || 'Property'} (${l.properties?.region || 'N/A'}): GHS ${l.monthly_amount}/mo, ${l.status}, escrow GHS ${l.escrow_balance}, ${paid.length} paid, ${overdue.length} overdue, payout: ${l.payout_mode}, period: ${l.start_date} to ${l.end_date}${l.tenant ? `, tenant: ${l.tenant.full_name}` : ''}${l.landlord ? `, landlord: ${l.landlord.full_name}` : ''}`
  }).join('\n')

  const disputeInfo = disputes.map(d =>
    `- ${d.leases?.properties?.address || 'Property'}: ${d.status} - ${d.description?.slice(0, 80)}`
  ).join('\n')

  const recentPayments = payments.slice(0, 5).map(p =>
    `- ${p.type === 'tenant_collection' ? 'Payment' : 'Disbursement'}: GHS ${p.amount}, ${p.status}, ${p.due_date || p.created_at}`
  ).join('\n')

  return `You are Ama, Escavio's friendly WhatsApp AI assistant for the Ghanaian rental market. You help tenants and landlords manage their rent, payments, and leases.

Current user: ${user.full_name} (${user.role})
Phone: ${user.phone}
Verified: ${user.is_verified ? 'Yes' : 'No'}

Their active leases:
${leaseInfo || 'No active leases'}

Recent payments:
${recentPayments || 'No recent payments'}

Open disputes:
${disputeInfo || 'None'}

Rules:
- Be warm, friendly, and use simple English a market trader can understand
- All amounts in GHS (Ghana Cedis)
- If a tenant asks to pay, tell them to use the Escavio app or dial *714#
- If someone owes money, be firm but respectful
- Reference the Ghana Rent Act 2026 (max 6 months advance) when relevant
- Keep responses under 300 characters for WhatsApp readability
- You can greet in Twi if the user writes in Twi
- Never share other users' personal data
- If you don't know something, say so honestly`
}

export async function handleIncomingMessage(phone, messageText) {
  const user = await getUserByPhone(phone)

  if (!user) {
    return 'Welcome to Escavio! We don\'t have an account with this number. Download the app or dial *714# to register. Visit escavio.com to learn more.'
  }

  const context = await getUserContext(user)
  const history = await getConversationHistory(phone)
  const systemPrompt = buildSystemPrompt(user, context)

  await saveMessage(user.id, phone, 'user', messageText)

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: messageText },
  ]

  try {
    const { data } = await openrouter.post('/chat/completions', {
      model: 'anthropic/claude-sonnet-4-20250514',
      messages,
      max_tokens: 300,
    })

    const reply = data.choices[0].message.content
    await saveMessage(user.id, phone, 'assistant', reply)
    return reply
  } catch {
    return 'Sorry, I\'m having trouble right now. Please try again in a moment or use the Escavio app.'
  }
}

export async function getPaymentSummary(phone) {
  const user = await getUserByPhone(phone)
  if (!user) return null

  const context = await getUserContext(user)
  return { user, ...context }
}
