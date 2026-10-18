import { getUserSession } from '@/lib/session'
import { pool } from '@/lib/db'
import { readChatBody } from '@/lib/chat-input'
import { hangupVoice } from '@/lib/realtime-server'
export async function POST(request: Request) {
  const session = await getUserSession()
  if (!session?.user) return Response.json({}, { status: 401 })
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({}, { status: 403 })
  try {
    const { id } = await readChatBody(request, 512) as { id?: unknown }
    if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id)) return Response.json({}, { status: 400 })
    const { rows: [call] } = await pool.query('SELECT provider_call_id FROM premium_requests WHERE id = $1 AND user_id = $2', [id, session.user.id])
    if (!call?.provider_call_id) return Response.json({}, { status: 404 })
    await hangupVoice(call.provider_call_id)
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch { return Response.json({ error: 'Call termination unconfirmed; stop microphone and contact operator if needed' }, { status: 503 }) }
}
