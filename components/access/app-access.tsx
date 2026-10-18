'use client'
import Link from 'next/link'
import { useInstall } from './install-provider'
export function InstallAction({ className = "inline-flex min-h-12 items-center justify-center rounded-xl border border-foreground/30 px-5 font-medium" }: { className?: string }) {
  const state = useInstall()
  if (state.installed) return <span className={className}>You’re using the app</span>
  if (state.canPrompt) return <button disabled={state.busy} onClick={state.install} className={className}>{state.busy ? 'Opening installer…' : 'Install the App'}</button>
  return <Link href="/install" className={className}>Install the App — how to</Link>
}
export function AppAccess() {
  const state = useInstall()
  return <section id="app-access" aria-labelledby="access-title" className="relative z-10 mx-auto max-w-5xl space-y-5 rounded-2xl border bg-background px-6 py-8 shadow-sm">
    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Your website. Your app. One account.</p>
    <h2 id="access-title" className="font-display text-3xl sm:text-4xl">Ginicci, one tap away.</h2>
    <p className="max-w-2xl text-muted-foreground">Add Ginicci to your home screen for quick access. No app-store download needed.</p>
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Link href="/assistant" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-foreground px-5 font-medium text-background">{state.installed ? 'Continue in the App' : 'Open the App'}</Link><InstallAction /><Link href="/onboarding" className="inline-flex min-h-12 items-center justify-center rounded-xl border px-5 font-medium">Use the Website</Link></div>
    <p className="text-xs text-muted-foreground">No app-store download needed. “Open the App” opens Ginicci here; your browser decides whether to use an installed window. Already installed? You can also open its icon on your device.</p>
    {state.notice && <p role="status" className="text-sm">{state.notice}</p>}
    <Link href="/help" className="inline-flex min-h-11 items-center text-sm underline">Need a hand?</Link>
  </section>
}
export function InstallationGuide() {
  const state = useInstall()
  return <section className="space-y-6">
    <InstallAction />
    {state.notice && <p role="status">{state.notice}</p>}
    {state.installed ? <p>You’re already in an installed app window. No need to install again.</p> : <>
      <DeviceGuide platform={state.platform} />
      <details><summary className="min-h-11 cursor-pointer underline">Instructions for another device</summary><div className="space-y-4">{(['ios', 'android', 'desktop'] as const).filter(p => p !== state.platform).map(p => <DeviceGuide key={p} platform={p} />)}</div></details>
      <p>If your browser does not offer installation, keep using Ginicci on the website. You do not need to install anything to chat.</p>
    </>}
    <p className="text-sm text-muted-foreground">We can detect this app window, not reliably inspect every app installed on your device. Installation needs a compatible browser and a secure connection. Private browsing and managed devices may restrict it. Installation does not enable voice, paid access or offline AI.</p>
  </section>
}

export function HeroAccess() {
  const state = useInstall()
  return <div className="space-y-3"><div className="flex flex-wrap gap-3"><Link href="/assistant" className="inline-flex min-h-12 items-center rounded-full bg-white px-6 font-medium text-black">{state.installed ? 'Continue in the App' : 'Open the App'}</Link><Link href="/onboarding" className="inline-flex min-h-12 items-center rounded-full border border-white/40 px-6 text-white">Use the Website</Link><InstallAction className="inline-flex min-h-12 items-center rounded-full border border-white/40 px-6 text-white" /></div><p className="text-sm text-white/80">One account for your conversations, preferences and Premium access.</p>{state.notice && <p role="status" className="text-sm text-white">{state.notice}</p>}</div>
}

function DeviceGuide({ platform }: { platform: 'ios' | 'android' | 'desktop' }) {
  return <section className="space-y-2 rounded-xl border p-5">
    <h2 className="text-2xl">{platform === 'ios' ? 'iPhone / iPad' : platform === 'android' ? 'Android' : 'Desktop'}</h2>
    {platform === 'ios' ? <><p>Open this website in Safari. Tap Share → Add to Home Screen → Add. If shown, keep Open as Web App enabled.</p><p className="text-sm">Inside another app’s browser? Open this address in Safari first. Sign in with the same account after opening the Ginicci icon; Safari and the app may have separate sign-in sessions.</p></> : platform === 'android' ? <p>In Chrome or another supported browser, open the menu and choose Install app or Add to Home screen if offered. Follow the browser’s instructions. Some browsers create a shortcut instead.</p> : <p>In Chrome or Edge, use the address-bar install icon or browser menu if offered. On supported macOS Safari versions, use File → Add to Dock. If neither is available, continue on the website.</p>}
  </section>
}
