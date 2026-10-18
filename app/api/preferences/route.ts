import { getUserSession } from '@/lib/session'
import { pool } from '@/lib/db'
import { readChatBody, ChatInputError } from '@/lib/chat-input'
const headers = { 'Cache-Control': 'private, no-store' }
export async function GET() {
  const session = await getUserSession()
  if (!session?.user) return Response.json({}, { status: 401, headers })
  try {
    const { rows: [row] } = await pool.query('SELECT voice, auto_save FROM account_preferences WHERE user_id = $1', [session.user.id])
    return Response.json(row ?? { voice: 'marin', auto_save: false }, { headers })
  } catch { return Response.json({ error: 'Preferences unavailable' }, { status: 503, headers }) }
}
export async function PUT(request: Request) {
  const session = await getUserSession()
  if (!session?.user) return Response.json({}, { status: 401, headers })
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({}, { status: 403, headers })
  try {
    const body = await readChatBody(request, 1024) as { voice?: string; auto_save?: boolean }
    if (!['marin','cedar'].includes(body?.voice ?? '') || typeof body.auto_save !== 'boolean') return Response.json({}, { status: 400, headers })
    await pool.query(`INSERT INTO account_preferences(user_id,voice,auto_save) VALUES ($1,$2,$3)
      ON CONFLICT(user_id) DO UPDATE SET voice=$2,auto_save=$3,updated_at=now()`, [session.user.id, body.voice, body.auto_save])
    return Response.json({ ok: true }, { headers })
  } catch (error) { return Response.json({ error: 'Preferences not saved' }, { status: error instanceof ChatInputError ? error.status : 503, headers }) }
}
