import { useState, useEffect } from 'react'

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('animate')

  useEffect(() => {
    const timer = setTimeout(() => setPhase('fade'), 4600)
    const done = setTimeout(() => onComplete(), 5200)
    return () => { clearTimeout(timer); clearTimeout(done) }
  }, [onComplete])

  return (
    <div className={`fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center transition-opacity duration-500 ${phase === 'fade' ? 'opacity-0' : 'opacity-100'}`}>
      <svg viewBox="0 0 400 300" className="w-80 h-60" xmlns="http://www.w3.org/2000/svg">

        {/* === HOUSE ASSEMBLY === */}
        {/* Foundation */}
        <rect x="130" y="200" width="140" height="6" rx="2" fill="#2563eb" className="sp-drop" style={{ animationDelay: '0.1s' }} />
        {/* Left wall */}
        <rect x="135" y="120" width="6" height="80" rx="2" fill="#2563eb" className="sp-drop" style={{ animationDelay: '0.3s' }} />
        {/* Right wall */}
        <rect x="259" y="120" width="6" height="80" rx="2" fill="#2563eb" className="sp-drop" style={{ animationDelay: '0.35s' }} />
        {/* Top beam */}
        <rect x="130" y="118" width="140" height="6" rx="2" fill="#2563eb" className="sp-drop" style={{ animationDelay: '0.5s' }} />
        {/* Roof left slope */}
        <line x1="200" y1="75" x2="120" y2="120" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" className="sp-drop" style={{ animationDelay: '0.65s' }} />
        {/* Roof right slope */}
        <line x1="200" y1="75" x2="280" y2="120" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" className="sp-drop" style={{ animationDelay: '0.7s' }} />
        {/* Chimney */}
        <rect x="240" y="70" width="12" height="30" rx="2" fill="#2563eb" className="sp-drop" style={{ animationDelay: '0.8s' }} />

        {/* Window left */}
        <rect x="152" y="140" width="24" height="24" rx="3" fill="none" stroke="#2563eb" strokeWidth="3" className="sp-pop" style={{ animationDelay: '0.95s' }} />
        <line x1="164" y1="140" x2="164" y2="164" stroke="#2563eb" strokeWidth="2" className="sp-pop" style={{ animationDelay: '0.95s' }} />
        <line x1="152" y1="152" x2="176" y2="152" stroke="#2563eb" strokeWidth="2" className="sp-pop" style={{ animationDelay: '0.95s' }} />

        {/* Window right */}
        <rect x="224" y="140" width="24" height="24" rx="3" fill="none" stroke="#2563eb" strokeWidth="3" className="sp-pop" style={{ animationDelay: '1s' }} />
        <line x1="236" y1="140" x2="236" y2="164" stroke="#2563eb" strokeWidth="2" className="sp-pop" style={{ animationDelay: '1s' }} />
        <line x1="224" y1="152" x2="248" y2="152" stroke="#2563eb" strokeWidth="2" className="sp-pop" style={{ animationDelay: '1s' }} />

        {/* Door */}
        <rect x="186" y="164" width="28" height="36" rx="3" fill="#2563eb" fillOpacity="0.15" stroke="#2563eb" strokeWidth="3" className="sp-pop" style={{ animationDelay: '1.1s' }} />
        <circle cx="208" cy="183" r="2.5" fill="#2563eb" className="sp-pop" style={{ animationDelay: '1.2s' }} />

        {/* House fill glow */}
        <rect x="141" y="124" width="118" height="76" rx="2" fill="#2563eb" fillOpacity="0.04" className="sp-fill" />

        {/* === LEFT PERSON (Landlord - throws key) === */}
        <g className="sp-person-left">
          {/* Head */}
          <circle cx="60" cy="172" r="9" fill="#0b1120" />
          {/* Eyes */}
          <circle cx="63" cy="170" r="1.5" fill="white" />
          {/* Body */}
          <line x1="60" y1="181" x2="60" y2="205" stroke="#0b1120" strokeWidth="3.5" strokeLinecap="round" />
          {/* Left leg */}
          <line x1="60" y1="205" x2="52" y2="222" stroke="#0b1120" strokeWidth="3" strokeLinecap="round" />
          {/* Right leg */}
          <line x1="60" y1="205" x2="68" y2="222" stroke="#0b1120" strokeWidth="3" strokeLinecap="round" />
          {/* Left arm (static) */}
          <line x1="60" y1="188" x2="48" y2="198" stroke="#0b1120" strokeWidth="3" strokeLinecap="round" />
          {/* Right arm (throwing) */}
          <line x1="60" y1="188" x2="75" y2="178" stroke="#0b1120" strokeWidth="3" strokeLinecap="round" className="sp-throw-arm" />
        </g>

        {/* === RIGHT PERSON (Tenant - catches key) === */}
        <g className="sp-person-right">
          {/* Head */}
          <circle cx="340" cy="172" r="9" fill="#0b1120" />
          {/* Eyes */}
          <circle cx="337" cy="170" r="1.5" fill="white" />
          {/* Body */}
          <line x1="340" y1="181" x2="340" y2="205" stroke="#0b1120" strokeWidth="3.5" strokeLinecap="round" />
          {/* Left leg */}
          <line x1="340" y1="205" x2="332" y2="222" stroke="#0b1120" strokeWidth="3" strokeLinecap="round" />
          {/* Right leg */}
          <line x1="340" y1="205" x2="348" y2="222" stroke="#0b1120" strokeWidth="3" strokeLinecap="round" />
          {/* Right arm (static) */}
          <line x1="340" y1="188" x2="352" y2="198" stroke="#0b1120" strokeWidth="3" strokeLinecap="round" />
          {/* Left arm (catching) */}
          <line x1="340" y1="188" x2="325" y2="178" stroke="#0b1120" strokeWidth="3" strokeLinecap="round" className="sp-catch-arm" />
        </g>

        {/* Ground line */}
        <line x1="20" y1="224" x2="380" y2="224" stroke="#e5e7eb" strokeWidth="2" className="sp-pop" style={{ animationDelay: '0.05s' }} />

        {/* === FLYING KEY === */}
        <g className="sp-key">
          <circle cx="200" cy="140" r="6" fill="none" stroke="#f59e0b" strokeWidth="3" />
          <line x1="200" y1="146" x2="200" y2="160" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <line x1="200" y1="153" x2="206" y2="153" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="200" y1="158" x2="207" y2="158" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Key trail sparkles */}
        <circle cx="120" cy="120" r="2.5" fill="#f59e0b" className="sp-trail" style={{ animationDelay: '2.6s' }} />
        <circle cx="160" cy="95" r="2" fill="#2563eb" className="sp-trail" style={{ animationDelay: '2.7s' }} />
        <circle cx="200" cy="85" r="3" fill="#f59e0b" className="sp-trail" style={{ animationDelay: '2.8s' }} />
        <circle cx="240" cy="95" r="2" fill="#2563eb" className="sp-trail" style={{ animationDelay: '2.9s' }} />
        <circle cx="280" cy="120" r="2.5" fill="#f59e0b" className="sp-trail" style={{ animationDelay: '3.0s' }} />

        {/* Catch sparkles */}
        <circle cx="325" cy="165" r="3" fill="#f59e0b" className="sp-sparkle" style={{ animationDelay: '3.25s' }} />
        <circle cx="335" cy="160" r="2" fill="#2563eb" className="sp-sparkle" style={{ animationDelay: '3.3s' }} />
        <circle cx="320" cy="175" r="2" fill="#f59e0b" className="sp-sparkle" style={{ animationDelay: '3.35s' }} />
        <circle cx="340" cy="170" r="2.5" fill="#2563eb" className="sp-sparkle" style={{ animationDelay: '3.28s' }} />

      </svg>

      {/* ESCAVIO text rises from center as key flies */}
      <div className="sp-title">
        <h1 className="text-4xl font-bold text-primary tracking-tight">Escavio</h1>
      </div>
      <p className="sp-tagline text-sm text-text-muted mt-1">Securing your rental future</p>

      <style>{`
        /* --- Sticks dropping to form house --- */
        .sp-drop {
          opacity: 0;
          animation: spDrop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes spDrop {
          0% { opacity: 0; transform: translateY(-100px) rotate(20deg); }
          60% { opacity: 1; transform: translateY(4px) rotate(-2deg); }
          100% { opacity: 1; transform: translateY(0) rotate(0deg); }
        }

        /* --- Windows/door pop in --- */
        .sp-pop {
          opacity: 0;
          animation: spPop 0.35s ease-out forwards;
        }
        @keyframes spPop {
          0% { opacity: 0; transform: scale(0); }
          70% { opacity: 1; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* --- House interior fill --- */
        .sp-fill {
          opacity: 0;
          animation: spFade 0.5s ease-out 1.3s forwards;
        }
        @keyframes spFade {
          to { opacity: 1; }
        }

        /* --- People walk in from sides --- */
        .sp-person-left {
          opacity: 0;
          animation: spSlideRight 0.7s ease-out 1.5s forwards;
        }
        @keyframes spSlideRight {
          0% { opacity: 0; transform: translateX(-40px); }
          40% { opacity: 1; }
          100% { opacity: 1; transform: translateX(0); }
        }

        .sp-person-right {
          opacity: 0;
          animation: spSlideLeft 0.7s ease-out 1.6s forwards;
        }
        @keyframes spSlideLeft {
          0% { opacity: 0; transform: translateX(40px); }
          40% { opacity: 1; }
          100% { opacity: 1; transform: translateX(0); }
        }

        /* --- Throwing arm winds up and releases --- */
        .sp-throw-arm {
          transform-origin: 60px 188px;
          animation: spThrow 0.5s ease-out 2.3s forwards;
        }
        @keyframes spThrow {
          0% { transform: rotate(0deg); }
          30% { transform: rotate(30deg); }
          100% { transform: rotate(-45deg); }
        }

        /* --- Catching arm reaches up --- */
        .sp-catch-arm {
          transform-origin: 340px 188px;
          animation: spCatch 0.3s ease-out 3.15s forwards;
        }
        @keyframes spCatch {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(25deg); }
        }

        /* --- Key flies in an arc from left person to right person --- */
        .sp-key {
          opacity: 0;
          animation: spKeyFly 1s cubic-bezier(0.25, 0.1, 0.25, 1) 2.4s forwards;
        }
        @keyframes spKeyFly {
          0% {
            opacity: 1;
            transform: translate(-130px, 30px) rotate(0deg) scale(0.6);
          }
          20% {
            opacity: 1;
            transform: translate(-80px, -20px) rotate(90deg) scale(0.75);
          }
          40% {
            opacity: 1;
            transform: translate(-30px, -50px) rotate(180deg) scale(0.9);
          }
          60% {
            opacity: 1;
            transform: translate(30px, -50px) rotate(270deg) scale(0.9);
          }
          80% {
            opacity: 1;
            transform: translate(80px, -20px) rotate(340deg) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translate(130px, 30px) rotate(360deg) scale(0.6);
          }
        }

        /* --- Trail sparkles along key path --- */
        .sp-trail {
          opacity: 0;
          animation: spTrail 0.4s ease-out forwards;
        }
        @keyframes spTrail {
          0% { opacity: 0; transform: scale(0); }
          40% { opacity: 0.8; transform: scale(1.8); }
          100% { opacity: 0; transform: scale(0); }
        }

        /* --- Catch sparkles --- */
        .sp-sparkle {
          opacity: 0;
          animation: spSparkle 0.5s ease-out forwards;
        }
        @keyframes spSparkle {
          0% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(2.5); }
          100% { opacity: 0; transform: scale(0); }
        }

        /* --- ESCAVIO rises from middle as key flies --- */
        .sp-title {
          opacity: 0;
          animation: spRise 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 2.5s forwards;
        }
        @keyframes spRise {
          0% { opacity: 0; transform: translateY(30px) scale(0.8); }
          60% { opacity: 1; transform: translateY(-5px) scale(1.03); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* --- Tagline fades in --- */
        .sp-tagline {
          opacity: 0;
          animation: spFade 0.5s ease-out 3.5s forwards;
        }
      `}</style>
    </div>
  )
}
