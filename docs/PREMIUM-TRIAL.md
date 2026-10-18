# Six-use premium trial — review and release guide

## Delivery status

Implemented in the linked application for review; **not production-activated**. No production database migration, settings/domain/repository connection change, provider call, or payment was performed by this work. Checkout is test-only in code. Do not merge as an assertion that the separate live domain is integrated.

## Architecture verified on 2026-10-18

- Vercel `compute-the-platform-to-build` links to this GitHub repository. Next.js App Router, Better Auth verified-email sessions, PostgreSQL/pg/Drizzle, AI SDK 7, Stripe 22 are reused.
- `/onboarding` (responsive website agent interface) and `/assistant` (installable mobile PWA) both call `/api/chat` and the SAME account/session/database. This PR integrates both. There is no separate native-app repository evidenced by this checkout.
- `ginicci.com`/`www.ginicci.com` redirect to `www.ginicci.app` in the existing Next configuration. Redirects are unchanged.
- Vercel `business-growth-ecosystem` serves `www.ginicci.app` but has **no GitHub link**. Its production deployment's retrievable uploaded source has `src/app/api/chat/route.ts`, directly invoking `openai/gpt-5-mini` without authentication in that handler. Its sign-in page says authentication is ready to connect to a Neon Auth workspace; it does not implement Better Auth. This is not evidence of a shared backend. Source layout differs from this repository.
- No GitHub origin/commit appeared in that deployment metadata. Do not connect this repository to that project or overwrite uploaded source on assumption. Its authoritative repository or v0 export needs to be supplied/connected by its owner. No recovered uploaded files are committed here.

### Live website dependency

In Vercel → business-growth-ecosystem → Settings → Git, connect the **verified source repository** (or export its v0 project to GitHub first). Then apply the shared authenticated backend deliberately: either move that frontend into this application with its existing design preserved, or configure an authenticated shared service with reviewed same-site/cross-origin session handling. Do not copy counters into a second database or trust browser-supplied identities. A separate native frontend, if one exists, needs its source and authenticated API contract too.

The uploaded site's unauthenticated AI route remains outside this PR's enforcement. Its existence is a release/security dependency, not a claim of exploitation. The six-use limit is NOT enforced across that separate live deployment until wiring is completed. No production route or domain was changed.

## Behavior

- Eligible account means an authenticated Better Auth account (existing auth requires verified email). Each account without ledger entries starts with six lifetime premium uses. Existing accounts also receive this new allowance; legacy launch attempts/monthly counters are not imported or reset. No owner bypass. Multiple accounts/identity fraud beyond verified email and auth signup limits still need product anti-abuse policy before public launch.
- Qualifying features are all nine existing **text specialist agents**. Voice generation/transcription and dynamic translation remain disabled as before, not advertised as premium capabilities. Existing browser speech functions remain. Free browsing, guest mock demonstration and account-only saved history remain.
- `PREMIUM_AI_MODEL` is mandatory. It selects the SAME real model for trial and subscribers, with the same prompts, input validation, 4096-token output budget, zero SDK retries and 45-second generation deadline. No trial downgrade or fake premium result. Select and fund an approved capable model before enabling; provider quality/connectivity is not verified by fixtures.
- `running` reserves a slot under a PostgreSQL per-account transaction advisory lock. Trial capacity includes running, ready and completed records. One generation/account at a time and six attempts/minute, including failures, limit abuse. Paid usage also has an administrator-configured billing-period allowance.
- Success becomes `ready` with a durable, account-private result. The SDK's successful, non-aborted completion callback acknowledges its server-generated result UUID. Only then does it become `completed` and deduct one credit. ACK is idempotent and cannot modify another account's records. Declining ACK cannot bypass six slots: ready records retain reservations.
- Empty, filtered, truncated, aborted, provider/DB-failed results never become completed uses. A crashed running request expires after two minutes, longer than the provider deadline; late completion cannot write it. A retry of an already failed message ID returns `request_failed`; send a new message after checking saved results.
- Last user-message ID is the idempotency key, bound to account, feature and normalized input hash. Concurrent retries generate once; changed-input replay returns 409. Ready/completed replay returns original output with no provider call. Cross-feature reuse of the same ID is rejected, not recharged.
- Interrupted delivery: use **Recover premium results** on either frontend. The latest 50 durable results are account-filtered, uncached, and remain accessible after trial/subscription expiry. Receipt of recovered result payloads acknowledges them; opening recovery never regenerates or double-charges them. Held reservations are shown separately from remaining completed-use credits.
- At four/five completed uses, a quiet banner links to pricing. At six completed uses, the API returns 402 `premium_required` before generation, and the UI offers upgrade. If all slots are held but not acknowledged, API returns 409 pending rather than falsely claiming six delivered uses.

