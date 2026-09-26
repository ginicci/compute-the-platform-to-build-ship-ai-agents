import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ManageBillingButton } from '@/components/account/manage-billing-button'
import { isOwnerEmail } from '@/lib/owner'
import { getUserSession } from '@/lib/session'
import { getLatestSubscription, hasAccess } from '@/lib/subscriptions'
import { formatDollars, getTier } from '@/lib/tiers'

export const metadata: Metadata = {
  title: 'Your plan | Northstar',
  robots: { index: false },
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  trialing: 'Free trial',
  past_due: 'Payment due',
  canceled: 'Canceled',
  unpaid: 'Unpaid',
  incomplete: 'Incomplete',
  incomplete_expired: 'Expired',
  paused: 'Paused',
}

function formatDate(date: Date | null) {
  return date
    ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date)
    : null
}

export default async function AccountPage() {
  const session = await getUserSession()
  if (!session) redirect('/sign-in')

  const current = await getLatestSubscription(session.user.id)
  const active = current && hasAccess(current.status) ? current : null
  const tier = getTier(active?.tierId ?? 'free')

  let renewalNote: string | null = null
  if (active) {
    const trialEnds = formatDate(active.trialEnd)
    const periodEnds = formatDate(active.currentPeriodEnd)
    if (active.status === 'trialing' && trialEnds) {
      renewalNote = active.cancelAtPeriodEnd
        ? `Trial ends ${trialEnds}. You won't be charged.`
        : `Trial ends ${trialEnds}, then ${formatDollars(active.amountCents)} per ${active.interval === 'annual' ? 'year' : 'month'}.`
    } else if (periodEnds) {
      renewalNote = active.cancelAtPeriodEnd
        ? `Your plan ends ${periodEnds}.`
        : `Renews ${periodEnds} for ${formatDollars(active.amountCents)}.`
    }
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 py-8 md:py-16">
        <Link
          href="/onboarding"
          className="inline-flex min-h-11 items-center gap-2 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to agents
        </Link>

        <header className="flex flex-col gap-2 border-b border-foreground/10 pb-8">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Your account
          </span>
          <h1 className="font-display text-4xl tracking-tight text-balance">
            Northstar {tier?.name ?? 'Free'}
          </h1>
          <p className="break-all text-sm text-muted-foreground">{session.user.email}</p>
        </header>

        <section aria-labelledby="plan-heading" className="flex flex-col gap-4 border border-foreground/10 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id="plan-heading" className="font-display text-xl">
              Plan
            </h2>
            <span className="border border-foreground/20 px-2 py-1 font-mono text-xs uppercase tracking-widest">
              {active ? (STATUS_LABELS[active.status] ?? active.status) : 'Free'}
            </span>
          </div>

          {active ? (
            <>
              {renewalNote && <p className="text-sm leading-relaxed text-muted-foreground">{renewalNote}</p>}
              {active.status === 'past_due' && (
                <p role="alert" className="text-sm leading-relaxed text-destructive">
                  Your last payment didn&apos;t go through. Update your card to keep your plan.
                </p>
              )}
              <ManageBillingButton />
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {"You're on the Free plan. Upgrade for more agents and tasks."}
              </p>
              <Link
                href="/#pricing"
                className="inline-flex min-h-11 items-center justify-center bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                See plans
              </Link>
            </>
          )}
        </section>

        {isOwnerEmail(session.user.email) && (
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center justify-center border border-foreground/20 px-5 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            Open owner console
          </Link>
        )}
      </div>
    </main>
  )
}
