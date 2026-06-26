import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Camera, Upload, CheckCircle, XCircle, ArrowLeft, Shield, Loader2, RotateCcw, Zap, AlertTriangle, X, Search, FileText, ShieldCheck, UserCheck, ScanFace } from 'lucide-react'
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

function SelfieCapture({ onCapture, onClose }) {
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
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
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
        if (mounted) setError('Front camera access denied. Please allow camera permission to complete face verification.')
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
    ctx.save()
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)
    ctx.restore()
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
        <span className="text-white text-sm font-medium">Face Verification</span>
        <div className="w-6" />
      </div>
      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-64 h-80">
            <svg viewBox="0 0 200 250" className="w-full h-full">
              <defs>
                <mask id="faceMask">
                  <rect width="200" height="250" fill="white" />
                  <ellipse cx="100" cy="115" rx="72" ry="90" fill="black" />
                </mask>
              </defs>
              <rect width="200" height="250" fill="rgba(0,0,0,0.55)" mask="url(#faceMask)" />
              <ellipse cx="100" cy="115" rx="72" ry="90" fill="none" stroke="#2563eb" strokeWidth="3" />
            </svg>
          </div>
        </div>
        <div className="absolute inset-x-0 top-4 flex justify-center">
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
            <p className="text-white text-xs font-medium text-center">
              {ready ? 'Position your face in the oval and look straight ahead' : 'Starting front camera...'}
            </p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-32 flex justify-center">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2 mx-6">
            <p className="text-white/80 text-[11px] text-center">Make sure you are in a well-lit area. Do not hold up a photo or wear a mask.</p>
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
            <ScanFace size={28} className="text-primary" />
          </div>
        </button>
        <p className="text-white/60 text-xs">Tap to take selfie</p>
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

function ProgressBar({ current, total }) {
  return (
    <div className="flex gap-2 mb-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`flex-1 h-1 rounded-full transition-colors duration-300 ${i < current ? 'bg-primary' : 'bg-surface-border'}`} />
      ))}
    </div>
  )
}

