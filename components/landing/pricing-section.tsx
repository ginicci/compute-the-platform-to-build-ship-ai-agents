import { PricingCards, type PricingPlan } from './pricing-cards'
import { pricedPlans } from '@/lib/premium-billing'
import { TIERS } from '@/lib/tiers'
export async function PricingSection() {
  const configured = await pricedPlans().catch(() => [])
  const plans: PricingPlan[] = [{
    ...TIERS[0], limits: { agents: 9, tasksPerMonth: 6 }, trialDays: 0,
    features: ['Six successful premium uses per account', 'All nine specialist agents during trial', 'Same premium model and output quality', 'Free browsing and saved results', 'No card required'],
  }]
  for (const tier of TIERS.slice(1)) {
    const monthly = configured.find(p => p.tier_id === tier.id && p.interval === 'monthly')
    const annual = configured.find(p => p.tier_id === tier.id && p.interval === 'annual')
    // Existing artwork/layout retained; do not advertise unconfigured or non-USD prices as dollars.
    if ((!monthly && !annual) || (monthly && monthly.currency !== 'usd') || (annual && annual.currency !== 'usd')) continue
    plans.push({ ...tier, trialDays: 0, cta: 'Compare Premium plans',
      priceInCents: { monthly: monthly?.amount ?? null, annual: annual ? annual.amount / 12 : null },
      features: ['All nine specialist agents', 'Same premium model and output quality', 'Shared account access on website and PWA', 'Configured usage allowance shown at checkout', 'Secure billing management and cancellation'],
    })
  }
  return <PricingCards plans={plans} />
}
