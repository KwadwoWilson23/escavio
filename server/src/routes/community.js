import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { isValidUUID } from '../middleware/validate.js'
import { createNotification } from '../services/notify.js'

const router = Router()

router.get('/posts', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('demand_posts')
      .select('*, tenant:users!demand_posts_tenant_id_fkey(full_name)')
      .eq('status', 'open')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    console.error('[Community] List posts error:', err.message)
    res.status(500).json({ error: 'Failed to fetch posts' })
  }
})

router.post('/posts', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'tenant') {
      return res.status(403).json({ error: 'Only tenants can create demand posts.' })
    }

    const { data: user } = await supabase
      .from('users')
      .select('is_verified')
      .eq('id', req.user.id)
      .single()

    if (!user?.is_verified) {
      return res.status(403).json({ error: 'Complete KYC verification before posting.' })
    }

    const { data: activePost } = await supabase
      .from('demand_posts')
      .select('id')
      .eq('tenant_id', req.user.id)
      .eq('status', 'open')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (activePost) {
      return res.status(400).json({ error: 'You already have an active demand post. Close it before creating a new one.' })
    }

    const { location_preference, bedrooms_needed, max_budget, move_in_date, additional_notes } = req.body

    if (!location_preference || typeof location_preference !== 'string') {
      return res.status(400).json({ error: 'Location preference is required.' })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { data: post, error } = await supabase
      .from('demand_posts')
      .insert({
        tenant_id: req.user.id,
        location_preference: location_preference.trim().slice(0, 200),
        bedrooms_needed: Math.min(Math.max(parseInt(bedrooms_needed) || 1, 1), 20),
        max_budget: Number(max_budget) || null,
        move_in_date: move_in_date || null,
        additional_notes: additional_notes ? additional_notes.trim().slice(0, 500) : null,
        status: 'open',
        views_count: 0,
        expires_at: expiresAt.toISOString(),
      })
      .select('*, tenant:users!demand_posts_tenant_id_fkey(full_name)')
      .single()

    if (error) throw error
    res.status(201).json(post)
  } catch (err) {
    console.error('[Community] Create post error:', err.message)
    res.status(500).json({ error: 'Failed to create post' })
  }
})

router.post('/posts/:id/respond', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'landlord') {
      return res.status(403).json({ error: 'Only landlords can respond to demand posts.' })
    }

    const { data: user } = await supabase
      .from('users')
      .select('is_verified')
      .eq('id', req.user.id)
      .single()

    if (!user?.is_verified) {
      return res.status(403).json({ error: 'Complete KYC verification before responding.' })
    }

    const { property_id, message } = req.body

    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post ID' })
    }

    if (!isValidUUID(property_id)) {
      return res.status(400).json({ error: 'Select a property to offer.' })
    }

    const { data: post } = await supabase
      .from('demand_posts')
      .select('id, tenant_id, status')
      .eq('id', req.params.id)
      .single()

    if (!post || post.status !== 'open') {
      return res.status(404).json({ error: 'Post not found or closed.' })
    }

    const { data: property } = await supabase
      .from('properties')
      .select('id, landlord_id, address')
      .eq('id', property_id)
      .eq('landlord_id', req.user.id)
      .single()

    if (!property) {
      return res.status(403).json({ error: 'You can only offer your own properties.' })
    }

    const { data: resp, error } = await supabase
      .from('demand_responses')
      .insert({
        demand_post_id: req.params.id,
        landlord_id: req.user.id,
        property_id,
        message: message ? message.trim().slice(0, 500) : null,
      })
      .select()
      .single()

    if (error) throw error

    createNotification({
      userId: post.tenant_id,
      message: `A landlord responded to your housing request with a property at ${property.address}.`,
      type: 'community',
    }).catch(() => {})

    res.status(201).json(resp)
  } catch (err) {
    console.error('[Community] Respond error:', err.message)
    res.status(500).json({ error: 'Failed to respond to post' })
  }
})

router.get('/posts/:id', authenticate, async (req, res) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post ID' })
    }

    const { data: post, error } = await supabase
      .from('demand_posts')
      .select('*, tenant:users!demand_posts_tenant_id_fkey(full_name)')
      .eq('id', req.params.id)
      .single()

    if (error || !post) return res.status(404).json({ error: 'Post not found' })

    await supabase
      .from('demand_posts')
      .update({ views_count: (post.views_count || 0) + 1 })
      .eq('id', req.params.id)

    const { data: responses } = await supabase
      .from('demand_responses')
      .select('*, landlord:users!demand_responses_landlord_id_fkey(full_name), property:properties(address, monthly_rent, bedrooms, image_url, images)')
      .eq('demand_post_id', req.params.id)
      .order('created_at', { ascending: false })

    res.json({ ...post, responses: responses || [] })
  } catch (err) {
    console.error('[Community] Get post error:', err.message)
    res.status(500).json({ error: 'Failed to fetch post' })
  }
})

router.patch('/posts/:id/close', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('demand_posts')
      .update({ status: 'closed' })
      .eq('id', req.params.id)
      .eq('tenant_id', req.user.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to close post' })
  }
})

router.get('/my-posts', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('demand_posts')
      .select('*')
      .eq('tenant_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch {
    res.status(500).json({ error: 'Failed to fetch your posts' })
  }
})

export default router
