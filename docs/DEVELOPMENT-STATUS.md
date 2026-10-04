# Ginicci development audit and phased roadmap

Audit date: 2026-10-04. Baseline: main, d500e2553bc6b2975cb4c0e819741cb08a08b905.
Target: ginicci-labs / compute-the-platform-to-build, linked to ginicci/compute-the-platform-to-build-ship-ai-agents.

## Scope and limitations

Source/configuration audit, scoped project inspection, and environment-variable inventory only. No customer records queried, production requests made, authentication emails sent, payment transactions executed, credentials downloaded, database migrations run, or production settings changed. This is an initial architecture audit, not an exhaustive penetration test or proof that all live features work. Browser/mobile, provider sandbox, email inbox delivery, database isolation and payment end-to-end checks remain unverified.

**Domain decision needed:** next.config.mjs redirects ginicci.com and www.ginicci.com to www.ginicci.app. The provided dashboard associates www.ginicci.app with business-growth-ecosystem. That destination project's source and deployed revision have not been audited here. Confirm the intended canonical domain and owning project before release; do not change redirects blindly.

## Existing architecture and preserved features

- Next.js 16 / React 19 / TypeScript, App Router, pnpm lockfile, Tailwind 4, Radix components, existing Ginicci/Northstar branding and landing page.
- Better Auth backed by PostgreSQL: verified email/password sign-in, verification resend, password recovery, seven-day sessions, session revocation on reset, authentication rate limits and exact trusted origins.
- Resend authentication email delivery checks HTTP acceptance and returned message ID. Provider acceptance is not inbox delivery. Configuration normalizer and safe shape diagnostics already exist; no evidence warrants declaring the current email issue fixed.
- PostgreSQL with pg and Drizzle. Declared application tables: user (partial Better Auth declaration), subscription, agent_usage, legal_consent, activity_log. Translation cache uses ui_translations through SQL. Better Auth owns additional auth tables. No migration runner or complete authoritative database schema is present in this checkout.
- Stripe embedded subscription checkout, consent records, signed webhook handling, subscription synchronization, account billing portal and owner-only console. These are subscription features, not merchant onboarding, marketplace payments or a stored-value wallet.
- Nine conversational personas: direction, investing, markets, money, customers, marketing, business, career, knowledge. Authenticated chat checks legal consent, plan access and atomic monthly quota; AI SDK uses one fixed model. No tools, live search, multi-agent delegation, persistent conversation memory or provider fallback.
- Voice transcription/read-aloud and authenticated translation. Translation rate budget is process-local, not a distributed limiter.
- Proxy cookie presence check is supplemented by server session verification. Security headers include report-only CSP. TypeScript build errors are currently ignored by Next configuration; explicit type checking is required.

## Environment and activation inventory

Vercel inventory confirms names and environment targets, not valid values or working credentials:

- DATABASE_URL and Neon/Postgres aliases: configured in Production/Preview/Development. Do not use production data for validation; verify a separate preview/test database before integration tests or migrations.
- BETTER_AUTH_SECRET and BETTER_AUTH_URL: present across environments. Confirm canonical origin, exact preview origins and fresh verification/reset flows using test accounts.
- RESEND_API_KEY: separate Production and Preview/Development entries; EMAIL_FROM present across environments. Validate sender-domain authorization and provider event status in Resend, without sharing key values. Vercel path: Project Settings → Environment Variables, https://vercel.com/ginicci-labs/compute-the-platform-to-build/settings/environment-variables.
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and STRIPE_PUBLISHABLE_KEY: present. Preview must use authorized sandbox keys and a sandbox webhook; never infer test mode from variable names.
- OWNER_EMAIL and OWNER_ALERT_EMAIL: present; validate owner authorization with separate owner/non-owner test accounts.
- AI provider connectivity is not verified; the route uses AI SDK's model identifier without an explicit provider configuration layer.
- Travel, ticketing, property, commerce, calendar and merchant APIs: no adapters or corresponding configuration found in inspected source. Commercial agreements, official credentials, scopes, sandbox access and regional eligibility must be established before enabling each.

## First safe patch

Implemented:
1. Bounded chat body reader: 128 KiB hard limit while streaming, including requests without Content-Length; malformed JSON returns 400 and oversized input 413.
2. Text-only message validation: at most 60 messages, 20 parts/message, 40,000 total text characters, unique bounded IDs, only user/assistant roles, last message user. Client system/tool/file parts are rejected. Metadata is discarded rather than trusted as authorization. Existing text chat and regeneration format retained.
3. Model-message conversion before quota consumption. Invalid input cannot reach quota consumption through these validation paths.
4. All existing persona prompts explicitly distinguish planning from execution, prohibit fabricated live service results and secret requests, and state approval requirements. Prompt rules are defense-in-depth, NOT a transaction authorization mechanism.
5. Automated regression tests and explicit test/typecheck scripts. No dependency changes or database changes.

