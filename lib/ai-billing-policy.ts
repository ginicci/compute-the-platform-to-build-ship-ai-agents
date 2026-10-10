export type AiFeature = 'chat' | 'speech' | 'transcription' | 'translation'

export function positiveInteger(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null
  const number = Number(value)
  return Number.isSafeInteger(number) ? number : null
}

/** Every limit requires explicit operator configuration. No unlimited fallback. */
export function aiBillingPolicy(env: Record<string, string | undefined>, feature: AiFeature) {
  const reserve = positiveInteger(env[`AI_${feature.toUpperCase()}_RESERVE_MICRO_USD`])
  const tasks = positiveInteger(env.AI_MAX_TASKS_PER_MONTH)
  const perMinute = positiveInteger(env.AI_MAX_REQUESTS_PER_MINUTE)
  if (env.AI_BILLING_ENABLED !== 'true' || !reserve || !tasks || !perMinute) return null
  return { reserve, tasks, perMinute }
}
