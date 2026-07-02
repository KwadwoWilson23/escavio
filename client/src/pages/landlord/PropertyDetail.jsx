import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Building2, MapPin, BedDouble, CheckCircle, XCircle, FileCheck, Upload, Camera, Loader2, X, Shield, Edit3, Droplets, Zap, Car, ShieldCheck, Wifi, Wind, TreePine, Utensils } from 'lucide-react'
import { DetailSkeleton } from '../../components/ui/Skeleton'
import GlassCard from '../../components/ui/GlassCard'
import Badge from '../../components/ui/Badge'
import { formatGHS } from '../../utils/format'
import api from '../../services/api'

const amenityIcons = {
  water: Droplets,
  electricity: Zap,
  parking: Car,
  security: ShieldCheck,
  wifi: Wifi,
  ac: Wind,
  garden: TreePine,
  kitchen: Utensils,
}

const amenityLabels = {
  water: 'Running Water',
  electricity: 'Electricity',
  parking: 'Parking',
  security: 'Security',
  wifi: 'WiFi',
  ac: 'Air Conditioning',
  garden: 'Compound',
  kitchen: 'Kitchen',
}

const docTypeLabels = {
  land_title: 'Land Title Certificate',
  indenture: 'Indenture',
  site_plan: 'Site Plan',
  property_tax: 'Property Tax Receipt',
  building_permit: 'Building Permit',
  lease_agreement: 'Lease Agreement',
}

const docTypes = [
  { value: 'land_title', label: 'Land Title Certificate' },
  { value: 'indenture', label: 'Indenture' },
  { value: 'site_plan', label: 'Site Plan' },
  { value: 'property_tax', label: 'Property Tax Receipt' },
  { value: 'building_permit', label: 'Building Permit' },
  { value: 'lease_agreement', label: 'Lease Agreement' },
]

export default function PropertyDetail() {
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showVerify, setShowVerify] = useState(false)
  const [docType, setDocType] = useState('land_title')
  const [docImage, setDocImage] = useState(null)
  const [docPreview, setDocPreview] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [verResult, setVerResult] = useState(null)
  const fileRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(({ data }) => setProperty(data))
      .catch(() => navigate('/dashboard/properties'))
      .finally(() => setLoading(false))
  }, [id])

  function handleDocCapture(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setVerResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setDocPreview(ev.target.result)
      setDocImage(ev.target.result.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  async function handleVerify() {
    if (!docImage) return
    setVerifying(true)
    setVerResult(null)
    try {
      const { data } = await api.post(`/properties/${id}/verify-document`, {
        document_image: docImage,
        document_type: docType,
      })
      setVerResult(data)
      if (data.verified) {
        setProperty(prev => ({ ...prev, document_verified: true, document_type: docType, verified_at: new Date().toISOString() }))
      }
    } catch {
      setVerResult({ verified: false, reason: 'Verification failed. Please try again.' })
    } finally {
      setVerifying(false)
    }
  }

  if (loading) return <DetailSkeleton />

  if (!property) {
    return <div className="text-center py-12 text-text-muted">Property not found</div>
  }

  const amenities = Array.isArray(property.amenities) ? property.amenities : []
  const typeLabel = property.property_type ? property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1) : 'Property'

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1 truncate">{property.address}</h1>
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
        <Badge variant={property.status === 'occupied' ? 'success' : property.status === 'vacant' ? 'info' : 'warning'}>
          {property.status?.toUpperCase()}
        </Badge>
        <Badge variant="info">{typeLabel}</Badge>
        {property.document_verified && (
          <Badge variant="success">VERIFIED</Badge>
        )}
      </div>

      <GlassCard>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <MapPin size={16} />
            <span>{property.address}, {property.region}</span>
          </div>
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <BedDouble size={16} />
            <span>{property.bedrooms} Bedroom{property.bedrooms > 1 ? 's' : ''}</span>
          </div>
          <div className="pt-3 border-t border-surface-border">
            <span className="text-xs text-text-muted uppercase tracking-wider">Monthly Rent</span>
            <p className="text-2xl font-bold text-primary mt-1">{formatGHS(property.monthly_rent)}</p>
          </div>
        </div>
      </GlassCard>

      {property.description && (
        <GlassCard>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Description</h3>
          <p className="text-sm text-text-primary leading-relaxed">{property.description}</p>
        </GlassCard>
      )}

      {amenities.length > 0 && (
        <GlassCard>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Amenities</h3>
          <div className="grid grid-cols-2 gap-2">
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

      <GlassCard className={property.document_verified ? 'border-green-200' : 'border-surface-border'}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {property.document_verified ? (
              <CheckCircle size={22} className="text-accent-success flex-shrink-0 mt-0.5" />
            ) : (
              <Shield size={22} className="text-text-dim flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="text-sm font-semibold">
                {property.document_verified ? 'Document Verified' : 'Document Not Verified'}
              </h3>
              {property.document_verified ? (
                <>
                  <p className="text-xs text-text-muted mt-0.5">{docTypeLabels[property.document_type] || property.document_type}</p>
                  {property.verified_at && (
                    <p className="text-[10px] text-text-dim mt-1">Verified on {new Date(property.verified_at).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-text-muted mt-0.5">Verify your property documents to build trust with tenants</p>
              )}
            </div>
          </div>
          {!property.document_verified && (
            <button onClick={() => setShowVerify(!showVerify)} className="text-primary text-xs font-semibold">
              {showVerify ? 'Hide' : 'Verify'}
            </button>
          )}
        </div>

        {showVerify && !property.document_verified && (
          <div className="mt-4 pt-4 border-t border-surface-border space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-muted mb-2 block">Document Type</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full">
                {docTypes.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            {docPreview ? (
              <div className="relative">
                <img src={docPreview} alt="Document" className="w-full rounded-xl border border-surface-border" />
                <button
                  onClick={() => { setDocPreview(null); setDocImage(null); setVerResult(null) }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-surface-border rounded-xl p-6 flex flex-col items-center gap-2 bg-surface hover:border-primary/40 transition-colors"
              >
                <Upload size={22} className="text-primary" />
                <p className="text-xs font-semibold">Upload document photo</p>
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleDocCapture}
              className="hidden"
            />

            {verifying && (
              <div className="flex flex-col items-center py-4 space-y-2">
                <Loader2 size={32} className="text-primary animate-spin" />
                <p className="text-xs text-text-muted">Verifying document...</p>
              </div>
            )}

            {verResult && !verifying && (
              <div className={`p-3 rounded-xl ${verResult.verified ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start gap-2">
                  {verResult.verified ? (
                    <CheckCircle size={18} className="text-accent-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={18} className="text-accent-danger flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-semibold ${verResult.verified ? 'text-accent-success' : 'text-accent-danger'}`}>
                      {verResult.verified ? 'Verified' : 'Failed'}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{verResult.reason}</p>
                  </div>
                </div>
              </div>
            )}

            {docImage && !verifying && !verResult && (
              <button onClick={handleVerify} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                <FileCheck size={16} /> Verify Document
              </button>
            )}

            {verResult && !verResult.verified && (
              <button
                onClick={() => { setDocPreview(null); setDocImage(null); setVerResult(null) }}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                <Camera size={16} /> Try Again
              </button>
            )}
          </div>
        )}
      </GlassCard>

      <Link
        to="/dashboard/leases/new"
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Edit3 size={18} /> Create Lease for This Property
      </Link>
    </div>
  )
}
