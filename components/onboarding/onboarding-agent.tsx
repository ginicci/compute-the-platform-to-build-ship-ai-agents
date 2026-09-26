'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowUp, RotateCcw, Square } from 'lucide-react'
import { AGENTS, DEFAULT_AGENT_ID, getAgent, type AgentId } from '@/lib/agents'
import { Button } from '@/components/ui/button'

const transport = new DefaultChatTransport({ api: '/api/chat' })

export function OnboardingAgent() {
  const [agentId, setAgentId] = useState<AgentId>(DEFAULT_AGENT_ID)
  const agent = getAgent(agentId) ?? AGENTS[0]

  return (
    <div className="mx-auto flex h-dvh w-full max-w-3xl flex-col">
      <header className="flex flex-col gap-3 border-b border-border px-4 pb-3 pt-4 sm:px-6">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-display text-xl tracking-tight">Northstar agents</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Ginicci</p>
        </div>
        <nav aria-label="Agent categories" className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          <ul className="flex w-max gap-2">
            {AGENTS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setAgentId(item.id)}
                  aria-pressed={item.id === agentId}
                  className={`min-h-11 whitespace-nowrap border px-4 text-sm transition-colors ${
                    item.id === agentId
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/60 hover:text-foreground'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <AgentChat key={agent.id} agentId={agent.id} />
    </div>
  )
}

function AgentChat({ agentId }: { agentId: AgentId }) {
  const agent = getAgent(agentId) ?? AGENTS[0]
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const { messages, sendMessage, status, stop, error, regenerate } = useChat({ id: agentId, transport })

  const busy = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, status])

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    sendMessage({ text: trimmed }, { body: { agentId } })
    setInput('')
  }

  return (
    <>
      <section aria-live="polite" className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-6 sm:px-6">
        {messages.length === 0 && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{agent.name}</p>
              <h2 className="text-balance font-display text-3xl tracking-tight">{agent.tagline}</h2>
            </div>
            <ul className="flex flex-col gap-2">
              {agent.starters.map((starter) => (
                <li key={starter}>
                  <button
                    type="button"
                    onClick={() => send(starter)}
                    className="min-h-12 w-full border border-border px-4 py-3 text-left text-sm leading-relaxed text-foreground transition-colors hover:border-primary/60 hover:bg-primary/5"
                  >
                    {starter}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((message) => {
          const text = message.parts
            .filter((part) => part.type === 'text')
            .map((part) => part.text)
            .join('')
          if (message.role === 'user') {
            return (
              <p key={message.id} className="ml-auto max-w-[85%] whitespace-pre-wrap bg-primary/15 px-4 py-3 text-base leading-relaxed text-foreground">
                {text}
              </p>
            )
          }
          return (
            <div key={message.id} className="flex flex-col gap-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-primary">{agent.name}</p>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">{text}</p>
            </div>
          )
        })}

        {status === 'submitted' && (
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
            <span className="size-2 animate-pulse bg-primary" aria-hidden="true" />
            Replying
          </p>
        )}

        {error && (
          <div role="alert" className="flex items-center justify-between gap-3 border border-destructive/50 px-4 py-3 text-sm text-foreground">
            <span>{'Something went wrong. Please try again.'}</span>
            <Button size="sm" variant="outline" onClick={() => regenerate({ body: { agentId } })}>
              <RotateCcw aria-hidden="true" />
              Retry
            </Button>
          </div>
        )}
        <div ref={endRef} />
      </section>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          send(input)
        }}
        className="flex items-end gap-2 border-t border-border bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6"
      >
        <label htmlFor="agent-input" className="sr-only">{`Message ${agent.name}`}</label>
        <textarea
          id="agent-input"
          rows={1}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
              event.preventDefault()
              send(input)
            }
          }}
          placeholder={`Ask ${agent.name}...`}
          className="max-h-40 min-h-12 flex-1 resize-none bg-card px-4 py-3 text-base leading-relaxed text-foreground outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-primary"
        />
        {busy ? (
          <Button type="button" size="icon" className="size-12" onClick={() => stop()} aria-label="Stop reply">
            <Square aria-hidden="true" />
          </Button>
        ) : (
          <Button type="submit" size="icon" className="size-12" disabled={!input.trim()} aria-label="Send message">
            <ArrowUp aria-hidden="true" />
          </Button>
        )}
      </form>
    </>
  )
}
