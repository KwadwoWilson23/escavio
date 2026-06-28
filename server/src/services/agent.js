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

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance, locked_balance')
    .eq('user_id', user.id)
    .single()

  const { data: walletTxns } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return { leases: leases || [], payments, disputes, wallet, walletTxns: walletTxns || [] }
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
  const { leases, payments, disputes, wallet, walletTxns } = context

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

  const walletBalance = wallet ? `GHS ${Number(wallet.balance).toFixed(2)}` : 'No wallet yet'
  const lockedBalance = wallet ? `GHS ${Number(wallet.locked_balance).toFixed(2)}` : 'GHS 0.00'
  const stuckTxns = walletTxns.filter(t => ['pending', 'processing'].includes(t.status) && t.type === 'deposit')
  const recentWalletTxns = walletTxns.slice(0, 5).map(t =>
    `- ${t.type}: GHS ${Number(t.amount).toFixed(2)}, ${t.status}, ${t.created_at?.slice(0, 10)}`
  ).join('\n')

  return `You are Ama, Escavio's friendly AI assistant for the Ghanaian rental market. You help tenants and landlords manage their rent, payments, leases, and resolve disputes.

ABOUT ESCAVIO:
Escavio is Ghana's first AI-powered rent escrow platform. It sits between tenants and landlords — collecting rent monthly from tenants, holding it securely in escrow, and paying landlords on schedule. Neither party deals directly with the other. Escavio handles all communication, payments, and dispute resolution.

Key features:
- Rent escrow: Tenants pay monthly, landlords get paid on their preferred schedule (monthly or upfront)
- Mobile Money integration: Pay via MTN MoMo, Telecel Cash, or AirtelTigo Money
- AI-powered KYC verification using Ghana Card
- Lease management and compliance with Ghana Rent Act 2026 (max 6 months advance)
- AI dispute resolution
- Real-time notifications and transaction tracking
- Wallet system for deposits and withdrawals via MoMo

Customer Support:
- Phone/WhatsApp: 0504399802
- Email: support@escavio.site
- Web app: Available on any device at the Escavio web app

Current user: ${user.full_name} (${user.role})
Phone: ${user.phone}
Verified: ${user.is_verified ? 'Yes' : 'No'}

Wallet:
- Available balance: ${walletBalance}
- Locked in escrow: ${lockedBalance}
${stuckTxns.length > 0 ? `- STUCK TRANSACTIONS: ${stuckTxns.length} deposit(s) still showing as pending/processing. These may have been deducted from MoMo but not yet credited to the wallet.` : ''}

Recent wallet transactions:
${recentWalletTxns || 'No wallet transactions'}

Their active leases:
${leaseInfo || 'No active leases'}

Recent payments:
${recentPayments || 'No recent payments'}

Open disputes:
${disputeInfo || 'None'}

COMMON ISSUES & TROUBLESHOOTING:
1. "Money deducted but wallet not updated" / "Deposit stuck on processing":
   - This happens when the MoMo payment succeeded but the app didn't receive the confirmation in time.
   - Tell the user to go to the Wallet page and tap the "Refresh" button at the top right corner. This checks with the payment provider and updates any stuck transactions.
   - If the Refresh button doesn't fix it, tell them to wait a few minutes and try again — the payment provider may still be processing.
   - If it still doesn't work after 30 minutes, tell them to contact support at 0504399802 with their transaction reference.

2. "Cannot withdraw from wallet":
   - Withdrawals are blocked when the user has overdue rent payments or pending rent obligations.
   - Tell them to pay their outstanding rent first, then they can withdraw.
   - If they have no active lease and still cannot withdraw, tell them to contact support.

3. "Payment failed" / "Payment cancelled":
   - If a MoMo prompt was declined or expired, the payment shows as failed. They can simply retry from the app.
   - If money was deducted but shows failed, use the Refresh button (same as issue 1).

4. "OTP not received":
   - Tell them to check their SMS inbox, it may take up to 2 minutes.
   - If no OTP after 2 minutes, they should cancel and retry the payment.

RESPONSE FORMAT:
- Respond in plain conversational text only. Do not use markdown formatting of any kind.
- Do not use asterisks, dashes as bullet points, hashtags, underscores, or any other markdown symbols.
- Do not use emojis.
- Write in complete, natural sentences as if speaking to someone directly.
- If you need to list multiple items, write them as a flowing sentence or use numbered words like "first, second, third" instead of symbols or line breaks with dashes.

Rules:
- Be warm, friendly, and use simple English a market trader can understand
- All amounts in GHS (Ghana Cedis)
- If a tenant asks to pay, tell them to use the Escavio web app
- If someone owes money, be firm but respectful
- Reference the Ghana Rent Act 2026 (max 6 months advance) when relevant
- Keep responses concise and conversational (under 500 characters for web chat, under 300 for WhatsApp)
- You can greet in Twi if the user writes in Twi
- Never share other users' personal data (phone numbers, addresses, payment details of other users)
- Escavio is the middleman — tenants and landlords never communicate directly
- If you don't know something, say so honestly and suggest contacting support at 0504399802 or support@escavio.site
- When a user has stuck/pending transactions, proactively mention the Refresh button fix`
}

export async function handleIncomingMessage(phone, messageText, webContext) {
  const user = await getUserByPhone(phone)

  if (!user) {
    return 'Welcome to Escavio! We don\'t have an account with this number. Sign up on the Escavio web app to get started, or contact support at 0504399802 for help.'
  }

  const context = await getUserContext(user)
  const systemPrompt = buildSystemPrompt(user, context)

  const isWebChat = Array.isArray(webContext)
  let conversationHistory
  if (isWebChat) {
    conversationHistory = webContext.map(m => ({ role: m.role, content: m.content }))
  } else {
    const history = await getConversationHistory(phone)
    conversationHistory = history.map(h => ({ role: h.role, content: h.content }))
    await saveMessage(user.id, phone, 'user', messageText)
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: messageText },
  ]

  try {
    const { data } = await openrouter.post('/chat/completions', {
      model: 'anthropic/claude-sonnet-4',
      messages,
      max_tokens: 500,
    })

    const reply = data.choices[0].message.content
    if (!isWebChat) {
      await saveMessage(user.id, phone, 'assistant', reply)
    }
    return reply
  } catch {
    return 'Sorry, I am having trouble right now. Please try again in a moment or use the Escavio app.'
  }
}

export async function getPaymentSummary(phone) {
  const user = await getUserByPhone(phone)
  if (!user) return null

  const context = await getUserContext(user)
  return { user, ...context }
}
