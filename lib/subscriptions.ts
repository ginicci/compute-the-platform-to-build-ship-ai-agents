import 'server-only'

import type Stripe from 'stripe'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { subscription } from '@/lib/db-schema'
import { stripe } from '@/lib/stripe'
import { getTier } from '@/lib/tiers'

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

  await db
    .insert(subscription)
    .values({ id: sub.id, ...values })
    .onConflictDoUpdate({ target: subscription.id, set: { ...values, updatedAt: new Date() } })

  return values
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
