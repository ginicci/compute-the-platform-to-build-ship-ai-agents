import Link from 'next/link'
import { pricedPlans } from '@/lib/premium-billing'
import { getTier } from '@/lib/tiers'
export const dynamic = 'force-dynamic'
export default async function PricingPage() {
  const plans = await pricedPlans().catch(() => [])
  return <main className="mx-auto min-h-dvh max-w-5xl space-y-8 px-5 py-12">
    <Link href="/onboarding" className="underline">Back to agents</Link>
    <header className="space-y-4"><p className="font-mono text-xs uppercase tracking-widest">Ginicci Premium</p><h1 className="font-display text-5xl">Experience it. Then unlock more.</h1><p>Six complimentary successful premium uses. No card required. The same advanced model, specialist agents and full response quality as subscribers.</p></header>
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      <section className="rounded-xl border p-6"><h2 className="text-2xl">Free account</h2><p className="my-4 text-3xl">Free</p><ul className="list-inside list-disc space-y-2"><li>Six successful premium uses per account</li><li>Every specialist included during trial</li><li>Free browsing and saved results</li><li>No credit charged for failed generation</li></ul><Link href="/sign-up" className="mt-6 inline-flex min-h-11 items-center underline">Create account</Link></section>
      {plans.map(plan => <section key={`${plan.tier_id}:${plan.interval}`} className="rounded-xl border border-primary p-6"><h2 className="text-2xl">{getTier(plan.tier_id)?.name ?? plan.tier_id}</h2><p className="my-4 text-3xl">{new Intl.NumberFormat('en-US', { style: 'currency', currency: plan.currency }).format(plan.amount / 100)}<span className="text-sm">/{plan.interval === 'annual' ? 'year' : 'month'}</span></p><ul className="list-inside list-disc space-y-2"><li>Same premium model and quality as trial</li><li>All nine specialist agents</li><li>{plan.tasks_per_period} successful uses per billing period</li><li>Account-based access on website and app</li><li>Manage or cancel through secure billing</li></ul><Link className="mt-6 inline-flex min-h-11 items-center rounded bg-foreground px-5 text-background" href={`/checkout?plan=${plan.tier_id}&interval=${plan.interval}`}>Upgrade to Premium</Link><p className="mt-2 text-xs">Stripe test checkout only. No live payment activation.</p></section>)}
    </div>
    {!plans.length && <p role="status">Subscription prices are not configured for testing yet. Checkout is unavailable until the owner configures approved Stripe test prices. No price is invented here.</p>}
    <p className="text-sm text-muted-foreground">Trial credits are shared across the connected website and PWA. Failed or interrupted generation is not charged. Saved results can be recovered after a connection interruption. AI guidance does not execute bookings, payments or external actions.</p>
    <Link href="/account" className="underline">Manage billing</Link>
  </main>
}
