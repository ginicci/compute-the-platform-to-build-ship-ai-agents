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
    features: [
      "3 concurrent agents",
      "1,000 tasks per month",
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
    features: [
      "25 concurrent agents",
      "50,000 tasks per month",
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
    features: [
      "100 concurrent agents",
      "250,000 tasks per month",
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
    features: [
      "Unlimited agents",
      "Unlimited tasks",
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
