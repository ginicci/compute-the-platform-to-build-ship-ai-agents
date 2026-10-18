import 'server-only'
import WebSocket from 'ws'
import { createHash } from 'node:crypto'
import { pool } from '@/lib/db'
import { completePremium, failPremium } from '@/lib/premium-usage'
import { VoiceSessionEvidence } from '@/lib/realtime-events'
import { VOICE_SESSION_SECONDS } from '@/lib/realtime-policy'
const api = 'https://api.openai.com/v1/realtime/calls'
export async function hangupVoice(callId: string) {
  if (!/^rtc_[a-zA-Z0-9_-]+$/.test(callId)) throw new Error('Invalid call ID')
  const response = await fetch(`${api}/${encodeURIComponent(callId)}/hangup`, {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, signal: AbortSignal.timeout(8000),
  })
  if (!response.ok && response.status !== 404) throw new Error('Provider hangup failed')
}
export async function createVoiceCall(sdp: string, session: unknown, userId: string) {
  const body = new FormData(); body.set('sdp', sdp); body.set('session', JSON.stringify(session))
  const response = await fetch(api, { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'OpenAI-Safety-Identifier': createHash('sha256').update(userId).digest('hex') }, body, signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error('Provider connection unavailable')
  const id = response.headers.get('location')?.split('/').pop()
  if (!id || !/^rtc_[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Missing provider call identity')
  return { id, sdp: await response.text() }
}
export async function monitorVoice(callId: string, reservationId: string, userId: string, context: { role: string; text: string }[]) {
  const evidence = new VoiceSessionEvidence()
  const socket = new WebSocket(`wss://api.openai.com/v1/realtime?call_id=${encodeURIComponent(callId)}`, {
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, handshakeTimeout: 8000, maxPayload: 1024 * 1024,
  })
  let finish!: () => void
  const ended = new Promise<void>(resolve => { finish = resolve })
  socket.on('message', bytes => {
    try {
      const event = JSON.parse(bytes.toString())
      // A direct WebRTC data channel is client-controlled. End the call if it
      // raises the configured generation cap or attempts to add tools. This is
      // defense in depth, not a substitute for the duration watchdog or provider budget.
      if (event.type === 'session.updated' && ((event.session?.max_output_tokens !== undefined && (typeof event.session.max_output_tokens !== 'number' || event.session.max_output_tokens > 1024)) || (Array.isArray(event.session?.tools) && event.session.tools.length))) finish()
      evidence.accept(event)
    } catch { /* malformed events cannot grant credit */ }
  })
  socket.on('close', finish); socket.on('error', finish)
  await new Promise<void>((resolve, reject) => {
    socket.once('open', resolve); socket.once('error', reject)
  })
  for (const turn of context) socket.send(JSON.stringify({ type: 'conversation.item.create', item: {
    type: 'message', role: turn.role, content: [{ type: turn.role === 'assistant' ? 'output_text' : 'input_text', text: turn.text }],
  } }))
  // The browser never receives a reusable provider credential. Its data channel can
  // still send provider events: therefore a SERVER timer and provider hangup are mandatory.
  const deadline = setTimeout(finish, VOICE_SESSION_SECONDS * 1000)
  const done = (async () => {
    await ended
    clearTimeout(deadline)
    let terminated = false
    try { await hangupVoice(callId); terminated = true } catch { console.error('[voice] hangup failed; operator watchdog required') }
    socket.close()
    try {
      const result = evidence.result()
      if (result) await completePremium(reservationId, userId, result)
      else await failPremium(reservationId, userId)
      // Metadata only; never log audio, credentials or the transcript to console.
      await pool.query('UPDATE premium_requests SET provider_call_id = $2, provider_usage = $3::jsonb, provider_ended_at = CASE WHEN $4 THEN now() ELSE provider_ended_at END WHERE id = $1', [reservationId, callId, JSON.stringify(evidence.usage), terminated])
      if (!terminated) console.error('[voice] verify provider call termination')
    } catch { console.error('[voice] result persistence unavailable') }
  })()
  return { done, stop: () => { finish() } }
}
