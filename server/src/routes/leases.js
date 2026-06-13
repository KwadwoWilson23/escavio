import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { notifyBoth } from '../services/notify.js'
import { sendSMS } from '../services/moolre.js'

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
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    await supabase
      .from('properties')
      .update({ status: 'pending' })
      .eq('id', property_id)

    if (tenant_id) {
      notifyBoth({
        payerId: tenant_id,
        recipientId: req.user.id,
        payerMsg: `You have a new lease invitation. Review and accept it in the app.`,
        recipientMsg: `Lease created successfully. Waiting for tenant to accept.`,
        type: 'lease',
      }).catch(() => {})
    }

    res.status(201).json(data)
  } catch (err) {
    console.error('[Leases] Create error:', err.message)
    res.status(500).json({ error: 'Failed to create lease' })
  }
})

router.post('/:id/accept', authenticate, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('is_verified, is_blacklisted, full_name, phone')
      .eq('id', req.user.id)
      .single()

    if (user?.is_blacklisted) {
      return res.status(403).json({ error: 'Your account has been restricted due to payment defaults. Contact support.' })
    }

    if (!user?.is_verified) {
      return res.status(403).json({ error: 'Please complete KYC verification before accepting a lease.' })
    }

    const { data: lease, error: fetchErr } = await supabase
      .from('leases')
      .select('*, properties(address)')
      .eq('id', req.params.id)
      .single()

    if (fetchErr || !lease) {
      return res.status(404).json({ error: 'Lease not found' })
    }

    if (lease.status !== 'pending') {
      return res.status(400).json({ error: 'This lease is not available for acceptance' })
    }

    const { data, error } = await supabase
      .from('leases')
      .update({
        tenant_id: req.user.id,
        status: 'accepted',
      })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

    const address = lease.properties?.address || 'the property'

    notifyBoth({
      payerId: req.user.id,
      recipientId: lease.landlord_id,
      payerMsg: `You accepted the lease for ${address}. Please pay your security deposit of GHS ${lease.monthly_amount.toFixed(2)} to activate it.`,
      recipientMsg: `${user.full_name || 'Tenant'} accepted the lease for ${address}. Awaiting security deposit payment.`,
      type: 'lease',
    }).catch(() => {})

    res.json({
      lease: data,
      message: 'Lease accepted. Pay your security deposit to activate.',
      security_deposit_required: lease.monthly_amount,
    })
  } catch (err) {
    console.error('[Leases] Accept error:', err.message)
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
