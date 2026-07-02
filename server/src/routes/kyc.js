import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { verifyGhanaCard, verifyGhanaCardBack, verifyFaceMatch } from '../services/ai.js'
import { createNotification } from '../services/notify.js'
import { isValidBase64Image } from '../middleware/validate.js'

const router = Router()

router.post('/verify-front', authenticate, async (req, res) => {
  try {
    const { image } = req.body

    if (!image || !isValidBase64Image(image)) {
      return res.status(400).json({ error: 'A valid Ghana Card image is required (max 10MB)' })
    }

    const { data: user } = await supabase
      .from('users')
      .select('full_name, ghana_card_number, is_verified')
      .eq('id', req.user.id)
      .single()

    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.is_verified) return res.json({ verified: true, reason: 'Already verified' })

    const base64 = image.replace(/^data:image\/\w+;base64,/, '')
    const result = await verifyGhanaCard(base64, user)

    if (result.verified && result.extracted?.card_number) {
      const cardNumber = result.extracted.card_number.trim().toUpperCase()

      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('ghana_card_number', cardNumber)
        .neq('id', req.user.id)
        .single()

      if (existing) {
        return res.status(409).json({
          verified: false,
          reason: 'This Ghana Card is already registered to another account. Each card can only be used once.',
        })
      }

      await supabase
        .from('users')
        .update({ ghana_card_number: cardNumber })
        .eq('id', req.user.id)

      if (result.extracted.document_number) {
        await supabase
          .from('users')
          .update({ ghana_card_doc_number: result.extracted.document_number.trim().toUpperCase() })
          .eq('id', req.user.id)
          .then(() => {})
          .catch(() => {})
      }
    }

    if (!result.verified) {
      await supabase
        .from('users')
        .update({ kyc_rejection_reason: result.reason })
        .eq('id', req.user.id)
    }

    res.json(result)
  } catch (err) {
    console.error('[KYC] Front verification error:', err.message)
    res.status(500).json({ error: 'Verification failed' })
  }
})

router.post('/verify-back', authenticate, async (req, res) => {
  try {
    const { image } = req.body

    if (!image || !isValidBase64Image(image)) {
      return res.status(400).json({ error: 'A valid Ghana Card back image is required (max 10MB)' })
    }

    const { data: user } = await supabase
      .from('users')
      .select('full_name, ghana_card_number, is_verified')
      .eq('id', req.user.id)
      .single()

    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.is_verified) return res.json({ verified: true, reason: 'Already verified' })

    if (!user.ghana_card_number) {
      return res.status(400).json({ error: 'Please verify the front of your Ghana Card first' })
    }

    let docNumber = null
    try {
      const { data: docData } = await supabase
        .from('users')
        .select('ghana_card_doc_number')
        .eq('id', req.user.id)
        .single()
      docNumber = docData?.ghana_card_doc_number || null
    } catch {}

    const base64 = image.replace(/^data:image\/\w+;base64,/, '')
    const result = await verifyGhanaCardBack(base64, docNumber)

    if (!result.verified) {
      await supabase
        .from('users')
        .update({ kyc_rejection_reason: result.reason })
        .eq('id', req.user.id)
    }

    res.json(result)
  } catch (err) {
    console.error('[KYC] Back verification error:', err.message)
    res.status(500).json({ error: 'Back verification failed' })
  }
})

router.post('/verify', authenticate, async (req, res) => {
  try {
    const { image } = req.body

    if (!image || !isValidBase64Image(image)) {
      return res.status(400).json({ error: 'A valid Ghana Card image is required (max 10MB)' })
    }

    const { data: user } = await supabase
      .from('users')
      .select('full_name, ghana_card_number, is_verified')
      .eq('id', req.user.id)
      .single()

    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.is_verified) return res.json({ verified: true, reason: 'Already verified' })

    const base64 = image.replace(/^data:image\/\w+;base64,/, '')
    const result = await verifyGhanaCard(base64, user)

    if (result.verified && result.extracted?.card_number) {
      const cardNumber = result.extracted.card_number.trim().toUpperCase()

      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('ghana_card_number', cardNumber)
        .neq('id', req.user.id)
        .single()

      if (existing) {
        return res.status(409).json({
          verified: false,
          reason: 'This Ghana Card is already registered to another account. Each card can only be used once.',
        })
      }

      await supabase
        .from('users')
        .update({ ghana_card_number: cardNumber })
        .eq('id', req.user.id)
    }

    if (!result.verified) {
      await supabase
        .from('users')
        .update({ kyc_rejection_reason: result.reason })
        .eq('id', req.user.id)
    }

    res.json(result)
  } catch (err) {
    console.error('[KYC] Card verification error:', err.message)
    res.status(500).json({ error: 'Verification failed' })
  }
})

