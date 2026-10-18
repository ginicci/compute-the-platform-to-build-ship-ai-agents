import 'server-only'
import { pool } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { getLatestSubscription } from '@/lib/subscriptions'
import { paidStatusEligible } from '@/lib/premium-policy'
import type { PaidAccess } from '@/lib/premium-usage'

// Production activation is intentionally not supported by this development PR.
export function requireTestBilling() {
  if (process.env.PREMIUM_BILLING_TEST_ENABLED !== 'true' || !process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
    throw new Error('Premium billing requires explicitly enabled Stripe test credentials')
  }
}
export async function configuredPlans() {
  const { rows } = await pool.query<{ tier_id: string; interval: 'monthly' | 'annual'; stripe_price_id: string; tasks_per_period: number }>(
    'SELECT * FROM premium_plans WHERE enabled = true ORDER BY tier_id, interval')
  return rows
}
export async function premiumPaidAccess(userId: string): Promise<PaidAccess> {
  if (process.env.PREMIUM_BILLING_TEST_ENABLED !== 'true') return null
  requireTestBilling()
  const local = await getLatestSubscription(userId)
  if (!local) return null
  // Stripe is authoritative on EVERY premium request. DB/webhook/client status alone never grants access.
  const sub = await stripe.subscriptions.retrieve(local.id)
  const item = sub.items.data[0]
  if (sub.livemode || sub.metadata.userId !== userId || !item || !paidStatusEligible(sub.status, item.current_period_end)) return null
  const plan = (await configuredPlans()).find(p => p.stripe_price_id === item.price.id && p.tier_id === sub.metadata.tierId && p.interval === sub.metadata.interval)
  if (!plan || !sub.latest_invoice) return null
  const invoiceId = typeof sub.latest_invoice === 'string' ? sub.latest_invoice : sub.latest_invoice.id
  const invoice = await stripe.invoices.retrieve(invoiceId)
  if (invoice.status !== 'paid' || invoice.amount_paid <= 0 || invoice.livemode) return null
  const payments = await stripe.invoicePayments.list({ invoice: invoice.id, status: 'paid', limit: 100 })
  // Fail closed for unpaid, refunded, disputed, credit-only or unrecognized payment methods.
  let settled = 0
  for (const payment of payments.data) {
    const ref = payment.payment.payment_intent
    if (!ref) return null
    const intent = await stripe.paymentIntents.retrieve(typeof ref === 'string' ? ref : ref.id)
    if (intent.status !== 'succeeded' || !intent.latest_charge) return null
    const charge = await stripe.charges.retrieve(typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge.id)
    if (!charge.paid || charge.refunded || charge.amount_refunded > 0 || charge.disputed) return null
    settled += payment.amount_paid ?? 0
  }
  if (payments.has_more || settled < invoice.amount_paid) return null
  return { period: `${sub.id}:${item.current_period_start}`, limit: plan.tasks_per_period }
}
export async function pricedPlans() {
  requireTestBilling()
  return Promise.all((await configuredPlans()).map(async p => {
    const price = await stripe.prices.retrieve(p.stripe_price_id)
    const expected = p.interval === 'annual' ? 'year' : 'month'
    if (price.livemode || !price.active || !price.unit_amount || price.recurring?.interval !== expected || price.recurring.interval_count !== 1) throw new Error('Invalid configured recurring test price')
    return { ...p, amount: price.unit_amount, currency: price.currency }
  }))
}
