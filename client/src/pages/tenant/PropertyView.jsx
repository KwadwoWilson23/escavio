import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, MapPin, BedDouble, CheckCircle, Shield, Phone, MessageCircle, Droplets, Zap, Car, ShieldCheck, Wifi, Wind, TreePine, Utensils, User } from 'lucide-react'
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
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(({ data }) => setProperty(data))
      .catch(() => navigate('/dashboard/browse'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Loading...</div>
  }

  if (!property) {
    return <div className="text-center py-12 text-text-muted">Property not found</div>
  }

  const amenities = Array.isArray(property.amenities) ? property.amenities : []
  const landlordPhone = property.landlord?.phone
  const displayPhone = landlordPhone
    ? (landlordPhone.startsWith('233') ? '0' + landlordPhone.slice(3) : landlordPhone).replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
    : null

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1 truncate">Property Details</h1>
      </div>

      <div className="h-44 bg-surface-card border border-surface-border rounded-2xl flex items-center justify-center">
        <Building2 size={56} className="text-text-dim" />
      </div>

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

      {property.landlord && (
        <GlassCard>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Landlord</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={22} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{property.landlord.full_name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {property.landlord.is_verified && (
                  <span className="flex items-center gap-0.5 text-[10px] text-accent-success font-semibold">
                    <CheckCircle size={10} /> KYC Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="space-y-3">
        {landlordPhone && (
          <a
            href={`tel:${landlordPhone}`}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
          >
            <Phone size={20} /> Call Landlord
          </a>
        )}
        {landlordPhone && (
          <a
            href={`https://wa.me/${landlordPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold bg-green-500 text-white"
          >
            <MessageCircle size={18} /> WhatsApp Landlord
          </a>
        )}
      </div>

      <GlassCard className="flex items-start gap-3">
        <Shield size={16} className="text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted">
          All rent payments go through <span className="text-primary font-semibold">Escavio escrow</span>. Your money is protected until conditions are met. Max 6 months advance per Ghana Rent Act 2026.
        </p>
      </GlassCard>
    </div>
  )
}
