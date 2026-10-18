import 'server-only'
import { convertToModelMessages, generateText, createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { getAgent, systemPromptFor } from '@/lib/agents'
import { readChatBody, validateChatMessages, ChatInputError } from '@/lib/chat-input'
import { hasCurrentConsent } from '@/lib/legal'
import { premiumPaidAccess } from '@/lib/premium-billing'
import { completePremium, failPremium, reservePremium, PremiumError } from '@/lib/premium-usage'

export async function premiumChat(request: Request, userId: string) {
  let reservation: { id: string; result: string | null } | undefined
  try {
    if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ code: 'invalid_origin' }, { status: 403 })
    if (!(await hasCurrentConsent(userId))) return Response.json({ code: 'terms_required' }, { status: 403 })
    const input = await readChatBody(request) as Record<string, unknown>
    const messages = validateChatMessages(input?.messages)
    const agent = getAgent(input?.agentId)
    if (!messages || !agent) return Response.json({ code: 'invalid_request' }, { status: 400 })
    const modelMessages = await convertToModelMessages(messages)
    // Last user message ID is stable across network retries in both existing SDK clients.
    const key = messages[messages.length - 1].id
    const paid = await premiumPaidAccess(userId)
    reservation = await reservePremium(userId, key, agent.id, messages, paid)
    let text = reservation.result
    if (text === null) {
      const result = await generateText({
        model: process.env.PREMIUM_AI_MODEL!, system: systemPromptFor(agent), messages: modelMessages,
        maxOutputTokens: 4096, maxRetries: 0,
        abortSignal: AbortSignal.any([request.signal, AbortSignal.timeout(45_000)]),
      })
      // Never charge for aborts, errors, empty results, filtered or truncated output.
      if (request.signal.aborted || result.finishReason !== 'stop' || !result.text.trim()) throw new Error('Incomplete premium result')
      text = result.text
      await completePremium(reservation.id, userId, text)
    }
    // Persist BEFORE sending. If delivery is interrupted the exact result is recoverable,
    // at no additional credit, from /api/premium/results on either interface.
    const resultText = text
    return createUIMessageStreamResponse({
      headers: { 'Cache-Control': 'private, no-store' },
      stream: createUIMessageStream({ execute: ({ writer }) => {
        writer.write({ type: 'start', messageId: reservation!.id })
        writer.write({ type: 'text-start', id: 'answer' })
        writer.write({ type: 'text-delta', id: 'answer', delta: resultText })
        writer.write({ type: 'text-end', id: 'answer' })
        writer.write({ type: 'finish', finishReason: 'stop' })
      } }),
    })
  } catch (error) {
    if (reservation && reservation.result === null) await failPremium(reservation.id, userId).catch(() => {})
    if (error instanceof PremiumError) return Response.json({ code: error.code, error: error.code === 'premium_required' ? 'Your six complimentary premium uses are complete. Upgrade to Premium to continue.' : 'Request unavailable. Check your account and try again.' }, { status: error.status })
    if (error instanceof ChatInputError) return Response.json({ code: 'invalid_request' }, { status: error.status })
    console.error('[premium] request unavailable')
    return Response.json({ code: 'premium_unavailable', error: 'Premium is temporarily unavailable. No failed request is charged. Check saved premium results before retrying.' }, { status: 503 })
  }
}
