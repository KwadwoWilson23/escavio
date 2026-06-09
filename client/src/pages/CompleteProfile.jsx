import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Phone, Building2, Home, ArrowRight, Shield } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import api from '../services/api'

export default function CompleteProfile() {
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!phone || phone.replace(/\D/g, '').length < 9) {
      setError('Please enter a valid Ghanaian phone number')
      return
    }

    if (!role) {
      setError('Please select your role')
      return
    }

    setSaving(true)
    try {
      await api.patch('/auth/complete-profile', { phone, role })
      await refreshUser()
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-sm text-text-muted mt-2">We need your phone number for MoMo payments and SMS notifications.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">
              Mobile Money Number
            </label>
            <div className="flex gap-2">
              <div className="bg-surface-card border border-surface-border rounded-xl px-3 py-3 text-text-muted text-sm font-medium flex-shrink-0 flex items-center gap-1">
                <Phone size={14} />
                +233
              </div>
              <input
                type="tel"
                placeholder="24 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                maxLength={12}
              />
            </div>
            <p className="text-[10px] text-text-dim mt-1">This number will receive MoMo payment prompts and SMS alerts</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-3 block">
              I am a...
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('tenant')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                  role === 'tenant'
                    ? 'border-primary bg-primary/5'
                    : 'border-surface-border bg-surface-card'
                }`}
              >
                <Home size={28} className={role === 'tenant' ? 'text-primary' : 'text-text-dim'} />
                <span className={`text-sm font-semibold ${role === 'tenant' ? 'text-primary' : 'text-text-muted'}`}>Tenant</span>
                <span className="text-[10px] text-text-dim">I pay rent</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('landlord')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                  role === 'landlord'
                    ? 'border-primary bg-primary/5'
                    : 'border-surface-border bg-surface-card'
                }`}
              >
                <Building2 size={28} className={role === 'landlord' ? 'text-primary' : 'text-text-dim'} />
                <span className={`text-sm font-semibold ${role === 'landlord' ? 'text-primary' : 'text-text-muted'}`}>Landlord</span>
                <span className="text-[10px] text-text-dim">I collect rent</span>
              </button>
            </div>
          </div>

          {error && (
            <GlassCard className="border-red-200 bg-red-50">
              <p className="text-sm text-red-600">{error}</p>
            </GlassCard>
          )}

          <button
            type="submit"
            disabled={saving || !phone || !role}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Continue to Dashboard'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
