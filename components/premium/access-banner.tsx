'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { acknowledgePremiumResult } from '@/lib/premium-client'
type Balance = { remaining: number; pending: number; paid: boolean }
type Result = { id: string; feature: string; result: string }
export function PremiumAccessBanner() {
  const [balance, setBalance] = useState<Balance | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [notice, setNotice] = useState('')
  useEffect(() => {
    let active = true
    const refresh = () => fetch('/api/premium/status', { cache: 'no-store' }).then(async r => {
      const value = r.ok ? await r.json() : null
      if (active) setBalance(value)
    }).catch(() => { if (active) setBalance(null) })
    refresh()
    window.addEventListener('premium-balance', refresh)
    window.addEventListener('focus', refresh)
    const timer = setInterval(refresh, 15000)
    return () => { active = false; clearInterval(timer); window.removeEventListener('premium-balance', refresh); window.removeEventListener('focus', refresh) }
  }, [])
  async function recover() {
    setNotice('')
    try {
      const response = await fetch('/api/premium/results', { cache: 'no-store' })
      if (!response.ok) throw new Error()
      const data = await response.json()
      setResults(data.results)
      // Content has arrived successfully. Server only accepts IDs belonging to this account.
      await Promise.all(data.results.map((r: Result) => acknowledgePremiumResult(r.id)))
    } catch { setNotice('Saved results are temporarily unavailable. No extra credit is charged for recovery.') }
  }
  return <section aria-label="Premium access" className="border-b border-foreground/10 px-4 py-3 text-sm">
    <p role="status">{balance ? balance.paid ? 'Premium subscription verified' : `${balance.remaining} of 6 premium uses remaining` : 'Sign in to view premium access, or check again when the service is available.'}</p>
    {balance && !balance.paid && <p className="text-xs text-muted-foreground">Only successful qualifying results count. Failed or stopped generation is not charged. A qualifying voice session counts once, not per sentence. Your balance is shared with the website and installed app.</p>}
    {!!balance?.pending && <p className="text-xs text-muted-foreground">{balance.pending} use(s) reserved, not yet charged, while processing or awaiting delivery. Recover saved results if interrupted.</p>}
    {balance && !balance.paid && balance.remaining === 0 && <div className="mt-2 rounded-lg border p-3">
      <p>Your six successful Premium uses are complete. You can review your saved results, or compare plans if you’d like to continue.</p>
      <Link className="mt-2 inline-flex min-h-11 items-center font-medium underline" href="/pricing">Upgrade to Premium</Link>
      <p className="text-xs text-muted-foreground">Free browsing and your saved results remain available.</p>
    </div>}
    <div className="flex gap-4"><Link className="inline-flex min-h-11 items-center underline" href="/account">Billing & account</Link><button className="min-h-11 underline" onClick={recover}>Recover premium results</button></div>
    {notice && <p role="alert">{notice}</p>}
    {!!results.length && <details><summary className="min-h-11 cursor-pointer">Saved premium results</summary>{results.map(r => <article key={r.id} className="my-3 max-h-64 overflow-auto rounded border p-3"><h3>{r.feature}</h3><p className="whitespace-pre-wrap">{r.result}</p></article>)}</details>}
  </section>
}
