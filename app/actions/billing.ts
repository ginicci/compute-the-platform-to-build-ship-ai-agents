'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getUserSession } from '@/lib/session'
import { siteUrl } from '@/lib/site'
import { stripe } from '@/lib/stripe'
import { getLatestSubscription, syncSubscription } from '@/lib/subscriptions'

async function requireUserId() {
  const session = await getUserSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

// Records the plan right after checkout so it doesn't depend on webhook timing.
export async function confirmCheckout(sessionId: string) {
  const userId = await requireUserId()
  if (typeof sessionId !== 'string' || !/^cs_[A-Za-z0-9_]{10,250}$/.test(sessionId)) {
    throw new Error('Invalid checkout session')
  }

  const checkout = await stripe.checkout.sessions.retrieve(sessionId)
  if (checkout.metadata?.userId !== userId) throw new Error('Unauthorized')
  if (!checkout.subscription) return { ok: false }

  const subscriptionId =
    typeof checkout.subscription === 'string' ? checkout.subscription : checkout.subscription.id
  await syncSubscription(subscriptionId)
  revalidatePath('/account')
  return { ok: true }
}

export async function openBillingPortal() {
  const userId = await requireUserId()
  const current = await getLatestSubscription(userId)
  if (!current) return { error: 'No subscription found.' }

  // Next.js already rejects Server Action calls whose Origin doesn't match the host.
  const origin = (await headers()).get('origin') ?? siteUrl

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: current.stripeCustomerId,
      return_url: `${origin}/account`,
    })
    return { url: portal.url }
  } catch (error) {
    console.error('Billing portal failed', error)
    return { error: 'Billing management is not available yet. Please try again later.' }
  }
}
