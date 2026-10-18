import { conversationMessages, MAX_CONVERSATION_BYTES } from '@/lib/conversation-input'
import { getUserSession } from '@/lib/session'
import { pool } from '@/lib/db'
import { readChatBody } from '@/lib/chat-input'
const headers = { 'Cache-Control': 'private, no-store' }
export async function GET() {
  const session = await getUserSession()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers })
  try {
    const { rows } = await pool.query('SELECT id, title, messages, revision FROM pwa_conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 20', [session.user.id])
    return Response.json({ conversations: rows }, { headers })
  } catch { return Response.json({ error: 'History unavailable' }, { status: 503, headers }) }
}
export async function PUT(request: Request) {
  const session = await getUserSession()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers })
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Forbidden' }, { status: 403, headers })
  let body
  try { body = await readChatBody(request, MAX_CONVERSATION_BYTES) as { id?: unknown; title?: unknown; messages?: unknown; revision?: unknown } } catch { return Response.json({ error: 'Invalid request' }, { status: 400, headers }) }
  const validated = conversationMessages(body?.messages)
  if (!body || !validated || typeof body.id !== 'string' || !/^[a-f0-9-]{36}$/.test(body.id) || typeof body.title !== 'string' || body.title.length > 60 || (body.revision !== undefined && (!Number.isSafeInteger(body.revision) || Number(body.revision) < 0))) return Response.json({ error: 'Invalid request' }, { status: 400, headers })
  try {
    const result = await pool.query(`INSERT INTO pwa_conversations (id, user_id, title, messages) VALUES ($1,$2,$3,$4::jsonb)
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, messages = EXCLUDED.messages, updated_at = now(), revision = pwa_conversations.revision + 1
      WHERE pwa_conversations.user_id = EXCLUDED.user_id AND pwa_conversations.revision = $5 RETURNING id, revision`, [body.id, session.user.id, body.title, JSON.stringify(validated), body.revision ?? 0])
    if (!result.rows.length) return Response.json({ error: 'Forbidden' }, { status: 403, headers })
    return Response.json({ ok: true, revision: result.rows[0].revision }, { headers })
  } catch { return Response.json({ error: 'History unavailable' }, { status: 503, headers }) }
}
