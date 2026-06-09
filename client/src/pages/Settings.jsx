import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Lock, FileText, Shield, Info, ChevronRight, Check } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import api from '../services/api'

export default function Settings() {
  const [showPassword, setShowPassword] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  async function handlePasswordChange(e) {
    e.preventDefault()
    if (passwords.newPass !== passwords.confirm) {
      setMessage('Passwords do not match')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      await api.patch('/auth/password', {
        current_password: passwords.current,
        new_password: passwords.newPass,
      })
      setMessage('Password updated successfully')
      setPasswords({ current: '', newPass: '', confirm: '' })
      setShowPassword(false)
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Account</h3>
        <div className="space-y-2">
          <GlassCard onClick={() => setShowPassword(!showPassword)} className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-text-muted" />
              <span className="font-medium text-sm">Change Password</span>
            </div>
            <ChevronRight size={16} className="text-text-dim" />
          </GlassCard>

          {showPassword && (
            <form onSubmit={handlePasswordChange} className="glass-card p-5 space-y-4">
              {message && (
                <div className={`px-4 py-2 rounded-xl text-sm ${message.includes('success') ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-400'}`}>
                  {message}
                </div>
              )}
              <input
                type="password"
                placeholder="Current password"
                value={passwords.current}
                onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                className="w-full"
                required
              />
              <input
                type="password"
                placeholder="New password"
                value={passwords.newPass}
                onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
                className="w-full"
                required
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwords.confirm}
                onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                className="w-full"
                required
              />
              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Legal</h3>
        <div className="space-y-2">
          <Link to="/terms">
            <GlassCard className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-text-muted" />
                <span className="font-medium text-sm">Terms & Conditions</span>
              </div>
              <ChevronRight size={16} className="text-text-dim" />
            </GlassCard>
          </Link>
          <Link to="/privacy">
            <GlassCard className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-text-muted" />
                <span className="font-medium text-sm">Privacy Policy</span>
              </div>
              <ChevronRight size={16} className="text-text-dim" />
            </GlassCard>
          </Link>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">About</h3>
        <GlassCard className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Info size={18} className="text-text-muted" />
            <div>
              <p className="font-medium text-sm">Escavio</p>
              <p className="text-xs text-text-dim">Version 1.0.0 &bull; Powered by Moolre</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
