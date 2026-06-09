import { Link, useLocation } from 'react-router-dom'
import { CheckCircle, Download, ArrowLeft } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import { formatGHS } from '../../utils/format'

export default function PaymentSuccess() {
  const { state } = useLocation()
  const amount = state?.amount || 0
  const reference = state?.reference || 'TXN-XXXXX'

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
        <CheckCircle size={48} className="text-accent-success" />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">Payment Successful!</h1>
        <p className="text-text-muted text-sm mt-1">Your rent payment has been processed securely.</p>
      </div>

      <GlassCard className="w-full" glow="success">
        <div className="flex items-center justify-between mb-4">
          <span className="text-text-muted text-sm">Amount Paid</span>
          <span className="text-2xl font-bold text-accent-success">{formatGHS(amount)}</span>
        </div>
        <div className="space-y-3 border-t border-surface-border pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Reference</span>
            <span className="font-mono text-text-primary">{reference}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Payment Method</span>
            <span className="text-text-primary">Mobile Money</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Date</span>
            <span className="text-text-primary">{new Date().toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </GlassCard>

      <div className="glass-card p-4 w-full flex items-start gap-3">
        <CheckCircle size={18} className="text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-text-muted">
          A confirmation SMS has been sent to your registered phone number. Your landlord has been notified.
        </p>
      </div>

      <div className="w-full space-y-3">
        <Link to="/dashboard" className="btn-primary w-full flex items-center justify-center gap-2">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
        <button className="btn-ghost w-full flex items-center justify-center gap-2">
          <Download size={18} /> Download Receipt
        </button>
      </div>
    </div>
  )
}
