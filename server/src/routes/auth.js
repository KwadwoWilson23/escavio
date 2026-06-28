import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'
import env from '../config/env.js'
import { authenticate } from '../middleware/auth.js'
import { isValidEmail, isValidPhone, isValidPassword, isValidName, isValidRole } from '../middleware/validate.js'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { full_name, phone, email, password, role, ghana_card_number } = req.body

    if (!full_name || !phone || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (!isValidName(full_name)) {
      return res.status(400).json({ error: 'Name must be 2-200 characters' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' })
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    if (!isValidRole(role)) {
      return res.status(400).json({ error: 'Role must be landlord or tenant' })
    }

    if (ghana_card_number && !/^GHA-[A-Z0-9]{9}-[A-Z0-9]$/i.test(ghana_card_number.trim())) {
      return res.status(400).json({ error: 'Invalid Ghana Card number format (GHA-XXXXXXXXX-X)' })
    }

    if (ghana_card_number) {
      const { data: cardExists } = await supabase
        .from('users')
        .select('id')
        .eq('ghana_card_number', ghana_card_number.trim().toUpperCase())
        .single()

      if (cardExists) {
        return res.status(409).json({ error: 'This Ghana Card is already registered to another account' })
      }
    }

    const password_hash = await bcrypt.hash(password, 12)

    const { data, error } = await supabase
      .from('users')
      .insert({
        full_name: full_name.trim().slice(0, 200),
        phone,
        email: email.toLowerCase().trim(),
        password_hash,
        role,
        ghana_card_number: ghana_card_number ? ghana_card_number.trim().toUpperCase() : null,
      })
      .select('id, full_name, phone, email, role, is_verified, created_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Phone or email already registered' })
      }
      throw error
    }

    const token = jwt.sign(
      { id: data.id, role: data.role, full_name: data.full_name },
      env.jwtSecret,
      { expiresIn: '7d' }
    )

    res.status(201).json({ user: data, token })
  } catch (err) {
    console.error('[Auth] Registration error:', err.message || err)
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password required' })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'This account uses Google Sign-In. Please log in with Google.' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, full_name: user.full_name },
      env.jwtSecret,
      { expiresIn: '7d' }
    )

    const { password_hash, ...safeUser } = user
    res.json({ user: safeUser, token })
  } catch (err) {
    res.status(500).json({ error: 'Login failed' })
  }
})

router.get('/me', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, phone, email, role, ghana_card_number, is_verified, created_at')
      .eq('id', req.user.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

router.patch('/password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Both passwords required' })
    }

    if (!isValidPassword(new_password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single()

    if (!user?.password_hash) {
      return res.status(400).json({ error: 'Password change not available for OAuth accounts' })
    }

    const valid = await bcrypt.compare(current_password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    const password_hash = await bcrypt.hash(new_password, 12)
    await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', req.user.id)

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Password update failed' })
  }
})

router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { full_name, phone } = req.body
    const updates = {}

    if (full_name !== undefined) {
      if (!isValidName(full_name)) {
        return res.status(400).json({ error: 'Name must be 2-200 characters' })
      }
      updates.full_name = full_name.trim().slice(0, 200)
    }

    if (phone !== undefined) {
      if (!isValidPhone(phone)) {
        return res.status(400).json({ error: 'Invalid phone number' })
      }
      const cleaned = phone.replace(/\D/g, '')
      let normalized = cleaned
      if (cleaned.startsWith('0') && cleaned.length === 10) normalized = '233' + cleaned.slice(1)
      else if (cleaned.length === 9) normalized = '233' + cleaned
      else if (!cleaned.startsWith('233')) normalized = cleaned

      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('phone', normalized)
        .neq('id', req.user.id)
        .single()

      if (existing) {
        return res.status(409).json({ error: 'This phone number is already registered to another account' })
      }
      updates.phone = normalized
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)

    if (error) throw error

    const { data: updated } = await supabase
      .from('users')
      .select('id, full_name, phone, email, role, ghana_card_number, is_verified, created_at')
      .eq('id', req.user.id)
      .single()

    res.json(updated)
  } catch (err) {
    console.error('[Auth] Profile update error:', err.message)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

router.patch('/complete-profile', authenticate, async (req, res) => {
  try {
    const { phone, role } = req.body

    if (!phone || !role) {
      return res.status(400).json({ error: 'Phone number and role are required' })
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' })
    }

    if (!isValidRole(role)) {
      return res.status(400).json({ error: 'Role must be landlord or tenant' })
    }

    const cleaned = phone.replace(/\D/g, '')
    let normalized = cleaned
    if (cleaned.startsWith('0') && cleaned.length === 10) normalized = '233' + cleaned.slice(1)
    else if (cleaned.length === 9) normalized = '233' + cleaned
    else if (!cleaned.startsWith('233')) normalized = cleaned

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('phone', normalized)
      .neq('id', req.user.id)
      .single()

    if (existing) {
      return res.status(409).json({ error: 'This phone number is already registered to another account' })
    }

    const { error } = await supabase
      .from('users')
      .update({ phone: normalized, role })
      .eq('id', req.user.id)

    if (error) throw error

    const { data: updated } = await supabase
      .from('users')
      .select('id, full_name, phone, email, role, ghana_card_number, is_verified, created_at')
      .eq('id', req.user.id)
      .single()

    res.json(updated)
  } catch (err) {
    console.error('[Auth] Complete profile error:', err.message)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ error: 'Google credential required' })
    }

    const { data: tokenInfo } = await (await import('axios')).default.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    )

    const { email, name, sub: googleId } = tokenInfo

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Invalid Google credential' })
    }

    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('oauth_provider', 'google')
      .eq('oauth_id', googleId)
      .single()

    if (!user) {
      const { data: emailUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (emailUser) {
        await supabase
          .from('users')
          .update({ oauth_provider: 'google', oauth_id: googleId })
          .eq('id', emailUser.id)
        user = emailUser
      } else {
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            full_name: (name || 'User').slice(0, 200),
            email: email.toLowerCase().trim(),
            phone: `google_${googleId}`,
            role: 'tenant',
            oauth_provider: 'google',
            oauth_id: googleId,
          })
          .select()
          .single()

        if (error) throw error
        user = newUser
      }
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, full_name: user.full_name },
      env.jwtSecret,
      { expiresIn: '7d' }
    )

    const { password_hash, ...safeUser } = user
    res.json({ user: safeUser, token, isNew: user.phone?.startsWith('google_') })
  } catch (err) {
    res.status(500).json({ error: 'Google authentication failed' })
  }
})

export default router
