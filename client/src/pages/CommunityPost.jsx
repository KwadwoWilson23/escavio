import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, BedDouble, Calendar, Eye, Building2, CheckCircle } from 'lucide-react'
import { DetailSkeleton } from '../components/ui/Skeleton'
import GlassCard from '../components/ui/GlassCard'
import Badge from '../components/ui/Badge'
import { formatGHS } from '../utils/format'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function CommunityPost() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [message, setMessage] = useState('')
  const [responding, setResponding] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/community/posts/${id}`)
        setPost(data)
        if (user?.role === 'landlord') {
          const { data: props } = await api.get('/properties/mine')
          setProperties(props.filter(p => p.status === 'vacant'))
        }
      } catch {
        navigate('/dashboard/community')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleRespond(e) {
    e.preventDefault()
    if (!selectedProperty) return
    setResponding(true)
    try {
      await api.post(`/community/posts/${id}/respond`, {
        property_id: selectedProperty,
        message: message.trim() || null,
      })
      const { data } = await api.get(`/community/posts/${id}`)
      setPost(data)
      setMessage('')
      setSelectedProperty('')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to respond')
    } finally {
      setResponding(false)
    }
  }

  if (loading) return <DetailSkeleton />
  if (!post) return null

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/community')} className="text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Housing Request</h1>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold">{post.tenant?.full_name?.[0] || 'T'}</span>
          </div>
          <div>
            <p className="font-semibold">{post.tenant?.full_name || 'Verified Tenant'}</p>
            <span className="flex items-center gap-0.5 text-[10px] text-accent-success font-semibold">
              <CheckCircle size={10} /> Verified Tenant
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={14} className="text-primary" /> <span>{post.location_preference}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BedDouble size={14} className="text-primary" /> <span>{post.bedrooms_needed} Bedroom{post.bedrooms_needed > 1 ? 's' : ''}</span>
          </div>
          {post.max_budget && <p className="text-lg font-bold text-primary">Budget: {formatGHS(post.max_budget)}/mo</p>}
          {post.move_in_date && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Calendar size={12} /> Move-in: {new Date(post.move_in_date).toLocaleDateString('en-GH', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          )}
          {post.additional_notes && <p className="text-sm text-text-muted mt-2">{post.additional_notes}</p>}
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-surface-border text-xs text-text-dim">
          <span className="flex items-center gap-1"><Eye size={10} /> {post.views_count} views</span>
          <Badge variant={post.status === 'open' ? 'success' : 'neutral'}>{post.status?.toUpperCase()}</Badge>
        </div>
      </GlassCard>

      {user?.role === 'landlord' && post.status === 'open' && (
        <form onSubmit={handleRespond} className="glass-card p-5 space-y-4">
          <h3 className="font-semibold text-sm">Offer a Property</h3>

          <div>
            <label className="text-xs font-semibold text-text-muted mb-1 block">Select your property</label>
            <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="w-full" required>
              <option value="">Choose a vacant property...</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.address} — {formatGHS(p.monthly_rent)}/mo</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted mb-1 block">Message (optional)</label>
            <textarea
              placeholder="Tell the tenant about your property..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full min-h-[80px] resize-none"
              maxLength={500}
            />
          </div>

          <button type="submit" disabled={responding || !selectedProperty} className="btn-primary w-full disabled:opacity-50">
            {responding ? 'Sending...' : 'Respond with Property'}
          </button>
        </form>
      )}

      {post.responses?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-muted">{post.responses.length} Response{post.responses.length > 1 ? 's' : ''}</h3>
          {post.responses.map(resp => (
            <GlassCard key={resp.id}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 size={14} className="text-primary" />
                </div>
                <p className="text-sm font-semibold">{resp.landlord?.full_name || 'Verified Landlord'}</p>
              </div>
              {resp.property && (
                <Link to={`/dashboard/browse/${resp.property_id}`} className="block bg-surface rounded-xl p-3 border border-surface-border">
                  <p className="font-semibold text-sm">{resp.property.address}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                    <span>{resp.property.bedrooms} BR</span>
                    <span className="font-bold text-primary">{formatGHS(resp.property.monthly_rent)}/mo</span>
                  </div>
                </Link>
              )}
              {resp.message && <p className="text-xs text-text-muted mt-2">{resp.message}</p>}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
