# P01 measured verification and discovery acceptance report

**26 November 2026 IST. P01 remains in progress.** Revision 20 evidence. Runtime baseline `701c7ec832dbe9c531964496fa09cd4a4948ddd2`. Emulator benchmark checked out `459b353a82813ec9921443a9b33031b83ff2cd8c` from draft #933. [Isolated run 45796498982](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/45796498982) passed both measured fixtures and exact-history deployment-impact checks. The resolver used real history and all four marker refs and reported zero intended deployment impact. The runner is on a dedicated non-deployment branch outside #933. Prior successful D13 suites were not rerun. No production environment, application documents, provider data or credentials were accessed.

## Bounded integrity results

The fixed loopback project `demo-tsos-p01-evidence` held fixture representations of identity, enrollment, scheduling, attendance, finance and school data in isolated namespaces. The collector reserved 80 document slots and dispatched 16 projected server queries in one read-only transaction. The healthy cohort returned all 19 expected fixture documents. The deliberately damaged cohort returned 22 documents and detected all seven injected discrepancies. The unchanged identity and academic reducers consumed projected fixture records. Scheduling, attendance, finance and school checks in this harness are narrow fixture invariants. They do not invoke the production writer, provider or notification paths.

| Domain | Healthy discrepancies | Detected injected discrepancies | Scenario |
|---|---:|---:|---|
| Identity | 0 | 1 | UID disagrees with the identity document |
| Enrollment | 0 | 1 | Enrollment references a missing course |
| Scheduling | 0 | 1 | Duplicate learner/date/start occurrence |
| Attendance | 0 | 1 | Official attendance points to an absent occurrence |
| Finance | 0 | 2 | Duplicate service charge and wallet event-to-balance mismatch |
| School | 0 | 1 | Section points across school scope |

Scope is representative of D10 I01–I07 boundaries. It does not establish comprehensive D10 coverage, particularly concurrent source writes, AVS evidence/official separation under provider faults, payment/payout behavior, Auth lifecycle or I08–I13. Those remain separate requirements or rely on the existing specifically mapped evidence.

## Measured performance and freshness

30 sequential attempts for each mode. Cold means a new Firestore SDK client per attempt, including its first connection on an already running emulator. Warm reuses one client after a priming read. Timing includes the bounded transaction and invariant reduction and excludes setup, client disposal and the warm priming read. p50 and p95 use nearest rank among successful samples. Counts below are application-observed SDK query dispatches and documents, excluding transaction housekeeping. Production request overhead, process cold start, physical attempts, billed reads and load behavior remain unmeasured.

| Mode | Success / attempts | p50 | p95 | SDK query dispatches | Documents returned | Error rate |
|---|---:|---:|---:|---:|---:|---:|
| Cold client | 30 / 30 | 65.775 ms | 82.047 ms | 480 | 570 | 0% |
| Warm client | 30 / 30 | 52.109 ms | 66.714 ms | 480 | 570 | 0% |

Projection freshness was measured over 20 revisions from acknowledged source update to verification of the corresponding rebuilt fixture projection. The fixture saw and rejected all 20 stale revisions. p50 **10.589 ms**, p95 **14.467 ms**, 60 reads and 41 writes including setup. The harness drives the rebuild explicitly. Production trigger delay, queue lag and cache visibility remain unmeasured.

For subsequent comparable measurements, keep the candidate, emulator version, fixture shape, run ordering and concurrency fixed. Collect at least the original sample count and keep timeout/error denominators even when the batch is rejected. Track 16 SDK reads and 19 document results per healthy fixture verification as the count baseline. Investigate any operation count drift, missed stale revision or nonzero fixture error. Compare p95 over repeat runs before setting a production SLO. Reliability and Finance owners must approve any production aggregate-metrics window and ceilings separately.

## Synthetic recovery and proposed domain requirements

A bounded read captured a checksummed JSON checkpoint. A corrupted copy was rejected. The recovery drill wrote a separate empty namespace, matched all 19 restored records against the checkpoint, reverified all invariants and rebuilt the fixture attendance projection. Simulated outage lag was **60 seconds**. Actual elapsed recovery and verification was **84.521 ms** in the emulator. Per-domain durations below measure the restoration write commit only. The proposed RPO/RTO targets are owner decision inputs. The exercise does not test production PITR, full Firestore backup restore, real Auth, Storage, retention or failure of external providers.

| Domain and owner role | Fixture docs / write commit | Proposed maximum RPO / RTO | Recovery validation before reopening |
|---|---:|---|---|
| Identity (Eng. and Security) | 5 / 4.606 ms | 15 min / 1 h | Restore Auth linkage, role/scope and canonical principal evidence. Quarantine mismatches before reopening access. |
| Enrollment (Academic Ops) | 3 / 4.032 ms | 1 h / 4 h | Reconcile guardian/course/teacher links, active keys and capacity. Replay approved enrollment changes without duplicates. |
| Scheduling (Online Ops) | 1 / 4.119 ms | 15 min / 1 h | Restore recurring patterns, exceptions and unique dated occurrences. Verify upcoming dates, time zones and provider links separately. |
| Attendance (Teaching Ops) | 1 / 1.939 ms | 15 min / 1 h | Restore official attendance and correction evidence first. Rebuild views, compare with provider records where approved, and quarantine unresolved finance effects. |
| Finance (Finance Owner) | 4 / 2.702 ms | 15 min / 4 h | Reconcile charges, wallet events, balances and settlements against authoritative journals. No silent loss or duplicate posting. Hold collection/payout action until reconciled. |
| School (School Ops) | 5 / 2.828 ms | 15 min / 1 h | Restore year/grade/section/role isolation. Maintain a locally available attendance and authorized pickup continuity procedure while service is down. |

