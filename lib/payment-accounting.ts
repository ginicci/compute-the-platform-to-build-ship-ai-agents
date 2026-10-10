/** Integer USD micro-units; pure accounting, no provider/network access. */
export type PaymentRecord = {
  id: string
  environment: 'test' | 'live'
  collectedMicroUsd: number
  feeMicroUsd: number
  refundedMicroUsd: number
  disputedMicroUsd: number
  settled: boolean
  synthetic: boolean
}
export function spendablePayment(payment: PaymentRecord, environment: 'test' | 'live') {
  if (payment.environment !== environment) throw new Error('Payment environment mismatch')
  for (const value of [payment.collectedMicroUsd, payment.feeMicroUsd, payment.refundedMicroUsd, payment.disputedMicroUsd]) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid monetary amount')
  }
  if (payment.synthetic && environment === 'live') throw new Error('Synthetic funds forbidden in live accounting')
  if (!payment.settled) return 0
  return Math.max(0, payment.collectedMicroUsd - payment.feeMicroUsd - payment.refundedMicroUsd - payment.disputedMicroUsd)
}
export type PaymentSnapshot = { payment: PaymentRecord; spendableMicroUsd: number; eventIds: string[] }
/** Full authoritative snapshots, not additive credits: replay cannot mint funds. */
export function reconcilePayment(previous: PaymentSnapshot | null, payment: PaymentRecord, eventId: string) {
  if (!eventId) throw new Error('Event ID required')
  if (previous && previous.payment.id !== payment.id) throw new Error('Payment identity mismatch')
  if (previous?.eventIds.includes(eventId)) return { snapshot: previous, deltaMicroUsd: 0 }
  const amount = spendablePayment(payment, payment.environment)
  if (previous && previous.payment.environment !== payment.environment) throw new Error('Payment environment mismatch')
  return {
    snapshot: { payment, spendableMicroUsd: amount, eventIds: [...(previous?.eventIds ?? []), eventId] },
    deltaMicroUsd: amount - (previous?.spendableMicroUsd ?? 0),
  }
}
