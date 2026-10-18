# Ginicci Tree restoration (review only)

## Provenance, not a redesign

Inspected full Git history, recent merged PRs, existing assets and original components before editing. Base: `554f996` (merged PR #50). Original visual reference: `fabee91` (PR #39), the last tree-color revision before the PWA work. No commits were reverted wholesale.

- `535bc0c` (PR #48) replaced hero CTA copy with shared app/website/install entry points but retained the tree.
- `12f9fc0` (PR #49) replaced `app/page.tsx`, unmounting the entire original landing composition. This is the direct cause of the missing tree and sections, not asset deletion.
- `fabee91` changed the existing tree video hue and petals to vivid red; that last approved historical styling is retained, not invented anew.
- Existing Instrument Sans / Instrument Serif / JetBrains Mono font declarations, global palette, animation styles, original images and living-artwork components are unchanged.

The original hero asset is **`bg-hero-0BnFGdr81Ifnj3WbBZoNt1KE4D5DMT.mp4`**, hosted at the exact original Blob source in `components/landing/hero-section.tsx`. It was never a tracked local image. No missing tracked tree file was found; no substitute graphic was created. The original remote landscape/footer and other remote artwork references are also retained. Remote availability still requires preview review.

## Before / after (source comparison)

| Area | Before (`554f996`) | Restoration |
| --- | --- | --- |
| First screen | Plain chat-companion text, no artwork | Original full-height black tree-video hero, red petals, overlays/grid, animated headline and Ginicci/Northstar identity |
| Navigation | Simple text header | Original floating/scroll-responsive navigation, section anchors, language selector and mobile menu; chat and Premium entry retained |
| Structure | Short possibility cards and access panel | Original features → how it works → infrastructure → metrics → integrations → agent stack → security → developers → illustrative carousel → pricing → CTA → panoramic footer |
| Artwork | Original components not mounted | Existing tree/bridge/whale/security artwork and ambient motion mounted in their original sections |
| Trial / app | Modern access and shared account guidance | Same guidance plus the existing shared Premium balance banner; original rounded hero controls open current chat, pricing, website and installation flows |
| Commercial honesty | Guest-demo and six-use caveats | Retained; outdated final CTA 14-day offer removed. Historical numeric/customer sections explicitly marked illustrative, not verified proof. Ecosystem sections labeled vision, not available integrations |

The navigation stays collapsed through tablet sizes so original anchor navigation remains accessible (the previous component hid both desktop anchors and menu from 768–1279px). Mobile hero reserves extra lower spacing for existing bottom-row facts.

## Functional preservation

No changes to AI routes, streaming/history/preferences services, trial reservation/account ledgers, Stripe/webhook/checkout logic, voice controls/safety gates, service worker, manifest, installation controller, auth, schemas or production settings. Chat and voice remain in the existing shared conversation interfaces, reached from the tree hero rather than duplicated on the landing page. The balance banner reuses the existing component and authenticated endpoint.

The reactivated original pricing renderer now catches billing-module initialization failure as well as price-query failure, so missing preview Stripe configuration does not crash the public homepage. It does not create prices, enable checkout or change billing gates.

## Checks and remaining acceptance

- Frozen dependency install passed; no package/lock changes.
- TypeScript passed.
- Unit/regression suite: 61 passed, 0 failed, 1 skipped (disposable PostgreSQL suite).
- Installation/trial component browser fixtures: 9 passed, using synthetic events/emulated devices; not actual OS installation, signed-in account sync, Stripe or live voice verification.
- Local browser: homepage renders at 1440px and 390px with no horizontal document overflow and no page errors. Tree source is mounted, but media `readyState` stayed 0: **tree playback not visually verified**. Google Fonts unavailable locally, so screenshots use fallback fonts and cannot establish fidelity.
- Local production build blocked by existing Google Fonts network fetch failure. No build pass claimed.
- Lint: existing 11 errors and 1 warning, same baseline documented in `docs/acceptance/LINT-BASELINE.md`; no new lint findings.

Before merge, compare a network-enabled preview against reference `fabee91` on desktop/mobile and installed PWA: confirm original tree video loads/plays (including iOS autoplay handling), asset positions and fonts, menu/anchors, reduced motion, no CTA/stat overlap; exercise current chat, account balance, history/preferences, installation guidance and gated voice. Do not treat retained source or mocked checks as real paid-service acceptance. Existing PR49 external acceptance remains required. No production merge/deployment or live billing authorized.
