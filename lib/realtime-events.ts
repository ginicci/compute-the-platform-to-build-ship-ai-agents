export type VoiceTurn = { role: 'user' | 'assistant'; text: string }
// Provider events, never browser claims, determine whether a session produced a usable turn.
export class VoiceSessionEvidence {
  turns: VoiceTurn[] = []
  successfulResponses = new Set<string>()
  usage: unknown[] = []
  accept(event: Record<string, any>) {
    if (event.type === 'conversation.item.input_audio_transcription.completed' && typeof event.transcript === 'string' && event.transcript.trim()) {
      this.turns.push({ role: 'user', text: event.transcript.slice(0, 12000) })
    }
    if (event.type === 'response.done' && event.response?.status === 'completed' && typeof event.response.id === 'string' && !this.successfulResponses.has(event.response.id)) {
      const output = event.response.output
      const text = Array.isArray(output) ? output.flatMap(item => Array.isArray(item.content) ? item.content : []).map(part => typeof part.transcript === 'string' ? part.transcript : typeof part.text === 'string' ? part.text : '').join('\n').trim() : ''
      if (text) { this.successfulResponses.add(event.response.id); this.turns.push({ role: 'assistant', text: text.slice(0, 12000) }); this.usage.push(event.response.usage ?? null) }
    }
    if (this.turns.length > 100) this.turns = this.turns.slice(-100)
  }
  result() {
    if (!this.turns.some(t => t.role === 'user') || !this.turns.some(t => t.role === 'assistant')) return null
    return this.turns.map(t => `${t.role === 'user' ? 'You' : 'Ginicci'}: ${t.text}`).join('\n\n').slice(0, 100000)
  }
}
