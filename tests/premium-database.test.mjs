import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { Pool } from 'pg'
import { conversationMessages } from '../lib/conversation-input.ts'
import { loadModule } from './helpers/load-module.mjs'

// Opt in to an isolated LOCAL database only. Never use application DATABASE_URL.
const url = process.env.PREMIUM_TEST_DATABASE_URL
if (url && !['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('Database tests require disposable local PostgreSQL')
test('PostgreSQL premium reservation and delivery lifecycle', { skip: !url }, async t => {
  const schema = 'premium_test_' + randomUUID().replaceAll('-', '')
  const admin = new Pool({ connectionString: url })
  await admin.query(`CREATE SCHEMA ${schema}`)
  const pool = new Pool({ connectionString: url, options: `-c search_path=${schema}`, max: 15 })
  try {
    await pool.query('CREATE TABLE "user" (id text PRIMARY KEY)')
    const migration = readFileSync(new URL('../scripts/premium-trial.sql', import.meta.url), 'utf8')
    await pool.query(migration)
    await pool.query(migration) // additive migration is safely repeatable
    await pool.query(readFileSync(new URL('../scripts/pwa-conversations.sql', import.meta.url), 'utf8'))
    const unifiedMigration = readFileSync(new URL('../scripts/unified-preferences.sql', import.meta.url), 'utf8')
    await pool.query(unifiedMigration); await pool.query(unifiedMigration)
    const usage = loadModule('lib/premium-usage.ts', { 'server-only': {}, 'node:crypto': await import('node:crypto'), '@/lib/db': { pool }, '@/lib/premium-policy': { PREMIUM_TRIAL_USES: 6 } })
    const user = async () => { const id = randomUUID(); await pool.query('INSERT INTO "user" VALUES ($1)', [id]); return id }
    async function successful(id, key, paid = null) {
      const r = await usage.reservePremium(id, key, 'northstar', [{ text: key }], paid)
      await usage.completePremium(r.id, id, 'A usable premium result')
      await usage.acknowledgePremium(r.id, id)
      await pool.query("UPDATE premium_requests SET created_at = now() - interval '5 minutes' WHERE id = $1", [r.id])
      return r
    }
    await t.test('new authenticated account has six credits; six successes work and seventh is blocked', async () => {
      const id = await user()
      assert.deepEqual(await usage.premiumBalance(id), { used: 0, pending: 0, remaining: 6, total: 6 })
      for (let i = 1; i <= 6; i++) {
        await successful(id, `use-${i}`)
        assert.equal((await usage.premiumBalance(id)).remaining, 6 - i)
      }
      await assert.rejects(usage.reservePremium(id, 'seventh', 'northstar', [], null), e => e.code === 'premium_required')
    })
    await t.test('provider failure releases reservation without spending a credit', async () => {
      const id = await user(); const r = await usage.reservePremium(id, 'failed', 'northstar', [], null)
      await usage.failPremium(r.id, id)
      assert.equal((await usage.premiumBalance(id)).remaining, 6)
      assert.equal((await usage.premiumBalance(id)).pending, 0)
      await successful(id, 'retry-new-message')
      assert.equal((await usage.premiumBalance(id)).remaining, 5)
    })
    await t.test('result is not charged before delivery acknowledgement; duplicate acknowledgement charges exactly once', async () => {
      const id = await user(); const r = await usage.reservePremium(id, 'delivery', 'career', [], null)
      await usage.completePremium(r.id, id, 'Full result')
      assert.deepEqual(await usage.premiumBalance(id), { used: 0, pending: 1, remaining: 6, total: 6 })
      const replay = await usage.reservePremium(id, 'delivery', 'career', [], null)
      assert.equal(replay.result, 'Full result'); assert.equal(replay.id, r.id)
      await Promise.all(Array.from({ length: 10 }, () => usage.acknowledgePremium(r.id, id)))
      assert.equal((await usage.premiumBalance(id)).used, 1)
      assert.equal(await usage.acknowledgePremium(r.id, await user()), false)
    })
    await t.test('parallel requests cannot spend the same final credit', async () => {
      const id = await user()
      for (let i = 0; i < 5; i++) await successful(id, `seed-${i}`)
      const calls = await Promise.allSettled(Array.from({ length: 12 }, (_, i) => usage.reservePremium(id, `parallel-${i}`, 'northstar', [], null)))
      assert.equal(calls.filter(c => c.status === 'fulfilled').length, 1)
      const winner = calls.find(c => c.status === 'fulfilled').value
      await usage.completePremium(winner.id, id, 'Sixth result')
      await usage.acknowledgePremium(winner.id, id)
      assert.equal((await usage.premiumBalance(id)).remaining, 0)
    })
    await t.test('duplicate concurrent request is generated once; altered replay is rejected', async () => {
      const id = await user()
      const calls = await Promise.allSettled(Array.from({ length: 8 }, () => usage.reservePremium(id, 'same', 'money', ['same'], null)))
      assert.equal(calls.filter(c => c.status === 'fulfilled').length, 1)
      await assert.rejects(usage.reservePremium(id, 'same', 'money', ['different'], null), e => e.code === 'request_conflict')
    })
    await t.test('stale running lease releases credit and late completion cannot charge', async () => {
      const id = await user(); const r = await usage.reservePremium(id, 'stale', 'northstar', [], null)
      await pool.query("UPDATE premium_requests SET created_at = now() - interval '3 minutes' WHERE id = $1", [r.id])
      const fresh = await usage.reservePremium(id, 'fresh', 'northstar', [], null)
      await assert.rejects(usage.completePremium(r.id, id, 'Too late'))
      await usage.failPremium(fresh.id, id)
      assert.equal((await usage.premiumBalance(id)).remaining, 6)
    })
    await t.test('balances persist across separate module/server instances and remain account-isolated', async () => {
      const id = await user(); await successful(id, 'website')
      const app = loadModule('lib/premium-usage.ts', { 'server-only': {}, 'node:crypto': await import('node:crypto'), '@/lib/db': { pool }, '@/lib/premium-policy': { PREMIUM_TRIAL_USES: 6 } })
      assert.equal((await app.premiumBalance(id)).remaining, 5)
      assert.equal((await app.premiumBalance(await user())).remaining, 6)
      await successful(id, 'app')
      assert.equal((await usage.premiumBalance(id)).remaining, 4)
    })
    await t.test('verified paid reservation bypasses exhausted trial but enforces configured period limit', async () => {
      const id = await user()
      for (let i = 0; i < 6; i++) await successful(id, `trial-${i}`)
      const paid = { period: 'verified-sub:period-1', limit: 2 }
      await successful(id, 'paid-1', paid); await successful(id, 'paid-2', paid)
      await assert.rejects(usage.reservePremium(id, 'paid-3', 'northstar', [], paid), e => e.code === 'paid_limit')
      await assert.rejects(usage.reservePremium(id, 'unpaid', 'northstar', [], null), e => e.code === 'premium_required')
    })
    await t.test('website and PWA read the same persisted preferences, with account isolation and origin enforcement', async () => {
      const id = await user(), other = await user()
      let account = id
      const preferences = loadModule('app/api/preferences/route.ts', {
        '@/lib/session': {getUserSession:async()=>({user:{id:account}})}, '@/lib/db':{pool},
        '@/lib/chat-input':{readChatBody:async r=>r.json(),ChatInputError:class extends Error{}},
      })
      const req = (origin, data) => new Request('https://example.com/api/preferences',{method:'PUT',headers:{origin},body:JSON.stringify(data)})
      assert.equal((await preferences.PUT(req('https://evil.example',{voice:'cedar',auto_save:true}))).status,403)
      assert.equal((await preferences.PUT(req('https://example.com',{voice:'invalid',auto_save:true}))).status,400)
      assert.equal((await preferences.PUT(req('https://example.com',{voice:'cedar',auto_save:true}))).status,200)
      assert.deepEqual(await (await preferences.GET()).json(),{voice:'cedar',auto_save:true})
      account=other; assert.deepEqual(await (await preferences.GET()).json(),{voice:'marin',auto_save:false})
      account=id; assert.deepEqual(await (await preferences.GET()).json(),{voice:'cedar',auto_save:true})
    })
    await t.test('shared history resumes complete premium replies, rejects cross-account writes and stale revisions', async () => {
      const id=await user(), other=await user();let account=id
      const route=loadModule('app/api/conversations/route.ts',{
        '@/lib/session':{getUserSession:async()=>({user:{id:account}})},'@/lib/db':{pool},
        '@/lib/conversation-input':{conversationMessages,MAX_CONVERSATION_BYTES:262144},'@/lib/chat-input':{readChatBody:async r=>r.json(),ChatInputError:class extends Error{}},
      })
      const conversationId=randomUUID()
      const data={id:conversationId,title:'Shared conversation',messages:[{id:'question',role:'user',parts:[{type:'text',text:'A question'}]},{id:'answer',role:'assistant',parts:[{type:'text',text:'A'.repeat(15000)}]}],revision:0}
      const save=()=>route.PUT(new Request('https://example.com/api/conversations',{method:'PUT',headers:{origin:'https://example.com'},body:JSON.stringify(data)}))
      assert.equal((await save()).status,200)
      const loaded=await (await route.GET()).json(); assert.equal(loaded.conversations[0].messages[1].parts[0].text.length,15000)
      assert.equal((await save()).status,200) // update from revision zero
      assert.equal((await save()).status,403) // stale second device cannot overwrite revision one
      data.revision=1;assert.equal((await save()).status,200)
      account=other;assert.deepEqual((await (await route.GET()).json()).conversations,[])
      assert.equal((await save()).status,403)
    })
    await t.test('one voice session shares the last trial slot with text and is charged once, not once per sentence', async()=>{
      const id=await user();for(let i=0;i<5;i++)await successful(id,`text-${i}`)
      const r=await usage.reservePremium(id,'voice-session','live_voice',{session:'one'},null)
      await usage.completePremium(r.id,id,'You: Question one\nGinicci: Answer one\nYou: Question two\nGinicci: Answer two')
      assert.equal((await usage.premiumBalance(id)).pending,1)
      await usage.acknowledgePremium(r.id,id);await usage.acknowledgePremium(r.id,id)
      assert.equal((await usage.premiumBalance(id)).used,6)
      await assert.rejects(usage.reservePremium(id,'next-text','northstar',[],null),e=>e.code==='premium_required')
    })
    await t.test('empty result cannot become a chargeable use', async () => {
      const id = await user(); const r = await usage.reservePremium(id, 'empty', 'northstar', [], null)
      await assert.rejects(usage.completePremium(r.id, id, '   '))
      assert.equal(await usage.acknowledgePremium(r.id, id), false)
      await usage.failPremium(r.id, id)
      assert.equal((await usage.premiumBalance(id)).remaining, 6)
    })
  } finally {
    await pool.end(); await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end()
  }
})
