import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { realAiAllowed, assertRealAiAllowed } from '../lib/ai-execution-policy.ts'

test('mock and billing test modes cannot invoke real providers even when funded', () => {
  for (const env of [{}, { AI_EXECUTION_MODE: 'mock', AI_BILLING_ENABLED: 'true' }, { AI_EXECUTION_MODE: 'live', AI_BILLING_ENABLED: 'true', BILLING_TEST_MODE: 'true' }]) {
    assert.equal(realAiAllowed(env), false)
    assert.throws(() => assertRealAiAllowed(env))
  }
  assert.equal(realAiAllowed({ AI_EXECUTION_MODE: 'live', AI_BILLING_ENABLED: 'true' }), true)
})
test('every provider invocation is immediately guarded independently of billing', () => {
  for (const [path, call] of [['chat', 'streamText'], ['translate', 'generateText'], ['voice/speak', 'generateSpeech'], ['voice/transcribe', 'transcribe']]) {
    const source = readFileSync(new URL(`../app/api/${path}/route.ts`, import.meta.url), 'utf8')
    assert.match(source, new RegExp(`assertRealAiAllowed\\(process.env\\)\\s+const .* = (?:await )?${call}\\(`))
  }
})
