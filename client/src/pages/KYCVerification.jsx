import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, CheckCircle, XCircle, ArrowLeft, Shield, Loader2 } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import api from '../services/api'

export default function KYCVerification() {
  const [step, setStep] = useState('upload')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()
  const navigate = useNavigate()

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImage(reader.result)
      setPreview(reader.result)
      setStep('preview')
    }
    reader.readAsDataURL(file)
  }

  async function handleVerify() {
    setStep('processing')
    setLoading(true)
    try {
      const { data } = await api.post('/kyc/verify', { image })
      setResult(data)
      setStep(data.verified ? 'success' : 'failed')
    } catch {
      setResult({ verified: false, reason: 'Verification service unavailable. Try again.' })
      setStep('failed')
    } finally {
      setLoading(false)
    }
  }

  function handleRetry() {
    setImage(null)
    setPreview(null)
    setResult(null)
    setStep('upload')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">KYC Verification</h1>
      </div>

      {step === 'upload' && (
        <>
          <GlassCard className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-4">
              <Shield size={32} className="text-primary" />
            </div>
            <h2 className="text-lg font-bold">Verify Your Identity</h2>
            <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
              Upload a clear photo of your Ghana Card (front side). Our AI will verify your identity instantly.
            </p>
          </GlassCard>

          <div className="space-y-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4"
            >
              <Camera size={20} /> Take Photo
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-secondary w-full flex items-center justify-center gap-2 py-4"
            >
              <Upload size={20} /> Upload from Gallery
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />

          <GlassCard className="space-y-2">
            <h3 className="text-sm font-semibold text-text-muted">Tips for a clear photo:</h3>
            <ul className="text-xs text-text-dim space-y-1">
              <li>Place card on a flat, dark surface</li>
              <li>Ensure all text is visible and not blurry</li>
              <li>Avoid glare from lighting</li>
              <li>Show the full front side of the card</li>
            </ul>
          </GlassCard>
        </>
      )}

      {step === 'preview' && (
        <>
          <GlassCard className="overflow-hidden">
            <img src={preview} alt="Ghana Card" className="w-full rounded-xl" />
          </GlassCard>
          <p className="text-sm text-text-muted text-center">Make sure your Ghana Card details are clearly visible</p>
          <div className="flex gap-3">
            <button onClick={handleRetry} className="btn-ghost flex-1">Retake</button>
            <button onClick={handleVerify} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Shield size={18} /> Verify Now
            </button>
          </div>
        </>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 size={40} className="text-primary animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold">AI is reading your Ghana Card...</h2>
            <p className="text-sm text-text-muted mt-2">This takes a few seconds. Please wait.</p>
          </div>
          <div className="w-48 h-1 bg-surface-border rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '70%' }} />
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <CheckCircle size={48} className="text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold">Verification Successful!</h2>
            <p className="text-sm text-text-muted mt-2">Your identity has been confirmed.</p>
          </div>

          {result?.extracted && (
            <GlassCard className="w-full" glow="emerald">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Extracted Details</h3>
              <div className="space-y-2">
                {result.extracted.full_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Name</span>
                    <span className="font-medium">{result.extracted.full_name}</span>
                  </div>
                )}
                {result.extracted.card_number && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Card Number</span>
                    <span className="font-mono">{result.extracted.card_number}</span>
                  </div>
                )}
                {result.extracted.date_of_birth && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Date of Birth</span>
                    <span>{result.extracted.date_of_birth}</span>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          <button onClick={() => navigate('/profile')} className="btn-primary w-full">
            Back to Profile
          </button>
        </div>
      )}

      {step === 'failed' && (
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-400/20 flex items-center justify-center">
            <XCircle size={48} className="text-red-400" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold">Verification Failed</h2>
            <p className="text-sm text-text-muted mt-2">{result?.reason || 'Please try again with a clearer photo.'}</p>
          </div>
          <div className="w-full space-y-3">
            <button onClick={handleRetry} className="btn-primary w-full">Try Again</button>
            <button onClick={() => navigate('/profile')} className="btn-ghost w-full">Back to Profile</button>
          </div>
        </div>
      )}
    </div>
  )
}
