import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

const originValues = [
  process.env.V0_RUNTIME_URL,
  process.env.V0_DEV_APP_URL,
  process.env.V0_BUILD_URL,
  process.env.V0_SANDBOX_URL,
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
].filter((value): value is string => Boolean(value))

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: { enabled: true },
  baseURL: process.env.BETTER_AUTH_URL || originValues[0],
  trustedOrigins: ['http://localhost:3000', ...originValues],
  ...(process.env.NODE_ENV === 'development'
    ? { advanced: { defaultCookieAttributes: { sameSite: 'none' as const, secure: true } } }
    : {}),
})
