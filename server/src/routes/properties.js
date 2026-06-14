import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { verifyPropertyDocument } from '../services/ai.js'
import { sendSMS } from '../services/moolre.js'
import { createNotification } from '../services/notify.js'

const router = Router()

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

    const { address, region, monthly_rent, bedrooms, property_type, description, amenities, image_url } = req.body

    const { data, error } = await supabase
      .from('properties')
      .insert({
        landlord_id: req.user.id,
        address,
        region,
        monthly_rent,
        bedrooms: bedrooms || 1,
        property_type: property_type || 'apartment',
        description: description || null,
        amenities: amenities || [],
        image_url,
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    console.error('[Properties] Create error:', err.message)
    res.status(500).json({ error: 'Failed to create property' })
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
