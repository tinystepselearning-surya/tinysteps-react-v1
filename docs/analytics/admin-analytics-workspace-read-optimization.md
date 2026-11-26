# Admin Analytics workspace — closed-day reporting and read-budget migration
Owner approved 26 November 2026. Status: Phase 1 count-only inventory tooling prepared; production inventory and measured savings pending. No production changes in this PR.

## Baseline (source review at 95b44babd7f3132b212b781eabeec000fced14c8)
| View | Query path | Current behaviour |
| --- | --- | --- |
| Overview | AnalyticsDashboardV3 + DemoSessionsManagement | canonical months collection-group sum, full leads + demoSessions realtime listeners |
| Growth & Admissions | DemoSessionsManagement / LeadFunnelTrendAnalysis | full leads + demoSessions realtime listeners; filter/cohort calculation in browser |
| Acquisition | LeadSourceAnalysis | three month/range-bounded Timestamp queries over leads (receivedAt, requestedAt, createdAt); dedup after retrieval |
| Finance | AnalyticsDashboardV3 / teacherFinanceSummaryLoader | canonical month sum, month billingCharges and classSessions, all enrollments and courses, certification marker + teacher month rollups or raw earnings fallback |
| Delivery | AnalyticsDashboardV3 | month billingCharges and classSessions, all enrollments and courses |
| Teachers | AnalyticsDashboardV3 | month teacherEarnings and all users; local aggregation, profile labels and pagination |
| Monthly Trends | MonthlyBusinessTrends | annual and current saved documents; separate deployed daily capture/publication |

Parent shell has a five-minute month-keyed in-memory cache for datasets; child lead/demo listeners and acquisition queries are separate. Count-only inventory models fresh uncached view openings, not every tab transition or actual billed reads. Existing batchInsightsRollup concerns games; globalLearnersRollup concerns learner geography. Neither replaces the business analytics workspace queries.

## Inventory
Use existing read-only production ADC from Monthly Trends; do not change IAM or use deploy credentials. From the repository root, after installing locked dependencies if needed:
```sh
node scripts/business-analytics-workspace-inventory-cli.mjs --project tinysteps-react-v1 --month 2026-11 --approve-production-read
```
Fixed 13 aggregate count calls; no document contents or IDs are retrieved. Run only for representative current/prior months, not all history by default. Results are private; do not commit production counts or paste them in public PRs. Counts are advisory and not from one transaction; use them to set hard document/page/time caps. Separately obtain measured Firestore billable reads and representative dashboard-opening frequencies from existing monitoring (not inferred from count results). Finance canonical sum aggregation is not estimated by returned rows; record index entries scanned if available. Count group queries mirror current UI; confirm actual scope and certification before migrating. Inventory can fail if indexes unavailable; do not create indexes automatically.

## Metric and architecture decisions
- Freeze management reporting at previous day IST; preserve live parent/teacher payments, lead/demo operations, attendance, scheduling, reconciliation and all source writes.
- Preserve existing Monthly Trends 00:15 capture and 01:00 publish timing; use the staggered reporting calendar below for expansion. First verify the currently deployed Monthly Trends first scheduled capture and publication. Do not change its budget or implementation until read-window/latency and exact cutoffs are verified.
- Reuse the existing bounded historical snapshot transaction and source masks where practicable. Read leads/enrollments/charges once across reports; reuse existing certified read models where proven equivalent. Do not repeat source scans per month/view; count distinct incremental sources. Use shared pure reducers extracted from existing metric logic rather than independently redefining funnel, attribution, settlement, earnings or recurrence.
- Keep admissions cohort and activity semantics separate from Monthly Trends recorded enquiry counts; preserve exclusions, source attribution categories, Speaking-origin cohort and forward-only milestone cutover. As-of cutoff applies to event evidence and snapshot state. No prospective demo backfill. Do not alter shared operational DemoSessionsManagement behaviour.
- Keep canonical service-month billed, settled, outstanding and collection-rate normalization. No replacement with Monthly Trends billed charges (different metric). Historical finance can change after settlement/correction: track source changes and recompute affected service months, do not permanently freeze historical balances. Keep forecast explicit as forecast based on schedules as of cutoff, with future planned sessions distinct from actuals.
- Teacher economics retains per-teacher authorized details, archived/deleted profile classifications and accurate pending balances. No unrelated user personal data in aggregate documents.
- Candidate namespace: adminStats/businessWorkspaceV1/months/{YYYY-MM}, with split per-view subdocuments if payload size requires it; manifest carries schemaVersion, metricDefinitionVersion, throughDate, sourceReadTime, publication generation, completeness and state. Admin/founder only; no client writes. No raw personal or source document payloads. Limit aggregate size, explicit path allowlist, atomically publish compatible snapshots, fail closed on stale/invalid/missing generation, preserve previous good snapshot. No browser raw fallback after cutover; not available rather than zero. One to three aggregate reads per uncached view target; no operational reads; shared cache by generation and month, including refresh.
- No historical migration or additional independent nightly scans by default. Reporting month selection preserved; future forecast selection only if a verified saved forecast exists; unsupported periods explicit.

