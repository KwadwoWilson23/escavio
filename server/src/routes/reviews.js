import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { encrypt, decrypt } from '../services/encryption.js'
import { isValidUUID } from '../middleware/validate.js'

const router = Router()

router.post('/property', authenticate, async (req, res) => {
  try {
    const { property_id, lease_id, accuracy_score, cleanliness_score, value_score, responsiveness_score, comment } = req.body

    if (!isValidUUID(property_id) || !isValidUUID(lease_id)) {
      return res.status(400).json({ error: 'Invalid IDs' })
    }

    for (const s of [accuracy_score, cleanliness_score, value_score, responsiveness_score]) {
      if (!s || s < 1 || s > 5) return res.status(400).json({ error: 'Scores must be between 1 and 5' })
    }

    const { data: lease } = await supabase
      .from('leases')
      .select('id, tenant_id, landlord_id, property_id, status, start_date')
      .eq('id', lease_id)
      .single()

    if (!lease || lease.tenant_id !== req.user.id || lease.property_id !== property_id) {
      return res.status(403).json({ error: 'You can only review a property you have a lease on.' })
    }

    const daysSinceStart = Math.floor((Date.now() - new Date(lease.start_date).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceStart < 30 && lease.status !== 'completed') {
      return res.status(400).json({ error: 'You can leave a review after 30 days into your lease.' })
    }

    const { data: existing } = await supabase
      .from('property_reviews')
      .select('id')
      .eq('lease_id', lease_id)
      .eq('reviewer_id', req.user.id)
      .single()

    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this property for this lease.' })
    }

    const overall = (accuracy_score + cleanliness_score + value_score + responsiveness_score) / 4

    let commentEncrypted = null
    if (comment && comment.trim()) {
      commentEncrypted = encrypt(comment.trim(), lease.tenant_id, lease.landlord_id, property_id)
    }

    const { data: review, error } = await supabase
      .from('property_reviews')
      .insert({
        property_id,
        lease_id,
        reviewer_id: req.user.id,
        accuracy_score,
        cleanliness_score,
        value_score,
        responsiveness_score,
        overall_score: Math.round(overall * 10) / 10,
        comment_encrypted: commentEncrypted,
        is_verified_lease: true,
      })
      .select()
      .single()

    if (error) throw error

    const { data: allReviews } = await supabase
      .from('property_reviews')
      .select('overall_score')
      .eq('property_id', property_id)

    if (allReviews && allReviews.length > 0) {
      const avg = allReviews.reduce((sum, r) => sum + r.overall_score, 0) / allReviews.length
      await supabase.from('properties').update({
        average_rating: Math.round(avg * 10) / 10,
        review_count: allReviews.length,
      }).eq('id', property_id)
    }

    res.status(201).json({ ...review, comment: comment?.trim() || null, comment_encrypted: undefined })
  } catch (err) {
    console.error('[Reviews] Property review error:', err.message)
    res.status(500).json({ error: 'Failed to submit review' })
  }
})

router.post('/tenant', authenticate, async (req, res) => {
  try {
    const { tenant_id, lease_id, payment_score, care_score, communication_score, comment } = req.body

    if (!isValidUUID(tenant_id) || !isValidUUID(lease_id)) {
      return res.status(400).json({ error: 'Invalid IDs' })
    }

    for (const s of [payment_score, care_score, communication_score]) {
      if (!s || s < 1 || s > 5) return res.status(400).json({ error: 'Scores must be between 1 and 5' })
    }

    const { data: lease } = await supabase
      .from('leases')
      .select('id, tenant_id, landlord_id, property_id, status')
      .eq('id', lease_id)
      .single()

    if (!lease || lease.landlord_id !== req.user.id || lease.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'You can only review a tenant from your lease.' })
    }

    const { data: existing } = await supabase
      .from('tenant_reviews')
      .select('id')
      .eq('lease_id', lease_id)
      .eq('reviewer_id', req.user.id)
      .single()

    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this tenant for this lease.' })
    }

    const overall = (payment_score + care_score + communication_score) / 3

    let commentEncrypted = null
    if (comment && comment.trim()) {
      commentEncrypted = encrypt(comment.trim(), lease.tenant_id, lease.landlord_id, lease.property_id)
    }

    const { data: review, error } = await supabase
      .from('tenant_reviews')
      .insert({
        tenant_id,
        lease_id,
        reviewer_id: req.user.id,
        payment_score,
        care_score,
        communication_score,
        overall_score: Math.round(overall * 10) / 10,
        comment_encrypted: commentEncrypted,
        is_verified_lease: true,
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ ...review, comment: comment?.trim() || null, comment_encrypted: undefined })
  } catch (err) {
    console.error('[Reviews] Tenant review error:', err.message)
    res.status(500).json({ error: 'Failed to submit review' })
  }
})

router.get('/property/:propertyId', authenticate, async (req, res) => {
  try {
    if (!isValidUUID(req.params.propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID' })
    }

    const { data: reviews, error } = await supabase
      .from('property_reviews')
      .select('*, reviewer:users!property_reviews_reviewer_id_fkey(full_name), lease:leases!property_reviews_lease_id_fkey(tenant_id, landlord_id, property_id)')
      .eq('property_id', req.params.propertyId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const decrypted = (reviews || []).map(r => {
      let comment = null
      if (r.comment_encrypted && r.lease) {
        comment = decrypt(r.comment_encrypted, r.lease.tenant_id, r.lease.landlord_id, r.lease.property_id)
      }
      return { ...r, comment, comment_encrypted: undefined, lease: undefined }
    })

    const hasLandlordReviewed = await checkBlindReview(req.params.propertyId, req.user.id, req.user.role)

    res.json({
      reviews: req.user.role === 'landlord' && !hasLandlordReviewed
        ? decrypted.map(r => ({ ...r, comment: '[Submit your review to see tenant comments]' }))
        : decrypted,
      can_see_comments: req.user.role !== 'landlord' || hasLandlordReviewed,
    })
  } catch (err) {
    console.error('[Reviews] Fetch property reviews error:', err.message)
    res.status(500).json({ error: 'Failed to fetch reviews' })
  }
})

router.get('/tenant/:tenantId', authenticate, async (req, res) => {
  try {
    if (!isValidUUID(req.params.tenantId)) {
      return res.status(400).json({ error: 'Invalid tenant ID' })
    }

    const { data: reviews, error } = await supabase
      .from('tenant_reviews')
      .select('*, reviewer:users!tenant_reviews_reviewer_id_fkey(full_name), lease:leases!tenant_reviews_lease_id_fkey(tenant_id, landlord_id, property_id)')
      .eq('tenant_id', req.params.tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const decrypted = (reviews || []).map(r => {
      let comment = null
      if (r.comment_encrypted && r.lease) {
        comment = decrypt(r.comment_encrypted, r.lease.tenant_id, r.lease.landlord_id, r.lease.property_id)
      }
      return { ...r, comment, comment_encrypted: undefined, lease: undefined }
    })

    res.json(decrypted)
  } catch (err) {
    console.error('[Reviews] Fetch tenant reviews error:', err.message)
    res.status(500).json({ error: 'Failed to fetch reviews' })
  }
})

async function checkBlindReview(propertyId, userId, role) {
  if (role !== 'landlord') return true
  const { data } = await supabase
    .from('tenant_reviews')
    .select('id')
    .eq('reviewer_id', userId)
    .limit(1)
  return data && data.length > 0
}

export default router
