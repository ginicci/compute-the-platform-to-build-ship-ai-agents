import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import { pool } from '@/lib/db'
import { PREMIUM_TRIAL_USES } from '@/lib/premium-policy'
export type PaidAccess = { period: string; limit: number } | null
export class PremiumError extends Error {
  constructor(public code: string, public status: number) { super(code) }
}
export async function premiumBalance(userId: string) {
  const { rows: [row] } = await pool.query(`SELECT
    count(*) FILTER (WHERE state = 'completed')::int AS used,
    count(*) FILTER (WHERE (state = 'ready' OR (state = 'running' AND created_at > now() - interval '2 minutes')))::int AS pending
    FROM premium_requests WHERE user_id = $1 AND entitlement = 'trial'`, [userId])
  return { used: row.used, pending: row.pending, remaining: Math.max(0, PREMIUM_TRIAL_USES - row.used), total: PREMIUM_TRIAL_USES }
}
export async function reservePremium(userId: string, requestKey: string, feature: string, input: unknown, paid: PaidAccess) {
  const hash = createHash('sha256').update(JSON.stringify({ feature, input })).digest('hex')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Lock is shared by all requests for an account, including website and PWA.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [userId])
    await client.query(`UPDATE premium_requests SET state = 'failed' WHERE user_id = $1 AND state = 'running' AND created_at <= now() - interval '2 minutes'`, [userId])
    const { rows: [existing] } = await client.query('SELECT * FROM premium_requests WHERE user_id = $1 AND request_key = $2', [userId, requestKey])
    if (existing) {
      if (existing.input_hash !== hash) throw new PremiumError('request_conflict', 409)
      if (['ready', 'completed'].includes(existing.state)) {
        await client.query('COMMIT')
        return { id: existing.id as string, result: existing.result as string }
      }
      throw new PremiumError(existing.state === 'running' ? 'request_pending' : 'request_failed', 409)
    }
    const { rows: [counts] } = await client.query(`SELECT
      count(*) FILTER (WHERE entitlement = 'trial' AND state IN ('running','ready','completed'))::int AS trial,
      count(*) FILTER (WHERE entitlement = 'trial' AND state = 'completed')::int AS delivered,
      count(*) FILTER (WHERE entitlement = 'paid' AND billing_period = $2 AND state IN ('running','ready','completed'))::int AS paid,
      count(*) FILTER (WHERE created_at > now() - interval '1 minute')::int AS recent,
      count(*) FILTER (WHERE state = 'running')::int AS running
      FROM premium_requests WHERE user_id = $1`, [userId, paid?.period ?? ''])
    if (!paid && counts.trial >= PREMIUM_TRIAL_USES) throw new PremiumError(counts.delivered >= PREMIUM_TRIAL_USES ? 'premium_required' : 'request_pending', counts.delivered >= PREMIUM_TRIAL_USES ? 402 : 409)
    if (paid && counts.paid >= paid.limit) throw new PremiumError('paid_limit', 429)
    if (counts.recent >= 6 || counts.running >= 1) throw new PremiumError('rate_limit', 429)
    const id = randomUUID()
    await client.query(`INSERT INTO premium_requests (id,user_id,request_key,input_hash,feature,entitlement,billing_period,state)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'running')`, [id, userId, requestKey, hash, feature, paid ? 'paid' : 'trial', paid?.period ?? 'lifetime'])
    await client.query('COMMIT')
    return { id, result: null }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}
export async function completePremium(id: string, userId: string, result: string) {
  if (!result.trim()) throw new Error('Empty premium result')
  const saved = await pool.query(`UPDATE premium_requests SET state = 'ready', result = $3, completed_at = now()
    WHERE id = $1 AND user_id = $2 AND state = 'running' AND created_at > now() - interval '2 minutes' RETURNING id`, [id, userId, result])
  if (!saved.rowCount) throw new Error('Reservation expired')
}
export async function failPremium(id: string, userId: string) {
  await pool.query("UPDATE premium_requests SET state = 'failed' WHERE id = $1 AND user_id = $2 AND state = 'running'", [id, userId])
}

// Only an authenticated recipient can acknowledge a server-produced, usable result.
// Duplicate acknowledgements and retries are idempotent.
export async function acknowledgePremium(id: string, userId: string) {
  const result = await pool.query(`UPDATE premium_requests SET state = 'completed', delivered_at = COALESCE(delivered_at, now())
    WHERE id = $1 AND user_id = $2 AND state IN ('ready','completed') RETURNING id`, [id, userId])
  return !!result.rowCount
}
