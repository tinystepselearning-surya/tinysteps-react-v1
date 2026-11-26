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
- Keep existing 00:15 capture and 01:00 publish timing. First verify the currently deployed Monthly Trends first scheduled capture and publication. Do not change its budget or implementation until read-window/latency and exact cutoffs are verified.
- Reuse the existing bounded historical snapshot transaction and source masks where practicable. Read leads/enrollments/charges once across reports; reuse existing certified read models where proven equivalent. Do not repeat source scans per month/view; count distinct incremental sources. Use shared pure reducers extracted from existing metric logic rather than independently redefining funnel, attribution, settlement, earnings or recurrence.
- Keep admissions cohort and activity semantics separate from Monthly Trends recorded enquiry counts; preserve exclusions, source attribution categories, Speaking-origin cohort and forward-only milestone cutover. As-of cutoff applies to event evidence and snapshot state. No prospective demo backfill. Do not alter shared operational DemoSessionsManagement behaviour.
- Keep canonical service-month billed, settled, outstanding and collection-rate normalization. No replacement with Monthly Trends billed charges (different metric). Historical finance can change after settlement/correction: track source changes and recompute affected service months, do not permanently freeze historical balances. Keep forecast explicit as forecast based on schedules as of cutoff, with future planned sessions distinct from actuals.
- Teacher economics retains per-teacher authorized details, archived/deleted profile classifications and accurate pending balances. No unrelated user personal data in aggregate documents.
- Candidate namespace: adminStats/businessWorkspaceV1/months/{YYYY-MM}, with split per-view subdocuments if payload size requires it; manifest carries schemaVersion, metricDefinitionVersion, throughDate, sourceReadTime, publication generation, completeness and state. Admin/founder only; no client writes. No raw personal or source document payloads. Limit aggregate size, explicit path allowlist, atomically publish compatible snapshots, fail closed on stale/invalid/missing generation, preserve previous good snapshot. No browser raw fallback after cutover; not available rather than zero. One to three aggregate reads per uncached view target; no operational reads; shared cache by generation and month, including refresh.
- No historical migration or additional independent nightly scans by default. Reporting month selection preserved; future forecast selection only if a verified saved forecast exists; unsupported periods explicit.

## Release phases and acceptance
1. Inventory and cost baseline: current status count-only tooling in review. Measure actual baseline visits, relevant read SKU and free quota, source counts and rollup readiness. Compare expected reads removed against incremental reads, index scans, writes, storage, compute. Do not claim rupee savings until measured. Use existing read-only identity; production output private.
2. Extract pure growth/overview/acquisition reducers with parity fixtures and existing definitions. Shadow snapshots first; no change to live admin UI. Validate cutoff, source attribution, historical events, future-only cutover.
3. Finance/delivery parity and certified rollup strategy; late corrections, missing fees, exact monetary units, future recurrence forecasts, parent-month group scope. Avoid nightly full history scans; use bounded dirty-month strategy if evidence supports it.
4. Teacher Economics parity, auth and bounded summary rows; preserve archived/deleted and pending semantics.
5. Extend the existing capture/publish pipeline under hard shared budgets. Stage incremental reports with separate failure isolation so Monthly Trends is not blocked by expansion. Ensure one consistent cutoff, no new IAM, no source mutations, no per-tab jobs; test capture inside retention window and publication idempotency. Only enable if cost evidence supports net benefit.
6. Shadow compare every field to current calculations on the same source state, including missing-data states; test read-plan via mocked Firebase queries and emulator authorization. Record source counts, duration, aggregate sizes and expected billed read difference. Actual production parity required, not just synthetic tests.
7. Release tab by tab with snapshot readiness gate; remove Analytics-only raw listeners and loaders after parity. Preserve operational pages. Verify no unintended functions or Hosting/rules/index changes, no live user workflows affected, cold/warm opens, reload and selected month reads. Failures retain prior good report; rollback isolated UI release and/or disable extension, not existing Monthly Trends.

Savings model: net monthly avoided billable reads = measured old workspace reads minus new saved-report reads minus marginal nightly reads and inventory/index overhead. Monthly monetary effect uses actual applicable Firestore SKU and billing export, with shared free quota, writes, compute and storage considered. If the added nightly work costs more than avoided reads, choose change-driven/incremental rollups or lower cadence for that section instead of a full daily scan.
