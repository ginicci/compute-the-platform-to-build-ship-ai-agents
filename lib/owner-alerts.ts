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
