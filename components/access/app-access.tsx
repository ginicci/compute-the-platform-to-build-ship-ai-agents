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
    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">One Ginicci account. Your choice of screen.</p>
    <h2 id="access-title" className="font-display text-3xl sm:text-4xl">A little clarity. A good conversation. Your next step.</h2>
    <p className="max-w-2xl text-muted-foreground">Ask a quick question, think something through, or pick up a saved conversation. Your account, preferences and Premium balance stay together.</p>
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
    {state.installed ? <p>You’re already in an installed app window. No need to install again.</p> : <p>{state.platform === 'ios' ? 'On iPhone or iPad, use the manual steps below. There is no browser install pop-up.' : state.platform === 'android' ? 'On Android, use the install button if your browser offers it, or its menu as described below.' : 'On desktop, use the install button only when offered by your browser, or check its menu below.'}</p>}
    <section className="space-y-2 rounded-xl border p-5"><h2 className="text-2xl">iPhone / iPad</h2><ol className="list-inside list-decimal space-y-2"><li>Open this website in Safari. If you’re inside another app’s browser, copy the address and open it in Safari.</li><li>Tap Share (the square with an arrow). Find Add to Home Screen; it may be under More or Edit Actions.</li><li>If shown, keep Open as Web App enabled. Tap Add, then open the Ginicci icon.</li></ol><p className="text-sm">Sign in with the same account. Safari and the home-screen app can have separate sign-in sessions. Avoid adding multiple copies.</p></section>
    <section className="space-y-2 rounded-xl border p-5"><h2 className="text-2xl">Android</h2><p>In Chrome or another supported browser, open the menu and choose Install app or Add to Home screen if offered. Confirm the browser’s instructions, then launch Ginicci from its icon.</p><p className="text-sm">Some browsers create only a shortcut. If there is no install option, keep using the website — the same account features are available.</p></section>
    <section className="space-y-2 rounded-xl border p-5"><h2 className="text-2xl">Desktop</h2><p>In Chrome or Edge, look for the install icon in the address bar or an install option in the browser menu. On supported macOS Safari versions, use File → Add to Dock. Options vary by browser and device.</p></section>
    <p className="text-sm text-muted-foreground">We can detect this app window, not reliably inspect every app installed on your device. Installation needs a compatible browser and a secure connection. Private browsing and managed devices may restrict it. Installation does not enable voice, paid access or offline AI.</p>
  </section>
}

export function HeroAccess() {
  const state = useInstall()
  return <div className="space-y-3"><div className="flex flex-wrap gap-3"><Link href="/assistant" className="inline-flex min-h-12 items-center rounded-full bg-white px-6 font-medium text-black">{state.installed ? 'Continue in the App' : 'Open the App'}</Link><Link href="/onboarding" className="inline-flex min-h-12 items-center rounded-full border border-white/40 px-6 text-white">Use the Website</Link><InstallAction className="inline-flex min-h-12 items-center rounded-full border border-white/40 px-6 text-white" /></div><p className="text-sm text-white/80">One account for your conversations, preferences and Premium access.</p>{state.notice && <p role="status" className="text-sm text-white">{state.notice}</p>}</div>
}
