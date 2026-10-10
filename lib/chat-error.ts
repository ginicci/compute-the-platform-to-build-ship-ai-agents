/** Only send safe, actionable messages to clients, never provider payloads or prompts. */
export function chatStreamError(error: unknown): string {
  const seen = new Set<unknown>()
  let current = error
  for (let depth = 0; depth < 8; depth++) {
    if (!current || typeof current !== 'object' || seen.has(current)) break
    seen.add(current)
    const value = current as { statusCode?: unknown; message?: unknown; cause?: unknown }
    // A budget quota is also 402; do not mislabel it as depleted gateway credits.
    if (value.statusCode === 402 && typeof value.message === 'string' &&
        (value.message.includes('positive credit balance') || value.message.includes('insufficient_funds'))) {
      return JSON.stringify({ code: 'service_funding_required', error: 'AI service funding is unavailable. The site operator must restore AI credits.' })
    }
    current = value.cause
  }
  return 'The reply could not be completed. Please retry.'
}
