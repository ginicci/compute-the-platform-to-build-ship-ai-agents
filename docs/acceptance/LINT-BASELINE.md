# Lint configuration repair and remaining baseline

`pnpm lint` now executes ESLint 9 with flat config, recommended JS/TypeScript rules, browser/Node globals and React Hooks plugin registration (supports the existing inline directive). Dependencies are development-only. No rules disabled, no `--quiet`, no blanket generated-source exclusions beyond build/install artifacts. This is not a full Next.js/React lint preset or type-aware lint.

**Result: 11 existing errors and 1 warning, not a pass.** They are exposed by the first runnable lint configuration, not new application regressions. A clean exit should be required after the following focused maintenance; no broad application refactor was attempted in this acceptance-documentation change.

| File / location | Finding | Responsible follow-up |
| --- | --- | --- |
| components/i18n/page-translator.tsx:27,49 | two empty catch blocks (`no-empty`) | Frontend maintainer: document intentional storage fallback or handle error without logging private content. |
| components/landing/features-section.tsx:135 | unused activeFeature | Frontend maintainer: remove unused state binding only after checking animation use. |
| components/landing/footer-section.tsx:42 | unused AnimatedWaveCanvas | Frontend maintainer: decide whether to remove unused artwork implementation. |
| components/landing/testimonials-section.tsx:40 | unused direction | Frontend maintainer: review animation state before removing. |
| components/ui/use-toast.ts:18 and hooks/use-toast.ts:18 | actionTypes used only as type | UI maintainer: use type-only declaration or a deliberate runtime use; keep both copies consistent. |
| lib/ai-quota.ts:30 | unused caught error | Backend maintainer: remove unused catch binding without changing quota failure behavior. |
| lib/realtime-events.ts:7 | explicit any | Voice maintainer: narrow/validate provider event types; regression-test malformed events. Do not silently trust network event types. |
| tests/unified.test.mjs:51,115 | two this-alias findings in fake sockets | Test maintainer: explicit narrowly scoped justification or fixture redesign preserving asynchronous event behavior. |
| components/landing/hero-section.tsx:62 | unused exhaustive-deps suppression warning | Frontend maintainer: review actual effect dependencies before adding a full Hooks ruleset. |

After each fix: lint, typecheck and relevant regressions; do not suppress findings merely to claim acceptance. This baseline records technical debt, not permission to launch with an unchecked build.

## Follow-up validation results

- Frozen package install and TypeScript: passed.
- `pnpm test`: 60 passed, 0 failed, 1 skipped (disposable PostgreSQL suite not requested for this documentation/development-tooling-only follow-up). The prior implementation run remains 73 passed with the isolated DB; do not report the follow-up as another 73-test run.
- No physical-device, Stripe checkout or voice tests repeated or claimed.
- Previous local production build blocked fetching existing Google Fonts; previous pinned Vercel preview Ready. No new local build pass claimed.
