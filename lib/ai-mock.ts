/** Explicit test-only fixtures. This module has no provider or network imports. */
export function mockAiEnabled(env: Record<string, string | undefined>) {
  return env.BILLING_TEST_MODE === 'true' && env.AI_EXECUTION_MODE === 'mock' && env.VERCEL_ENV !== 'production'
}
export const MOCK_REPLY = '[TEST FIXTURE — no AI provider called] Start by defining your market, budget, licensing requirements, inventory strategy, and financing. This is a deterministic test reply, not personalized advice.'
export const MOCK_TRANSCRIPT = 'Test recording transcript — no AI provider called.'
export function mockTranslations(texts: string[]) { return texts.map(text => `[TEST] ${text}`) }
/** Valid 16-bit mono PCM WAV: 0.1 second of silence at 8 kHz. */
export function mockAudio() {
  const samples = 800
  const bytes = new Uint8Array(44 + samples * 2)
  const view = new DataView(bytes.buffer)
  const label = (offset: number, text: string) => [...text].forEach((c, i) => { bytes[offset + i] = c.charCodeAt(0) })
  label(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); label(8, 'WAVE'); label(12, 'fmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, 8000, true); view.setUint32(28, 16000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  label(36, 'data'); view.setUint32(40, samples * 2, true)
  return bytes
}
