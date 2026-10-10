import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sustainableAllowance } from '../lib/ai-plan-economics.ts'
const fixture = { priceCents: 1000, paymentFeeCents: 60, hostingCents: 100, riskReserveCents: 40, marginFraction: 0.5, worstCaseRequestMicroUsd: 50000 }
test('illustrative costs produce bounded allowances, never unlimited', () => {
  assert.deepEqual(sustainableAllowance(fixture), { costCapMicroUsd: 3000000, maxRequests: 60 })
  assert.deepEqual(sustainableAllowance({ ...fixture, hostingCents: 900 }), { costCapMicroUsd: 0, maxRequests: 0 })
})
test('economics refuses missing cost evidence or invalid margins', () => {
  for (const update of [{ worstCaseRequestMicroUsd: 0 }, { marginFraction: 1 }, { marginFraction: NaN }, { hostingCents: -1 }]) assert.throws(() => sustainableAllowance({ ...fixture, ...update }))
})
