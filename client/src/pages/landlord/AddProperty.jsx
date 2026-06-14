import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Minus, Plus, Camera, FileCheck, CheckCircle, XCircle, Loader2, Home, Building2, Store, BedDouble, LayoutGrid, Upload, X, Droplets, Zap, Car, ShieldCheck, Wifi, Wind, TreePine, Utensils, AlertCircle } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

const regions = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Northern', 'Volta', 'Upper East', 'Upper West', 'Bono',
  'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North',
]

const propertyTypes = [
  { value: 'apartment', label: 'Apartment', icon: Building2 },
  { value: 'house', label: 'House', icon: Home },
  { value: 'room', label: 'Single Room', icon: BedDouble },
  { value: 'studio', label: 'Studio', icon: LayoutGrid },
  { value: 'shop', label: 'Shop / Office', icon: Store },
]

const amenityOptions = [
  { value: 'water', label: 'Running Water', icon: Droplets },
  { value: 'electricity', label: 'Electricity', icon: Zap },
  { value: 'parking', label: 'Parking', icon: Car },
  { value: 'security', label: 'Security', icon: ShieldCheck },
  { value: 'wifi', label: 'WiFi', icon: Wifi },
  { value: 'ac', label: 'Air Conditioning', icon: Wind },
  { value: 'garden', label: 'Compound', icon: TreePine },
  { value: 'kitchen', label: 'Kitchen', icon: Utensils },
]

const docTypes = [
  { value: 'land_title', label: 'Land Title Certificate' },
  { value: 'indenture', label: 'Indenture' },
  { value: 'site_plan', label: 'Site Plan' },
  { value: 'property_tax', label: 'Property Tax Receipt' },
  { value: 'building_permit', label: 'Building Permit' },
  { value: 'lease_agreement', label: 'Lease Agreement' },
]

