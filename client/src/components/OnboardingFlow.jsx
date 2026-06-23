import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Shield, Users, BarChart3, Home } from 'lucide-react'

const slides = [
  {
    title: 'Your rent, protected',
    desc: 'Pay monthly into a secure escrow account. Your money stays safe until both you and your landlord agree.',
    icon: Shield,
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
    features: ['Escrow protection', 'Monthly payments', 'Full transparency'],
  },
  {
    title: 'Escavio handles everything',
    desc: 'No awkward landlord negotiations. Escavio sits between you and your landlord — managing payments, disputes, and communication.',
    icon: Users,
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
    features: ['Zero direct contact', 'Dispute resolution', 'AI-powered'],
  },
  {
    title: 'Track every cedi',
    desc: 'See every payment, receipt, and transaction in real time. Full transparency, always.',
    icon: BarChart3,
    gradient: 'from-amber-500 to-orange-600',
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    features: ['Real-time tracking', 'Payment receipts', 'Smart analytics'],
  },
  {
    title: 'Ready to start?',
    desc: 'Join thousands of Ghanaians renting smarter with Escavio.',
    icon: Home,
    gradient: 'from-violet-500 to-purple-600',
    bg: 'linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)',
    isCTA: true,
  },
]

export default function OnboardingFlow({ onComplete }) {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()
  const slide = slides[current]
  const IconComp = slide.icon

  function next() {
    if (current < slides.length - 1) setCurrent(current + 1)
  }
  function prev() {
    if (current > 0) setCurrent(current - 1)
  }
  function skip() {
    onComplete()
  }
  function goSignUp() {
    onComplete()
    navigate('/register')
  }
  function goLogin() {
    onComplete()
    navigate('/login')
  }

  return (
    <div className="fixed inset-0 z-[190] bg-white flex flex-col">
      <div className="flex justify-end px-5 pt-5">
        {!slide.isCTA && (
          <button onClick={skip} className="text-sm font-medium text-text-muted hover:text-primary transition-colors">
            Skip
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 ob-slide-wrap" key={current}>
        <div className="ob-card" style={{ background: slide.bg }}>
          <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-lg mb-4`}>
            <IconComp size={36} className="text-white" strokeWidth={1.8} />
          </div>
          {slide.features && (
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {slide.features.map(f => (
                <span key={f} className="px-3 py-1 rounded-full bg-white/60 text-[11px] font-semibold text-gray-700 backdrop-blur-sm">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-text-primary text-center mt-6">{slide.title}</h2>
        <p className="text-text-muted text-center text-sm mt-3 max-w-xs leading-relaxed">{slide.desc}</p>
      </div>

      <div className="px-6 pb-8">
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-primary' : 'w-2 bg-gray-200'}`}
            />
          ))}
        </div>

        {slide.isCTA ? (
          <div className="space-y-3">
            <button onClick={goSignUp} className="btn-primary w-full flex items-center justify-center gap-2 text-lg">
              Create Account <ChevronRight size={20} />
            </button>
            <button onClick={goLogin} className="w-full py-3 rounded-xl border border-surface-border text-text-primary font-semibold text-center hover:bg-surface-card transition-colors">
              I already have an account
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={prev}
              disabled={current === 0}
              className="w-12 h-12 rounded-full border border-surface-border flex items-center justify-center disabled:opacity-0 transition-opacity"
            >
              <ChevronLeft size={22} className="text-text-muted" />
            </button>
            <button
              onClick={next}
              className="bg-primary text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .ob-slide-wrap {
          animation: obSlideIn 0.35s ease-out;
        }
        @keyframes obSlideIn {
          0% { opacity: 0; transform: translateX(30px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .ob-card {
          width: 280px;
          min-height: 220px;
          border-radius: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.06);
        }
      `}</style>
    </div>
  )
}
