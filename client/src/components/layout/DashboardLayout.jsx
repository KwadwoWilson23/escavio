import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

export default function DashboardLayout() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-white lg:bg-slate-50">
      <Sidebar />
      <TopBar />

      {/* Mobile content */}
      <main className="lg:hidden pt-20 pb-28 px-5">
        <Outlet />
      </main>

      {/* Desktop content */}
      <main className="hidden lg:block ml-[260px] pt-16">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
