import type { Metadata } from 'next'
import Link from 'next/link'
import { count, desc, eq } from 'drizzle-orm'
import { ArrowLeft, Download } from 'lucide-react'
import { db } from '@/lib/db'
import { subscription, user } from '@/lib/db-schema'
import { requireOwner } from '@/lib/owner'
import { hasAccess } from '@/lib/subscriptions'
import { formatDollars, getTier } from '@/lib/tiers'

export const metadata: Metadata = {
  title: 'Owner console | Northstar',
  robots: { index: false, follow: false },
}

function formatDate(date: Date | null) {
  return date
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
    : '—'
}

export default async function AdminPage() {
  await requireOwner()

  const [[{ value: userCount }], rows] = await Promise.all([
    db.select({ value: count() }).from(user),
    db
      .select({
        id: subscription.id,
        userId: subscription.userId,
        tierId: subscription.tierId,
        interval: subscription.interval,
        status: subscription.status,
        amountCents: subscription.amountCents,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
        email: user.email,
      })
      .from(subscription)
      .leftJoin(user, eq(user.id, subscription.userId))
      .orderBy(desc(subscription.updatedAt))
      .limit(100),
  ])

  const paying = rows.filter((row) => row.status === 'active' || row.status === 'past_due')
  const trialing = rows.filter((row) => row.status === 'trialing')
  const monthlyRevenue = paying.reduce(
    (sum, row) => sum + (row.interval === 'annual' ? Math.round(row.amountCents / 12) : row.amountCents),
    0,
  )

  const stats = [
    { label: 'Accounts', value: userCount.toLocaleString('en-US') },
    { label: 'Paying', value: paying.length.toLocaleString('en-US') },
    { label: 'In trial', value: trialing.length.toLocaleString('en-US') },
    { label: 'Monthly revenue', value: formatDollars(monthlyRevenue) },
  ]

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-5 py-8 md:py-16">
        <Link
          href="/account"
          className="inline-flex min-h-11 items-center gap-2 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to account
        </Link>

        <header className="flex flex-col gap-2 border-b border-foreground/10 pb-8">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Owner only
          </span>
          <h1 className="font-display text-4xl tracking-tight text-balance">Owner console</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Only your account can open this page. Everyone else sees a “not found” page.
          </p>
        </header>

        <dl className="grid grid-cols-2 gap-px border border-foreground/10 bg-foreground/10">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 bg-background p-4">
              <dt className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</dt>
              <dd className="font-display text-2xl tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="subs-heading" className="flex flex-col gap-4">
          <h2 id="subs-heading" className="font-display text-xl">
            Subscriptions
          </h2>
          {rows.length === 0 ? (
            <p className="border border-foreground/10 p-6 text-sm leading-relaxed text-muted-foreground">
              No subscriptions yet. They&apos;ll show up here as soon as a customer checks out.
            </p>
          ) : (
            <ul className="flex flex-col border border-foreground/10">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-1 border-b border-foreground/10 p-4 last:border-b-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-medium">{row.email ?? 'Deleted account'}</span>
                    <span
                      className={`shrink-0 font-mono text-xs uppercase tracking-widest ${
                        hasAccess(row.status) ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {row.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getTier(row.tierId)?.name ?? row.tierId} · {formatDollars(row.amountCents)}/
                    {row.interval === 'annual' ? 'yr' : 'mo'} ·{' '}
                    {row.cancelAtPeriodEnd ? 'ends' : 'renews'} {formatDate(row.currentPeriodEnd)}
                  </p>
                  <a
                    href={`/admin/records/${row.userId}`}
                    download
                    className="inline-flex min-h-11 items-center gap-2 self-start text-sm text-foreground underline underline-offset-4"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Download records
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
