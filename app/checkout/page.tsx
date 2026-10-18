import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { getUserSession } from '@/lib/session'
import { pricedPlans } from '@/lib/premium-billing'
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!(await getUserSession())?.user) redirect('/sign-in')
  const params = await searchParams
  const plan = (await pricedPlans().catch(() => [])).find(p => p.tier_id === params.plan && p.interval === params.interval)
  return <main className="mx-auto max-w-2xl space-y-6 px-5 py-12"><Link href="/pricing" className="underline">Compare plans</Link><h1 className="font-display text-4xl">Secure Premium checkout</h1>{plan ? <><p>Test mode · {new Intl.NumberFormat('en-US', { style: 'currency', currency: plan.currency }).format(plan.amount / 100)} billed {plan.interval}. Access activates only after server-side payment verification.</p><CheckoutForm tierId={plan.tier_id} interval={plan.interval} /></> : <p role="status">This plan is not configured for test checkout. No payment will be taken.</p>}</main>
}
