// Source of truth for Northstar subscription tiers, used by both the pricing
// page and the server-side checkout. Prices are in cents and only ever read on
// the server for billing — clients send a tier id and interval, never a price.

export type BillingInterval = "monthly" | "annual"

export interface Tier {
  id: string
  name: string
  description: string
  // Price in cents per month for each billing interval (annual is the per-month equivalent).
  priceInCents: Record<BillingInterval, number>
  trialDays: number
  // null means unlimited. Enforced server-side in lib/plan-limits.ts.
  limits: { agents: number | null; tasksPerMonth: number | null }
  features: string[]
  cta: string
  highlight: boolean
}

export const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    description: "Try Northstar and see what your agents can do",
    priceInCents: { monthly: 0, annual: 0 },
    trialDays: 0,
    limits: { agents: 3, tasksPerMonth: 5 },
    features: [
      "3 concurrent agents",
      "5 text requests total during launch; 3/day",
      "Standard AI models",
      "Basic logging",
      "Public integrations",
      "Community support",
    ],
    cta: "Get started free",
    highlight: false,
  },
  {
    id: "plus",
    name: "Plus",
    description: "For founders and professionals building every day",
    priceInCents: { monthly: 2000, annual: 1600 },
    trialDays: 14,
    limits: { agents: 25, tasksPerMonth: 100 },
    features: [
      "25 concurrent agents",
      "100 tasks per month (proposed; not available)",
      "Advanced AI models",
      "Custom agent roles",
      "Team workspaces",
      "Private integrations",
      "Full audit trails",
      "Priority support",
    ],
    cta: "Start free trial",
    highlight: true,
  },
  {
    id: "team",
    name: "Team",
    description: "For growing teams running agents across the business",
    priceInCents: { monthly: 6000, annual: 4800 },
    trialDays: 14,
    limits: { agents: 100, tasksPerMonth: 300 },
    features: [
      "100 concurrent agents",
      "300 tasks per month (proposed; not available)",
      "Everything in Plus",
      "Shared agent library",
      "Role-based access for teammates",
      "Usage analytics",
      "Priority support",
    ],
    cta: "Start free trial",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Maximum power for serious ecosystem builders",
    priceInCents: { monthly: 20000, annual: 16000 },
    trialDays: 7,
    limits: { agents: 100, tasksPerMonth: 1000 },
    features: [
      "Up to 100 agents",
      "1,000 tasks per month (proposed; not available)",
      "Top-tier AI models",
      "Custom LLM routing",
      "Dedicated compute",
      "Advanced security",
      "SLA guarantee",
      "24/7 dedicated support",
    ],
    cta: "Start free trial",
    highlight: false,
  },
]

export function getTier(id: string): Tier | undefined {
  return TIERS.find((tier) => tier.id === id)
}

export function isPaidTier(tier: Tier) {
  return tier.priceInCents.monthly > 0
}

export function formatDollars(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}
