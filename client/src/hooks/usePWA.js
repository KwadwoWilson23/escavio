import { useState, useEffect } from 'react'

let deferredPrompt = null

export function usePWA() {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true)
      return
    }

    function handlePrompt(e) {
      e.preventDefault()
      deferredPrompt = e
      setCanInstall(true)
    }

    function handleInstalled() {
      setIsInstalled(true)
      setCanInstall(false)
      deferredPrompt = null
    }

    window.addEventListener('beforeinstallprompt', handlePrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  async function install() {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    setCanInstall(false)
    return outcome === 'accepted'
  }

  return { canInstall, isInstalled, install }
}
