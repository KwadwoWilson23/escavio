import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, ArrowDownRight, ArrowUpRight, ChevronRight, Zap, Search, CheckCircle, Building2, MapPin, Shield, Loader2, AlertCircle, Smartphone } from 'lucide-react'
import { DashboardSkeleton } from '../../components/ui/Skeleton'
import GlassCard from '../../components/ui/GlassCard'
import Badge from '../../components/ui/Badge'
import ProgressRing from '../../components/ui/ProgressRing'
import { formatGHS, formatDate } from '../../utils/format'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

function detectNetwork(phone) {
  const digits = phone.replace(/\D/g, '')
  const prefix = digits.startsWith('233') ? digits.slice(3, 5) : digits.startsWith('0') ? digits.slice(1, 3) : digits.slice(0, 2)
  if (['24', '25', '53', '54', '55', '59'].includes(prefix)) return { name: 'MTN MoMo', color: 'bg-yellow-400' }
  if (['20', '50'].includes(prefix)) return { name: 'Telecel Cash', color: 'bg-red-500' }
  if (['26', '27', '56', '57'].includes(prefix)) return { name: 'AirtelTigo', color: 'bg-blue-500' }
  return { name: 'Mobile Money', color: 'bg-gray-400' }
}

export default function TenantDashboard() {
  const [lease, setLease] = useState(null)
  const [pendingLeases, setPendingLeases] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(null)
  const [acceptError, setAcceptError] = useState('')
  const [depositStep, setDepositStep] = useState(null)
  const [depositPaymentId, setDepositPaymentId] = useState(null)
  const pollRef = useRef(null)
  const { user } = useAuth()

  useEffect(() => {
    async function load() {
      try {
        const { data: leases } = await api.get('/leases/mine')
        const active = leases.find(l => l.status === 'active')
        const accepted = leases.find(l => l.status === 'accepted')
        const pending = leases.filter(l => l.status === 'pending')
        setPendingLeases(pending)
        const current = active || accepted || leases.find(l => !['pending'].includes(l.status))
        if (current) {
          setLease(current)
          const { data: pays } = await api.get(`/payments/lease/${current.id}`)
          setPayments(pays)
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    load()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  async function handleAccept(leaseId) {
    setAccepting(leaseId)
    setAcceptError('')
    try {
      const { data } = await api.post(`/leases/${leaseId}/accept`)
      setLease(data.lease || data)
      setPendingLeases(prev => prev.filter(l => l.id !== leaseId))
    } catch (err) {
      setAcceptError(err.response?.data?.error || 'Failed to accept lease')
    } finally {
      setAccepting(null)
    }
  }

  async function handlePayDeposit() {
    if (!lease) return
    setDepositStep('initiating')
    try {
      const { data } = await api.post('/payments/security-deposit', { lease_id: lease.id })
      setDepositPaymentId(data.payment?.id)
      setDepositStep('waiting')
      let count = 0
      pollRef.current = setInterval(async () => {
        count++
        try {
          const { data: status } = await api.get(`/payments/status/${data.payment?.id}`)
          if (status.status === 'success') {
            clearInterval(pollRef.current)
            setDepositStep('success')
            setLease(prev => ({ ...prev, status: 'active', security_deposit: prev.monthly_amount }))
          } else if (status.status === 'failed') {
            clearInterval(pollRef.current)
            setDepositStep('failed')
          }
        } catch {}
        if (count >= 24) {
          clearInterval(pollRef.current)
          setDepositStep('timeout')
        }
      }, 5000)
    } catch (err) {
      setDepositStep('failed')
    }
  }

  const paidMonths = payments.filter(p => p.type === 'tenant_collection' && p.status === 'success').length
  const totalMonths = lease?.advance_months || 6
  const escrowBalance = lease?.escrow_balance || 0
  const monthlyAmount = lease?.monthly_amount || 0
  const network = user?.phone ? detectNetwork(user.phone) : null
  const isAccepted = lease?.status === 'accepted'
  const isActive = lease?.status === 'active'

  if (loading) return <DashboardSkeleton />

  return (
    <div className="space-y-6">
      {acceptError && (
        <GlassCard className="border-red-300 bg-red-50/50">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">{acceptError}</p>
              {acceptError.includes('KYC') && (
                <Link to="/dashboard/kyc" className="text-xs text-primary font-semibold mt-1 inline-block">
                  Complete Verification &rarr;
                </Link>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {pendingLeases.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-3">Lease Invitations</h2>
          <div className="space-y-3">
            {pendingLeases.map(pl => (
              <GlassCard key={pl.id} className="border-primary/30">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{pl.properties?.address || 'Property'}</p>
                    <div className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
                      <MapPin size={10} /> {pl.properties?.region || 'Ghana'}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm font-bold text-primary">{formatGHS(pl.monthly_amount)}/mo</span>
                      <span className="text-xs text-text-muted">by {pl.landlord?.full_name || 'Landlord'}</span>
                    </div>
                    <p className="text-[10px] text-text-dim mt-1">Security deposit of {formatGHS(pl.monthly_amount)} required on acceptance</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAccept(pl.id)}
                        disabled={accepting === pl.id}
                        className="flex-1 bg-primary text-white text-sm font-semibold py-2 rounded-full flex items-center justify-center gap-1"
                      >
                        {accepting === pl.id ? 'Accepting...' : <><CheckCircle size={14} /> Accept Lease</>}
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {isAccepted && !depositStep && (
        <GlassCard glow="primary" className="border-primary/40">
          <div className="text-center space-y-3">
            <Shield size={36} className="text-primary mx-auto" />
            <h2 className="text-lg font-bold">Security Deposit Required</h2>
            <p className="text-sm text-text-muted max-w-xs mx-auto">
              Pay a security deposit of <strong className="text-primary">{formatGHS(monthlyAmount)}</strong> (1 month's rent) to activate your lease for {lease.properties?.address || 'the property'}.
            </p>
            <p className="text-xs text-text-dim">This deposit is held in escrow and protects both you and your landlord.</p>
            <button
              onClick={handlePayDeposit}
              className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4 mt-2"
            >
              <Shield size={18} /> Pay Security Deposit {formatGHS(monthlyAmount)}
            </button>
          </div>
        </GlassCard>
      )}

      {depositStep === 'initiating' && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 size={48} className="text-primary animate-spin" />
          <p className="text-text-muted font-medium">Connecting to {network?.name || 'Mobile Money'}...</p>
        </div>
      )}

      {depositStep === 'waiting' && (
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <div className="w-24 h-24 rounded-full bg-yellow-50 flex items-center justify-center relative">
            <Smartphone size={40} className="text-yellow-600" />
            <div className="absolute inset-0 rounded-full border-4 border-yellow-200 border-t-yellow-500 animate-spin" style={{ animationDuration: '2s' }} />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold">Approve Security Deposit</h2>
            <p className="text-sm text-text-muted mt-2">
              A payment prompt of <strong>{formatGHS(monthlyAmount)}</strong> has been sent to your phone. Enter your PIN to confirm.
            </p>
          </div>
        </div>
      )}

      {depositStep === 'success' && (
        <GlassCard glow="success" className="text-center py-6">
          <CheckCircle size={48} className="text-accent-success mx-auto mb-3" />
          <h2 className="text-xl font-bold">Deposit Paid!</h2>
          <p className="text-sm text-text-muted mt-2">Your lease is now active. You can start paying rent.</p>
        </GlassCard>
      )}

      {depositStep === 'failed' && (
        <GlassCard className="text-center py-6 border-red-200">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold">Deposit Payment Failed</h2>
          <p className="text-sm text-text-muted mt-2">Please check your balance and try again.</p>
          <button onClick={() => setDepositStep(null)} className="btn-primary mt-4 px-8">Try Again</button>
        </GlassCard>
      )}

      {(isActive || depositStep === 'success') && (
        <>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
            <GlassCard className="min-w-[200px] flex-shrink-0" glow="primary">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Escrow Balance</span>
                <Wallet size={16} className="text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary">{formatGHS(escrowBalance)}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-text-muted">Portfolio Growth</span>
                <ProgressRing current={paidMonths} total={totalMonths} size={48} strokeWidth={4} />
              </div>
            </GlassCard>

            <GlassCard className="min-w-[180px] flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Next Payment</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">{formatGHS(monthlyAmount)}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="warning">DUE SOON</Badge>
                <span className="text-[10px] text-text-dim">1% fee applies</span>
              </div>
            </GlassCard>
          </div>

          <Link
            to="/dashboard/pay"
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
          >
            <Zap size={20} /> Quick Pay
          </Link>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-text-primary">Recent Activity</h2>
              <Link to="/dashboard/lease" className="text-xs text-primary font-semibold flex items-center gap-1">
                VIEW ALL <ChevronRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {payments.length === 0 && (
                <GlassCard>
                  <p className="text-text-muted text-sm text-center py-4">No payments yet</p>
                </GlassCard>
              )}
              {payments.filter(p => p.type !== 'fee').slice(0, 5).map(payment => {
                const isCollection = payment.type === 'tenant_collection'
                const isDeposit = payment.type === 'security_deposit'
                return (
                  <GlassCard key={payment.id} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isDeposit ? 'bg-blue-50' : isCollection ? 'bg-primary/10' : 'bg-green-50'
                    }`}>
                      {isDeposit
                        ? <Shield size={18} className="text-primary" />
                        : isCollection
                        ? <ArrowUpRight size={18} className="text-primary" />
                        : <ArrowDownRight size={18} className="text-accent-success" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-text-primary truncate">
                        {isDeposit ? 'Security Deposit' : isCollection ? 'Rent Payment' : 'Disbursement'}
                      </p>
                      <p className="text-xs text-text-muted">{formatDate(payment.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isCollection || isDeposit ? 'text-primary' : 'text-accent-success'}`}>
                        {isCollection || isDeposit ? '-' : '+'}{formatGHS(payment.amount)}
                      </p>
                      <Badge variant={payment.status === 'success' ? 'success' : payment.status === 'pending' ? 'warning' : 'danger'}>
                        {payment.status.toUpperCase()}
                      </Badge>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          </div>
        </>
      )}

      {!lease && !depositStep && (
        <div className="space-y-6">
          <GlassCard className="text-center py-8">
            <Building2 size={48} className="text-text-dim mx-auto mb-3" />
            <h2 className="text-lg font-bold">Welcome to Escavio</h2>
            <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
              Browse available properties and find your next home. Once your landlord creates a lease, you'll see it here.
            </p>
            <Link
              to="/dashboard/browse"
              className="btn-primary inline-flex items-center gap-2 mt-4 px-6"
            >
              <Search size={16} /> Browse Properties
            </Link>
          </GlassCard>

          <GlassCard className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">1</span>
            </div>
            <div>
              <p className="font-semibold text-sm">Browse & Contact</p>
              <p className="text-xs text-text-muted mt-0.5">Find properties and contact landlords directly</p>
            </div>
          </GlassCard>
          <GlassCard className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">2</span>
            </div>
            <div>
              <p className="font-semibold text-sm">Accept Lease & Pay Deposit</p>
              <p className="text-xs text-text-muted mt-0.5">Accept the lease invite and pay 1 month security deposit</p>
            </div>
          </GlassCard>
          <GlassCard className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">3</span>
            </div>
            <div>
              <p className="font-semibold text-sm">Pay Securely</p>
              <p className="text-xs text-text-muted mt-0.5">Pay rent via MoMo into protected escrow (1% platform fee)</p>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
