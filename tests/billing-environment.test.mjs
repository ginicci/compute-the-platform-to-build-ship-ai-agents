import assert from 'node:assert/strict'
import { test } from 'node:test'
import { billingEnvironment } from '../lib/billing-environment.ts'
test('sandbox events require test credentials and nonproduction environment', () => {
  assert.equal(billingEnvironment({ BILLING_TEST_MODE: 'true', STRIPE_SECRET_KEY: 'sk_test_fixture' }), 'test')
  assert.throws(() => billingEnvironment({ BILLING_TEST_MODE: 'true', STRIPE_SECRET_KEY: 'sk_live_fixture' }))
  assert.throws(() => billingEnvironment({ BILLING_TEST_MODE: 'true', STRIPE_SECRET_KEY: 'sk_test_fixture', VERCEL_ENV: 'production' }))
})
test('live intake cannot be enabled implicitly', () => {
  assert.throws(() => billingEnvironment({ STRIPE_SECRET_KEY: 'sk_live_fixture' }))
  assert.throws(() => billingEnvironment({ BILLING_LIVE_ENABLED: 'true', STRIPE_SECRET_KEY: 'sk_test_fixture' }))
})
