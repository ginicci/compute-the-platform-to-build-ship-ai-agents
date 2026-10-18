// Optional browser suite: requires playwright and esbuild in the runner's module path.
// Tests real React components in a local fixture, NOT OS installation or live account endpoints.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
const require = createRequire(import.meta.url)
const { build } = require('esbuild')
const { chromium } = require('playwright')
const root = path.resolve(import.meta.dirname, '../..')
const temp = await mkdtemp(path.join(tmpdir(), 'ginicci-access-'))
const entry = `
import React from 'react'; import {createRoot} from 'react-dom/client';
import {InstallProvider} from './components/access/install-provider';
import {AppAccess} from './components/access/app-access';
import {ChatNavigation} from './components/access/chat-navigation';
import InstallPage from './app/install/page'; import HelpPage from './app/help/page';
const route=location.pathname;
createRoot(document.getElementById('root')).render(<InstallProvider>{route==='/install'?<InstallPage/>:route==='/help'?<HelpPage/>:<><ChatNavigation/><AppAccess/></>}</InstallProvider>);
`
await build({ stdin: { contents: entry, resolveDir: root, loader: 'tsx' }, outfile: path.join(temp, 'bundle.js'), bundle: true, platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"test"' }, plugins: [{ name: 'next-fixture', setup(b) {
  b.onResolve({ filter: /^next\/(link|navigation)$/ }, args => ({ path: args.path, namespace: 'next-fixture' }))
  b.onLoad({ filter: /.*/, namespace: 'next-fixture' }, args => ({ loader: 'jsx', resolveDir: root, contents: args.path==='next/link' ? `import React from 'react';export default function Link({href,children,...p}){return <a href={href} {...p}>{children}</a>}` : `export const usePathname=()=>location.pathname` }))
} }] })
const server = createServer(async (req,res) => {
  if(req.url==='/bundle.js'){res.setHeader('Content-Type','text/javascript');res.end(await readFile(path.join(temp,'bundle.js')));return}
  if(req.url==='/pwa-sw.js'){res.setHeader('Content-Type','text/javascript');res.end('');return}
  res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body><div id="root"></div><script src="/bundle.js"></script></body></html>')
})
await new Promise(r=>server.listen(0,'127.0.0.1',r))
const base=`http://127.0.0.1:${server.address().port}`
const packaged = process.env.ACCESS_PACKAGED_CHROMIUM === 'true' ? require('@sparticuz/chromium').default : null
const browser=await chromium.launch(packaged ? { headless: true, executablePath: await packaged.executablePath(), args: packaged.args.filter(arg => arg !== '--single-process') } : { headless: true })
let passed=0
async function scenario(name,settings,run){const context=await browser.newContext(settings);const page=await context.newPage();try{await run(page);console.log('PASS '+name);passed++}finally{await context.close()}}
try{
  await scenario('Desktop: real links, no unsupported install button, manual fallback',{},async page=>{
    await page.goto(base)
    assert.equal(await page.getByRole('button',{name:'Install the App',exact:true}).count(),0)
    await page.getByRole('link',{name:'Install the App — how to',exact:true}).click()
    await page.getByRole('heading',{name:'Desktop',exact:true}).waitFor()
    await page.getByRole('link',{name:'Open the App',exact:true}).click();assert.equal(new URL(page.url()).pathname,'/assistant')
    await page.getByRole('link',{name:'Use the Website',exact:true}).first().click();assert.equal(new URL(page.url()).pathname,'/onboarding')
    await page.getByRole('link',{name:'Help',exact:true}).click();await page.getByRole('heading',{name:'Let’s make this easy'}).waitFor()
  })
  for(const outcome of ['accepted','dismissed','error'])await scenario('Prompt lifecycle: '+outcome,{},async page=>{
    await page.goto(base);await page.getByRole('heading',{name:'A little clarity. A good conversation. Your next step.'}).waitFor()
    await page.evaluate(result=>{
      window.prompts=0
      const event=new Event('beforeinstallprompt',{cancelable:true})
      event.prompt=async()=>{window.prompts++;if(result==='error')throw Error('blocked')}
      event.userChoice=Promise.resolve({outcome:result==='accepted'?'accepted':'dismissed'})
      window.dispatchEvent(event)
    },outcome)
    await page.getByRole('button',{name:'Install the App',exact:true}).click()
    await page.getByRole('status').waitFor()
    assert.equal(await page.evaluate(()=>window.prompts),1)
    assert.equal(await page.getByRole('button',{name:'Install the App',exact:true}).count(),0)
    const notice=await page.getByRole('status').textContent()
    assert.match(notice,outcome==='accepted'?/accepted/:outcome==='dismissed'?/No problem/:/could not open/)
  })
  await scenario('iPhone: manual Safari instructions, never a fake native install prompt',{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',viewport:{width:390,height:844},isMobile:true,hasTouch:true},async page=>{
    await page.goto(base+'/install');await page.getByText('On iPhone or iPad, use the manual steps below.',{exact:false}).waitFor()
    assert.equal(await page.getByRole('button',{name:'Install the App',exact:true}).count(),0)
    await page.getByText('Tap Share (the square with an arrow).',{exact:false}).waitFor()
  })
  await scenario('Android: menu guidance with website fallback',{userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36',viewport:{width:412,height:915},isMobile:true,hasTouch:true},async page=>{
    await page.goto(base+'/install');await page.getByText('On Android, use the install button if your browser offers it,',{exact:false}).waitFor()
    assert.equal(await page.getByRole('button',{name:'Install the App',exact:true}).count(),0)
  })
  await scenario('Installed iOS display: continue action and no reinstall prompt',{},async page=>{
    await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}))
    await page.goto(base);await page.getByText('You’re using the app',{exact:true}).waitFor()
    await page.getByRole('link',{name:'Continue in the App',exact:true}).waitFor()
    assert.equal(await page.getByRole('link',{name:'Install the App — how to',exact:true}).count(),0)
  })
  await scenario('appinstalled hides deferred prompt without pretending browser tab is an app window',{},async page=>{
    await page.goto(base);await page.getByRole('heading',{name:'A little clarity. A good conversation. Your next step.'}).waitFor()
    await page.evaluate(()=>{const e=new Event('beforeinstallprompt');e.prompt=async()=>{};e.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(e)})
    await page.getByRole('button',{name:'Install the App',exact:true}).waitFor()
    await page.evaluate(()=>window.dispatchEvent(new Event('appinstalled')))
    await page.getByRole('status').waitFor();assert.equal(await page.getByRole('button',{name:'Install the App',exact:true}).count(),0)
    assert.equal(await page.getByText('You’re using the app',{exact:true}).count(),0)
  })
  console.log(`${passed} browser scenarios passed (Chromium, synthetic install events/device emulation; no OS install performed).`)
}finally{await browser.close();await new Promise(r=>server.close(r));await rm(temp,{recursive:true,force:true})}
