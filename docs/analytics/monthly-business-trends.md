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

## Incremental backend foundation — 2026-11-26
- Added normalized inquiry, receipt, billing and resolved child-operation contributors. Each stable contributor has a monotonic revision and bounded fact list. Corrections retract the previous contribution and apply the replacement, including cross-month changes. Stale revisions and exact retries do not mutate totals; conflicting revisions fail closed. Raw source-to-contributor mapping, trustworthy source revisions and a durable delivery/outbox remain unimplemented.
- Added dependency-injected atomic flow publisher (no live Firestore adapter/export): requires a verified generation and a fully seeded ledger, reads the contributor/control/month/year records before any write, checks mirror consistency, then writes the changed monthly/year documents and the ledger atomically. Single-month change fixture uses 4 reads and 3 writes; duplicate uses 2 reads and 0 writes; cross-month same-year correction uses 5 reads and 4 writes. Cross-year maximum for two months is 6 reads and 5 writes, excluding retries and security overhead.
- Flow publisher is deliberately limited to leads, billed and cash received. Do not publish student lifecycle movements independently of historical retained-stock snapshots and the current roster. Outstanding balance also requires separate canonical settlement recomputation: do not populate it from this publisher or describe unchanged balances as fresh. Before activation add per-metric freshness/coverage and stock-consistent publication.
- Added an offline seed manifest builder. It reconciles each covered flow against the supplied contributor ledger; duplicate contributors and mismatches fail. Its activation candidate is NOT authorization or a write. It emits intended canonical paths only; an actual staged-generation handoff, durable watermark, bounded collector, replay, and rollback procedure must be implemented and independently verified before use.
- Verification: 11 repository test bodies passed in an isolated JS harness with test/assert and SHA-256 shims; this is NOT a native Node test, TypeScript compilation, UI regression, or Firestore emulator pass. Container git ls-remote failed DNS resolution. The prior admissions-only integrated release gate rejected docs/analytics/monthly-business-trends.md at its file scope guard before tests. No existing gate was disabled or altered.
- No production database access, collector, trigger export, rule change, deployment, or OS V2 phase advance.

## Source adapters and isolated transaction wiring — next implementation round
- Previous candidate fc4834d passed native Node tests, UI regression and TypeScript in run 45803140863. The admissions-only scope gate remains separate and unresolved.
- Added canonical receipt adapter for payments written by adminReceiveParentPayment, validating INR amount, wallet credit equality, receipt month and IST date agreement, source identity and lifecycle. Legacy receipts, reversals/refunds, archival/deletions and unsupported shapes require reconciliation; do not certify full cash coverage from this subset.
- Added canonical parent-month billing_v2 adapter validating path, allocation-aware source, composition evidence, billed = settled + due and nested totals. Uses existing projection instead of scanning billingCharges. Outstanding remains unpublished until separate per-metric settlement/current-as-of semantics are implemented.
- Added website canonical cohort adapter requiring complete inquiry history, matching count/first timestamp, stable hashed identity and explicit duplicate policy. The policy is selectable for testing, not a business-rule change: one_per_ist_day or all_submissions; owner must approve reporting policy and non-website coverage. Stable cohort revisions must come from a durable operation ledger; update timestamps of individual events alone are insufficient. Limit 500 history rows and 64 normalized facts; corrections spanning more than two months require controlled rebuild. Identity rekeys/deletions need coordinated retractions and are not automatic.
- Added per-child canonical roster adapter (max 100 records) checking identity aliases, duplicate operational courses, completed/terminal exclusions and active/paused states. Trial/pending/legacy statuses and in-progress transitions fail closed; historical child-operation resolver and stock-consistent transaction remain pending.
- Exact source snapshot updateTime microsecond revisions for canonical billing and receipt; no delivery timestamp ordering and no inferred delete revision. Firestore timestamps must be independently validated.
- Added six native source adapter test cases and isolated Admin SDK transaction adapter guarded by exact demo project and loopback host. Real emulator test seeds synthetic baseline, checks concurrent replay, month correction, stale event, wrong generation and path restriction. CI includes a dedicated Firestore emulator job; latest run results pending. No production adapter is enabled, no source trigger is exported and no production credentials are used.
- Remaining: verified bounded source inventory and coverage, durable outbox/cohort revisions, legacy/negative/reversal handling, per-metric freshness, stock-consistent lifecycle publisher, staged generation handoff, repair/backfill and production approval. No overall metric completeness may be inferred from the supported source subsets.

