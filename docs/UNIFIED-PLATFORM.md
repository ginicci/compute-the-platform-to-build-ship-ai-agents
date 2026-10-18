# Unified conversations and realtime voice — implementation handoff

## Current architecture (verified 2026-10-18)

The production deployment of `compute-the-platform-to-build`, from main commit `eb73757`, now has `www.ginicci.app`, `ginicci.app`, `www.ginicci.com` and `ginicci.com` as aliases. This supersedes the earlier missing-repository/live-domain dependency in `PREMIUM-TRIAL.md`. The recent merge and alias assignment were already present when this work began; this PR makes no production deployment/domain changes.

Authoritative application repository: this repository, linked to `compute-the-platform-to-build`. Both responsive `/onboarding` and installed `/assistant` PWA call the same Next.js API, Better Auth session and PostgreSQL pool. The older `business-growth-ecosystem` project still has an unlinked uploaded-source deployment, but the inspected public aliases now point to this application instead. Do not deploy the old project as a second entitlement backend. The additionally inspected `ginicci` project links to `ginicci/northstar`, a different Next.js frontend; no separate native/mobile frontend or shared-auth service was evidenced there. It is unchanged. The mobile application implemented here is the existing installable PWA, not an invented native app.

Scope of verification: deployment metadata/aliases, source, actual isolated PostgreSQL API tests and provider-free fixtures. We cannot issue deployment HTTP requests from this sandbox, and have not signed into production, queried customer records or verified synchronization on actual devices. The shared implementation is tested; do not confuse that with passed production end-to-end acceptance.

## Changes implemented

### Shared conversations and preferences

- **Both interfaces now render the same `ConversationLibrary`, `LiveVoice` and `RichMessage` components.** There is one account history API, one preferences API and the existing premium ledger/Stripe backend.
- Explicit save, opt-in automatic save, refresh/resume, new conversation, account voice preference (Marin/Cedar), and automatic-save preference persist in PostgreSQL. Defaults do not silently retain conversations. Focus/refresh reloads account settings and history; this is not push-based collaborative editing.
- Revision-based history updates reject stale writes from another interface rather than silently overwriting them. Refresh/reopen the newer saved version after a conflict. History is limited to the latest 20 conversations and 100 messages/100k text characters per stored conversation. No private browser storage/service-worker caching is introduced.
- Premium text input now accepts bounded saved conversation context, including full 4096-token replies; the prior 4k-total-character history validator could reject follow-ups to long premium replies. New model context uses the newest 20 messages/48k text characters, with an individual-message cap of 24k. Oversized newest user messages are rejected rather than silently truncated. Older context is omitted under the explicit bounded policy; there is no invisible long-term model memory.
- Existing auth, legal consent, owner guard, account ledger, configured Stripe prices, signed webhooks and verified test billing remain reused. No second identity/database/credit counter was created.

### Advanced text

- Premium generation now streams actual text deltas as they arrive, not a buffered result presented as a stream. A usable response is persisted **before** successful finish is emitted; the existing authenticated delivery ACK deducts the credit once. Partial, provider-failed, filtered, truncated, stopped or disconnected generation does not emit a successful finish or charge a completed use. Durable results can still be recovered without regeneration.
- Both UIs support edit/resend, stop, intentional new-answer generation, copying responses, safe Markdown rendering (raw HTML skipped; safe URL transform retained), multiline input, loading/error states and account history. Intentional regenerated answers get a fresh user-message ID; network retries keep the original ID. A new successful generation costs a new use, while a replay does not.
- Prompts now allow useful structured Markdown. No model tools, external-action execution, image/PDF uploads or arbitrary file URLs have been introduced. Unsupported multimodal parts are rejected. Attachments require model support, private storage, malware/size/type controls and a separate review; they are **not implemented** by this PR.

### Live voice integration (preview-only, unverified with real audio)

Selected **OpenAI Realtime WebRTC**, using its documented **Realtime API** (not the separate newer GPT-Live API). Browser audio travels directly through WebRTC; an authenticated server route proxies the initial SDP/session creation using a server-only key. No standard or ephemeral provider credential is returned to the browser. Server-side `ws` sideband observes provider events, inserts the latest bounded text context, meters one session, watches unsafe generation-cap/tool changes and terminates calls through the provider hangup API. `REALTIME_MODEL` is required/configurable; `gpt-realtime-2.1` is a documented candidate, not an unverified hard-coded default.

Implemented controls: user-triggered microphone permission, echo/noise constraints, remote audio, captions, automatic VAD interruption, explicit interrupt/cancel and output buffer clear, mute/unmute, end voice, connection/permission errors, autoplay recovery, media track cleanup, and transcript transfer into the current text conversation when voice ends. Text/history actions are disabled during an active voice session to avoid context races; users can keep drafting then end voice to send. Full duplex behavior and mobile autoplay/permission handling still require real-device testing.

