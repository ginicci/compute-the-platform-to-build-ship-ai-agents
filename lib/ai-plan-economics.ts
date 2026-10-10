/** Planning only: never grants an entitlement or authorizes spending. */
export function sustainableAllowance(input: {
  priceCents: number
  paymentFeeCents: number
  hostingCents: number
  riskReserveCents: number
  marginFraction: number
  worstCaseRequestMicroUsd: number
}) {
  const { priceCents, paymentFeeCents, hostingCents, riskReserveCents, marginFraction, worstCaseRequestMicroUsd } = input
  for (const value of [priceCents, paymentFeeCents, hostingCents, riskReserveCents, worstCaseRequestMicroUsd]) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Costs must be nonnegative safe integers')
  }
  if (!Number.isFinite(marginFraction) || marginFraction < 0 || marginFraction >= 1 || worstCaseRequestMicroUsd === 0) throw new Error('Validated cost and margin required')
  const netCostBudgetCents = Math.max(0, Math.floor(priceCents * (1 - marginFraction) - paymentFeeCents - hostingCents - riskReserveCents))
  const costCapMicroUsd = netCostBudgetCents * 10000
  if (!Number.isSafeInteger(costCapMicroUsd)) throw new Error('Cost overflow')
  return { costCapMicroUsd, maxRequests: Math.floor(costCapMicroUsd / worstCaseRequestMicroUsd) }
}
