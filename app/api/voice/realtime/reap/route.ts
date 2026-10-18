import { timingSafeEqual } from 'node:crypto'
import { pool } from '@/lib/db'
import { hangupVoice } from '@/lib/realtime-server'
export const maxDuration = 60
export async function POST(request: Request) {
  const secret = process.env.VOICE_WATCHDOG_SECRET
  const provided = request.headers.get('authorization') ?? ''
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(provided)
  if (!secret || secret.length < 32 || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return Response.json({}, { status: 401 })
  // Never become an unapproved production background job.
  if (process.env.VERCEL_ENV !== 'preview' || !process.env.GINICCI_PWA_ISOLATED_DATABASE_URL) return Response.json({}, { status: 503 })
  try {
    const { rows } = await pool.query(`SELECT id, provider_call_id FROM premium_requests
      WHERE provider_call_id IS NOT NULL AND provider_ended_at IS NULL
      AND created_at < now() - interval '70 seconds' ORDER BY created_at LIMIT 20`)
    let ended = 0
    for (const row of rows) {
      try {
        await hangupVoice(row.provider_call_id)
        await pool.query('UPDATE premium_requests SET provider_ended_at = now() WHERE id = $1', [row.id])
        ended++
      } catch { /* Leave the row retryable; no accepted hangup is fabricated. */ }
    }
    return Response.json({ checked: rows.length, ended, retryRequired: rows.length !== ended }, { status: rows.length === ended ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
  } catch { return Response.json({ error: 'Watchdog unavailable' }, { status: 503 }) }
}