P01.2 must establish what can actually be recovered and restored. A future approved isolated infrastructure drill must record backup source/digest, actual loss window, latest recovered event, consistency checks and elapsed time to usable service. Identify a recovery owner for Auth/config and for each Storage/recordings/provider surface. Verify dependencies, confidential object access and retention separately. Restore finance and safeguarding workflows only after their domain owners sign reconciled results.

## Ten unresolved record paths reviewed

The last source review inspected the pinned audit collector, Rules/indexes, application and Functions source plus available Git lineage. Catalogue remains 175 structural paths, 165 scoped and 10 unresolved. A planned inventory probe does not establish an operational writer or deployed collection. An explicit Rule establishes a source region to review, not actual usage.

| Path | Evidence and disposition | Responsible role |
|---|---|---|
| `ai-error-logs/{logId}` | Rules surface. Historical beta analytics reader existed before `c4a6aed15`; active producer and retention unverified. | Security and platform engineering |
| `ai-usage-logs/{logId}` | Rules surface. Source allows signed-in creation and Admin reads. Active producer/schema unverified. Avoid treating these counters as trusted. | Security and observability |
| `config/payments` | Rules surface. Current consumer/writer unverified. Current finance configuration includes a separately catalogued `config/finance` path. Keep the distinction. | Finance engineering |
| `programmes/{docId}` | Planned root inventory probe. Existing course catalogue and school programme evidence remain the observed operational surfaces. | Academic architecture |
| `curriculumVersions/{docId}` | Planned root inventory probe. Current curriculum is represented by course/curriculum configuration and school progress source. | Curriculum owner |
| `deliveryOfferings/{docId}` | Planned root inventory probe. Operational delivery settings already appear on course and enrollment records. | Academic Ops |
| `learningGroups/{docId}` | Planned root inventory probe. School sections are an observed cohort surface. | Academic and School Ops |
| `groupPlacements/{docId}` | Planned root inventory probe. Placement-related relationships already exist in enrollment and school source. | Academic Ops |
| `teachingAssignments/{docId}` | Planned root inventory probe. Teacher links already exist in enrollment, reassignment history and school section source. | Teaching Ops |
| `schedulePlans/{docId}` | Planned root inventory probe. Rolling enrollment schedules are observed operational inputs. | Scheduling Ops |

The seven planned paths appear as explicit read probes in `scripts/audit-academic-enrollment.mjs:667–673`. The collector for that historical audit is not approved for production execution. No additional operational root caller was established. Preserve all ten as unresolved for any live existence, producer/reader ownership, adoption or retirement decision.

## P01 acceptance decision

| Gate | Verified evidence | Residual risk / required decision | Accountable role |
|---|---|---|---|
| P01.1 / P01.4 inventory and dependencies | Pinned source roots, scoped catalogue and review of the ten remaining paths | Dynamic aliases, historical/native/external usage and live metadata remain open. Sign the exception dispositions. | Engineering, with Surya proposed as coordinator |
| P01.2 metadata | Exact request and permission matrix, command template and retention boundary | Approve named operator, allowlist, limited IAM, quota, window and evidence retention. Then verify metadata and actual recovery inventory. | Infrastructure Owner and Security Reviewer |
| P01.3 / P01.5 application integrity | 19 expected healthy documents and seven detected injected discrepancies | Approve bounded cohort and vetted enforcement, then record actual coverage and residual exceptions. | Identity, academic, attendance and Finance domain owners |
| P01.6 authorization | D13 isolated Rules evidence remains valid. Separate M3 actor handoff is prepared. | Private actor, target and expectation approval. Independently approve optional service sampler and metrics. | Identity Owner and Security Reviewer |
| P01.7 performance and recovery | Isolated benchmark and logical restore measured | Ratify workload targets, approve permitted metrics and run an isolated infrastructure recovery exercise under separate scope. | Reliability and Finance Owners, with School Ops for continuity |
| P01.8 migration status | Existing migration ledger holds retained | Independent reconciliation before any change to status, migration or retirement authority. | Engineering and respective domain owners |
| P01.9 discovery acceptance | Evidence consolidated for review | Owners must sign exception dispositions, approve measurements and confirm unresolved gates. Independent reviewer has not signed. P02 requires separate authorization. | Executive Owner and independent engineering reviewer |

Approval packets remain separate and unsigned. [Metadata-only procedure](P01_METADATA_ONLY_APPROVAL_PACKET_2026-11-26.md) · [Bounded application data](P01_BOUNDED_APPLICATION_DATA_APPROVAL_PACKET_2026-11-26.md) · [M3 live authorization](P01_M3_LIVE_AUTHORIZATION_HANDOFF_2026-11-26.md).
