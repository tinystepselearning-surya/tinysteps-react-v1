# Tiny Steps Firestore & Database Architecture Optimization Audit

Tracking issue: #58

## Purpose

This workstream audits the complete Firestore/database usage of Tiny Steps before making architecture changes. The goal is to preserve smooth teacher, admin, parent, admissions, billing, attendance and learning operations while removing unnecessary reads, writes, listeners, triggers, legacy compatibility fan-out and obsolete database paths.

The audit is deliberately **read-first**. No production cleanup, schema migration, broad rule rewrite, index deletion or functional redesign should be performed until the affected workflow is understood and its replacement has a regression-safe plan.

## Safety principles

1. **Operations first.** Optimization must not make teachers, admins or parents wait longer or lose realtime behavior they genuinely depend on.
2. **Measure before changing.** Each fix must have an observable before/after metric: reads, writes, listener count, function invocations, billable operations, latency or result size.
3. **Bound growing collections.** Operational pages must not read an entire collection merely because it is convenient.
4. **Realtime by need, not by default.** Use listeners only where users benefit from live updates; otherwise use bounded one-time queries plus explicit refresh/cache invalidation.
5. **Canonical schemas.** New code must use canonical field names and ownership. Legacy aliases are transitional, not permanent architecture.
6. **Idempotent backend.** Re-delivering the same event must not create new business writes. Timestamp-only changes must not propagate workflows.
7. **Quiescence.** After a legitimate business event reaches the correct final state, background work must stop.
8. **No blind bulk work.** Migrations/backfills require dry-run, a tiny canary, bounded batches, a hard stop and post-run verification.
9. **Security and cost together.** Rules should grant only the access required and avoid unnecessary dependent reads where claims/projections can safely replace them.
10. **One issue at a time.** Architectural fixes should be small enough to test, deploy, measure and roll back independently.

## Audit workstreams

### A. Client Firestore reads
Inventory every `getDoc`, `getDocs`, `onSnapshot`, `collectionGroup`, React Query reader and dynamic Firestore import. For each reader record:

- page/component/service
- role using it
- collection/query
- one-time vs realtime
- limits/date bounds
- server filtering vs client filtering
- expected result size
- cache/stale policy
- listener cleanup
- active vs legacy/dead code
- estimated reads per page open and per idle hour

Flag:

- full-collection reads/listeners
- client-side filtering after broad reads
- N+1 queries
- duplicate compatibility/alias queries
- repeated listeners on rerender/remount
- hidden tab listeners
- duplicate hooks for the same data
- reads that should use an existing projection/read model

### B. Firestore writes
Inventory all direct client writes, callable writes, scheduled writes, Firestore-trigger writes, rollups, audit writes and migrations.

Flag:

- timestamp-only rewrites
- no-op writes
- broad fan-out
- write-back to an upstream trigger collection
- duplicate canonical/legacy field maintenance
- missing state comparison
- missing idempotency
- unbounded batch jobs

### C. Functions / Eventarc / Pub/Sub
Build a trigger dependency graph:

`collection write -> function -> reads -> writes -> downstream trigger`

For every event-driven function verify:

- semantic before/after guard
- deterministic/idempotent behavior
- retry safety
- bounded reads/writes
- no recursive cycle
- no retired scheduler or repair trigger left deployed

### D. Firestore Security Rules
Review:

- role checks and repeated dependent `get()` / `exists()`
- broad `/users` access
- tenant boundaries
- parent/teacher/LP ownership predicates
- query-safe `list` permissions
- public surfaces
- legacy compatibility rules
- inactive/terminated-user behavior
- opportunities to rely on auth claims or narrow projection docs where safe

Do not weaken authorization merely to reduce reads.

### E. Data model / canonical ownership
Map canonical and legacy aliases for:

- teacher IDs
- parent IDs
- kid/student IDs
- enrollment IDs
- course IDs
- lead/demo identities
- billing/month keys
- status fields

For each domain define the canonical source of truth and a safe retirement path for aliases.

### F. Indexes
Map every composite index to active source queries. Classify:

- required active
- duplicate/overlapping
- legacy-only
- unknown (needs production evidence)

Review automatic index exemptions for large text, timestamps or fields never queried. Never remove an index until its query dependency is proven absent.

