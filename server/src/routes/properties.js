import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.post('/', authenticate, requireRole('landlord'), async (req, res) => {
  try {
    const { address, region, monthly_rent, bedrooms, image_url } = req.body

    const { data, error } = await supabase
      .from('properties')
      .insert({
        landlord_id: req.user.id,
        address,
        region,
        monthly_rent,
        bedrooms: bedrooms || 1,
        image_url,
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create property' })
  }
})

router.get('/mine', authenticate, requireRole('landlord'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('landlord_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch properties' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch property' })
  }
})

export default router
