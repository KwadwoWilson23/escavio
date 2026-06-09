import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/', authenticate, async (req, res) => {
  try {
    const { property_id, tenant_phone, monthly_amount, start_date, end_date, advance_months, payout_mode } = req.body

    if (advance_months > 6) {
      return res.status(400).json({ error: 'Advance months cannot exceed 6 (Ghana Rent Act 2026)' })
    }

    let tenant_id = null
    if (tenant_phone) {
      const { data: tenant } = await supabase
        .from('users')
        .select('id')
        .eq('phone', tenant_phone)
        .eq('role', 'tenant')
        .single()
      if (tenant) tenant_id = tenant.id
    }

    const { data, error } = await supabase
      .from('leases')
      .insert({
        property_id,
        landlord_id: req.user.id,
        tenant_id,
        monthly_amount,
        start_date,
        end_date,
        advance_months: advance_months || 6,
        payout_mode: payout_mode || 'monthly',
      })
      .select()
      .single()

    if (error) throw error

    await supabase
      .from('properties')
      .update({ status: 'pending' })
      .eq('id', property_id)

    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create lease' })
  }
})

router.post('/:id/accept', authenticate, async (req, res) => {
  try {
    const { data: lease, error: fetchErr } = await supabase
      .from('leases')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (fetchErr || !lease) {
      return res.status(404).json({ error: 'Lease not found' })
    }

    const { data, error } = await supabase
      .from('leases')
      .update({ tenant_id: req.user.id, status: 'active' })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

    await supabase
      .from('properties')
      .update({ status: 'occupied' })
      .eq('id', lease.property_id)

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept lease' })
  }
})

router.get('/mine', authenticate, async (req, res) => {
  try {
    const col = req.user.role === 'landlord' ? 'landlord_id' : 'tenant_id'

    const { data, error } = await supabase
      .from('leases')
      .select('*, properties(*), landlord:users!leases_landlord_id_fkey(full_name, phone), tenant:users!leases_tenant_id_fkey(full_name, phone)')
      .eq(col, req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leases' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leases')
      .select('*, properties(*), landlord:users!leases_landlord_id_fkey(full_name, phone), tenant:users!leases_tenant_id_fkey(full_name, phone)')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lease' })
  }
})

export default router
