import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { launchAIEnabled, MAX_OUTPUT_TOKENS, ROUTINE_MODEL, USER_DAILY_CALLS, USER_TRIAL_CALLS, GLOBAL_LIFETIME_CALLS } from '../lib/ai-policy.ts'
import { validateChatMessages } from '../lib/chat-input.ts'
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
test('launch flag defaults closed and only accepts explicit verification', () => {
  for (const value of [undefined, '', 'false', '1', 'TRUE']) assert.equal(launchAIEnabled({ AI_LAUNCH_CONTROLS_VERIFIED: value }), false)
  assert.equal(launchAIEnabled({ AI_LAUNCH_CONTROLS_VERIFIED: 'true' }), true)
})
test('text trial has small fixed allowances and bounded cheap model', () => {
  assert.equal(MAX_OUTPUT_TOKENS, 256)
  assert.equal(ROUTINE_MODEL, 'google/gemini-2.5-flash-lite')
  assert.equal(USER_DAILY_CALLS, 3); assert.equal(USER_TRIAL_CALLS, 5); assert.equal(GLOBAL_LIFETIME_CALLS, 100)
  assert.equal(validateChatMessages([{ id: 'x', role: 'user', parts: [{ type: 'text', text: 'x'.repeat(4001) }] }]), null)
})
test('only chat can invoke a provider, with gate and quota before generation', () => {
  const chat = read('app/api/chat/route.ts')
  assert.ok(chat.indexOf('if (!session?.user)') < chat.indexOf('streamText({'))
  assert.ok(chat.indexOf('if (!launchAIEnabled())') < chat.indexOf('streamText({'))
  assert.ok(chat.indexOf('await reserveTrialCall') < chat.indexOf('streamText({'))
  assert.match(chat, /maxRetries: 0/); assert.match(chat, /maxOutputTokens: MAX_OUTPUT_TOKENS/)
  for (const path of ['voice/speak', 'voice/transcribe', 'translate']) {
    const source = read(`app/api/${path}/route.ts`)
    assert.doesNotMatch(source, /from 'ai'|generateText|generateSpeech|transcribe\(/)
  }
})
test('persistent reservation serializes, fails closed, and keeps failed attempts', () => {
  const source = read('lib/ai-quota.ts')
  assert.match(source, /pg_advisory_xact_lock/)
  assert.match(source, /BEGIN/); assert.match(source, /COMMIT/)
  assert.match(source, /usage.recent > 0/)
  assert.match(source, /usage.user_total >= USER_TRIAL_CALLS/)
  assert.doesNotMatch(source, /DELETE FROM|new Map/)
})
test('checkout cannot call Stripe and paid tiers cannot bypass launch caps', () => {
  assert.doesNotMatch(read('app/actions/stripe.ts'), /stripe.checkout|sessions.create/)
  assert.match(read('app/actions/stripe.ts'), /throw new Error/)
  assert.match(read('lib/plan-limits.ts'), /const tier = FREE_TIER/)
  assert.doesNotMatch(read('lib/tiers.ts'), /Unlimited tasks|tasksPerMonth: null/)
})

// Execute TypeScript routes with isolated in-memory dependency doubles. Nothing
// can connect to a provider, Stripe or a database in these tests.
import ts from 'typescript'
function loadMocked(path, mocks) {
  const compiled = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {}
  new Function('require', 'exports', compiled)(name => {
    if (!(name in mocks)) throw new Error('Unexpected external dependency: ' + name)
    return mocks[name]
  }, exports)
  return exports
}
test('mock production chat rejects anonymous and paused users without paid calls', async () => {
  let signedIn = false, providerCalls = 0
  const dependencies = {
    '@/lib/ai-policy': { launchAIEnabled: () => false, aiUnavailable: () => Response.json({ code: 'ai_paused' }, { status: 503 }) },
    '@/lib/ai-quota': { reserveTrialCall: () => { throw new Error('Must not reserve') } },
    'ai': { streamText: () => { providerCalls++; throw new Error('No paid calls') } },
    'next/server': {}, '@/lib/chat-error': {}, '@/lib/agents': {}, '@/lib/chat-input': {},
    '@/lib/legal': {}, '@/lib/owner': {}, '@/lib/plan-limits': {},
    '@/lib/session': { getUserSession: async () => signedIn ? { user: { id: 'mock' } } : null },
  }
  const route = loadMocked('app/api/chat/route.ts', dependencies)
  assert.equal((await route.POST(new Request('https://example.com'))).status, 401)
  signedIn = true
  assert.equal((await route.POST(new Request('https://example.com'))).status, 503)
  assert.equal(providerCalls, 0)
})
test('mock durable quota reserves once or denies each exhausted allowance', async () => {
  for (const [usage, allowed] of [
    [{ total: 0, today: 0, user_total: 0, user_today: 0, recent: 0 }, true],
    [{ total: 100 }, false], [{ today: 20 }, false], [{ user_total: 5 }, false],
    [{ user_today: 3 }, false], [{ recent: 1 }, false],
  ]) {
    const statements = []
    const client = { query: async sql => { statements.push(sql); return { rows: [{ total: 0, today: 0, user_total: 0, user_today: 0, recent: 0, ...usage }] } }, release() {} }
    const quota = loadMocked('lib/ai-quota.ts', {
      'server-only': {}, '@/lib/db': { pool: { connect: async () => client } },
      '@/lib/ai-policy': { launchAIEnabled: () => true, USER_DAILY_CALLS: 3, USER_TRIAL_CALLS: 5, GLOBAL_DAILY_CALLS: 20, GLOBAL_LIFETIME_CALLS: 100 },
    })
    assert.equal(await quota.reserveTrialCall('mock'), allowed)
    assert.equal(statements.some(s => s.startsWith('INSERT')), allowed)
    assert.equal(statements.at(-1), allowed ? 'COMMIT' : 'ROLLBACK')
  }
})
test('preview cannot enable paid AI even with inherited true flag', () => {
 assert.equal(launchAIEnabled({VERCEL_ENV:'preview',AI_LAUNCH_CONTROLS_VERIFIED:'true'}),false)
})
test('database connection failure denies usage instead of escaping quota guard',async()=>{
 const quota=loadMocked('lib/ai-quota.ts',{'server-only':{},'@/lib/db':{pool:{connect:async()=>{throw Error('offline')}}},'@/lib/ai-policy':{launchAIEnabled:()=>true}})
 assert.equal(await quota.reserveTrialCall('test'),false)
})
