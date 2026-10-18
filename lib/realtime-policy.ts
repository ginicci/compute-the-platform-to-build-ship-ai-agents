// Development integration only; never activate in production from this PR.
export const VOICE_SESSION_SECONDS = 60
export function realtimeEnabled(env: Record<string, string | undefined> = process.env) {
  return env.VERCEL_ENV === 'preview' && env.REALTIME_VOICE_TEST_ENABLED === 'true' &&
    env.REALTIME_SERVER_WATCHDOG_VERIFIED === 'true' && !!env.GINICCI_PWA_ISOLATED_DATABASE_URL &&
    !!env.OPENAI_API_KEY && !!env.REALTIME_MODEL && (env.VOICE_WATCHDOG_SECRET?.length ?? 0) >= 32
}
export function voiceSessionConfig(model: string, voice: string, instructions: string) {
  return {
    type: 'realtime', model, instructions,
    output_modalities: ['audio'], max_output_tokens: 1024,
    audio: {
      input: { transcription: { model: 'gpt-4o-mini-transcribe' }, turn_detection: { type: 'server_vad', interrupt_response: true, create_response: true } },
      output: { voice },
    },
  }
}
