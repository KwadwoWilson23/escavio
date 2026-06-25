import { useState } from 'react'
import { Download, X } from 'lucide-react'
import { usePWA } from '../hooks/usePWA'

export default function InstallBanner() {
  const { canInstall, install } = usePWA()
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('escavio_install_dismissed') === '1')

  if (!canInstall || dismissed) return null

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem('escavio_install_dismissed', '1')
  }

  async function handleInstall() {
    await install()
    setDismissed(true)
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-[90] animate-slideDown">
      <div className="bg-[#0B1120] rounded-2xl p-4 shadow-2xl border border-white/10 flex items-center gap-3">
        <img src="/favicon.svg" alt="Escavio" className="w-11 h-11 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Install Escavio</p>
          <p className="text-white/50 text-xs mt-0.5">Add to home screen for quick access</p>
        </div>
        <button
          onClick={handleInstall}
          className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all"
        >
          <Download size={14} /> Install
        </button>
        <button onClick={handleDismiss} className="text-white/40 hover:text-white/70 flex-shrink-0 p-1">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
