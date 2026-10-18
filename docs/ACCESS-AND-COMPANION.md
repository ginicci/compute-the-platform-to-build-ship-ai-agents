# Effortless access and a friendly Ginicci

## Delivered in the application

This follow-up builds on merged PR #47 / main `58ba204`. It changes the actual homepage, app, responsive website chat and installation/help pages. One Better Auth account, server-side conversation/preferences APIs and Premium/Stripe backend are preserved. No separate application/backend or counters are created.

- Prominent **Open the App**, **Use the Website**, **Install the App** actions in the existing hero, homepage access panel and main navigation. “Open” is a real link to `/assistant`, not a promise that a browser can force-launch an installed app. “Use the Website” links to `/onboarding`, whose existing authentication gate sends guests to sign-in.
- Global manifest, Apple touch icon and standalone metadata make the homepage/installation route eligible for the same existing PWA. Existing service-worker privacy allowlist remains unchanged; registration is centralized in a shared provider, not duplicated on every app mount. No private pages/responses are added to its cache. Installation does not enable offline AI.
- A shared browser-aware install provider captures `beforeinstallprompt`; an actual install button appears ONLY when a real deferred browser prompt is present. The prompt is consumed once. Accepted, dismissed and failed prompts have plain-language feedback; no automatic prompt/pop-up is shown. Without a prompt, the action is a clearly labeled **Install the App — how to** link, not a nonfunctional installer button.
- Standalone (`display-mode`/iOS `navigator.standalone`) or window-controls-overlay display shows Continue in the App / already using the app. `appinstalled` clears pending prompts but does not falsely say the current browser tab is an installed window. We do not claim to detect every separately installed app, and store no installed flag in browser storage.
- `/install` provides iPhone/iPad Safari Share → Add to Home Screen, Android menu and desktop Chrome/Edge/Safari instructions, plus unavailable/private-browser/in-app-browser caveats. iPad desktop UA is recognized as iOS with touch support. Platform detection selects explanatory text only; it never invents install capability. Browser labels/support vary. Sign-in sessions can differ between Safari and home-screen windows; the same account restores server-saved data.
- The two chat interfaces share obvious Home, website/app switching, Install, Account and Help navigation. The website chat gains a visible New conversation action that resets current chat/library state without resetting credits or silently deleting account history. Existing app fresh-chat control is preserved. Help explains explicit save/opt-in autosave, resuming on another screen, separate session login, privacy, current voice restrictions, account billing and connection recovery. Unsaved drafts are not represented as automatically synchronized.
- Shared model instructions now use a warm, grounded conversational style; accept everyday topics and natural topic/language changes; avoid forced business intake, canned greetings, repetitive reassurance and excessive flattery; use relevant supplied conversation context without inventing memory. All specialists and the realtime voice route reuse these same instructions. Voice adds comfortable pacing/natural pauses/brief turns, not a claim of measured acoustic quality.
- Explicit relational boundaries: AI, not human, real-life best friend, therapist or replacement for people; no exclusivity, guilt or emotional dependency; encourage trusted support when appropriate. Existing service/secret/financial boundaries remain.
- Global viewport no longer disables zoom. Homepage metadata no longer advertises unconfigured $20/14-day offers. The hero replaces its outdated hard-coded offer with real access actions.
- Actual homepage browser testing exposed random testimonial-decoration markup producing a server/client hydration mismatch. Only that background pattern is changed to a deterministic equivalent; testimonial content/design is not otherwise changed. Regression test added.

## Tests executed

- `pnpm test` using disposable local PostgreSQL: **69 tests passed, zero skipped**, including 12 existing real PostgreSQL subtests for account history/preferences, stale revisions, shared trial/voice credits and concurrency. New tests validate device/display classification, one-shot prompt handling/cleanup, all new internal links resolving to actual routes, shared personality/safety instructions, manifest/zoom metadata and deterministic decoration.
- `pnpm typecheck`, frozen pnpm install and diff whitespace checks: passed. No runtime/dependency/lockfile changes for these features.
- **8 Chromium browser component scenarios passed** against the actual React installation/navigation components in a local fixture: desktop link navigation/manual fallback; accepted, dismissed and failed prompt lifecycle; iPhone and Android guidance; installed iOS display; and `appinstalled` event handling. Browser installation events are simulated, and iOS/Android are UA/viewport emulation, not native engines/devices. Next Link/navigation are lightweight fixture adapters, so this is not a deployed-app routing assertion.
- **2 actual local Next.js browser flows passed** at 1440px and 390px: homepage → `/assistant`; guest demo send → New chat clears messages; Help → installation guide; Use the Website → existing sign-in gate. These use real Next routes and guest/auth-session responses, not the component fixture. Synthetic local server-only auth/Stripe configuration was generated; no real credentials/customer account/provider calls were used. Development fonts fell back because the sandbox cannot fetch Google Fonts.
- Local production `pnpm build` attempted: blocked fetching the pre-existing Google Fonts. Automatic Vercel preview build status is reported in the PR, separately from the local result.
- `pnpm lint` attempted: existing script cannot run because ESLint is absent/unconfigured. No lint pass claimed.

Reproducible optional browser runners are checked in:
- `tests/browser/access.mjs` bundles actual UI components with esbuild and exercises them with Playwright.
- `tests/browser/public-routes.mjs` requires `ACCESS_APP_ORIGIN` pointing to a **local** running Next.js app and exercises public routes/guest flows; rejects non-local targets.
Install Playwright/esbuild in an isolated test runner and expose them through `NODE_PATH` if not installed in the repository. Run `playwright install chromium` (and required OS libraries in a normal test environment). This sandbox lacked Chromium system libraries and could not resolve Ubuntu package mirrors; tests succeeded using an isolated packaged `@sparticuz/chromium` runtime with `ACCESS_PACKAGED_CHROMIUM=true` and its Linux runtime configuration. That package/browser tooling is NOT an application dependency and does not affect production. Runners create/remove temporary fixtures. Neither runner performs actual OS installation, real sign-in or paid AI calls.

## Remaining acceptance checks — not claimed passed

Physical iPhone/iPad Safari Add to Home Screen and relaunch; Android Chrome install/WebAPK creation; macOS Add to Dock; Windows/desktop install; private/managed browser restrictions; actual installed-window sign-in, cross-device saved history/preferences/credit balance and billing; signed-in chat/AI quality, live voice pacing/barge-in and accessibility with real assistive technologies. Chromium mobile emulation does not prove Safari compatibility, installation or OS launch behavior. No ability to issue HTTP to deployment URLs from this sandbox; deployed browser flows were not executed here.

Voice remains production-disabled under PR #47 safeguards, and live billing is not activated. This PR does not change provider permissions, spending budgets, models, trial counters or payment behavior. No database migration or new environment variables are required by this follow-up; previous schema/configuration requirements remain in `UNIFIED-PLATFORM.md`. No production migration/deployment/domain/settings changes or merges were performed by the agent.

## Installation references

Implementation follows feature detection, not guessed browser capability:
- https://web.dev/articles/customize-install — deferred prompt, single use, `appinstalled` lifecycle.
- https://web.dev/learn/pwa/detection — current display-mode detection and its limits.
- https://web.dev/learn/pwa/installation — manual Apple-device installation, icons and separate app storage caveats.
