import { useState, useEffect } from 'react'
import { CheckCircle, AlertTriangle, Shield, FileText, Wallet, Bell, Check } from 'lucide-react'
import { NotificationsSkeleton } from '../components/ui/Skeleton'
import GlassCard from '../components/ui/GlassCard'
import Badge from '../components/ui/Badge'
import api from '../services/api'

const iconMap = {
  payment: { icon: Wallet, color: 'text-primary', bg: 'bg-primary/10' },
  dispute: { icon: Shield, color: 'text-primary', bg: 'bg-primary/10' },
  alert: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  lease: { icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
  general: { icon: Bell, color: 'text-text-muted', bg: 'bg-surface-border/50' },
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function groupByDate(items) {
  const groups = {}
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  for (const item of items) {
    const d = new Date(item.sent_at).toDateString()
    const label = d === today ? 'Today' : d === yesterday ? 'Yesterday' : new Date(item.sent_at).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })
    if (!groups[label]) groups[label] = []
    groups[label].push(item)
  }
  return groups
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notifications').then(({ data }) => {
      setNotifications(data.notifications || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function markRead(id) {
    await api.patch(`/notifications/${id}/read`).catch(() => {})
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    await api.patch('/notifications/read-all').catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.is_read
    if (filter === 'payments') return n.type === 'payment'
    if (filter === 'disputes') return n.type === 'dispute'
    return true
  })

  const grouped = groupByDate(filtered)
  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) return <NotificationsSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary font-semibold flex items-center gap-1">
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', 'Unread', 'Payments', 'Disputes'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f.toLowerCase())}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === f.toLowerCase()
                ? 'bg-text-primary text-white'
                : 'bg-surface-card border border-surface-border text-text-muted'
            }`}
          >
            {f} {f === 'Unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Bell size={48} className="text-text-dim mx-auto mb-3" />
          <p className="text-text-muted">No notifications yet</p>
        </GlassCard>
      ) : (
        Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <p className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">{group}</p>
            <div className="space-y-2">
              {items.map(n => {
                const { icon: Icon, color, bg } = iconMap[n.type] || iconMap.general
                return (
                  <GlassCard
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className={`flex gap-4 ${!n.is_read ? 'border-primary/20' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium line-clamp-2">{n.message}</p>
                        {!n.is_read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant={n.channel === 'sms' ? 'warning' : 'info'}>
                          {n.channel === 'sms' ? 'SMS' : 'IN-APP'}
                        </Badge>
                        <span className="text-xs text-text-dim">{timeAgo(n.sent_at)}</span>
                      </div>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
