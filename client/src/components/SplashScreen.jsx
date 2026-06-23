import { useState, useEffect } from 'react'

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('animate')

  useEffect(() => {
    const fade = setTimeout(() => setPhase('fade'), 1600)
    const done = setTimeout(() => onComplete(), 2100)
    return () => { clearTimeout(fade); clearTimeout(done) }
  }, [onComplete])

  return (
    <div className={`fixed inset-0 z-[200] bg-[#0B1120] flex flex-col items-center justify-center transition-opacity duration-500 ${phase === 'fade' ? 'opacity-0' : 'opacity-100'}`}>
      <div className="sp-logo-wrap">
        <img src="/favicon.svg" alt="Escavio" className="w-24 h-24 rounded-2xl" />
      </div>

      <h1 className="sp-name text-3xl font-bold tracking-tight mt-5">
        <span className="text-[#2563EB]">E</span><span className="text-white">scavio</span>
      </h1>
      <p className="sp-tag text-white/50 text-sm mt-1.5">Securing your rental future</p>

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
        @keyframes spFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
