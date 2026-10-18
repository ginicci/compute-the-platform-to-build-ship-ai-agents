// Run against a LOCAL Next.js development/test server only; never signs in or calls AI.
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
const require=createRequire(import.meta.url)
const {chromium}=require('playwright')
const base=process.env.ACCESS_APP_ORIGIN
if(!base||!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('Set ACCESS_APP_ORIGIN to a local test app')
const packaged=process.env.ACCESS_PACKAGED_CHROMIUM==='true'?require('@sparticuz/chromium').default:null
const browser=await chromium.launch(packaged?{headless:true,executablePath:await packaged.executablePath(),args:packaged.args.filter(a=>a!=='--single-process')}:{headless:true})
let passed=0
try{
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
    const page=await browser.newPage({viewport});page.setDefaultTimeout(60000)
    console.log(`Checking homepage at ${viewport.width}px`)
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000})
    console.log('Loaded homepage; checking access panel')
    await page.getByRole('heading',{name:'Ginicci, one tap away.'}).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'homepage must not overflow horizontally')
    await page.getByRole('link',{name:'Sign in',exact:true}).waitFor()
    console.log('Opening app')
    await page.getByRole('link',{name:'Start chatting free',exact:true}).first().click()
    console.log('Waiting for assistant route')
    await page.waitForURL('**/assistant', {waitUntil:'domcontentloaded'});await page.getByRole('textbox',{name:'Message Ginicci'}).waitFor()
    await page.getByText('Guest demo: 2 mock messages per visit',{exact:false}).waitFor()
    await page.getByRole('textbox',{name:'Message Ginicci'}).fill('A local guest demonstration')
    await page.getByRole('button',{name:'Send',exact:true}).click()
    await page.getByText('You’re trying a preview of the chat interface',{exact:false}).waitFor()
    await page.getByRole('button',{name:'New chat',exact:true}).click()
    assert.equal(await page.getByText('A local guest demonstration',{exact:true}).count(),0)
    await page.getByRole('navigation',{name:'Ginicci navigation'}).getByRole('link',{name:'Help',exact:true}).click()
    await page.getByRole('heading',{name:'Let’s make this easy'}).waitFor()
    await page.getByRole('link',{name:'device-specific guide',exact:true}).click()
    await page.getByRole('heading',{name:'Ginicci, one tap away'}).waitFor()
    assert.equal(await page.getByRole('button',{name:'Install the App',exact:true}).count(),0)
    await page.goto(base+'/pricing',{waitUntil:'domcontentloaded'})
    await page.getByRole('heading',{name:'Try it first. Choose more when it helps.'}).waitFor()
    await page.getByText('Subscription prices are not configured for testing yet.',{exact:false}).waitFor()
    assert.equal(await page.locator('a[href^="/checkout?"]').count(),0)
    await page.goto(base+'/checkout?plan=plus&interval=monthly',{waitUntil:'domcontentloaded'})
    await page.waitForURL('**/sign-in',{waitUntil:'domcontentloaded'})
    await page.goto(base+'/install',{waitUntil:'domcontentloaded'})
    await page.getByRole('link',{name:'Use the Website',exact:true}).click()
    await page.waitForURL('**/sign-in', {waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:/sign in|welcome back/i}).first().waitFor()
    await page.close();console.log(`PASS actual local Next.js public routes, guest chat/reset, unavailable pricing and unauthenticated checkout/website redirects at ${viewport.width}px`);passed++
  }
  console.log(`${passed} local application browser flows passed; no account/provider/OS installation tests performed.`)
}finally{await browser.close()}
