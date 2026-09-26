'use server'

import { recordConsent } from '@/lib/legal'
import { getUserSession } from '@/lib/session'

export async function acceptTerms(context: 'sign_up' | 'app_access') {
  if (context !== 'sign_up' && context !== 'app_access') throw new Error('Invalid request')
  const session = await getUserSession()
  if (!session?.user) throw new Error('Unauthorized')
  await recordConsent(session.user.id, context)
  return { ok: true }
}
