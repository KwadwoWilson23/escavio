import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, CheckCircle, XCircle, Clock, Shield, ShieldCheck, Star, FileText, Zap, Building2, Receipt, Briefcase, Banknote, Smartphone, Loader2, X } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'

const landlordDocTypes = [
  { value: 'property_title_deed', label: 'Property Title Deed', desc: 'Title deed, allocation letter, or site plan', icon: Building2 },
  { value: 'utility_bill', label: 'Utility Bill', desc: 'Electricity or water bill (last 3 months)', icon: Receipt },
  { value: 'business_registration', label: 'Business Registration', desc: 'If you are a property management company', icon: Briefcase },
]

const tenantDocTypes = [
  { value: 'employment_letter', label: 'Employment Letter', desc: 'Letter from employer confirming name, position, salary', icon: Briefcase },
  { value: 'momo_statement', label: 'MoMo Statement', desc: '3 months mobile money history showing income', icon: Smartphone },
  { value: 'bank_statement', label: 'Bank Statement', desc: '3 months bank statements showing regular income', icon: Banknote },
  { value: 'business_registration_income', label: 'Business Registration + Income', desc: 'GRA TIN certificate + 3 months business records', icon: FileText },
]

const trustLevels = {
  basic: { label: 'Basic', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', icon: Shield, desc: 'Identity Verified' },
  trusted: { label: 'Trusted', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: ShieldCheck, desc: 'Trusted Landlord' },
  premium: { label: 'Premium', color: 'text-accent-success', bg: 'bg-green-50', border: 'border-green-200', icon: Star, desc: 'Premium Verified Landlord' },
}

const statusBadge = {
  pending: { label: 'Pending Review', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock },
  approved: { label: 'Approved', color: 'text-accent-success bg-green-50 border-green-200', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-500 bg-red-50 border-red-200', icon: XCircle },
}

export default function VerificationDocs() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [kycStatus, setKycStatus] = useState(null)
  const [selectedType, setSelectedType] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef()

  const isLandlord = user?.role === 'landlord'
  const docTypes = isLandlord ? landlordDocTypes : tenantDocTypes

  useEffect(() => {
    Promise.all([
      api.get('/kyc/documents').then(r => r.data),
      api.get('/kyc/status').then(r => r.data),
    ]).then(([d, s]) => {
      setDocs(d)
      setKycStatus(s)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const submittedTypes = new Set(docs.map(d => d.doc_type))
  const approvedCount = docs.filter(d => d.status === 'approved').length
  const currentTrust = kycStatus?.trust_level || 'basic'
  const trustInfo = trustLevels[currentTrust] || trustLevels.basic
  const TrustIcon = trustInfo.icon

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file || !selectedType) return
    e.target.value = ''

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File must be under 10MB')
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (ev) => resolve(ev.target.result)
        reader.readAsDataURL(file)
      })

      const { data } = await api.post('/kyc/documents', {
        doc_type: selectedType,
        image: base64,
      })

      setDocs(prev => [data, ...prev])
      setSelectedType(null)
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Verification Documents</h1>
      </div>

      {!kycStatus?.is_verified && (
        <GlassCard className="border-amber-300 bg-amber-50/50">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-700 text-sm">Ghana Card Required First</p>
              <p className="text-xs text-amber-600/80 mt-1">
                Complete your Ghana Card verification before uploading additional documents.
              </p>
              <button onClick={() => navigate('/dashboard/kyc')} className="text-xs text-primary font-semibold mt-2 inline-block">
                Verify Ghana Card &rarr;
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard className={`${trustInfo.border} ${trustInfo.bg}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full ${trustInfo.bg} border ${trustInfo.border} flex items-center justify-center`}>
            <TrustIcon size={24} className={trustInfo.color} />
          </div>
          <div className="flex-1">
            <p className={`font-bold ${trustInfo.color}`}>Trust Level: {trustInfo.label}</p>
            <p className="text-xs text-text-muted mt-0.5">{trustInfo.desc}</p>
          </div>
        </div>
        {isLandlord && (
          <div className="mt-3 pt-3 border-t border-surface-border">
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className={`flex-1 h-2 rounded-full ${i <= approvedCount + (kycStatus?.is_verified ? 1 : 0) ? 'bg-primary' : 'bg-surface-border'}`} />
              ))}
            </div>
            <p className="text-[10px] text-text-dim mt-1.5">
              {approvedCount + (kycStatus?.is_verified ? 1 : 0)} of 3 documents verified
              {approvedCount < 2 && ' — upload more to increase trust'}
            </p>
          </div>
        )}
      </GlassCard>

      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          {isLandlord ? 'Upload Supporting Documents' : 'Proof of Income'}
        </h2>
        <p className="text-xs text-text-dim mb-4">
          {isLandlord
            ? 'Upload up to 2 additional documents alongside your Ghana Card to increase your trust level.'
            : 'Upload one proof of income document to complete your verification.'}
        </p>

        <div className="space-y-3">
          {docTypes.map(({ value, label, desc, icon: Icon }) => {
            const submitted = submittedTypes.has(value)
            const doc = docs.find(d => d.doc_type === value)
            const badge = doc ? statusBadge[doc.status] : null
            const BadgeIcon = badge?.icon

            return (
              <GlassCard key={value} className={submitted ? 'opacity-80' : ''}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${submitted ? 'bg-surface' : 'bg-primary/10'}`}>
                    <Icon size={20} className={submitted ? 'text-text-dim' : 'text-primary'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{label}</p>
                      {badge && (
                        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
                          <BadgeIcon size={10} /> {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                    {!submitted && kycStatus?.is_verified && (
                      <button
                        onClick={() => { setSelectedType(value); setUploadError(''); fileRef.current?.click() }}
                        disabled={uploading}
                        className="mt-2 text-xs text-primary font-semibold flex items-center gap-1"
                      >
                        <Upload size={12} /> Upload Document
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      </div>

      {uploadError && (
        <GlassCard className="border-red-200">
          <div className="flex items-start gap-3">
            <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        </GlassCard>
      )}

      {uploading && (
        <GlassCard className="flex items-center justify-center gap-3 py-6">
          <Loader2 size={24} className="text-primary animate-spin" />
          <p className="text-sm text-text-muted font-medium">Uploading document...</p>
        </GlassCard>
      )}

      {docs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Submitted Documents</h2>
          <div className="space-y-2">
            {docs.map(doc => {
              const badge = statusBadge[doc.status]
              const BadgeIcon = badge?.icon
              const typeInfo = [...landlordDocTypes, ...tenantDocTypes].find(t => t.value === doc.doc_type)
              return (
                <div key={doc.id} className="flex items-center gap-3 py-3 px-4 bg-surface rounded-xl border border-surface-border">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface-border">
                    {doc.image_url && (
                      <img src={doc.image_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{typeInfo?.label || doc.doc_type.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-text-dim">
                      {new Date(doc.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge?.color}`}>
                    <BadgeIcon size={10} /> {badge?.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {isLandlord && (
        <GlassCard className="flex items-start gap-3">
          <Zap size={16} className="text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-text-muted space-y-1">
            <p><strong className="text-text-primary">Basic</strong> (Ghana Card only) — grey shield badge</p>
            <p><strong className="text-blue-600">Trusted</strong> (Ghana Card + 1 doc) — blue shield badge</p>
            <p><strong className="text-accent-success">Premium</strong> (Ghana Card + 2 docs) — green shield with star</p>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
