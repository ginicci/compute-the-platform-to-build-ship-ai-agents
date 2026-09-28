import 'server-only'

import { Resend } from 'resend'

function getOrigin() {
  return process.env.BETTER_AUTH_URL || 'https://www.ginicci.app'
}

async function send(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) throw new Error('Email delivery is not configured')

  const { error } = await new Resend(apiKey).emails.send({ from, to, subject, text })
  if (error) throw new Error(`Email delivery failed: ${error.name}`)
}

export async function sendVerificationEmail({ user, url }: { user: { email: string }; url: string }) {
  await send(user.email, 'Verify your Ginicci account', `Verify your email address:\n\n${url}\n\nThis link expires in one hour.`)
}

export async function sendResetPasswordEmail({ user, url }: { user: { email: string }; url: string }) {
  const resetUrl = new URL('/reset-password', getOrigin())
  resetUrl.searchParams.set('token', new URL(url).searchParams.get('token') || '')
  await send(user.email, 'Reset your Ginicci password', `Reset your password:\n\n${resetUrl}\n\nThis link expires in one hour. If you did not request it, you can ignore this email.`)
}
