import { reserveAiRequest, billingErrorResponse } from '@/lib/ai-billing'
import type { AiFeature } from '@/lib/ai-billing-policy'
import { getAgent } from '@/lib/agents'
import 'server-only'

import { hasCurrentConsent } from '@/lib/legal'
import { isOwnerEmail } from '@/lib/owner'
import { getPlanContext } from '@/lib/plan-limits'
import { getUserSession } from '@/lib/session'

type VoiceAccess =
  | { ok: true; userId: string; planName: string; requestId: string }
  | { ok: false; response: Response }

// Voice requests cost money per call, so they go through the same sign-in, terms
// and monthly task checks as typed messages. Each call counts as one task.
export async function authorizeVoiceTask(feature: Extract<AiFeature, 'speech' | 'transcription'>, agentId: unknown): Promise<VoiceAccess> {
  const session = await getUserSession()
  if (!session?.user) {
    return { ok: false, response: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const isOwner = isOwnerEmail(session.user.email)
  const [plan, agreed] = await Promise.all([
    getPlanContext(session.user),
    isOwner ? Promise.resolve(true) : hasCurrentConsent(session.user.id),
  ])
  if (!agreed) {
    return {
      ok: false,
      response: Response.json({ error: 'Please agree to the terms first', code: 'terms_required' }, { status: 403 }),
    }
  }

  const agent = getAgent(agentId)
  if (!agent) return { ok: false, response: Response.json({ error: 'Unknown agent' }, { status: 400 }) }
  try {
    const reservation = await reserveAiRequest(session.user, feature, agent.id)
    return { ok: true, userId: session.user.id, planName: plan.tier.name, requestId: reservation.id }
  } catch (error) {
    return { ok: false, response: billingErrorResponse(error) }
  }
}