Qualifying-use policy:
- One session of **up to 60 seconds** reserves one slot from the exact same trial/paid ledger used by text.
- A session is qualifying only when the server sideband observes transcribed user speech AND at least one provider `response.done` with completed status and a usable response transcript. Multiple turns/sentences in that session still consume only one use.
- Cancelled/incomplete output alone, microphone/setup failure or empty sessions do not qualify. Successful session transcript becomes recoverable; the client receives the saved result and sends the same authenticated delivery acknowledgement. No per-sentence credit deductions and no entitlement changes from browser transcript claims.
- Provider response usage is stored in `premium_requests.provider_usage` for reconciliation; it is not represented as settled financial cost. Transcripts may be imperfect and are not a verbatim guarantee of audio heard. Browser captions are not entitlement evidence.

Safety/activation boundaries:
- **Hard-disabled in production by code**, regardless of flags. Voice runs only in a preview with an explicitly isolated DB, enabled premium model, configured realtime model/key, voice test flag and verified-watchdog flag/secret.
- `after()` maintains the sideband work inside a 120-second function invocation; the server attempts hangup at 60 seconds. Function lifetimes, provider/API failure and client-controlled data-channel commands mean an in-process timer is NOT a durable hard financial cap.
- Added authenticated `POST /api/voice/realtime/reap` for an independent scheduler/operator watchdog: it attempts provider hangup for unclosed calls older than 70 seconds, marks only accepted hangup/not-found responses and returns 503 if any retry is needed. **No cron/scheduler is configured by this PR.** Configure frequent external checks and alert/retry handling, provider account budgets, and verify teardown/recovery before setting `REALTIME_SERVER_WATCHDOG_VERIFIED=true`. `provider_ended_at` records an accepted hangup/not-found response, not an independently measured end of media; OpenAI documents HTTP 200 as starting teardown. Actual teardown must still be tested. A killed function can otherwise leave a provider session open. Keep voice off until verified.
- Direct WebRTC clients can inspect session configuration and issue provider data-channel commands. Do not put credentials, proprietary secrets or customer-private records into prompts. Cap-change/tool detection and the watchdog are defense-in-depth, not a proven immutable provider policy. If instructions must be confidential or stricter provider-command mediation is required, use a reviewed server-mediated media transport before production activation.
- No recording/raw audio is stored by this application. Audio is transmitted to OpenAI; provider retention/residency and consent requirements must be reviewed for the account/region. No zero-retention or regulatory-compliance claim is made. The built-in browser dictation/read-aloud fallback remains available and is distinguished from premium live voice.

## Technology choice and evidence

OpenAI's documented Realtime browser flow supports native speech-to-speech, WebRTC, VAD, automatic interruption, captions, server-side sideband events and a server hangup endpoint. This minimizes custom mobile audio resampling/buffering. Gemini Live is also viable, with native audio/VAD/interruption; its documented direct integration requires additional audio/WebSocket buffering and resampling work, and ephemeral tokens are described as preview. No provider was audibly benchmarked here and no claim of best measurable latency/naturalness is made. GPT-Live is a different API with different event/transport schemas and is not silently mixed into this adapter.

Sources consulted:
- OpenAI Realtime introduction: https://developers.openai.com/api/docs/guides/realtime
- WebRTC (Realtime tab/section), unified multipart SDP creation: https://developers.openai.com/api/docs/guides/voice-webrtc
- Sideband and call ID: https://developers.openai.com/api/docs/guides/voice-server-controls
- Hangup: https://developers.openai.com/api/reference/resources/realtime/subresources/calls/
- Transcript/turn events: https://developers.openai.com/api/docs/guides/realtime-conversations
- Gemini Live interruption/capabilities: https://ai.google.dev/gemini-api/docs/live-api/capabilities
- Gemini ephemeral token caveats: https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
- Gemini live buffering, resampling and context costs: https://ai.google.dev/gemini-api/docs/live-api/best-practices
- Vercel function duration: https://vercel.com/docs/functions/configuring-functions/duration

## Model quality and expected costs

Text still uses the server-configured `PREMIUM_AI_MODEL` through the installed AI SDK/Gateway, identical for paid and trial requests. No silent model downgrade, autonomous tools, extra paid benchmark calls or failover models were added. Stronger model choice needs task-based quality/latency/cost measurement; credentials/approval for real inference weren't provided. AI Gateway pricing depends on selected model and token counts, so an accurate per-request dollar estimate cannot be supplied without that model and measured usage. Source: https://vercel.com/docs/ai-gateway/pricing.