## Owner scope simplification (2026-11-26)
This supersedes earlier expanded metric and completeness requirements. The feature is an ad hoc management trend, not a financial reconciliation or acquisition funnel. Visible metrics are total recorded enquiries (repeat submissions included), class charges billed in the service month, new admissions/course enrollments, course completions/discontinuations, student exits by reason, and current active/paused/retained counts. No cash receipt, refund, allocation, outstanding balance, first/repeat split, or lead identity deduplication is required for release. Prior offline helpers remain dormant and are not required for this reporting path.

Added pure available-record builder using existing lead documents and individual inquiry events (one count per source submission; mirrored event/lead is not a second enquiry), billingCharges with service month/date, and enrollment identity/date aliases. No operational writes or migrations. Count the first recorded enrollment of a child; a later course is not a new admission. Final dated exit requires no other retained course on that date; same-day course transition is not an exit. Older records with alternate date fields are accepted; genuinely undated or ambiguous records are excluded only where necessary and aggregate caveats shown in UI. Current counts use explicit active aliases, paused separately. These are available-history estimates, not certification of complete historical coverage. Source input completeness, deletion history and old status mappings still require review before publication. No refund processing is needed; invalidated billing charges are excluded to preserve existing billing semantics.

Prior candidate d4582353 passed native Node, frontend regression, typecheck and real Firestore emulator (run 45804836570). New available-record tests added to CI; latest results pending. The existing admissions-only file-scope gate remains unchanged. Remaining work is a bounded authorized source reader, simplified aggregate publishing/refresh, actual historical population, and rollout/read-budget checks. No production access, merge or deploy in this round.

## Bounded refresh implementation and flexible read budget
Owner clarified that 1–5 reads (or another small justified constant) are acceptable; two documents are not a hard rule. Current yearly/current projection remains useful; no page-load source scans, no tab-switch source reads. Measure actual SDK fetches, Firestore billed reads and backend refresh cost separately. Add metadata/sharding only if it improves correctness or performance.

Previous simplified candidate 58c068b passed dedicated native Node/UI/typecheck and demo Firestore CI run 45807988380. The admissions-only scope gate remains unchanged.

This round adds paginated field-masked source collection from leads, lead inquiry history, billingCharges and enrollments using an Admin SDK read-only transaction. Query limit defaults to 250 per page; caller must supply maxDocuments, with page cap and one-document lookahead to prevent silent truncation. No payment/refund collection reads. Inquiry collection-group rows outside leads are counted against budget but not included in analytics. Snapshot time must be consistent; exceeding a budget aborts before writes. Source arrays stay in memory; only aggregate results leave refresh orchestration. Multiple selected years share one source snapshot, then a bounded transaction writes yearly docs and current snapshot and a refresh control watermark. Old/replayed publication fails closed. Do not enable the older incremental flow publisher alongside this refresh path.

Operator command (not yet run against production):
```sh
node scripts/business-analytics-refresh-cli.mjs --project tinysteps-react-v1 --years 2024,2025,2026 --max-documents 10000 --approve-production-read
```
This is an example budget and reporting range, not a known actual count or earliest operating year. Run only with separate owner-approved scope and project-specific authorized ADC. Default is dry-run (aggregate output only); do not add --apply and --confirm-production-aggregate-write tinysteps-react-v1 until separate aggregate-write approval and reviewed dry-run. Demo project requires loopback. No source writes or deployment. On budget/transaction failure, retain prior projection and redesign or expand approved scope, never silently publish partial results. Query minimum charges, index entries, retry operations and query lookahead are not included in returned source document counts. Review the actual query cost and collection sizes before scheduling; repeated full snapshots are not suitable at high cadence without evidence. Consider bounded scheduled refresh with measured cadence, then incremental/partitioned refresh if cost warrants; no automatic scheduler is activated by this change.

