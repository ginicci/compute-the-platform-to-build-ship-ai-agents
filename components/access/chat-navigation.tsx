'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
export function ChatNavigation() {
  const path = usePathname()
  return <nav aria-label="Ginicci navigation" className="flex shrink-0 flex-wrap items-center gap-x-4 border-b px-4 py-1 text-sm"><Link href="/" className="inline-flex min-h-11 items-center font-medium">Ginicci · Home</Link><Link href={path === '/assistant' ? '/onboarding' : '/assistant'} className="inline-flex min-h-11 items-center underline">{path === '/assistant' ? 'Use the Website' : 'Open the App'}</Link><Link href="/install" className="inline-flex min-h-11 items-center underline">Install</Link><Link href="/account" className="inline-flex min-h-11 items-center underline">Account</Link><Link href="/help" className="inline-flex min-h-11 items-center underline">Help</Link></nav>
}
