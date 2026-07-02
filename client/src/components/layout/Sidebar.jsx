import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Wallet, FileText, Shield, User, Building2, ScrollText, Search, Bell, Settings, LogOut, MessageSquare, Users } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const tenantLinks = [
  { to: '/dashboard', icon: Home, label: 'Dashboard', end: true },
  { to: '/dashboard/browse', icon: Search, label: 'Browse' },
  { to: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/dashboard/lease', icon: FileText, label: 'My Lease' },
  { to: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/dashboard/community', icon: Users, label: 'Community' },
]

const landlordLinks = [
  { to: '/dashboard', icon: Home, label: 'Dashboard', end: true },
  { to: '/dashboard/properties', icon: Building2, label: 'Properties' },
  { to: '/dashboard/leases', icon: ScrollText, label: 'Leases' },
  { to: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/dashboard/disputes', icon: Shield, label: 'Disputes' },
  { to: '/dashboard/community', icon: Users, label: 'Community' },
]

const bottomLinks = [
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/dashboard/agent', icon: MessageSquare, label: 'Ama AI' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = user?.role === 'landlord' ? landlordLinks : tenantLinks

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[260px] bg-white border-r border-gray-200/80 z-50">
      <div className="px-6 h-16 flex items-center gap-2.5 border-b border-gray-100">
        <img src="/favicon.svg" alt="Escavio" className="w-8 h-8 rounded-lg" />
        <span className="font-bold text-lg tracking-tight text-text-primary">Escavio</span>
      </div>

      <nav className="flex-1 px-3 pt-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-text-dim uppercase tracking-widest px-3 mb-2">Main</p>
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="pt-4 pb-1">
          <p className="text-[10px] font-semibold text-text-dim uppercase tracking-widest px-3 mb-2">Account</p>
        </div>
        {bottomLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-3 space-y-1">
        <NavLink
          to="/profile"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
            {user?.full_name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.full_name || 'User'}</p>
            <p className="text-[10px] text-text-dim truncate capitalize">{user?.role || 'tenant'}</p>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  )
}
