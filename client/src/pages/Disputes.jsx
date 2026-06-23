import { useState, useEffect } from 'react'
import { Shield, Plus, Brain, ChevronRight, MessageSquare, AlertTriangle } from 'lucide-react'
import { ListSkeleton } from '../components/ui/Skeleton'
import GlassCard from '../components/ui/GlassCard'
import Badge from '../components/ui/Badge'
import { formatDate } from '../utils/format'
import api from '../services/api'

export default function Disputes() {
  const [disputes, setDisputes] = useState([])
  const [selected, setSelected] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [newDesc, setNewDesc] = useState('')
  const [leases, setLeases] = useState([])
  const [newLeaseId, setNewLeaseId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/disputes/mine')
        setDisputes(data)
        const { data: ls } = await api.get('/leases/mine')
        setLeases(ls)
      } catch {} finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      const { data } = await api.post('/disputes', { lease_id: newLeaseId, description: newDesc })
      setDisputes(prev => [data, ...prev])
      setShowNew(false)
      setNewDesc('')
    } catch {}
  }

  async function handleAnalyze(disputeId) {
    try {
      const { data } = await api.post('/ai/dispute-analysis', { dispute_id: disputeId })
      setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, ai_summary: data.analysis, status: 'reviewing' } : d))
      if (selected?.id === disputeId) {
        setSelected(prev => ({ ...prev, ai_summary: data.analysis, status: 'reviewing' }))
      }
    } catch {}
  }

  const statusVariant = { open: 'warning', reviewing: 'info', resolved: 'success' }

  if (loading) return <ListSkeleton />

  if (selected) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)} className="text-primary text-sm font-semibold">&larr; Back to Disputes</button>

        <div>
          <h1 className="text-xl font-bold">{selected.description?.slice(0, 50)}</h1>
          <p className="text-xs text-text-muted mt-1">Ref: DSP-{selected.id?.slice(0, 8)}</p>
        </div>

        <GlassCard>
          <Badge variant={statusVariant[selected.status]}>{selected.status?.toUpperCase()}</Badge>
          <h3 className="font-semibold mt-3 text-sm uppercase text-text-muted">Description</h3>
          <p className="text-sm text-text-primary mt-2 leading-relaxed">{selected.description}</p>
        </GlassCard>

        {selected.ai_summary ? (
          <GlassCard glow="primary">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={18} className="text-primary" />
              <h3 className="font-bold text-primary">AI Resolution Analysis</h3>
            </div>
            <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">{selected.ai_summary}</p>
          </GlassCard>
        ) : (
          <button onClick={() => handleAnalyze(selected.id)} className="btn-secondary w-full flex items-center justify-center gap-2">
            <Brain size={18} /> Request AI Analysis
          </button>
        )}

        <div className="flex gap-3">
          <button className="btn-ghost flex-1 flex items-center justify-center gap-2">
            <MessageSquare size={16} /> Message Landlord
          </button>
          <button className="flex-1 bg-orange-400 text-white font-semibold py-3 rounded-full active:scale-95 transition-all flex items-center justify-center gap-2">
            <AlertTriangle size={16} /> Escalate
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Active Disputes</h1>
          <p className="text-xs text-text-muted mt-1">Manage and resolve property concerns with AI support.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary text-sm flex items-center gap-1 py-2 px-4">
          <Plus size={16} /> Raise New
        </button>
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="glass-card p-5 space-y-4">
          <select value={newLeaseId} onChange={e => setNewLeaseId(e.target.value)} className="w-full" required>
            <option value="">Select lease...</option>
            {leases.map(l => <option key={l.id} value={l.id}>{l.properties?.address || l.id}</option>)}
          </select>
          <textarea
            placeholder="Describe the issue..."
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            className="w-full min-h-[100px] bg-surface border border-surface-border rounded-xl px-4 py-3 text-text-primary placeholder-text-dim outline-none focus:border-primary"
            required
          />
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowNew(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Submit</button>
          </div>
        </form>
      )}

      {disputes.length === 0 && !showNew ? (
        <GlassCard className="text-center py-12">
          <Shield size={48} className="text-text-dim mx-auto mb-3" />
          <p className="text-text-muted">No disputes</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {disputes.map(d => (
            <GlassCard key={d.id} onClick={() => setSelected(d)} className="cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={statusVariant[d.status]}>{d.status?.toUpperCase()}</Badge>
                <span className="text-xs text-text-dim">{formatDate(d.created_at)}</span>
              </div>
              <p className="font-medium text-sm truncate">{d.description}</p>
              <p className="text-xs text-text-muted mt-1">{d.leases?.properties?.address || ''}</p>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
