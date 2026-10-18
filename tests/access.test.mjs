import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { installPlatform, installedDisplay } from '../lib/install-state.ts'
import { AGENTS, systemPromptFor } from '../lib/agents.ts'
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
test('installation guidance recognizes iPhone, iPad desktop UA, Android and desktop without assuming install support', () => {
  assert.equal(installPlatform('iPhone', 'iPhone', 5), 'ios')
  assert.equal(installPlatform('Macintosh', 'MacIntel', 5), 'ios')
  assert.equal(installPlatform('Android', 'Linux', 5), 'android')
  assert.equal(installPlatform('Macintosh', 'MacIntel', 0), 'desktop')
  assert.equal(installPlatform('Firefox', 'Linux', 0), 'desktop')
  assert.equal(installedDisplay(false,false,false), false)
  for(const values of [[true,false,false],[false,true,false],[false,false,true]]) assert.equal(installedDisplay(...values),true)
})
test('shared installation controller consumes browser prompt once and cleans up subscriptions',()=>{
  const source=read('components/access/install-provider.tsx')
  assert.match(source,/beforeinstallprompt/);assert.match(source,/appinstalled/)
  assert.ok(source.indexOf('pending.current = null; setCanPrompt(false); setBusy(true)') < source.indexOf('await prompt.prompt()'))
  assert.match(source,/removeEventListener\('beforeinstallprompt'/)
  assert.match(source,/serviceWorker.register\('\/pwa-sw.js'/)
  assert.doesNotMatch(source,/localStorage|sessionStorage|getInstalledRelatedApps/)
  assert.match(read('components/access/app-access.tsx'),/if \(state.canPrompt\)/)
})
test('visible entry points and all new internal links resolve to existing routes',()=>{
  const paths=['components/access/app-access.tsx','components/access/chat-navigation.tsx','app/install/page.tsx','app/help/page.tsx']
  for(const path of paths) {
    for(const [,href] of read(path).matchAll(/href="(\/[^"#?]*)"/g)) {
      assert.ok(href==='/'||existsSync(new URL('../app'+href+'/page.tsx',import.meta.url)),`${path}: missing route ${href}`)
    }
  }
  const home=read('app/page.tsx');assert.match(home,/<AppAccess \/>/)
  const access=read('components/access/app-access.tsx')
  for(const label of ['Open the App','Use the Website','Install the App'])assert.ok(access.includes(label))
  for(const ui of ['components/pwa/assistant.tsx','components/onboarding/onboarding-agent.tsx']) {
    assert.match(read(ui),/<ChatNavigation/);assert.match(read(ui),/New conversation|New chat/)
  }
})
test('all agents share warm non-dependent honest behavior without forced intake',()=>{
  for(const agent of AGENTS){
    const prompt=systemPromptFor(agent)
    assert.match(prompt,/warm, grounded conversational style/)
    assert.match(prompt,/Avoid canned greetings/)
    assert.match(prompt,/emotional dependency/)
    assert.match(prompt,/Be honest that you are an AI/)
    assert.match(prompt,/never claim memories or preferences that were not provided/)
  }
  assert.match(AGENTS[0].focus,/do not force a business intake/)
  assert.match(read('app/api/voice/realtime/route.ts'),/comfortable pacing and natural pauses/)
})
test('app-wide installation metadata and zoom accessibility are preserved',()=>{
  const layout=read('app/layout.tsx');assert.match(layout,/manifest: '\/manifest.webmanifest'/)
  assert.match(layout,/apple-touch-icon.png/);assert.match(layout,/<InstallProvider>/)
  assert.doesNotMatch(layout,/maximumScale: 1/)
  assert.match(read('components/access/app-access.tsx'),/not reliably inspect every app installed/)
  assert.match(read('app/help/page.tsx'),/Unsaved drafts do not move automatically/)
})

test('homepage decorative pattern stays deterministic across server rendering and hydration',()=>{
  assert.doesNotMatch(read('components/landing/testimonials-section.tsx'),/Math.random/);
})
