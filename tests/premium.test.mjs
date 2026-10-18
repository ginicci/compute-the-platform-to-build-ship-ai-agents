import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { loadModule } from './helpers/load-module.mjs'
import { premiumEnabled, paidStatusEligible } from '../lib/premium-policy.ts'
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8')

test('premium flag defaults closed; preview requires an explicit isolated database', () => {
  assert.equal(premiumEnabled({}), false)
  assert.equal(premiumEnabled({ PREMIUM_TRIAL_ENABLED: 'true' }), false)
  assert.equal(premiumEnabled({ PREMIUM_TRIAL_ENABLED: 'true', PREMIUM_AI_MODEL: 'configured/model' }), true)
  assert.equal(premiumEnabled({ PREMIUM_TRIAL_ENABLED: 'true', PREMIUM_AI_MODEL: 'configured/model', VERCEL_ENV: 'preview' }), false)
  assert.equal(premiumEnabled({ PREMIUM_TRIAL_ENABLED: 'true', PREMIUM_AI_MODEL: 'configured/model', VERCEL_ENV: 'preview', GINICCI_PWA_ISOLATED_DATABASE_URL: 'isolated' }), true)
})
test('only active, unexpired subscription status is eligible for further payment verification', () => {
  assert.equal(paidStatusEligible('active', 200, 100000), true)
  for (const status of ['past_due', 'trialing', 'canceled', 'unpaid', 'incomplete', 'paused']) assert.equal(paidStatusEligible(status, 200, 100000), false)
  assert.equal(paidStatusEligible('active', 99, 100000), false)
})
test('Stripe test subscription requires paid invoice and unrefunded, undisputed settled payment', async () => {
  const previous = { flag: process.env.PREMIUM_BILLING_TEST_ENABLED, key: process.env.STRIPE_SECRET_KEY }
  process.env.PREMIUM_BILLING_TEST_ENABLED = 'true'; process.env.STRIPE_SECRET_KEY = 'sk_test_' + randomBytes(16).toString('hex')
  const sub = { id: 'sub_test', livemode: false, status: 'active', metadata: { userId: 'account', tierId: 'plus', interval: 'monthly' }, latest_invoice: 'in_test', items: { data: [{ price: { id: 'price_test' }, current_period_end: Math.floor(Date.now() / 1000) + 3600, current_period_start: 1 }] } }
  const invoice = { id: 'in_test', status: 'paid', amount_paid: 2000, livemode: false }
  const charge = { paid: true, refunded: false, amount_refunded: 0, disputed: false }
  const intent = { status: 'succeeded', latest_charge: 'ch_test' }
  const payments = { has_more: false, data: [{ payment: { payment_intent: 'pi_test' }, amount_paid: 2000 }] }
  const billing = loadModule('lib/premium-billing.ts', {
    'server-only': {}, '@/lib/db': { pool: { query: async () => ({ rows: [{ tier_id: 'plus', interval: 'monthly', stripe_price_id: 'price_test', tasks_per_period: 100 }] }) } },
    '@/lib/stripe': { stripe: { subscriptions: { retrieve: async () => sub }, invoices: { retrieve: async () => invoice }, invoicePayments: { list: async () => payments }, paymentIntents: { retrieve: async () => intent }, charges: { retrieve: async () => charge } } },
    '@/lib/subscriptions': { getLatestSubscription: async () => ({ id: 'sub_test', status: 'active' }) },
    '@/lib/premium-policy': { paidStatusEligible },
  })
  try {
    assert.deepEqual(await billing.premiumPaidAccess('account'), { period: 'sub_test:1', limit: 100 })
    for (const status of ['past_due', 'unpaid', 'canceled', 'trialing', 'paused', 'incomplete']) { sub.status = status; assert.equal(await billing.premiumPaidAccess('account'), null) }
    sub.status = 'active'; sub.items.data[0].current_period_end = 1
    assert.equal(await billing.premiumPaidAccess('account'), null)
    sub.items.data[0].current_period_end = Math.floor(Date.now() / 1000) + 3600
    for (const prop of ['refunded', 'disputed']) { charge[prop] = true; assert.equal(await billing.premiumPaidAccess('account'), null); charge[prop] = false }
    charge.amount_refunded = 1; assert.equal(await billing.premiumPaidAccess('account'), null); charge.amount_refunded = 0
    intent.status = 'processing'; assert.equal(await billing.premiumPaidAccess('account'), null); intent.status = 'succeeded'
    invoice.status = 'open'; assert.equal(await billing.premiumPaidAccess('account'), null); invoice.status = 'paid'
    invoice.amount_paid = 0; assert.equal(await billing.premiumPaidAccess('account'), null); invoice.amount_paid = 2000
    sub.livemode = true; assert.equal(await billing.premiumPaidAccess('account'), null); sub.livemode = false
    assert.equal(await billing.premiumPaidAccess('other-account'), null)
    process.env.STRIPE_SECRET_KEY = 'sk_live_' + randomBytes(16).toString('hex')
    assert.throws(() => billing.requireTestBilling())
  } finally {
    for (const [key, value] of [['PREMIUM_BILLING_TEST_ENABLED', previous.flag], ['STRIPE_SECRET_KEY', previous.key]]) { if (value === undefined) delete process.env[key]; else process.env[key] = value }
  }
})

