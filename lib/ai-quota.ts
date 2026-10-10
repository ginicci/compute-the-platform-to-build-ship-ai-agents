import 'server-only'
import { pool } from '@/lib/db'
import { launchAIEnabled, USER_DAILY_CALLS, USER_TRIAL_CALLS, GLOBAL_DAILY_CALLS, GLOBAL_LIFETIME_CALLS } from '@/lib/ai-policy'

// A failed/aborted provider attempt still consumes its reservation. No retries or
// refunds of reservations: this deliberately favors protecting the launch fund.
export async function reserveTrialCall(userId: string): Promise<boolean> {
  if (!launchAIEnabled()) return false
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Serialize the small launch cohort across all serverless instances.
    await client.query('SELECT pg_advisory_xact_lock(74619203)')
    const { rows: [usage] } = await client.query(`
      SELECT count(*)::int AS total,
        count(*) FILTER (WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')::int AS today,
        count(*) FILTER (WHERE user_id = $1)::int AS user_total,
        count(*) FILTER (WHERE user_id = $1 AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')::int AS user_today,
        count(*) FILTER (WHERE user_id = $1 AND created_at > now() - interval '1 minute')::int AS recent
      FROM ai_launch_attempts`, [userId])
    if (usage.total >= GLOBAL_LIFETIME_CALLS || usage.today >= GLOBAL_DAILY_CALLS ||
        usage.user_total >= USER_TRIAL_CALLS || usage.user_today >= USER_DAILY_CALLS || usage.recent > 0) {
      await client.query('ROLLBACK')
      return false
    }
    await client.query('INSERT INTO ai_launch_attempts (user_id) VALUES ($1)', [userId])
    await client.query('COMMIT')
    return true
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    // Missing migration or DB failure never falls back to an in-memory quota.
    console.error('[ai-quota] reservation unavailable')
    return false
  } finally {
    client.release()
  }
}
