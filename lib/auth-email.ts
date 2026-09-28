import 'server-only'

import { Resend } from 'resend'

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
