import assert from 'node:assert/strict'
import { test } from 'node:test'
import { authOrigins, normalizeOrigin } from '../lib/auth-origins.ts'

test('canonicalizes configured origins and trusts the explicit auth origin', () => {
  const config = authOrigins({ NODE_ENV: 'production', BETTER_AUTH_URL: ' https://GINICCI.COM/api/auth/ ' })
  assert.equal(config.baseURL, 'https://ginicci.com')
  assert.ok(config.trustedOrigins.includes(config.baseURL))
  assert.ok(!config.trustedOrigins.includes('http://localhost:3000'))
})
test('includes exact deployment and branch URLs without trusting other previews', () => {
  const config = authOrigins({ VERCEL_URL: 'app-123.vercel.app', VERCEL_BRANCH_URL: 'app-git-feature.vercel.app' })
  assert.ok(config.trustedOrigins.includes('https://app-123.vercel.app'))
  assert.ok(config.trustedOrigins.includes('https://app-git-feature.vercel.app'))
  assert.ok(!config.trustedOrigins.includes('https://attacker.vercel.app'))
  assert.ok(!config.trustedOrigins.some(origin => origin.includes('*')))
})
test('rejects insecure or malformed production config', () => {
  for (const value of ['http://ginicci.com', 'garbage', 'https://user:password@ginicci.com']) {
    assert.throws(() => authOrigins({ BETTER_AUTH_URL: value, NODE_ENV: 'production' }))
  }
  assert.equal(normalizeOrigin('javascript:alert(1)'), undefined)
})
test('allows localhost only in development', () => {
  const config = authOrigins({ NODE_ENV: 'development', BETTER_AUTH_URL: 'http://localhost:3000' })
  assert.ok(config.trustedOrigins.includes('http://localhost:3000'))
})

test('trusts the reported project alias explicitly', () => {
  assert.ok(authOrigins({ NODE_ENV: 'production' }).trustedOrigins.includes(
    'https://compute-the-platform-to-build-git-vercel-ag-d4dfaf-ginicci-labs.vercel.app',
  ))
})
