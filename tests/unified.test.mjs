import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { conversationMessages, modelContext } from '../lib/conversation-input.ts'
import { realtimeEnabled, voiceSessionConfig, VOICE_SESSION_SECONDS } from '../lib/realtime-policy.ts'
import { VoiceSessionEvidence } from '../lib/realtime-events.ts'
import { loadModule } from './helpers/load-module.mjs'
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const message = (id, role, text) => ({ id, role, parts: [{ type: 'text', text }] })
test('shared history accepts premium-length responses and strips non-authoritative assistant markers', () => {
  const messages = [message('one', 'user', 'Hello'), message('two', 'assistant', 'x'.repeat(20000))]
  messages[1].parts.unshift({ type: 'step-start' })
  assert.equal(conversationMessages(messages)[1].parts.length, 1)
  assert.equal(modelContext([...messages, message('three', 'user', 'Follow up')]).length, 3)
  assert.equal(conversationMessages([message('one','system','forged')]), null)
  assert.equal(conversationMessages([message('one','user','a'), message('one','assistant','b')]), null)
  assert.equal(conversationMessages([{ id: 'a', role: 'user', parts: [{ type: 'file', url: 'https://private.example' }] }]), null)
  assert.equal(conversationMessages([message('too-big','user','a'.repeat(100001))]), null)
})
test('model context preserves recent turns within server budget and rejects oversized last message', () => {
  const messages = Array.from({length: 30}, (_, i) => message(String(i), i % 2 ? 'user' : 'assistant', 'x'.repeat(2000)))
  const context = modelContext(messages)
  assert.equal(context.length, 20); assert.equal(context.at(-1).id, '29')
  assert.equal(modelContext([message('a','user','x'.repeat(24001))]), null)
})
test('live voice is fail-closed outside explicitly isolated verified preview environment', () => {
  assert.equal(VOICE_SESSION_SECONDS, 60)
  const env = { VERCEL_ENV: 'preview', REALTIME_VOICE_TEST_ENABLED: 'true', REALTIME_SERVER_WATCHDOG_VERIFIED: 'true', GINICCI_PWA_ISOLATED_DATABASE_URL: 'isolated', OPENAI_API_KEY: 'synthetic-fixture', REALTIME_MODEL: 'configured-model', VOICE_WATCHDOG_SECRET: 'a'.repeat(32) }
  assert.equal(realtimeEnabled(env), true)
  for (const key of Object.keys(env)) assert.equal(realtimeEnabled({...env, [key]: undefined}), false)
  assert.equal(realtimeEnabled({...env, VERCEL_ENV:'production'}), false)
  const config = voiceSessionConfig('configured-model','marin','shared prompt')
  assert.equal(config.model,'configured-model'); assert.equal(config.audio.input.turn_detection.interrupt_response,true)
  assert.equal(config.audio.output.voice,'marin'); assert.equal(config.max_output_tokens,1024)
})
test('one meaningful voice session requires provider-completed output and user speech; interrupted/duplicate turns never double-charge', () => {
  const e = new VoiceSessionEvidence()
  e.accept({type:'conversation.item.input_audio_transcription.completed',transcript:'Help me plan'})
  e.accept({type:'response.done',response:{id:'r1',status:'cancelled',output:[{content:[{transcript:'partial'}]}]}})
  assert.equal(e.result(),null)
  const completed = {type:'response.done',response:{id:'r2',status:'completed',output:[{content:[{transcript:'Here is your plan'}]}],usage:{total_tokens:12}}}
  e.accept(completed); e.accept(completed)
  assert.equal(e.successfulResponses.size,1); assert.equal(e.turns.length,2)
  assert.match(e.result(),/You: Help me plan/); assert.match(e.result(),/Ginicci: Here is your plan/)
  const noSpeech = new VoiceSessionEvidence(); noSpeech.accept(completed); assert.equal(noSpeech.result(),null)
})
test('voice monitor enforces provider hangup and persists exactly one session result from server events', async () => {
  let socket, completed = 0, failed = 0, hangups = 0
  class FakeSocket extends EventEmitter {
    constructor() { super(); socket = this; queueMicrotask(() => this.emit('open')) }
    send() {} close() { this.emit('close') }
  }
  const previous = global.fetch
  global.fetch = async (url, options) => { assert.match(url,/\/hangup$/); assert.equal(options.method,'POST'); hangups++; return new Response('{}') }
  const server = loadModule('lib/realtime-server.ts', {
    'server-only': {}, 'node:crypto': await import('node:crypto'), ws: {default: FakeSocket}, '@/lib/db': {pool:{query:async()=>({})}},
    '@/lib/premium-usage': {completePremium:async(id,user,result)=>{assert.equal(id,'reserved');assert.equal(user,'account');assert.match(result,/Answer/);completed++},failPremium:async()=>{failed++}},
    '@/lib/realtime-events': {VoiceSessionEvidence}, '@/lib/realtime-policy': {VOICE_SESSION_SECONDS:60},
  })
  try {
    const monitor = await server.monitorVoice('rtc_fixture','reserved','account',[])
    socket.emit('message',Buffer.from(JSON.stringify({type:'conversation.item.input_audio_transcription.completed',transcript:'Question'})))
    socket.emit('message',Buffer.from(JSON.stringify({type:'response.done',response:{id:'one',status:'completed',output:[{content:[{transcript:'Answer'}]}]}})))
    monitor.stop(); await monitor.done
    assert.equal(hangups,1);assert.equal(completed,1);assert.equal(failed,0)
    const empty = await server.monitorVoice('rtc_empty','reserved','account',[])
    empty.stop(); await empty.done
    assert.equal(failed,1); assert.equal(completed,1); assert.equal(hangups,2)
  } finally { global.fetch=previous }
})
test('realtime API rejects guests, unexpected origins and disabled service before any paid call', async()=>{
  let signedIn = false
  const route=loadModule('app/api/voice/realtime/route.ts',{
    'next/server':{},'@/lib/session':{getUserSession:async()=>signedIn?{user:{id:'user'}}:null},'@/lib/legal':{},'@/lib/db':{},'@/lib/chat-input':{},'@/lib/conversation-input':{},'@/lib/agents':{},'@/lib/premium-policy':{},'@/lib/premium-billing':{},'@/lib/premium-usage':{},'@/lib/realtime-policy':{realtimeEnabled:()=>false},'@/lib/realtime-server':{createVoiceCall:()=>{throw Error('must not call provider')}},
  })
  const request=origin=>new Request('https://example.com/api/voice/realtime',{method:'POST',headers:{origin}})
  assert.equal((await route.POST(request('https://example.com'))).status,401)
  signedIn=true; assert.equal((await route.POST(request('https://evil.example'))).status,403)
  assert.equal((await route.POST(request('https://example.com'))).status,503)
})
test('both interfaces share actual conversation library, preference service, rich text and realtime controls',()=>{
  for(const p of ['components/onboarding/onboarding-agent.tsx','components/pwa/assistant.tsx']){
    const source=read(p);assert.match(source,/ConversationLibrary/);assert.match(source,/LiveVoice/);assert.match(source,/RichMessage/);assert.match(source,/Edit & resend/);assert.match(source,/crypto.randomUUID\(\)/)
  }
  const library=read('components/conversation/library.tsx');assert.match(library,/\/api\/preferences/);assert.match(library,/\/api\/conversations/);assert.match(library,/revision.current/)
  assert.doesNotMatch(library,/localStorage|sessionStorage/)
  const voice=read('components/conversation/live-voice.tsx');assert.match(voice,/getUserMedia/);assert.match(voice,/response.cancel/);assert.match(voice,/getTracks\(\).forEach\(t => t.stop\(\)\)/)
  assert.doesNotMatch(voice,/OPENAI_API_KEY|Bearer /)
})

