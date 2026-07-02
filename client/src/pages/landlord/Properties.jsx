import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus, MapPin, CheckCircle, Home, BedDouble, Store, LayoutGrid, Trash2 } from 'lucide-react'
import { ListSkeleton } from '../../components/ui/Skeleton'
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

const SWIPE_THRESHOLD = 80
const DELETE_THRESHOLD = 140

function SwipeableProperty({ prop, onDelete }) {
  const containerRef = useRef(null)
  const startX = useRef(0)
  const currentX = useRef(0)
  const offset = useRef(0)
  const swiping = useRef(false)
  const [translateX, setTranslateX] = useState(0)
  const [deleting, setDeleting] = useState(false)

  function handleTouchStart(e) {
    startX.current = e.touches[0].clientX
    currentX.current = startX.current
    swiping.current = true
  }

  function handleTouchMove(e) {
    if (!swiping.current) return
    currentX.current = e.touches[0].clientX
    const diff = startX.current - currentX.current
    if (diff > 0) {
      const dampened = Math.min(diff, 200)
      offset.current = dampened
      setTranslateX(-dampened)
    } else {
      offset.current = 0
      setTranslateX(0)
    }
  }

  function handleTouchEnd() {
    swiping.current = false
    if (offset.current >= DELETE_THRESHOLD) {
      setTranslateX(-DELETE_THRESHOLD)
      handleDelete()
    } else if (offset.current >= SWIPE_THRESHOLD) {
      setTranslateX(-SWIPE_THRESHOLD)
    } else {
      offset.current = 0
      setTranslateX(0)
    }
  }

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    try {
      await api.delete(`/properties/${prop.id}`)
      setTranslateX(-500)
      setTimeout(() => onDelete(prop.id), 300)
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete'
      alert(msg)
      setTranslateX(0)
      setDeleting(false)
    }
  }

  function handleClickDelete(e) {
    e.preventDefault()
    e.stopPropagation()
    if (confirm(`Delete "${prop.address}"? This cannot be undone.`)) {
      handleDelete()
    }
  }

  const Icon = typeIcons[prop.property_type] || Building2
  const showDelete = translateX < -20

  return (
    <div className="relative overflow-hidden rounded-2xl" ref={containerRef}>
      <div
        className="absolute inset-0 flex items-center justify-end rounded-2xl"
        style={{ background: showDelete ? '#ef4444' : 'transparent' }}
      >
        {showDelete && (
          <button
            onClick={handleClickDelete}
            className="flex flex-col items-center justify-center gap-1 text-white px-6 h-full"
          >
            <Trash2 size={22} />
            <span className="text-xs font-semibold">Delete</span>
          </button>
        )}
      </div>

      <div
        className="relative z-10 transition-transform"
        style={{
          transform: `translateX(${translateX}px)`,
          transitionDuration: swiping.current ? '0ms' : '300ms',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Link to={`/dashboard/properties/${prop.id}`}>
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
      </div>
    </div>
  )
}

export default function Properties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/properties/mine').then(({ data }) => setProperties(data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  function handleDelete(id) {
    setProperties(prev => prev.filter(p => p.id !== id))
  }

  if (loading) return <ListSkeleton />

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
        <>
          <p className="text-xs text-text-dim text-center">Swipe left on a property to delete it</p>
          <div className="space-y-3">
            {properties.map(prop => (
              <SwipeableProperty key={prop.id} prop={prop} onDelete={handleDelete} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
