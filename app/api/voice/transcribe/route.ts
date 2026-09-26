import { transcribe } from 'ai'
import { after } from 'next/server'
import { getAgent } from '@/lib/agents'
import { logActivity, requestMeta } from '@/lib/legal'
import { authorizeVoiceTask } from '@/lib/voice-access'

const MAX_AUDIO_BYTES = 10 * 1024 * 1024

export const maxDuration = 60

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null)
  const audio = form?.get('audio')
  if (!(audio instanceof Blob) || audio.size === 0) {
    return Response.json({ error: 'No audio received' }, { status: 400 })
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return Response.json({ error: 'Recording is too long' }, { status: 413 })
  }
  if (!audio.type.startsWith('audio/')) {
    return Response.json({ error: 'Unsupported audio format' }, { status: 415 })
  }

  const access = await authorizeVoiceTask()
  if (!access.ok) return access.response

  const agentId = getAgent(String(form?.get('agentId') ?? ''))?.id ?? null

  try {
    const result = await transcribe({
      model: 'openai/gpt-4o-mini-transcribe',
      audio: new Uint8Array(await audio.arrayBuffer()),
    })

    const meta = await requestMeta()
    after(() =>
      logActivity({
        userId: access.userId,
        event: 'voice_transcribed',
        agentId,
        detail: JSON.stringify({ plan: access.planName, language: result.language ?? null }),
        ...meta,
      }),
    )

    return Response.json({ text: result.text.trim() })
  } catch (error) {
    console.error('Voice transcription failed', error)
    return Response.json({ error: 'Could not understand the recording' }, { status: 502 })
  }
}
