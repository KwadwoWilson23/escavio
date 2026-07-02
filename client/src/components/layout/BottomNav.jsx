import { NavLink } from 'react-router-dom'
import { Home, Search, Wallet, User, Building2, ScrollText, MessageSquare, Users } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const tenantLinks = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/dashboard/browse', icon: Search, label: 'Browse' },
  { to: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/dashboard/community', icon: Users, label: 'Community' },
  { to: '/profile', icon: User, label: 'Profile' },
]

const landlordLinks = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/dashboard/properties', icon: Building2, label: 'Properties' },
  { to: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/dashboard/leases', icon: ScrollText, label: 'Leases' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const { user } = useAuth()
  const links = user?.role === 'landlord' ? landlordLinks : tenantLinks

  return (
    <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className="bottom-nav-pill flex justify-around items-center h-[64px] rounded-[22px] px-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `bottom-nav-item flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-2xl ${
                isActive ? 'active' : ''
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`bottom-nav-icon p-1.5 rounded-xl ${isActive ? 'bg-white/20' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="text-[9px] font-semibold tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
