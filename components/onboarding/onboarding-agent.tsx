'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import Link from 'next/link'
import { ArrowDown, ArrowUp, Loader2, Lock, Mic, RotateCcw, Square, Volume2 } from 'lucide-react'
import { AGENTS, DEFAULT_AGENT_ID, getAgent, type AgentId } from '@/lib/agents'
import { Button } from '@/components/ui/button'
import { useReadAloud, useVoiceInput } from '@/components/onboarding/use-voice'

const transport = new DefaultChatTransport({ api: '/api/chat' })

export type AgentPlan = {
  name: string
  allowedAgentIds: AgentId[]
  tasksLimit: number | null
  tasksUsed: number
}

function limitCode(error: Error | undefined) {
  if (!error) return null
  try {
    const code = JSON.parse(error.message)?.code
    return ['task_limit', 'agent_locked', 'terms_required', 'sign_in_required'].includes(code) ? code : null
  } catch {
    return null
  }
}

export function OnboardingAgent({ plan }: { plan: AgentPlan }) {
  const [agentId, setAgentId] = useState<AgentId>(DEFAULT_AGENT_ID)
  const [tasksUsed, setTasksUsed] = useState(plan.tasksUsed)
  const agent = getAgent(agentId) ?? AGENTS[0]
  const locked = !plan.allowedAgentIds.includes(agent.id)
  const outOfTasks = plan.tasksLimit !== null && tasksUsed >= plan.tasksLimit

  return (
    <div className="mx-auto flex h-dvh w-full max-w-3xl flex-col overflow-hidden">
      <header className="flex flex-col gap-3 border-b border-border px-4 pb-3 pt-4 sm:px-6">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-display text-xl tracking-tight">Northstar agents</h1>
          <Link href="/account" className="font-mono text-[10px] uppercase tracking-widest text-primary">
            {`${plan.name} plan`}
          </Link>
        </div>
        <UsageMeter used={tasksUsed} limit={plan.tasksLimit} />
        <p className="text-xs text-muted-foreground">AI guidance, plans, and drafts. This chat does not book services, make payments, or send messages for you.</p>
        <nav aria-label="Agent categories" className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          <ul className="flex w-max gap-2">
            {AGENTS.map((item) => {
              const itemLocked = !plan.allowedAgentIds.includes(item.id)
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setAgentId(item.id)}
                    aria-pressed={item.id === agentId}
                    aria-label={itemLocked ? `${item.label} (upgrade required)` : undefined}
                    className={`flex min-h-11 items-center gap-2 whitespace-nowrap border px-4 text-sm transition-colors ${
                      item.id === agentId
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/60 hover:text-foreground'
                    }`}
                  >
                    {itemLocked && <Lock className="size-3.5" aria-hidden="true" />}
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </header>
      {locked ? (
        <UpgradePanel
          title={`${agent.name} is on paid plans`}
          body={`Your ${plan.name} plan includes ${plan.allowedAgentIds.length} agents. Upgrade to Plus to unlock all of them, with a 14-day free trial.`}
        />
      ) : (
        <AgentChat
          key={agent.id}
          agentId={agent.id}
          outOfTasks={outOfTasks}
          onSend={() => setTasksUsed((count) => count + 1)}
        />
      )}
    </div>
  )
}

function UsageMeter({ used, limit }: { used: number; limit: number | null }) {
  if (limit === null) {
    return <p className="text-xs text-muted-foreground">Unlimited tasks this month</p>
  }
  const shown = Math.min(used, limit)
  const percent = Math.round((shown / limit) * 100)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{`${shown.toLocaleString('en-US')} of ${limit.toLocaleString('en-US')} tasks this month`}</span>
        {percent >= 80 && (
          <Link href="/#pricing" className="text-primary underline-offset-4 hover:underline">
            Upgrade
          </Link>
        )}
      </div>
      <div
        role="progressbar"
        aria-label="Monthly tasks used"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={shown}
        className="h-1 w-full bg-muted"
      >
        <div className="h-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function UpgradePanel({ title, body }: { title: string; body: string }) {
  return (
    <section className="flex flex-1 flex-col justify-center gap-4 px-4 py-8 sm:px-6">
      <Lock className="size-6 text-primary" aria-hidden="true" />
      <h2 className="text-balance font-display text-3xl tracking-tight">{title}</h2>
      <p className="text-pretty text-base leading-relaxed text-muted-foreground">{body}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild size="lg" className="min-h-12">
          <Link href="/checkout?tier=plus&interval=monthly">Start free trial</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="min-h-12">
          <Link href="/#pricing">Compare plans</Link>
        </Button>
      </div>
    </section>
  )
}

function AgentChat({ agentId, outOfTasks, onSend }: { agentId: AgentId; outOfTasks: boolean; onSend: () => void }) {
  const agent = getAgent(agentId) ?? AGENTS[0]
  const [input, setInput] = useState('')
  const [showJump, setShowJump] = useState(false)
  const scrollRef = useRef<HTMLElement>(null)
  const pinnedRef = useRef(true)
  const { messages, sendMessage, status, stop, error, regenerate } = useChat({ id: agentId, transport })

  const [voiceLimited, setVoiceLimited] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const busy = status === 'submitted' || status === 'streaming'
  const errorCode = limitCode(error)
  const blocked = outOfTasks || voiceLimited || errorCode === 'task_limit'

  const voice = useVoiceInput({
    agentId,
    onTaskUsed: onSend,
    onLimit: () => setVoiceLimited(true),
    onText: (text) => {
      setInput((current) => (current.trim() ? `${current.trimEnd()} ${text}` : text))
      requestAnimationFrame(() => inputRef.current?.focus())
    },
  })
  const readAloud = useReadAloud({ agentId, onTaskUsed: onSend, onLimit: () => setVoiceLimited(true) })
  const voiceError = voice.error ?? readAloud.error
  const recording = voice.status === 'recording'
  const transcribing = voice.status === 'transcribing'

  const scrollToBottom = (smooth = false) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }

  useEffect(() => {
    if (pinnedRef.current) scrollToBottom()
  }, [messages, status, error])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    pinnedRef.current = nearBottom
    setShowJump(!nearBottom)
  }

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy || blocked) return
    onSend()
    pinnedRef.current = true
    setShowJump(false)
    sendMessage({ text: trimmed }, { body: { agentId } })
    setInput('')
    requestAnimationFrame(() => scrollToBottom())
  }

  return (
    <>
      <div className="relative flex min-h-0 flex-1 flex-col">
      <section
        ref={scrollRef}
        onScroll={handleScroll}
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6"
      >
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

        {messages.map((message, index) => {
          const stillWriting = busy && index === messages.length - 1
          const text = message.parts
            .filter((part) => part.type === 'text')
            .map((part) => part.text)
            .join('')
          if (message.role === 'user') {
            return (
              <p key={message.id} translate="no" className="ml-auto max-w-[85%] whitespace-pre-wrap bg-primary/15 px-4 py-3 text-base leading-relaxed text-foreground">
                {text}
              </p>
            )
          }
          return (
            <div key={message.id} className="flex flex-col gap-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-primary">{agent.name}</p>
              <p translate="no" className="whitespace-pre-wrap text-base leading-relaxed text-foreground">{text}</p>
              {text && !stillWriting && (
                <button
                  type="button"
                  onClick={() => readAloud.toggle(message.id, text)}
                  disabled={readAloud.loadingId === message.id || (blocked && readAloud.activeId !== message.id)}
                  aria-label={readAloud.activeId === message.id ? 'Stop reading aloud' : 'Read reply aloud'}
                  aria-pressed={readAloud.activeId === message.id}
                  className="-ml-3 flex min-h-11 items-center gap-2 self-start px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                >
                  {readAloud.loadingId === message.id ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : readAloud.activeId === message.id ? (
                    <Square className="size-4 text-primary" aria-hidden="true" />
                  ) : (
                    <Volume2 className="size-4" aria-hidden="true" />
                  )}
                  {readAloud.loadingId === message.id ? 'Loading' : readAloud.activeId === message.id ? 'Stop' : 'Listen'}
                </button>
              )}
            </div>
          )
        })}

        {status === 'submitted' && (
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
            <span className="size-2 animate-pulse bg-primary" aria-hidden="true" />
            Replying
          </p>
        )}

        {blocked && (
          <div role="alert" className="flex flex-col gap-3 border border-primary/50 px-4 py-4 text-sm leading-relaxed text-foreground">
            <p>{"You've used all your tasks for this month. Upgrade to keep going, or wait until next month when your tasks reset."}</p>
            <Button asChild className="min-h-11 self-start">
              <Link href="/#pricing">See plans</Link>
            </Button>
          </div>
        )}

        {errorCode === 'agent_locked' && (
          <UpgradePanel title="This agent is not included in your plan" body="Check your current plan or upgrade to access this agent." />
        )}
        {errorCode === 'terms_required' && (
          <div role="alert" className="border border-border px-4 py-3 text-sm">
            Please <Link href="/onboarding" className="underline">review and accept the terms</Link> before chatting.
          </div>
        )}
        {errorCode === 'sign_in_required' && (
          <div role="alert" className="border border-border px-4 py-3 text-sm">
            Your session has expired. <Link href="/sign-in" className="underline">Sign in again</Link> to continue.
          </div>
        )}
        {error && !errorCode && (
          <div role="alert" className="flex items-center justify-between gap-3 border border-destructive/50 px-4 py-3 text-sm text-foreground">
            <span>{'The reply could not be completed. Please retry. If it keeps failing, start a new conversation by switching agents.'}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={busy || blocked}
              onClick={() => {
                onSend()
                regenerate({ body: { agentId } })
              }}
            >
              <RotateCcw aria-hidden="true" />
              Retry
            </Button>
          </div>
        )}
      </section>
      {showJump && (
        <button
          type="button"
          onClick={() => {
            pinnedRef.current = true
            setShowJump(false)
            scrollToBottom(true)
          }}
          className="absolute bottom-3 left-1/2 flex min-h-11 -translate-x-1/2 items-center gap-2 border border-primary bg-background px-4 text-sm text-foreground shadow-lg"
        >
          <ArrowDown className="size-4" aria-hidden="true" />
          Jump to latest
        </button>
      )}
      </div>

      <div className="flex flex-col border-t border-border bg-background">
      {voiceError && (
        <div role="alert" className="flex items-start justify-between gap-3 px-4 pt-3 text-sm leading-relaxed text-foreground sm:px-6">
          <span>{voiceError}</span>
          <button
            type="button"
            onClick={() => {
              voice.clearError()
              readAloud.clearError()
            }}
            className="min-h-11 shrink-0 px-2 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
      <p className="sr-only" aria-live="assertive">
        {recording ? 'Recording. Tap the stop button when you are done.' : transcribing ? 'Turning your voice into text.' : ''}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          send(input)
        }}
        className="flex items-end gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6"
      >
        {voice.supported && (
          <Button
            type="button"
            size="icon"
            variant={recording ? 'default' : 'outline'}
            className={`size-12 shrink-0 ${recording ? 'animate-pulse' : ''}`}
            onClick={() => (recording ? voice.stop() : voice.start())}
            disabled={blocked || transcribing}
            aria-label={recording ? 'Stop recording' : transcribing ? 'Transcribing' : 'Speak your message'}
            aria-pressed={recording}
          >
            {transcribing ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : recording ? (
              <Square aria-hidden="true" />
            ) : (
              <Mic aria-hidden="true" />
            )}
          </Button>
        )}
        <label htmlFor="agent-input" className="sr-only">{`Message ${agent.name}`}</label>
        <textarea
          ref={inputRef}
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
          disabled={blocked}
          placeholder={
            blocked
              ? 'Monthly task limit reached'
              : recording
                ? 'Listening... tap stop when done'
                : transcribing
                  ? 'Turning your voice into text...'
                  : `Ask ${agent.name}...`
          }
          className="max-h-40 min-h-12 min-w-0 flex-1 resize-none bg-card px-4 py-3 text-base leading-relaxed text-foreground outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-primary"
        />
        {busy ? (
          <Button type="button" size="icon" className="size-12" onClick={() => stop()} aria-label="Stop reply">
            <Square aria-hidden="true" />
          </Button>
        ) : (
          <Button type="submit" size="icon" className="size-12" disabled={!input.trim() || blocked} aria-label="Send message">
            <ArrowUp aria-hidden="true" />
          </Button>
        )}
      </form>
      </div>
    </>
  )
}
