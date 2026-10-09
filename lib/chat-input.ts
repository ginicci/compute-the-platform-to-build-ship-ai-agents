// Text-only boundary for the existing UI. Tool results and system prompts must
// eventually come from server-owned workflow state, never client messages.
export const MAX_CHAT_BYTES = 128 * 1024
export const MAX_CHAT_TEXT = 40_000

type ChatMessage = { id: string; role: 'user' | 'assistant'; parts: { type: 'text'; text: string }[] }

export function validateChatMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 60) return null
  let characters = 0
  const ids = new Set<string>()
  const messages: ChatMessage[] = []
  for (const message of value) {
    if (!message || typeof message !== 'object' ||
      typeof message.id !== 'string' || !message.id || message.id.length > 200 || ids.has(message.id) ||
      !['user', 'assistant'].includes(message.role) ||
      !Array.isArray(message.parts) || !message.parts.length || message.parts.length > 20) return null
    ids.add(message.id)
    const parts: ChatMessage['parts'] = []
    for (const part of message.parts) {
      if (!part || typeof part !== 'object') return null
      // Streamed assistant replies include SDK step markers and reasoning.
      // Discard these rather than rejecting the next turn or trusting them as input.
      if (message.role === 'assistant' && part.type === 'step-start') continue
      if (message.role === 'assistant' && part.type === 'reasoning' && typeof part.text === 'string') {
        characters += part.text.length
        if (characters > MAX_CHAT_TEXT) return null
        continue
      }
      if (part.type !== 'text' || typeof part.text !== 'string') return null
      characters += part.text.length
      if (characters > MAX_CHAT_TEXT) return null
      parts.push({ type: 'text', text: part.text })
    }
    if (!parts.some(part => part.text.trim())) return null
    messages.push({ id: message.id, role: message.role, parts })
  }
  if (messages.at(-1)?.role !== 'user') return null
  return messages
}

export class ChatInputError extends Error {
  status: number
  constructor(status: number) { super('Invalid chat request'); this.status = status }
}

// Enforce the limit while reading, even for chunked requests without a length.
export async function readChatBody(request: Request): Promise<unknown> {
  const length = Number(request.headers.get('content-length'))
  if (length > MAX_CHAT_BYTES) throw new ChatInputError(413)
  if (!request.body) throw new ChatInputError(400)
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_CHAT_BYTES) {
        await reader.cancel()
        throw new ChatInputError(413)
      }
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch (error) {
    if (error instanceof ChatInputError) throw error
    throw new ChatInputError(400)
  } finally {
    reader.releaseLock()
  }
}
