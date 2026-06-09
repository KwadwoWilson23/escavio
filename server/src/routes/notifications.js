import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('sent_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const unreadCount = (data || []).filter(n => !n.is_read).length
    res.json({ notifications: data || [], unreadCount })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false)

    if (error) throw error
    res.json({ count: count || 0 })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch count' })
  }
})

router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' })
  }
})

router.patch('/read-all', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read' })
  }
})

export default router
