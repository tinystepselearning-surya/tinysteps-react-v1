# P0 — Isolate website marketing events to the primary GA4 stream
**25 October 2026 | scoped draft implementation | NO production deployment**

## First-party evidence
- Owner GA4 Export 25 Sep–22 Oct, GA4 `event_name × stream_name`: `generate_lead` **161 in Tiny Steps** and **161 in Tiny Steps App Check**, each with **139 total users**; 322 property total. Daily `generate_lead` counts were even on all 28 reported dates.
- Owner GA4 Data Streams screens confirm:
  - Main public site `Tiny Steps`: measurement ID `G-J3TTBH8CN9`, web stream ID `12860717923`.
  - `Tiny Steps App Check`: measurement ID `G-5RMQVF1HGD`, web stream ID `12861233936`, stream URL `https://tinysteps-react-v1.firebaseapp.com`. **This stream label does not make it a Firebase App Check security mechanism.**
- On checked-in main: `src/lib/analytics.ts` issues `gtag('config', 'G-J3TTBH8CN9', { send_page_view:false })`, then sends unscoped `gtag('event', ...)`. Separately `src/lib/firebaseConfig.ts` initializes `getAnalytics(app)` with Firebase measurement ID `G-5RMQVF1HGD`. The shared lead form imports Firestore from this config module. Thus a single page can have **two configured GA4 targets** during public lead submissions.
- Google documents that by default unscoped `gtag('event')` dispatches to all configurations in the default target group, while `send_to` restricts its target (https://developers.google.com/tag-platform/gtagjs/routing). Firebase documents special considerations mixing `getAnalytics` and `gtag` on one page (https://firebase.google.com/docs/analytics/web/get-started).

## Fix in this isolated PR
Explicitly append `send_to: <resolved marketing GA4 measurement ID>` to custom website `trackEvent` and `trackPageView` emissions only. Preserve the current `VITE_GA_MEASUREMENT_ID` override and main `G-J3TTBH8CN9` fallback. Precedence prevents event payloads from overriding `send_to`. This directly removes default-group broadcast of website marketing events to both configured IDs.

**Intentionally unchanged:**
- Firebase initialization, `getAnalytics`, `logCustomEvent`, authentication, Firestore, Firebase App Check security, iOS/Android Firebase app streams and internal application event flows.
- GA4 UI property/stream configuration, key-event star on `generate_lead`, direct Firebase SDK analytics calls, lead form storage, event name semantics (see independent PR #763), consent, user IDs, and SEO pages.
- No stream deleted, merged or disabled. Firebase may continue to record its own events into `G-5RMQVF1HGD`; this PR targets explicitly emitted website marketing events only.

## Release gates
1. TypeScript and unit tests verify the target override and both event emission callsites, including configured stage override.
2. Test **one consenting synthetic lead in a nonproduction setup** with controlled measurement IDs, inspect browser network `g/collect?tid=` and tag assistant to ensure exactly one **website `generate_lead`** for the main stream and none for the Firebase stream from the *same gtag marketing event*, while Firebase's independent events still function. Inspect `submission_id` handling and possible server-side forwarding / Google tag destinations, which this source patch cannot rule out.
3. Verify `/phonics` main-site `page_view` once, custom event paths once, authentication and mobile iOS unaffected.
4. Merge and deploy separately from assessment validation PR #762 and semantics PR #763 after staged acceptance; annotate a new measurement cutover in GA4.
5. Compare **same-grain, post-release** event counts by stream. The 161/161 parity strongly suggests duplication but **cannot prove** exactly 161 distinct Firestore leads. No direct production Firestore reads were performed.

## Separate internal admin funnel labeling defect
Owner screenshots for September (173 leads, 173 "Reached demo", 26 admitted) and October 1–25 (107 leads, 107 "Reached demo", 10 admitted) are from `LeadSourceAnalysis.tsx`, which counts `demoSessionId` or even `demo_pending_schedule` as having "reached demo." The backend `leadDemoAutoWorkflow.ts` creates demo pipeline/session references automatically. Thus **Reached demo currently means workflow entered, not class attended**, and the 100% cannot be called a true demo show-up/completion rate. Keep that admin KPI label/definition repair in a distinct, tested PR, with authoritative booked/completed demo records and lifecycle status; do not change it in this analytics-routing patch. 
