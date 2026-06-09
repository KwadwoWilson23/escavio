import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Minus, Plus } from 'lucide-react'
import api from '../../services/api'

const regions = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Northern', 'Volta', 'Upper East', 'Upper West', 'Bono',
  'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North',
]

export default function AddProperty() {
  const [form, setForm] = useState({ address: '', region: 'Greater Accra', monthly_rent: '', bedrooms: 2 })
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  function update(field) {
    return (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/properties', { ...form, monthly_rent: Number(form.monthly_rent) })
      navigate('/dashboard/properties')
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
        <h1 className="text-xl font-bold">Add Property</h1>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted">STEP 01/01</span>
        <span className="text-primary font-semibold">Property Details</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Street Address</label>
          <input
            type="text"
            placeholder="e.g. 42 Independence Ave, Ridge"
            value={form.address}
            onChange={update('address')}
            className="w-full"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Region</label>
            <select value={form.region} onChange={update('region')} className="w-full">
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Bedrooms</label>
            <div className="flex items-center gap-3 bg-surface border border-surface-border rounded-xl px-3 py-2.5">
              <button type="button" onClick={() => setForm(p => ({ ...p, bedrooms: Math.max(1, p.bedrooms - 1) }))} className="text-primary">
                <Minus size={18} />
              </button>
              <span className="flex-1 text-center font-bold">{form.bedrooms}</span>
              <button type="button" onClick={() => setForm(p => ({ ...p, bedrooms: p.bedrooms + 1 }))} className="text-primary">
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Monthly Rent (GHS)</label>
          <div className="glass-card p-4">
            <input
              type="number"
              placeholder="0.00"
              value={form.monthly_rent}
              onChange={update('monthly_rent')}
              className="w-full text-2xl font-bold border-none bg-transparent p-0 focus:ring-0"
              required
            />
            <p className="text-xs text-text-muted mt-2">Recommended for this area: GHS 4,200 - GHS 5,500</p>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 text-lg">
          {saving ? 'Adding...' : 'Add Property'} <ArrowRight size={20} />
        </button>
      </form>
    </div>
  )
}
