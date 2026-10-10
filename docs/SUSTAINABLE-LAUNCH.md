# Protect the initial $20: launch readiness

## Verified account changes
- Infrastructure Spend Management reduced from $200 to $1, notifications at 50/75/100%, no team-wide pause (avoids stopping unrelated sites). This is **not** an AI Gateway credit budget.
- AI Gateway budget list/set and API reads return 403, even with approved billing access. No AI budget or AI alert is confirmed.
- Team metadata does not expose auto-recharge. Off-by-default documentation is not verification of this team's setting.
- No credit purchases, recurring-payment changes, real AI requests or live Stripe tests performed.

## Code controls (pending merge/deployment)
- All chat callers, including the owner, use the free tier and must sign in. Chat defaults disabled unless AI_LAUNCH_CONTROLS_VERIFIED=true. Do not set it yet.
- Voice and generated interface translation are unconditionally disabled. Static dictionaries/English fallback remain. No anonymous provider calls.
- When released: 5 lifetime trial attempts per account, 3 per UTC day, 1 per minute; shared 20/day and 100 lifetime. Failed attempts count. PostgreSQL transaction/advisory lock protects concurrent serverless reservations. Missing migration/DB fails closed. This is an attempt ledger, **not actual financial accounting**.
- Text input 4,000 characters, up to 10 messages; output 256 tokens; single generation, no tools/agent loops, zero SDK retries, 15-second abort. Gateway/provider internal behavior and in-flight billing still need reconciliation.
- Checkout removed; paid entitlement upgrades disabled. Existing cancellation/portal and webhook handling remain so customers can manage obligations. Existing subscriptions are not canceled by this change.
- Provider-free tests cover policy, input validation and source boundaries; live PostgreSQL concurrency, deployed endpoint behavior and settlement/refunds remain unverified.

## Acquisition with no AI spend
/services is a static, indexed page with realistic business use cases, signup CTA, transparent trial limits and a shareable community link (not an attributed referral program). Landing links and sitemap include it. Share manually on existing social profiles and relevant business communities. No paid campaigns or automatic outreach. Existing marketing claims elsewhere still need review; no invented customer proof added.

## Costs and launch offer (not enabled)
Model: google/gemini-2.5-flash-lite, published $0.10/million input and $0.40/million output tokens.
Example **estimate**, not measured cost: 2,000 input + 256 output = $0.0003024/request. 100 requests = $0.03024. Character caps do not guarantee a token count; include system prompt, non-English input, reasoning and provider routing in actual cost review.
Suggested first offer: $5 prepaid, 100 bounded text requests, no automatic renewal, no voice/tools, unused balance/refund policy stated before purchase. At US standard domestic card pricing 2.9% + $0.30, fee is $0.445, net $4.555; estimated model cost $0.03024 leaves $4.52476 **before** hosting, database, email, tax, support, refunds, disputes and other Stripe product fees. This is not profit or validated pricing. Stripe original processing fees are not returned on standard card refunds. Prefer one-off human-delivered services before automated paid AI if fixed costs are not covered.
Observed Vercel team billing is Pro with a $20/month base line item: separate from the one-time $20 AI credit purchase. No existing subscription was changed. Determine database/email/Stripe charges and allocate fixed costs per paying customer before launch.

## Required release checklist
1. Team AI Gateway → credits balance button → Auto top-up → Change: verify disabled and save only if necessary. https://vercel.com/ginicci-labs/ai-gateway.
2. AI Gateway → Budgets: team $1 minimum, refresh none (does not renew allowance), email 50/75/100%. This reserves most of the initial credits pending intentional release. Configure project/key budgets too if used; BYOK does not count against these budgets. Confirm enforcement after propagation before any call.
3. Apply scripts/ai-launch-quota.sql to an isolated DB; test concurrent calls across users, all limits, UTC rollover, missing DB/schema, aborted calls and duplicates. Never point preview tests at production DB. Add generation-ID capture and Gateway actual-cost reconciliation; prove alerts and reservations match real spending. Account limits must address multiple-account abuse before public launch.
4. Verify mock success/failure in deployed production-equivalent routes. No deployment-host access from this agent sandbox, so live HTTP checks require another approved environment.
5. Test Stripe sandbox signing/replays/out-of-order events, settlement failure, refunds/partial refunds, disputes and idempotent credit grants. Require settled funds, not active/trialing/past_due status, before paid entitlements. Do not enable checkout meanwhile.
6. After account budgets and deployed controls are verified, run exactly one minimal real text request and retrieve generation cost. No real test has run yet; there is no actual test cost to report.
7. Review/merge and deploy the PR. Keep launch flag off until steps 1–4 pass. Production currently has the old behavior until rollout.

Sources:
- https://vercel.com/docs/ai-gateway/observability-and-spend/budgets
- https://vercel.com/docs/ai-gateway/pricing
- https://vercel.com/ai-gateway/models/gemini-2.5-flash-lite
- https://stripe.com/pricing

Validation result: 19 provider-free tests passed, including mocked route rejection and quota reservations; TypeScript check passed. Local production build could not fetch existing Google Fonts under sandbox network restrictions. No configured cron definitions were found for this project. A successful deployment build and live checks remain required.
