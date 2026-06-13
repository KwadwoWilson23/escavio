import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Calendar, Lock, CheckCircle, XCircle, Loader2, Phone, ArrowLeft, RefreshCw, Shield, Smartphone } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import Badge from '../../components/ui/Badge'
import { formatGHS } from '../../utils/format'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'

function detectNetwork(phone) {
  const digits = phone.replace(/\D/g, '')
  const prefix = digits.startsWith('233') ? digits.slice(3, 5) : digits.startsWith('0') ? digits.slice(1, 3) : digits.slice(0, 2)
  if (['24', '25', '53', '54', '55', '59'].includes(prefix)) return { name: 'MTN MoMo', color: 'bg-yellow-400', text: 'text-black' }
  if (['20', '50'].includes(prefix)) return { name: 'Telecel Cash', color: 'bg-red-500', text: 'text-white' }
  if (['26', '27', '56', '57'].includes(prefix)) return { name: 'AirtelTigo', color: 'bg-blue-500', text: 'text-white' }
  return { name: 'Mobile Money', color: 'bg-gray-400', text: 'text-white' }
}

export default function PayRent() {
  const [lease, setLease] = useState(null)
  const [step, setStep] = useState('confirm')
  const [paymentId, setPaymentId] = useState(null)
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const [pollCount, setPollCount] = useState(0)
  const pollRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  const phone = user?.phone || ''
  const network = detectNetwork(phone)

  useEffect(() => {
    api.get('/leases/mine').then(({ data }) => {
      const active = data.find(l => l.status === 'active') || data[0]
      setLease(active)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const amount = lease?.monthly_amount || 0
  const escavioFee = Math.round(amount * 0.01 * 100) / 100
  const netAmount = Math.round((amount - escavioFee) * 100) / 100
  const escrowPercent = lease ? Math.round((lease.escrow_balance / (lease.monthly_amount * lease.advance_months)) * 100) : 0

  function startPolling(id) {
    let count = 0
    pollRef.current = setInterval(async () => {
      count++
      setPollCount(count)

      try {
        const { data } = await api.get(`/payments/status/${id}`)

        if (data.status === 'success') {
          clearInterval(pollRef.current)
          setStep('success')
          return
        }

        if (data.status === 'failed') {
          clearInterval(pollRef.current)
          setError('Payment was declined. Please check your balance and try again.')
          setStep('failed')
          return
        }
      } catch {}

      if (count >= 24) {
        clearInterval(pollRef.current)
        setStep('timeout')
      }
    }, 5000)
  }

  async function handlePay() {
    if (!lease) return
    setStep('initiating')
    setError('')

    try {
      const { data } = await api.post('/payments/initiate', { lease_id: lease.id })
      setPaymentId(data.payment?.id)
      setReference(data.reference || '')
      setStep('waiting')
      startPolling(data.payment?.id)
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Could not initiate payment. Please try again.'
      setError(msg)
      setStep('failed')
    }
  }

  function handleRetry() {
    if (pollRef.current) clearInterval(pollRef.current)
    setStep('confirm')
    setError('')
    setPaymentId(null)
    setPollCount(0)
  }

  function formatPhone(p) {
    if (!p) return ''
    const d = p.replace(/\D/g, '')
    const local = d.startsWith('233') ? '0' + d.slice(3) : d
    if (local.length === 10) return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
    return local
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Pay Rent</h1>
      </div>

      {step === 'confirm' && (
        <>
          <GlassCard glow="primary">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Due</span>
            </div>
            <p className="text-3xl font-bold text-primary">{formatGHS(amount)}</p>
            <div className="flex items-center gap-2 mt-2 text-text-muted text-sm">
              <Calendar size={14} />
              <span>{lease?.properties?.address || 'Property'}</span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-text-muted">Escrow Protection</span>
              <Badge variant="success">{escrowPercent}% Funded</Badge>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Payment Method</h3>
            <div className="flex items-center gap-4 p-3 bg-surface rounded-xl border border-surface-border">
              <div className={`w-12 h-12 rounded-full ${network.color} ${network.text} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                <Phone size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{network.name}</p>
                <p className="text-text-muted text-sm font-mono">{formatPhone(phone)}</p>
              </div>
              <Badge variant="info">Auto</Badge>
            </div>
            <p className="text-[10px] text-text-dim mt-2">Network auto-detected from your registered number. A MoMo prompt will be sent to this number.</p>
          </GlassCard>

          <GlassCard className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Rent Amount</span>
              <span className="text-text-primary">{formatGHS(amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Escavio Fee (1%)</span>
              <span className="text-text-primary">{formatGHS(escavioFee)}</span>
            </div>
            <div className="flex justify-between text-sm text-xs">
              <span className="text-text-dim">Net to Escrow</span>
              <span className="text-text-dim">{formatGHS(netAmount)}</span>
            </div>
            <div className="border-t border-surface-border pt-3 flex justify-between font-bold">
              <span className="text-primary">You Pay</span>
              <span className="text-primary">{formatGHS(amount)}</span>
            </div>
          </GlassCard>

          <GlassCard className="flex items-start gap-3">
            <Shield size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted">
              Your payment goes into <span className="text-primary font-semibold">escrow</span> and is only released to the landlord based on the agreed payout mode. Protected by Moolre.
            </p>
          </GlassCard>

          <button
            onClick={handlePay}
            disabled={!lease || !phone}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
          >
            <Lock size={18} /> Pay {formatGHS(amount)}
          </button>

          <p className="text-center text-xs text-text-dim flex items-center justify-center gap-1">
            <Lock size={12} /> Powered by Moolre Payment Gateway
          </p>
        </>
      )}

      {step === 'initiating' && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 size={48} className="text-primary animate-spin" />
          <p className="text-text-muted font-medium">Connecting to {network.name}...</p>
        </div>
      )}

      {step === 'waiting' && (
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <div className="w-24 h-24 rounded-full bg-yellow-50 flex items-center justify-center relative">
            <Smartphone size={40} className="text-yellow-600" />
            <div className="absolute inset-0 rounded-full border-4 border-yellow-200 border-t-yellow-500 animate-spin" style={{ animationDuration: '2s' }} />
          </div>

          <div className="text-center">
            <h2 className="text-lg font-bold">Approve on Your Phone</h2>
            <p className="text-sm text-text-muted mt-2 max-w-xs">
              A {network.name} payment prompt of <strong>{formatGHS(amount)}</strong> has been sent to <strong>{formatPhone(phone)}</strong>.
            </p>
          </div>

          <GlassCard className="w-full space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-600 text-xs font-bold">1</span>
              </div>
              <p className="text-sm text-text-muted">Open the MoMo prompt on your phone</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-600 text-xs font-bold">2</span>
              </div>
              <p className="text-sm text-text-muted">Enter your MoMo PIN to confirm</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-600 text-xs font-bold">3</span>
              </div>
              <p className="text-sm text-text-muted">Wait for confirmation here</p>
            </div>
          </GlassCard>

          <div className="flex items-center gap-2 text-xs text-text-dim">
            <Loader2 size={12} className="animate-spin" />
            <span>Waiting for approval... ({Math.min(pollCount * 5, 120)}s)</span>
          </div>

          {reference && (
            <p className="text-[10px] text-text-dim">Ref: {reference}</p>
          )}
        </div>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle size={56} className="text-accent-success" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold">Payment Successful!</h2>
            <p className="text-sm text-text-muted mt-2">Your rent has been securely deposited into escrow.</p>
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
                <span className="text-text-muted">Method</span>
                <span className="text-text-primary">{network.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Property</span>
                <span className="text-text-primary">{lease?.properties?.address || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Date</span>
                <span className="text-text-primary">{new Date().toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="w-full flex items-start gap-3">
            <CheckCircle size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-muted">
              A confirmation SMS has been sent to your phone. Your landlord has been notified.
            </p>
          </GlassCard>

          <Link to="/dashboard" className="btn-primary w-full flex items-center justify-center gap-2">
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
        </div>
      )}

      {step === 'failed' && (
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle size={56} className="text-accent-danger" />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold">Payment Failed</h2>
            <p className="text-sm text-text-muted mt-2 max-w-xs">{error || 'Something went wrong. Please try again.'}</p>
          </div>

          <GlassCard className="w-full space-y-2">
            <h3 className="text-sm font-semibold">Common reasons:</h3>
            <ul className="text-xs text-text-muted space-y-1">
              <li>Insufficient balance in your MoMo wallet</li>
              <li>Wrong PIN entered on the prompt</li>
              <li>Payment prompt expired (you have about 60 seconds)</li>
              <li>Network issue, please check your connection</li>
            </ul>
          </GlassCard>

          <div className="w-full space-y-3">
            <button onClick={handleRetry} className="btn-primary w-full flex items-center justify-center gap-2">
              <RefreshCw size={16} /> Try Again
            </button>
            <Link to="/dashboard" className="block text-center bg-surface-card border border-surface-border text-text-muted font-semibold py-3 rounded-full w-full">
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {step === 'timeout' && (
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <div className="w-24 h-24 rounded-full bg-yellow-50 flex items-center justify-center">
            <Loader2 size={48} className="text-yellow-500" />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold">Still Processing</h2>
            <p className="text-sm text-text-muted mt-2 max-w-xs">
              Your payment may still be processing. If you approved it on your phone, the confirmation will appear on your dashboard shortly.
            </p>
          </div>

          {reference && (
            <GlassCard className="w-full">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Reference</span>
                <span className="font-mono text-text-primary">{reference}</span>
              </div>
              <p className="text-xs text-text-dim mt-2">Save this reference. If the payment was deducted but not reflected, contact support.</p>
            </GlassCard>
          )}

          <div className="w-full space-y-3">
            <Link to="/dashboard" className="btn-primary w-full flex items-center justify-center gap-2">
              <ArrowLeft size={18} /> Go to Dashboard
            </Link>
            <button onClick={handleRetry} className="block w-full text-center bg-surface-card border border-surface-border text-text-muted font-semibold py-3 rounded-full">
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
