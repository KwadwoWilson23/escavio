import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Shield, CheckCircle, AlertTriangle } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import api from '../../services/api'

export default function CreateLease() {
  const [properties, setProperties] = useState([])
  const [form, setForm] = useState({
    property_id: '',
    tenant_phone: '',
    monthly_amount: '',
    start_date: '',
    end_date: '',
    advance_months: 6,
    payout_mode: 'monthly',
  })
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/properties/mine').then(({ data }) => setProperties(data)).catch(() => {})
  }, [])

  function update(field) {
    return (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const isCompliant = form.advance_months <= 6

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isCompliant) return
    setSaving(true)
    try {
      await api.post('/leases', { ...form, monthly_amount: Number(form.monthly_amount), advance_months: Number(form.advance_months) })
      navigate('/dashboard/leases')
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">New Lease</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Select Property</label>
          <select value={form.property_id} onChange={update('property_id')} className="w-full" required>
            <option value="">Choose a property...</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Tenant Phone Number</label>
          <div className="flex gap-2">
            <div className="bg-surface border border-surface-border rounded-xl px-3 py-3 text-text-muted text-sm font-medium flex-shrink-0">+233</div>
            <input type="tel" placeholder="20 123 4567" value={form.tenant_phone} onChange={update('tenant_phone')} className="flex-1" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Monthly Rent (GHS)</label>
          <input type="number" placeholder="4,500" value={form.monthly_amount} onChange={update('monthly_amount')} className="w-full" required />
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Advance Months</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="6"
              value={form.advance_months}
              onChange={update('advance_months')}
              className="flex-1"
              required
            />
            <span className="text-text-muted font-medium">MONTHS</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Start Date</label>
            <input type="date" value={form.start_date} onChange={update('start_date')} className="w-full" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">End Date</label>
            <input type="date" value={form.end_date} onChange={update('end_date')} className="w-full" required />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-3 block">Payout Mode</label>
          <div className="flex gap-2">
            {['monthly', 'lump_sum', 'hybrid'].map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, payout_mode: mode }))}
                className={`flex-1 py-3 rounded-full text-sm font-semibold transition-all ${
                  form.payout_mode === mode
                    ? 'bg-primary text-white'
                    : 'bg-surface-card border border-surface-border text-text-muted'
                }`}
              >
                {mode === 'lump_sum' ? 'Lump Sum' : mode === 'hybrid' ? 'Hybrid' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        <GlassCard className={`flex items-center gap-3 ${isCompliant ? 'border-primary/30' : 'border-red-400/30'}`}>
          {isCompliant ? (
            <>
              <CheckCircle size={20} className="text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-primary">COMPLIANCE GUARANTEED</p>
                <p className="text-xs text-text-muted">Compliant with Rent Act 2026</p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-400">NON-COMPLIANT</p>
                <p className="text-xs text-text-muted">Max 6 months advance per Rent Act 2026</p>
              </div>
            </>
          )}
        </GlassCard>

        <button type="submit" disabled={saving || !isCompliant} className="btn-primary w-full flex items-center justify-center gap-2 text-lg">
          {saving ? 'Creating...' : 'Create Lease & Invite Tenant'} <ArrowRight size={20} />
        </button>
      </form>
    </div>
  )
}
