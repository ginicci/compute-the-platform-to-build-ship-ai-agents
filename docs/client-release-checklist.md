# Client release verification

## Completed code review and fixes
- Multi-turn chat history normalization (#34): SDK step/reasoning parts no longer reject follow-up text.
- Actionable chat authentication, terms and plan-access notices (#35).
- Capability notice distinguishes conversational guidance/drafts from external transactions.
- Voice recording prevents concurrent permission requests, releases late microphone streams after leaving the agent, and handles recorder construction/start failures.
- Read-aloud requests abort when replaced or when leaving the agent, preventing stale responses from starting playback.
- Inspected chat/voice authorization, atomic task-limit enforcement, Stripe checkout ownership and signed webhook handling. Inspection is not a live integration test.

## Required live checks before claiming client-ready
- Sign up, verify email, sign in, reset password, expire session, accept current terms.
- Send at least three consecutive messages, retry a failed reply, switch agents, test all plan access levels.
- Test task limits and meter against database usage, including failed requests and voice calls. The client chat meter currently counts attempts; provider failures can consume server tasks. Reconcile semantics before guaranteeing successful-task billing.
- On iOS Safari and Android: grant/deny microphone, tap repeatedly, switch agents while permission is pending, stop recording, play/stop audio, switch agents during audio loading.
- Stripe test-mode monthly/annual checkout, trial, conversion, cancellation, webhook replay and billing portal. Do not use real customer charges as tests.
- Verify mobile header/composer visibility and keyboard scrolling; new capability text changes header height.

## Limitations / deferred work
- Agent sandbox cannot send authenticated requests to live deployment URLs. Browser and payment-provider behavior remain unverified.
- Chat is a conversational assistant, not a connected service fulfillment platform. Booking, payment and external messaging integrations need separately defined work and explicit approval.
- This review does not certify all routes, integrations or user flows bug-free. No billing semantics or entitlement policies were changed in this patch.
