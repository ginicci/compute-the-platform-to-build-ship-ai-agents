import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mockAiEnabled, mockAudio, mockTranslations, MOCK_REPLY, MOCK_TRANSCRIPT } from '../lib/ai-mock.ts'
test('mock execution needs both flags and cannot run in production', () => {
  const env = { BILLING_TEST_MODE: 'true', AI_EXECUTION_MODE: 'mock' }
  assert.ok(mockAiEnabled(env))
  assert.equal(mockAiEnabled({ ...env, VERCEL_ENV: 'production' }), false)
  assert.equal(mockAiEnabled({ AI_EXECUTION_MODE: 'mock' }), false)
})
test('offline fixtures include text, translation, transcription and valid audio', () => {
  assert.ok(MOCK_REPLY.includes('TEST FIXTURE'))
  assert.ok(MOCK_TRANSCRIPT.includes('no AI provider'))
  assert.deepEqual(mockTranslations(['Hello']), ['[TEST] Hello'])
  const audio = mockAudio()
  assert.equal(new TextDecoder().decode(audio.slice(0, 4)), 'RIFF')
  assert.equal(new TextDecoder().decode(audio.slice(8, 12)), 'WAVE')
  assert.equal(new DataView(audio.buffer).getUint32(4, true), audio.length - 8)
})