## Owner-approved platform-wide data freshness policy (26 November 2026)

Default to persisted reporting projections, not realtime operational collection access. Realtime is an explicit exception justified by an immediate action, safety, correctness or transactional dependency. This policy applies to future Tiny Steps OS modules as well as the current Analytics workspace. Audit existing modules before changing them; do not indiscriminately remove listeners or weaken consistency.

| Freshness class | Use cases | Read policy |
| --- | --- | --- |
| Operational realtime | Newly received leads requiring response, demo assignments/bookings, ongoing class/attendance operations, pending operational alerts, payment or wallet actions and confirmations | Narrow indexed query or document listener only while the relevant workflow is active; unsubscribe on exit; paginate; no full-history subscription |
| On-demand current | Individual detail investigation, explicit reconciliation or exception review that genuinely needs today's state | Targeted authorized one-time query, bounded by entity and period; avoid implicit refreshes |
| T-1 management reporting | Overview, Growth, Acquisition, Monthly Trends, finance reporting, delivery/teacher economics, historical dashboards, nonurgent management statistics | Published aggregate documents only; data through previous IST day; reload reads aggregates, never triggers raw scan |
| Static/reference | Stable catalogue/configuration/lookup data where immediate updates are not required | Reuse existing versioned or cached read model, invalidate on relevant changes; no nightly reread solely because a batch exists |

Classify each dataset or feature, not just the page. A live action and a historical KPI may coexist on one screen but must use separate paths and explicit freshness labels. Correctness-sensitive transactions, authorization, attendance and payment invariants remain authoritative. Historical finance balances and other corrected periods must be recomputed through verified dirty-month/change detection where applicable; T-1 does not mean permanently immutable history.

### Two-tier platform data architecture (owner clarification)

The controlling architecture is two major activities: (A) the authoritative operational/transactional tier, kept current only where the business workflow requires it, and (B) the T-1 reporting/insights tier, populated by scheduled projections or equivalent certified incremental read models. Inspired by the operational-versus-reporting separation in Epic, not an attempt to reproduce its proprietary implementation. On-demand reads and cached reference data are access patterns within these two tiers, not additional business data tiers. Do not move transactional authority to reporting snapshots.

Expand the optimisation programme beyond Admin Analytics after its current release phases. Audit actual routes, source queries, existing materializations, user-facing expectations, and freshness requirements for each module before migration.

| Module | Operational tier: preserve current accuracy | Reporting tier: candidate T-1 |
| --- | --- | --- |
| Parent insights | Immediate learning feedback or newly submitted work when the workflow requires it; current access and entitlement checks | Progress trends, attendance history summaries, skill analytics, games/learning insights and cumulative reports where business expectations permit |
| Parent payments (parent/admin) | Current payable amount before collection, wallet/credit, payment initiation/confirmation, transaction status, receipts, adjustments and authoritative validation | Historical monthly billing/collection summaries, ageing and management breakdowns, nonurgent trends and reporting tables |
| Teacher payments (teacher/admin) | Current payable/pending state when initiating approval or settlement, payout confirmation, disputes and adjustments; authoritative duplicate-payment prevention | Monthly earnings summaries, historical payouts, teacher economics, reporting totals and nonurgent breakdowns |
| Leads/admissions | Newly received enquiries, assignments, follow-ups and demo actions | Conversion trends, cohorts, acquisition and monthly reports |
| Classes/learning operations | Current calendar, attendance, class actions, necessary immediate progress feedback | Historical delivery/attendance metrics and progress analysis |

Mixed screens must label T-1 totals separately and must never use them as an amount to collect/pay or as authorization for a transaction. Prefer a compact current authoritative read model or targeted entity read for the operational exception, not a full ledger scan. Refresh current transaction confirmation independently; do not force a nightly snapshot rebuild. Preserve receipts and completed transaction evidence as soon as available. Historical and parent-facing snapshots require tenant/parent/teacher-scoped authorization; founder-only management reports are not a substitute. Use already-existing parent monthly billing, teacher earnings and learning insight read models if verified equivalent; don't create redundant nightly full scans or remove useful incremental updates merely to enforce a schedule.

Cross-platform rollout: inventory all live listeners and read paths, rank by measured billable reads and business freshness need, map to existing projections and scheduler dependencies, set per-module T-1 or justified exception, then migrate one bounded domain at a time with parity and security tests. Include Parent Insights, Parent Payments and Teacher Payments in the follow-on queue. No schedule assignments for these additional domains until the scheduler inventory, current projection reuse and business acceptance are verified. No changes to actual ledgers, existing business logic or parent/teacher access based solely on this policy. Record each realtime exception and its business justification in the module's design/read plan.
 
