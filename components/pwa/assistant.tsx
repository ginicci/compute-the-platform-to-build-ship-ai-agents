'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PremiumAccessBanner } from '@/components/premium/access-banner'
import { acknowledgePremiumResult, refreshPremiumBalance } from '@/lib/premium-client'
import { ChatNavigation } from '@/components/access/chat-navigation'
import { LiveVoice } from '@/components/conversation/live-voice'
import { ConversationLibrary } from '@/components/conversation/library'
import { RichMessage } from '@/components/conversation/rich-message'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
const transport = new DefaultChatTransport({ api: '/api/chat' })
type Recognition = { start(): void; stop(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null }
export function Assistant() {
  const { data: session, isPending } = authClient.useSession()
  const [input, setInput] = useState('')
  const [notice, setNotice] = useState('')
  const [liveVoiceActive, setLiveVoiceActive] = useState(false)
  const [workspace, setWorkspace] = useState(0)
  const [sidebar, setSidebar] = useState(false)
  const [guestCalls, setGuestCalls] = useState(0)
  const [listening, setListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognizer = useRef<Recognition | null>(null)
  const { messages, setMessages, sendMessage, status, error, stop } = useChat({ transport, onFinish: async ({ message, isAbort, isError }) => { if (!isAbort && !isError) await acknowledgePremiumResult(message.id).catch(() => {}); refreshPremiumBalance() }, onError: refreshPremiumBalance })
  const busy = status === 'submitted' || status === 'streaming'
  const userId = session?.user.id
  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
    const Constructor = w.SpeechRecognition || w.webkitSpeechRecognition
    setVoiceSupported(!!Constructor); setSpeechSupported('speechSynthesis' in window)
    if (Constructor) { const r = new Constructor(); recognizer.current = r; r.onresult = e => setInput(e.results[0][0].transcript.slice(0, 4000)); r.onerror = () => { setListening(false); setNotice('Dictation unavailable. Please type instead.') }; r.onend = () => setListening(false) }
    return () => { recognizer.current?.stop(); if ('speechSynthesis' in window) window.speechSynthesis.cancel() }
  }, [])
  useEffect(() => {
    stop(); setMessages([]); setNotice('')
  }, [userId, setMessages, stop])
  async function submit(e: React.FormEvent) {
    e.preventDefault(); const text = input.trim(); if (!text || busy || liveVoiceActive || isPending) return
    setInput('')
    if (!userId) {
      if (guestCalls >= 2) { setNotice('Guest demo limit reached: 2 messages per visit. Create an account for services. Live AI remains paused.'); return }
      setGuestCalls(n => n + 1)
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', parts: [{ type: 'text', text }] }, { id: crypto.randomUUID(), role: 'assistant', parts: [{ type: 'text', text: 'You’re trying a preview of the chat interface — this is a demo message, not an AI answer. Sign in to check your AI access and save conversations to your account.' }] }])
    } else await sendMessage({ text }, { body: { agentId: 'northstar' } })
  }
  function newChat() { setWorkspace(v => v + 1); stop(); setMessages([]); setSidebar(false); setNotice('') }
  function dictate() { if (!confirm('Your browser may send audio to its speech service. Start dictation?')) return; try { recognizer.current?.start(); setListening(true) } catch { setNotice('Microphone unavailable. Please type.') } }
  return <main className="mx-auto flex h-dvh max-w-3xl flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
    <ChatNavigation />
    <PremiumAccessBanner key={userId ?? "guest"} />
    <header className="flex flex-wrap items-center justify-between gap-2 border-b p-3"><Link href="/" className="text-xl font-bold">Ginicci</Link><div className="flex gap-2"><Button variant="outline" onClick={() => setSidebar(!sidebar)}>Conversation info</Button><Button disabled={liveVoiceActive || busy} onClick={newChat}>New chat</Button><Link className="self-center text-sm underline" href="/install">Install</Link></div></header>
    <div className="border-b px-4 py-2 text-xs">{isPending ? 'Checking secure session…' : userId ? `Signed in as ${session?.user.name}. Premium trial balance is shared with the website.` : 'Guest demo: 2 mock messages per visit, $0 AI usage. History is not saved.'} {!userId && <Link href="/sign-in" className="underline">Sign in</Link>} · <Link href="/sign-up" className="underline">Create account</Link>{userId && <button className="ml-2 underline" onClick={async () => { stop(); setMessages([]); await authClient.signOut() }}>Sign out</button>}</div>
    {userId && <ConversationLibrary key={`${userId}:${workspace}`} messages={messages} busy={busy || liveVoiceActive} onLoad={next => { stop(); setMessages(next) }} />}
    {userId && <details className="px-4 py-2 text-sm"><summary className="min-h-11 cursor-pointer">Talk live with your AI</summary><LiveVoice key={userId} messages={messages} agentId="northstar" disabled={busy} onActiveChange={setLiveVoiceActive} onTranscript={turns => setMessages(current => [...current, ...turns])} /></details>}

    {sidebar && <p className="px-4 text-xs">Use Conversations & preferences to save, resume and synchronize account history. No private browser cache.</p>}
    <section className="min-h-0 flex-1 space-y-4 overflow-auto p-4" aria-label="Chat messages" aria-live="polite">{!messages.length && <p>What’s on your mind? Ask a question, untangle an idea, or just find a small next step. I’m an AI assistant, not a person. Guest replies are clearly labeled demos; sign in for account features.</p>}{messages.map(m => <article key={m.id} className={`rounded-xl p-3 ${m.role === 'user' ? 'bg-secondary' : 'border'}`}><p className="text-xs font-bold">{m.role === 'user' ? 'You' : 'Ginicci'}</p>{m.role === 'assistant' ? <RichMessage text={m.parts.filter(p => p.type === 'text').map(p => p.text).join('')} /> : <><p className="whitespace-pre-wrap break-words">{m.parts.filter(p => p.type === 'text').map(p => p.text).join('')}</p><button className="min-h-11 text-xs underline" disabled={busy || liveVoiceActive} onClick={() => { setInput(m.parts.filter(p => p.type === 'text').map(p => p.text).join('')); setMessages(messages.slice(0, messages.indexOf(m))) }}>Edit & resend</button></>}{m.role === 'assistant' && speechSupported && <button className="mt-2 min-h-11 underline" onClick={() => { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(m.parts.filter(p => p.type === 'text').map(p => p.text).join(' '))) }}>Read aloud</button>}</article>)}</section>
    {(notice || error) && <p role="status" className="px-4 py-2 text-sm">{notice || 'That reply didn’t come through. Check your connection and account access. Recover saved results before trying a new answer.'} {error && <Link href="/onboarding" className="underline">Check access and accept current terms</Link>}</p>}
    {!!messages.length && !liveVoiceActive && <div className="flex gap-4 px-4 text-sm">{busy ? <button className="min-h-11 underline" onClick={stop}>Stop response</button> : <button className="min-h-11 underline" onClick={() => {
      const last = messages.findLastIndex(m => m.role === 'user'); if (last < 0) return
      const text = messages[last].parts.filter(p => p.type === 'text').map(p => p.text).join('')
      setMessages(messages.slice(0, last)); sendMessage({ id: crypto.randomUUID(), role: 'user', parts: [{ type: 'text', text }] }, { body: { agentId: 'northstar' } })
    }}>New answer (premium use on success)</button>}</div>}
    <form onSubmit={submit} className="flex items-end gap-2 border-t p-3"><textarea aria-label="Message Ginicci" value={input} maxLength={4000} onChange={e => setInput(e.target.value)} rows={2} className="min-w-0 flex-1 rounded-lg border bg-background p-2 text-base" placeholder="Message Ginicci…" /><Button type="button" variant="outline" disabled={!voiceSupported || busy || liveVoiceActive} onClick={() => listening ? recognizer.current?.stop() : dictate()}>{listening ? 'Stop mic' : 'Mic'}</Button><Button disabled={busy || liveVoiceActive || isPending || !input.trim()}>Send</Button></form>
  </main>
}
