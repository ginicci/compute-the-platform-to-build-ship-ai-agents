import 'server-only'

import { Resend } from 'resend'

let client: Resend | null = null

function getClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  client ??= new Resend(apiKey)
  return client
}

// Alerts are best-effort: a mail outage must never break sign-up or make Stripe
// retry a webhook, so failures are logged and swallowed.
export async function sendOwnerAlert(subject: string, lines: string[]) {
  const to = process.env.OWNER_ALERT_EMAIL?.trim()
  const from = process.env.EMAIL_FROM?.trim()
  const resend = getClient()
  if (!to || !from || !resend) return

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `[Northstar] ${subject}`,
      text: [...lines, '', `Sent ${new Date().toUTCString()}`].join('\n'),
    })
    if (error) console.error('Owner alert failed', error.name)
  } catch (error) {
    console.error('Owner alert failed', error instanceof Error ? error.message : error)
  }
}

export function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export async function sendPasswordResetEmail({ email, resetUrl }: { email: string; resetUrl: string }) {
  const from = process.env.EMAIL_FROM?.trim()
  const resend = getClient()
  if (!from || !resend) {
    console.error('Password reset email is unavailable: email provider is not configured')
    return
  }

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: 'Reset your Northstar password',
    text: `Reset your password using this link: ${resetUrl}\n\nThis link expires in one hour. If you did not request a reset, you can ignore this email.`,
  })
  if (error) throw new Error(`Password reset email failed: ${error.name}`)
}