function chatHarness({ response = { text: 'Genuine premium output', finishReason: 'stop' }, replay = null, failure = false, reserveError = null } = {}) {
  let generated = 0, completed = 0, failed = 0, config
  const chunks = []
  class PremiumError extends Error {}
  const chat = loadModule('lib/premium-chat.ts', {
    'server-only': {},
    ai: { convertToModelMessages: async m => m, generateText: async c => { generated++; config = c; if (failure) throw new Error('provider offline'); return response }, createUIMessageStream: o => { o.execute({ writer: { write: c => chunks.push(c) } }); return {} }, createUIMessageStreamResponse: () => new Response('delivered') },
    '@/lib/agents': { getAgent: () => ({ id: 'northstar' }), systemPromptFor: () => 'shared premium prompt' },
    '@/lib/chat-input': { readChatBody: async () => ({ messages: [{ id: 'stable-request', role: 'user', parts: [{ type: 'text', text: 'hi' }] }] }), validateChatMessages: m => m, ChatInputError: class extends Error {} },
    '@/lib/legal': { hasCurrentConsent: async () => true }, '@/lib/premium-billing': { premiumPaidAccess: async () => null },
    '@/lib/premium-usage': { PremiumError, reservePremium: async () => { if (reserveError) throw reserveError; return { id: 'reservation', result: replay } }, completePremium: async () => { completed++ }, failPremium: async () => { failed++ } },
  })
  return { chat, stats: () => ({ generated, completed, failed, config, chunks }) }
}
const request = () => new Request('https://example.com/api/chat', { method: 'POST', headers: { origin: 'https://example.com' } })
test('premium route generates full output once, saves recoverable result, and streams its stable ID', async () => {
  const h = chatHarness(); assert.equal((await h.chat.premiumChat(request(), 'user')).status, 200)
  const s = h.stats(); assert.equal(s.generated, 1); assert.equal(s.completed, 1); assert.equal(s.failed, 0)
  assert.equal(s.config.maxOutputTokens, 4096); assert.equal(s.config.maxRetries, 0)
  assert.deepEqual(s.chunks[0], { type: 'start', messageId: 'reservation' })
  assert.equal(s.chunks.find(c => c.type === 'text-delta').delta, 'Genuine premium output')
})
test('failed, empty, truncated and filtered provider results do not become chargeable', async () => {
  for (const options of [{ failure: true }, { response: { text: '', finishReason: 'stop' } }, { response: { text: 'partial', finishReason: 'length' } }, { response: { text: 'blocked', finishReason: 'content-filter' } }]) {
    const h = chatHarness(options); assert.equal((await h.chat.premiumChat(request(), 'user')).status, 503)
    assert.equal(h.stats().completed, 0); assert.equal(h.stats().failed, 1)
  }
})
test('recoverable result replay never invokes provider or reserves a second charge', async () => {
  const h = chatHarness({ replay: 'Original full result' }); assert.equal((await h.chat.premiumChat(request(), 'user')).status, 200)
  assert.equal(h.stats().generated, 0); assert.equal(h.stats().completed, 0)
})
test('cross-origin premium generation is rejected before provider or reservation', async () => {
  const h = chatHarness(); assert.equal((await h.chat.premiumChat(new Request('https://example.com/api/chat', { headers: { origin: 'https://evil.example' } }), 'user')).status, 403)
  assert.equal(h.stats().generated, 0)
})
test('shared status/results endpoints reject anonymous requests before DB access', async () => {
  for (const path of ['status', 'results']) {
    const route = loadModule(`app/api/premium/${path}/route.ts`, { '@/lib/premium-policy': { premiumEnabled: () => true }, '@/lib/session': { getUserSession: async () => null }, '@/lib/db': {}, '@/lib/premium-usage': {}, '@/lib/premium-billing': {} })
    assert.equal((await route.GET()).status, 401)
  }
})
test('both frontends use same server balance, delivery acknowledgement and recovery component', () => {
  for (const path of ['components/onboarding/onboarding-agent.tsx', 'components/pwa/assistant.tsx']) {
    const source = read(path); assert.match(source, /PremiumAccessBanner/); assert.match(source, /acknowledgePremiumResult\(message.id\)/)
    assert.match(source, /isAbort/); assert.match(source, /api: '\/api\/chat'/)
  }
  assert.match(read('components/premium/access-banner.tsx'), /\/api\/premium\/status/)
  assert.match(read('components/premium/access-banner.tsx'), /\/api\/premium\/results/)
  assert.match(read('app/api/premium/results/route.ts'), /user_id = \$1/)
})