Remaining risks: client-provided assistant history is not authoritative; it must never prove approval, transaction state or entitlement. Stream/provider failures can still consume a task under existing accounting semantics. No distributed short-window AI limiter exists. Prompt-injection resistance is not guaranteed by prompt text.

## Delivery roadmap and release gates

### Phase 1 — Foundation (small reviewable slices)
- Resolve canonical project/domain ownership and reproduce auth/email issues with authorized test accounts. Trace safe provider event IDs; do not mutate customers or claim delivery from HTTP acceptance.
- Add a server-only provider interface with allowed model IDs, timeouts, bounded inputs, output budgets, usage accounting and tested failure modes. Avoid billable automatic retries by default.
- Build a master planning agent and capability registry while preserving all nine IDs and plan ordering. Initial plan creation must not execute external actions or bypass plan restrictions. Add specialist modules for the requested departments with explicit unavailable-integration states.
- Introduce server-owned workflow records only after reviewing a proposed additive migration against a test database. Records should bind user, capability, exact action parameters, expiry, approval, idempotency key and provider reference. State machine: draft → awaiting_approval → approved → running → succeeded/failed/cancelled. Reject stale/mismatched approvals and cross-user access.
- Add distributed per-user rate limits, safe provider errors, cancellation, audit retention controls and opt-in conversation storage/deletion. Test boundaries before enabling tools.
- Retain /onboarding entry point; evolve it into the universal interface without replacing authentication, checkout or branding.

### Phase 2 — Core features
- Static QR generator first, with actual PNG/SVG downloads and decode tests. Validate destinations and prohibit embedded credentials; logo/color options must maintain scannability. Dynamic redirect records, ownership and privacy-controlled analytics follow an approved additive migration.
- Account-isolated organizational wallet (not custody/payment balance): QR codes, receipts, documents, provider-confirmed bookings only. Private storage, short-lived authorized downloads, file limits/type validation, retention and deletion controls.
- Business profiles and document templates with validated input and ownership. PDF export tests; no invented businesses/reviews or fabricated confirmations.

### Phase 3 — External services
- Authorized travel/ticket/search adapters with sandbox contract tests, timeouts, provenance and truthful unavailable states. Show only provider-returned prices/availability with currency and timestamp; no mock inventory represented as live.
- Booking preparation separated from execution. Booking status changes only from verified provider responses/webhooks; retries use provider-supported idempotency and reconciliation.

### Phase 4 — Business ecosystem
- Appointment/CRM/invoice models, role boundaries, moderation and merchant onboarding design. Payment references only, no card storage. Explicit approvals before external email or provider mutations. Sandbox signed-webhook replay and isolation tests precede release.

### Phase 5 — Advanced intelligence
- Durable task queue, bounded retries, status/history, notifications and multi-agent workflows. Cost/concurrency limits per account, consented personalization and cancellation/recovery tests.

## Approval and release policy

Routine reversible source changes proceed on vercel-agent/* branches and review PRs. Do not merge automatically: main auto-deploys. Production deployment, domain changes, critical migrations, billing/resource purchases and irreversible operations require explicit approval. Vercel mutations require scoped Plan approval. Preview deployments must not silently use production data or send external communications. No planned service should be described as live before its integration and release gates pass.

## Status categories

- Implemented: first safe chat boundary/prompt hardening patch and this roadmap. Check results appended below.
- Implemented but awaiting credentials: none of the new external service integrations; they are still planned, not scaffolded or live.
- In development / next slices: master planner, server-owned approvals, provider abstraction, distributed limits and universal interface.
- Blocked by external requirements: live provider credentials/agreements and safe sandbox accounts; actual inbox/booking/payment verification.
- Requiring approval: canonical-domain/routing changes, production release, critical migrations and financial commitments.

## Validation results for this patch

- `pnpm install --frozen-lockfile`: passed; lockfile unchanged.
- `pnpm test`: 9/9 passing (five existing origin tests, four new chat-boundary/prompt tests).
- `pnpm typecheck`: passed.
- `git diff --check`: passed.
- `pnpm build`: failed because sandbox could not fetch existing Instrument Sans, Instrument Serif and JetBrains Mono assets from Google Fonts. No claim of a successful production build; font configuration retained. Preview/CI build required before merge.
- No browser, live database, paid AI, Stripe, Resend or travel provider tests executed.
