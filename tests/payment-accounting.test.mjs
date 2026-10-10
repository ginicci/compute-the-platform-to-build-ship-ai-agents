import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spendablePayment, reconcilePayment } from '../lib/payment-accounting.ts'
const payment = { id: 'synthetic-payment', environment: 'test', collectedMicroUsd: 10000000, feeMicroUsd: 600000, refundedMicroUsd: 0, disputedMicroUsd: 0, settled: false, synthetic: true }
test('pending and unpaid transactions never fund access', () => {
  assert.equal(spendablePayment(payment, 'test'), 0)
  assert.equal(spendablePayment({ ...payment, collectedMicroUsd: 0, settled: true }, 'test'), 0)
})
test('settlement credits net fees once and replay is idempotent', () => {
  const first = reconcilePayment(null, { ...payment, settled: true }, 'evt-one')
  assert.equal(first.deltaMicroUsd, 9400000)
  assert.equal(reconcilePayment(first.snapshot, { ...payment, settled: true }, 'evt-one').deltaMicroUsd, 0)
  assert.equal(reconcilePayment(first.snapshot, { ...payment, settled: true }, 'evt-two').deltaMicroUsd, 0)
})
test('refunds and disputes reduce funding; reinstatement restores only authoritative balance', () => {
  const initial = reconcilePayment(null, { ...payment, settled: true }, 'paid')
  const refunded = reconcilePayment(initial.snapshot, { ...payment, settled: true, refundedMicroUsd: 2000000 }, 'refund')
  assert.equal(refunded.deltaMicroUsd, -2000000)
  const disputed = reconcilePayment(refunded.snapshot, { ...payment, settled: true, refundedMicroUsd: 2000000, disputedMicroUsd: 8000000 }, 'dispute')
  assert.equal(disputed.snapshot.spendableMicroUsd, 0)
  assert.equal(disputed.deltaMicroUsd, -7400000)
})
test('test/live and synthetic boundaries fail closed', () => {
  assert.throws(() => spendablePayment(payment, 'live'))
  assert.throws(() => spendablePayment({ ...payment, environment: 'live' }, 'live'))
  assert.throws(() => spendablePayment({ ...payment, feeMicroUsd: NaN }, 'test'))
})
