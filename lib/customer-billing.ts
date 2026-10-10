import 'server-only'
import { pool } from '@/lib/db'

/** Caller supplies only the server-authenticated user ID, never client filters. */
export async function customerBillingSummary(userId: string) {
  if (process.env.BILLING_LEDGER_ENABLED !== 'true') return null
  const environment = process.env.BILLING_TEST_MODE === 'true' ? 'test' : 'live'
  const payments = await pool.query<{
    payment_id: string; collected_micro_usd: string; refunded_micro_usd: string;
    disputed_micro_usd: string; settled: boolean; updated_at: Date
  }>(
    `SELECT payment_id,collected_micro_usd,refunded_micro_usd,disputed_micro_usd,settled,updated_at
     FROM billing_payment_snapshot WHERE user_id=$1 AND environment=$2 AND synthetic=false
     ORDER BY updated_at DESC LIMIT 20`, [userId, environment],
  )
  const usage = await pool.query<{ feature: string; state: string; created_at: Date }>(
    'SELECT feature,state,created_at FROM ai_request_ledger WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20', [userId],
  )
  return { environment, payments: payments.rows, usage: usage.rows }
}
