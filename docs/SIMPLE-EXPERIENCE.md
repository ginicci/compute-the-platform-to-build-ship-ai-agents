# Simple Ginicci experience — review and acceptance

Builds on merged PRs #47 and #48, from main at 877fd3f. Review-only follow-up: no merge, production deployment, migration, Vercel setting change, provider call or Stripe purchase performed.

## Implemented

- Homepage now leads with **Start chatting free**, a concise explanation, Sign in and Explore Premium. Removed the rendered ecosystem sections, testimonials, unverified performance/reliability metrics, placeholder footer links and autoplay artwork. Existing design tokens, responsive layout and typography are reused. Guest access remains an explicitly labeled interface demo, not a fabricated live AI response. Signed-in trial access still requires existing rollout configuration.
- Concise home-screen access message. The shared provider still offers a native install button only after a real `beforeinstallprompt`. The installation page shows only the detected device's short guide; other device guides are optional. Already-installed display and unavailable-install website paths remain. Opening `/assistant` cannot force a browser to launch a separately installed app.
- General chat is the primary entry point, not a specialist selection menu. Existing rich text, edit/resend, saved conversations/preferences, dictation, read-aloud and gated realtime voice are preserved. Shared personality instructions now request one useful optional task-specific next step rather than generic menus or repeated subscription promotions. No new autonomous agent routing or external tools are claimed.
- Shared Premium banner retains the server balance, explains held reservations versus successful charged uses and session-level voice accounting. Upgrade messaging is shown only at exhaustion, not after four/five uses. Saved results remain recoverable. No ledger, entitlement, session or quota logic changed.
- Premium comparison reads only existing configured Stripe test prices/allowances. It explains same-model continuation, annual allowance spanning the year, billing/renewal, cancellation, final-total/tax review and refunds. Experimental voice, uploads, autonomous actions and team workspaces are not sold as available features. Missing configuration offers no checkout link and invents no price. Account copy no longer promises more agents on upgrading.
- Website `/onboarding` and PWA `/assistant` continue to share Better Auth, account-owned PostgreSQL history/preferences, trial ledger and Stripe verification. Explicit save or opt-in autosave is required; unsaved drafts do not automatically move. Separate browser/app sessions may need separate sign-in with the same account. No second backend or browser-stored credit counter introduced.

## Verification performed for this follow-up

- Frozen pnpm installation and TypeScript passed. No application dependencies/lockfile changes.
- **73 tests passed, zero skipped**, including 12 real disposable local PostgreSQL subtests. Coverage includes six successful uses/seventh denial, failed/aborted generation, idempotent acknowledgement/recovery, concurrent last credit, shared website/PWA balance, account isolation, preferences/history persistence and stale revisions. Additive migrations applied twice in isolated schemas, then cleaned up. No customer database used.
- Existing Stripe tests verify signatures, duplicates, configured prices, paid/refunded/disputed/unpaid/expired entitlement fixtures. These are **not actual Stripe sandbox checkout/payment/portal/webhook acceptance**.
- **9 Chromium component scenarios passed**: desktop navigation/manual fallback; accepted/dismissed/failed one-shot installation prompts; iPhone/Android device-specific guidance; installed iOS display; appinstalled handling; rendered remaining/pending/exhausted/paid balance states without early upgrade pressure. Install events and device identity are simulated, not native Safari/Android or physical OS installation. Account balance responses are mocked for this component suite.
- **2 local Next.js browser flows passed**. The runner covers homepage → primary chat action → guest demo → reset → help/install; unconfigured pricing has no checkout; unauthenticated checkout and website chat redirect to sign-in. Runs at 1440px and 390px, including homepage horizontal-overflow assertion. Uses synthetic local configuration, no customer credentials or paid AI requests.
- Local production build attempted: blocked by existing next/font Google Fonts fetch restrictions. No font handling or build checks weakened. Preview build is reported separately in the PR.
- Lint attempted: existing `eslint .` script cannot execute because ESLint is absent/unconfigured. No lint pass claimed.

Optional browser tooling was installed outside the application. Use the existing `tests/browser/access.mjs` and `tests/browser/public-routes.mjs` runners with Playwright/esbuild and a local app. Packaged Chromium in this environment required its matching runtime libraries and fontconfig; browser libraries are not application dependencies.

## Required acceptance — NOT passed / release gates

1. Physical iPhone/iPad Safari Add to Home Screen and relaunch, Android Chrome installation, supported desktop browser installation, restricted/private browsers and assistive-technology checks. Emulated identity cannot verify browser/OS integration.
2. With an isolated DB and real verified test account: sign in on website and installed PWA, save/resume a conversation in both directions; change preferences; complete six real qualifying requests across both; confirm failures/stops do not charge; confirm pending-result recovery; verify a meaningful voice session counts once under existing rules. Confirm exhausted trial and sign-out/account-isolation behavior.
3. Configure actual Stripe **sandbox** products/prices/allowances, matching test publishable/server keys, signed webhook and customer portal. Exercise checkout success/cancel/failure, verified paid continuation, duplicate webhook, renewal failure, portal cancellation and refund/expiry. These calls were not performed: no connected sandbox purchase/browser capability was available here. Do not infer payment acceptance from fixtures or a Ready deployment.
4. Real provider answer quality, voice/audio/device latency, watchdog scheduling and independent provider teardown remain unverified. Realtime voice remains hard-disabled in production by existing code. Existing browser dictation/read-aloud is not realtime speech-to-speech.

## Configuration and cost

No new environment variables, migrations, services or provider permissions are required by this UI follow-up. Preserve existing release gates in `PREMIUM-TRIAL.md` and `UNIFIED-PLATFORM.md`:

- Isolated preview `GINICCI_PWA_ISOLATED_DATABASE_URL`, existing Better Auth/email settings and applied conversation/trial/preferences schemas.
- `PREMIUM_TRIAL_ENABLED`, approved `PREMIUM_AI_MODEL` and funded provider/Gateway access only after explicit isolated testing and spending controls.
- `PREMIUM_BILLING_TEST_ENABLED` plus matching Stripe test keys and webhook/portal, never live keys. Enabled plans/price IDs and usage allowances are configured in the existing owner-only `/admin/premium`; no prices are seeded by this change.
- Realtime test flags, provider credentials and independently verified watchdog from `UNIFIED-PLATFORM.md` are still required; do not enable voice just to test this homepage.

Enter secrets through protected project settings, never source control or chat. Keep production variables and live billing unchanged. Hosting/builds, database, email, AI text and experimental realtime calls may incur their providers' usage charges; this follow-up makes no paid provider calls and adds no recurring service. Exact usage cost depends on configured models, tokens/audio, provider rates and account contracts; no unsupported fixed cost estimate or unlimited-use promise is made.

Obtain separate explicit approval before merging, production deployment/migration, live billing or production voice activation.

## External acceptance handoff

Start with [`acceptance/PR49-RUNBOOK.md`](acceptance/PR49-RUNBOOK.md), copy [`acceptance/PR49-EVIDENCE.csv`](acceptance/PR49-EVIDENCE.csv) to a private test register, and review [`acceptance/LINT-BASELINE.md`](acceptance/LINT-BASELINE.md). All external tests start NOT RUN; environment operators must attest isolation before any paid-provider test. The ESLint command is now configured and executable but exposes existing baseline findings; no lint pass is claimed.
