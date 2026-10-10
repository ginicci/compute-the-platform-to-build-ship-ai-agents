// Fixed launch policy: no owner, paid-plan, or client-supplied bypass.
export const ROUTINE_MODEL = 'google/gemini-2.5-flash-lite'
export const MAX_OUTPUT_TOKENS = 256
export const USER_DAILY_CALLS = 3
export const USER_TRIAL_CALLS = 5
export const GLOBAL_DAILY_CALLS = 20
export const GLOBAL_LIFETIME_CALLS = 100
export function launchAIEnabled(env: Record<string, string | undefined> = process.env) {
  return env.VERCEL_ENV !== 'preview' && env.AI_LAUNCH_CONTROLS_VERIFIED === 'true'
}
export function aiUnavailable() {
  return Response.json({ error: 'AI trial is paused while spending controls are verified. Browsing is free.', code: 'ai_paused' }, { status: 503 })
}