## Payment and pricing

- `/admin/premium` is protected by the existing `requireOwner` server guard. Configure existing tier names, recurring Stripe **test** price IDs, interval, enabled state, and successful uses per billing period. Amounts/currency come from Stripe, not client input or old hard-coded tier prices. No prices are seeded. Monthly/annual options appear only if configured.
- `/pricing`, landing pricing cards, embedded `/checkout`, `/account`, and existing portal are connected. Annual quotas are per annual billing period, not automatically monthly. Unsupported/unconfigured prices do not create checkout.
- Checkout requires authenticated user, terms consent, enabled configured plan, explicit billing test flag and an `sk_test_` server key. It creates no card-based free trial; the six-use account trial is independent. Existing non-ended subscriptions must be managed rather than bought twice. Five-minute per-account Stripe idempotency protects concurrent checkout creation (changing a plan during that window may require waiting).
- New paid entitlement is never based on browser completion or DB status alone. Every premium request re-reads Stripe subscription, matching configured price/user, active/unexpired period, paid nonzero latest invoice, paid invoice payment, succeeded PaymentIntent and paid unrefunded/undisputed charge. Unknown payment methods, partial/full refunds, disputes, unpaid/trialing/past_due/canceled/expired states fail closed. Stripe outage denies generation rather than guessing entitlement.
- Signed webhooks re-sync subscription state, including invoice paid/payment failed. Existing sync logic re-reads Stripe and upserts subscription ID, so repeated events don't grant credits. In explicitly enabled test mode live events are rejected. Existing production webhook handling remains available when the new test flag is off so existing obligations aren't orphaned.
- Cancellation scheduled for period end retains verified access until paid period expiry. Immediate canceled/unpaid access is denied. Refunds/disputes are checked from Stripe on the next access, not a client message. No automatic refunds are initiated by this PR.
- **Live checkout is deliberately unsupported by the new code.** Production activation requires a subsequent approved change plus payment/provider acceptance tests. Existing customer billing management is preserved.

## Database and files

Apply `scripts/premium-trial.sql` manually to an **isolated** test DB first. It adds `premium_requests` and `premium_plans`, indexes, uniqueness/valid-result constraints and a foreign key to existing Better Auth `user`. No destructive changes; no existing auth/subscription tables rebuilt. `lib/db-schema.ts` declares the new tables. Use only the private server DB role; do not expose these tables through public database APIs. Account deletion cascades its result ledger. Results contain potentially personal AI output; review privacy disclosure, retention, access/deletion/export policies before rollout. Retaining ledger metadata is required to prevent trial reset; do not blindly delete it during retention cleanup.

Main code groups:
- `lib/premium-{policy,usage,billing,chat,client}.ts`: flag, ledger, verified billing, premium route and acknowledgement client.
- `app/api/premium/{status,results,acknowledge}/route.ts`: shared account balance, recovery and authenticated delivery receipt.
- `app/api/chat/route.ts`, `lib/plan-limits.ts`, `app/onboarding/page.tsx`: gated integration, all trial specialists, current consent.
- `app/actions/{stripe,billing}.ts`, `app/api/stripe/webhook/route.ts`: test checkout, verified confirmation, lifecycle synchronization.
- `components/premium/access-banner.tsx`, both chat interfaces, pricing/checkout/account/admin pages: connected UX.
- `components/landing/pricing-{section,cards}.tsx`: existing artwork/layout retained, server-configured offers rather than invented prices.
- `tests/premium*.test.mjs`, helper and updated launch regression tests: behavior coverage below.

