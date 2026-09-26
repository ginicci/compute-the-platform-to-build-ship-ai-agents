'use client'

import { useEffect, useRef, useState } from 'react'

const MAX_RECORDING_MS = 2 * 60 * 1000
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']

export type VoiceStatus = 'idle' | 'recording' | 'transcribing'

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return undefined
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type))
}

async function readError(response: Response) {
  const data = await response.json().catch(() => null)
  return { code: data?.code as string | undefined, message: (data?.error as string | undefined) ?? 'Voice request failed' }
}

export function useVoiceInput({
  agentId,
  onText,
  onTaskUsed,
  onLimit,
}: {
  agentId: string
  onText: (text: string) => void
  onTaskUsed: () => void
  onLimit: () => void
}) {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const supported =
    typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null
        recorder.stop()
        recorder.stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const upload = async (blob: Blob) => {
    setStatus('transcribing')
    try {
      const form = new FormData()
      const extension = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm'
      form.append('audio', blob, `voice.${extension}`)
      form.append('agentId', agentId)
      const response = await fetch('/api/voice/transcribe', { method: 'POST', body: form })
      if (!response.ok) {
        const { code, message } = await readError(response)
        if (code === 'task_limit') onLimit()
        setError(message)
        return
      }
      onTaskUsed()
      const data = await response.json()
      if (data.text) onText(data.text)
      else setError("We didn't catch that. Try again a little closer to the mic.")
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setStatus('idle')
    }
  }

  const start = async () => {
    if (status !== 'idle') return
    setError(null)
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('Microphone access was blocked. Allow it in your browser settings to talk to the agent.')
      return
    }

    const mimeType = pickMimeType()
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    const chunks: Blob[] = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onstop = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      stream.getTracks().forEach((track) => track.stop())
      recorderRef.current = null
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' })
      if (blob.size === 0) {
        setStatus('idle')
        return
      }
      void upload(blob)
    }

    recorderRef.current = recorder
    recorder.start()
    setStatus('recording')
    timerRef.current = setTimeout(() => stop(), MAX_RECORDING_MS)
  }

  const stop = () => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
  }

  return { supported, status, error, clearError: () => setError(null), start, stop }
}

export function useReadAloud({
  agentId,
  onTaskUsed,
  onLimit,
}: {
  agentId: string
  onTaskUsed: () => void
  onLimit: () => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  const cleanup = () => {
    audioRef.current?.pause()
    audioRef.current = null
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    setActiveId(null)
  }

  useEffect(() => cleanup, [])

  const toggle = async (id: string, text: string) => {
    if (activeId === id) {
      cleanup()
      return
    }
    cleanup()
    setError(null)
    setLoadingId(id)
    try {
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, agentId }),
      })
      if (!response.ok) {
        const { code, message } = await readError(response)
        if (code === 'task_limit') onLimit()
        setError(message)
        return
      }
      onTaskUsed()
      const url = URL.createObjectURL(await response.blob())
      const audio = new Audio(url)
      urlRef.current = url
      audioRef.current = audio
      audio.onended = cleanup
      setActiveId(id)
      await audio.play()
    } catch {
      cleanup()
      setError('Could not play this reply. Tap the speaker to try again.')
    } finally {
      setLoadingId(null)
    }
  }

  return { activeId, loadingId, error, clearError: () => setError(null), toggle }
}
