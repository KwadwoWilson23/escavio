import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ScrollText, Plus } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import Badge from '../../components/ui/Badge'
import { formatGHS, formatDate } from '../../utils/format'
import api from '../../services/api'

export default function Leases() {
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/leases/mine').then(({ data }) => setLeases(data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statusVariant = { active: 'success', pending: 'warning', completed: 'info', disputed: 'danger', at_risk: 'danger' }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Leases</h1>
        <Link to="/dashboard/leases/new" className="btn-primary text-sm flex items-center gap-1 py-2 px-4">
          <Plus size={16} /> New
        </Link>
      </div>

      {leases.length === 0 ? (
        <GlassCard className="text-center py-12">
          <ScrollText size={48} className="text-text-dim mx-auto mb-3" />
          <p className="text-text-muted">No leases yet</p>
          <Link to="/dashboard/leases/new" className="text-primary text-sm font-semibold mt-2 inline-block">Create your first lease</Link>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {leases.map(lease => (
            <GlassCard key={lease.id}>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={statusVariant[lease.status] || 'neutral'}>
                  {lease.status?.toUpperCase()}
                </Badge>
                <span className="text-xs text-text-muted">{lease.payout_mode}</span>
              </div>
              <h3 className="font-semibold">{lease.properties?.address || 'Property'}</h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-text-muted">
                  {lease.tenant?.full_name || 'No tenant assigned'}
                </span>
                <span className="font-bold text-primary">{formatGHS(lease.monthly_amount)}/mo</span>
              </div>
              <div className="text-xs text-text-dim mt-2">
                {formatDate(lease.start_date)} - {formatDate(lease.end_date)}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
