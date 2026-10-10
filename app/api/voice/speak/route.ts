import { finishAiRequest } from '@/lib/ai-billing'
import { generateSpeech } from 'ai'
import { after } from 'next/server'
import { getAgent } from '@/lib/agents'
import { logActivity, requestMeta } from '@/lib/legal'
import { authorizeVoiceTask } from '@/lib/voice-access'

const MAX_TEXT_LENGTH = 4000

export const maxDuration = 60

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  if (!text) {
    return Response.json({ error: 'Nothing to read' }, { status: 400 })
  }

  const access = await authorizeVoiceTask('speech', body?.agentId)
  if (!access.ok) return access.response

  const agentId = getAgent(String(body?.agentId ?? ''))?.id ?? null

  try {
    const result = await generateSpeech({
      model: 'openai/tts-1',
      text: text.slice(0, MAX_TEXT_LENGTH),
      voice: 'alloy',
      outputFormat: 'mp3',
    })

    await finishAiRequest(access.requestId, 'completed')
    const meta = await requestMeta()
    after(() =>
      logActivity({
        userId: access.userId,
        event: 'voice_read_aloud',
        agentId,
        detail: JSON.stringify({ plan: access.planName, characters: Math.min(text.length, MAX_TEXT_LENGTH) }),
        ...meta,
      }),
    )

    return new Response(new Blob([new Uint8Array(result.audio.uint8Array)], { type: 'audio/mpeg' }), {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    await finishAiRequest(access.requestId, 'failed')
    console.error('Read aloud failed', error)
    return Response.json({ error: 'Could not read this reply aloud' }, { status: 502 })
  }
}