test('watchdog refuses missing/bad authorization and reaps only server-discovered provider calls', async()=>{
  const previous={secret:process.env.VOICE_WATCHDOG_SECRET,env:process.env.VERCEL_ENV,db:process.env.GINICCI_PWA_ISOLATED_DATABASE_URL}
  process.env.VOICE_WATCHDOG_SECRET='a'.repeat(40);process.env.VERCEL_ENV='preview';process.env.GINICCI_PWA_ISOLATED_DATABASE_URL='isolated'
  let ended=0,queries=0
  const route=loadModule('app/api/voice/realtime/reap/route.ts',{
    'node:crypto':await import('node:crypto'),
    '@/lib/db':{pool:{query:async sql=>{queries++;return {rows:sql.startsWith('SELECT')?[{id:'saved',provider_call_id:'rtc_saved'}]:[]}}}},
    '@/lib/realtime-server':{hangupVoice:async id=>{assert.equal(id,'rtc_saved');ended++}},
  })
  const req=value=>new Request('https://example.com/api/voice/realtime/reap',{method:'POST',headers:value?{authorization:value}:{}})
  try{
    assert.equal((await route.POST(req())).status,401)
    assert.equal((await route.POST(req('Bearer '+'b'.repeat(40)))).status,401);assert.equal(queries,0)
    const response=await route.POST(req('Bearer '+process.env.VOICE_WATCHDOG_SECRET));assert.equal(response.status,200)
    assert.equal(ended,1);assert.deepEqual(await response.json(),{checked:1,ended:1,retryRequired:false})
    process.env.VERCEL_ENV='production';assert.equal((await route.POST(req('Bearer '+process.env.VOICE_WATCHDOG_SECRET))).status,503)
  }finally{
    for(const [key,value]of [['VOICE_WATCHDOG_SECRET',previous.secret],['VERCEL_ENV',previous.env],['GINICCI_PWA_ISOLATED_DATABASE_URL',previous.db]]){if(value===undefined)delete process.env[key];else process.env[key]=value}
  }
})

test('realtime provider errors are sanitized and unsafe session cap changes terminate the monitored call', async()=>{
  let socket,hangups=0
  class FakeSocket extends EventEmitter {constructor(){super();socket=this;queueMicrotask(()=>this.emit('open'))}send(){}close(){this.emit('close')}}
  const previous=global.fetch
  global.fetch=async()=>{hangups++;return new Response('{}')}
  const server=loadModule('lib/realtime-server.ts',{
    'server-only':{},'node:crypto':await import('node:crypto'),ws:{default:FakeSocket},'@/lib/db':{pool:{query:async()=>({})}},'@/lib/premium-usage':{completePremium:async()=>{throw Error('Must not charge empty session')},failPremium:async()=>{}},'@/lib/realtime-events':{VoiceSessionEvidence},'@/lib/realtime-policy':{VOICE_SESSION_SECONDS:60},
  })
  try{
    const monitored=await server.monitorVoice('rtc_fixture','reserved','account',[])
    socket.emit('message',Buffer.from(JSON.stringify({type:'session.updated',session:{max_output_tokens:'inf'}})))
    await monitored.done;assert.equal(hangups,1)
    global.fetch=async()=>new Response('private provider error',{status:401})
    await assert.rejects(server.createVoiceCall('v=0',{},'user'),error=>error.message==='Provider connection unavailable')
  }finally{global.fetch=previous}
})
