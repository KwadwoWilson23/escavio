import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ScrollText, Plus, Trash2 } from 'lucide-react'
import { ListSkeleton } from '../../components/ui/Skeleton'
import GlassCard from '../../components/ui/GlassCard'
import Badge from '../../components/ui/Badge'
import { formatGHS, formatDate } from '../../utils/format'
import api from '../../services/api'

const SWIPE_THRESHOLD = 80
const DELETE_THRESHOLD = 140

const statusVariant = { active: 'success', pending: 'warning', completed: 'info', disputed: 'danger', at_risk: 'danger' }

function SwipeableLease({ lease, onDelete }) {
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
      offset.current = Math.min(diff, 200)
      setTranslateX(-offset.current)
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
      await api.delete(`/leases/${lease.id}`)
      setTranslateX(-500)
      setTimeout(() => onDelete(lease.id), 300)
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
    const addr = lease.properties?.address || 'this lease'
    if (confirm(`Delete lease for "${addr}"? This cannot be undone.`)) {
      handleDelete()
    }
  }

  const showDelete = translateX < -20

  return (
    <div className="relative overflow-hidden rounded-2xl">
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
        <GlassCard>
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
      </div>
    </div>
  )
}

export default function Leases() {
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/leases/mine').then(({ data }) => setLeases(data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  function handleDelete(id) {
    setLeases(prev => prev.filter(l => l.id !== id))
  }

  if (loading) return <ListSkeleton />

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
        <>
          <p className="text-xs text-text-dim text-center">Swipe left on a lease to delete it</p>
          <div className="space-y-3">
            {leases.map(lease => (
              <SwipeableLease key={lease.id} lease={lease} onDelete={handleDelete} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
