import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { verifyPropertyDocument } from '../services/ai.js'
import { sendSMS } from '../services/moolre.js'
import { createNotification } from '../services/notify.js'
import { getOrCreateWallet } from './wallet.js'
import { isValidUUID, isValidAmount } from '../middleware/validate.js'

const router = Router()

const VALID_REGIONS = ['greater-accra', 'ashanti', 'western', 'eastern', 'central', 'northern', 'volta', 'upper-east', 'upper-west', 'bono', 'bono-east', 'ahafo', 'western-north', 'north-east', 'savannah', 'oti']
const VALID_PROPERTY_TYPES = ['apartment', 'house', 'single-room', 'chamber-and-hall', 'self-contained', 'commercial', 'land']

router.post('/', authenticate, requireRole('landlord'), async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('is_verified, verification_status')
      .eq('id', req.user.id)
      .single()

    if (!user?.is_verified && user?.verification_status !== 'verified') {
      return res.status(403).json({ error: 'You need to complete identity verification before listing a property. Go to Profile to upload your documents.' })
    }

    const { address, region, monthly_rent, bedrooms, property_type, description, amenities, image_url, images } = req.body

    if (!address || typeof address !== 'string' || address.trim().length < 5 || address.length > 500) {
      return res.status(400).json({ error: 'Address must be 5-500 characters' })
    }

    if (!region || typeof region !== 'string') {
      return res.status(400).json({ error: 'Region is required' })
    }

    if (!monthly_rent || !isValidAmount(Number(monthly_rent))) {
      return res.status(400).json({ error: 'Monthly rent must be between GHS 1 and GHS 1,000,000' })
    }

    const insertData = {
      landlord_id: req.user.id,
      address: address.trim().slice(0, 500),
      region: region.trim().slice(0, 100),
      monthly_rent: Number(monthly_rent),
      bedrooms: Math.min(Math.max(parseInt(bedrooms) || 1, 1), 50),
      property_type: VALID_PROPERTY_TYPES.includes(property_type) ? property_type : 'apartment',
      description: description ? String(description).slice(0, 500) : null,
      amenities: Array.isArray(amenities) ? amenities.slice(0, 20).map(a => String(a).slice(0, 50)) : [],
    }

    if (image_url && typeof image_url === 'string' && image_url.length < 500000) {
      insertData.image_url = image_url
    }
    if (Array.isArray(images) && images.length > 0) {
      insertData.images = images.slice(0, 10)
    }

    const { data, error } = await supabase
      .from('properties')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[Properties] Supabase insert error:', error.message, error.code, error.details)
      if (error.message?.includes('images')) {
        delete insertData.images
        delete insertData.image_url
        const retry = await supabase.from('properties').insert(insertData).select().single()
        if (retry.error) throw retry.error
        return res.status(201).json(retry.data)
      }
      throw error
    }
    res.status(201).json(data)
  } catch (err) {
    console.error('[Properties] Create error:', err.message)
    res.status(500).json({ error: err.message || 'Failed to create property' })
  }
})

router.post('/:id/verify-document', authenticate, requireRole('landlord'), async (req, res) => {
  try {
    const { document_image, document_type } = req.body

    if (!document_image || !document_type) {
      return res.status(400).json({ error: 'Document image and type are required' })
    }

    const { data: property, error: fetchErr } = await supabase
      .from('properties')
      .select('*')
      .eq('id', req.params.id)
      .eq('landlord_id', req.user.id)
      .single()

    if (fetchErr || !property) {
      return res.status(404).json({ error: 'Property not found' })
    }

    const result = await verifyPropertyDocument(document_image, document_type, {
      address: property.address,
      region: property.region,
    })

    await supabase
      .from('properties')
      .update({
        document_type,
        document_verified: result.verified,
        document_verification: result,
        ...(result.verified ? { verified_at: new Date().toISOString() } : {}),
      })
      .eq('id', property.id)

    res.json(result)
  } catch (err) {
    console.error('[Properties] Document verification error:', err.message)
    res.status(500).json({ error: 'Document verification failed' })
  }
})

router.get('/available', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*, landlord:users!properties_landlord_id_fkey(is_verified, is_blacklisted)')
      .eq('status', 'vacant')
      .order('created_at', { ascending: false })

    if (error) throw error

    const filtered = (data || []).filter(p =>
      p.landlord?.is_verified && !p.landlord?.is_blacklisted
    )

    res.json(filtered)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch properties' })
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
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ error: 'Invalid property ID' })
    }

    const { data, error } = await supabase
      .from('properties')
      .select('*, landlord:users!properties_landlord_id_fkey(is_verified)')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch property' })
  }
})

