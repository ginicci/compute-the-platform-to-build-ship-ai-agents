import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { Pool } from 'pg'
import { isOwnerEmail } from '@/lib/owner'

const originValues = [
  process.env.V0_RUNTIME_URL,
  process.env.V0_DEV_APP_URL,
  process.env.V0_BUILD_URL,
  process.env.V0_SANDBOX_URL,
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
].filter((value): value is string => Boolean(value))

const ownerOnlyPaths = new Set(['/sign-up/email', '/sign-in/email'])

// Deliberately vague so the response never reveals which email is the owner.
const accessDenied = () =>
  new APIError('FORBIDDEN', { message: 'This workspace is private.' })

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 60, max: 3 },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (!ownerOnlyPaths.has(ctx.path)) return
      const email = typeof ctx.body?.email === 'string' ? ctx.body.email : null
      if (!isOwnerEmail(email)) throw accessDenied()
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!isOwnerEmail(user.email)) throw accessDenied()
        },
      },
    },
  },
  baseURL: process.env.BETTER_AUTH_URL || originValues[0],
  trustedOrigins: ['http://localhost:3000', ...originValues],
  ...(process.env.NODE_ENV === 'development'
    ? { advanced: { defaultCookieAttributes: { sameSite: 'none' as const, secure: true } } }
    : {}),
})
