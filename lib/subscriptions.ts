import 'server-only'

import type Stripe from 'stripe'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { subscription } from '@/lib/db-schema'
import { stripe } from '@/lib/stripe'
import { getTier } from '@/lib/tiers'
import { formatCents, sendOwnerAlert } from '@/lib/owner-alerts'

export const ACCESS_STATUSES = ['active', 'trialing', 'past_due'] as const

export function hasAccess(status: string) {
  return (ACCESS_STATUSES as readonly string[]).includes(status)
}

function toDate(seconds: number | null | undefined) {
  return seconds ? new Date(seconds * 1000) : null
}

// Always re-reads the subscription from Stripe so out-of-order or replayed
// events can't write stale state.
export async function syncSubscription(subscriptionId: string) {
  const sub: Stripe.Subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const { userId, tierId, interval } = sub.metadata ?? {}
  if (!userId || !tierId || !getTier(tierId)) return null
  if (interval !== 'monthly' && interval !== 'annual') return null

  const item = sub.items.data[0]
  const values = {
    userId,
    stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    tierId,
    interval,
    status: sub.status,
    currentPeriodEnd: toDate(item?.current_period_end),
    trialEnd: toDate(sub.trial_end),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    amountCents: item?.price.unit_amount ?? 0,
  }

  const [previous] = await db
    .select({ status: subscription.status, cancelAtPeriodEnd: subscription.cancelAtPeriodEnd })
    .from(subscription)
    .where(eq(subscription.id, sub.id))
    .limit(1)

  await db
    .insert(subscription)
    .values({ id: sub.id, ...values })
    .onConflictDoUpdate({ target: subscription.id, set: { ...values, updatedAt: new Date() } })

  await alertOnChange(previous ?? null, values, sub.id)

  return values
}

type SubscriptionSnapshot = { status: string; cancelAtPeriodEnd: boolean }

async function alertOnChange(
  previous: SubscriptionSnapshot | null,
  next: SubscriptionSnapshot & { tierId: string; interval: string; amountCents: number; userId: string },
  subscriptionId: string,
) {
  const planName = getTier(next.tierId)?.name ?? next.tierId
  const price = `${formatCents(next.amountCents)} / ${next.interval === 'annual' ? 'year' : 'month'}`
  const details = [`Plan: ${planName} (${price})`, `User ID: ${next.userId}`, `Stripe subscription: ${subscriptionId}`]

  let subject: string | null = null
  if (!previous && next.status === 'trialing') subject = `New free trial: ${planName}`
  else if (!previous && next.status === 'active') subject = `New paying customer: ${planName}`
  else if (previous?.status === 'trialing' && next.status === 'active') subject = `Trial converted to paid: ${planName}`
  else if (previous && previous.status !== 'past_due' && next.status === 'past_due') subject = `Payment failed: ${planName}`
  else if (previous && previous.status !== 'canceled' && next.status === 'canceled') subject = `Subscription ended: ${planName}`
  else if (previous && !previous.cancelAtPeriodEnd && next.cancelAtPeriodEnd) subject = `Customer canceled: ${planName}`

  if (subject) await sendOwnerAlert(subject, details)
}

export async function getLatestSubscription(userId: string) {
  const [row] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .orderBy(desc(subscription.updatedAt))
    .limit(1)
  return row ?? null
}
