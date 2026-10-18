'use client'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { installedDisplay, installPlatform, type InstallPlatform } from '@/lib/install-state'
type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
type State = { installed: boolean; platform: InstallPlatform; canPrompt: boolean; busy: boolean; notice: string; install: () => Promise<void> }
const Context = createContext<State>({ installed: false, platform: 'desktop', canPrompt: false, busy: false, notice: '', install: async () => {} })
export function InstallProvider({ children }: { children: React.ReactNode }) {
  const [installed, setInstalled] = useState(false)
  const [platform, setPlatform] = useState<InstallPlatform>('desktop')
  const [canPrompt, setCanPrompt] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const pending = useRef<Prompt | null>(null)
  useEffect(() => {
    const standalone = matchMedia('(display-mode: standalone)')
    const overlay = matchMedia('(display-mode: window-controls-overlay)')
    const update = () => setInstalled(installedDisplay(standalone.matches, !!(navigator as Navigator & { standalone?: boolean }).standalone, overlay.matches))
    update(); setPlatform(installPlatform(navigator.userAgent, navigator.platform, navigator.maxTouchPoints))
    const available = (event: Event) => { event.preventDefault(); pending.current = event as Prompt; setCanPrompt(true) }
    const accepted = () => { pending.current = null; setCanPrompt(false); setNotice('Installation accepted. Open Ginicci from your device’s app launcher when it appears.') }
    window.addEventListener('beforeinstallprompt', available); window.addEventListener('appinstalled', accepted)
    standalone.addEventListener('change', update); overlay.addEventListener('change', update)
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/pwa-sw.js', { updateViaCache: 'none' }).catch(() => {})
    return () => { window.removeEventListener('beforeinstallprompt', available); window.removeEventListener('appinstalled', accepted); standalone.removeEventListener('change', update); overlay.removeEventListener('change', update) }
  }, [])
  async function install() {
    const prompt = pending.current
    if (!prompt || busy || installed) return
    pending.current = null; setCanPrompt(false); setBusy(true)
    try {
      await prompt.prompt()
      const choice = await prompt.userChoice
      setNotice(choice.outcome === 'accepted' ? 'Installation accepted. Look for Ginicci in your device’s app launcher.' : 'No problem — keep chatting on the website. Installation tips are available whenever you need them.')
    } catch { setNotice('Your browser could not open the installer. Follow the installation tips or continue on the website.') }
    finally { setBusy(false) }
  }
  return <Context.Provider value={{ installed, platform, canPrompt, busy, notice, install }}>{children}</Context.Provider>
}
export const useInstall = () => useContext(Context)