For a configured `gpt-realtime-2.1`, current published rates are $32/million audio input tokens, $64/million audio output tokens; text input/output $4/$24 per million. A **hypothetical** session billed for 1,000 input + 1,000 output audio tokens costs $0.096 in audio, plus $0.028 if it also bills 1,000 input + 1,000 output text tokens. This is NOT a token-to-minute conversion or a measured session price. Transcription via `gpt-4o-mini-transcribe` is separately listed at an estimated $0.003/minute. Context reprocessing, speaking duration, cached input, reasoning, transcription, provider billing and Vercel/database usage affect totals; six free uses can still cost the operator money even if failed generation does not consume a customer credit. Confirm actual token usage against invoices and enforce provider budgets before testing publicly.

Pricing references: https://developers.openai.com/api/docs/models/gpt-realtime-2.1 and https://developers.openai.com/api/docs/pricing. Rates are retrieval-time documentation, not invented subscription prices. Subscription amounts remain owner-configured Stripe test prices.

## Migration and setup

Merge order: PR #46 was already merged into main before this branch. Review this follow-up against main; no other repository PR is required for the currently aliased public website/PWA. Existing separate/native frontends, if any are later supplied, must use these authenticated APIs rather than duplicate the database or ledger.

In an isolated test database, apply existing prerequisites first:
1. Existing Better Auth/application schema.
2. `scripts/pwa-conversations.sql` and `scripts/premium-trial.sql` if not yet applied.
3. New additive `scripts/unified-preferences.sql`: account preferences, conversation revision column, server-only call identity, provider usage and termination timestamps. No destructive changes or production migration was executed. New migration is tested for repeat application.

Existing configuration remains: Better Auth origin/secret/email; private PostgreSQL; Stripe test keys/publishable key/webhook/portal; owner email; premium trial and billing flags; `PREMIUM_AI_MODEL`; preview `GINICCI_PWA_ISOLATED_DATABASE_URL`. Match server and client Stripe modes. Do not activate live billing.

New protected environment inputs (values never placed in Git/chat):
- `OPENAI_API_KEY`: dedicated provider-project key on server only; restrict budget and permissions.
- `REALTIME_MODEL`: approved compatible **Realtime API** model.
- `REALTIME_VOICE_TEST_ENABLED=true`: explicit preview opt-in only.
- `VOICE_WATCHDOG_SECRET`: at least 32 characters, shared only with the authorized independent POST scheduler.
- `REALTIME_SERVER_WATCHDOG_VERIFIED=true`: set ONLY after the independent watchdog, provider termination and failure/retry alerts are proven. A flag does not provision or verify a watchdog.

Protected Vercel path: Project → Settings → Environment Variables. No environment values or settings have been changed by this work. No voice calls, production migration, payment, live subscription activation or production deployment was performed by this PR.

## Validation and remaining gates

Executed:
- **63 automated tests passed, zero skipped**, including 12 real disposable PostgreSQL subtests for trial/concurrency lifecycle, shared voice/text credit balance, actual preferences/history endpoints, account isolation and stale revisions.
- Provider-free voice event tests for meaningful-session detection, cancelled output, duplicate response events, server-side hangup/persistence, unsafe cap changes, sanitized provider errors, guest/origin/disabled denial and watchdog authorization.
- Existing signed Stripe fixtures, payment/refund/expiry checks, trial controls, actual AI SDK stream reconstruction and auth/history regressions remain passing. Streaming tests now execute streaming deltas/error behavior, not a buffered generation stub.
- `pnpm typecheck` and `git diff --check`: passed. Frozen pnpm install passed with generated lockfile. Added only `ws`, its types and `react-markdown` (including their normal lockfile dependencies).
- `pnpm lint`: attempted; existing script fails because ESLint is absent/unconfigured. No lint pass claimed.
- Local `pnpm build`: attempted; existing Google Font downloads blocked by sandbox network restrictions. No local production-build success claimed. Preview/CI build status is reported separately in the PR.

Not executed / not complete: actual provider voice/text calls; audible quality/latency/provider comparison; actual WebRTC/sideband connectivity; hard-cap/provider budget enforcement; watchdog scheduling/teardown under process death; mobile/Safari/Android microphone/autoplay/barge-in behavior; real website-to-PWA sign-in/resume; actual Stripe sandbox checkout/refund/portal; real accessibility/visual/device acceptance. Uploaded image/document support, confidential-prompt media proxying and arbitrary native-app integration are not implemented. No claim that this is a complete production-ready live voice platform.

Before enabling voice: configure isolated accounts and DB/migrations; configure watchdog/alerts and provider budgets; validate actual Realtime API model/event schema; benchmark voice quality/first-audio latency and transcripts on target devices; prove final-credit races across voice/text and teardown failures; review privacy/retention and multi-account abuse controls; verify real Stripe sandbox flow. Keep production voice and live billing off pending separate explicit approval and production transport/hard-budget review.
