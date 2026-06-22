import { useState, useEffect } from 'react'
import { Bell, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getGreeting } from '../../utils/format'
import api from '../../services/api'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/dashboard/pay': 'Pay Rent',
  '/dashboard/wallet': 'Wallet',
  '/dashboard/lease': 'My Lease',
  '/dashboard/browse': 'Browse Properties',
  '/dashboard/properties': 'Properties',
  '/dashboard/leases': 'Leases',
  '/dashboard/disputes': 'Disputes',
  '/dashboard/kyc': 'KYC Verification',
  '/dashboard/agent': 'Ama AI',
  '/notifications': 'Notifications',
  '/profile': 'Profile',
  '/settings': 'Settings',
}

export default function TopBar() {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)
  const location = useLocation()
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

  const pageTitle = pageTitles[location.pathname] || ''

  return (
    <>
      {/* Mobile topbar — liquid glass */}
      <header className="lg:hidden fixed top-0 w-full z-50 liquid-glass-heavy h-16 flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm ring-2 ring-white/50">
            {firstName[0]}
          </Link>
          <span className="text-text-primary font-medium text-sm">
            {getGreeting()}, {firstName}
          </span>
        </div>
        <div className="flex items-center gap-3.5">
          <Link to="/settings" className="w-9 h-9 rounded-full bg-white/50 flex items-center justify-center text-text-muted">
            <Settings size={18} />
          </Link>
          <Link to="/notifications" className="relative w-9 h-9 rounded-full bg-white/50 flex items-center justify-center">
            <Bell size={18} className="text-primary" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-accent-danger rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Desktop topbar — clean minimal */}
      <header className="hidden lg:flex fixed top-0 right-0 left-[260px] z-40 h-16 items-center justify-between px-8 bg-slate-50/80 backdrop-blur-sm border-b border-gray-200/50">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/notifications" className="relative w-9 h-9 rounded-lg bg-white border border-gray-200/80 flex items-center justify-center text-text-muted hover:text-primary transition-colors">
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-accent-danger rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
          <Link to="/profile" className="flex items-center gap-2.5 pl-3 pr-4 py-1.5 rounded-lg bg-white border border-gray-200/80 hover:border-primary/30 transition-colors">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {firstName[0]}
            </div>
            <span className="text-sm font-medium text-text-primary">{firstName}</span>
          </Link>
        </div>
      </header>
    </>
  )
}
