import 'server-only'

import { hasCurrentConsent } from '@/lib/legal'
import { isOwnerEmail } from '@/lib/owner'
import { consumeTask, getPlanContext } from '@/lib/plan-limits'
import { getUserSession } from '@/lib/session'

type VoiceAccess =
  | { ok: true; userId: string; planName: string }
  | { ok: false; response: Response }

// Voice requests cost money per call, so they go through the same sign-in, terms
// and monthly task checks as typed messages. Each call counts as one task.
export async function authorizeVoiceTask(): Promise<VoiceAccess> {
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

  if (!(await consumeTask(session.user.id, plan.period, plan.tasksLimit))) {
    return {
      ok: false,
      response: Response.json({ error: 'Monthly task limit reached', code: 'task_limit' }, { status: 429 }),
    }
  }

  return { ok: true, userId: session.user.id, planName: plan.tier.name }
}
