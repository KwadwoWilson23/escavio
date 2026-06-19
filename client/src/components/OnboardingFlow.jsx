import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft } from 'lucide-react'

const slides = [
  {
    title: 'Your rent, protected',
    desc: 'Pay monthly into a secure escrow account. Your money stays safe until both you and your landlord agree.',
    illustration: ShieldIllustration,
    bg: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
  },
  {
    title: 'Escavio handles everything',
    desc: 'No awkward landlord negotiations. Escavio sits between you and your landlord — managing payments, disputes, and communication.',
    illustration: MiddlemanIllustration,
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
  },
  {
    title: 'Track every cedi',
    desc: 'See every payment, receipt, and transaction in real time. Full transparency, always.',
    illustration: DashboardIllustration,
    bg: 'linear-gradient(135deg, #eff6ff 0%, #fef3c7 100%)',
  },
  {
    title: 'Ready to start?',
    desc: 'Join thousands of Ghanaians renting smarter with Escavio.',
    illustration: GetStartedIllustration,
    bg: 'linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)',
    isCTA: true,
  },
]

export default function OnboardingFlow({ onComplete }) {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()
  const slide = slides[current]
  const Illustration = slide.illustration

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
        {/* Phone screen mockup */}
        <div className="ob-phone" style={{ background: slide.bg }}>
          <div className="ob-notch" />
          <div className="ob-screen">
            <Illustration />
          </div>
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
        .ob-phone {
          width: 260px;
          height: 240px;
          border-radius: 28px;
          border: 3px solid #1a1a2e;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.3);
        }
        .ob-notch {
          width: 80px;
          height: 6px;
          background: #1a1a2e;
          border-radius: 0 0 8px 8px;
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2;
        }
        .ob-screen {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px;
        }
      `}</style>
    </div>
  )
}

function ManFigure({ x, y, scale = 1, skin, hairColor, shirtColor, pantsColor, facing = 'right', armPose = 'down' }) {
  const f = facing === 'right' ? 1 : -1
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale * f}, ${scale})`}>
      {/* Hair back volume */}
      <ellipse cx="0" cy="-68" rx="13" ry="9" fill={hairColor} />
      {/* Head shape */}
      <ellipse cx="0" cy="-60" rx="11" ry="13" fill={skin} />
      {/* Hair top */}
      <path d="M-11 -64 Q-10 -78 0 -76 Q10 -78 11 -64 Q10 -70 5 -72 Q0 -74 -5 -72 Q-10 -70 -11 -64" fill={hairColor} />
      {/* Ear */}
      <ellipse cx="11" cy="-58" rx="3" ry="4" fill={skin} />
      <ellipse cx="11" cy="-58" rx="2" ry="2.5" fill="none" stroke={darken(skin)} strokeWidth="0.5" />
      {/* Eyebrows */}
      <path d="M-6 -66 Q-4 -68 -2 -66" fill="none" stroke={hairColor} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2 -66 Q4 -68 6 -66" fill="none" stroke={hairColor} strokeWidth="1.2" strokeLinecap="round" />
      {/* Eyes */}
      <ellipse cx="-4" cy="-62" rx="2.5" ry="3" fill="white" />
      <ellipse cx="4" cy="-62" rx="2.5" ry="3" fill="white" />
      <circle cx="-3.5" cy="-61.5" r="1.5" fill="#2c1810" />
      <circle cx="4.5" cy="-61.5" r="1.5" fill="#2c1810" />
      <circle cx="-3" cy="-62" r="0.5" fill="white" />
      <circle cx="5" cy="-62" r="0.5" fill="white" />
      {/* Nose */}
      <path d="M0 -59 Q1.5 -56 0 -55" fill="none" stroke={darken(skin)} strokeWidth="0.8" strokeLinecap="round" />
      {/* Mouth smile */}
      <path d="M-3.5 -52 Q0 -49 3.5 -52" fill="none" stroke="#8B4513" strokeWidth="1" strokeLinecap="round" />
      {/* Neck */}
      <rect x="-4" y="-47" width="8" height="7" rx="2" fill={skin} />
      {/* Shirt collar */}
      <path d="M-8 -40 L-2 -36 L0 -40" fill="white" />
      <path d="M8 -40 L2 -36 L0 -40" fill="white" />
      {/* Torso - shirt */}
      <path d="M-14 -40 Q-15 -20 -13 0 L13 0 Q15 -20 14 -40 Z" fill={shirtColor} />
      {/* Shirt line */}
      <line x1="0" y1="-36" x2="0" y2="-5" stroke={darken(shirtColor)} strokeWidth="0.6" strokeOpacity="0.3" />
      {/* Arms */}
      {armPose === 'wave' ? (
        <>
          <path d="M14 -38 Q22 -42 24 -52" fill="none" stroke={skin} strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="24" cy="-54" rx="3.5" ry="4" fill={skin} />
          <path d="M-14 -38 Q-20 -28 -18 -18" fill="none" stroke={skin} strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="-18" cy="-16" rx="3.5" ry="3.5" fill={skin} />
          {/* Shirt sleeves */}
          <path d="M14 -40 Q16 -38 14 -34" fill={shirtColor} />
          <path d="M-14 -40 Q-16 -38 -14 -34" fill={shirtColor} />
        </>
      ) : (
        <>
          <path d="M14 -38 Q20 -24 16 -10" fill="none" stroke={skin} strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="16" cy="-8" rx="3.5" ry="3.5" fill={skin} />
          <path d="M-14 -38 Q-20 -24 -16 -10" fill="none" stroke={skin} strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="-16" cy="-8" rx="3.5" ry="3.5" fill={skin} />
          <path d="M14 -40 Q16 -38 14 -34" fill={shirtColor} />
          <path d="M-14 -40 Q-16 -38 -14 -34" fill={shirtColor} />
        </>
      )}
      {/* Pants */}
      <path d="M-13 0 Q-14 15 -13 28 L-6 28 Q-3 12 0 5 Q3 12 6 28 L13 28 Q14 15 13 0 Z" fill={pantsColor} />
      {/* Belt */}
      <rect x="-13" y="-1" width="26" height="3" rx="1" fill={darken(pantsColor)} />
      <rect x="-2" y="-1" width="4" height="3" rx="1" fill="#c4a35a" />
      {/* Shoes */}
      <path d="M-13 28 Q-14 32 -8 33 L-6 33 Q-4 32 -6 28" fill="#1a1a2e" />
      <path d="M6 28 Q4 32 8 33 L13 33 Q15 32 13 28" fill="#1a1a2e" />
    </g>
  )
}