test('webhook verifies real Stripe signatures, rejects tampering and live events in test mode, and accepts replays safely', async () => {
  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe('sk_test_' + randomBytes(16).toString('hex'))
  const secret = randomBytes(32).toString('hex')
  const old = { secret: process.env.STRIPE_WEBHOOK_SECRET, flag: process.env.PREMIUM_BILLING_TEST_ENABLED }
  process.env.STRIPE_WEBHOOK_SECRET = secret; process.env.PREMIUM_BILLING_TEST_ENABLED = 'true'
  const synced = []
  const route = loadModule('app/api/stripe/webhook/route.ts', {
    '@/lib/stripe': { stripe }, '@/lib/subscriptions': { syncSubscription: async id => { synced.push(id) } }, '@/lib/premium-billing': { requireTestBilling() {} },
  })
  function signed(event, tamper = false) {
    const payload = JSON.stringify(event)
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret })
    return new Request('https://example.com/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': signature }, body: tamper ? payload + ' ' : payload })
  }
  try {
    const event = { id: 'evt_fixture', type: 'customer.subscription.updated', livemode: false, data: { object: { id: 'sub_fixture' } } }
    assert.equal((await route.POST(signed(event, true))).status, 400)
    assert.equal((await route.POST(signed({ ...event, livemode: true }))).status, 400)
    assert.equal(synced.length, 0)
    assert.equal((await route.POST(signed(event))).status, 200)
    assert.equal((await route.POST(signed(event))).status, 200)
    assert.deepEqual(synced, ['sub_fixture', 'sub_fixture'])
    const invoice = { id: 'evt_invoice', type: 'invoice.payment_failed', livemode: false, data: { object: { parent: { subscription_details: { subscription: 'sub_fixture' } } } } }
    assert.equal((await route.POST(signed(invoice))).status, 200)
    assert.equal(synced.length, 3)
    // No webhook issues trial credits; it only re-syncs authoritative subscription state.
  } finally {
    for (const [key, value] of [['STRIPE_WEBHOOK_SECRET', old.secret], ['PREMIUM_BILLING_TEST_ENABLED', old.flag]]) { if (value === undefined) delete process.env[key]; else process.env[key] = value }
  }
})
test('checkout uses server-configured recurring price and authenticated metadata; consent and configuration are mandatory', async () => {
  let signedIn = true, configured = true, created = 0, received
  const action = loadModule('app/actions/stripe.ts', {
    'next/headers': { headers: async () => new Headers({ origin: 'https://preview.example.com' }) },
    '@/lib/subscriptions': { getLatestSubscription: async () => null },
    '@/lib/tiers': { getTier: id => id === 'plus' ? { id } : null },
    '@/lib/session': { getUserSession: async () => signedIn ? { user: { id: 'account', email: 'test@example.com' } } : null },
    '@/lib/premium-billing': { requireTestBilling() {}, pricedPlans: async () => configured ? [{ tier_id: 'plus', interval: 'monthly', stripe_price_id: 'price_configured' }] : [] },
    '@/lib/stripe': { stripe: { checkout: { sessions: { create: async values => { created++; received = values; return { id: 'cs_fixture', client_secret: null } } } } } },
    '@/lib/legal': { recordConsent: async () => {} }, '@/lib/site': { siteUrl: 'https://example.com' },
  })
  await assert.rejects(action.startSubscriptionCheckout('plus', 'monthly', false))
  signedIn = false; await assert.rejects(action.startSubscriptionCheckout('plus', 'monthly', true))
  signedIn = true; configured = false; await assert.rejects(action.startSubscriptionCheckout('plus', 'monthly', true))
  assert.equal(created, 0)
  configured = true; await action.startSubscriptionCheckout('plus', 'monthly', true)
  assert.equal(created, 1); assert.deepEqual(received.line_items, [{ price: 'price_configured', quantity: 1 }])
  assert.equal(received.metadata.userId, 'account'); assert.equal(received.subscription_data.metadata.userId, 'account')
  assert.equal(received.subscription_data.trial_period_days, undefined)
  assert.equal(received.return_url, 'https://preview.example.com/account?checkout=returned')
})

