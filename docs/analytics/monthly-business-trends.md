# Monthly Business Trends — MAT ad hoc feature

## Scope and status
Separate additive draft feature on main, not an OS V2 phase advance. No live data access or deployment in this change. The dashboard reads only verified projections; until a writer is approved and populated, historical and current metrics are unavailable. The offline projection builder operates only on already-normalized, reconciled contributions; it is not a Firestore collector or live trigger.

## Source contracts to certify before writer activation
- Leads: leads/{canonicalLeadId}/inquiries/{sourceLeadId} preserves website submissions; use firstInquiryAt for first child opportunity, not canonical row count or phone-only dedup. Apply existing business inquiry semantics (same-day duplicate submissions versus repeat enquiries) and verify non-website coverage. Do not treat an incomplete event history as a zero.
- Admissions: use canonical kid identity, lifecycle.ts creationIntent/creationOperationId, enrollmentDate and creation history. First-ever qualifying enrollment is an admission; a previously exited child returning is a reactivation. Additional course and transition are separate from admissions. Exclude corrections/import artifacts from commercial movement; group a course transition by its operation ID before emitting facts. Do not infer exit month from updatedAt. Use lifecycle audit events and endedAt/completedAt where reliable.
- Retained students: active or paused qualifying course enrollment; active students: distinct children with active courses; paused students: children with paused courses but no active courses. An exit is loss of the last retained enrollment. Pauses are not exits. Pending/trial/legacy statuses require explicit source mapping and business-owner validation.
- Finance: reuse canonical monthly billed/settled/due semantics from parent monthly read models; payments use receiptMonthKey/paidAt, distinct from billed service month. Reconcile existing revenue rollup against canonical billing and payment ledger before using it. Integer paise, not floating-point totals. Outstanding is as of projection update, not historical month-end debt.
- All month keys Asia/Kolkata. Historical coverage and current snapshot need independent evidence. No source scans on page load.

## Proposed paths
adminStats/businessAnalyticsV1/businessAnalyticsYears/{YYYY}
adminStats/businessAnalyticsV1/businessAnalyticsSnapshots/current
adminStats/businessAnalyticsV1/businessAnalyticsMonths/{YYYY-MM}

Do not name a collection 'months': existing collection-group finance aggregations query months by monthKey. Existing adminStats recursive rules restrict reads to admin/founder and deny client writes; no rules changes here. Only aggregate values (no PII) in documents. Schema v1/metric definition v1; verificationStatus verified is mandatory; null = unverified or absent. updatedAt is an ISO timestamp. Publish years/current only from an independently verified normalized input; use bounded transactions/versioned publication and protect against stale overwrites. A projection document is not an operational authority.

## Implemented
- Seventh Analytics section: Monthly Trends, with Leads, Payments and Enrollments subviews, year selector, tables, primary metric chart and current count cards.
- Two named getDocLogged calls on a cold panel load; five-minute in-memory cache; no raw-data fallback, no read on internal tab changes; fetch attempt count is not billing telemetry.
- Pure offline projection builder with per-metric coverage, event dedup, roster identity counts, student movement/exit checks and month continuity validation.
- Regression tests added; CI and actual billing/read benchmarks must still be reviewed.

## Remaining before activation
1. Verify source coverage with separately approved bounded read-only scope; decide unresolved historical and lead semantics. Establish authoritative normalized event adapters, including corrections, deletions, transitions, legacy and multi-course identity.
2. Implement server-only incremental contributor ledger and idempotent updates with bounded per-child/per-month costs; add outbox/retry/reconciliation and controlled rebuild/repair; measure write amplification.
3. Implement dry-run historical backfill with explicit budgets and checkpointing, audit and independently reconcile; never guess dates.
4. Run unit, UI, security and emulator tests and verify two-read budgets, cache/error behavior and projection freshness; then obtain explicit approval for deployment and writes. No merge, deployment, migration or OS V2 programme change is implied by this draft.
