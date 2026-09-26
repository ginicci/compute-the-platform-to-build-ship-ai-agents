import { convertToModelMessages, streamText } from 'ai'
import { after } from 'next/server'
import { getAgent, systemPromptFor } from '@/lib/agents'
import { hasCurrentConsent, logActivity, requestMeta } from '@/lib/legal'
import { isOwnerEmail } from '@/lib/owner'
import { consumeTask, getPlanContext } from '@/lib/plan-limits'
import { getUserSession } from '@/lib/session'

const MAX_MESSAGES = 60

export const maxDuration = 60

export async function POST(request: Request) {
  const session = await getUserSession()
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const messages = body?.messages
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const agent = getAgent(body?.agentId)
  if (!agent) {
    return Response.json({ error: 'Unknown agent' }, { status: 400 })
  }

  const isOwner = isOwnerEmail(session.user.email)
  const [plan, agreed] = await Promise.all([
    getPlanContext(session.user),
    isOwner ? Promise.resolve(true) : hasCurrentConsent(session.user.id),
  ])
  if (!agreed) {
    return Response.json({ error: 'Please agree to the terms first', code: 'terms_required' }, { status: 403 })
  }
  if (!plan.allowedAgentIds.includes(agent.id)) {
    return Response.json({ error: 'Upgrade to use this agent', code: 'agent_locked' }, { status: 403 })
  }

  if (!(await consumeTask(session.user.id, plan.period, plan.tasksLimit))) {
    return Response.json({ error: 'Monthly task limit reached', code: 'task_limit' }, { status: 429 })
  }

  const meta = await requestMeta()
  const userId = session.user.id
  const planName = plan.tier.name

  const result = streamText({
    model: 'openai/gpt-5.4-mini-fast',
    system: systemPromptFor(agent),
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 1500,
    providerOptions: { openai: { reasoningEffort: 'low' } },
    onFinish: ({ finishReason, usage }) => {
      after(() =>
        logActivity({
          userId,
          event: 'agent_task_completed',
          agentId: agent.id,
          detail: JSON.stringify({ plan: planName, finishReason, outputTokens: usage.outputTokens ?? null }),
          ...meta,
        }),
      )
    },
  })

  after(() =>
    logActivity({
      userId,
      event: 'agent_task_started',
      agentId: agent.id,
      detail: JSON.stringify({ plan: planName }),
      ...meta,
    }),
  )

  return result.toUIMessageStreamResponse()
}
