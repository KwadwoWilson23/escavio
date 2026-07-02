import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { CheckCircle, Eye, EyeOff, Edit2, LogOut, CreditCard, FileText, ShieldCheck, ArrowRight, Shield, Download, Smartphone, X, MessageSquare, AlertTriangle, FolderCheck } from 'lucide-react'
import { useState } from 'react'
import GlassCard from '../components/ui/GlassCard'
import Badge from '../components/ui/Badge'
import { usePWA } from '../hooks/usePWA'
import api from '../services/api'

export default function Profile() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [showCard, setShowCard] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' })
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const { canInstall, isInstalled, install } = usePWA()

  function openEditProfile() {
    setEditForm({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
    })
    setEditError('')
    setShowEditProfile(true)
  }

  async function handleEditSave() {
    setEditError('')
    const trimmedName = editForm.full_name.trim()
    if (!trimmedName || trimmedName.length < 2) {
      return setEditError('Name must be at least 2 characters')
    }
    if (!editForm.phone || editForm.phone.replace(/\D/g, '').length < 7) {
      return setEditError('Enter a valid phone number')
    }
    setEditSaving(true)
    try {
      await api.patch('/auth/profile', {
        full_name: trimmedName,
        phone: editForm.phone.trim(),
      })
      await refreshUser()
      setShowEditProfile(false)
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setEditSaving(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  const maskedCard = user?.ghana_card_number
    ? `GHA-${user.ghana_card_number.slice(4, 7)}****-${user.ghana_card_number.slice(-1)}`
    : 'Not provided'

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center pt-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-2xl font-bold text-primary relative">
          {user?.full_name?.[0] || 'U'}
          <span className="absolute bottom-0 right-0 w-5 h-5 bg-accent-success rounded-full border-2 border-white" />
        </div>
        <h1 className="text-xl font-bold mt-3 text-text-primary">{user?.full_name || 'User'}</h1>
        <Badge variant={user?.role === 'landlord' ? 'info' : 'success'} className="mt-1 uppercase">
          {user?.role || 'tenant'}
        </Badge>
      </div>

      {user?.is_verified ? (
        <GlassCard glow="success">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted uppercase tracking-wider">Verification Status</span>
            <CheckCircle size={20} className="text-accent-success" />
          </div>
          <p className="font-semibold mt-1 text-accent-success">Verified KYC</p>
        </GlassCard>
      ) : (
        <Link to="/dashboard/kyc">
          <GlassCard className="border-orange-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                  <Shield size={20} className="text-accent-warning" />
                </div>
                <div>
                  <p className="font-semibold text-accent-warning">KYC Pending</p>
                  <p className="text-xs text-text-muted">Verify your Ghana Card to unlock all features</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-accent-warning" />
            </div>
          </GlassCard>
        </Link>
      )}

      <GlassCard>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-muted uppercase tracking-wider">Ghana Card (National ID)</span>
          <button onClick={() => setShowCard(!showCard)} className="text-text-dim">
            {showCard ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="font-mono text-lg font-semibold mt-1 text-text-primary">
          {showCard ? (user?.ghana_card_number || 'Not provided') : maskedCard}
        </p>
        <p className="text-xs text-text-dim mt-2">Authenticated via National Identification Authority</p>
      </GlassCard>

      <div className="flex gap-3">
        <button onClick={openEditProfile} className="flex-1 btn-primary flex items-center justify-center gap-2 py-3">
          <Edit2 size={16} /> Edit Profile
        </button>
        <button onClick={() => setShowLogoutConfirm(true)} className="flex-1 bg-red-50 border border-red-200 text-red-600 font-semibold py-3 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all">
          <LogOut size={16} /> Logout
        </button>
      </div>

      {canInstall && (
        <GlassCard glow="primary" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Download size={22} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-text-primary">Install Escavio App</p>
            <p className="text-xs text-text-muted mt-0.5">Add to your home screen for quick access</p>
          </div>
          <button
            onClick={install}
            className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-full flex-shrink-0 active:scale-95 transition-all"
          >
            Install
          </button>
        </GlassCard>
      )}

      {isInstalled && (
        <div className="flex items-center gap-2 px-1">
          <Smartphone size={14} className="text-accent-success" />
          <span className="text-xs text-accent-success font-medium">App installed</span>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Account Settings</h3>
        <div className="space-y-3">
          {[
            { icon: FolderCheck, label: 'Verification Documents', to: '/dashboard/documents' },
            { icon: CreditCard, label: 'Payment Methods', to: '/dashboard/pay' },
            { icon: FileText, label: 'Lease Documents', to: '/dashboard/lease' },
            { icon: AlertTriangle, label: 'Disputes', to: '/dashboard/disputes' },
            { icon: MessageSquare, label: 'Ama AI Assistant', to: '/dashboard/agent' },
            { icon: ShieldCheck, label: 'Security & Privacy', to: '/settings' },
          ].map(({ icon: Icon, label, to }) => (
            <Link key={label} to={to} className="block">
              <GlassCard className="flex items-center justify-between py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
                    <Icon size={18} className="text-text-muted" />
                  </div>
                  <span className="font-medium text-sm text-text-primary">{label}</span>
                </div>
                <ArrowRight size={16} className="text-text-dim" />
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-5" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                <LogOut size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Log Out?</h3>
              <p className="text-sm text-text-muted mt-1">Are you sure you want to log out of your Escavio account?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-full font-semibold text-sm bg-surface-card border border-surface-border text-text-primary active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-full font-semibold text-sm bg-red-500 text-white active:scale-95 transition-all"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-5" onClick={() => setShowEditProfile(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary">Edit Profile</h3>
              <button onClick={() => setShowEditProfile(false)} className="text-text-dim">
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-600">
                {editError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full mt-1 px-4 py-3 rounded-xl border border-surface-border bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Your full name"
                />
                <p className="text-[10px] text-text-dim mt-1">Must match your Ghana Card for KYC verification</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full mt-1 px-4 py-3 rounded-xl border border-surface-border bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  placeholder="0XX XXX XXXX"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowEditProfile(false)}
                className="flex-1 py-3 rounded-full font-semibold text-sm bg-surface-card border border-surface-border text-text-primary active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="flex-1 py-3 rounded-full font-semibold text-sm bg-primary text-white active:scale-95 transition-all disabled:opacity-50"
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
