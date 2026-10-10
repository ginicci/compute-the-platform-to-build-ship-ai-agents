import { aiUnavailable } from '@/lib/ai-policy'

// Voice is outside the text-only launch trial; no provider calls.
export async function POST() { return aiUnavailable() }
