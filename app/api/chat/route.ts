import { convertToModelMessages, streamText } from 'ai'
import { getAgent, systemPromptFor } from '@/lib/agents'
import { getUserSession } from '@/lib/session'

const MAX_MESSAGES = 60

export const maxDuration = 60

export async function POST(request: Request) {
  if (!(await getUserSession())) {
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

  const result = streamText({
    model: 'openai/gpt-5.4-mini-fast',
    system: systemPromptFor(agent),
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 1500,
    providerOptions: { openai: { reasoningEffort: 'low' } },
  })
  return result.toUIMessageStreamResponse()
}
