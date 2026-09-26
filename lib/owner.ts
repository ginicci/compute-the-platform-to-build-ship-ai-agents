import 'server-only'

import { notFound } from 'next/navigation'
import { getUserSession } from '@/lib/session'

export function isOwnerEmail(email: string | null | undefined) {
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase()
  if (!owner || !email) return false
  return email.trim().toLowerCase() === owner
}

// Responds with a 404 for everyone else so the admin area's existence isn't revealed.
export async function requireOwner() {
  const session = await getUserSession()
  if (!session?.user || !isOwnerEmail(session.user.email)) notFound()
  return session
}
