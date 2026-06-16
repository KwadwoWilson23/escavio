import { useState, useEffect } from 'react'

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('animate')

  useEffect(() => {
    const timer = setTimeout(() => setPhase('fade'), 4200)
    const done = setTimeout(() => onComplete(), 4800)
    return () => { clearTimeout(timer); clearTimeout(done) }
  }, [onComplete])

  return (
    <div className={`fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center transition-opacity duration-500 ${phase === 'fade' ? 'opacity-0' : 'opacity-100'}`}>
      <svg viewBox="0 0 320 360" className="w-64 h-72" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="shieldClip">
            <path d="M160 40 L230 75 L230 150 C230 200 200 230 160 245 C120 230 90 200 90 150 L90 75 Z" />
          </clipPath>
        </defs>

        {/* Shield outline segments dropping in like sticks */}
        {/* Left side */}
        <line x1="160" y1="40" x2="90" y2="75" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"
          className="splash-stick" style={{ animationDelay: '0.1s' }} />
        {/* Left wall */}
        <line x1="90" y1="75" x2="90" y2="150" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"
          className="splash-stick" style={{ animationDelay: '0.25s' }} />
        {/* Right side */}
        <line x1="160" y1="40" x2="230" y2="75" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"
          className="splash-stick" style={{ animationDelay: '0.15s' }} />
        {/* Right wall */}
        <line x1="230" y1="75" x2="230" y2="150" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"
          className="splash-stick" style={{ animationDelay: '0.3s' }} />
        {/* Bottom left curve */}
        <path d="M90 150 C90 200 120 230 160 245" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"
          className="splash-stick" style={{ animationDelay: '0.4s' }} />
        {/* Bottom right curve */}
        <path d="M230 150 C230 200 200 230 160 245" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"
          className="splash-stick" style={{ animationDelay: '0.45s' }} />

        {/* Shield fill fades in */}
        <path d="M160 40 L230 75 L230 150 C230 200 200 230 160 245 C120 230 90 200 90 150 L90 75 Z"
          fill="#2563eb" fillOpacity="0.08" className="splash-fill" />

        {/* Top crown/chevron dropping in */}
        <path d="M160 16 L115 40 L205 40 Z" fill="#2563eb" className="splash-stick" style={{ animationDelay: '0.55s' }} />
        <rect x="150" y="16" width="20" height="16" rx="2" fill="#2563eb" className="splash-stick" style={{ animationDelay: '0.6s' }} />

        {/* Small stick figure walking in from left */}
        <g className="splash-person">
          {/* Head */}
          <circle cx="45" cy="195" r="6" fill="#0b1120" />
          {/* Body */}
          <line x1="45" y1="201" x2="45" y2="220" stroke="#0b1120" strokeWidth="2.5" strokeLinecap="round" />
          {/* Left leg */}
          <line x1="45" y1="220" x2="38" y2="233" stroke="#0b1120" strokeWidth="2.5" strokeLinecap="round" className="splash-walk-left" />
          {/* Right leg */}
          <line x1="45" y1="220" x2="52" y2="233" stroke="#0b1120" strokeWidth="2.5" strokeLinecap="round" className="splash-walk-right" />
          {/* Arm throwing */}
          <line x1="45" y1="207" x2="58" y2="198" stroke="#0b1120" strokeWidth="2.5" strokeLinecap="round" className="splash-arm" />
        </g>

        {/* Key being thrown in an arc */}
        <g className="splash-key">
          {/* Key shape */}
          <circle cx="160" cy="130" r="5" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
          <line x1="160" y1="135" x2="160" y2="152" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="160" y1="145" x2="165" y2="145" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="160" y1="150" x2="166" y2="150" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Keyhole appears after key arrives */}
        <g className="splash-keyhole">
          <circle cx="160" cy="135" r="12" fill="#0b1120" />
          <path d="M152 135 L152 165 C152 170 156 174 160 174 C164 174 168 170 168 165 L168 135" fill="#0b1120" />
        </g>

        {/* Sparkle effects when key slots in */}
        <circle cx="145" cy="125" r="2" fill="#f59e0b" className="splash-sparkle" style={{ animationDelay: '3.1s' }} />
        <circle cx="175" cy="125" r="2" fill="#f59e0b" className="splash-sparkle" style={{ animationDelay: '3.2s' }} />
        <circle cx="150" cy="150" r="1.5" fill="#2563eb" className="splash-sparkle" style={{ animationDelay: '3.15s' }} />
        <circle cx="170" cy="148" r="1.5" fill="#2563eb" className="splash-sparkle" style={{ animationDelay: '3.25s' }} />
        <circle cx="160" cy="118" r="2" fill="#f59e0b" className="splash-sparkle" style={{ animationDelay: '3.3s' }} />
        <circle cx="140" cy="140" r="1.5" fill="#2563eb" className="splash-sparkle" style={{ animationDelay: '3.18s' }} />
        <circle cx="180" cy="138" r="1.5" fill="#2563eb" className="splash-sparkle" style={{ animationDelay: '3.22s' }} />
      </svg>

      <div className="splash-text mt-2">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Escavio</h1>
      </div>
      <p className="splash-tagline text-sm text-text-muted mt-1">Securing your rental future</p>

      <style>{`
        .splash-stick {
          opacity: 0;
          animation: stickDrop 0.5s ease-out forwards;
        }
        @keyframes stickDrop {
          0% { opacity: 0; transform: translateY(-80px) rotate(15deg); }
          60% { opacity: 1; transform: translateY(5px) rotate(-3deg); }
          80% { transform: translateY(-2px) rotate(1deg); }
          100% { opacity: 1; transform: translateY(0) rotate(0deg); }
        }

        .splash-fill {
          opacity: 0;
          animation: fillIn 0.6s ease-out 0.8s forwards;
        }
        @keyframes fillIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        .splash-person {
          opacity: 0;
          animation: personWalkIn 1s ease-out 1.2s forwards;
        }
        @keyframes personWalkIn {
          0% { opacity: 0; transform: translateX(-60px); }
          30% { opacity: 1; }
          100% { opacity: 1; transform: translateX(0); }
        }

        .splash-walk-left {
          animation: walkL 0.3s ease-in-out 1.2s 3 alternate;
        }
        .splash-walk-right {
          animation: walkR 0.3s ease-in-out 1.2s 3 alternate;
        }
        @keyframes walkL {
          0% { transform: rotate(15deg); transform-origin: 45px 220px; }
          100% { transform: rotate(-15deg); transform-origin: 45px 220px; }
        }
        @keyframes walkR {
          0% { transform: rotate(-15deg); transform-origin: 45px 220px; }
          100% { transform: rotate(15deg); transform-origin: 45px 220px; }
        }

        .splash-arm {
          transform-origin: 45px 207px;
          animation: armThrow 0.4s ease-out 2.4s forwards;
        }
        @keyframes armThrow {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(-60deg); }
          100% { transform: rotate(-30deg); }
        }

        .splash-key {
          opacity: 0;
          animation: keyFly 0.8s ease-in 2.5s forwards;
        }
        @keyframes keyFly {
          0% { opacity: 1; transform: translate(-105px, 60px) rotate(0deg) scale(0.7); }
          30% { opacity: 1; transform: translate(-60px, -20px) rotate(120deg) scale(0.85); }
          60% { opacity: 1; transform: translate(-20px, -10px) rotate(240deg) scale(0.95); }
          90% { opacity: 1; transform: translate(0, 0) rotate(350deg) scale(1); }
          100% { opacity: 0; transform: translate(0, 0) rotate(360deg) scale(0.3); }
        }

        .splash-keyhole {
          opacity: 0;
          animation: keyholeAppear 0.3s ease-out 3.05s forwards;
        }
        @keyframes keyholeAppear {
          0% { opacity: 0; transform: scale(0.3); transform-origin: 160px 145px; }
          60% { opacity: 1; transform: scale(1.15); transform-origin: 160px 145px; }
          100% { opacity: 1; transform: scale(1); transform-origin: 160px 145px; }
        }

        .splash-sparkle {
          opacity: 0;
          animation: sparkle 0.5s ease-out forwards;
        }
        @keyframes sparkle {
          0% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(2.5); }
          100% { opacity: 0; transform: scale(0); }
        }

        .splash-text {
          opacity: 0;
          animation: textUp 0.5s ease-out 3.4s forwards;
        }
        .splash-tagline {
          opacity: 0;
          animation: textUp 0.5s ease-out 3.7s forwards;
        }
        @keyframes textUp {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