New refresh unit cases and real isolated Firestore end-to-end refresh fixture added. Latest CI results pending. Remaining: verify current candidate native and emulator, approve and run bounded production dry-run, inspect aggregate output and existing totals, approve publication and rollout, choose refresh cadence based on actual read cost, and verify dashboard read budget. No production reads/writes, merges or deployment in this round.

## Private refresh activation and cost preflight
Previous refresh candidate b485f3e passed all three dedicated jobs (native Node, UI/typecheck, isolated Firestore emulator) in run 45809137290.

Added count-only inventory for leads, inquiries (collection group), billingCharges and enrollments. It returns counts, not document contents or identifiers. It is advisory, not a consistent snapshot; counts can change and the subsequent collector still enforces its hard cap. Count aggregations have index-entry billing and minimum query charges, not four guaranteed billed reads. An inventory query may include unrelated inquiries, conservatively counting them against budget. The actual production indexes, counts and read cost have not been checked.

**Next production operation (requires specific approval and an authorized read-only Firestore principal):**
```sh
node scripts/business-analytics-refresh-cli.mjs --project tinysteps-react-v1 --inventory-only --approve-production-read
```
The command uses Application Default Credentials. Do not reuse a broad deploy identity merely for convenience. Flags record operator intent, not a substitute for IAM authorization. Do not run with production credentials on public GitHub Actions or publish outputs in public PR comments. No document writes are permitted in inventory mode. Use resulting counts to approve a realistic document budget for the separate dry-run; never assume 10,000 documents will suffice.

Added private periodic entrypoint `node scripts/business-analytics-job.mjs`. It defaults to disabled (no connection), requires exact project, explicit mode, read approval, first reporting year and document budget, and independent write approval in apply mode. It automatically includes the current IST year. It performs count preflight and aborts before a full scan if the estimated count exceeds budget. Output includes only operational summary, not lead/student details or billed totals. Hard collection limits still apply; query failures preserve previously published documents.

Proposed runtime: private operator machine or a managed job with a dedicated least-privilege identity. Schedule only after approved historical dry-run and refresh-cost evidence. Daily is a candidate, not an activated cadence. Do not schedule this in the public repository's Actions environment or use the existing deploy secret. No runtime, account, scheduler, production source access or deployment has been created in this round.

Configuration for approved runtime (all values examples except project):
- MONTHLY_TRENDS_ENABLED=true (unset/false disables)
- MONTHLY_TRENDS_PROJECT=tinysteps-react-v1
- MONTHLY_TRENDS_MODE=dry-run or apply
- MONTHLY_TRENDS_READ_APPROVED=tinysteps-react-v1
- MONTHLY_TRENDS_WRITE_APPROVED=tinysteps-react-v1 (apply only)
- MONTHLY_TRENDS_FIRST_YEAR=<approved earliest year>
- MONTHLY_TRENDS_MAX_DOCUMENTS=<approved limit, maximum 100000>
- MONTHLY_TRENDS_PAGE_SIZE=250 and MONTHLY_TRENDS_MAX_PAGES=400 (tune together with budget)

New activation guards, count-only inventory and cost-limit checks are covered by added native and emulator tests; latest candidate CI pending. Remaining external gates: production inventory and dry-run, aggregate-write review, scheduler/runtime setup and rollout; admissions-only CI scope gate still unchanged.

## Owner-approved daily closed-day reporting
This supersedes earlier refresh-frequency suggestions. Publish one completed reporting day per IST date. Dashboard reads saved yearly/current aggregates only; Reload saved report reloads documents and never starts a backend calculation. Suggested private runtime schedule is 00:15 IST daily (15 0 * * *, Asia/Kolkata); not activated. The private job checks the last published throughDate before source inventory or collection; already published dates skip. Atomic publication prevents duplicate or older dates replacing a newer snapshot, even if concurrent jobs both collect. Runtime should have one concurrent execution; duplicate simultaneous collection is still possible before publication.

