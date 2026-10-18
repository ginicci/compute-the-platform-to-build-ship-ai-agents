'use client'
import { useEffect, useRef, useState } from 'react'
import type { UIMessage } from 'ai'
import { acknowledgePremiumResult, refreshPremiumBalance } from '@/lib/premium-client'
export function LiveVoice({ messages, agentId, onTranscript, onActiveChange, disabled = false }: {
  messages: UIMessage[]; agentId: string; onTranscript: (messages: UIMessage[]) => void; onActiveChange?: (active: boolean) => void; disabled?: boolean
}) {
  const [state, setState] = useState('idle')
  const [notice, setNotice] = useState('')
  const [caption, setCaption] = useState('')
  const [muted, setMuted] = useState(false)
  const peer = useRef<RTCPeerConnection | null>(null)
  const media = useRef<MediaStream | null>(null)
  const channel = useRef<RTCDataChannel | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const resultId = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const generation = useRef(0)
  const turns = useRef<UIMessage[]>([])
  const callback = useRef(onTranscript); callback.current = onTranscript
  const busy = state === 'connecting' || state === 'live'
  function release() {
    if (timer.current) clearTimeout(timer.current)
    channel.current?.close(); peer.current?.close(); media.current?.getTracks().forEach(t => t.stop())
    if (audio.current) { audio.current.pause(); audio.current.srcObject = null }
    peer.current = null; media.current = null; channel.current = null
  }
  async function end(recover = true) {
    generation.current++; release(); onActiveChange?.(false); onActiveChange?.(false); setState('idle'); setMuted(false)
    const id = resultId.current; resultId.current = ''
    if (turns.current.length) { callback.current(turns.current); turns.current = [] }
    if (!id) return
    try {
      await fetch('/api/voice/realtime/end', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }), keepalive: true })
      if (recover) {
        // Sideband persists after provider hangup. Only acknowledge a result actually received.
        for (let i = 0; i < 8; i++) {
          await new Promise(r => setTimeout(r, 1000))
          const response = await fetch('/api/premium/results', { cache: 'no-store' })
          if (!response.ok) break
          const result = (await response.json()).results.find((r: { id: string }) => r.id === id)
          if (result) { await acknowledgePremiumResult(id); setNotice('Voice session saved. One premium use for the session, not per sentence.'); break }
        }
      }
    } catch { setNotice('Voice ended locally. Recover saved premium results to check session delivery.') }
    refreshPremiumBalance()
  }
  useEffect(() => () => {
    generation.current++; release(); onActiveChange?.(false)
    if (resultId.current) fetch('/api/voice/realtime/end', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: resultId.current }), keepalive: true }).catch(() => {})
  }, [])
  async function start() {
    if (busy || disabled) return
    const epoch = ++generation.current
    onActiveChange?.(true); setState('connecting'); setNotice(''); setCaption(''); turns.current = []
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) throw new Error('This browser does not support live voice. Continue typing.')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      if (generation.current !== epoch) { stream.getTracks().forEach(t => t.stop()); return }
      media.current = stream
      const pc = new RTCPeerConnection(); peer.current = pc
      const player = new Audio(); player.autoplay = true; audio.current = player
      pc.ontrack = e => { player.srcObject = e.streams[0]; player.play().catch(() => setNotice('Tap Resume audio if autoplay was blocked.')) }
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') { setNotice('Connection interrupted. Continue typing or recover saved results.'); void end() }
      }
      for (const track of stream.getTracks()) pc.addTrack(track, stream)
      const dc = pc.createDataChannel('oai-events'); channel.current = dc
      const seen = new Set<string>()
      dc.onmessage = e => {
        try {
          const event = JSON.parse(e.data)
          if (event.type === 'input_audio_buffer.speech_started') setCaption('Listening — you can interrupt naturally.')
          if (event.type === 'response.output_audio_transcript.delta') setCaption(c => (c + event.delta).slice(-2000))
          const role = event.type === 'conversation.item.input_audio_transcription.completed' ? 'user' : event.type === 'response.output_audio_transcript.done' ? 'assistant' : null
          if (role && typeof event.transcript === 'string' && event.transcript.trim()) {
            const id = event.item_id ?? event.response_id ?? crypto.randomUUID()
            if (!seen.has(id)) { seen.add(id); turns.current.push({ id, role, parts: [{ type: 'text', text: event.transcript }] }) }
            setCaption(event.transcript)
          }
          if (event.type === 'error') { setNotice('Voice provider reported an error. Text remains available.'); void end() }
        } catch { /* Ignore malformed captions; never grant entitlements from browser events. */ }
      }
      dc.onopen = () => setState('live')
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer)
      if (pc.iceGatheringState !== 'complete') await new Promise<void>(resolve => {
        const timeout = setTimeout(resolve, 1500)
        pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(timeout); resolve() } })
      })
      if (generation.current !== epoch) return
      const response = await fetch('/api/voice/realtime', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: crypto.randomUUID(), sdp: pc.localDescription?.sdp, agentId, messages: messages.slice(-8) }), signal: AbortSignal.timeout(25000) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.code === 'premium_required' ? 'Your six premium uses are complete. Upgrade from your account.' : data.code === 'terms_required' ? 'Accept current terms in the agent interface first.' : data.error ?? 'Voice unavailable. Continue typing.')
      if (generation.current !== epoch) {
        await fetch('/api/voice/realtime/end', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: data.resultId }), keepalive: true }).catch(() => {})
        return
      }
      resultId.current = data.resultId
      await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp })
      timer.current = setTimeout(() => { setNotice('Session time limit reached. Continue in text or start another session.'); void end() }, data.maxSeconds * 1000)
    } catch (error) {
      if (generation.current !== epoch) return
      release(); onActiveChange?.(false); setState('idle')
      if (resultId.current) void end()
      setNotice(error instanceof DOMException && error.name === 'NotAllowedError' ? 'Microphone permission denied. You can continue typing or enable it in browser settings.' : error instanceof Error ? error.message : 'Voice unavailable. Continue typing.')
    }
  }
  return <section aria-label="Live AI voice" className="space-y-2 rounded-xl border p-3 text-sm">
    <p className="font-medium">Live AI voice <span className="text-xs text-muted-foreground">Preview integration</span></p>
    <p className="text-xs text-muted-foreground">Speak naturally and interrupt the AI. One meaningful session (up to 60 seconds) uses one premium credit after a completed reply is delivered. Audio goes to OpenAI; transcripts may be saved to your account. Voice is AI-generated, not human. No recording is stored by this app.</p>
    <div className="flex flex-wrap gap-3"><button className="min-h-11 rounded border px-3" disabled={disabled && !busy} onClick={() => busy ? end() : start()}>{busy ? state === 'connecting' ? 'Cancel connection' : 'End voice' : 'Start live voice'}</button>
      {state === 'live' && <><button className="min-h-11 underline" aria-pressed={muted} onClick={() => { const next = !muted; media.current?.getAudioTracks().forEach(t => { t.enabled = !next }); setMuted(next) }}>{muted ? 'Unmute' : 'Mute'}</button><button className="min-h-11 underline" onClick={() => { channel.current?.send(JSON.stringify({ type: 'response.cancel' })); channel.current?.send(JSON.stringify({ type: 'output_audio_buffer.clear' })) }}>Interrupt</button><button className="min-h-11 underline" onClick={() => audio.current?.play().catch(() => setNotice('Audio blocked by browser.'))}>Resume audio</button></>}
    </div>
    <p role="status">{notice || (state === 'live' ? 'Connected — listening' : state === 'connecting' ? 'Connecting securely…' : 'Text remains available if voice is disabled or unavailable.')}</p>
    {caption && <p aria-live="polite" className="max-h-24 overflow-auto whitespace-pre-wrap">{caption}</p>}
  </section>
}
