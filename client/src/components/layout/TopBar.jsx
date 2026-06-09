import { useState, useEffect } from 'react'
import { Bell, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getGreeting } from '../../utils/format'
import api from '../../services/api'

export default function TopBar() {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)
  const firstName = user?.full_name?.split(' ')[0] || 'User'

  useEffect(() => {
    api.get('/notifications/unread-count')
      .then(({ data }) => setUnread(data.count || 0))
      .catch(() => {})

    const interval = setInterval(() => {
      api.get('/notifications/unread-count')
        .then(({ data }) => setUnread(data.count || 0))
        .catch(() => {})
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-surface-border px-5 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link to="/profile" className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {firstName[0]}
        </Link>
        <span className="text-text-primary font-medium">
          {getGreeting()}, {firstName}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/settings" className="text-text-muted hover:text-text-primary transition-colors">
          <Settings size={20} />
        </Link>
        <Link to="/notifications" className="relative">
          <Bell size={22} className="text-primary" />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-accent-danger rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
