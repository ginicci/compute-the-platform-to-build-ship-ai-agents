# Ginicci PWA preview — not approved for production

Uses existing Next.js site, Better Auth sessions (7 days with daily renewal, verification/password-reset revocation preserved), AI SDK transport, shared UI Button and server-only chat. Adds /assistant, /install, proper Ginicci manifest and PNG/maskable/Apple icons, safe public-only service worker, offline notice, full-height mobile chat, new chat and explicit private account history saving.

Guest access is a **two-message per visit mock demo**, not paid/live AI. Client counters are not security boundaries: guests cannot reach paid chat at all. Implement durable signed guest IDs + IP/global reservations and anti-abuse tests before enabling any guest provider calls. Sign-in remains required for saved history and real AI.

Voice uses browser SpeechRecognition where supported and user-initiated speechSynthesis. Dictation can use the browser vendor's remote service; consent notice shown. No automatic recording/playback, paid speech provider or background agent. Device/browser voice behavior has NOT been verified on real iPhone/Android.

History API verifies session, scopes SELECT and UPSERT to user ID, validates bounded text-only messages, requires matching Origin for writes and uses no-store. No localStorage, IndexedDB or service-worker private caching. History is explicit save; not automatic. Current bounded history accepts up to 9 messages / 4,000 total characters. Account switching/sign-out clears UI. Production migrations were not applied.

Preview isolation: databaseTarget ignores inherited DATABASE_URL in VERCEL_ENV=preview. GINICCI_PWA_ISOLATED_DATABASE_URL must be a separate test DB; otherwise localhost makes login/history unavailable. Never set it to production. Preview Stripe webhook is disabled; checkout/paid entitlements remain closed. AI flag remains false until verified controls. Apply both SQL migrations only to isolated DB to test real login/history/quota concurrency. Mock returning-user tests do not establish real cookie persistence.

CLI local preview deployment was rejected: "You don't have permission to create a v0 Deployment for this Vercel project: compute-the-platform-to-build." Use Git PR integration as the alternative preview path; never merge before release checklist passes.

Checklist: successful preview build; isolated auth database and mail fixtures; guest/returning login/logout/expiry/cross-account history tests; iPhone/Android installation, keyboard/safe-area and voice checks; no secret leakage/private cache; quota concurrency and generation-cost reconciliation; confirm auto-recharge OFF and $1 non-renewing Gateway budget/alerts. Current $1 infrastructure budget does not protect Gateway credits. No paid AI test performed. No native apps in this phase.

Existing ginicci.com configuration redirects to www.ginicci.app. Kept unchanged to avoid changing production routing/cookie origins. Before launch, choose one canonical install origin and deliberately migrate existing sessions as needed; a PWA does not share browser cookies across origins or necessarily across iOS contexts.
