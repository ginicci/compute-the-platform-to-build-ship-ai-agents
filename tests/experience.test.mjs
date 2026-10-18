import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
test('homepage leads with honest free chat, accessible account and Premium paths, not fabricated proof', () => {
  const home = read('app/page.tsx')
  for (const label of ['Start chatting free', 'Sign in', 'Explore Premium', 'Skip to content', 'Guest replies are labeled demos', 'Unsaved drafts do not sync']) assert.ok(home.includes(label), label)
  assert.doesNotMatch(home, /TestimonialsSection|MetricsSection|InfrastructureSection|10x|99\.9%/)
  assert.match(home, /href="\/assistant"/)
  assert.match(home, /<AppAccess \/>/)
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
