import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ScrollText, ArrowDownRight, Plus, ChevronRight, AlertTriangle } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import Badge from '../../components/ui/Badge'
import { formatGHS, formatDate } from '../../utils/format'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

export default function LandlordDashboard() {
  const { user } = useAuth()
  const [properties, setProperties] = useState([])
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [propRes, leaseRes] = await Promise.all([
          api.get('/properties/mine'),
          api.get('/leases/mine'),
        ])
        setProperties(propRes.data)
        setLeases(leaseRes.data)
      } catch {} finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const activeLeases = leases.filter(l => l.status === 'active')
  const totalCollected = leases.reduce((sum, l) => sum + Number(l.escrow_balance || 0), 0)
  const nextDisbursement = activeLeases.reduce((sum, l) => sum + Number(l.monthly_amount || 0), 0)

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {!user?.is_verified && properties.length > 0 && (
        <GlassCard className="border-orange-300 bg-orange-50/30">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-700 text-sm">Properties Hidden</p>
              <p className="text-xs text-text-muted mt-1">Your property listings are hidden from tenants until you complete verification.</p>
              <Link to="/dashboard/kyc" className="text-xs text-primary font-semibold mt-2 inline-block">
                Verify your account now &rarr;
              </Link>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-2 gap-3">
        <GlassCard>
          <span className="text-xs text-text-muted uppercase tracking-wider">Total Properties</span>
          <p className="text-3xl font-bold text-primary-400 mt-1">{properties.length}</p>
        </GlassCard>
        <GlassCard>
          <span className="text-xs text-text-muted uppercase tracking-wider">Active Leases</span>
          <p className="text-3xl font-bold text-primary mt-1">{activeLeases.length}</p>
        </GlassCard>
      </div>

      <GlassCard glow="primary">
        <span className="text-xs text-text-muted uppercase tracking-wider">Next Disbursement</span>
        <p className="text-2xl font-bold text-primary mt-1">{formatGHS(nextDisbursement)}</p>
        <p className="text-xs text-text-muted mt-1">Expected in 5 days</p>
      </GlassCard>

      <GlassCard glow="primary">
        <span className="text-xs text-text-muted uppercase tracking-wider">Total Collected YTD</span>
        <p className="text-2xl font-bold text-primary-400 mt-1">{formatGHS(totalCollected)}</p>
      </GlassCard>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">My Properties</h2>
          <Link to="/dashboard/properties" className="text-xs text-primary font-semibold flex items-center gap-1">
            VIEW ALL <ChevronRight size={14} />
          </Link>
        </div>

        {properties.length === 0 ? (
          <GlassCard className="text-center py-6">
            <Building2 size={32} className="text-text-dim mx-auto mb-2" />
            <p className="text-text-muted text-sm">No properties added yet</p>
            <Link to="/dashboard/properties/new" className="text-primary text-sm font-semibold mt-2 inline-block">
              Add your first property
            </Link>
          </GlassCard>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
            {properties.slice(0, 4).map(prop => (
              <GlassCard key={prop.id} className="min-w-[200px] flex-shrink-0">
                <div className="h-24 bg-surface-border/30 rounded-xl mb-3 flex items-center justify-center">
                  <Building2 size={32} className="text-text-dim" />
                </div>
                <Badge variant={prop.status === 'occupied' ? 'success' : prop.status === 'vacant' ? 'info' : 'warning'}>
                  {prop.status?.toUpperCase()}
                </Badge>
                <h3 className="font-semibold text-sm mt-2 truncate">{prop.address}</h3>
                <p className="text-xs text-text-muted">{prop.region} &bull; {prop.bedrooms} Bedroom</p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-bold text-lg mb-4">Upcoming Disbursements</h2>
        <div className="space-y-3">
          {activeLeases.length === 0 ? (
            <GlassCard>
              <p className="text-text-muted text-sm text-center py-4">No active leases</p>
            </GlassCard>
          ) : (
            activeLeases.map(lease => (
              <GlassCard key={lease.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{lease.properties?.address || 'Property'}</p>
                  <p className="text-xs text-text-muted">{formatDate(lease.start_date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{formatGHS(lease.monthly_amount)}</p>
                  <Badge variant="warning">Processing</Badge>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>

      <Link
        to="/dashboard/properties/new"
        className="fixed bottom-20 right-5 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg primary-glow active:scale-90 transition-transform z-40"
      >
        <Plus size={24} className="text-white" />
      </Link>
    </div>
  )
}
