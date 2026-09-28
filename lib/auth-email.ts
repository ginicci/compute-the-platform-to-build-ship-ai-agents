import 'server-only'

import { Resend } from 'resend'

export async function sendAuthEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM?.trim()
  const recipient = to.trim().toLowerCase()
  if (!apiKey || !from) throw new Error('Email delivery is not configured')

  const { error } = await new Resend(apiKey).emails.send({ from, to: recipient, subject, text })
  if (error) throw new Error(`Email delivery failed: ${error.name}`)
}

export async function sendVerificationEmail({ user, url }: { user: { email: string }; url: string }) {
  await sendAuthEmail({
    to: user.email,
    subject: 'Verify your Ginicci account',
    text: `Verify your email address:\n\n${url}\n\nThis link expires in one hour.`,
  })
}
