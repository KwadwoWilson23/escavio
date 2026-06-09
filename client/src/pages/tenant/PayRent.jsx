import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Lock, CheckCircle } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import Badge from '../../components/ui/Badge'
import { formatGHS } from '../../utils/format'
import api from '../../services/api'

const providers = [
  { id: 'mtn', name: 'MoMo', color: 'bg-yellow-400', text: 'text-black' },
  { id: 'voda', name: 'Cash', color: 'bg-red-500', text: 'text-white' },
  { id: 'tigo', name: 'AirtelTigo', color: 'bg-blue-500', text: 'text-white' },
]

export default function PayRent() {
  const [lease, setLease] = useState(null)
  const [provider, setProvider] = useState('mtn')
  const [paying, setPaying] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/leases/mine').then(({ data }) => {
      const active = data.find(l => l.status === 'active') || data[0]
      setLease(active)
    }).catch(() => {})
  }, [])

  const amount = lease?.monthly_amount || 0
  const escrowPercent = lease ? Math.round((lease.escrow_balance / (lease.monthly_amount * lease.advance_months)) * 100) : 0

  async function handlePay() {
    if (!lease) return
    setPaying(true)
    try {
      await api.post('/payments/initiate', { lease_id: lease.id })
      navigate('/dashboard/payment-success', { state: { amount, reference: `COL-${lease.id.slice(0, 8)}` } })
    } catch {
      setPaying(false)
    }
  }

  return (
    <div className="space-y-6">
      <GlassCard glow="primary">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Due</span>
        </div>
        <p className="text-3xl font-bold text-primary">{formatGHS(amount)}</p>
        <div className="flex items-center gap-2 mt-2 text-text-muted text-sm">
          <Calendar size={14} />
          <span>Due by {new Date(Date.now() + 12 * 86400000).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-text-muted">Escrow Protection</span>
          <Badge variant="success">{escrowPercent}% Protected</Badge>
        </div>
        <p className="text-xs text-text-muted mt-3 leading-relaxed">
          This payment goes to <span className="text-primary font-semibold">escrow</span> and is only released to the landlord after your confirmation of property access.
        </p>
      </GlassCard>

      <div>
        <h3 className="font-bold text-text-primary mb-3">Payment Method</h3>
        <div className="flex gap-3">
          {providers.map(p => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`flex-1 py-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                provider === p.id
                  ? 'border-primary bg-primary/5'
                  : 'border-surface-border bg-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-full ${p.color} ${p.text} flex items-center justify-center text-xs font-bold`}>
                {p.id.toUpperCase().slice(0, 3)}
              </div>
              <span className="text-xs font-medium text-text-muted">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Mobile Number</label>
        <input type="tel" defaultValue="024 123 4567" className="w-full" readOnly />
      </div>

      <GlassCard className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Rent Amount</span>
          <span className="text-text-primary">{formatGHS(amount * 0.97)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Processing Fee</span>
          <span className="text-text-primary">{formatGHS(amount * 0.03)}</span>
        </div>
        <div className="border-t border-surface-border pt-3 flex justify-between font-bold">
          <span className="text-primary">Total</span>
          <span className="text-primary">{formatGHS(amount)}</span>
        </div>
      </GlassCard>

      <button
        onClick={handlePay}
        disabled={paying || !lease}
        className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
      >
        <Lock size={18} />
        {paying ? 'Processing...' : `Pay ${formatGHS(amount)}`}
      </button>

      <p className="text-center text-xs text-text-dim flex items-center justify-center gap-1">
        <Lock size={12} /> Secured by Bank-Level Encryption
      </p>
    </div>
  )
}
