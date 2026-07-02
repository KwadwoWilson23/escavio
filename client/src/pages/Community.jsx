import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Plus, MapPin, BedDouble, Calendar, Eye, CheckCircle, X } from 'lucide-react'
import { ListSkeleton } from '../components/ui/Skeleton'
import GlassCard from '../components/ui/GlassCard'
import Badge from '../components/ui/Badge'
import { formatGHS } from '../utils/format'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function Community() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ location_preference: '', bedrooms_needed: 1, max_budget: '', move_in_date: '', additional_notes: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api.get('/community/posts')
      .then(({ data }) => setPosts(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    try {
      const { data } = await api.post('/community/posts', {
        ...form,
        bedrooms_needed: parseInt(form.bedrooms_needed) || 1,
        max_budget: form.max_budget ? Number(form.max_budget) : null,
      })
      setPosts(prev => [data, ...prev])
      setShowNew(false)
      setForm({ location_preference: '', bedrooms_needed: 1, max_budget: '', move_in_date: '', additional_notes: '' })
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create post')
    } finally {
      setCreating(false)
    }
  }

  function handleShare(post) {
    const text = `Looking for a ${post.bedrooms_needed}-bedroom in ${post.location_preference}${post.max_budget ? ` (budget GHS ${post.max_budget})` : ''}. Know any place? Check Escavio!`
    const url = `https://escavio.site/community/${post.id}`
    if (navigator.share) {
      navigator.share({ title: 'Housing Request on Escavio', text, url }).catch(() => {})
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
    }
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Community</h1>
          <p className="text-xs text-text-muted mt-0.5">Housing requests from verified tenants</p>
        </div>
        {user?.role === 'tenant' && (
          <button onClick={() => setShowNew(true)} className="btn-primary text-sm flex items-center gap-1 py-2 px-4">
            <Plus size={16} /> Post
          </button>
        )}
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">What are you looking for?</h3>
            <button type="button" onClick={() => setShowNew(false)}><X size={18} className="text-text-dim" /></button>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted mb-1 block">Location / Area</label>
            <input
              type="text"
              placeholder="e.g. East Legon, Accra"
              value={form.location_preference}
              onChange={e => setForm(p => ({ ...p, location_preference: e.target.value }))}
              className="w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-muted mb-1 block">Bedrooms</label>
              <input type="number" min="1" max="20" value={form.bedrooms_needed} onChange={e => setForm(p => ({ ...p, bedrooms_needed: e.target.value }))} className="w-full" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted mb-1 block">Max Budget (GHS)</label>
              <input type="number" placeholder="No limit" value={form.max_budget} onChange={e => setForm(p => ({ ...p, max_budget: e.target.value }))} className="w-full" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted mb-1 block">Move-in Date</label>
            <input type="date" value={form.move_in_date} onChange={e => setForm(p => ({ ...p, move_in_date: e.target.value }))} className="w-full" />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted mb-1 block">Additional Notes</label>
            <textarea
              placeholder="Any preferences? Close to university, compound house, etc."
              value={form.additional_notes}
              onChange={e => setForm(p => ({ ...p, additional_notes: e.target.value }))}
              className="w-full min-h-[80px] resize-none"
              maxLength={500}
            />
          </div>

          <button type="submit" disabled={creating || !form.location_preference} className="btn-primary w-full disabled:opacity-50">
            {creating ? 'Posting...' : 'Post Housing Request'}
          </button>
        </form>
      )}

      {posts.length === 0 && !showNew ? (
        <GlassCard className="text-center py-12">
          <Users size={48} className="text-text-dim mx-auto mb-3" />
          <p className="text-text-muted">No housing requests yet</p>
          {user?.role === 'tenant' && (
            <button onClick={() => setShowNew(true)} className="text-primary text-sm font-semibold mt-2">
              Post what you are looking for
            </button>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <GlassCard key={post.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-xs">{post.tenant?.full_name?.[0] || 'T'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{post.tenant?.full_name || 'Verified Tenant'}</p>
                    <span className="flex items-center gap-0.5 text-[10px] text-accent-success font-semibold">
                      <CheckCircle size={10} /> Verified
                    </span>
                  </div>
                </div>
                <Badge variant={post.status === 'open' ? 'success' : 'neutral'}>{post.status?.toUpperCase()}</Badge>
              </div>

              <div className="space-y-1.5 mt-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-primary flex-shrink-0" />
                  <span>{post.location_preference}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BedDouble size={14} className="text-primary flex-shrink-0" />
                  <span>{post.bedrooms_needed} Bedroom{post.bedrooms_needed > 1 ? 's' : ''}</span>
                </div>
                {post.max_budget && (
                  <p className="text-sm font-bold text-primary">Budget: {formatGHS(post.max_budget)}/mo</p>
                )}
                {post.move_in_date && (
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Calendar size={12} />
                    <span>Move-in: {new Date(post.move_in_date).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}
                {post.additional_notes && (
                  <p className="text-xs text-text-muted mt-1">{post.additional_notes}</p>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
                <div className="flex items-center gap-1 text-[10px] text-text-dim">
                  <Eye size={10} /> {post.views_count || 0} views
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleShare(post)} className="text-xs text-primary font-semibold">Share</button>
                  {user?.role === 'landlord' && post.status === 'open' && (
                    <Link to={`/dashboard/community/${post.id}`} className="btn-primary text-xs py-1.5 px-3">
                      Respond
                    </Link>
                  )}
                  {user?.id === post.tenant_id && post.status === 'open' && (
                    <button
                      onClick={async () => {
                        try {
                          await api.patch(`/community/posts/${post.id}/close`)
                          setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'closed' } : p))
                        } catch {}
                      }}
                      className="text-xs text-text-muted font-semibold"
                    >
                      I found a place
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