router.post('/verify-face', authenticate, async (req, res) => {
  try {
    const { cardImage, selfie } = req.body

    if (!cardImage || !isValidBase64Image(cardImage)) {
      return res.status(400).json({ error: 'A valid card image is required' })
    }

    if (!selfie || !isValidBase64Image(selfie)) {
      return res.status(400).json({ error: 'A valid selfie is required' })
    }

    const { data: user } = await supabase
      .from('users')
      .select('full_name, ghana_card_number, is_verified')
      .eq('id', req.user.id)
      .single()

    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.is_verified) return res.json({ passed: true, reason: 'Already verified' })

    const cardBase64 = cardImage.replace(/^data:image\/\w+;base64,/, '')
    const selfieBase64 = selfie.replace(/^data:image\/\w+;base64,/, '')

    const result = await verifyFaceMatch(cardBase64, selfieBase64, user.full_name)

    if (result.passed) {
      await supabase
        .from('users')
        .update({
          is_verified: true,
          kyc_verified_at: new Date().toISOString(),
          kyc_rejection_reason: null,
        })
        .eq('id', req.user.id)

      createNotification({
        userId: req.user.id,
        message: 'Your identity has been verified successfully. Your account is now fully active.',
        type: 'alert',
      }).catch(() => {})
    } else {
      await supabase
        .from('users')
        .update({ kyc_rejection_reason: result.reason })
        .eq('id', req.user.id)

      createNotification({
        userId: req.user.id,
        message: `Face verification failed: ${result.reason}. Please try again.`,
        type: 'alert',
      }).catch(() => {})
    }

    res.json(result)
  } catch (err) {
    console.error('[KYC] Face verification error:', err.message)
    res.status(500).json({ error: 'Face verification failed' })
  }
})

router.get('/status', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_verified, kyc_verified_at, kyc_rejection_reason, ghana_card_number, trust_level, role')
      .eq('id', req.user.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch KYC status' })
  }
})

const LANDLORD_DOC_TYPES = ['property_title_deed', 'utility_bill', 'business_registration']
const TENANT_DOC_TYPES = ['employment_letter', 'momo_statement', 'bank_statement', 'business_registration_income']

router.post('/documents', authenticate, async (req, res) => {
  try {
    const { doc_type, image } = req.body

    const { data: user } = await supabase
      .from('users')
      .select('role, is_verified')
      .eq('id', req.user.id)
      .single()

    if (!user) return res.status(404).json({ error: 'User not found' })

    const allowedTypes = user.role === 'landlord' ? LANDLORD_DOC_TYPES : TENANT_DOC_TYPES
    if (!allowedTypes.includes(doc_type)) {
      return res.status(400).json({ error: 'Invalid document type for your role' })
    }

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Document image is required' })
    }

    const { data: existing } = await supabase
      .from('verification_documents')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('doc_type', doc_type)
      .single()

    if (existing) {
      return res.status(400).json({ error: 'You have already submitted this document type. Please wait for review.' })
    }

    let base64Data = image
    let mimeType = 'image/jpeg'
    if (image.startsWith('data:')) {
      const match = image.match(/^data:(image\/\w+);base64,(.+)$/)
      if (!match) return res.status(400).json({ error: 'Invalid image format' })
      mimeType = match[1]
      base64Data = match[2]
    }

    const buffer = Buffer.from(base64Data, 'base64')
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Document must be under 10MB' })
    }

    const crypto = await import('crypto')
    const ext = mimeType === 'image/png' ? 'png' : 'jpg'
    const filename = `docs/${req.user.id}/${doc_type}_${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filename, buffer, { contentType: mimeType, upsert: false })

    if (uploadError) {
      console.error('[KYC] Doc upload error:', uploadError.message)
      return res.status(500).json({ error: 'Failed to upload document' })
    }

    const { data: urlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(filename)

    const { data: doc, error: insertError } = await supabase
      .from('verification_documents')
      .insert({
        user_id: req.user.id,
        doc_type,
        image_url: urlData.publicUrl,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) throw insertError

    res.status(201).json(doc)
  } catch (err) {
    console.error('[KYC] Document submit error:', err.message)
    res.status(500).json({ error: 'Failed to submit document' })
  }
})

router.get('/documents', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('verification_documents')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

router.post('/documents/:id/approve', authenticate, async (req, res) => {
  try {
    const { data: doc, error: fetchErr } = await supabase
      .from('verification_documents')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (fetchErr || !doc) return res.status(404).json({ error: 'Document not found' })

    await supabase
      .from('verification_documents')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', req.params.id)

    const { data: allDocs } = await supabase
      .from('verification_documents')
      .select('doc_type')
      .eq('user_id', doc.user_id)
      .eq('status', 'approved')

    const approvedCount = (allDocs || []).length
    let trustLevel = 'basic'
    if (approvedCount >= 3) trustLevel = 'premium'
    else if (approvedCount >= 2) trustLevel = 'trusted'

    await supabase
      .from('users')
      .update({ trust_level: trustLevel })
      .eq('id', doc.user_id)

    createNotification({
      userId: doc.user_id,
      message: `Your ${doc.doc_type.replace(/_/g, ' ')} has been verified. Trust level: ${trustLevel}.`,
      type: 'alert',
    }).catch(() => {})

    res.json({ trust_level: trustLevel, approved_count: approvedCount })
  } catch (err) {
    console.error('[KYC] Approve error:', err.message)
    res.status(500).json({ error: 'Failed to approve document' })
  }
})

export default router
