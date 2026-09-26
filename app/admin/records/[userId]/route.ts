import { asc, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { activityLog, agentUsage, legalConsent, subscription, user } from '@/lib/db-schema'
import { isOwnerEmail } from '@/lib/owner'
import { getUserSession } from '@/lib/session'
import { stripe } from '@/lib/stripe'

const notFound = () => new Response('Not found', { status: 404 })

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getUserSession()
  if (!session?.user || !isOwnerEmail(session.user.email)) return notFound()

  const { userId } = await params
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(userId)) return notFound()

  const [account] = await db
    .select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  if (!account) return notFound()

  const [consents, subscriptions, usage, activity] = await Promise.all([
    db.select().from(legalConsent).where(eq(legalConsent.userId, userId)).orderBy(asc(legalConsent.createdAt)),
    db.select().from(subscription).where(eq(subscription.userId, userId)).orderBy(asc(subscription.createdAt)),
    db.select().from(agentUsage).where(eq(agentUsage.userId, userId)).orderBy(asc(agentUsage.period)),
    db
      .select()
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt))
      .limit(10000),
  ])

  const customerIds = [...new Set(subscriptions.map((row) => row.stripeCustomerId))]
  const stripeInvoices = []
  for (const customer of customerIds) {
    try {
      const invoices = await stripe.invoices.list({ customer, limit: 100 })
      stripeInvoices.push(
        ...invoices.data.map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          amountPaidCents: invoice.amount_paid,
          currency: invoice.currency,
          createdAt: new Date(invoice.created * 1000).toISOString(),
          hostedInvoiceUrl: invoice.hosted_invoice_url,
        })),
      )
    } catch (error) {
      console.error('Could not load Stripe invoices for export', error)
    }
  }

  const tasksCompleted = activity.filter((row) => row.event === 'agent_task_completed').length
  const record = {
    generatedAt: new Date().toISOString(),
    summary: {
      email: account.email,
      accountCreatedAt: account.createdAt,
      agreements: consents.length,
      signIns: activity.filter((row) => row.event === 'sign_in').length,
      agentTasksCompleted: tasksCompleted,
      lastActivityAt: activity[0]?.createdAt ?? null,
    },
    account,
    agreements: consents,
    subscriptions,
    monthlyUsage: usage,
    stripeInvoices,
    activityLog: activity,
  }

  const safeEmail = account.email.replace(/[^A-Za-z0-9._-]/g, '_')
  return new Response(JSON.stringify(record, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="northstar-records-${safeEmail}.json"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
}
