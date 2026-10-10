# Wave 1 / R5 Milestone 3 — P1 Sessions Management cached authorization boundary

**Status:** Authorization hardening under acceptance CI. Milestone 3 remains OPEN.

## P1 scope and threat

Milestone-3 report in PR #700 identified `src/lib/sessionsManagementSnapshot.ts` as an unscoped memory + sessionStorage cache of admin-facing sessions/enrollment/user/student rows. Previously any snapshot callable failure, including `permission-denied`, could display the previous snapshot. A different user signing into the same browser tab could also encounter its cached data. This is a source-observed browser exposure risk, not a demonstrated incident or a Firestore Rules bypass.

## Implemented controls

1. **Actor-scoped v4 cache:** The cache now carries the signed-in Firebase UID as its owner. An unauthorized or mismatched actor never consumes the rows or another actor's projection-revision hint. The old unscoped v3 key is not migrated and is removed.
2. **Per-session revalidation:** Persisted data can supply only a revision hint until the same authenticated actor successfully calls `getSessionsManagementSnapshot`. The synchronous UI cache getters return no data without this verification.
3. **Credential boundary invalidation:** Firebase Auth changes (via existing AuthBootstrap listener), explicit logout, an auth listener error, access failure and account mismatch clear the cache. The code introduces no extra authentication listeners or Firestore reads.
4. **Race-safe in-flight work:** A generation counter prevents an old actor's in-flight snapshot, refresh or selected-date response from populating the new actor's memory/storage. Promise cleanup is identity-checked so an old completion cannot discard the new actor's pending request.
5. **Fail-closed errors:** `permission-denied`, `unauthenticated`, disabled/expired token and unrecognized errors do not reuse cached operational data. Only explicitly recognized transient transport errors may reuse already revalidated, same-session data.
6. **Admin screen:** Existing displayed rows clear before paint when the account UID changes and on relevant projection authorization failures. Old actor loaders are re-run/cancelled on UID changes.
7. **Reminder fallback:** A denied or actor-changed snapshot request is no longer routed through legacy Firestore fallback. That path remains only for recognized transient failures, preserving outage resilience.

No Cloud Functions, backend authorization, Firestore/Storage Rules, indexes, payments, attendance data or custom claims are changed.

## Regression gates

- Behavior-level tests for successful same-actor revision revalidation, persisted data not shown before revalidation, v3 rejection, mismatched owner purging, UID switch, logout, rejected authorization, manual refresh revocation, transient outage fallback, unknown failures, in-flight response races and date-loader races.
- Reminder fallback denied for `functions/permission-denied`, `functions/unauthenticated` and `snapshot/actor-changed`.
- Existing AuthBootstrap and admin notification regressions; full application tests, typecheck, focused and full lint, public production build.
- Exact deployment classifier must report **0 Functions and Hosting-only**. No backend service/rules deployments are allowed in this slice.

## Unresolved boundary

Client route protection, live role authorization, legacy Rules exception parity, payment audit read caps and production-billed Firestore reads remain separate Milestone-3 work. This change avoids stale browser-cache exposure after a detected denial, but it does not constitute a completed canonical Rules cutover or certify every browser page and native client. Authenticated production canaries remain separately owner-gated.

**Deploy strategy:** Merge only after full CI green and production build/checkpoint review. Verify the Hosting-only release independently after merge; do not advance any Milestone-3 global cutover flag.
