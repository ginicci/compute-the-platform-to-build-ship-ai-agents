import { getUserSession } from '@/lib/session'
import { pool } from '@/lib/db'
import { readChatBody, validateChatMessages } from '@/lib/chat-input'
const headers = { 'Cache-Control': 'private, no-store' }
export async function GET() {
  const session = await getUserSession()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers })
  try {
    const { rows } = await pool.query('SELECT id, title, messages FROM pwa_conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 20', [session.user.id])
    return Response.json({ conversations: rows }, { headers })
  } catch { return Response.json({ error: 'History unavailable' }, { status: 503, headers }) }
}
export async function PUT(request: Request) {
  const session = await getUserSession()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers })
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Forbidden' }, { status: 403, headers })
  let body
  try { body = await readChatBody(request) as { id?: unknown; title?: unknown; messages?: unknown } } catch { return Response.json({ error: 'Invalid request' }, { status: 400, headers }) }
  // Validator requires final user message; append sentinel for stored assistant replies.
  const raw = body?.messages
  const validated = Array.isArray(raw) && raw.length <= 9 ? validateChatMessages([...raw, { id: '__history_validation__', role: 'user', parts: [{ type: 'text', text: '.' }] }]) : null
  if (!validated || typeof body.id !== 'string' || !/^[a-f0-9-]{36}$/.test(body.id) || typeof body.title !== 'string' || body.title.length > 60) return Response.json({ error: 'Invalid request' }, { status: 400, headers })
  try {
    const result = await pool.query(`INSERT INTO pwa_conversations (id, user_id, title, messages) VALUES ($1,$2,$3,$4::jsonb)
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, messages = EXCLUDED.messages, updated_at = now()
      WHERE pwa_conversations.user_id = EXCLUDED.user_id RETURNING id`, [body.id, session.user.id, body.title, JSON.stringify(validated.slice(0,-1))])
    if (!result.rows.length) return Response.json({ error: 'Forbidden' }, { status: 403, headers })
    return Response.json({ ok: true }, { headers })
  } catch { return Response.json({ error: 'History unavailable' }, { status: 503, headers }) }
}
