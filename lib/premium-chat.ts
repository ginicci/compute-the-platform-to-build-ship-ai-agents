import { modelContext, MAX_CONVERSATION_BYTES } from '@/lib/conversation-input'
import 'server-only'
import { convertToModelMessages, streamText, createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { getAgent, systemPromptFor } from '@/lib/agents'
import { readChatBody, ChatInputError } from '@/lib/chat-input'
import { hasCurrentConsent } from '@/lib/legal'
import { premiumPaidAccess } from '@/lib/premium-billing'
import { completePremium, failPremium, reservePremium, PremiumError } from '@/lib/premium-usage'

export async function premiumChat(request: Request, userId: string) {
  let reservation: { id: string; result: string | null } | undefined
  try {
    if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ code: 'invalid_origin' }, { status: 403 })
    if (!(await hasCurrentConsent(userId))) return Response.json({ code: 'terms_required' }, { status: 403 })
    const input = await readChatBody(request, MAX_CONVERSATION_BYTES) as Record<string, unknown>
    const messages = modelContext(input?.messages)
    const agent = getAgent(input?.agentId)
    if (!messages || !agent) return Response.json({ code: 'invalid_request' }, { status: 400 })
    const modelMessages = await convertToModelMessages(messages)
    // Last user message ID is stable across network retries in both existing SDK clients.
    const key = messages[messages.length - 1].id
    const paid = await premiumPaidAccess(userId)
    reservation = await reservePremium(userId, key, agent.id, messages, paid)
    const held = reservation
    return createUIMessageStreamResponse({
      headers: { 'Cache-Control': 'private, no-store' },
      stream: createUIMessageStream({
        onError: () => 'The reply could not be completed. No failed generation is charged. Recover saved results before retrying.',
        execute: async ({ writer }) => {
          writer.write({ type: 'start', messageId: held.id })
          writer.write({ type: 'text-start', id: 'answer' })
          try {
            if (held.result !== null) {
              writer.write({ type: 'text-delta', id: 'answer', delta: held.result })
            } else {
              const result = streamText({
                model: process.env.PREMIUM_AI_MODEL!, system: systemPromptFor(agent), messages: modelMessages,
                maxOutputTokens: 4096, maxRetries: 0,
                abortSignal: AbortSignal.any([request.signal, AbortSignal.timeout(45_000)]),
              })
              let text = '', finishReason = ''
              for await (const part of result.fullStream) {
                if (part.type === 'text-delta') { text += part.text; writer.write({ type: 'text-delta', id: 'answer', delta: part.text }) }
                if (part.type === 'finish') finishReason = part.finishReason
                if (part.type === 'error' || part.type === 'abort') throw new Error('Generation interrupted')
              }
              if (request.signal.aborted || finishReason !== 'stop' || !text.trim()) throw new Error('Incomplete premium result')
              // Finish/ACK is not emitted until the usable streamed result is durable.
              await completePremium(held.id, userId, text)
            }
            writer.write({ type: 'text-end', id: 'answer' })
            writer.write({ type: 'finish', finishReason: 'stop' })
          } catch {
            if (held.result === null) await failPremium(held.id, userId).catch(() => {})
            writer.write({ type: 'error', errorText: 'The reply was interrupted. No failed generation is charged; check saved results before retrying.' })
          }
        },
      }),
    })
  } catch (error) {
    if (reservation && reservation.result === null) await failPremium(reservation.id, userId).catch(() => {})
    if (error instanceof PremiumError) return Response.json({ code: error.code, error: error.code === 'premium_required' ? 'Your six complimentary premium uses are complete. Upgrade to Premium to continue.' : 'Request unavailable. Check your account and try again.' }, { status: error.status })
    if (error instanceof ChatInputError) return Response.json({ code: 'invalid_request' }, { status: error.status })
    console.error('[premium] request unavailable')
    return Response.json({ code: 'premium_unavailable', error: 'Premium is temporarily unavailable. No failed request is charged. Check saved premium results before retrying.' }, { status: 503 })
  }
}