### G. Page-level read budgets
Establish target budgets for major workflows. Exact targets should be validated against Query Insights and current collection sizes, but the architectural direction is:

- Leads & Enquiries: bounded operational window; no all-history subscription
- Demo management: bounded/status-scoped queries
- Student management: paginated/bounded reads
- Enrollment management: server-filtered/paginated
- Teacher dashboard/schedule: teacher-scoped and time-scoped
- Parent dashboard: parent/child-scoped projections
- Attendance/progress: no cross-database N+1 scans
- Billing/payments: parent/month scoped read models

Idle screens should generate near-zero reads unless relevant documents actually change.

## Initial findings requiring validation

These are audit candidates, not permission to change production yet.

### 1. Leads & Enquiries over-fetching — likely High
The active workspace currently subscribes broadly to `leads`, all `demoSessions`, all `demoSessionsPrivate`, and teacher users. Month/bucket filtering is largely a UI concern rather than a bounded Firestore query. This cost grows with historical data.

### 2. Generic realtime hook lifecycle — High if active, otherwise cleanup debt
`src/hooks/useRealtime.ts` starts `onSnapshot()` inside an async function and does not correctly return the unsubscribe function from the React effect. Inline constraint arrays can also change reference on every render. Determine whether any active route still uses it; fix or delete accordingly.

### 3. Legacy teacher alias fan-out — likely High
Some readers query multiple aliases such as `teacherId`, `teacherIds`, `assignedTeacherId`, `primaryTeacherId`, `teacherUid`, and `teacher_id`, then merge results. This can bill the same logical records more than once and perpetuates duplicate indexes/schema paths.

### 4. Attendance N+1 reader — Critical if active, otherwise removal candidate
Historical attendance code reads a broad collection and then issues a subquery per returned record. Prove whether the route is reachable. Rebuild around canonical class-session/attendance projections if active.

### 5. Security-rule dependent role reads — Medium/High
The rules repeatedly consult `/users/{uid}` for roles/status in helper functions. Firestore may cache repeated accesses within one request, but separate requests/listener evaluations can still incur dependent reads. Review claims/projections without reducing authorization correctness.

### 6. Broad signed-in `/users` read — Security + efficiency review
Most signed-in non-school-admin users can currently read user documents broadly. Audit every consumer and narrow the surface where feasible without breaking teacher/admin lookup workflows.

### 7. Production read attribution gap — Medium
`src/lib/firestoreReadLogging.ts` is useful but development-only. Use Firestore Query Insights and Cloud Monitoring as the primary production source; consider bounded sampled instrumentation only if Query Insights cannot identify a source.

## Audit deliverable

Before architecture fixes, produce a ranked report with one row per finding:

| Field | Required |
|---|---|
| Severity | Critical / High / Medium / Low |
| Active? | Active / legacy / dead / unknown |
| Workflow | Admin / Teacher / Parent / Public / Backend |
| Source | Exact file/function/query/trigger |
| Current pattern | What it reads/writes/listens to |
| Cost/risk | Why it scales badly or is unsafe |
| Evidence | Query Insights, code, logs, metrics |
| Proposed fix | Smallest robust architecture change |
| Regression risk | What could break |
| Test plan | Unit/emulator/E2E/production verification |
| Before/after metric | What proves improvement |

## Fix order

1. Active unbounded/high-amplification readers
2. Listener lifecycle defects
3. Active N+1/duplicate alias readers
4. Trigger/write amplification risks
5. Security-rule read and access cleanup
6. Canonical schema consolidation
7. Legacy/dead code removal
8. Index cleanup/exemptions
9. Long-term observability/read budgets

Every fix should be independently reviewed and measured before the next one.

## Definition of done

This project is complete when:

- major screens have documented bounded read budgets
- no active growing collection is fully read/listened to without explicit justification
- idle pages do not continuously generate unnecessary reads
- all realtime listeners clean up correctly
- backend functions are idempotent and quiescent
- active workflows use canonical schema fields
- legacy compatibility paths have been retired or explicitly documented with an expiry plan
- rules enforce least privilege without avoidable dependent-read overhead
- composite indexes map to known active queries
- Query Insights/Monitoring demonstrate sustained normal usage reduction
- teacher, admin and parent workflows pass regression verification
