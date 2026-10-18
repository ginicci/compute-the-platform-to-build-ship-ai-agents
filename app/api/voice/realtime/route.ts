import { after } from 'next/server'
import { getUserSession } from '@/lib/session'
import { hasCurrentConsent } from '@/lib/legal'
import { pool } from '@/lib/db'
import { readChatBody, ChatInputError } from '@/lib/chat-input'
import { conversationMessages } from '@/lib/conversation-input'
import { getAgent, systemPromptFor } from '@/lib/agents'
import { premiumEnabled } from '@/lib/premium-policy'
import { premiumPaidAccess } from '@/lib/premium-billing'
import { reservePremium, failPremium, PremiumError } from '@/lib/premium-usage'
import { realtimeEnabled, voiceSessionConfig } from '@/lib/realtime-policy'
import { createVoiceCall, hangupVoice, monitorVoice } from '@/lib/realtime-server'
export const maxDuration = 120
export const runtime = 'nodejs'
export async function POST(request: Request) {
  const session = await getUserSession()
  if (!session?.user) return Response.json({ code: 'sign_in_required' }, { status: 401 })
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({}, { status: 403 })
  if (!realtimeEnabled() || !premiumEnabled()) return Response.json({ code: 'voice_unavailable', error: 'Live voice is not activated. Continue with text.' }, { status: 503 })
  let reservationId: string | undefined, callId: string | undefined
  try {
    if (!(await hasCurrentConsent(session.user.id))) return Response.json({ code: 'terms_required' }, { status: 403 })
    const input = await readChatBody(request, 64 * 1024) as Record<string, unknown>
    const agent = getAgent(input?.agentId)
    const context = conversationMessages(input?.messages ?? [])
    if (!agent || !context || typeof input.key !== 'string' || !/^[a-f0-9-]{36}$/.test(input.key) || typeof input.sdp !== 'string' || !input.sdp.startsWith('v=0') || input.sdp.length > 32000) return Response.json({ code: 'invalid_request' }, { status: 400 })
    const paid = await premiumPaidAccess(session.user.id)
    // Session, not sentence, consumes one shared trial/paid slot.
    const reservation = await reservePremium(session.user.id, input.key, 'live_voice', { key: input.key, agentId: agent.id, context }, paid)
    reservationId = reservation.id
    if (reservation.result) return Response.json({ code: 'session_finished', resultId: reservation.id }, { status: 409 })
    const { rows: [prefs] } = await pool.query('SELECT voice FROM account_preferences WHERE user_id = $1', [session.user.id])
    const voice = prefs?.voice === 'cedar' ? 'cedar' : 'marin'
    const call = await createVoiceCall(input.sdp, voiceSessionConfig(process.env.REALTIME_MODEL!, voice,
      systemPromptFor(agent) + '\nYou are an AI voice, never a human. Speak warmly, naturally and concisely. Allow interruptions. Never claim external actions.'), session.user.id)
    callId = call.id
    await pool.query('UPDATE premium_requests SET provider_call_id = $2 WHERE id = $1', [reservation.id, call.id])
    const turns = context.slice(-8).map(m => ({ role: m.role, text: m.parts.filter(p => p.type === 'text').map(p => p.text).join('').slice(0, 4000) }))
    const monitor = await monitorVoice(call.id, reservation.id, session.user.id, turns)
    after(() => monitor.done)
    return Response.json({ sdp: call.sdp, resultId: reservation.id, maxSeconds: 60 }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    if (callId) await hangupVoice(callId).catch(() => {})
    if (reservationId) await failPremium(reservationId, session.user.id).catch(() => {})
    return Response.json({ code: error instanceof PremiumError ? error.code : 'voice_unavailable', error: 'Voice unavailable. Recover saved results before retrying, or continue typing.' }, { status: error instanceof PremiumError ? error.status : error instanceof ChatInputError ? error.status : 503 })
  }
}
