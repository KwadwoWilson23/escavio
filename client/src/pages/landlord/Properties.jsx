import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus, MapPin, CheckCircle, Home, BedDouble, Store, LayoutGrid } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import Badge from '../../components/ui/Badge'
import { formatGHS } from '../../utils/format'
import api from '../../services/api'

const typeIcons = {
  apartment: Building2,
  house: Home,
  room: BedDouble,
  studio: LayoutGrid,
  shop: Store,
}

export default function Properties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/properties/mine').then(({ data }) => setProperties(data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Properties</h1>
        <Link to="/dashboard/properties/new" className="btn-primary text-sm flex items-center gap-1 py-2 px-4">
          <Plus size={16} /> Add
        </Link>
      </div>

      {properties.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Building2 size={48} className="text-text-dim mx-auto mb-3" />
          <p className="text-text-muted">No properties yet</p>
          <Link to="/dashboard/properties/new" className="text-primary text-sm font-semibold mt-2 inline-block">Add your first property</Link>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {properties.map(prop => {
            const Icon = typeIcons[prop.property_type] || Building2
            return (
              <Link key={prop.id} to={`/dashboard/properties/${prop.id}`}>
                <GlassCard className="flex gap-4">
                  <div className="w-20 h-20 bg-surface-border/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon size={28} className="text-text-dim" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={prop.status === 'occupied' ? 'success' : prop.status === 'vacant' ? 'info' : 'warning'}>
                        {prop.status?.toUpperCase()}
                      </Badge>
                      {prop.document_verified && (
                        <span className="flex items-center gap-0.5 text-[10px] text-accent-success font-semibold">
                          <CheckCircle size={10} /> VERIFIED
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold mt-1 truncate">{prop.address}</h3>
                    <div className="flex items-center gap-1 text-xs text-text-muted mt-1">
                      <MapPin size={12} /> {prop.region} &bull; {prop.bedrooms} BR
                    </div>
                    <p className="text-sm font-bold text-primary mt-1">{formatGHS(prop.monthly_rent)}/mo</p>
                  </div>
                </GlassCard>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
