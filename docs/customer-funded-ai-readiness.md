# Customer-funded AI: draft safety foundation — NOT READY TO DEPLOY

## Audit
- Existing Next.js design, Better Auth verification/login/email, PostgreSQL,
  embedded Stripe monthly/annual checkout and billing portal are preserved.
- PR #40 is open. This branch includes its safe funding-outage handling; do not
  merge it twice. Production was not changed by this implementation.
- Chat, translation, transcription and speech use AI SDK Gateway models. No
  AI_GATEWAY_API_KEY was listed in production environment metadata. Deployment
  OIDC therefore appears to be the authentication path; the observed production
  Gateway insufficient_funds error is team-billed. Verify actual credential
  attribution before configuring budgets. Customer Stripe payments do not
  automatically fund Gateway credits.
- Existing free allowance is 1,000 tasks, Plus 50,000 for $20/month, Team 250,000
  for $60/month, Pro unlimited for $200/month; owner also bypasses task limits.
  These are not validated profitable prices. Trialing and past_due currently
  grant access. Subscription status is not evidence of collected/settled cash.
- Webhook signature verification exists; durable event idempotency, payment
  ledger, refund/dispute processing, prepaid checkout and settlement do not.
- Translation previously bypassed task accounting. Voice previously did not
  enforce the submitted agent entitlement. Both are gated in this draft.
- Production, preview and development share variable assignments for Stripe and
  database. Secret values were not read; test/live modes and database isolation
  are NOT verified. Do not exercise financial flows on these defaults.

## Implemented draft
- One server-side reservation function for all four AI routes.
- Fail closed unless explicitly enabled with finite task, rate and reservation
  configuration; owner has no unlimited bypass at this gate.
- Additive SQL defines disabled-by-default platform/customer funding accounts
  and request ledger. No funding grants, migrations or database writes applied.
- Row-locked debits atomically reserve both customer and platform funds before
  invocation. Cross-instance per-customer rate counting under account locks.
- Chat and translation record SDK usage and generation IDs when available.
  Voice records completion/failure, NOT reconciled provider cost.
- Failures retain reservations pending reconciliation; no uncertain refunds.
- No purchase, auto-top-up, model switch or live subscription creation.

## Required configuration (NOT applied)
Existing: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL,
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
RESEND_API_KEY, EMAIL_FROM and owner alert configuration.
New draft: AI_BILLING_ENABLED=true, AI_MAX_TASKS_PER_MONTH,
AI_MAX_REQUESTS_PER_MINUTE, AI_CHAT_RESERVE_MICRO_USD,
AI_TRANSLATION_RESERVE_MICRO_USD, AI_SPEECH_RESERVE_MICRO_USD,
AI_TRANSCRIPTION_RESERVE_MICRO_USD.
These reservation amounts are NOT proven upper bounds. Do not enable execution
until model-specific worst-case pricing, output/input limits and provider
fallback costs have been validated. A reserve does not constrain provider cost.

## Outstanding implementation — deployment blockers
1. Signed, durably idempotent Stripe event inbox/worker, collected-payment and
   net settled-funds ledger; handle failed invoices, renewals, cancellation,
   partial/full refunds and disputes with deterministic entitlement reversal.
2. Prepaid checkout, disclosed prices/expiry/refunds, server-owned price catalog,
   duplicate-checkout protection; never count trial or pending money as funding.
3. Cost reconciliation worker with Gateway generation lookup, durable retries,
   interrupted-stream ID capture and audio cost attribution. Overruns must
   freeze funding; release only known unused reserves once. Unknown costs must
   retain holds. Reconcile credits, actual provider charges and Stripe cash.
4. Prove maximum per-call cost; bound history, transcription duration and
   request bodies. Implement idempotent client request IDs and single-flight
   provider calls, plus global abuse protections and durable signup limits.
5. Pricing/checkout/account usage UI including prepaid balances, remaining
   included allowance, funding-pending state, and accurate error mapping.
6. Replace unsafe existing unlimited claims and trial economics AFTER approved
   pricing and existing-subscriber migration policy; no silent benefit removal.
7. Configure team/project Gateway budgets and alerts AFTER owner specifies
   dollar ceiling/reset cadence and approves the scoped mutation. OIDC project
   budgets do not cover API-key traffic; BYOK provider spend needs separate caps.
   Top-ups remain disabled. Budgets do not provide credits.

