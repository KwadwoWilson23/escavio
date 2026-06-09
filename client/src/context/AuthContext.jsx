import { createContext, useState, useEffect } from 'react'
import api from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('escavio_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('escavio_token')
    if (token && !user) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data)
          localStorage.setItem('escavio_user', JSON.stringify(res.data))
        })
        .catch(() => {
          localStorage.removeItem('escavio_token')
          localStorage.removeItem('escavio_user')
        })
    }
  }, [])

  async function login(phone, password) {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { phone, password })
      localStorage.setItem('escavio_token', data.token)
      localStorage.setItem('escavio_user', JSON.stringify(data.user))
      setUser(data.user)
      return data
    } finally {
      setLoading(false)
    }
  }

  async function register(userData) {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', userData)
      localStorage.setItem('escavio_token', data.token)
      localStorage.setItem('escavio_user', JSON.stringify(data.user))
      setUser(data.user)
      return data
    } finally {
      setLoading(false)
    }
  }

  async function loginWithGoogle(credential) {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/google', { credential })
      localStorage.setItem('escavio_token', data.token)
      localStorage.setItem('escavio_user', JSON.stringify(data.user))
      setUser(data.user)
      return data
    } finally {
      setLoading(false)
    }
  }

  async function refreshUser() {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data)
      localStorage.setItem('escavio_user', JSON.stringify(data))
    } catch {}
  }

  function logout() {
    localStorage.removeItem('escavio_token')
    localStorage.removeItem('escavio_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
