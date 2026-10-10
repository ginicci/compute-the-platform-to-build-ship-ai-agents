import assert from 'node:assert/strict'
import { test } from 'node:test'
import { reconcileAiCost } from '../lib/ai-cost-accounting.ts'
const usage = { reservedMicroUsd: 100, actualMicroUsd: 60, mock: false, environment: 'test' }
test('known costs release only unused reserve', () => {
  assert.deepEqual(reconcileAiCost(usage), { releaseMicroUsd: 40, additionalDebitMicroUsd: 0, freeze: false, reconciled: true })
})
test('unknown or overrun costs freeze execution instead of inventing refunds', () => {
  assert.deepEqual(reconcileAiCost({ ...usage, actualMicroUsd: null }), { releaseMicroUsd: 0, additionalDebitMicroUsd: 0, freeze: true, reconciled: false })
  assert.deepEqual(reconcileAiCost({ ...usage, actualMicroUsd: 150 }), { releaseMicroUsd: 0, additionalDebitMicroUsd: 50, freeze: true, reconciled: true })
})
test('mock costs cannot masquerade as live provider usage', () => {
  assert.throws(() => reconcileAiCost({ ...usage, mock: true }))
  assert.throws(() => reconcileAiCost({ ...usage, mock: true, actualMicroUsd: 0, environment: 'live' }))
})
