import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../hooks/useAuth'
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function Register() {
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') || 'tenant'
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', password: '', confirm_password: '', ghana_card_number: '' })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const { register, loginWithGoogle, loading } = useAuth()
  const navigate = useNavigate()

  function update(field) {
    return (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) {
      return setError('Passwords do not match')
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters')
    }
    try {
      const { confirm_password, ...submitData } = form
      await register({ ...submitData, role, terms_accepted: true })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="px-5 pt-12 pb-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="Escavio" className="w-9 h-9 rounded-lg" />
          <span className="text-xl font-bold text-primary">Escavio</span>
        </Link>
      </header>

      <main className="px-5 pb-12 max-w-lg mx-auto">
        <h1 className="text-xl font-bold mt-2 text-text-primary">Join the ecosystem</h1>
        <p className="text-text-muted text-sm mt-1">Secure your rental future with Escavio.</p>

        <div className="flex justify-center mt-5">
          <GoogleLogin
            onSuccess={async (response) => {
              setError('')
              setGoogleLoading(true)
              try {
                const data = await loginWithGoogle(response.credential)
                navigate(data.isNew ? '/complete-profile' : '/dashboard')
              } catch (err) {
                setError('Google sign-up failed. Try again.')
                setGoogleLoading(false)
              }
            }}
            onError={() => setError('Google sign-up failed')}
            shape="pill"
            size="large"
            width="320"
            text="signup_with"
          />
        </div>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-surface-border" />
          <span className="text-xs text-text-dim">or register with phone</span>
          <div className="flex-1 h-px bg-surface-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Full Name</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
              <input type="text" placeholder="Kwame Mensah" value={form.full_name} onChange={update('full_name')} className="w-full pl-11" required />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Phone Number</label>
            <div className="flex gap-2">
              <div className="bg-surface-card border border-surface-border rounded-xl px-3 py-3 text-text-muted text-sm font-medium flex-shrink-0">+233</div>
              <input type="tel" placeholder="20 123 4567" value={form.phone} onChange={update('phone')} className="flex-1" required />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
              <input type="email" placeholder="kwame@example.com" value={form.email} onChange={update('email')} className="w-full pl-11" required />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={form.password}
                onChange={update('password')}
                className="w-full pl-11 pr-11"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Confirm Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={form.confirm_password}
                onChange={update('confirm_password')}
                className="w-full pl-11 pr-11"
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.confirm_password && form.password !== form.confirm_password && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Ghana Card (Optional)</label>
            <input type="text" placeholder="GHA-XXXXXXXXX-X" value={form.ghana_card_number} onChange={update('ghana_card_number')} className="w-full" />
          </div>

          <label className="flex items-start gap-3 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-surface-border bg-white accent-primary flex-shrink-0"
            />
            <span className="text-xs text-text-muted leading-relaxed">
              I agree to the <Link to="/terms" className="text-primary underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>
            </span>
          </label>

          <button type="submit" disabled={loading || googleLoading || !termsAccepted} className="btn-primary w-full flex items-center justify-center gap-2 text-lg mt-2 disabled:opacity-50">
            {googleLoading ? 'Signing in...' : loading ? 'Creating...' : 'Create Account'} <ArrowRight size={20} />
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Already have an account? <Link to="/login" className="text-primary font-semibold">Login</Link>
        </p>
      </main>
    </div>
  )
}
