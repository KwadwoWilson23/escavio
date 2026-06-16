import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../hooks/useAuth'
import { Phone, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login, loginWithGoogle, loading } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await login(phone, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-5 pt-12 pb-6">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Escavio" className="w-8 h-8 rounded-lg object-contain" />
          <span className="text-xl font-bold text-primary">Escavio</span>
        </Link>
      </header>

      <main className="flex-1 px-5 max-w-lg mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
          <p className="text-text-muted text-sm mt-1">Secure access to your rental portfolio</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Phone Number</label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="tel"
                placeholder="024 123 4567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full pl-11"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text-muted tracking-wider uppercase">Password</label>
              <button type="button" className="text-xs text-primary font-medium">Forgot password?</button>
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-11"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 text-lg">
            {loading ? 'Signing in...' : 'Log In'} <ArrowRight size={20} />
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-surface-border" />
          <span className="text-xs text-text-dim">or continue with</span>
          <div className="flex-1 h-px bg-surface-border" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (response) => {
              setError('')
              try {
                const data = await loginWithGoogle(response.credential)
                navigate(data.isNew ? '/complete-profile' : '/dashboard')
              } catch (err) {
                setError('Google sign-in failed. Try again.')
              }
            }}
            onError={() => setError('Google sign-in failed')}
            shape="pill"
            size="large"
            width="320"
            text="continue_with"
          />
        </div>

        <p className="text-center text-sm text-text-muted mt-6 pb-8">
          Don't have an account? <Link to="/register" className="text-primary font-semibold">Sign up now</Link>
        </p>
      </main>
    </div>
  )
}
