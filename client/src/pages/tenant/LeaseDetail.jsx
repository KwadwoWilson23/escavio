import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, CheckCircle, Circle, AlertTriangle, Brain, ExternalLink } from 'lucide-react'
import { DetailSkeleton } from '../../components/ui/Skeleton'
import GlassCard from '../../components/ui/GlassCard'
import Badge from '../../components/ui/Badge'
import { formatGHS, formatDate } from '../../utils/format'
import api from '../../services/api'

export default function LeaseDetail() {
  const [lease, setLease] = useState(null)
  const [payments, setPayments] = useState([])
  const [aiSummary, setAiSummary] = useState('')
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
          try {
            const { data: ai } = await api.post('/ai/summarize-lease', { lease_id: active.id })
            setAiSummary(ai.summary)
          } catch {}
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <DetailSkeleton />

  if (!lease) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <p className="text-text-muted">No active lease found</p>
        <Link to="/dashboard" className="text-primary text-sm font-semibold">Back to Dashboard</Link>
      </div>
    )
  }

  const payoutLabels = { monthly: 'Monthly Disbursement', lump_sum: 'Lump Sum', hybrid: 'Hybrid (50/50)' }

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="success">ACTIVE LEASE</Badge>
          <Badge variant="info">{payoutLabels[lease.payout_mode] || 'Monthly'}</Badge>
        </div>
        <h2 className="text-lg font-bold mt-2">{lease.properties?.address || 'Property'}</h2>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <span className="text-xs text-text-muted uppercase tracking-wider">Monthly Rent</span>
            <p className="text-xl font-bold text-primary">{formatGHS(lease.monthly_amount)}</p>
          </div>
          <div>
            <span className="text-xs text-text-muted uppercase tracking-wider">Landlord</span>
            <p className="font-medium">{lease.landlord?.full_name || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 text-sm text-text-muted">
          <Calendar size={14} />
          {formatDate(lease.start_date)} - {formatDate(lease.end_date)}
        </div>
      </GlassCard>

      {aiSummary && (
        <GlassCard glow="primary">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={18} className="text-primary-400" />
            <h3 className="font-bold text-primary-400">AI Lease Summary</h3>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">{aiSummary}</p>
          <button className="flex items-center gap-1 text-xs text-primary font-semibold mt-3">
            View full document <ExternalLink size={12} />
          </button>
        </GlassCard>
      )}

      <div>
        <h3 className="font-bold text-lg mb-4">Payment Timeline</h3>
        <div className="space-y-0">
          {Array.from({ length: lease.advance_months || 6 }, (_, i) => {
            const monthDate = new Date(lease.start_date)
            monthDate.setMonth(monthDate.getMonth() + i)
            const monthLabel = monthDate.toLocaleDateString('en-GH', { month: 'long', year: 'numeric' })

            const payment = payments
              .filter(p => p.type === 'tenant_collection')
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[i]

            const isPaid = payment?.status === 'success'
            const isOverdue = payment?.status === 'overdue'
            const isCurrent = !isPaid && !isOverdue && i === payments.filter(p => p.type === 'tenant_collection' && p.status === 'success').length

            return (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {isPaid ? (
                    <CheckCircle size={22} className="text-primary" />
                  ) : isOverdue ? (
                    <AlertTriangle size={22} className="text-orange-400" />
                  ) : (
                    <Circle size={22} className={isCurrent ? 'text-primary-400' : 'text-white-border'} />
                  )}
                  {i < (lease.advance_months || 6) - 1 && (
                    <div className={`w-0.5 h-12 ${isPaid ? 'bg-primary/30' : 'bg-surface-border'}`} />
                  )}
                </div>
                <div className={`pb-6 ${isCurrent ? 'glass-card p-3 -mt-1 flex-1' : 'flex-1'}`}>
                  <p className={`font-semibold text-sm ${isCurrent ? 'text-primary-400' : ''}`}>{monthLabel}</p>
                  {isPaid && (
                    <p className="text-xs text-primary">Paid &bull; {formatDate(payment.paid_at || payment.created_at)}</p>
                  )}
                  {isOverdue && (
                    <p className="text-xs text-orange-400">Overdue</p>
                  )}
                  {isCurrent && (
                    <Link to="/dashboard/pay" className="inline-block mt-2 px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-full">
                      Pay Now
                    </Link>
                  )}
                  {!isPaid && !isOverdue && !isCurrent && (
                    <p className="text-xs text-text-dim">{formatGHS(lease.monthly_amount)}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
