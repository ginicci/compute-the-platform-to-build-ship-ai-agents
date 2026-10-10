import 'server-only'
import { randomUUID } from 'node:crypto'
import { pool } from '@/lib/db'
import { getPlanContext, consumeTask } from '@/lib/plan-limits'
import { aiBillingPolicy, type AiFeature } from '@/lib/ai-billing-policy'
import type { AgentId } from '@/lib/agents'

export class AiBillingError extends Error {
  constructor(public code: string, message: string, public status = 503) { super(message) }
}

export function billingErrorResponse(error: unknown) {
  if (!(error instanceof AiBillingError)) throw error
  return Response.json({ code: error.code, error: error.message }, { status: error.status })
}

/** Shared by EVERY AI route; only server-verified identities and agents accepted. */
export async function reserveAiRequest(user: { id: string; email: string }, feature: AiFeature, agentId?: AgentId) {
  const policy = aiBillingPolicy(process.env, feature)
  if (!policy) throw new AiBillingError('service_unavailable', 'AI service is unavailable while billing protection is configured.')
  const plan = await getPlanContext(user)
  if (agentId && !plan.allowedAgentIds.includes(agentId)) {
    throw new AiBillingError('agent_locked', 'This agent is not included in your plan.', 403)
  }
  const id = randomUUID()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Lock the platform then customer account in consistent order. Serializes
    // reservations across instances, including different routes for one customer.
    const accounts = await client.query<{ account_id: string; available_micro_usd: string; enabled: boolean }>(
      'SELECT * FROM ai_funding_account WHERE account_id = ANY($1::text[]) ORDER BY account_id FOR UPDATE',
      [['platform', `customer:${user.id}`]],
    )
    if (accounts.rows.length !== 2 || accounts.rows.some(row => !row.enabled || BigInt(row.available_micro_usd) < BigInt(policy.reserve))) {
      throw new AiBillingError('usage_funding_required', 'AI allowance is unavailable or awaiting payment reconciliation.', 402)
    }
    const recent = await client.query<{ count: string }>(
      "SELECT count(*) FROM ai_request_ledger WHERE user_id=$1 AND created_at > now() - interval '1 minute'", [user.id],
    )
    if (Number(recent.rows[0].count) >= policy.perMinute) throw new AiBillingError('rate_limit', 'Too many AI requests. Please wait a minute.', 429)
    // Reserved funds remain held on failures/timeouts until cost reconciliation.
    await client.query('UPDATE ai_funding_account SET available_micro_usd=available_micro_usd-$1 WHERE account_id=ANY($2::text[])', [policy.reserve, ['platform', `customer:${user.id}`]])
    await client.query('INSERT INTO ai_request_ledger(id,user_id,feature,reserve_micro_usd) VALUES($1,$2,$3,$4)', [id, user.id, feature, policy.reserve])
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
  // Task quota already uses an atomic upsert. A denied task retains the reserve
  // for explicit reconciliation; never auto-refund uncertain provider charges.
  const limit = Math.min(plan.tasksLimit ?? policy.tasks, policy.tasks)
  if (!(await consumeTask(user.id, plan.period, limit))) {
    await finishAiRequest(id, 'failed')
    throw new AiBillingError('task_limit', 'Monthly AI allowance exhausted.', 429)
  }
  return { id, plan }
}

export async function finishAiRequest(id: string, state: 'completed' | 'failed', usage?: unknown, generationId?: string) {
  await pool.query(
    "UPDATE ai_request_ledger SET state=$2,usage=$3,generation_id=COALESCE($4,generation_id),updated_at=now() WHERE id=$1 AND state='reserved'",
    [id, state, usage ? JSON.stringify(usage) : null, generationId ?? null],
  )
}
