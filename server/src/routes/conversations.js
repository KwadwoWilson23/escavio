import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { encrypt, decrypt } from '../services/encryption.js'
import { isValidUUID } from '../middleware/validate.js'
import { createNotification } from '../services/notify.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const col = req.user.role === 'landlord' ? 'landlord_id' : 'tenant_id'

    const { data, error } = await supabase
      .from('conversations')
      .select('*, property:properties(address, image_url), tenant:users!conversations_tenant_id_fkey(full_name), landlord:users!conversations_landlord_id_fkey(full_name)')
      .eq(col, userId)
      .order('last_message_at', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    console.error('[Conversations] List error:', err.message)
    res.status(500).json({ error: 'Failed to fetch conversations' })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { property_id, landlord_id } = req.body

    if (!isValidUUID(property_id)) {
      return res.status(400).json({ error: 'Invalid property ID' })
    }

    const { data: user } = await supabase
      .from('users')
      .select('is_verified, communication_policy_accepted_at')
      .eq('id', req.user.id)
      .single()

    if (!user?.is_verified) {
      return res.status(403).json({ error: 'Complete KYC verification before sending messages.' })
    }

    const { data: property } = await supabase
      .from('properties')
      .select('id, landlord_id')
      .eq('id', property_id)
      .single()

    if (!property) {
      return res.status(404).json({ error: 'Property not found' })
    }

    const actualLandlordId = landlord_id || property.landlord_id

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('property_id', property_id)
      .eq('tenant_id', req.user.id)
      .eq('landlord_id', actualLandlordId)
      .single()

    if (existing) {
      return res.json(existing)
    }

    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({
        property_id,
        tenant_id: req.user.id,
        landlord_id: actualLandlordId,
        status: 'active',
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(conv)
  } catch (err) {
    console.error('[Conversations] Create error:', err.message)
    res.status(500).json({ error: 'Failed to create conversation' })
  }
})

router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ error: 'Invalid conversation ID' })
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('tenant_id, landlord_id, property_id')
      .eq('id', req.params.id)
      .single()

    if (!conv) return res.status(404).json({ error: 'Conversation not found' })

    if (conv.tenant_id !== req.user.id && conv.landlord_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', req.params.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    const decrypted = (messages || []).map(m => ({
      ...m,
      content: m.content_encrypted
        ? decrypt(m.content_encrypted, conv.tenant_id, conv.landlord_id, conv.property_id)
        : '',
      content_encrypted: undefined,
    }))

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', req.params.id)
      .neq('sender_id', req.user.id)
      .eq('is_read', false)

    res.json(decrypted)
  } catch (err) {
    console.error('[Messages] Fetch error:', err.message)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

router.post('/:id/messages', authenticate, async (req, res) => {
  try {
    const { content, message_type } = req.body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' })
    }

    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ error: 'Invalid conversation ID' })
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('tenant_id, landlord_id, property_id')
      .eq('id', req.params.id)
      .single()

    if (!conv) return res.status(404).json({ error: 'Conversation not found' })

    if (conv.tenant_id !== req.user.id && conv.landlord_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const encrypted = encrypt(content.trim(), conv.tenant_id, conv.landlord_id, conv.property_id)

    const { data: msg, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: req.params.id,
        sender_id: req.user.id,
        content_encrypted: encrypted,
        message_type: message_type || 'text',
        is_read: false,
      })
      .select()
      .single()

    if (error) throw error

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', req.params.id)

    const recipientId = conv.tenant_id === req.user.id ? conv.landlord_id : conv.tenant_id
    createNotification({
      userId: recipientId,
      message: 'You have a new message on Escavio.',
      type: 'message',
    }).catch(() => {})

    res.status(201).json({
      ...msg,
      content: content.trim(),
      content_encrypted: undefined,
    })
  } catch (err) {
    console.error('[Messages] Send error:', err.message)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ error: 'Invalid conversation ID' })
    }

    const { data: conv, error } = await supabase
      .from('conversations')
      .select('*, property:properties(address, image_url, images), tenant:users!conversations_tenant_id_fkey(full_name), landlord:users!conversations_landlord_id_fkey(full_name)')
      .eq('id', req.params.id)
      .single()

    if (error || !conv) return res.status(404).json({ error: 'Conversation not found' })

    if (conv.tenant_id !== req.user.id && conv.landlord_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    res.json(conv)
  } catch (err) {
    console.error('[Conversations] Get error:', err.message)
    res.status(500).json({ error: 'Failed to fetch conversation' })
  }
})

router.get('/unread/count', authenticate, async (req, res) => {
  try {
    const col = req.user.role === 'landlord' ? 'landlord_id' : 'tenant_id'
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .eq(col, req.user.id)

    if (!convs || convs.length === 0) return res.json({ count: 0 })

    const convIds = convs.map(c => c.id)
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .neq('sender_id', req.user.id)
      .eq('is_read', false)

    res.json({ count: count || 0 })
  } catch {
    res.json({ count: 0 })
  }
})

export default router
