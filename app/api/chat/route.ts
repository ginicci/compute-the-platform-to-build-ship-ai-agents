import { mockAiEnabled, MOCK_REPLY } from '@/lib/ai-mock'
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { assertRealAiAllowed } from '@/lib/ai-execution-policy'
import { reserveAiRequest, finishAiRequest, billingErrorResponse } from '@/lib/ai-billing'
import { convertToModelMessages, streamText } from 'ai'
import { after } from 'next/server'
import { chatStreamError } from '@/lib/chat-error'
import { getAgent, systemPromptFor } from '@/lib/agents'
import { ChatInputError, readChatBody, validateChatMessages } from '@/lib/chat-input'
import { hasCurrentConsent, logActivity, requestMeta } from '@/lib/legal'
import { isOwnerEmail } from '@/lib/owner'
import { getPlanContext } from '@/lib/plan-limits'
import { getUserSession } from '@/lib/session'

export const maxDuration = 60

export async function POST(request: Request) {
  const session = await getUserSession()
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized', code: 'sign_in_required' }, { status: 401 })
  }

  let input: unknown
  try {
    input = await readChatBody(request)
  } catch (error) {
    return Response.json({ error: 'Invalid request' }, { status: error instanceof ChatInputError ? error.status : 400 })
  }
  const body = input && typeof input === 'object' ? input as Record<string, unknown> : null
  const messages = validateChatMessages(body?.messages)
  if (!messages) {
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

  let modelMessages
  try {
    modelMessages = await convertToModelMessages(messages)
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  let reservation
  try {
    reservation = await reserveAiRequest(session.user, 'chat', agent.id)
  } catch (error) { return billingErrorResponse(error) }


  const meta = await requestMeta()
  const userId = session.user.id
  const planName = plan.tier.name

  if (mockAiEnabled(process.env)) {
    await finishAiRequest(reservation.id, 'completed', { mock: true, providerCostMicroUsd: 0 })
    const stream = createUIMessageStream({ execute: ({ writer }) => {
      writer.write({ type: 'start', messageId: reservation.id })
      writer.write({ type: 'text-start', id: 'mock-text' })
      writer.write({ type: 'text-delta', id: 'mock-text', delta: MOCK_REPLY })
      writer.write({ type: 'text-end', id: 'mock-text' })
      writer.write({ type: 'finish', finishReason: 'stop' })
    } })
    return createUIMessageStreamResponse({ stream })
  }
  assertRealAiAllowed(process.env)
  const result = streamText({
    model: 'openai/gpt-5.4-mini-fast',
    system: systemPromptFor(agent),
    messages: modelMessages,
    maxOutputTokens: 1500,
    providerOptions: { openai: { reasoningEffort: 'low' } },
    maxRetries: 0,
    onError: ({ error }) => {
      console.error('[chat] AI request failed', reservation.id)
      after(() => finishAiRequest(reservation.id, 'failed'))
    },
    onFinish: async ({ finishReason, usage, providerMetadata }) => {
      const generationId = providerMetadata?.gateway?.generationId
      await finishAiRequest(reservation.id, 'completed', usage, typeof generationId === 'string' ? generationId : undefined)
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

  return result.toUIMessageStreamResponse({ onError: chatStreamError })
}