export default function KYCVerification() {
  const [step, setStep] = useState('intro')
  const [cardImage, setCardImage] = useState(null)
  const [backImage, setBackImage] = useState(null)
  const [selfieImage, setSelfieImage] = useState(null)
  const [cardResult, setCardResult] = useState(null)
  const [backResult, setBackResult] = useState(null)
  const [faceResult, setFaceResult] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [showBackCamera, setShowBackCamera] = useState(false)
  const [showSelfie, setShowSelfie] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [failReason, setFailReason] = useState('')
  const galleryRef = useRef()
  const backGalleryRef = useRef()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  const progressMap = {
    intro: 1, preview: 1,
    processing: 2,
    'back-intro': 3, 'back-preview': 3,
    'back-processing': 3,
    'selfie-intro': 4, 'selfie-preview': 4,
    'face-processing': 5,
    success: 6, failed: 0,
  }

  function handleGalleryFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) {
      alert('Image too large. Please use a photo under 15MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCardImage(reader.result)
      setStep('preview')
    }
    reader.readAsDataURL(file)
  }

  function handleBackGalleryFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) {
      alert('Image too large. Please use a photo under 15MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setBackImage(reader.result)
      setStep('back-preview')
    }
    reader.readAsDataURL(file)
  }

  function handleCameraCapture(dataUrl) {
    setShowCamera(false)
    setCardImage(dataUrl)
    setStep('preview')
  }

  function handleBackCameraCapture(dataUrl) {
    setShowBackCamera(false)
    setBackImage(dataUrl)
    setStep('back-preview')
  }

  function handleSelfieCapture(dataUrl) {
    setShowSelfie(false)
    setSelfieImage(dataUrl)
    setStep('selfie-preview')
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

  async function handleCardVerify() {
    setStep('processing')
    setProcessingStep(0)

    const timers = [
      setTimeout(() => setProcessingStep(1), 1500),
      setTimeout(() => setProcessingStep(2), 3500),
      setTimeout(() => setProcessingStep(3), 5500),
    ]

    try {
      const compressed = await compressImage(cardImage)
      const { data } = await api.post('/kyc/verify-front', { image: compressed })
      timers.forEach(clearTimeout)

      if (data.verified) {
        setCardResult(data)
        setStep('back-intro')
      } else {
        setFailReason(data.reason || 'Card verification failed. Please try again with a clearer photo.')
        setCardResult(data)
        setStep('failed')
      }
    } catch (err) {
      timers.forEach(clearTimeout)
      const msg = err.response?.data?.reason || err.response?.data?.error || 'Verification service unavailable. Please check your connection and try again.'
      setFailReason(msg)
      setStep('failed')
    }
  }

  async function handleBackVerify() {
    setStep('back-processing')
    setProcessingStep(0)

    const timers = [
      setTimeout(() => setProcessingStep(1), 1500),
      setTimeout(() => setProcessingStep(2), 3500),
    ]

    try {
      const compressed = await compressImage(backImage)
      const { data } = await api.post('/kyc/verify-back', { image: compressed })
      timers.forEach(clearTimeout)

      if (data.verified) {
        setBackResult(data)
        setStep('selfie-intro')
      } else {
        setFailReason(data.reason || 'Back verification failed. Please try again with a clearer photo.')
        setBackResult(data)
        setStep('failed')
      }
    } catch {
      timers.forEach(clearTimeout)
      setFailReason('Verification service unavailable. Please try again.')
      setStep('failed')
    }
  }

  async function handleFaceVerify() {
    setStep('face-processing')
    setProcessingStep(0)

    const timers = [
      setTimeout(() => setProcessingStep(1), 1500),
      setTimeout(() => setProcessingStep(2), 3500),
    ]

    try {
      const compressedCard = await compressImage(cardImage)
      const compressedSelfie = await compressImage(selfieImage, 800)
      const { data } = await api.post('/kyc/verify-face', {
        cardImage: compressedCard,
        selfie: compressedSelfie,
      })
      timers.forEach(clearTimeout)

      if (data.passed) {
        setFaceResult(data)
        await refreshUser()
        setStep('success')
      } else {
        setFailReason(data.reason || 'Face verification failed. Please try again.')
        setFaceResult(data)
        setStep('failed')
      }
    } catch {
      timers.forEach(clearTimeout)
      setFailReason('Face verification service unavailable. Please try again.')
      setStep('failed')
    }
  }

  function handleRetry() {
    setCardImage(null)
    setBackImage(null)
    setSelfieImage(null)
    setCardResult(null)
    setBackResult(null)
    setFaceResult(null)
    setFailReason('')
    setStep('intro')
    setProcessingStep(0)
  }

  function handleRetakeBack() {
    setBackImage(null)
    setBackResult(null)
    setFailReason('')
    setStep('back-intro')
  }

  function handleRetakeSelfie() {
    setSelfieImage(null)
    setFaceResult(null)
    setFailReason('')
    setStep('selfie-intro')
  }

  const cardSteps = [
    { label: 'Detecting Ghana Card...', Icon: Search },
    { label: 'Reading card details...', Icon: FileText },
    { label: 'Verifying authenticity...', Icon: ShieldCheck },
    { label: 'Cross-referencing profile...', Icon: UserCheck },
  ]

  const backSteps = [
    { label: 'Detecting card back...', Icon: Search },
    { label: 'Reading MRZ zone...', Icon: FileText },
    { label: 'Matching with front...', Icon: ShieldCheck },
  ]

  const faceSteps = [
    { label: 'Comparing faces...', Icon: ScanFace },
    { label: 'Checking liveness...', Icon: ShieldCheck },
    { label: 'Confirming identity...', Icon: UserCheck },
  ]

  return (
    <>
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {showBackCamera && (
        <CameraCapture
          onCapture={handleBackCameraCapture}
          onClose={() => setShowBackCamera(false)}
        />
      )}

      {showSelfie && (
        <SelfieCapture
          onCapture={handleSelfieCapture}
          onClose={() => setShowSelfie(false)}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-primary">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold">Identity Verification</h1>
        </div>

        {step !== 'failed' && <ProgressBar current={progressMap[step] || 0} total={6} />}

        {step === 'intro' && (
          <>
            <GlassCard className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Shield size={32} className="text-primary" />
              </div>
              <h2 className="text-lg font-bold">Step 1: Card Front</h2>
              <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
                Take a photo or upload an image of the <strong>front side</strong> of your Ghana Card. Our AI verifies your card in seconds.
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
            <GlassCard className="overflow-hidden p-0">
              <img src={cardImage} alt="Ghana Card Front" className="w-full rounded-xl" />
            </GlassCard>

            {cardImage && <QualityCheck imageData={cardImage} />}

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
              <button onClick={handleCardVerify} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3.5">
                <Zap size={16} /> Verify Front
              </button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <ProcessingView steps={cardSteps} current={processingStep} message="Analyzing the front of your Ghana Card..." />
        )}

        {step === 'back-intro' && (
          <>
            <GlassCard glow="success" className="text-center py-4">
              <CheckCircle size={32} className="text-accent-success mx-auto mb-2" />
              <h3 className="font-bold text-accent-success">Front Side Verified</h3>
              {cardResult?.extracted?.full_name && (
                <p className="text-sm text-text-muted mt-1">{cardResult.extracted.full_name}</p>
              )}
            </GlassCard>

            <GlassCard className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <RotateCcw size={32} className="text-primary" />
              </div>
              <h2 className="text-lg font-bold">Step 2: Card Back</h2>
              <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
                Now flip your Ghana Card over and capture the <strong>back side</strong>. We need to verify the MRZ (machine readable zone).
              </p>
            </GlassCard>

            <div className="glass-card p-4 space-y-3">
              <div className="relative bg-slate-100 rounded-xl overflow-hidden" style={{ aspectRatio: CARD_ASPECT }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-text-dim">
                  <div className="border-2 border-dashed border-text-dim/30 rounded-xl w-[90%] h-[85%] flex flex-col items-center justify-center gap-2">
                    <FileText size={32} className="text-text-dim/40" />
                    <span className="text-xs font-medium text-text-dim/60">GHANA CARD BACK</span>
                    <span className="text-[10px] text-text-dim/40">MRZ / BARCODE SIDE</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowBackCamera(true)}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4"
              >
                <Camera size={20} /> Take Photo
              </button>
              <button
                onClick={() => backGalleryRef.current?.click()}
                className="btn-secondary w-full flex items-center justify-center gap-2 py-4"
              >
                <Upload size={20} /> Upload from Gallery
              </button>
            </div>

            <input
              ref={backGalleryRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleBackGalleryFile}
              className="hidden"
            />
          </>
        )}

        {step === 'back-preview' && (
          <>
            <GlassCard className="overflow-hidden p-0">
              <img src={backImage} alt="Ghana Card Back" className="w-full rounded-xl" />
            </GlassCard>

            {backImage && <QualityCheck imageData={backImage} />}

            <GlassCard className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-accent-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Check the back image</p>
                <ul className="text-xs text-text-muted mt-1 space-y-0.5">
                  <li>The MRZ text lines at the bottom are visible</li>
                  <li>Barcode or QR code is clear</li>
                  <li>No fingers covering any details</li>
                </ul>
              </div>
            </GlassCard>

            <div className="flex gap-3">
              <button onClick={handleRetakeBack} className="flex-1 bg-surface-card border border-surface-border text-text-muted font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all">
                <RotateCcw size={16} /> Retake
              </button>
              <button onClick={handleBackVerify} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3.5">
                <Zap size={16} /> Verify Back
              </button>
            </div>
          </>
        )}

        {step === 'back-processing' && (
          <ProcessingView steps={backSteps} current={processingStep} message="Analyzing the back of your Ghana Card..." />
        )}

        {step === 'selfie-intro' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="text-center py-3" glow="success">
                <Shield size={18} className="text-accent-success mx-auto mb-1" />
                <p className="text-[10px] font-semibold text-accent-success">Front Verified</p>
              </GlassCard>
              <GlassCard className="text-center py-3" glow="success">
                <FileText size={18} className="text-accent-success mx-auto mb-1" />
                <p className="text-[10px] font-semibold text-accent-success">Back Verified</p>
              </GlassCard>
            </div>

            <GlassCard className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <ScanFace size={32} className="text-primary" />
              </div>
              <h2 className="text-lg font-bold">Step 3: Face Verification</h2>
              <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
                Take a selfie to confirm you are the person on the Ghana Card. This also verifies you are a real person.
              </p>
            </GlassCard>

            <GlassCard className="space-y-2">
              <h3 className="text-sm font-semibold">For best results:</h3>
              <div className="grid grid-cols-1 gap-1.5 text-xs text-text-muted">
                <div className="flex items-center gap-2"><CheckCircle size={12} className="text-accent-success flex-shrink-0" /> Face a window or lamp for good lighting</div>
                <div className="flex items-center gap-2"><CheckCircle size={12} className="text-accent-success flex-shrink-0" /> Remove sunglasses or face coverings</div>
                <div className="flex items-center gap-2"><CheckCircle size={12} className="text-accent-success flex-shrink-0" /> Look straight at the camera</div>
                <div className="flex items-center gap-2"><XCircle size={12} className="text-accent-danger flex-shrink-0" /> Do not hold up a photo or screen</div>
              </div>
            </GlassCard>

            <button
              onClick={() => setShowSelfie(true)}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4"
            >
              <ScanFace size={20} /> Take Selfie
            </button>
          </>
        )}

        {step === 'selfie-preview' && (
          <>
            <GlassCard className="overflow-hidden p-0">
              <img src={selfieImage} alt="Selfie" className="w-full rounded-xl" />
            </GlassCard>

            <GlassCard className="flex items-start gap-3">
              <ScanFace size={18} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Check your selfie</p>
                <ul className="text-xs text-text-muted mt-1 space-y-0.5">
                  <li>Your full face is clearly visible</li>
                  <li>Good lighting with no heavy shadows</li>
                  <li>Looking straight at the camera</li>
                </ul>
              </div>
            </GlassCard>

            <div className="flex gap-3">
              <button onClick={handleRetakeSelfie} className="flex-1 bg-surface-card border border-surface-border text-text-muted font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all">
                <RotateCcw size={16} /> Retake
              </button>
              <button onClick={handleFaceVerify} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3.5">
                <Zap size={16} /> Verify Face
              </button>
            </div>
          </>
        )}

        {step === 'face-processing' && (
          <ProcessingView steps={faceSteps} current={processingStep} message="Verifying your identity..." />
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="w-24 h-24 rounded-full bg-accent-success/10 flex items-center justify-center">
              <CheckCircle size={56} className="text-accent-success" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold">Fully Verified!</h2>
              <p className="text-sm text-text-muted mt-2">Your identity and liveness have been confirmed successfully.</p>
            </div>

            {cardResult?.extracted && (
              <GlassCard className="w-full" glow="primary">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Verified Details</h3>
                <div className="space-y-3">
                  {cardResult.extracted.full_name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Full Name</span>
                      <span className="font-semibold">{cardResult.extracted.full_name}</span>
                    </div>
                  )}
                  {cardResult.extracted.card_number && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Card Number</span>
                      <span className="font-mono font-semibold">{cardResult.extracted.card_number}</span>
                    </div>
                  )}
                  {cardResult.extracted.date_of_birth && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Date of Birth</span>
                      <span className="font-medium">{cardResult.extracted.date_of_birth}</span>
                    </div>
                  )}
                  {cardResult.extracted.gender && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Gender</span>
                      <span className="font-medium">{cardResult.extracted.gender === 'M' ? 'Male' : 'Female'}</span>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            <div className="w-full grid grid-cols-3 gap-2">
              <GlassCard className="text-center py-3" glow="success">
                <Shield size={18} className="text-accent-success mx-auto mb-1" />
                <p className="text-[10px] font-semibold text-accent-success">Front</p>
              </GlassCard>
              <GlassCard className="text-center py-3" glow="success">
                <FileText size={18} className="text-accent-success mx-auto mb-1" />
                <p className="text-[10px] font-semibold text-accent-success">Back</p>
              </GlassCard>
              <GlassCard className="text-center py-3" glow="success">
                <ScanFace size={18} className="text-accent-success mx-auto mb-1" />
                <p className="text-[10px] font-semibold text-accent-success">Face</p>
              </GlassCard>
            </div>

            <GlassCard className="w-full flex items-center gap-3">
              <Shield size={20} className="text-primary flex-shrink-0" />
              <p className="text-xs text-text-muted">Your images were processed in real-time and not stored. Only the verification result is saved.</p>
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
              <p className="text-sm text-text-muted mt-2 max-w-xs">{failReason}</p>
            </div>

            {(cardResult?.extracted?.issues?.length > 0 || faceResult?.details?.liveness_issues?.length > 0) && (
              <GlassCard className="w-full">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Issues Found</h3>
                <ul className="space-y-2">
                  {[...(cardResult?.extracted?.issues || []), ...(faceResult?.details?.liveness_issues || [])].map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                      <XCircle size={14} className="text-accent-danger flex-shrink-0 mt-0.5" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}

            <GlassCard className="w-full space-y-2">
              <h3 className="text-sm font-semibold">Tips for a successful verification:</h3>
              <ul className="text-xs text-text-muted space-y-1">
                <li>Use good lighting with no shadows on your face</li>
                <li>Make sure both sides of the card are clear and sharp</li>
                <li>Look directly at the camera for the selfie</li>
                <li>Do not use a photo of a photo or a screenshot</li>
                <li>Remove sunglasses and face coverings</li>
              </ul>
            </GlassCard>

            <div className="w-full space-y-3">
              <button onClick={handleRetry} className="btn-primary w-full flex items-center justify-center gap-2">
                <RotateCcw size={16} /> Start Over
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

function ProcessingView({ steps, current, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-8">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center relative">
        <Loader2 size={48} className="text-primary animate-spin" />
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" style={{ animationDuration: '1.5s' }} />
      </div>

      <div className="w-full space-y-3">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
            i < current ? 'bg-primary/5' : i === current ? 'bg-primary/10 border border-primary/20' : 'opacity-30'
          }`}>
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              {i < current ? (
                <CheckCircle size={20} className="text-accent-success" />
              ) : (
                <s.Icon size={20} className={i === current ? 'text-primary' : 'text-text-dim'} />
              )}
            </div>
            <span className={`text-sm font-medium ${i <= current ? 'text-text-primary' : 'text-text-dim'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-text-dim text-center">{message}</p>
    </div>
  )
}