function WomanFigure({ x, y, scale = 1, skin, hairColor, topColor, skirtColor, facing = 'right', armPose = 'down' }) {
  const f = facing === 'right' ? 1 : -1
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale * f}, ${scale})`}>
      {/* Hair back */}
      <path d="M-14 -60 Q-16 -40 -10 -35" fill={hairColor} />
      <path d="M14 -60 Q16 -40 10 -35" fill={hairColor} />
      {/* Head */}
      <ellipse cx="0" cy="-60" rx="11" ry="13" fill={skin} />
      {/* Hair */}
      <path d="M-11 -66 Q-12 -80 -2 -78 Q8 -80 11 -66 Q9 -72 4 -73 Q-4 -74 -8 -72 Z" fill={hairColor} />
      <path d="M-12 -62 Q-14 -55 -13 -48" fill={hairColor} />
      <path d="M12 -62 Q14 -55 13 -48" fill={hairColor} />
      {/* Ear */}
      <ellipse cx="11" cy="-58" rx="2.5" ry="3.5" fill={skin} />
      {/* Eyebrows */}
      <path d="M-6 -67 Q-4 -69 -2 -67.5" fill="none" stroke={hairColor} strokeWidth="0.8" strokeLinecap="round" />
      <path d="M2 -67.5 Q4 -69 6 -67" fill="none" stroke={hairColor} strokeWidth="0.8" strokeLinecap="round" />
      {/* Eyes with lashes */}
      <ellipse cx="-4" cy="-62" rx="2.5" ry="3" fill="white" />
      <ellipse cx="4" cy="-62" rx="2.5" ry="3" fill="white" />
      <circle cx="-3.5" cy="-61.5" r="1.5" fill="#2c1810" />
      <circle cx="4.5" cy="-61.5" r="1.5" fill="#2c1810" />
      <circle cx="-3" cy="-62" r="0.5" fill="white" />
      <circle cx="5" cy="-62" r="0.5" fill="white" />
      <path d="M-6.5 -63.5 Q-4 -65.5 -1.5 -63.5" fill="none" stroke={hairColor} strokeWidth="0.6" />
      <path d="M1.5 -63.5 Q4 -65.5 6.5 -63.5" fill="none" stroke={hairColor} strokeWidth="0.6" />
      {/* Nose */}
      <path d="M0 -59 Q1 -57 0 -56" fill="none" stroke={darken(skin)} strokeWidth="0.7" strokeLinecap="round" />
      {/* Lips */}
      <path d="M-3 -52.5 Q0 -50 3 -52.5" fill="#c45a5a" fillOpacity="0.6" />
      <path d="M-3 -52.5 Q0 -54 3 -52.5" fill="#c45a5a" fillOpacity="0.4" />
      {/* Neck */}
      <rect x="-3.5" y="-47" width="7" height="7" rx="2" fill={skin} />
      {/* Top / blouse */}
      <path d="M-12 -40 Q-13 -22 -10 -12 L10 -12 Q13 -22 12 -40 Z" fill={topColor} />
      {/* Neckline */}
      <path d="M-5 -40 Q0 -34 5 -40" fill={skin} />
      {/* Arms */}
      {armPose === 'wave' ? (
        <>
          <path d="M12 -38 Q20 -42 22 -52" fill="none" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
          <ellipse cx="22" cy="-54" rx="3" ry="3.5" fill={skin} />
          <path d="M-12 -38 Q-18 -28 -16 -18" fill="none" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
          <ellipse cx="-16" cy="-16" rx="3" ry="3" fill={skin} />
        </>
      ) : (
        <>
          <path d="M12 -38 Q18 -24 14 -10" fill="none" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
          <ellipse cx="14" cy="-8" rx="3" ry="3" fill={skin} />
          <path d="M-12 -38 Q-18 -24 -14 -10" fill="none" stroke={skin} strokeWidth="5.5" strokeLinecap="round" />
          <ellipse cx="-14" cy="-8" rx="3" ry="3" fill={skin} />
        </>
      )}
      {/* Skirt */}
      <path d="M-10 -12 Q-18 15 -16 28 L-4 28 Q-2 10 0 5 Q2 10 4 28 L16 28 Q18 15 10 -12 Z" fill={skirtColor} />
      {/* Skirt fold lines */}
      <path d="M-6 -8 Q-10 10 -12 25" fill="none" stroke={darken(skirtColor)} strokeWidth="0.5" strokeOpacity="0.3" />
      <path d="M6 -8 Q10 10 12 25" fill="none" stroke={darken(skirtColor)} strokeWidth="0.5" strokeOpacity="0.3" />
      {/* Shoes */}
      <path d="M-16 28 Q-17 31 -12 32 L-4 32 Q-2 31 -4 28" fill="#1a1a2e" />
      <path d="M4 28 Q2 31 6 32 L16 32 Q18 31 16 28" fill="#1a1a2e" />
    </g>
  )
}

function darken(hex) {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 35)
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 35)
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 35)
  return `rgb(${r},${g},${b})`
}

function ShieldIllustration() {
  return (
    <svg viewBox="0 0 240 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shGr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      <circle cx="120" cy="90" r="70" fill="#2563eb" fillOpacity="0.06" />

      <path d="M120 20 L165 45 L165 92 Q165 130 120 152 Q75 130 75 92 L75 45 Z" fill="url(#shGr)" fillOpacity="0.85" />
      <path d="M120 32 L158 53 L158 88 Q158 120 120 140 Q82 120 82 88 L82 53 Z" fill="white" fillOpacity="0.1" />

      <circle cx="120" cy="72" r="10" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
      <line x1="120" y1="82" x2="120" y2="100" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="120" y1="89" x2="126" y2="89" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <line x1="120" y1="95" x2="127" y2="95" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />

      <ManFigure x={32} y={185} scale={0.75} skin="#A0782C" hairColor="#1a1a2e" shirtColor="#2563eb" pantsColor="#334155" facing="right" />
      <WomanFigure x={208} y={185} scale={0.75} skin="#6B4F12" hairColor="#1a1a2e" topColor="#f59e0b" skirtColor="#7c3aed" facing="left" />

      <circle cx="55" cy="35" r="2.5" fill="#f59e0b" fillOpacity="0.4" />
      <circle cx="195" cy="150" r="3" fill="#2563eb" fillOpacity="0.25" />
    </svg>
  )
}

function MiddlemanIllustration() {
  return (
    <svg viewBox="0 0 240 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <WomanFigure x={32} y={148} scale={0.7} skin="#A0782C" hairColor="#1a1a2e" topColor="#10b981" skirtColor="#0d9488" facing="right" />
      <text x="32" y="182" textAnchor="middle" fontSize="7" fill="#10b981" fontWeight="600">Tenant</text>

      <ManFigure x={208} y={148} scale={0.7} skin="#6B4F12" hairColor="#1a1a2e" shirtColor="#8b5cf6" pantsColor="#1e293b" facing="left" />
      <text x="208" y="182" textAnchor="middle" fontSize="7" fill="#8b5cf6" fontWeight="600">Landlord</text>

      <g>
        <rect x="92" y="40" width="56" height="75" rx="10" fill="#2563eb" />
        <rect x="96" y="45" width="48" height="65" rx="7" fill="#1d4ed8" />
        <path d="M120 56 L138 68 L138 88 L102 88 L102 68 Z" fill="white" fillOpacity="0.18" />
        <rect x="114" y="78" width="12" height="10" rx="2" fill="white" fillOpacity="0.3" />
        <circle cx="120" cy="100" r="3.5" fill="none" stroke="white" strokeWidth="1" />
        <text x="120" y="118" textAnchor="middle" fontSize="6.5" fill="white" fontWeight="bold" letterSpacing="0.5">ESCAVIO</text>
      </g>

      <path d="M60 115 Q78 100 92 108" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeDasharray="4 3" />
      <polygon points="90,105 96,110 90,112" fill="#2563eb" />
      <path d="M148 108 Q162 100 180 115" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeDasharray="4 3" />
      <polygon points="178,112 184,117 178,119" fill="#2563eb" />

      <rect x="70" y="158" width="100" height="26" rx="8" fill="#2563eb" fillOpacity="0.06" />
      <circle cx="84" cy="171" r="5.5" fill="#10b981" fillOpacity="0.2" />
      <path d="M81 171 L83 173 L87 169" fill="none" stroke="#10b981" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <text x="95" y="168" fontSize="6.5" fill="#2563eb" fontWeight="600">Secure</text>
      <text x="95" y="177" fontSize="5.5" fill="#64748b">All transactions protected</text>
    </svg>
  )
}

function DashboardIllustration() {
  return (
    <svg viewBox="0 0 240 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="10" width="160" height="180" rx="14" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
      <rect x="40" y="10" width="160" height="32" rx="14" fill="#2563eb" />
      <rect x="40" y="30" width="160" height="12" fill="#2563eb" />
      <circle cx="58" cy="26" r="3.5" fill="white" fillOpacity="0.3" />
      <rect x="67" y="23" width="45" height="5" rx="2.5" fill="white" fillOpacity="0.4" />
      <circle cx="183" cy="26" r="2.5" fill="#f59e0b" />

      <rect x="52" y="52" width="65" height="36" rx="7" fill="#2563eb" fillOpacity="0.07" />
      <text x="59" y="65" fontSize="5.5" fill="#64748b">Balance</text>
      <text x="59" y="78" fontSize="10" fill="#2563eb" fontWeight="bold">GHS 2,400</text>

      <rect x="124" y="52" width="63" height="36" rx="7" fill="#10b981" fillOpacity="0.07" />
      <text x="130" y="65" fontSize="5.5" fill="#64748b">Next Due</text>
      <text x="130" y="78" fontSize="9" fill="#10b981" fontWeight="bold">Jul 1</text>

      <rect x="52" y="96" width="136" height="22" rx="5" fill="white" stroke="#e2e8f0" strokeWidth="0.8" />
      <circle cx="63" cy="107" r="4.5" fill="#10b981" fillOpacity="0.2" />
      <path d="M61 107 L62 108 L65 105" fill="none" stroke="#10b981" strokeWidth="1.1" strokeLinecap="round" />
      <text x="72" y="105" fontSize="5" fill="#334155">June rent — Paid</text>
      <rect x="155" y="103" width="26" height="7" rx="3.5" fill="#10b981" fillOpacity="0.12" />
      <text x="161" y="108.5" fontSize="4.5" fill="#10b981" fontWeight="600">Paid</text>

      <rect x="52" y="122" width="136" height="22" rx="5" fill="white" stroke="#e2e8f0" strokeWidth="0.8" />
      <circle cx="63" cy="133" r="4.5" fill="#f59e0b" fillOpacity="0.2" />
      <circle cx="63" cy="133" r="1.8" fill="#f59e0b" />
      <text x="72" y="131" fontSize="5" fill="#334155">July rent — Upcoming</text>
      <rect x="155" y="129" width="26" height="7" rx="3.5" fill="#f59e0b" fillOpacity="0.12" />
      <text x="160" y="134.5" fontSize="4.5" fill="#f59e0b" fontWeight="600">Due</text>

      <rect x="52" y="148" width="136" height="22" rx="5" fill="white" stroke="#e2e8f0" strokeWidth="0.8" />
      <circle cx="63" cy="159" r="4.5" fill="#10b981" fillOpacity="0.2" />
      <path d="M61 159 L62 160 L65 157" fill="none" stroke="#10b981" strokeWidth="1.1" strokeLinecap="round" />
      <text x="72" y="157" fontSize="5" fill="#334155">May rent — Paid</text>
      <rect x="155" y="155" width="26" height="7" rx="3.5" fill="#10b981" fillOpacity="0.12" />
      <text x="161" y="160.5" fontSize="4.5" fill="#10b981" fontWeight="600">Paid</text>

      <rect x="52" y="174" width="136" height="22" rx="5" fill="white" stroke="#e2e8f0" strokeWidth="0.8" />
      <circle cx="63" cy="185" r="4.5" fill="#10b981" fillOpacity="0.2" />
      <path d="M61 185 L62 186 L65 183" fill="none" stroke="#10b981" strokeWidth="1.1" strokeLinecap="round" />
      <text x="72" y="183" fontSize="5" fill="#334155">April rent — Paid</text>
      <rect x="155" y="181" width="26" height="7" rx="3.5" fill="#10b981" fillOpacity="0.12" />
      <text x="161" y="186.5" fontSize="4.5" fill="#10b981" fontWeight="600">Paid</text>
    </svg>
  )
}

function GetStartedIllustration() {
  return (
    <svg viewBox="0 0 240 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hGr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      <circle cx="120" cy="90" r="70" fill="#2563eb" fillOpacity="0.04" />

      <g>
        <path d="M120 25 L175 60 L175 120 L65 120 L65 60 Z" fill="url(#hGr)" fillOpacity="0.1" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="106" y="88" width="28" height="32" rx="3" fill="#2563eb" fillOpacity="0.15" stroke="#2563eb" strokeWidth="1.2" />
        <circle cx="128" cy="105" r="2" fill="#2563eb" />
        <rect x="76" y="68" width="16" height="14" rx="2" fill="none" stroke="#2563eb" strokeWidth="1.2" />
        <line x1="84" y1="68" x2="84" y2="82" stroke="#2563eb" strokeWidth="0.8" />
        <line x1="76" y1="75" x2="92" y2="75" stroke="#2563eb" strokeWidth="0.8" />
        <rect x="148" y="68" width="16" height="14" rx="2" fill="none" stroke="#2563eb" strokeWidth="1.2" />
        <line x1="156" y1="68" x2="156" y2="82" stroke="#2563eb" strokeWidth="0.8" />
        <line x1="148" y1="75" x2="164" y2="75" stroke="#2563eb" strokeWidth="0.8" />
      </g>

      <circle cx="120" cy="37" r="6" fill="none" stroke="#f59e0b" strokeWidth="2" />
      <line x1="120" y1="43" x2="120" y2="53" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <line x1="120" y1="47" x2="124" y2="47" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />

      <WomanFigure x={40} y={172} scale={0.68} skin="#A0782C" hairColor="#1a1a2e" topColor="#f59e0b" skirtColor="#dc2626" facing="right" armPose="wave" />
      <ManFigure x={200} y={172} scale={0.68} skin="#6B4F12" hairColor="#1a1a2e" shirtColor="#10b981" pantsColor="#1e293b" facing="left" armPose="wave" />

      <circle cx="100" cy="150" r="4.5" fill="#f59e0b" fillOpacity="0.1" stroke="#f59e0b" strokeWidth="0.8" />
      <path d="M98 150 L99 151 L102 148" fill="none" stroke="#f59e0b" strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="120" cy="157" r="4.5" fill="#2563eb" fillOpacity="0.1" stroke="#2563eb" strokeWidth="0.8" />
      <path d="M118 157 L119 158 L122 155" fill="none" stroke="#2563eb" strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="140" cy="150" r="4.5" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeWidth="0.8" />
      <path d="M138 150 L139 151 L142 148" fill="none" stroke="#10b981" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  )
}
