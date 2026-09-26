import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { isOwnerEmail } from '@/lib/owner'

export async function getOwnerSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || !isOwnerEmail(session.user.email)) return null
  return session
}
