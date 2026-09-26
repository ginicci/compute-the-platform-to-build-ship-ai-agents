type Email = {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail({ to, subject, text, html }: Email) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM

  if (!apiKey || !from) {
    throw new Error('Email delivery is not configured.')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    console.error('Email provider rejected the request.', { status: response.status })
    throw new Error('Unable to send email.')
  }
}

export async function sendVerificationEmail({ to, verificationUrl }: { to: string; verificationUrl: string }) {
  await sendEmail({
    to,
    subject: 'Verify your Northstar email address',
    text: `Verify your email address to finish creating your Northstar account: ${verificationUrl}`,
    html: `<p>Verify your email address to finish creating your Northstar account.</p><p><a href="${verificationUrl}">Verify email address</a></p><p>If you did not create this account, you can ignore this email.</p>`,
  })
}
