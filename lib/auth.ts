import { betterAuth } from 'better-auth'
import { Pool } from 'pg'
import { logActivity } from '@/lib/legal'
import { sendOwnerAlert } from '@/lib/owner-alerts'
import { sendResetPasswordEmail, sendVerificationEmail } from '@/lib/auth-email'

const originValues = [
  'https://ginicci.app',
  'https://www.ginicci.app',
  'https://ginicci.com',
  'https://www.ginicci.com',
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
    sendResetPassword: sendResetPasswordEmail,
  },
  emailVerification: {
    sendVerificationEmail,
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
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
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Operational alerts are non-critical. Their provider configuration
          // must never change the outcome of an account-creation transaction.
          void sendOwnerAlert('New sign-up', [`Email: ${user.email}`, `Name: ${user.name || '(none)'}`]).catch(
            (error) => console.error('Owner sign-up alert failed', error),
          )
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          await logActivity({
            userId: session.userId,
            event: 'sign_in',
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
          })
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
