import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import crypto from 'crypto'

const router = Router()

router.post('/property-image', authenticate, async (req, res) => {
  try {
    const { image } = req.body

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Image data is required' })
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

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image must be under 5MB' })
    }

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
    const filename = `${req.user.id}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      console.error('[Upload] Storage error:', uploadError.message)
      return res.status(500).json({ error: 'Failed to upload image' })
    }

    const { data: urlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(filename)

    res.json({ url: urlData.publicUrl })
  } catch (err) {
    console.error('[Upload] Error:', err.message)
    res.status(500).json({ error: 'Upload failed' })
  }
})

export default router
