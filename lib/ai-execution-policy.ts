/** No inferred production fallback. Test mode cannot invoke a real provider. */
export function realAiAllowed(env: Record<string, string | undefined>): boolean {
  return env.AI_EXECUTION_MODE === 'live' && env.AI_BILLING_ENABLED === 'true' &&
    env.BILLING_TEST_MODE !== 'true'
}

export function assertRealAiAllowed(env: Record<string, string | undefined>) {
  if (!realAiAllowed(env)) {
    throw new Error('Real AI execution disabled. Test mocks must not delegate to a provider.')
  }
}
