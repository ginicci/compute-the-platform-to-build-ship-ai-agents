// Source of truth for Northstar subscription tiers.
// Prices are stored server-side (in cents) and validated on the server.
// Clients only ever send a tier id and billing interval — never a price.

export type BillingInterval = "monthly" | "annual"

export interface Tier {
  id: string
  name: string
  description: string
  // Price in cents per month for each billing interval.
  priceInCents: Record<BillingInterval, number>
}

export const TIERS: Tier[] = [
  {
    id: "explorer",
    name: "Explorer",
    description: "A focused entry point into the Northstar ecosystem",
    priceInCents: { monthly: 1900, annual: 1500 },
  },
  {
    id: "builder",
    name: "Builder",
    description: "A deeper operating layer for active founders and professionals",
    priceInCents: { monthly: 7900, annual: 6500 },
  },
  {
    id: "catalyst",
    name: "Catalyst",
    description: "High-touch support for ambitious ecosystem builders",
    priceInCents: { monthly: 19900, annual: 16500 },
  },
]

export function getTier(id: string): Tier | undefined {
  return TIERS.find((tier) => tier.id === id)
}
