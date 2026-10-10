export function billingEnvironment(env: Record<string, string | undefined>): 'test' | 'live' {
  if (env.BILLING_TEST_MODE === 'true') {
    if (env.VERCEL_ENV === 'production') throw new Error('Billing test mode forbidden in production')
    if (!env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) throw new Error('Stripe sandbox secret required')
    return 'test'
  }
  if (env.BILLING_LIVE_ENABLED !== 'true') throw new Error('Live billing is disabled')
  if (!env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) throw new Error('Live credential mismatch')
  return 'live'
}
