import 'server-only'

import { sendAuthEmail } from '@/lib/auth-email'

// Alerts are best-effort: a mail outage must never break sign-up or make Stripe
// retry a webhook, so failures are logged and swallowed.
export async function sendOwnerAlert(subject: string, lines: string[]) {
  const to = process.env.OWNER_ALERT_EMAIL?.trim()
  if (!to) return

  try {
    await sendAuthEmail({
      to,
      subject: `[Northstar] ${subject}`,
      text: [...lines, '', `Sent ${new Date().toUTCString()}`].join('\n'),
    })
  } catch (error) {
    console.error('Owner alert failed', error instanceof Error ? error.message : error)
  }
}

export function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export async function sendPasswordResetEmail({ email, resetUrl }: { email: string; resetUrl: string }) {
  await sendAuthEmail({
    to: email,
    subject: 'Reset your Northstar password',
    text: `Reset your password using this link: ${resetUrl}\n\nThis link expires in one hour. If you did not request a reset, you can ignore this email.`,
  })
}
