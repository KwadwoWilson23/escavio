import { NavLink } from 'react-router-dom'
import { Home, Wallet, FileText, Shield, User, Building2, ScrollText, Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const tenantLinks = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/dashboard/browse', icon: Search, label: 'Browse' },
  { to: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/dashboard/lease', icon: FileText, label: 'Lease' },
  { to: '/profile', icon: User, label: 'Profile' },
]

const landlordLinks = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/dashboard/properties', icon: Building2, label: 'Properties' },
  { to: '/dashboard/leases', icon: ScrollText, label: 'Leases' },
  { to: '/dashboard/disputes', icon: Shield, label: 'Disputes' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const { user } = useAuth()
  const links = user?.role === 'landlord' ? landlordLinks : tenantLinks

  return (
    <nav className="lg:hidden fixed bottom-0 w-full z-50 liquid-glass-heavy flex justify-around items-center h-[72px] pb-safe">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/dashboard'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-200 ${
              isActive
                ? 'text-primary'
                : 'text-text-dim'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/10' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className={`text-[10px] font-semibold tracking-wider ${isActive ? 'text-primary' : ''}`}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
