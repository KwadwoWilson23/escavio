import { Router } from 'express'
import { handleIncomingMessage } from '../services/agent.js'
import { sendSMS } from '../services/moolre.js'
import { sendMessage as sendWhatsApp } from '../services/whatsapp.js'
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
      await sendWhatsApp({
        phone: senderPhone,
        message: reply,
        ref: `ama-${Date.now()}`,
      })
      console.log(`[Ama] WhatsApp reply sent to ${senderPhone}`)
    } catch (waErr) {
      console.warn(`[Ama] WhatsApp reply failed, falling back to SMS:`, waErr.message)
      try {
        await sendSMS({ phone: senderPhone, message: `Ama (Escavio): ${reply}` })
        console.log(`[Ama] SMS fallback sent to ${senderPhone}`)
      } catch {}
    }

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

router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message } = req.body
    if (!message) return res.status(400).json({ error: 'message required' })

    const { data: user } = await supabase
      .from('users')
      .select('phone')
      .eq('id', req.user.id)
      .single()

    const phone = user?.phone || `web-${req.user.id}`
    const reply = await handleIncomingMessage(phone, message)
    res.json({ reply })
  } catch (err) {
    res.status(500).json({ error: 'Chat failed' })
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
