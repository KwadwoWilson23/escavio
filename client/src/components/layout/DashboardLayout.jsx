import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

export default function DashboardLayout() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <main className="pt-20 pb-20 px-5">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
