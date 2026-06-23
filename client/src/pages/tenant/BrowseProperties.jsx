import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building2, MapPin, CheckCircle, Home, BedDouble, Store, LayoutGrid, Search, SlidersHorizontal, X } from 'lucide-react'
import { PropertyGridSkeleton } from '../../components/ui/Skeleton'
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

const typeLabels = {
  apartment: 'Apartment',
  house: 'House',
  room: 'Single Room',
  studio: 'Studio',
  shop: 'Shop/Office',
}

const regions = [
  'All Regions', 'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Northern', 'Volta', 'Upper East', 'Upper West', 'Bono',
]

export default function BrowseProperties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('All Regions')
  const [showFilters, setShowFilters] = useState(false)
  const [maxRent, setMaxRent] = useState('')
  const [propertyType, setPropertyType] = useState('')

  useEffect(() => {
    api.get('/properties/available')
      .then(({ data }) => setProperties(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = properties.filter(p => {
    if (search && !p.address.toLowerCase().includes(search.toLowerCase()) && !p.region.toLowerCase().includes(search.toLowerCase())) return false
    if (region !== 'All Regions' && p.region !== region) return false
    if (maxRent && p.monthly_rent > Number(maxRent)) return false
    if (propertyType && p.property_type !== propertyType) return false
    return true
  })

  const activeFilters = [region !== 'All Regions', maxRent, propertyType].filter(Boolean).length

  if (loading) return <PropertyGridSkeleton />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Find a Home</h1>
        <p className="text-sm text-text-muted mt-1">Browse verified properties across Ghana</p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            placeholder="Search by location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 rounded-xl border-2 flex items-center gap-1 text-sm font-medium transition-all ${
            showFilters || activeFilters > 0
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-surface-border text-text-muted'
          }`}
        >
          <SlidersHorizontal size={16} />
          {activeFilters > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">{activeFilters}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Filters</h3>
            <button onClick={() => { setRegion('All Regions'); setMaxRent(''); setPropertyType('') }} className="text-xs text-primary font-semibold">
              Clear All
            </button>
          </div>

          <div>
            <label className="text-xs text-text-muted font-semibold mb-1 block">Region</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full text-sm">
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-text-muted font-semibold mb-1 block">Max Rent (GHS)</label>
            <input
              type="number"
              placeholder="No limit"
              value={maxRent}
              onChange={(e) => setMaxRent(e.target.value)}
              className="w-full text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-text-muted font-semibold mb-1 block">Type</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(typeLabels).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setPropertyType(propertyType === val ? '' : val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    propertyType === val
                      ? 'bg-primary text-white'
                      : 'bg-surface-card border border-surface-border text-text-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      <p className="text-xs text-text-muted">{filtered.length} propert{filtered.length === 1 ? 'y' : 'ies'} available</p>

      {filtered.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Building2 size={48} className="text-text-dim mx-auto mb-3" />
          <p className="text-text-muted">No properties found</p>
          <p className="text-xs text-text-dim mt-1">Try adjusting your filters</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map(prop => {
            const Icon = typeIcons[prop.property_type] || Building2
            const amenities = Array.isArray(prop.amenities) ? prop.amenities : []
            return (
              <Link key={prop.id} to={`/dashboard/browse/${prop.id}`}>
                <GlassCard>
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-surface-border/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon size={28} className="text-text-dim" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="info">{typeLabels[prop.property_type] || 'Property'}</Badge>
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
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
                    <p className="text-lg font-bold text-primary">{formatGHS(prop.monthly_rent)}<span className="text-xs text-text-muted font-normal">/mo</span></p>
                    <span className="flex items-center gap-1 text-[10px] text-accent-success font-semibold">
                      <CheckCircle size={10} /> Verified
                    </span>
                  </div>
                  {amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {amenities.slice(0, 4).map(a => (
                        <span key={a} className="text-[10px] bg-surface px-2 py-0.5 rounded-full text-text-muted capitalize">{a}</span>
                      ))}
                      {amenities.length > 4 && (
                        <span className="text-[10px] text-text-dim">+{amenities.length - 4} more</span>
                      )}
                    </div>
                  )}
                </GlassCard>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
