# PV-1D acceptance checklist

- [x] Uses existing GA4 public analytics pipeline.
- [x] Emits one route event after each accepted request completes.
- [x] Distinguishes deterministic, AI and verified local fallback response paths.
- [x] Captures route mode, reason, audience, intent and follow-up state.
- [x] Captures approved source IDs only.
- [x] Captures prompt size as a coarse bucket, never content.
- [x] Captures configured model lane, not invented exact provider detail.
- [x] Captures bounded client-perceived latency.
- [x] Adds no Firestore/database writes.
- [x] Adds no persistent IDs or fingerprinting.
- [x] Adds explicit privacy regression coverage.
- [ ] Exact-head repository CI must pass before merge.
- [ ] Production GA4 custom dimensions/metrics should be registered after deployment for reporting.