export default function AddProperty() {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [saveError, setSaveError] = useState('')
  const [form, setForm] = useState({
    address: '',
    region: 'Greater Accra',
    monthly_rent: '',
    bedrooms: 2,
    property_type: 'apartment',
    description: '',
    amenities: [],
  })
  const [docType, setDocType] = useState('land_title')
  const [docImage, setDocImage] = useState(null)
  const [docPreview, setDocPreview] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [verResult, setVerResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [propertyId, setPropertyId] = useState(null)
  const fileRef = useRef(null)
  const navigate = useNavigate()

  function update(field) {
    return (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  function toggleAmenity(val) {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(val)
        ? prev.amenities.filter(a => a !== val)
        : [...prev.amenities, val],
    }))
  }

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

  async function handleCreateProperty() {
    setSaving(true)
    setSaveError('')
    try {
      const { data } = await api.post('/properties', {
        ...form,
        monthly_rent: Number(form.monthly_rent),
      })
      setPropertyId(data.id)
      setSaving(false)
      setStep(3)
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to create property')
      setSaving(false)
    }
  }

  async function handleVerifyDoc() {
    if (!docImage || !propertyId) return
    setVerifying(true)
    setVerResult(null)

    try {
      const { data } = await api.post(`/properties/${propertyId}/verify-document`, {
        document_image: docImage,
        document_type: docType,
      })
      setVerResult(data)
    } catch {
      setVerResult({ verified: false, reason: 'Verification failed. Please try again.' })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => step > 1 && !propertyId ? setStep(step - 1) : navigate(-1)} className="text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Add Property</h1>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 rounded-full flex-1 transition-all ${s <= step ? 'bg-primary' : 'bg-surface-border'}`} />
        ))}
      </div>
      <div className="flex justify-between text-xs text-text-muted">
        <span className={step === 1 ? 'text-primary font-semibold' : ''}>Details</span>
        <span className={step === 2 ? 'text-primary font-semibold' : ''}>Description</span>
        <span className={step === 3 ? 'text-primary font-semibold' : ''}>Documents</span>
      </div>

      {!user?.is_verified && (
        <GlassCard className="border-orange-300 bg-orange-50/50">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-700 text-sm">Verification Required</p>
              <p className="text-xs text-text-muted mt-1">You need to complete identity verification before listing a property.</p>
              <Link to="/dashboard/kyc" className="text-xs text-primary font-semibold mt-2 inline-block">
                Verify your account &rarr;
              </Link>
            </div>
          </div>
        </GlassCard>
      )}

      {saveError && (
        <GlassCard className="border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{saveError}</p>
          </div>
        </GlassCard>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-3 block">Property Type</label>
            <div className="grid grid-cols-3 gap-2">
              {propertyTypes.map(t => {
                const Icon = t.icon
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, property_type: t.value }))}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                      form.property_type === t.value
                        ? 'border-primary bg-primary/5'
                        : 'border-surface-border bg-surface-card'
                    }`}
                  >
                    <Icon size={22} className={form.property_type === t.value ? 'text-primary' : 'text-text-dim'} />
                    <span className={`text-[11px] font-semibold ${form.property_type === t.value ? 'text-primary' : 'text-text-muted'}`}>{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Street Address</label>
            <input
              type="text"
              placeholder="e.g. 42 Independence Ave, Ridge"
              value={form.address}
              onChange={update('address')}
              className="w-full"
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
            <GlassCard className="p-4">
              <input
                type="number"
                placeholder="0.00"
                value={form.monthly_rent}
                onChange={update('monthly_rent')}
                className="w-full text-2xl font-bold border-none bg-transparent p-0 focus:ring-0"
              />
              <p className="text-xs text-text-muted mt-2">Set a competitive price for your area</p>
            </GlassCard>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!form.address || !form.monthly_rent}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg disabled:opacity-50"
          >
            Next: Description <ArrowRight size={20} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Description</label>
            <textarea
              placeholder="Describe your property... Location advantages, nearby landmarks, condition, etc."
              value={form.description}
              onChange={update('description')}
              className="w-full min-h-[120px] resize-none"
              rows={4}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-3 block">Amenities</label>
            <div className="grid grid-cols-2 gap-2">
              {amenityOptions.map(a => {
                const Icon = a.icon
                const selected = form.amenities.includes(a.value)
                return (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => toggleAmenity(a.value)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all ${
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-surface-border bg-surface-card'
                    }`}
                  >
                    <Icon size={18} className={selected ? 'text-primary' : 'text-text-dim'} />
                    <span className={`text-sm font-medium ${selected ? 'text-primary' : 'text-text-muted'}`}>{a.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={handleCreateProperty}
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg"
          >
            {saving ? (
              <><Loader2 size={20} className="animate-spin" /> Creating...</>
            ) : (
              <>Create & Verify Documents <ArrowRight size={20} /></>
            )}
          </button>

          <button
            onClick={async () => {
              setSaving(true)
              try {
                await api.post('/properties', { ...form, monthly_rent: Number(form.monthly_rent) })
                navigate('/dashboard/properties')
              } catch { setSaving(false) }
            }}
            disabled={saving}
            className="w-full text-center text-text-muted text-sm font-medium py-2"
          >
            Skip document verification
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <GlassCard className="flex items-start gap-3 border-primary/30">
            <CheckCircle size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-primary">Property Created</p>
              <p className="text-xs text-text-muted mt-0.5">Now verify ownership with a property document to build trust with tenants.</p>
            </div>
          </GlassCard>

          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">Document Type</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full">
              {docTypes.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-3 block">Upload Document</label>

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
                className="w-full border-2 border-dashed border-surface-border rounded-xl p-8 flex flex-col items-center gap-3 bg-surface-card hover:border-primary/40 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload size={24} className="text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Tap to upload document</p>
                  <p className="text-xs text-text-muted mt-1">Take a photo or select from gallery</p>
                </div>
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
          </div>

          {verifying && (
            <div className="flex flex-col items-center py-8 space-y-3">
              <Loader2 size={40} className="text-primary animate-spin" />
              <p className="text-sm text-text-muted font-medium">AI is verifying your document...</p>
              <p className="text-xs text-text-dim">Checking authenticity, stamps, and signatures</p>
            </div>
          )}

          {verResult && !verifying && (
            <GlassCard className={verResult.verified ? 'border-green-200' : 'border-red-200'}>
              <div className="flex items-start gap-3">
                {verResult.verified ? (
                  <CheckCircle size={22} className="text-accent-success flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={22} className="text-accent-danger flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${verResult.verified ? 'text-accent-success' : 'text-accent-danger'}`}>
                    {verResult.verified ? 'Document Verified' : 'Verification Failed'}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{verResult.reason}</p>

                  {verResult.extracted && (
                    <div className="mt-3 space-y-1.5 pt-3 border-t border-surface-border">
                      {verResult.extracted.owner_name && (
                        <div className="flex justify-between text-xs">
                          <span className="text-text-muted">Owner</span>
                          <span className="font-medium">{verResult.extracted.owner_name}</span>
                        </div>
                      )}
                      {verResult.extracted.property_location && (
                        <div className="flex justify-between text-xs">
                          <span className="text-text-muted">Location</span>
                          <span className="font-medium">{verResult.extracted.property_location}</span>
                        </div>
                      )}
                      {verResult.extracted.plot_number && (
                        <div className="flex justify-between text-xs">
                          <span className="text-text-muted">Plot No.</span>
                          <span className="font-medium">{verResult.extracted.plot_number}</span>
                        </div>
                      )}
                      {verResult.extracted.registration_number && (
                        <div className="flex justify-between text-xs">
                          <span className="text-text-muted">Reg. No.</span>
                          <span className="font-medium">{verResult.extracted.registration_number}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          )}

          {docImage && !verifying && !verResult && (
            <button
              onClick={handleVerifyDoc}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <FileCheck size={18} /> Verify Document
            </button>
          )}

          {!verResult?.verified && verResult && (
            <button
              onClick={() => { setDocPreview(null); setDocImage(null); setVerResult(null) }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Camera size={18} /> Try Another Photo
            </button>
          )}

          <button
            onClick={() => navigate('/dashboard/properties')}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-lg transition-all ${
              verResult?.verified
                ? 'btn-primary'
                : 'bg-surface-card border border-surface-border text-text-muted'
            }`}
          >
            {verResult?.verified ? 'Done' : 'Skip & Finish Later'} <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
