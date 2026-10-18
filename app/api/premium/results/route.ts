import { getUserSession } from '@/lib/session'
import { pool } from '@/lib/db'
export async function GET() {
  const session = await getUserSession()
  if (!session?.user) return Response.json({ code: 'sign_in_required' }, { status: 401 })
  try {
    const { rows } = await pool.query(`SELECT id, feature, result, completed_at FROM premium_requests
      WHERE user_id = $1 AND state IN ('ready','completed') ORDER BY completed_at DESC LIMIT 50`, [session.user.id])
    return Response.json({ results: rows }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch { return Response.json({ code: 'premium_unavailable' }, { status: 503 }) }
}
