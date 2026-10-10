import 'server-only'
import type Stripe from 'stripe'
import { pool } from '@/lib/db'
import { billingEnvironment } from '@/lib/billing-environment'

/** Durable intake only. Never credits funding based on an incoming event. */
export async function enqueueBillingEvent(event: Stripe.Event) {
  const environment = billingEnvironment(process.env)
  if (event.livemode !== (environment === 'live')) throw new Error('Webhook environment mismatch')
  const result = await pool.query(
    `INSERT INTO billing_event_inbox(environment,event_id,event_type)
     VALUES($1,$2,$3) ON CONFLICT(environment,event_id) DO NOTHING RETURNING event_id`,
    [environment, event.id, event.type],
  )
  return { queued: result.rowCount === 1, environment }
}
