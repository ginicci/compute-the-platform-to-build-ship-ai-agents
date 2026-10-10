import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import manifest from '../app/manifest.ts'
const read = p => readFileSync(new URL('../'+p, import.meta.url), 'utf8')
test('manifest launches dedicated Ginicci app with actual PNG dimensions', () => {
 const m = manifest(); assert.equal(m.name, 'Ginicci'); assert.equal(m.start_url, '/assistant'); assert.equal(m.display, 'standalone')
 for (const icon of m.icons) { const bytes = readFileSync(new URL('../public'+icon.src, import.meta.url)); const size = Number(icon.sizes.split('x')[0]); assert.equal(bytes.readUInt32BE(16),size); assert.equal(bytes.readUInt32BE(20),size) }
})
test('worker only caches public allowlist and never conversations', () => {
 const sw = read('public/pwa-sw.js'); assert.match(sw, /STATIC.includes\(url.pathname\)/); assert.doesNotMatch(sw, /cache.put|caches.match\('\/api|localStorage/)
 const ui = read('components/pwa/assistant.tsx'); assert.doesNotMatch(ui, /localStorage|sessionStorage|apiKey|generateText/); assert.match(ui, /speechSynthesis/); assert.match(ui, /setHistory\(\[\]\)/)
})
function load(mocks) { const exports = {}; const js = ts.transpileModule(read('app/api/conversations/route.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText; new Function('require','exports',js)(n => mocks[n], exports); return exports }
test('guest history is rejected before database read or write', async () => {
 let queries=0; const route=load({ '@/lib/session': {getUserSession:async()=>null}, '@/lib/db': {pool:{query:async()=>{queries++}}}, '@/lib/chat-input':{} })
 assert.equal((await route.GET()).status,401); assert.equal((await route.PUT(new Request('https://example.com'))).status,401); assert.equal(queries,0)
})
test('returning user sees only their own server-filtered history, never shared cache',async()=>{
 let values; const route=load({ '@/lib/session': {getUserSession:async()=>({user:{id:'returning-user'}})}, '@/lib/db': {pool:{query:async(sql,v)=>{assert.match(sql,/WHERE user_id = \$1/); values=v; return {rows:[{id:'own-chat'}]}}}}, '@/lib/chat-input':{} })
 const response=await route.GET(); assert.equal(response.status,200); assert.deepEqual(values,['returning-user']); assert.match(response.headers.get('cache-control'),/no-store/)
})
test('history writes require matching origin; auth session persistence preserved',async()=>{
 const route=load({'@/lib/session':{getUserSession:async()=>({user:{id:'user'}})}, '@/lib/db':{}, '@/lib/chat-input':{}})
 assert.equal((await route.PUT(new Request('https://example.com/api/conversations',{method:'PUT',headers:{origin:'https://evil.example'}}))).status,403)
 const auth=read('lib/auth.ts'); assert.match(auth,/expiresIn: 60 \* 60 \* 24 \* 7/); assert.match(auth,/revokeSessionsOnPasswordReset: true/)
})
import { databaseTarget } from '../lib/database-target.ts'
test('preview cannot inherit production database; isolated DB explicit only', () => {
 assert.equal(databaseTarget({VERCEL_ENV:'preview',DATABASE_URL:'production'}),'postgresql://localhost:5432/ginicci_preview_disabled')
 assert.equal(databaseTarget({VERCEL_ENV:'preview',DATABASE_URL:'production',GINICCI_PWA_ISOLATED_DATABASE_URL:'isolated'}),'isolated')
 assert.equal(databaseTarget({VERCEL_ENV:'production',DATABASE_URL:'production'}),'production')
})
