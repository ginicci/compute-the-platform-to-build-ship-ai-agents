'use server'
import { headers } from 'next/headers'
import { getLatestSubscription } from '@/lib/subscriptions'
import type { BillingInterval } from '@/lib/tiers'
import { getTier } from '@/lib/tiers'
import { getUserSession } from '@/lib/session'
import { pricedPlans, requireTestBilling } from '@/lib/premium-billing'
import { stripe } from '@/lib/stripe'
import { recordConsent } from '@/lib/legal'
import { siteUrl } from '@/lib/site'
export async function startSubscriptionCheckout(tierId: string, interval: BillingInterval, acceptedTerms: boolean): Promise<{ clientSecret: string | null; sessionId: string }> {
  requireTestBilling()
  const session = await getUserSession()
  if (!session?.user || !acceptedTerms) throw new Error('Sign in and accept the terms before checkout')
  if (!getTier(tierId) || tierId === 'free') throw new Error('Invalid plan')
  const plan = (await pricedPlans()).find(p => p.tier_id === tierId && p.interval === interval)
  if (!plan) throw new Error('Plan is not configured')
  const current = await getLatestSubscription(session.user.id)
  if (current) {
    const existing = await stripe.subscriptions.retrieve(current.id)
    if (!['canceled', 'incomplete_expired'].includes(existing.status)) throw new Error('Manage your existing subscription from Billing before starting another')
  }
  const origin = (await headers()).get('origin') ?? siteUrl
  // Stable per-account key prevents parallel checkout creation during a short window.
  const metadata = { userId: session.user.id, tierId, interval }
  await recordConsent(session.user.id, 'checkout', JSON.stringify({ tierId, interval }))
  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription', ui_mode: 'embedded', customer_email: session.user.email,
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    metadata, subscription_data: { metadata },
    return_url: `${origin}/account?checkout=returned`,
  }, { idempotencyKey: `premium:${session.user.id}:${Math.floor(Date.now() / 300000)}` })
  return { clientSecret: checkout.client_secret, sessionId: checkout.id }
}
