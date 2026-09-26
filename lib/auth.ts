import { betterAuth } from 'better-auth'
import { Pool } from 'pg'
import { sendVerificationEmail } from '@/lib/email'
import { notifyOwner } from '@/lib/owner-alerts'

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
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => sendVerificationEmail({ to: user.email, verificationUrl: url }),
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => notifyOwner({
          subject: 'New customer sign-up',
          text: `A new Northstar account was created for ${user.email}.`,
        }),
      },
    },
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
  baseURL: process.env.BETTER_AUTH_URL || originValues[0],
  trustedOrigins: ['http://localhost:3000', ...originValues],
  ...(process.env.NODE_ENV === 'development'
    ? { advanced: { defaultCookieAttributes: { sameSite: 'none' as const, secure: true } } }
    : {}),
})
