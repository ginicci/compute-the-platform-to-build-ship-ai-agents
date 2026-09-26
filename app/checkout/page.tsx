import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { getUserSession } from '@/lib/session'
import { getLatestSubscription, hasAccess } from '@/lib/subscriptions'
import { formatDollars, getTier, isPaidTier, type BillingInterval } from '@/lib/tiers'

export const metadata: Metadata = {
  title: 'Checkout | Northstar',
  robots: { index: false },
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; interval?: string }>
}) {
  const { plan, interval: rawInterval } = await searchParams
  const tier = plan ? getTier(plan) : undefined
  if (!tier || !isPaidTier(tier)) redirect('/#pricing')

  const session = await getUserSession()
  if (!session) redirect('/sign-up')

  const existing = await getLatestSubscription(session.user.id)
  if (existing && hasAccess(existing.status)) redirect('/account')

  const interval: BillingInterval = rawInterval === 'monthly' ? 'monthly' : 'annual'
  const perMonth = formatDollars(tier.priceInCents[interval])
  const billedNote =
    interval === 'annual'
      ? `${formatDollars(tier.priceInCents.annual * 12)} billed yearly`
      : 'Billed monthly'

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 py-8 md:py-16">
        <Link
          href="/#pricing"
          className="inline-flex min-h-11 items-center gap-2 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to plans
        </Link>

        <header className="flex flex-col gap-3 border-b border-foreground/10 pb-8">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Northstar {tier.name}
          </span>
          <h1 className="font-display text-4xl tracking-tight text-balance md:text-5xl">
            {perMonth}
            <span className="text-base text-muted-foreground"> /month</span>
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {tier.trialDays > 0
              ? `${tier.trialDays} days free, then ${billedNote.toLowerCase()}. Cancel anytime before the trial ends and you won't be charged.`
              : `${billedNote}. Cancel anytime.`}
          </p>
        </header>

        <CheckoutForm tierId={tier.id} interval={interval} />
      </div>
    </main>
  )
}