test('actual AI SDK UI-message stream reconstructs complete response and server message ID', async () => {
  const ai = await import('ai')
  const stream = ai.createUIMessageStream({ execute: ({ writer }) => {
    writer.write({ type: 'start', messageId: 'server-result-uuid' })
    writer.write({ type: 'text-start', id: 'answer' })
    writer.write({ type: 'text-delta', id: 'answer', delta: 'Complete premium result' })
    writer.write({ type: 'text-end', id: 'answer' })
    writer.write({ type: 'finish', finishReason: 'stop' })
  } })
  const response = ai.createUIMessageStreamResponse({ stream })
  const payload = await response.text()
  const chunks = payload.split('\n').filter(line => line.startsWith('data: ') && !line.includes('[DONE]')).map(line => JSON.parse(line.slice(6)))
  const decoded = new ReadableStream({ start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close() } })
  let last
  for await (const message of ai.readUIMessageStream({ stream: decoded })) last = message
  assert.equal(last.id, 'server-result-uuid'); assert.equal(last.parts[0].text, 'Complete premium result')
})
test('delivery acknowledgement rejects anonymous, cross-origin and invalid identifiers', async () => {
  let signedIn = false, acknowledged = 0
  const route = loadModule('app/api/premium/acknowledge/route.ts', {
    '@/lib/session': { getUserSession: async () => signedIn ? { user: { id: 'account' } } : null },
    '@/lib/chat-input': { readChatBody: async r => r.json(), ChatInputError: class extends Error {} },
    '@/lib/premium-usage': { acknowledgePremium: async (_id, user) => { assert.equal(user, 'account'); acknowledged++; return true } },
  })
  const req = (origin, id) => new Request('https://example.com/api/premium/acknowledge', { method: 'POST', headers: { origin }, body: JSON.stringify({ id }) })
  assert.equal((await route.POST(req('https://example.com', 'invalid'))).status, 401)
  signedIn = true
  assert.equal((await route.POST(req('https://evil.example', 'invalid'))).status, 403)
  assert.equal((await route.POST(req('https://example.com', 'invalid'))).status, 400)
  assert.equal(acknowledged, 0)
  assert.equal((await route.POST(req('https://example.com', '00000000-0000-0000-0000-000000000001'))).status, 200)
  assert.equal(acknowledged, 1)
})