### Proposed staggered overnight processing calendar (Asia/Kolkata)

Preserve existing deployed Monthly Trends jobs and their first-run verification. The following is a planning allocation, not deployed schedules. Finalize against actual project-wide Cloud Scheduler inventory, measured job durations, quotas, dependencies and marginal read costs before implementation. Leave approximately 15–20 minutes of minimum breathing room between heavy jobs, with longer gaps for dependent jobs; do not start all jobs at 01:00.

| IST slot | Proposed work |
| --- | --- |
| 00:15 | Existing exact closed-day capture; extend shared bounded capture only after evidence supports it |
| 01:00 | Existing Monthly Trends publication |
| 01:30 | Growth, admissions, acquisition and overview admissions components |
| 02:00 | Finance management reporting and overview finance components |
| 02:30 | Existing globalLearnersRollup; reserve this slot pending complete scheduler inventory |
| 03:00 | Delivery and teacher economics reporting, subject to dependency and runtime verification |

Overview must not claim a coherent new generation until all its required components have completed. Shared inputs may be staged as sufficient aggregate/intermediate values with bounded storage and no unnecessary personal records. Later jobs should consume staged data or certified cutoff-consistent projections, not repeat scans. Dependency checks and non-overlap guards must hold even if a prior job overruns. No requirement to schedule a separate job for every tab.

Important exact-cutoff constraint: PITR was disabled in the verified Monthly Trends design; ordinary historical reads have a one-hour window. At 01:30–03:00, a direct query cannot reliably recover the exact prior-day midnight database state. Capture necessary cutoff-consistent state within the allowed window, using shared bounded reads or validated change-driven projections; then stagger computation/publication after midnight. Do not substitute today's mutable statuses with a timestamp filter and call it T-1. If a source cannot support exact cutoff, retain the last verified snapshot and label freshness/coverage honestly; propose a separate measured solution rather than enabling PITR or granting IAM without review.

Each scheduled unit needs a documented input/output, owner, read/write budget, cadence, dependencies, cutoff, timeout, idempotency, run lock, stale/error policy, and measured read savings. Failed or skipped batches must not trigger raw client fallback. Prior verified snapshots remain readable. Track source documents, aggregate/index queries, writes, compute, runtime, coverage and cost. No new recurring job if incremental/change-driven reuse is cheaper. No live operational regressions; no production changes solely from this policy update.

## Release phases and acceptance
1. Inventory and cost baseline: current status count-only tooling in review. Measure actual baseline visits, relevant read SKU and free quota, source counts and rollup readiness. Compare expected reads removed against incremental reads, index scans, writes, storage, compute. Do not claim rupee savings until measured. Use existing read-only identity; production output private.
2. Extract pure growth/overview/acquisition reducers with parity fixtures and existing definitions. Shadow snapshots first; no change to live admin UI. Validate cutoff, source attribution, historical events, future-only cutover.
3. Finance/delivery parity and certified rollup strategy; late corrections, missing fees, exact monetary units, future recurrence forecasts, parent-month group scope. Avoid nightly full history scans; use bounded dirty-month strategy if evidence supports it.
4. Teacher Economics parity, auth and bounded summary rows; preserve archived/deleted and pending semantics.
5. Extend shared cutoff-consistent capture and stagger reporting computation/publication using the owner-approved overnight calendar. Inventory existing jobs first, set non-overlap/dependency guards and hard shared budgets, and isolate failures so Monthly Trends is not blocked by expansion. One consistent cutoff, no new IAM, no source mutations, no redundant per-tab jobs; test capture inside retention window and publication idempotency. Only enable if cost evidence supports net benefit.
6. Shadow compare every field to current calculations on the same source state, including missing-data states; test read-plan via mocked Firebase queries and emulator authorization. Record source counts, duration, aggregate sizes and expected billed read difference. Actual production parity required, not just synthetic tests.
7. Release tab by tab with snapshot readiness gate; remove Analytics-only raw listeners and loaders after parity. Preserve operational pages. Verify no unintended functions or Hosting/rules/index changes, no live user workflows affected, cold/warm opens, reload and selected month reads. Failures retain prior good report; rollback isolated UI release and/or disable extension, not existing Monthly Trends.

Savings model: net monthly avoided billable reads = measured old workspace reads minus new saved-report reads minus marginal nightly reads and inventory/index overhead. Monthly monetary effect uses actual applicable Firestore SKU and billing export, with shared free quota, writes, compute and storage considered. If the added nightly work costs more than avoided reads, choose change-driven/incremental rollups or lower cadence for that section instead of a full daily scan.
