import { databaseTarget } from '@/lib/database-target'
import { betterAuth } from 'better-auth'
import { Pool } from 'pg'
import { logActivity } from '@/lib/legal'
import { sendOwnerAlert, sendPasswordResetEmail } from '@/lib/owner-alerts'
import { sendVerificationEmail } from '@/lib/auth-email'

import { authOrigins } from '@/lib/auth-origins'

const { baseURL, trustedOrigins } = authOrigins(process.env)

export const auth = betterAuth({
  database: new Pool({ connectionString: databaseTarget() }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ email: user.email, resetUrl: url })
    },
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
      '/send-verification-email': { window: 60, max: 3 },
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
  baseURL,
  trustedOrigins,
  ...(process.env.NODE_ENV === 'development'
    ? { advanced: { defaultCookieAttributes: { sameSite: 'none' as const, secure: true } } }
    : {}),
})
