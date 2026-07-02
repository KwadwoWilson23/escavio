import { useState, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import SplashScreen from './components/SplashScreen'
import OnboardingFlow from './components/OnboardingFlow'
import DashboardLayout from './components/layout/DashboardLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import CompleteProfile from './pages/CompleteProfile'
import TenantDashboard from './pages/tenant/Dashboard'
import PayRent from './pages/tenant/PayRent'
import PaymentSuccess from './pages/tenant/PaymentSuccess'
import LeaseDetail from './pages/tenant/LeaseDetail'
import BrowseProperties from './pages/tenant/BrowseProperties'
import PropertyView from './pages/tenant/PropertyView'
import WalletPage from './pages/tenant/Wallet'
import LandlordDashboard from './pages/landlord/Dashboard'
import Properties from './pages/landlord/Properties'
import AddProperty from './pages/landlord/AddProperty'
import PropertyDetail from './pages/landlord/PropertyDetail'
import Leases from './pages/landlord/Leases'
import CreateLease from './pages/landlord/CreateLease'
import Disputes from './pages/Disputes'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import KYCVerification from './pages/KYCVerification'
import Settings from './pages/Settings'
import AgentChat from './pages/AgentChat'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Messages from './pages/Messages'
import ChatRoom from './pages/ChatRoom'
import Community from './pages/Community'
import CommunityPost from './pages/CommunityPost'
import VerificationDocs from './pages/VerificationDocs'

function NeedsPhone({ children }) {
  const { user } = useAuth()
  if (user && user.phone?.startsWith('google_')) {
    return <Navigate to="/complete-profile" replace />
  }
  return children
}

function DashboardHome() {
  const { user } = useAuth()
  if (user?.role === 'landlord') return <LandlordDashboard />
  return <TenantDashboard />
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('escavio_splash_shown'))
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('escavio_onboarded'))

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('escavio_splash_shown', '1')
    setShowSplash(false)
  }, [])

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem('escavio_onboarded', '1')
    setShowOnboarding(false)
  }, [])

  return (
    <>
    {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
    {!showSplash && showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      <Route element={<NeedsPhone><DashboardLayout /></NeedsPhone>}>
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/dashboard/pay" element={<PayRent />} />
        <Route path="/dashboard/payment-success" element={<PaymentSuccess />} />
        <Route path="/dashboard/lease" element={<LeaseDetail />} />
        <Route path="/dashboard/wallet" element={<WalletPage />} />
        <Route path="/dashboard/browse" element={<BrowseProperties />} />
        <Route path="/dashboard/browse/:id" element={<PropertyView />} />
        <Route path="/dashboard/properties" element={<Properties />} />
        <Route path="/dashboard/properties/new" element={<AddProperty />} />
        <Route path="/dashboard/properties/:id" element={<PropertyDetail />} />
        <Route path="/dashboard/leases" element={<Leases />} />
        <Route path="/dashboard/leases/new" element={<CreateLease />} />
        <Route path="/dashboard/disputes" element={<Disputes />} />
        <Route path="/dashboard/messages" element={<Messages />} />
        <Route path="/dashboard/messages/:id" element={<ChatRoom />} />
        <Route path="/dashboard/community" element={<Community />} />
        <Route path="/dashboard/community/:id" element={<CommunityPost />} />
        <Route path="/dashboard/kyc" element={<KYCVerification />} />
        <Route path="/dashboard/documents" element={<VerificationDocs />} />
        <Route path="/dashboard/agent" element={<AgentChat />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
