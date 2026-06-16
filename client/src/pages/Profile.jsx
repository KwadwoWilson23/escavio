import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { CheckCircle, Eye, EyeOff, Edit2, LogOut, CreditCard, FileText, ShieldCheck, ArrowRight, Shield } from 'lucide-react'
import { useState } from 'react'
import GlassCard from '../components/ui/GlassCard'
import Badge from '../components/ui/Badge'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showCard, setShowCard] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

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
        <button className="flex-1 btn-primary flex items-center justify-center gap-2 py-3">
          <Edit2 size={16} /> Edit Profile
        </button>
        <button onClick={() => setShowLogoutConfirm(true)} className="flex-1 bg-red-50 border border-red-200 text-red-600 font-semibold py-3 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all">
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Account Settings</h3>
        <div className="space-y-2">
          {[
            { icon: CreditCard, label: 'Payment Methods', to: '/dashboard/pay' },
            { icon: FileText, label: 'Lease Documents', to: '/dashboard/lease' },
            { icon: ShieldCheck, label: 'Security & Privacy', to: '/settings' },
          ].map(({ icon: Icon, label, to }) => (
            <Link key={label} to={to}>
              <GlassCard className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-text-muted" />
                  <span className="font-medium text-sm text-text-primary">{label}</span>
                </div>
                <ArrowRight size={16} className="text-text-dim" />
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
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
    </div>
  )
}
