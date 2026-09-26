type VerificationEmail = {
  to: string
  verificationUrl: string
}

export async function sendVerificationEmail({ to, verificationUrl }: VerificationEmail) {
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
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Verify your Northstar email address',
      text: `Verify your email address to finish creating your Northstar account: ${verificationUrl}`,
      html: `<p>Verify your email address to finish creating your Northstar account.</p><p><a href="${verificationUrl}">Verify email address</a></p><p>If you did not create this account, you can ignore this email.</p>`,
    }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    console.error('Verification email provider rejected the request.', { status: response.status })
    throw new Error('Unable to send verification email.')
  }
}
