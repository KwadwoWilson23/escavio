import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { collectPayment, sendSMS } from '../services/moolre.js'

const router = Router()

router.post('/initiate', authenticate, async (req, res) => {
  try {
    const { lease_id } = req.body

    const { data: lease, error: leaseErr } = await supabase
      .from('leases')
      .select('*, properties(address), landlord:users!leases_landlord_id_fkey(phone, full_name)')
      .eq('id', lease_id)
      .single()

    if (leaseErr || !lease) {
      return res.status(404).json({ error: 'Lease not found' })
    }

    const { data: user } = await supabase
      .from('users')
      .select('phone')
      .eq('id', req.user.id)
      .single()

    const reference = `COL-${lease_id.slice(0, 8)}-${Date.now()}`

    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        lease_id,
        payer_id: req.user.id,
        recipient_id: lease.landlord_id,
        amount: lease.monthly_amount,
        moolre_reference: reference,
        type: 'tenant_collection',
        status: 'pending',
        due_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (payErr) throw payErr

    try {
      await collectPayment({
        amount: lease.monthly_amount,
        phone: user.phone,
        reference,
        description: `Rent for ${lease.properties?.address || 'property'}`,
      })
    } catch {
      await supabase
        .from('payments')
        .update({ status: 'pending' })
        .eq('id', payment.id)
    }

    res.status(201).json({ payment, reference })
  } catch (err) {
    res.status(500).json({ error: 'Payment initiation failed' })
  }
})

router.get('/lease/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('lease_id', req.params.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' })
  }
})

export default router
