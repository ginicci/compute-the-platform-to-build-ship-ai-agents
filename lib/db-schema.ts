import { bigserial, boolean, integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'

// Better Auth owns this table; only the columns the app reads are declared.
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  createdAt: timestamp('createdAt').notNull(),
})

export const subscription = pgTable('subscription', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  stripeCustomerId: text('stripeCustomerId').notNull(),
  tierId: text('tierId').notNull(),
  interval: text('interval').notNull(),
  status: text('status').notNull(),
  currentPeriodEnd: timestamp('currentPeriodEnd', { withTimezone: true }),
  trialEnd: timestamp('trialEnd', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancelAtPeriodEnd').notNull().default(false),
  amountCents: integer('amountCents').notNull().default(0),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export type SubscriptionRow = typeof subscription.$inferSelect

export const agentUsage = pgTable(
  'agent_usage',
  {
    userId: text('userId').notNull(),
    period: text('period').notNull(),
    tasks: integer('tasks').notNull().default(0),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.period] })],
)

export const legalConsent = pgTable('legal_consent', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: text('userId').notNull(),
  termsVersion: text('termsVersion').notNull(),
  context: text('context').notNull(),
  detail: text('detail'),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
})

export const activityLog = pgTable('activity_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: text('userId').notNull(),
  event: text('event').notNull(),
  agentId: text('agentId'),
  detail: text('detail'),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
})

// Additive premium migration lives in scripts/premium-trial.sql. Better Auth's
// user IDs remain authoritative; no second identity or subscription system.
export const premiumRequest = pgTable('premium_requests', {
  id: uuid('id').primaryKey(),
  userId: text('user_id').notNull(),
  requestKey: text('request_key').notNull(),
  inputHash: text('input_hash').notNull(),
  feature: text('feature').notNull(),
  entitlement: text('entitlement').notNull(),
  billingPeriod: text('billing_period').notNull(),
  state: text('state').notNull(),
  result: text('result'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
})
export const premiumPlan = pgTable('premium_plans', {
  tierId: text('tier_id').notNull(),
  interval: text('interval').notNull(),
  stripePriceId: text('stripe_price_id').notNull(),
  tasksPerPeriod: integer('tasks_per_period').notNull(),
  enabled: boolean('enabled').notNull().default(false),
}, table => [primaryKey({ columns: [table.tierId, table.interval] })])
