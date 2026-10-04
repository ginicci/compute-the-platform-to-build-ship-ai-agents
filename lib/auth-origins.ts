type Environment = Record<string, string | undefined>

// Trust exact origins only. Never derive trust from incoming Host/Origin headers.
export function normalizeOrigin(value: string | undefined, allowHttp = false) {
  if (!value?.trim()) return undefined
  try {
    const url = new URL(value.trim())
    if (url.username || url.password) return undefined
    if (url.protocol !== 'https:' && !(allowHttp && url.protocol === 'http:')) return undefined
    return url.origin
  } catch {
    return undefined
  }
}

export function authOrigins(env: Environment) {
  const development = env.NODE_ENV === 'development'
  const configured = normalizeOrigin(env.BETTER_AUTH_URL, development)
  if (env.BETTER_AUTH_URL?.trim() && !configured) {
    throw new Error('BETTER_AUTH_URL must be a valid HTTPS URL (HTTP is allowed only in development)')
  }
  const trustedOrigins = [...new Set([
    'https://ginicci.app',
    'https://www.ginicci.app',
    'https://ginicci.com',
    'https://www.ginicci.com',
    'https://compute-the-platform-to-build-ginicci-labs.vercel.app',
    'https://compute-the-platform-to-build-git-main-ginicci-labs.vercel.app',
    'https://compute-the-platform-to-build-flame-three-41.vercel.app',
    'https://compute-the-platform-to-build-git-vercel-ag-d4dfaf-ginicci-labs.vercel.app',
    configured,
    normalizeOrigin(env.V0_RUNTIME_URL),
    normalizeOrigin(env.V0_DEV_APP_URL),
    normalizeOrigin(env.V0_BUILD_URL),
    normalizeOrigin(env.V0_SANDBOX_URL),
    ...['VERCEL_URL', 'VERCEL_BRANCH_URL', 'VERCEL_PROJECT_PRODUCTION_URL'].map(
      (key) => normalizeOrigin(env[key] && `https://${env[key]?.trim()}`),
    ),
    ...(development ? ['http://localhost:3000'] : []),
  ].filter((origin): origin is string => Boolean(origin)))]
  return { baseURL: configured || 'https://ginicci.app', trustedOrigins }
}