## Testing status
Policy unit tests and source coverage assertions are not runtime route tests.
TypeScript checks do not verify payment correctness. No isolated Stripe/database
integration suite has run. No live payment or AI execution was performed.
Must test real PostgreSQL concurrent reservations/rollback, duplicate requests,
unauthorized access, every agent, signed webhook replay/out-of-order delivery,
Stripe test checkout/renewal/failure/refund/dispute, prepaid exhaustion, cost
reconciliation and signup/login/email regressions before deployment.

## Exact next owner actions
- Provide/authorize an isolated Stripe test environment and separate PostgreSQL
  test database using protected environment inputs (never paste secrets in chat).
  Preview must not use production database, auth or payment keys.
- Approve plan allowances/prices, free promotional budget, refund/prepaid policy,
  and a numeric global Gateway budget and reset period. No price currently has
  a validated margin. Stripe settlement requires working capital or delayed
  access; decide which before promising immediate activation.
- Review the later complete implementation/report. Do not enable this draft or
  apply its migration to production. Conditional merge authorization applies
  only after ALL acceptance criteria pass, not these foundation checks.

## Follow-up: latest baseline and no-provider test guard
Latest main 8e562c7 includes PR #40; incorporated without reverting its changes.
Set BILLING_TEST_MODE=true, AI_EXECUTION_MODE=mock, AI_BILLING_ENABLED=false
on the isolated preview. These controls explicitly block every real provider
invocation, including at the invocation boundary. They do NOT yet provide
route-specific mock response fixtures, so successful AI workflows cannot yet be
integration-tested. Real execution requires AI_EXECUTION_MODE=live, billing
explicitly enabled, and no billing-test flag. Never enable live in test previews.
Stripe secret modes, webhook destination access through preview protection,
separate database identity and test-only email configuration remain unverified.
No payment tests may begin before these isolation checks pass.

## Offline fixtures and preview reconciliation
Preview branch commit 5a666f8 was merged locally with no conflicts or discarded
edits. PR #41 is already merged into that preview branch; continuation must use
an independently reviewed draft PR, never update that closed PR or merge main.

Successful offline chat-stream, translation, transcription and silent WAV
fixtures now exist. They are marked TEST and cannot execute when
VERCEL_ENV=production. Test/mock execution still passes the funding ledger,
quota and entitlement gates. For isolated integration tests only, set
BILLING_TEST_MODE=true, AI_EXECUTION_MODE=mock, AI_BILLING_ENABLED=true plus
finite policy variables and synthetic test funding accounts. Real provider
execution remains prohibited because both mock and test flags block it. Test
funding must NOT represent real collected customer funds. This supersedes the
prior no-fixture status; AI_BILLING_ENABLED=false remains the safe staging
setting until test resources are verified.

The branch-specific CLI environment inventory returned no overrides for
vercel-agent/customer-funded-ai. This is not isolation proof: default Preview
assignments may be inherited. No database connection, payment, webhook delivery
or email test was performed. Configure and verify separate resources before
exercising the fixtures through authenticated routes.

Remaining financial implementation and full acceptance tests are still blocked/
unimplemented as listed above. No measured-cost or margin claim is supported.

## Cost-based allowance method (no pricing finalized)
A planning calculator now computes:
AI cost cap = price * (1 - target margin) - actual processing fees - hosting
allocation - refund/dispute/risk reserve. Request allowance is floor(cost cap /
validated worst-case bounded request cost). Negative budget gives zero access.
Tests use illustrative values only, not measured Ginicci costs.

Starter $9.99 and Pro $24.99 remain proposed prices. No payment rate, hosting
allocation, target margin or measured model cost has been established. Therefore
no evidence-based numeric paid allowance or free dollar cap is recommended yet.
Free requests must stop at the smaller of 10/month and a separately approved
promotional dollar cap. Free activity is subsidized, not customer-funded; it
must also fit a global promotional budget. No real AI measurement is authorized
by mock testing. Model catalog pricing can support conservative estimates;
real measured usage requires separately approved bounded evaluation spending.

Current PR #42 is open, draft, mergeable and unmerged. Rechecking its branch's
Preview environment inventory returned no branch-specific variables. Required
isolated test configuration is still absent/unverified. Payment testing paused.
