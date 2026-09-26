import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

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
