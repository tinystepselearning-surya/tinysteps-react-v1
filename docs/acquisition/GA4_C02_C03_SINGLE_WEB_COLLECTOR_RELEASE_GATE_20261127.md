# GA4-C02 / C03 — Single web collector release gate

Decision: CONDITIONAL GO for preparation only. Do not merge or deploy before explicit cutover approval and the gates below. GA4 property 511590765; B (G-5RMQVF1HGD, stream 12861233936) is preferred; A (G-J3TTBH8CN9, stream 12860717923) remains available for historical reporting.

## Evidence on 27 November 2026

- Privacy remediation PR #964 merged at 6b289bf1bd30c151328f2582bdec1b31e6f2d977; main and ci/hosting-production resolved to that SHA. Independent public build-info.json retrieval failed in this environment. The marker is not a live collect-request witness.
- Owner screenshots show version 1, "Empty Container is Live", zero custom tags/triggers/settings/variables for both upgraded Google tag containers, with gateway not started. A's Settings shows one current destination (A); B's overview shows one destination, truncated. B's exact destination mapping and automatic-detection settings remain to verify.
- Both streams received traffic in the prior 48 hours. A Enhanced Measurement off, B on. Earlier audit established B's Firebase web registration and Search Console linkage. Shared event names do not establish duplicate hits.
- Connected account inventory exposes Search Console only, not GA4 reports. No aggregate counts, consent proof, published integration inventory or request-level trace fabricated.

## Candidate changes

- Pin the public collector to B and assign send_to after sanitization. Do not honor stale VITE_GA_MEASUREMENT_ID for this production web collector. Firebase measurement ID and web app registration stay unchanged.
- Keep Firebase JS Analytics initialization for native Capacitor runtime only; no native files touched. Verify both native shells before release. Keep Auth, App Check, Firestore, Functions and operational lead writes intact.
- Manual pathname page views; skip repeated query-only views, reset upon an excluded route. Exclude known embedded child-play pages and private routes, keep resource marketing hubs. Use ga-disable on route transitions as defense in depth, not as consent or proof of zero automatic requests. Recheck route at deferred tag load. Disable ad personalization and Google signals in the collector config.
- Preserve existing Clarity loader (no new recorder); it shares the stricter initial route gate. Already-loaded replay on SPA transitions, provider consent and masking are unresolved, not certified. Do not release until resolved or explicitly pause collection with approved mitigation.
- No extra Firestore reads/writes, subscriptions or scheduled jobs. No production or GA4/Firebase console changes by this draft.

## Mandatory gates before merge and production cutover

1. Obtain aggregate 7/28/90 complete-day reports (20 Nov/30 Oct/29 Aug through 26 Nov 2026, property timezone). GA4 Explore: rows Stream ID, metrics Event count, Sessions, Total users, Active users, Views, Key events; filter exact two numeric IDs. Separately rows Stream ID and Event name, metrics Event count and Key events; include generate_lead, demo_request_received, book_assessment_click and other current/legacy events. Export aggregate CSV only; record thresholds/timezone; do not add user counts across streams.
2. Inspect B Workspace > Settings > Google destinations and both streams' Manage automatic event detection, user-provided data, domains, and all Product links (Search Console, Firebase, Ads, BigQuery), native experiments/Remote Config and Measurement Protocol inventory without keys. Confirm B sole intended destination. Review consent configuration and historical reporting dependencies. Do not publish new tags or link A to B.
3. B: archive Enhanced Measurement configuration; after separate approval disable history pageviews, outbound, form, search and other unneeded automatic collection before cutover. send_page_view:false does not stop history-based measurement alone. Preserve Search Console. Do not delete streams, detach Firebase, enable Google Signals or advertising.
4. Clean synthetic production baseline: inspect public page load, SPA nav, back/forward, empty assessment form. In Chrome Network filter collect. Record event name, tid, sanitized route category, parameter key presence and event-record count (including POST batches); no raw HAR/cookies/URL values/customer records. Verify live marker. Candidate staging test must exercise the same code/approved tag configuration without sending synthetic data to production GA4 (intercept collect requests or use approved isolated test destination); test saved lead only on emulator/controlled staging, never fake production enquiries.
5. Resolve consent handling (denied, granted, withdrawn), remaining event value contracts, automatic/lifecycle collection on excluded routes, already-loaded Clarity replay and masking. Verify no forbidden fields or raw URLs on the wire. Source-level opt-out is defense in depth and cannot establish runtime privacy. Verify both native shells, public conversion semantics, approved reporting taxonomy and first-party counters with aggregate-only evidence. Confirm no remaining A sender in deployed build or integration.
6. Pass CI and production-style browser acceptance; review final head and current main, preserve both streams and native apps. Obtain separate cutover approval. Do not treat an empty container as a stopped tag.

## Release and recovery

Record prior privacy-safe hosting SHA 6b289bf1bd30c151328f2582bdec1b31e6f2d977 and archived tag settings. Release only after gates pass. Verify new live build identity, one B request per intended page view/conversion, no A requests on fresh browser sessions, no unexpected portal/play requests. Monitor 48–72 hours then seven complete days; existing open tabs/cached builds may produce straggler A traffic. If duplication, prohibited parameter, major reporting loss or product regression occurs, pause affected collection or restore approved privacy-remediated build and compatible settings with owner approval. Do not restore pre-#964 sender or delete historical streams. A's inactivity indicator may lag actual cessation.

References: https://developers.google.com/tag-platform/gtagjs/routing ; https://developers.google.com/analytics/devguides/collection/ga4/views ; https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2
