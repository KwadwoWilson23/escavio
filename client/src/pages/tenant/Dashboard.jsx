import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, ArrowDownRight, ArrowUpRight, ChevronRight, Zap } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import Badge from '../../components/ui/Badge'
import ProgressRing from '../../components/ui/ProgressRing'
import { formatGHS, formatDate } from '../../utils/format'
import api from '../../services/api'

export default function TenantDashboard() {
  const [lease, setLease] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data: leases } = await api.get('/leases/mine')
        const active = leases.find(l => l.status === 'active') || leases[0]
        if (active) {
          setLease(active)
          const { data: pays } = await api.get(`/payments/lease/${active.id}`)
          setPayments(pays)
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const paidMonths = payments.filter(p => p.type === 'tenant_collection' && p.status === 'success').length
  const totalMonths = lease?.advance_months || 6
  const escrowBalance = lease?.escrow_balance || 0
  const monthlyAmount = lease?.monthly_amount || 0

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Loading...</div>
  }

  return (
    <div className="space-y-6">
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
          {lease && <Badge variant="warning" className="mt-2">DUE SOON</Badge>}
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
          {payments.slice(0, 5).map(payment => {
            const isCollection = payment.type === 'tenant_collection'
            return (
              <GlassCard key={payment.id} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isCollection ? 'bg-primary/10' : 'bg-green-50'
                }`}>
                  {isCollection
                    ? <ArrowUpRight size={18} className="text-primary" />
                    : <ArrowDownRight size={18} className="text-accent-success" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-text-primary truncate">
                    {isCollection ? 'Rent Payment' : 'Disbursement'}
                  </p>
                  <p className="text-xs text-text-muted">{formatDate(payment.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${isCollection ? 'text-primary' : 'text-accent-success'}`}>
                    {isCollection ? '-' : '+'}{formatGHS(payment.amount)}
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
    </div>
  )
}
