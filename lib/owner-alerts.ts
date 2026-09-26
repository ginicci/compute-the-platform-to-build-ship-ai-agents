import 'server-only'

import { sendEmail } from '@/lib/email'

type OwnerAlert = {
  subject: string
  text: string
}

export async function notifyOwner({ subject, text }: OwnerAlert) {
  const to = process.env.OWNER_ALERT_EMAIL
  if (!to) {
    console.error('Owner alert recipient is not configured.')
    return
  }

  try {
    await sendEmail({ to, subject: `Northstar alert: ${subject}`, text })
  } catch (error) {
    console.error('Owner alert delivery failed.', error)
  }
}
