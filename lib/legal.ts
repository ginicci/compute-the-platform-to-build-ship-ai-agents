import 'server-only'

import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { activityLog, legalConsent } from '@/lib/db-schema'

// Bump this whenever the Terms, Refund Policy, or Privacy Policy change materially.
// Customers are asked to agree again before their next use.
export const TERMS_VERSION = '2026-09-26'

export type ConsentContext = 'sign_up' | 'app_access' | 'checkout'

export async function requestMeta() {
  const h = await headers()
  const ipAddress = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null
  const userAgent = h.get('user-agent')?.slice(0, 500) || null
  return { ipAddress, userAgent }
}

export async function recordConsent(userId: string, context: ConsentContext, detail?: string) {
  const meta = await requestMeta()
  await db.insert(legalConsent).values({
    userId,
    termsVersion: TERMS_VERSION,
    context,
    detail: detail ?? null,
    ...meta,
  })
}

export async function hasCurrentConsent(userId: string) {
  const rows = await db
    .select({ id: legalConsent.id })
    .from(legalConsent)
    .where(and(eq(legalConsent.userId, userId), eq(legalConsent.termsVersion, TERMS_VERSION)))
    .limit(1)
  return rows.length > 0
}

export async function logActivity(entry: {
  userId: string
  event: string
  agentId?: string | null
  detail?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}) {
  try {
    await db.insert(activityLog).values({
      userId: entry.userId,
      event: entry.event,
      agentId: entry.agentId ?? null,
      detail: entry.detail ?? null,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent?.slice(0, 500) ?? null,
    })
  } catch (error) {
    // Logging must never block the customer's request.
    console.error('Could not write activity log', error)
  }
}