The daily job requests a read-only Firestore snapshot at 23:59:59.999 IST of the previous day (explicit readTime). This freezes the recorded enrollment status as well as leads and billing. Dated activity after the cutoff is excluded, even within the same calendar month. Month-only billed records already present at cutoff remain attributed to their recorded month. Historical date corrections recorded after cutoff can appear in the next day's snapshot. Future months remain null. The stored throughDate labels the actual reporting day and current roster; the timestamp is the source snapshot time, not job completion.

Ordinary Firestore historical reads are available for the preceding hour; do not assume PITR is enabled. Start within 50 minutes of midnight, leaving a 10-minute margin for the transaction. If cutoff unavailable, budget exceeded, or job fails, keep prior published report and expose its actual date; never silently substitute live state. See https://firebase.google.com/docs/firestore/use-pitr and https://cloud.google.com/firestore/docs/reference/rest/v1/TransactionOptions. Production publication via CLI requires --daily-cutoff; a daytime dry-run without it is diagnostic only, not a publishable frozen-day report. No change to PITR settings, production scheduler or deployed functions is made.

Previous private job/inventory candidate fc61f32 passed dedicated native/UI/typecheck/emulator CI (45809656794). Added daily cutoff, same-month exclusion, calendar rollover, same-date skip and actual historical-read emulator regression; latest candidate pending verification. The production inventory/dry-run/aggregate-write and rollout approvals remain outstanding. No production access or changes.

## Production verification checkpoint — 26 November 2026 IST

**Status: blocked before inventory.** This checkpoint supersedes pending CI statements above. Reviewed candidate `ffea4e2a91dcf1d6ce2a61db4d8043f1025d3f95`. The authenticated Firebase project list returned `tinysteps-react-v1` as active. The Firestore Admin API confirmed `(default)`, Native mode, Standard edition, Mumbai (`asia-south1`), and PITR disabled. Only project/database metadata and the caller's effective permissions were requested. The available Application Default Credentials could authenticate and had Firestore get/list, but also had create, update, delete, import, export and bulk-delete permissions. They do not meet this report's read-only operator requirement. No production aggregate count query, application document read, or write was performed. No new identity, access grant or scheduler was created.

### Inventory, conditional read budget and historical validation

Use the exact project and a named, independently approved Firestore read-only principal. Verify its effective permissions and environment before use. The existing inventory command performs four Firestore aggregation queries for leads, the inquiries collection group, billingCharges and enrollments. It returns aggregate counts without application documents or identifiers. Treat all collection-group results as budgeted reads and use the diagnostic's unrelated-inquiry count to distinguish scope. Do not supply write flags.

```sh
node scripts/business-analytics-refresh-cli.mjs --project tinysteps-react-v1 --inventory-only --approve-production-read
```

With inventory total `N`, propose `B = N + max(250, ceil(0.05 × N))` projected source documents for review. At page size 250 propose `ceil(B / 250) + 4` page calls for the four sources and their exhaustion checks. Select the lowest practical limits once counts and the source growth rate are known. This is a budget rule, not an approved budget or a Firestore billing ceiling. The collector supports at most 100,000 source documents and 1,000 pages, can return one extra lookahead document before rejecting overflow, and returns no partial report on breach. If the proposed budget does not fit, stop and review a partitioned or incremental collection design rather than truncating the scan.

