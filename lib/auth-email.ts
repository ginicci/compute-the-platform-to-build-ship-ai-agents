import 'server-only'

type Email = {
  to: string
  subject: string
  text: string
}

export async function sendAuthEmail({ to, subject, text }: Email) {
  const apiKey = normalizeResendApiKey(process.env.RESEND_API_KEY)
  const from = process.env.EMAIL_FROM?.trim()
  const recipient = to.trim().toLowerCase()
  if (!apiKey || !from) throw new Error('Email delivery is not configured')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [recipient], subject, text }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Email delivery failed: Resend returned ${response.status}`)
}

function normalizeResendApiKey(value: string | undefined) {
  const key = value?.trim().replace(/[^\x20-\x7E]/g, '')
  if (!key?.startsWith('re_')) {
    console.error('[email] RESEND_API_KEY is missing or malformed')
    return undefined
  }
  return key
}

export async function sendVerificationEmail({ user, url }: { user: { email: string }; url: string }) {
  await sendAuthEmail({
    to: user.email,
    subject: 'Verify your Ginicci account',
    text: `Verify your email address:\n\n${url}\n\nThis link expires in one hour.`,
  })
}
