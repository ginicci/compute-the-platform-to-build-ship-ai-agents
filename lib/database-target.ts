// This preview branch must never touch production data. Provision an isolated
// database explicitly before real login tests; absent one, fail on localhost.
export function databaseTarget(env: Record<string, string | undefined> = process.env) {
  return env.VERCEL_ENV === 'preview'
    ? env.GINICCI_PWA_ISOLATED_DATABASE_URL || 'postgresql://localhost:5432/ginicci_preview_disabled'
    : env.DATABASE_URL
}