Once the count and budget are reviewed, run the existing read-only command with an explicit year list covering the requested available history and the actual approved limits. In the first 50 minutes after midnight IST use `--daily-cutoff` for an exact previous-day snapshot. At other times the same command without `--daily-cutoff` is a diagnostic of available historical records at the read time, with a potentially partial current day and current-day enrollment statuses. Keep it private and label it diagnostic. PITR is disabled and there is no late fallback to current data for the frozen daily report. [Firestore read-time constraints](https://docs.cloud.google.com/firestore/native/docs/pitr)

| Metric | Source and required comparison after a successful dry-run |
|---|---|
| Leads | Compare monthly recorded inquiry events plus eligible lead fallbacks. Count separate repeat submissions and deduplicate only the mirrored lead/event representation. Report undated events and unrelated collection-group records. |
| Billed charges | Compare amount in integer paise by service month against existing billing controls, with archived/void records excluded as in the source. Inspect missing dates, invalid amounts and fallback from service date to month key. No refund or cash-collection analytics. |
| New admissions | Compare first recorded eligible enrollment per resolvable learner across the available history. Distinguish a repeat course or a reactivation and review corrected-only histories before treating a first record as a new admission. |
| New enrollments | Compare distinct eligible enrollment records by recorded start with admissions counted separately. Review status, transition and undated exclusions. |
| Student exits | Compare loss of the last retained enrollment on a dated end. Completion and discontinuation are separate from other exits. Check continuing courses, same-day transitions and histories with unknown dates. |
| Active roster | Compare distinct children with active-like enrollments and count active enrollments separately. Check paused-only and retained counts at the same source snapshot. |

All six live comparisons, source counts, exception rates and the actual reporting-year coverage remain pending. Confirm against owner-approved aggregate references without publishing customer-level records or internal totals to the PR. No historical migration is required to proceed with read-only validation.

### Daily refresh cost

One successful scheduled publication executes four count queries, approximately `N` projected source-document reads, up to four minimum charges for empty source pages, two control-document reads and `Y + 2` writes for `Y` yearly documents, the current summary and the control watermark. Query service/index entries, concurrent or retried work, compute, storage and network can affect actual billing. Count-query estimate, where each matching entry is read once, is `sum(max(1, ceil(indexEntries / 1000)))` read units across four queries. The source scan only orders by document ID and uses a cursor. Check actual index-entry charges with separate approved billing evidence. Shared free tier is not reserved for this job. Dashboard source usage is zero and the existing panel normally reads a yearly aggregate and a current snapshot. [Firestore Standard pricing](https://cloud.google.com/firestore/pricing)

Illustration at a planning rate of US$0.03–0.06 per 100,000 billed reads, before free tier and other charges. This range is a sensitivity assumption, not an independently confirmed Mumbai SKU or bill. At 10,000 source reads per day, source reads cost about US$0.003–0.006 per run or US$0.09–0.18 per 30 days. At 50,000, about US$0.015–0.030 per run or US$0.45–0.90 per 30 days. Fill in the actual count, effective Mumbai SKU and utilization once the read-only inventory is available.

### CI, deployment and release disposition

The pinned candidate passed all three dedicated analytics jobs (offline logic, UI/TypeScript and Firestore emulator) in [run 45810583032](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/45810583032). Successful tests were not repeated. The [Admissions Forward-only gate](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/45810582970) rejected `.github/workflows/monthly-business-trends-offline.yml` at its admissions-only path allowlist. Its parent admin path trigger includes this analytics change and the guard stopped before regression tests. The emulator job was skipped. This separate scope check remains open. Any path-trigger narrowing or policy change needs its own review. No gate was modified, waived or bypassed.

The unchanged deployment resolver ran with actual Git history against main and the four production artifact markers in [run 45812551505](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/45812551505). **Hosting changed and frontend validation is required.** No Functions deploy, no impacted or retired Functions, and no Firestore Rules or indexes changes. The review workflow is on a separate branch and has read-only repository permissions. It did not access production credentials or deploy anything.

**Next gated action:** supply an already authorized read-only principal or an approved read-only execution environment. Then run the four counts, set the source and page budgets from evidence, and privately reconcile the aggregate dry-run before requesting any publication or rollout approval. Keep the daily scheduler inactive and preserve the through-yesterday IST requirement. No merge or deployment authorized.
