export function reconcileAiCost(input: { reservedMicroUsd: number; actualMicroUsd: number | null; mock: boolean; environment: 'test' | 'live' }) {
  if (!Number.isSafeInteger(input.reservedMicroUsd) || input.reservedMicroUsd <= 0) throw new Error('Invalid reservation')
  if (input.mock && input.environment === 'live') throw new Error('Mock usage cannot enter live cost ledger')
  if (input.actualMicroUsd === null) return { releaseMicroUsd: 0, additionalDebitMicroUsd: 0, freeze: true, reconciled: false }
  if (!Number.isSafeInteger(input.actualMicroUsd) || input.actualMicroUsd < 0) throw new Error('Invalid actual cost')
  if (input.mock && input.actualMicroUsd !== 0) throw new Error('Mock usage must have zero provider cost')
  return {
    releaseMicroUsd: Math.max(0, input.reservedMicroUsd - input.actualMicroUsd),
    additionalDebitMicroUsd: Math.max(0, input.actualMicroUsd - input.reservedMicroUsd),
    freeze: input.actualMicroUsd > input.reservedMicroUsd,
    reconciled: true,
  }
}
