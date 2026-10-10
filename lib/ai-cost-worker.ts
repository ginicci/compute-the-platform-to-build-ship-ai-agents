import 'server-only'
import { gateway } from 'ai'
import { pool } from '@/lib/db'
import { reconcileAiCost } from '@/lib/ai-cost-accounting'
import { mockAiEnabled } from '@/lib/ai-mock'
import { realAiAllowed } from '@/lib/ai-execution-policy'

/** Internal worker only; no public endpoint, no automatic schedule. */
export async function reconcileStoredAiRequest(id: string) {
  if (process.env.AI_COST_WORKER_ENABLED !== 'true') throw new Error('Cost worker disabled')
  const test = mockAiEnabled(process.env)
  if (!test && !realAiAllowed(process.env)) throw new Error('Cost lookup disabled')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query<{
      user_id: string; reserve_micro_usd: string; state: string; generation_id: string | null;
      usage: { mock?: boolean; providerCostMicroUsd?: number } | null
    }>('SELECT * FROM ai_request_ledger WHERE id=$1 FOR UPDATE', [id])
    const row = result.rows[0]
    if (!row) throw new Error('Unknown request')
    if (row.state === 'reconciled') { await client.query('COMMIT'); return { duplicate: true } }
    if (row.state === 'reserved') throw new Error('Request still in flight')
    let actualMicroUsd: number | null = null
    if (test) {
      if (row.usage?.mock !== true) throw new Error('Non-mock usage forbidden in test reconciliation')
      actualMicroUsd = row.usage.providerCostMicroUsd ?? null
    } else {
      if (row.usage?.mock) throw new Error('Mock usage forbidden in live reconciliation')
      if (row.generation_id) {
        const info = await gateway.getGenerationInfo({ id: row.generation_id })
        // Include BYOK upstream spend, not merely the Gateway charge.
        actualMicroUsd = Math.ceil((info.totalCost + (info.isByok ? info.upstreamInferenceCost : 0)) * 1000000)
      }
    }
    const accounting = reconcileAiCost({ reservedMicroUsd: Number(row.reserve_micro_usd), actualMicroUsd, mock: test, environment: test ? 'test' : 'live' })
    const accounts = ['platform', `customer:${row.user_id}`]
    await client.query('SELECT account_id FROM ai_funding_account WHERE account_id=ANY($1::text[]) ORDER BY account_id FOR UPDATE', [accounts])
    if (accounting.freeze) {
      await client.query('UPDATE ai_funding_account SET enabled=false WHERE account_id=ANY($1::text[])', [accounts])
    }
    if (accounting.reconciled) {
      // An overrun remains recorded as actual cost; freeze prevents further
      // spending. Never clamp an overdraft into a fictitious available balance.
      if (accounting.releaseMicroUsd > 0) {
        await client.query('UPDATE ai_funding_account SET available_micro_usd=available_micro_usd+$1 WHERE account_id=ANY($2::text[])', [accounting.releaseMicroUsd, accounts])
      }
      await client.query("UPDATE ai_request_ledger SET state='reconciled',actual_micro_usd=$2,updated_at=now() WHERE id=$1", [id, actualMicroUsd])
    }
    await client.query('COMMIT')
    return accounting
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}
