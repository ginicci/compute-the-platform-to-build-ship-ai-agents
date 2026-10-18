# PR #49 external acceptance package

**Status: NOT accepted for launch. No externally verified tests recorded.**

## 0. Start here — owner + test lead

1. App owner appoints a test lead and an environment operator with Vercel, isolated PostgreSQL, email, Stripe sandbox and AI-provider access. Testers need physical iPhone/iPad Safari, Android Chrome, and supported desktop browsers. Do not use customer accounts or production data.
2. Review the pinned implementation preview below. Have the operator complete environment gates S01–S04 before any paid-provider test. If a service is missing, mark its tests BLOCKED with the named owner and setup step; never substitute a simulated pass.
3. Copy `PR49-EVIDENCE.csv` into a **private** test register. Record a separate row per test AND device/interface. Use PASS / FAIL / BLOCKED / NOT RUN. Capture build SHA, UTC time, browser/OS versions, tester, expected/actual result and sanitized evidence. No evidence = NOT RUN, not PASS.
4. Run accounts/history/trial before billing, then installation and voice. Do not reset the six-use ledger to make a test pass; create a new isolated account for a new run.
5. Owner reviews all failures and evidence. This package authorizes no merge, production deployment, migration or live billing. Environment setup/rebuild is an operator action requiring owner approval; the agent has not performed it.

### Exact preview and revision

