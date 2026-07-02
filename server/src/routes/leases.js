import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { notifyBoth } from '../services/notify.js'
import { sendSMS } from '../services/moolre.js'
import { getOrCreateWallet } from './wallet.js'
import { isValidUUID } from '../middleware/validate.js'

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

router.post('/accept-request/:requestId', authenticate, async (req, res) => {
  try {
    const { start_date, end_date, advance_months, payout_mode } = req.body

    const { data: request, error: reqErr } = await supabase
      .from('property_requests')
      .select('*, properties(*, landlord_id), tenant:users!property_requests_tenant_id_fkey(full_name, phone)')
      .eq('id', req.params.requestId)
      .single()

    if (reqErr || !request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    if (request.landlord_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your property request' })
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been processed' })
    }

    const monthlyAmount = request.properties.monthly_rent
    const lockAmount = monthlyAmount * 2
    const wallet = await getOrCreateWallet(request.tenant_id)

    if (Number(wallet.balance) < lockAmount) {
      return res.status(400).json({
        error: `Tenant no longer has sufficient wallet balance (needs GHS ${lockAmount.toFixed(2)}). Request cannot be approved.`,
      })
    }

    const newBalance = Number(wallet.balance) - lockAmount
    const newLocked = Number(wallet.locked_balance) + lockAmount

    await supabase
      .from('wallets')
      .update({ balance: newBalance, locked_balance: newLocked, updated_at: new Date().toISOString() })
      .eq('id', wallet.id)

    const { data: lease, error: leaseErr } = await supabase
      .from('leases')
      .insert({
        property_id: request.property_id,
        landlord_id: req.user.id,
        tenant_id: request.tenant_id,
        monthly_amount: monthlyAmount,
        start_date: start_date || new Date().toISOString().split('T')[0],
        end_date: end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        advance_months: advance_months || 6,
        payout_mode: payout_mode || 'monthly',
        security_deposit: monthlyAmount,
        escrow_balance: monthlyAmount,
        status: 'active',
      })
      .select()
      .single()

    if (leaseErr) throw leaseErr

    await supabase
      .from('properties')
      .update({ status: 'occupied' })
      .eq('id', request.property_id)

    await supabase
      .from('property_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', req.params.requestId)

    const address = request.properties?.address || 'the property'

    await supabase.from('wallet_transactions').insert([
      {
        wallet_id: wallet.id,
        user_id: request.tenant_id,
        type: 'lock',
        amount: monthlyAmount,
        balance_after: newBalance,
        description: `Security deposit locked for ${address}`,
        lease_id: lease.id,
        status: 'success',
      },
      {
        wallet_id: wallet.id,
        user_id: request.tenant_id,
        type: 'lock',
        amount: monthlyAmount,
        balance_after: newBalance,
        description: `First month rent locked for ${address}`,
        lease_id: lease.id,
        status: 'success',
      },
    ])

    notifyBoth({
      payerId: request.tenant_id,
      recipientId: req.user.id,
      payerMsg: `Your request for ${address} has been approved! GHS ${lockAmount.toFixed(2)} locked (security deposit + first month). Lease is active.`,
      recipientMsg: `You approved the tenant for ${address}. Lease is now active. Disbursement will follow your payout mode.`,
      type: 'lease',
    }).catch(() => {})

    if (request.tenant?.phone) {
      sendSMS({
        phone: request.tenant.phone,
        message: `Escavio: Your property request for ${address} has been approved! GHS ${lockAmount.toFixed(2)} locked from your wallet. Your lease is now active.`,
      }).catch(() => {})
    }

    res.status(201).json({ lease, message: 'Request approved, lease created, funds locked.' })
  } catch (err) {
    console.error('[Leases] Accept request error:', err.message)
    res.status(500).json({ error: 'Failed to accept request' })
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

router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ error: 'Invalid lease ID' })
    }

    const { data: lease } = await supabase
      .from('leases')
      .select('id, status, landlord_id, tenant_id, property_id')
      .eq('id', req.params.id)
      .single()

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' })
    }

    if (lease.landlord_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the landlord can delete this lease' })
    }

    if (lease.status === 'active' || lease.status === 'at_risk') {
      return res.status(400).json({ error: 'Cannot delete an active lease. End the lease first.' })
    }

    const { error } = await supabase
      .from('leases')
      .delete()
      .eq('id', req.params.id)
      .eq('landlord_id', req.user.id)

    if (error) throw error

    if (lease.property_id) {
      await supabase
        .from('properties')
        .update({ status: 'vacant' })
        .eq('id', lease.property_id)
        .in('status', ['pending'])
    }

    res.json({ message: 'Lease deleted' })
  } catch (err) {
    console.error('[Leases] Delete error:', err.message)
    res.status(500).json({ error: 'Failed to delete lease' })
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
