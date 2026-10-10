import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { aiBillingPolicy, positiveInteger } from '../lib/ai-billing-policy.ts'

test('AI billing fails closed without explicit finite configuration', () => {
  for (const feature of ['chat', 'speech', 'transcription', 'translation']) {
    assert.equal(aiBillingPolicy({}, feature), null)
    const env = { AI_BILLING_ENABLED: 'true', AI_MAX_TASKS_PER_MONTH: '100', AI_MAX_REQUESTS_PER_MINUTE: '5', [`AI_${feature.toUpperCase()}_RESERVE_MICRO_USD`]: '50000' }
    assert.deepEqual(aiBillingPolicy(env, feature), { reserve: 50000, tasks: 100, perMinute: 5 })
    assert.equal(aiBillingPolicy({ ...env, AI_BILLING_ENABLED: 'false' }, feature), null)
    assert.equal(aiBillingPolicy({ ...env, AI_MAX_TASKS_PER_MONTH: '0' }, feature), null)
  }
})
test('invalid or unlimited budgets cannot bypass configuration', () => {
  for (const value of [undefined, '', '0', '-1', 'NaN', 'Infinity', '1.5', '1e9', '9007199254740992']) assert.equal(positiveInteger(value), null)
})
test('all current AI execution routes use central reservation before invocation', () => {
  for (const [file, gate, invocation] of [
    ['app/api/chat/route.ts', 'await reserveAiRequest(', 'const result = streamText('],
    ['app/api/translate/route.ts', 'await reserveAiRequest(', 'await translateWithAI(missing'],
    ['app/api/voice/speak/route.ts', 'await authorizeVoiceTask(', 'await generateSpeech('],
    ['app/api/voice/transcribe/route.ts', 'await authorizeVoiceTask(', 'await transcribe('],
  ]) {
    const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8')
    assert.ok(source.indexOf(gate) >= 0, file)
    assert.ok(source.indexOf(gate) < source.indexOf(invocation), file)
  }
})
