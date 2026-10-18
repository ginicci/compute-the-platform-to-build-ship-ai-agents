export const PREMIUM_TRIAL_USES = 6
// One shared model and output budget for paid and trial requests, never selected by tier.
export function premiumEnabled(env: Record<string, string | undefined> = process.env) {
  return env.PREMIUM_TRIAL_ENABLED === 'true' && !!env.PREMIUM_AI_MODEL &&
    (env.VERCEL_ENV !== 'preview' || !!env.GINICCI_PWA_ISOLATED_DATABASE_URL)
}
export function paidStatusEligible(status: string, periodEnd: number, now = Date.now()) {
  return status === 'active' && periodEnd * 1000 > now
}
