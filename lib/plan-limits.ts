import 'server-only'

import { and, eq, lt, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { agentUsage } from '@/lib/db-schema'
import { agentIdsForLimit, type AgentId } from '@/lib/agents'
import { isOwnerEmail } from '@/lib/owner'
import { TIERS, type Tier } from '@/lib/tiers'

const FREE_TIER = TIERS[0]

export type PlanContext = {
  tier: Tier
  isOwner: boolean
  allowedAgentIds: AgentId[]
  tasksLimit: number | null
  tasksUsed: number
  period: string
}

function currentPeriod() {
  return new Date().toISOString().slice(0, 7)
}

export async function getPlanContext(user: { id: string; email: string }): Promise<PlanContext> {
  const isOwner = isOwnerEmail(user.email)
  const tier = FREE_TIER

  const period = currentPeriod()
  const [row] = await db
    .select({ tasks: agentUsage.tasks })
    .from(agentUsage)
    .where(and(eq(agentUsage.userId, user.id), eq(agentUsage.period, period)))
    .limit(1)

  return {
    tier,
    isOwner,
    allowedAgentIds: agentIdsForLimit(tier.limits.agents),
    tasksLimit: Math.min(tier.limits.tasksPerMonth ?? 5, 5),
    tasksUsed: row?.tasks ?? 0,
    period,
  }
}

// Atomically counts one task. Returns false when the monthly limit is already reached,
// so concurrent requests can never push usage past the limit.
export async function consumeTask(userId: string, period: string, limit: number | null) {
  if (limit !== null && limit <= 0) return false
  const rows = await db
    .insert(agentUsage)
    .values({ userId, period, tasks: 1 })
    .onConflictDoUpdate({
      target: [agentUsage.userId, agentUsage.period],
      set: { tasks: sql`${agentUsage.tasks} + 1`, updatedAt: new Date() },
      ...(limit === null ? {} : { setWhere: lt(agentUsage.tasks, limit) }),
    })
    .returning({ tasks: agentUsage.tasks })
  return rows.length > 0
}
