import type { UIMessage } from 'ai'
export const MAX_CONVERSATION_BYTES = 256 * 1024
export function conversationMessages(value: unknown): UIMessage[] | null {
  if (!Array.isArray(value) || value.length > 100) return null
  let length = 0
  const ids = new Set<string>()
  const messages: UIMessage[] = []
  for (const m of value) {
    if (!m || typeof m.id !== 'string' || !m.id || m.id.length > 200 || ids.has(m.id) || !['user','assistant'].includes(m.role) || !Array.isArray(m.parts)) return null
    ids.add(m.id)
    const parts = []
    for (const part of m.parts) {
      if (m.role === 'assistant' && ['step-start','reasoning'].includes(part?.type)) continue
      if (part?.type !== 'text' || typeof part.text !== 'string') return null
      length += part.text.length
      if (length > 100000) return null
      parts.push({ type: 'text' as const, text: part.text })
    }
    if (!parts.some(p => p.text.trim())) return null
    messages.push({ id: m.id, role: m.role, parts })
  }
  return messages
}
export function modelContext(value: unknown) {
  const messages = conversationMessages(value)
  if (!messages?.length || messages.at(-1)?.role !== 'user') return null
  // Preserve newest complete turns within a fixed server input budget.
  let size = 0
  const selected = []
  for (const message of messages.slice(-20).reverse()) {
    const text = message.parts.filter(p => p.type === 'text').map(p => p.text).join('')
    if (text.length > 24000 || size + text.length > 48000) break
    size += text.length; selected.unshift(message)
  }
  return selected.length ? selected : null
}
