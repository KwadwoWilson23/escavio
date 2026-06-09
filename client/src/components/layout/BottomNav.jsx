import { NavLink } from 'react-router-dom'
import { Home, Wallet, FileText, Shield, User, Building2, ScrollText } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const tenantLinks = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/dashboard/pay', icon: Wallet, label: 'Pay' },
  { to: '/dashboard/lease', icon: FileText, label: 'Lease' },
  { to: '/dashboard/disputes', icon: Shield, label: 'Disputes' },
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
    <nav className="fixed bottom-0 w-full z-50 bg-white/90 backdrop-blur-xl border-t border-surface-border flex justify-around items-center h-16 pb-safe">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/dashboard'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              isActive ? 'text-primary' : 'text-text-dim'
            }`
          }
        >
          <Icon size={22} />
          <span className="text-[10px] font-semibold tracking-wider">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
