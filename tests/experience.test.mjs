import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
test('tree homepage retains original composition and current honest access paths', () => {
  const home = read('app/page.tsx')
  for (const component of ['Navigation', 'HeroSection', 'FeaturesSection', 'HowItWorksSection', 'InfrastructureSection', 'MetricsSection', 'IntegrationsSection', 'AgentStackSection', 'SecuritySection', 'DevelopersSection', 'TestimonialsSection', 'PricingSection', 'CtaSection', 'FooterSection']) assert.ok(home.includes(`<${component} />`), component)
  for (const label of ['Skip to content', 'Unsaved drafts do not sync', '<AppAccess />', '<PremiumAccessBanner />', 'not verified performance']) assert.ok(home.includes(label), label)
  const access = read('components/access/app-access.tsx')
  for (const label of ['Start chatting free', 'Explore Premium', 'Guest replies are labeled demos']) assert.ok(access.includes(label), label)
  assert.match(read('components/landing/hero-section.tsx'), /bg-hero-0BnFGdr81Ifnj3WbBZoNt1KE4D5DMT\.mp4/)
  assert.match(read('components/landing/testimonials-section.tsx'), /not customer testimonials/)
  assert.match(read('components/landing/metrics-section.tsx'), /not measured performance/)
  assert.doesNotMatch(read('components/landing/cta-section.tsx'), /14-day/)
})
test('installation remains feature-detected and shows only relevant device help by default', () => {
  const source = read('components/access/app-access.tsx')
  assert.match(source, /Add Ginicci to your home screen for quick access. No app-store download needed./)
  assert.match(source, /<DeviceGuide platform=\{state.platform\}/)
  assert.match(source, /<details><summary[^>]*>Instructions for another device/)
  assert.match(source, /if \(state.canPrompt\)/)
})
test('trial balance separates reservations from charges without premature upgrade pressure', () => {
  const source = read('components/premium/access-banner.tsx')
  assert.match(source, /balance.remaining === 0/)
  assert.doesNotMatch(source, /remaining <= 2|Enjoying Premium|experienced the power/)
  assert.match(source, /reserved, not yet charged/)
  assert.match(source, /session counts once, not per sentence/)
})
test('comparison uses configured offers, states limits and renewal instead of promising unimplemented features', () => {
  const source = read('app/pricing/page.tsx')
  assert.match(source, /await pricedPlans\(\)/)
  assert.match(source, /plan.tasks_per_period/)
  assert.match(source, /allowance covers the whole year/)
  assert.match(source, /renew automatically until canceled/)
  assert.match(source, /sandbox-only/)
  assert.match(source, /team workspaces are not included/)
})

test('restored pricing catches unavailable billing module initialization on unconfigured previews', () => {
  const source = read('components/landing/pricing-section.tsx')
  assert.doesNotMatch(source, /import \{ pricedPlans \} from/)
  assert.match(source, /import\('@\/lib\/premium-billing'\)\.then/)
  assert.match(source, /\.catch\(\(\) => \[\]\)/)
})
