import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { createNotification } from '../services/notify.js'

const router = Router()

router.post('/', authenticate, async (req, res) => {
  try {
    const { lease_id, description } = req.body

    const { data, error } = await supabase
      .from('disputes')
      .insert({
        lease_id,
        raised_by: req.user.id,
        description,
      })
      .select()
      .single()

    if (error) throw error

    const { data: lease } = await supabase.from('leases').select('landlord_id, tenant_id').eq('id', lease_id).single()
    if (lease) {
      const otherParty = req.user.id === lease.landlord_id ? lease.tenant_id : lease.landlord_id
      createNotification({ userId: otherParty, message: `A new dispute has been raised: ${description.slice(0, 80)}`, type: 'dispute' }).catch(() => {})
    }

    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create dispute' })
  }
})

router.get('/mine', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('disputes')
      .select('*, leases(*, properties(address))')
      .eq('raised_by', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch disputes' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('disputes')
      .select('*, leases(*, properties(address))')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dispute' })
  }
})

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body

    const { data, error } = await supabase
      .from('disputes')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update dispute' })
  }
})

export default router
