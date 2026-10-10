'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
const transport = new DefaultChatTransport({ api: '/api/chat' })
type Conversation = { id: string; title: string; messages: UIMessage[] }
type Recognition = { start(): void; stop(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null }
export function Assistant() {
  const { data: session, isPending } = authClient.useSession()
  const [input, setInput] = useState('')
  const [notice, setNotice] = useState('')
  const [history, setHistory] = useState<Conversation[]>([])
  const [active, setActive] = useState('')
  const [sidebar, setSidebar] = useState(false)
  const [guestCalls, setGuestCalls] = useState(0)
  const [listening, setListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognizer = useRef<Recognition | null>(null)
  const { messages, setMessages, sendMessage, status, error, stop } = useChat({ transport })
  const busy = status === 'submitted' || status === 'streaming'
  const userId = session?.user.id
  const currentUser = useRef(userId)
  currentUser.current = userId
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/pwa-sw.js', { updateViaCache: 'none' }).catch(() => {})
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
    const Constructor = w.SpeechRecognition || w.webkitSpeechRecognition
    setVoiceSupported(!!Constructor); setSpeechSupported('speechSynthesis' in window)
    if (Constructor) { const r = new Constructor(); recognizer.current = r; r.onresult = e => setInput(e.results[0][0].transcript.slice(0, 4000)); r.onerror = () => { setListening(false); setNotice('Dictation unavailable. Please type instead.') }; r.onend = () => setListening(false) }
    return () => { recognizer.current?.stop(); if ('speechSynthesis' in window) window.speechSynthesis.cancel() }
  }, [])
  useEffect(() => {
    stop(); setMessages([]); setHistory([]); setActive(''); setNotice('')
    if (!userId) return
    let cancelled = false
    fetch('/api/conversations', { cache: 'no-store' }).then(r => { if (!r.ok) throw Error(); return r.json() }).then(d => { if (!cancelled) setHistory(d.conversations) }).catch(() => { if (!cancelled) setNotice('Saved history unavailable. Preview never uses production data.') })
    return () => { cancelled = true }
  }, [userId, setMessages, stop])
  async function submit(e: React.FormEvent) {
    e.preventDefault(); const text = input.trim(); if (!text || busy || isPending) return
    setInput('')
    if (!userId) {
      if (guestCalls >= 2) { setNotice('Guest demo limit reached: 2 messages per visit. Create an account for services. Live AI remains paused.'); return }
      setGuestCalls(n => n + 1)
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', parts: [{ type: 'text', text }] }, { id: crypto.randomUUID(), role: 'assistant', parts: [{ type: 'text', text: 'This is a no-cost Ginicci demo, not an AI-generated answer. Explore /services for business use cases. Create an account for private saved conversations; live AI will open only after spending controls are verified.' }] }])
    } else await sendMessage({ text }, { body: { agentId: 'northstar' } })
  }
  async function save() {
    if (!userId || !messages.length || busy) return
    const savingUser = userId
    const id = active || crypto.randomUUID()
    const title = messages.find(m => m.role === 'user')?.parts.filter(p => p.type === 'text').map(p => p.text).join('').slice(0, 60) || 'New chat'
    const conversation = { id, title, messages }
    const response = await fetch('/api/conversations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(conversation) })
    if (currentUser.current !== savingUser) return
    if (!response.ok) { setNotice('Could not save. No conversation was stored in browser storage.'); return }
    setActive(id); setHistory(prev => [conversation, ...prev.filter(c => c.id !== id)].slice(0, 20)); setNotice('Saved privately to your account.')
  }
  function newChat() { stop(); setMessages([]); setActive(''); setSidebar(false); setNotice('') }
  function dictate() { if (!confirm('Your browser may send audio to its speech service. Start dictation?')) return; try { recognizer.current?.start(); setListening(true) } catch { setNotice('Microphone unavailable. Please type.') } }
  return <main className="mx-auto flex h-dvh max-w-3xl flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
    <header className="flex flex-wrap items-center justify-between gap-2 border-b p-3"><Link href="/" className="text-xl font-bold">Ginicci</Link><div className="flex gap-2"><Button variant="outline" onClick={() => setSidebar(!sidebar)}>History</Button><Button onClick={newChat}>New chat</Button><Link className="self-center text-sm underline" href="/install">Install</Link></div></header>
    <div className="border-b px-4 py-2 text-xs">{isPending ? 'Checking secure session…' : userId ? `Signed in as ${session?.user.name}. Trial: 5 total, 3/day, 1/minute. Live AI paused until verified.` : 'Guest demo: 2 mock messages per visit, $0 AI usage. History is not saved.'} {!userId && <Link href="/sign-in" className="underline">Sign in</Link>} · <Link href="/sign-up" className="underline">Create account</Link>{userId && <button className="ml-2 underline" onClick={async () => { stop(); setMessages([]); setHistory([]); await authClient.signOut() }}>Sign out</button>}</div>
    {sidebar && <nav aria-label="Conversation history" className="max-h-48 overflow-auto border-b p-3"><p className="text-xs">Account-only history. Save explicitly; no private browser cache.</p>{history.map(c => <button key={c.id} className="block min-h-11 w-full text-left" onClick={() => { stop(); setMessages(c.messages); setActive(c.id); setSidebar(false) }}>{c.title}</button>)}<Button variant="outline" disabled={!userId || busy || !messages.length} onClick={save}>Save current chat</Button></nav>}
    <section className="flex-1 space-y-4 overflow-auto p-4" aria-label="Chat messages" aria-live="polite">{!messages.length && <p>Welcome to Ginicci. Ask about a business idea, support draft or next step. Guest replies are mock demonstrations; never enter sensitive information.</p>}{messages.map(m => <article key={m.id} className={`rounded-xl p-3 ${m.role === 'user' ? 'bg-secondary' : 'border'}`}><p className="text-xs font-bold">{m.role === 'user' ? 'You' : 'Ginicci'}</p>{m.parts.filter(p => p.type === 'text').map((p, i) => <p key={i} className="whitespace-pre-wrap break-words">{p.text}</p>)}{m.role === 'assistant' && speechSupported && <button className="mt-2 min-h-11 underline" onClick={() => { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(m.parts.filter(p => p.type === 'text').map(p => p.text).join(' '))) }}>Read aloud</button>}</article>)}</section>
    {(notice || error) && <p role="status" className="px-4 py-2 text-sm">{notice || 'AI is unavailable or your allowance is exhausted. No automatic retry.'}</p>}
    <form onSubmit={submit} className="flex items-end gap-2 border-t p-3"><textarea aria-label="Message Ginicci" value={input} maxLength={4000} onChange={e => setInput(e.target.value)} rows={2} className="min-w-0 flex-1 rounded-lg border bg-background p-2 text-base" placeholder="Message Ginicci…" /><Button type="button" variant="outline" disabled={!voiceSupported || busy} onClick={() => listening ? recognizer.current?.stop() : dictate()}>{listening ? 'Stop mic' : 'Mic'}</Button><Button disabled={busy || isPending || !input.trim()}>Send</Button></form>
  </main>
}