router.patch('/:id', authenticate, requireRole('landlord'), async (req, res) => {
  try {
    const { address, region, monthly_rent, bedrooms, property_type, description, amenities } = req.body

    const updates = {}
    if (address !== undefined) updates.address = address
    if (region !== undefined) updates.region = region
    if (monthly_rent !== undefined) updates.monthly_rent = monthly_rent
    if (bedrooms !== undefined) updates.bedrooms = bedrooms
    if (property_type !== undefined) updates.property_type = property_type
    if (description !== undefined) updates.description = description
    if (amenities !== undefined) updates.amenities = amenities

    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', req.params.id)
      .eq('landlord_id', req.user.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update property' })
  }
})

router.delete('/:id', authenticate, requireRole('landlord'), async (req, res) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ error: 'Invalid property ID' })
    }

    const { data: property } = await supabase
      .from('properties')
      .select('id, status')
      .eq('id', req.params.id)
      .eq('landlord_id', req.user.id)
      .single()

    if (!property) {
      return res.status(404).json({ error: 'Property not found' })
    }

    if (property.status === 'occupied') {
      return res.status(400).json({ error: 'Cannot delete a property with an active tenant. End the lease first.' })
    }

    const { data: activeLeases } = await supabase
      .from('leases')
      .select('id')
      .eq('property_id', req.params.id)
      .in('status', ['active', 'pending', 'at_risk'])
      .limit(1)

    if (activeLeases && activeLeases.length > 0) {
      return res.status(400).json({ error: 'Cannot delete a property with active or pending leases.' })
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', req.params.id)
      .eq('landlord_id', req.user.id)

    if (error) throw error
    res.json({ message: 'Property deleted' })
  } catch (err) {
    console.error('[Properties] Delete error:', err.message)
    res.status(500).json({ error: 'Failed to delete property' })
  }
})

router.post('/:id/request', authenticate, requireRole('tenant'), async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('is_verified, verification_status, full_name')
      .eq('id', req.user.id)
      .single()

    if (!user?.is_verified && user?.verification_status !== 'verified') {
      return res.status(403).json({
        error: 'Complete your KYC verification before requesting a property. Go to Profile to upload your documents.',
      })
    }

    const { data: property, error: fetchErr } = await supabase
      .from('properties')
      .select('*, landlord:users!properties_landlord_id_fkey(phone, full_name)')
      .eq('id', req.params.id)
      .single()

    if (fetchErr || !property) {
      return res.status(404).json({ error: 'Property not found' })
    }

    if (property.status !== 'vacant') {
      return res.status(400).json({ error: 'This property is no longer available' })
    }

    const wallet = await getOrCreateWallet(req.user.id)
    const requiredAmount = property.monthly_rent * 2
    if (Number(wallet.balance) < requiredAmount) {
      return res.status(400).json({
        error: `Insufficient wallet balance. You need at least GHS ${requiredAmount.toFixed(2)} (1 month rent + 1 month security deposit). Your balance: GHS ${Number(wallet.balance).toFixed(2)}. Top up your wallet first.`,
        required: requiredAmount,
        balance: Number(wallet.balance),
      })
    }

    const { data: existing } = await supabase
      .from('property_requests')
      .select('id')
      .eq('property_id', req.params.id)
      .eq('tenant_id', req.user.id)
      .in('status', ['pending', 'approved'])
      .single()

    if (existing) {
      return res.status(400).json({ error: 'You have already requested this property' })
    }

    const { data: request, error: insertErr } = await supabase
      .from('property_requests')
      .insert({
        property_id: req.params.id,
        tenant_id: req.user.id,
        landlord_id: property.landlord_id,
        status: 'pending',
      })
      .select()
      .single()

    if (insertErr) throw insertErr

    createNotification({
      userId: property.landlord_id,
      message: `${user.full_name || 'A verified tenant'} has requested your property at ${property.address}`,
      type: 'lease',
    }).catch(() => {})

    if (property.landlord?.phone) {
      sendSMS({
        phone: property.landlord.phone,
        message: `Escavio: A verified tenant has requested your property at ${property.address}. Log in to review their profile and respond.`,
      }).catch(() => {})
    }

    res.status(201).json({
      request,
      message: 'Request sent! The landlord will review your profile and respond.',
    })
  } catch (err) {
    console.error('[Properties] Request error:', err.message)
    res.status(500).json({ error: 'Failed to send property request' })
  }
})

export default router
