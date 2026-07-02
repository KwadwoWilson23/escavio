import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Building2, MapPin, BedDouble, CheckCircle, Shield, Droplets, Zap, Car, ShieldCheck, Wifi, Wind, TreePine, Utensils, Loader2, AlertCircle, MessageSquare, Phone, Star } from 'lucide-react'
import { DetailSkeleton } from '../../components/ui/Skeleton'
import GlassCard from '../../components/ui/GlassCard'
import Badge from '../../components/ui/Badge'
import { formatGHS } from '../../utils/format'
import api from '../../services/api'

const amenityIcons = {
  water: Droplets, electricity: Zap, parking: Car, security: ShieldCheck,
  wifi: Wifi, ac: Wind, garden: TreePine, kitchen: Utensils,
}
const amenityLabels = {
  water: 'Running Water', electricity: 'Electricity', parking: 'Parking', security: 'Security',
  wifi: 'WiFi', ac: 'Air Conditioning', garden: 'Compound', kitchen: 'Kitchen',
}

const typeLabels = {
  apartment: 'Apartment', house: 'House', room: 'Single Room', studio: 'Studio', shop: 'Shop/Office',
}

export default function PropertyView() {
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [requestResult, setRequestResult] = useState(null)
  const [requestError, setRequestError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(({ data }) => setProperty(data))
      .catch(() => navigate('/dashboard/browse'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleRequest() {
    setRequesting(true)
    setRequestError('')
    try {
      const { data } = await api.post(`/properties/${id}/request`)
      setRequestResult(data)
    } catch (err) {
      setRequestError(err.response?.data?.error || 'Failed to send request')
    } finally {
      setRequesting(false)
    }
  }

  if (loading) return <DetailSkeleton />

  if (!property) {
    return <div className="text-center py-12 text-text-muted">Property not found</div>
  }

  const amenities = Array.isArray(property.amenities) ? property.amenities : []

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1 truncate">Property Details</h1>
      </div>

      {property.images?.length > 0 || property.image_url ? (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
          {(property.images?.length > 0 ? property.images : [property.image_url]).map((img, i) => (
            <div key={i} className="w-full flex-shrink-0 snap-center">
              <img src={img} alt={`Property ${i + 1}`} className="w-full h-44 object-cover rounded-2xl border border-surface-border" />
            </div>
          ))}
        </div>
      ) : (
        <div className="h-44 bg-surface-card border border-surface-border rounded-2xl flex items-center justify-center">
          <Building2 size={56} className="text-text-dim" />
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="info">{typeLabels[property.property_type] || 'Property'}</Badge>
        <Badge variant={property.status === 'vacant' ? 'success' : 'warning'}>
          {property.status === 'vacant' ? 'AVAILABLE' : property.status?.toUpperCase()}
        </Badge>
        {property.document_verified && (
          <Badge variant="success">VERIFIED</Badge>
        )}
      </div>

      <GlassCard glow="primary">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-text-muted uppercase tracking-wider">Monthly Rent</span>
            <p className="text-3xl font-bold text-primary mt-1">{formatGHS(property.monthly_rent)}</p>
          </div>
          {property.document_verified && (
            <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full">
              <CheckCircle size={14} className="text-accent-success" />
              <span className="text-xs font-semibold text-accent-success">Verified</span>
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <MapPin size={16} className="flex-shrink-0" />
            <span>{property.address}, {property.region}</span>
          </div>
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <BedDouble size={16} className="flex-shrink-0" />
            <span>{property.bedrooms} Bedroom{property.bedrooms > 1 ? 's' : ''}</span>
          </div>
        </div>
      </GlassCard>

      {property.description && (
        <GlassCard>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">About this property</h3>
          <p className="text-sm text-text-primary leading-relaxed">{property.description}</p>
        </GlassCard>
      )}

      {amenities.length > 0 && (
        <GlassCard>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Amenities</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {amenities.map(a => {
              const Icon = amenityIcons[a] || ShieldCheck
              return (
                <div key={a} className="flex items-center gap-2 text-sm">
                  <Icon size={16} className="text-primary" />
                  <span>{amenityLabels[a] || a}</span>
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}

      {property.average_rating > 0 && (
        <GlassCard>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Tenant Reviews</h3>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{property.average_rating?.toFixed(1)}</p>
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={12} className={s <= Math.round(property.average_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              <p className="text-[10px] text-text-dim mt-1">{property.review_count} review{property.review_count !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Managed By</h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield size={22} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Escavio Verified Landlord</p>
            <span className="flex items-center gap-0.5 text-[10px] text-accent-success font-semibold">
              <CheckCircle size={10} /> Identity Verified
            </span>
          </div>
        </div>
        <div className="flex gap-2 mt-3 pt-3 border-t border-surface-border">
          <button
            onClick={async () => {
              try {
                const { data } = await api.post('/conversations', { property_id: id })
                navigate(`/dashboard/messages/${data.id}`)
              } catch (err) {
                alert(err.response?.data?.error || 'Cannot start conversation')
              }
            }}
            className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm py-2.5"
          >
            <MessageSquare size={16} /> Message
          </button>
          <button
            onClick={() => alert('Calling is routed through Escavio. Your number is protected. This feature requires Africa\'s Talking setup.')}
            className="flex-1 btn-ghost flex items-center justify-center gap-2 text-sm py-2.5 border border-surface-border"
          >
            <Phone size={16} /> Call
          </button>
        </div>
      </GlassCard>

      {requestResult ? (
        <GlassCard glow="success" className="text-center py-4">
          <CheckCircle size={36} className="text-accent-success mx-auto mb-2" />
          <p className="font-semibold text-accent-success">Request Sent!</p>
          <p className="text-sm text-text-muted mt-1">The landlord will review your profile and respond.</p>
          <Link to="/dashboard/browse" className="text-primary text-sm font-semibold mt-3 inline-block">
            Browse more properties
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {requestError && (
            <GlassCard className="border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700">{requestError}</p>
                  {requestError.includes('KYC') && (
                    <Link to="/dashboard/kyc" className="text-xs text-primary font-semibold mt-1 inline-block">
                      Complete Verification &rarr;
                    </Link>
                  )}
                  {requestError.includes('wallet') && (
                    <Link to="/dashboard/wallet" className="text-xs text-primary font-semibold mt-1 inline-block">
                      Top up your wallet &rarr;
                    </Link>
                  )}
                </div>
              </div>
            </GlassCard>
          )}

          <GlassCard className="space-y-1">
            <p className="text-xs text-text-muted">To request this property you need:</p>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Security deposit</span>
              <span className="font-semibold">{formatGHS(property.monthly_rent)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">First month rent</span>
              <span className="font-semibold">{formatGHS(property.monthly_rent)}</span>
            </div>
            <div className="border-t border-surface-border pt-2 flex justify-between text-sm font-bold">
              <span className="text-primary">Min. wallet balance</span>
              <span className="text-primary">{formatGHS(property.monthly_rent * 2)}</span>
            </div>
          </GlassCard>

          <button
            onClick={handleRequest}
            disabled={requesting}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-lg bg-emerald-400 text-slate-950 active:scale-95 transition-all disabled:opacity-50"
          >
            {requesting ? (
              <><Loader2 size={20} className="animate-spin" /> Sending Request...</>
            ) : (
              'Request This Property'
            )}
          </button>
        </div>
      )}

      <GlassCard className="flex items-start gap-3">
        <Shield size={16} className="text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted">
          All rent payments go through <span className="text-primary font-semibold">Escavio escrow</span>. Your money is protected until conditions are met. Max 6 months advance per Ghana Rent Act 2026.
        </p>
      </GlassCard>
    </div>
  )
}
