# PV-1D implementation status

Current branch: `feat/ask-tiny-steps-pv1d-routing-telemetry`

Implemented in this slice:

- one privacy-safe `ask_tiny_steps_route` GA4 event per completed accepted request
- deterministic vs grounded AI vs general-guidance vs local-fallback visibility
- intent, audience, routing reason and follow-up metadata
- approved Tiny Steps source IDs only, capped at two
- coarse prompt-length bucket only
- configured model-lane visibility
- total client-perceived latency
- no new Firestore or conversation persistence
- unit, hook-integration and static privacy guard tests

Not included in this slice:

- raw prompt/answer/error content
- exact successful provider model after an internal grounded cascade retry
- raw provider error categories
- per-user/session/request identifiers
- Google Search grounding

Exact provider-attempt diagnostics should be a separate reviewed extension only if production data shows that route-level telemetry is insufficient.
