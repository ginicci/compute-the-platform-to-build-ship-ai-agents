import 'server-only'

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getUserSession } from '@/lib/session'
import { notifyOwner } from '@/lib/owner-alerts'

export function isOwnerEmail(email: string | null | undefined) {
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase()
  if (!owner || !email) return false
  return email.trim().toLowerCase() === owner
}

// Responds with a 404 for everyone else so the admin area's existence isn't revealed.
export async function requireOwner() {
  const session = await getUserSession()
  if (!session?.user || !isOwnerEmail(session.user.email)) {
    const requestHeaders = await headers()
    await notifyOwner({
      subject: 'Blocked owner-console access',
      text: `A request without the owner session attempted to open the owner console. IP: ${requestHeaders.get('x-forwarded-for') ?? 'unavailable'}.`,
    })
    notFound()
  }
  await notifyOwner({
    subject: 'Owner console opened',
    text: `The owner console was opened by ${session.user.email}.`,
  })
  return session
}
