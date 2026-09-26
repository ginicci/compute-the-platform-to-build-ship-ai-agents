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
    features: [
      "1 active agent",
      "Standard AI models",
      "100 tasks per month",
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
    features: [
      "10 active agents",
      "Advanced AI models",
      "5,000 tasks per month",
      "Private integrations",
      "Full audit trails",
      "Email support",
    ],
    cta: "Upgrade to Plus",
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Maximum power for serious ecosystem builders",
    priceInCents: { monthly: 20000, annual: 16000 },
    features: [
      "Unlimited agents",
      "Top-tier AI models",
      "Unlimited tasks",
      "Team workspaces",
      "Custom agent roles",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
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