## Required environment/configuration (never commit values)

Existing: `DATABASE_URL`, Better Auth secret/origins, Stripe server key/publishable key/webhook secret, `OWNER_EMAIL`, and existing AI Gateway/provider credentials where required by chosen model. Existing auth/email configuration is unchanged.

New flags:
- `PREMIUM_TRIAL_ENABLED=true` only after migration, spending controls and provider verification. Default off preserves the legacy launch path; if explicitly requested but missing model/isolation, premium fails closed instead of silently downgrading.
- `PREMIUM_AI_MODEL`: approved AI SDK/Gateway model ID. Same for trial and paid. No default model is substituted.
- `PREMIUM_BILLING_TEST_ENABLED=true`: test-only checkout/verification; requires Stripe test credentials. Must never be set with live keys.
- Preview: `GINICCI_PWA_ISOLATED_DATABASE_URL` must point to an isolated schema/database as established by existing preview isolation. Never inherit production DB. Also configure separate test auth/email accounts and publishable/server keys consistently. Preview can now exercise premium only with explicit premium flag/model/isolated DB; legacy AI remains blocked there.
- Tests only: `PREMIUM_TEST_DATABASE_URL` pointing to disposable **localhost** PostgreSQL. It is never inferred from application DB configuration.

Do not enable both rollout flags merely to make a build pass. No Vercel variables have been changed. Configure values through protected project environment settings, not chat.

## Executed checks and remaining acceptance gates

Executed locally:
- Frozen pnpm install; no dependency or lockfile changes.
- `pnpm test` with a disposable local PostgreSQL 18 server: **51 tests passed, zero skipped** (includes nine real PostgreSQL lifecycle/concurrency subtests).
- Actual SQL migration applied twice inside isolated test schemas, then schemas cleaned up. No application/customer DB touched.
- TypeScript `pnpm typecheck`: passed.
- `git diff --check`: passed.
- `pnpm build`: attempted; failed fetching the three pre-existing Google Fonts (Instrument Sans, Instrument Serif, JetBrains Mono) in the restricted sandbox. No fonts were replaced or build checks weakened.
- Automatic Vercel preview build of the implementation commit: **Ready**, build duration 23 seconds. This verifies deployment build success, not live endpoint behavior, migrations or external payment/provider acceptance. The local Google Fonts restriction above still applies.
- `pnpm lint`: attempted; existing script fails because ESLint isn't installed/configured in this repository. No lint pass claimed.

Coverage includes six successes/seventh denial, provider errors/empty/truncated/filter release, delivery ACK/recovery idempotency, concurrent last credit, simultaneous duplicate key, altered input, stale lease/late completion, separate server instances sharing balance/account isolation, configured paid quota, mocked settled/refunded/disputed/unpaid/expired Stripe states, actual AI SDK UI-stream reconstruction, authenticated delivery-receipt validation, real Stripe signature construction/verification/tampering with local fixtures, duplicate webhook handling, server-owned checkout price/identity, anonymous API rejection and existing auth/history/free regressions. Stripe tests are fixtures/mocks, NOT a real Stripe sandbox purchase or dashboard-created subscription.

Not yet executed: browser/mobile end-to-end delivery and visual/accessibility checks, email sign-in/out on real devices, live model quality/latency/cost, Stripe sandbox checkout/payment/portal cancellation/refund/dispute end-to-end, deployed webhook retry/out-of-order races. These require isolated connected accounts and a network-capable test environment. They are release gates, not passed tests.

Before production: connect the live site's authoritative repository and integrate/test its authenticated backend; resolve canonical project/domain ownership; verify migration/private DB roles, privacy/retention and multi-account abuse policy; configure approved model and budgets; configure Stripe sandbox plans/webhook/portal; complete the unexecuted acceptance checks; obtain separate approval for production activation/migration/deployment. This PR must not auto-merge or auto-migrate production.
