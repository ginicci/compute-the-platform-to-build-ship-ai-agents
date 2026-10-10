'use server'
import type { BillingInterval } from '@/lib/tiers'
// Closed unconditionally until settlement, replay, refund and metering tests pass.
// Existing customers can still manage/cancel via the separate billing portal.
export async function startSubscriptionCheckout(
  _tierId: string, _interval: BillingInterval, _acceptedTerms: boolean,
): Promise<{ clientSecret: string | null; sessionId: string }> {
  throw new Error('Checkout is paused until isolated settlement, refund and usage tests pass.')
}
