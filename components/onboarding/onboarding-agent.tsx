'use client'

import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
const tiers = [
  { name: 'Explorer', detail: 'Find your direction', price: 'Free' },
  { name: 'Builder', detail: 'Develop with momentum', price: '$29 / month' },
  { name: 'Catalyst', detail: 'Accelerate with support', price: '$99 / month' },
]

export function OnboardingAgent() {
  const [input, setInput] = useState('')
  const [tier, setTier] = useState('Builder')
  const [roadmapReady, setRoadmapReady] = useState(false)
  const { messages, sendMessage, status } = useChat({ transport: new DefaultChatTransport({ api: '/api/chat' }) })

  const submit = () => {
    if (!input.trim() || status !== 'ready') return
    sendMessage({ text: input })
    setInput('')
  }

  const account = () => {
    window.location.href = '/sign-up'
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_340px]">
      <section className="flex min-h-[620px] flex-col border border-border bg-card/70 p-5 sm:p-8">
        <div className="mb-8 flex items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">Northstar / onboarding</p>
            <h1 className="mt-3 text-3xl font-display tracking-tight sm:text-5xl">Let&apos;s find your next move.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Northstar learns what you&apos;re building, where you&apos;re going, and what&apos;s in the way—then turns it into a practical path forward.</p>
          </div>
          <span className="hidden border border-primary/40 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-primary sm:block">Ginicci</span>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto pr-1">
          {messages.length === 0 && <div className="max-w-md border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">I&apos;m Northstar. Tell me what you&apos;re building, changing, or trying to become. We&apos;ll make the direction clearer together.</div>}
          {messages.map((message) => <div key={message.id} className={`max-w-2xl text-sm leading-7 ${message.role === 'user' ? 'ml-auto bg-primary/10 p-4' : 'border-l-2 border-primary pl-4 text-muted-foreground'}`}>{message.parts?.filter((part) => part.type === 'text').map((part) => part.text).join('')}</div>)}
          {status === 'streaming' && <p className="font-mono text-xs uppercase tracking-widest text-primary">Northstar is thinking...</p>}
        </div>
        <div className="mt-8 flex gap-3 border-t border-border pt-5">
          <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) submit() }} placeholder="Tell Northstar where you are starting..." className="min-w-0 flex-1 bg-background px-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-primary" aria-label="Message Northstar" />
          <Button onClick={submit} disabled={status !== 'ready' || !input.trim()}>Send</Button>
        </div>
      </section>
      <aside className="h-fit border border-border bg-card/70 p-5 sm:p-7">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Your Northstar</p>
        <h2 className="mt-3 text-2xl font-display">A roadmap made for you.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">When Northstar has enough context, it will shape your answers into a focused roadmap.</p>
        <div className="mt-7 space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Choose your starting tier</p>
          {tiers.map((item) => <button key={item.name} onClick={() => setTier(item.name)} className={`w-full border p-4 text-left transition-colors ${tier === item.name ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}><div className="flex items-center justify-between"><span className="font-display text-lg">{item.name}</span><span className="font-mono text-xs text-primary">{item.price}</span></div><span className="mt-1 block text-xs text-muted-foreground">{item.detail}</span></button>)}
        </div>
        <Button className="mt-6 w-full" variant="outline" onClick={() => setRoadmapReady(true)}>{roadmapReady ? 'Roadmap ready to save' : 'I have my direction'}</Button>
        {roadmapReady && <div className="mt-5 border-t border-border pt-5"><p className="text-sm leading-6 text-muted-foreground">Create an account to save your Northstar Roadmap, continue your progress, and unlock your {tier} journey.</p><Button className="mt-4 w-full" onClick={account}>Create account / sign in</Button></div>}
      </aside>
    </div>
  )
}
