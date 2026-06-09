import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, CheckCircle, XCircle, ArrowLeft, Shield, Loader2, RotateCcw, Zap, AlertTriangle, X, Search, FileText, ShieldCheck, UserCheck } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import api from '../services/api'

const CARD_ASPECT = 1.586

function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef()
  const canvasRef = useRef()
  const streamRef = useRef()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play()
            setReady(true)
          }
        }
      } catch {
        if (mounted) setError('Camera access denied. Please allow camera permission or use gallery upload.')
      }
    }
    startCamera()
    return () => {
      mounted = false
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    streamRef.current?.getTracks().forEach(t => t.stop())
    onCapture(dataUrl)
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
        <AlertTriangle size={48} className="text-yellow-400 mb-4" />
        <p className="text-white text-center mb-6">{error}</p>
        <button onClick={onClose} className="btn-primary">Go Back</button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4">
        <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); onClose() }} className="text-white">
          <X size={24} />
        </button>
        <span className="text-white text-sm font-medium">Scan Ghana Card</span>
        <div className="w-6" />
      </div>

      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative" style={{ width: '88%', aspectRatio: CARD_ASPECT }}>
            <div className="absolute inset-0 border-2 border-white/80 rounded-2xl" />
            <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
            <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
            <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
            <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />
          </div>
        </div>

        <div className="absolute inset-x-0 top-4 flex justify-center">
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
            <p className="text-white text-xs font-medium text-center">
              {ready ? 'Position your Ghana Card within the frame' : 'Starting camera...'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col items-center gap-3">
        <button
          onClick={capture}
          disabled={!ready}
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
        >
          <div className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center">
            <Camera size={28} className="text-primary" />
          </div>
        </button>
        <p className="text-white/60 text-xs">Tap to capture</p>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

function QualityCheck({ imageData }) {
  const [checks, setChecks] = useState({ resolution: null, aspect: null, size: null })

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const w = img.width
      const h = img.height
      const megapixels = (w * h) / 1000000
      const aspect = w / h

      setChecks({
        resolution: megapixels >= 0.3 ? 'pass' : 'fail',
        aspect: (aspect >= 1.2 && aspect <= 2.0) || (aspect >= 0.5 && aspect <= 0.85) ? 'pass' : 'warn',
        size: megapixels <= 20 ? 'pass' : 'warn',
      })
    }
    img.src = imageData
  }, [imageData])

  const allPass = checks.resolution !== 'fail'

  const items = [
    { key: 'resolution', label: 'Image quality', pass: checks.resolution === 'pass' },
    { key: 'aspect', label: 'Card dimensions', pass: checks.aspect === 'pass' },
    { key: 'size', label: 'File size', pass: checks.size === 'pass' },
  ]

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.key} className="flex items-center gap-2 text-xs">
          {item.pass ? (
            <CheckCircle size={14} className="text-accent-success" />
          ) : (
            <AlertTriangle size={14} className="text-accent-warning" />
          )}
          <span className={item.pass ? 'text-text-muted' : 'text-accent-warning'}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function KYCVerification() {
  const [step, setStep] = useState('intro')
  const [image, setImage] = useState(null)
  const [result, setResult] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const galleryRef = useRef()
  const navigate = useNavigate()

  function handleGalleryFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) {
      alert('Image too large. Please use a photo under 15MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImage(reader.result)
      setStep('preview')
    }
    reader.readAsDataURL(file)
  }

  function handleCameraCapture(dataUrl) {
    setShowCamera(false)
    setImage(dataUrl)
    setStep('preview')
  }

  function compressImage(dataUrl, maxWidth = 1200) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width
        let h = img.height
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w)
          w = maxWidth
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = dataUrl
    })
  }

  async function handleVerify() {
    setStep('processing')
    setProcessingStep(0)

    const timers = [
      setTimeout(() => setProcessingStep(1), 1500),
      setTimeout(() => setProcessingStep(2), 3500),
      setTimeout(() => setProcessingStep(3), 5500),
    ]

    try {
      const compressed = await compressImage(image)
      const { data } = await api.post('/kyc/verify', { image: compressed })
      timers.forEach(clearTimeout)
      setResult(data)
      setStep(data.verified ? 'success' : 'failed')
    } catch {
      timers.forEach(clearTimeout)
      setResult({ verified: false, reason: 'Verification service unavailable. Please check your connection and try again.' })
      setStep('failed')
    }
  }

  function handleRetry() {
    setImage(null)
    setResult(null)
    setStep('intro')
    setProcessingStep(0)
  }

  const processingSteps = [
    { label: 'Detecting Ghana Card...', Icon: Search },
    { label: 'Reading card details...', Icon: FileText },
    { label: 'Verifying authenticity...', Icon: ShieldCheck },
    { label: 'Cross-referencing profile...', Icon: UserCheck },
  ]

  return (
    <>
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-primary">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold">Identity Verification</h1>
        </div>

        {step === 'intro' && (
          <>
            <div className="flex gap-2 mb-2">
              {[1, 2, 3].map(n => (
                <div key={n} className={`flex-1 h-1 rounded-full ${n === 1 ? 'bg-primary' : 'bg-surface-border'}`} />
              ))}
            </div>

            <GlassCard className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Shield size={32} className="text-primary" />
              </div>
              <h2 className="text-lg font-bold">Verify with Ghana Card</h2>
              <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
                Take a photo or upload an image of the <strong>front side</strong> of your Ghana Card. Our AI verifies your identity in seconds.
              </p>
            </GlassCard>

            <div className="glass-card p-4 space-y-3">
              <div className="relative bg-slate-100 rounded-xl overflow-hidden" style={{ aspectRatio: CARD_ASPECT }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-text-dim">
                  <div className="border-2 border-dashed border-text-dim/30 rounded-xl w-[90%] h-[85%] flex flex-col items-center justify-center gap-2">
                    <Shield size={32} className="text-text-dim/40" />
                    <span className="text-xs font-medium text-text-dim/60">GHANA CARD FRONT</span>
                    <span className="text-[10px] text-text-dim/40">GHA-XXXXXXXXX-X</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-text-muted">
                <div className="flex items-center gap-1.5"><CheckCircle size={12} className="text-accent-success" /> Good lighting</div>
                <div className="flex items-center gap-1.5"><CheckCircle size={12} className="text-accent-success" /> Flat surface</div>
                <div className="flex items-center gap-1.5"><CheckCircle size={12} className="text-accent-success" /> No glare</div>
                <div className="flex items-center gap-1.5"><CheckCircle size={12} className="text-accent-success" /> Full card visible</div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowCamera(true)}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4"
              >
                <Camera size={20} /> Take Photo
              </button>
              <button
                onClick={() => galleryRef.current?.click()}
                className="btn-secondary w-full flex items-center justify-center gap-2 py-4"
              >
                <Upload size={20} /> Upload from Gallery
              </button>
            </div>

            <input
              ref={galleryRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleGalleryFile}
              className="hidden"
            />
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="flex gap-2 mb-2">
              {[1, 2, 3].map(n => (
                <div key={n} className={`flex-1 h-1 rounded-full ${n <= 2 ? 'bg-primary' : 'bg-surface-border'}`} />
              ))}
            </div>

            <GlassCard className="overflow-hidden p-0">
              <img src={image} alt="Ghana Card" className="w-full rounded-xl" />
            </GlassCard>

            {image && <QualityCheck imageData={image} />}

            <GlassCard className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-accent-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Check your image</p>
                <ul className="text-xs text-text-muted mt-1 space-y-0.5">
                  <li>All 4 corners of the card are visible</li>
                  <li>Text and photo are clear and readable</li>
                  <li>No fingers covering the card details</li>
                </ul>
              </div>
            </GlassCard>

            <div className="flex gap-3">
              <button onClick={handleRetry} className="flex-1 bg-surface-card border border-surface-border text-text-muted font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all">
                <RotateCcw size={16} /> Retake
              </button>
              <button onClick={handleVerify} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3.5">
                <Zap size={16} /> Verify
              </button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <>
            <div className="flex gap-2 mb-2">
              {[1, 2, 3].map(n => (
                <div key={n} className="flex-1 h-1 rounded-full bg-primary" />
              ))}
            </div>

            <div className="flex flex-col items-center justify-center py-8 space-y-8">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center relative">
                <Loader2 size={48} className="text-primary animate-spin" />
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" style={{ animationDuration: '1.5s' }} />
              </div>

              <div className="w-full space-y-3">
                {processingSteps.map((s, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                    i < processingStep ? 'bg-primary/5' : i === processingStep ? 'bg-primary/10 border border-primary/20' : 'opacity-30'
                  }`}>
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {i < processingStep ? (
                        <CheckCircle size={20} className="text-accent-success" />
                      ) : (
                        <s.Icon size={20} className={i === processingStep ? 'text-primary' : 'text-text-dim'} />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${i <= processingStep ? 'text-text-primary' : 'text-text-dim'}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-text-dim text-center">This usually takes 5-10 seconds</p>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="w-24 h-24 rounded-full bg-accent-success/10 flex items-center justify-center">
              <CheckCircle size={56} className="text-accent-success" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold">Verified!</h2>
              <p className="text-sm text-text-muted mt-2">Your identity has been confirmed successfully.</p>
            </div>

            {result?.extracted && (
              <GlassCard className="w-full" glow="primary">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Verified Details</h3>
                <div className="space-y-3">
                  {result.extracted.full_name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Full Name</span>
                      <span className="font-semibold">{result.extracted.full_name}</span>
                    </div>
                  )}
                  {result.extracted.card_number && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Card Number</span>
                      <span className="font-mono font-semibold">{result.extracted.card_number}</span>
                    </div>
                  )}
                  {result.extracted.date_of_birth && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Date of Birth</span>
                      <span className="font-medium">{result.extracted.date_of_birth}</span>
                    </div>
                  )}
                  {result.extracted.gender && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Gender</span>
                      <span className="font-medium">{result.extracted.gender === 'M' ? 'Male' : 'Female'}</span>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            <GlassCard className="w-full flex items-center gap-3">
              <Shield size={20} className="text-primary flex-shrink-0" />
              <p className="text-xs text-text-muted">Your Ghana Card image was processed in real-time and not stored. Only the verification result is saved.</p>
            </GlassCard>

            <button onClick={() => navigate('/profile')} className="btn-primary w-full">
              Back to Profile
            </button>
          </div>
        )}

        {step === 'failed' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle size={56} className="text-accent-danger" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold">Verification Failed</h2>
              <p className="text-sm text-text-muted mt-2 max-w-xs">{result?.reason || 'Please try again with a clearer photo.'}</p>
            </div>

            {result?.extracted?.issues?.length > 0 && (
              <GlassCard className="w-full">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Issues Found</h3>
                <ul className="space-y-2">
                  {result.extracted.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                      <XCircle size={14} className="text-accent-danger flex-shrink-0 mt-0.5" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}

            <GlassCard className="w-full space-y-2">
              <h3 className="text-sm font-semibold">Common reasons for failure:</h3>
              <ul className="text-xs text-text-muted space-y-1">
                <li>Blurry or low-resolution image</li>
                <li>Glare covering card text or photo</li>
                <li>Card partially cut off in the frame</li>
                <li>Name on card doesn't match your profile</li>
                <li>Image is not a Ghana Card</li>
              </ul>
            </GlassCard>

            <div className="w-full space-y-3">
              <button onClick={handleRetry} className="btn-primary w-full flex items-center justify-center gap-2">
                <RotateCcw size={16} /> Try Again
              </button>
              <button onClick={() => navigate('/profile')} className="bg-surface-card border border-surface-border text-text-muted font-semibold py-3 rounded-full w-full active:scale-95 transition-all">
                Back to Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