- Pinned implementation: https://compute-the-platform-to-build-ioftzqmbj-ginicci-labs.vercel.app
- Branch preview: https://compute-the-platform-to-build-git-vercel-ag-ab9ab7-ginicci-labs.vercel.app
- Implementation commit: `12f9fc0921e318081d50d1874743252195d0ef54` (PR #49).
- Website chat: append `/onboarding`; installed-app interface: `/assistant`; `/sign-up`, `/sign-in`, `/install`, `/pricing`, `/account`, owner-only `/admin/premium`.

Use **one approved HTTPS origin** for the whole run; do not alternate the two preview hostnames (cookies/storage differ). Branch aliases can move after PR updates; record the actual deployment/commit before starting. The pinned preview was CLI-verified Ready, not externally customer-tested. GitHub records PR #49 merged by the owner at 2026-10-18 17:12 UTC; the agent did not merge it. This documentation/lint follow-up is a separate unmerged PR and does not change application behavior. Environment changes apply to a newly approved preview build, not retroactively to the pinned deployment. If rebuilt, record its new URL/SHA and use it consistently.

## 1. Isolated environment gates — stop until signed off

| ID | Owner / exact setup | Pass criteria / evidence |
| --- | --- | --- |
| S01 | App owner + environment operator: Vercel → ginicci-labs → compute-the-platform-to-build → Settings → Environment Variables. Use Preview, scoped to `vercel-agent/pr49-external-acceptance` for an approved follow-up build (or a separately approved acceptance project), never Production or all branches. Settings: https://vercel.com/ginicci-labs/compute-the-platform-to-build/settings/environment-variables . Audit all inherited values before running anything. If isolation cannot be proved, STOP. | Private checklist confirms DB, Stripe, auth, email, AI, owner alerts and origin targets are isolated. Record variable **names/presence only**, no values/screenshots of secrets. No production writes. |
| S02 | DB/auth operator: provision empty disposable PostgreSQL and dedicated least-privilege role; initialize Better Auth user/session/account/verification and existing subscription/consent schemas using the project's reviewed schema/migration process. This repo has no complete fresh-auth bootstrap SQL: if the team cannot provision those tables, BLOCK here; do not copy production rows. Then apply additive `scripts/ai-launch-quota.sql`, `pwa-conversations.sql`, `premium-trial.sql`, `unified-preferences.sql` only to that DB, checking FK dependencies. Set `GINICCI_PWA_ISOLATED_DATABASE_URL`; never use production `DATABASE_URL`. Configure unique `BETTER_AUTH_SECRET`, approved preview `BETTER_AUTH_URL`/trusted origin, preview-only `RESEND_API_KEY`, verified test `EMAIL_FROM`, and a test-only `OWNER_EMAIL` mailbox. Audit owner-alert recipients too. | Operator confirms isolated DB identifier privately, schemas ready, email arrives only in controlled inboxes, and account sign-up/verification succeeds. No auth secrets in evidence. |
| S03 | Stripe sandbox administrator: create a dedicated sandbox; generate matching sandbox secret and publishable keys. Preview-only `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `PREMIUM_BILLING_TEST_ENABLED=true`. Set recurring nonzero prices (month/year as needed) and configure the customer portal to allow cancellation at period end. Owner signs in at `/admin/premium` to enable price IDs for supported tiers plus positive successful-use allowance. No invented fallback prices. | Stripe UI explicitly shows sandbox; keys belong to same sandbox, server key is test-form, prices non-live and recurring. `/pricing` shows sandbox amount/currency/interval/allowance exactly. No production key imported. |
| S04 | AI operator: use a dedicated provider project/key and low test budget/alerts; configure approved `PREMIUM_AI_MODEL` and `PREMIUM_TRIAL_ENABLED=true` only in isolated preview. For voice also set preview-only `OPENAI_API_KEY`, `REALTIME_MODEL`, `REALTIME_VOICE_TEST_ENABLED=true`, random `VOICE_WATCHDOG_SECRET` ≥32 characters. Configure independent protected POST scheduler to `/api/voice/realtime/reap`, retries and alerts. Authenticate with protected Authorization header, never URL parameters. Prove reaping under process loss **before** setting `REALTIME_SERVER_WATCHDOG_VERIFIED=true`. A flag alone is not verification. | Operator records model, non-secret budget, watchdog cadence and failure/teardown evidence; fail closed if absent. No production voice enabled. Budget alerts are not guaranteed hard spending caps. |

If deployment protection blocks Stripe or scheduler ingress, the environment operator must arrange an approved isolated endpoint/protection exception. Never disable production protection or publish a bypass token in URLs/evidence. Missing sign-up verification mail is an email-operator blocker, not permission to bypass verified email.

### Safe test accounts

Create controlled inbox aliases for A (cross-device trial), B (account isolation), C (billing), V (voice), and O (owner setup). All on isolated preview DB; use unique generated passwords kept in the team's password manager. O alone matches preview `OWNER_EMAIL`; do not give admin access to A/B/C/V. Verify each email normally. Use synthetic conversations such as “Acceptance run R01: plan a three-step desk tidy,” never personal/business-sensitive data. No real cards. Do not record cookies, auth links, access tokens, full HARs, SDP, audio of bystanders or raw webhook bodies. Use consented test speech only.

## 2. Account, history, preferences and six-use trial

Run A01–A04 on desktop website, desktop `/assistant`, iPhone Safari and installed PWA, Android Chrome and installed PWA. Separate sessions may require signing in again with the **same account**; cookie sharing or automatic sign-in across devices is NOT required. Server-owned account context is required. Unsaved drafts intentionally do not sync.

| ID | Steps | PASS / expected result; otherwise FAIL |
| --- | --- | --- |
| A01 | Sign up/verify A. Sign in on each interface using same origin/account. Open account and Premium status. | Correct account on each; initially six remaining, no pending. No production account/data. |
| A02 | On website, ask a synthetic planning question, wait for full successful result. Save via Conversations & preferences with a unique title; opt into autosave only deliberately. On each other interface sign in, open library and resume. Reply there, save; return to website and reload/resume. | Same saved turns/title, no missing/duplicate turns; both directions work. Unsaved draft is not claimed synchronized. Note any reload needed. |
| A03 | Change an available preference in Conversations & preferences and save. Reload on another device. Open same saved conversation in two sessions; save change on one, then attempt stale save on the other. | Preference matches; stale write rejected instead of overwriting latest history. If desired preference is not implemented, record unsupported, not PASS. |
| A04 | Sign out one session; sign in as B. Inspect library/balance and try navigating previous saved-chat UI. | No A history/preferences/results exposed; B has its own six-use balance. Signing out locally need not sign out all devices. |
| T01 | With A, use A02 success as #1. Complete #2 on iPhone, #3 Android, #4 desktop app, #5 website, #6 another installed PWA. After each complete delivery/reload, record balance on every signed-in surface. Account for one result only once even after reload/recovery. | Sequence 5,4,3,2,1,0 on all surfaces (allow refresh/15-second polling). No allowance reset by install/sign-in/switch. Same model quality configured for trial/paid. |
| T02 | Before exhausting A, start a distinct request and stop while streaming. In a separate new isolated account, operator induces one controlled provider failure without altering shared/production keys. Record used/pending before/after. | Neither failed nor stopped generation becomes a completed charge; temporary running lease can take up to two minutes to expire. Completed durable result with lost delivery is a held reservation, not a free retry loophole. |
| T03 | Interrupt delivery after a full result is persisted. Restore network, choose Recover premium results; repeat recovery twice. | Private saved result recoverable; receipt charges at most once. Pending reservation clears; other account cannot recover it. If persistence timing cannot be demonstrated, BLOCK rather than infer. |
| T04 | After sixth success, send seventh on another surface. Review pricing and saved results. | Generation denied before provider spend; respectful upgrade path; saved results still available. No repeated pre-exhaustion upgrade nudges. |
| T05 | On fresh V, complete one meaningful voice session with multiple spoken turns (under voice gates below), then reload every surface. | Exactly one qualifying use for entire session, not per sentence. No completed usable output/user speech = no qualifying charge. Run after S04, not by substituting dictation. |

Evidence for each: sanitized screenshots of library/preference/balance before/after, UTC timestamps, pseudonymous account label, non-secret request correlation IDs and operator-confirmed ledger state counts. Never export conversation contents beyond synthetic test text.

## 3. Stripe sandbox acceptance

Stripe administrator must complete S03. Register sandbox event destination with exact approved origin + `/api/stripe/webhook`. Select supported events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`, `.updated`, `.deleted`, `.paused`, `.resumed`. Copy its signing secret into protected preview settings, not chat/logs. Endpoint requires raw signed payload; do not route through middleware that rewrites it. Verify sandbox origin is accessible to Stripe before checkout.

| ID | Steps | PASS / expected result; otherwise FAIL |
| --- | --- | --- |
| B01 | As C, compare `/pricing` to sandbox price and configured allowance. Start checkout, read terms/renewal/cancel disclosure; leave before payment. Also attempt checkout signed out. | Exact non-live currency/amount/interval; annual allowance spans annual period. Consent required. Abandonment grants no paid entitlement; guest redirected to sign-in. |
| B02 | As C, use Stripe test card `4242 4242 4242 4242`, any future expiry and valid synthetic CVC/postcode. Complete sandbox checkout once; return to account. Never use real card details. | Sandbox invoice paid, subscription active, server-verified Premium; not granted by return URL alone. Record sanitized checkout/subscription/invoice/event IDs privately. No live objects. |
| B03 | Send a successful Premium request from website and installed PWA as C. Refresh account/balance, inspect allowance/period. | Same verified entitlement and allowance across interfaces; successful uses increment once; no duplicate subscription. |
| B04 | In sandbox event destination inspect deliveries for actual B02 events and application DB sync. Resend one of those **actual** events twice using Stripe Dashboard controls. | Valid signed events get 2xx; no duplicate subscription/credits. Entitlement still matches Stripe. Checkout's direct confirmation cannot alone prove webhook delivery. Synthetic unrelated subscription fixtures are insufficient. |
| B05 | External test engineer sends missing-signature and intentionally invalid-signature requests to isolated webhook, without real event payload/secret. | 400, no entitlement or DB mutation. Valid actual Stripe delivery still succeeds afterward. Do not paste signing secrets into shell commands or capture raw request headers. |
| B06 | As C: Account → Manage billing → cancel renewal at end of period. Confirm in portal and app, then make one request while still paid/unexpired. | `cancel_at_period_end` and end date agree; paid access retained to end, no new renewal. Actual `.updated` webhook delivers and syncs. |
| B07 | On a separate paid test account, sandbox admin ends subscription immediately (or uses a compatible test clock to advance past paid period). Deliver actual event; refresh both interfaces and request Premium. | No paid entitlement after canceled/expired period. An unused trial may still apply, so use an already-exhausted trial account to prove paid denial. Record exact account/trial state. |
| B08 | On separate C2, use Stripe's documented declined test card; confirm no settled paid entitlement. On separate paid C3 issue a sandbox refund and retry Premium. | Decline grants no paid access; refunded/disputed/unpaid state fails closed per code. Verify actual webhook where supported and authoritative Stripe checks, not UI message only. |

Authoritative references: https://docs.stripe.com/testing/overview ; https://docs.stripe.com/billing/testing ; https://docs.stripe.com/billing/subscriptions/webhooks . These recommend real sandbox subscriptions for correlated lifecycle events. Use only sandbox controls; no live event injection. Record delivery IDs, UTC, HTTP status, non-secret subscription state and screenshot of sandbox label. Protect customer email and payment metadata.

## 4. Physical installation matrix

Run on real hardware, not UA emulation. Record make/model, OS/browser version, origin and deployment SHA for each row; attach private screen recording of install → icon launch → sign-in → resumed saved chat.

| ID | Device / procedure | PASS / expected result; otherwise FAIL |
| --- | --- | --- |
| I01 | iPhone Safari: `/install` → Share → Add to Home Screen → Add (Open as Web App if offered). Launch icon, sign in as A, resume saved chat. Repeat on iPad if supported in release matrix. | Relevant concise Safari guide, correct icon/name, standalone window where supported, account data/trial matches. No fake native prompt. |
| I02 | Android Chrome: use genuine offered Install prompt; also test dismiss and retry via browser menu. If no prompt, use offered Install app/Add to Home screen; launch icon. | Browser performs real install/shortcut behavior honestly; dismissal leaves website usable; saved account context restored after sign-in. Record shortcut vs installed app. |
| I03 | Desktop Chrome/Edge: address-bar/menu installer when offered; launch installed app. macOS Safari: File → Add to Dock if supported. | Actual OS launch, same account/history; unavailable method gets honest website fallback. Do not call unsupported browsers install-capable. |
| I04 | Restricted/private/in-app browser: open install guide, continue without installing. Reopen website from installed interface via website navigation. | No nonfunctional install button or forced app-store trip; website works. “Open app” is navigation, not guaranteed OS force-launch. |
| I05 | On each device rotate/zoom, keyboard-only where available, screen reader labels/focus; background/relaunch and sign out. Try offline. | No trapped focus/blocked zoom/horizontal overflow; clear navigation, no private chat available to another account or cached offline. Offline AI is not promised; reconnect path clear. |

## 5. Real voice protocol — voice tester + AI operator

Only after S04 and explicit budget approval. Dedicated V account, consented synthetic speech, headphones where appropriate, quiet room then modest background noise. **Live voice** in Conversations is different from Mic dictation/Read aloud; test the WebRTC realtime path. Agree thresholds before running: proposed initial targets median end-of-user-speech → first audible answer ≤2.5s, p95 ≤5s over 20 turns across multiple capped sessions; interruption audio stops ≤1s in 5/5 trials; ≥4/5 naturalness/intelligibility from two consenting testers. These are acceptance targets, NOT product guarantees or measured results. Record raw timing samples privately; never invent p95 from a few turns.

| ID | Steps | PASS / expected result; otherwise FAIL |
| --- | --- | --- |
| V01 | Deny microphone permission first; retry after granting in browser settings; test no microphone/unsupported browser. | Plain recovery message, typing still works; denial creates no qualifying use. Permission requested only on explicit start. |
| V02 | Hold short multi-turn everyday conversation, natural pauses, change topic/language, request clarification. Rate response warmth, accuracy and voice naturalness. | Understandable relevant AI responses; no repetitive scripted greeting, human identity claim or unsupported executed action. Both raters ≥4/5 or mark quality FAIL. |
| V03 | Measure 20 response latencies and 5 interruptions using consented recordings/timestamps. Interrupt long reply, then ask a different question. Test mute/unmute and Resume audio after autoplay block. | Meets agreed latency/interrupt targets; new turn respected, mute actually stops transmitted mic input, no overlapping stuck audio. |
| V04 | Mid-session switch Wi-Fi/cellular; then airplane-mode briefly and restore. Recover saved results; continue in text and start a fresh voice session if necessary. | Honest interrupted/ended state, no endless spinner or ghost audio; typing usable; no automatic retry loop spending credits; delivered session charged at most once. Transparent manual restart is acceptable, seamless reconnect not promised. |
| V05 | End normally; navigate away; close installed window; background/lock phone; revoke mic mid-call. Inspect media indicator and browser media-track state plus provider-side activity. | Local mic/audio stop promptly (target ≤2s after explicit End); provider call terminates at cap or reaper SLA below. No charge per sentence, no duplicate transcript/use. |
| V06 | Run >60 seconds and simulate server/process loss on isolated infrastructure. AI operator checks independent reaper, provider usage and actual cessation of media. Proposed orphan bound: 70s stale threshold + scheduler cadence + 15s processing allowance; record cadence and approved bound before test. Force one hangup failure and verify retry/alert. | 60s session cap enforced; orphan ends within agreed bound; retry/alert works. A successful hangup HTTP response or DB `provider_ended_at` alone is NOT proof of actual media teardown. Without independent evidence BLOCK voice release. |
| V07 | Complete meaningful multi-turn session and one abandoned session without usable output; recover result twice. | Meaningful session counts once; abandoned/no-usable-output session not charged. Ready durable output can reserve a slot until receipt. Text continuation includes delivered voice transcript without duplicate charge. |

Capture per-device timing CSV, two-rater scores, permission/network-recovery recordings, non-secret provider-call correlation and usage end times. No raw SDP, Authorization headers, transcript PII or API keys. Do not label voice production-ready until every required device's voice tests and teardown gates pass; passing them still requires separate production security/transport review and approval.

## 6. Evidence, defects, release decision and cleanup

- `PR49-EVIDENCE.csv` has every test ID prefilled NOT RUN; duplicate device rows. Store sensitive artifacts privately; commit only sanitized summary and private evidence references permitted by repository visibility. External tests remain NOT RUN until a human tester supplies dated evidence.
- On FAIL: record reproducible steps, expected/actual, severity, build, affected device, safe correlation, owner and retest ID. Stop on account leakage, live-key detection, unintended live payment or unbounded voice; disable **test** flags/access and notify owner privately. Do not remediate production in this workflow.
- Before acceptance, every required matrix row is PASS with evidence, all blockers resolved, service budgets/retention reviewed, provider cleanup proved, and owner signs off. NOT RUN/BLOCKED is not N/A unless owner explicitly removes that platform/capability from release scope. No production recommendation based on automated checks alone.
- After run: cancel all sandbox renewals, remove webhook/scheduler destinations if no longer needed, revoke temporary test credentials via provider controls, delete test account content per approved retention, and retain only sanitized evidence. Never delete ledger rows on a live account to renew a trial.

## 7. Known completed checks versus blockers

**Completed automated checks for implementation `12f9fc0`:** 73 tests, zero skipped (includes 12 real disposable PostgreSQL subtests); TypeScript; nine Chromium component scenarios; two local Next.js guest/responsive journeys. Stripe fixtures and install events are simulated. Vercel preview Ready (~22s build). None establishes real device/payment/voice acceptance.

**Externally verified:** none recorded. Evidence register deliberately NOT RUN.

**Setup blockers:** S01 operator confirmation, S02 isolated DB/bootstrap + verified test inboxes, S03 connected Stripe sandbox + webhook ingress/portal/prices, S04 funded isolated AI + independently verified watchdog, physical-device testers. The agent cannot supply physical access or perform external service interactions here; do not request credentials in chat.

### Lint follow-up

ESLint 9, its standard JS recommended config, TypeScript ESLint recommended config, globals and React Hooks plugin registration are now installed as development-only dependencies. `pnpm lint` runs instead of failing “eslint: not found”. No application dependencies changed. Rules were not disabled to hide findings; this is a basic JS/TS lint baseline, not full Next.js/React accessibility coverage. Existing findings and fix ownership are in `LINT-BASELINE.md`; lint remains a failing check until those are reviewed. Do not confuse runnable configuration with a lint pass.

### Google Fonts and build

Existing `app/layout.tsx` uses next/font/google for Instrument Sans, Instrument Serif and JetBrains Mono. Local production build fails fetching these under sandbox egress restrictions; local dev falls back. Pinned Vercel preview build passed. Do not weaken the build or claim local production build passed. Fonts are downloaded at build and self-hosted; customers should not need a runtime Google request. For offline/reproducible builds, maintainer can separately review licensed font assets + licenses and migrate to next/font/local, preserving weights/metrics and testing layout on devices. No font substitution is made here. Reference: https://nextjs.org/docs/app/getting-started/fonts .

Existing `next.config.mjs` has `typescript.ignoreBuildErrors: true`; therefore Ready is not TypeScript verification. Keep separate `pnpm typecheck` mandatory. This package does not silently change that pre-existing build setting.
