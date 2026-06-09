import { Router } from 'express'
import { handleIncomingMessage } from '../services/agent.js'
import { sendSMS } from '../services/moolre.js'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import env from '../config/env.js'

const router = Router()

router.post('/incoming', async (req, res) => {
  try {
    const { from, message, phone, body, text, sender, content } = req.body
    const senderPhone = from || phone || sender || ''
    const messageText = message || body || text || content || ''

    if (!senderPhone || !messageText) {
      return res.json({ received: true })
    }

    console.log(`[Ama] Incoming from ${senderPhone}: ${messageText}`)

    const reply = await handleIncomingMessage(senderPhone, messageText)

    console.log(`[Ama] Reply to ${senderPhone}: ${reply}`)

    try {
      await sendSMS({ phone: senderPhone, message: `Ama (Escavio): ${reply}` })
    } catch {}

    await supabase.from('notifications').insert({
      user_id: null,
      message: `WhatsApp from ${senderPhone}: ${messageText}`,
      channel: 'sms',
    }).then(() => {}).catch(() => {})

    res.json({ received: true, reply })
  } catch (err) {
    console.error('[Ama] Error:', err.message)
    res.json({ received: true })
  }
})

router.post('/test', async (req, res) => {
  try {
    const { phone, message } = req.body

    if (!phone || !message) {
      return res.status(400).json({ error: 'phone and message required' })
    }

    const reply = await handleIncomingMessage(phone, message)
    res.json({ reply })
  } catch (err) {
    res.status(500).json({ error: 'Agent test failed' })
  }
})

router.get('/conversations', authenticate, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('phone')
      .eq('id', req.user.id)
      .single()

    if (!user) return res.json([])

    const { data } = await supabase
      .from('conversations')
      .select('role, content, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true })
      .limit(50)

    res.json(data || [])
  } catch {
    res.json([])
  }
})

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    agent: 'Ama',
    version: '1.0',
    whatsapp_number: env.whatsappNumber || 'not configured',
    webhook_url: `${env.appBaseUrl}/api/whatsapp/incoming`,
  })
})

export default router
