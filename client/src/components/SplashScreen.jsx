import { useState, useEffect } from 'react'

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('animate')

  useEffect(() => {
    const fade = setTimeout(() => setPhase('fade'), 1600)
    const done = setTimeout(() => onComplete(), 2100)
    return () => { clearTimeout(fade); clearTimeout(done) }
  }, [onComplete])

  return (
    <div className={`fixed inset-0 z-[200] bg-primary flex flex-col items-center justify-center transition-opacity duration-500 ${phase === 'fade' ? 'opacity-0' : 'opacity-100'}`}>
      <div className="sp-logo-wrap">
        <svg viewBox="0 0 80 80" className="w-20 h-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path d="M40 12 L68 36 L60 36 L60 65 L20 65 L20 36 L12 36 Z" fill="none" stroke="white" strokeWidth="3" strokeLinejoin="round" className="sp-house-draw" />
          <rect x="33" y="45" width="14" height="20" rx="2" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2" className="sp-door" />
          <circle cx="44" cy="56" r="1.5" fill="white" className="sp-door" />
          <rect x="25" y="40" width="8" height="8" rx="1" fill="none" stroke="white" strokeWidth="1.5" className="sp-win" />
          <rect x="47" y="40" width="8" height="8" rx="1" fill="none" stroke="white" strokeWidth="1.5" className="sp-win" />
          <circle cx="40" cy="30" r="4" fill="none" stroke="#f59e0b" strokeWidth="2" className="sp-key-icon" />
          <line x1="40" y1="34" x2="40" y2="40" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" className="sp-key-icon" />
          <line x1="40" y1="37" x2="43" y2="37" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" className="sp-key-icon" />
        </svg>
      </div>

      <h1 className="sp-name text-3xl font-bold text-white tracking-tight mt-4">Escavio</h1>
      <p className="sp-tag text-white/60 text-sm mt-1">Securing your rental future</p>

      <style>{`
        .sp-logo-wrap {
          opacity: 0;
          animation: spScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards;
        }
        @keyframes spScale {
          0% { opacity: 0; transform: scale(0.5); }
          60% { opacity: 1; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        .sp-house-draw {
          stroke-dasharray: 250;
          stroke-dashoffset: 250;
          animation: spDraw 0.8s ease-out 0.2s forwards;
        }
        @keyframes spDraw {
          to { stroke-dashoffset: 0; }
        }
        .sp-door {
          opacity: 0;
          animation: spFadeIn 0.3s ease-out 0.7s forwards;
        }
        .sp-win {
          opacity: 0;
          animation: spFadeIn 0.3s ease-out 0.8s forwards;
        }
        .sp-key-icon {
          opacity: 0;
          animation: spKeyPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.9s forwards;
        }
        @keyframes spKeyPop {
          0% { opacity: 0; transform: scale(0) rotate(-90deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes spFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .sp-name {
          opacity: 0;
          animation: spNameIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s forwards;
        }
        @keyframes spNameIn {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .sp-tag {
          opacity: 0;
          animation: spFadeIn 0.4s ease-out 1.0s forwards;
        }
      `}</style>
    </div>
  )
}
