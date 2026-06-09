import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { verifyGhanaCard, verifyFaceMatch } from '../services/ai.js'
import { createNotification } from '../services/notify.js'

const router = Router()

router.post('/verify', authenticate, async (req, res) => {
  try {
    const { image } = req.body

    if (!image) {
      return res.status(400).json({ error: 'Ghana Card image is required' })
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
      await supabase
        .from('users')
        .update({ ghana_card_number: result.extracted.card_number })
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
    console.error('[KYC] Card verification error:', err.message, err.response?.data || '')
    res.status(500).json({ error: 'Verification failed', reason: err.message })
  }
})

router.post('/verify-face', authenticate, async (req, res) => {
  try {
    const { cardImage, selfie } = req.body

    if (!cardImage || !selfie) {
      return res.status(400).json({ error: 'Both card image and selfie are required' })
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
    console.error('[KYC] Face verification error:', err.message, err.response?.data || '')
    res.status(500).json({ error: 'Face verification failed', reason: err.message })
  }
})

router.get('/status', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_verified, kyc_verified_at, kyc_rejection_reason, ghana_card_number')
      .eq('id', req.user.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch KYC status' })
  }
})

export default router
