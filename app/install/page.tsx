import Link from 'next/link'
import { InstallationGuide } from '@/components/access/app-access'
export default function InstallPage() {
  return <main className="mx-auto max-w-2xl space-y-6 px-6 py-10"><Link className="inline-flex min-h-11 items-center underline" href="/">Ginicci · Home</Link><img src="/pwa/icon-192.png" width="80" height="80" alt="Ginicci app icon" /><h1 className="font-display text-4xl">Ginicci, one tap away</h1><p>Keep your AI assistant close by adding Ginicci to your home screen or desktop. No app-store download required.</p><InstallationGuide /><nav aria-label="Continue with Ginicci" className="flex flex-wrap gap-4"><Link className="inline-flex min-h-12 items-center rounded-xl bg-foreground px-5 text-background" href="/assistant">Open the App</Link><Link className="inline-flex min-h-12 items-center underline" href="/onboarding">Use the Website</Link><Link className="inline-flex min-h-12 items-center underline" href="/help">Help</Link></nav></main>
}
