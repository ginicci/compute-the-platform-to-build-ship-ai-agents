import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { syncSubscription } from '@/lib/subscriptions'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return new Response('Webhook not configured', { status: 503 })

  const signature = request.headers.get('stripe-signature')
  if (!signature) return new Response('Missing signature', { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret)
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const subscriptionId = event.data.object.subscription
        if (subscriptionId) {
          await syncSubscription(typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
        await syncSubscription(event.data.object.id)
        break
    }
  } catch (error) {
    console.error('Stripe webhook handling failed', event.type, error)
    return new Response('Handler error', { status: 500 })
  }

  return Response.json({ received: true })
}
