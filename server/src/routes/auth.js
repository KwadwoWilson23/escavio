import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'
import env from '../config/env.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { full_name, phone, email, password, role, ghana_card_number } = req.body

    if (!full_name || !phone || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (!['landlord', 'tenant'].includes(role)) {
      return res.status(400).json({ error: 'Role must be landlord or tenant' })
    }

    const password_hash = await bcrypt.hash(password, 12)

    const { data, error } = await supabase
      .from('users')
      .insert({ full_name, phone, email, password_hash, role, ghana_card_number })
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
    res.status(500).json({ error: 'Registration failed', detail: err.message })
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

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
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

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body
    if (!credential) return res.status(400).json({ error: 'Google credential required' })

    const { data: tokenInfo } = await (await import('axios')).default.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    )

    const { email, name, sub: googleId, picture } = tokenInfo

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
            full_name: name,
            email,
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
