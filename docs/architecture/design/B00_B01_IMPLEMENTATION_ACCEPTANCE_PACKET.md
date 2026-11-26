# B00 — first implementation acceptance packet (revision 33)

**Status:** Owner review feedback recorded; partial owner decisions below. Independent review and explicit B01-A authorization remain open. No production access or implementation approval inferred. 26 November 2026 IST.

## Decision requested

Approve a prospective, narrowly scoped sequencing amendment permitting **only an isolated P03 engineering-tooling increment (B01-A)** after independent review of this packet and named owner approval. Do not treat P01 as passed. Existing v1 and programme gates remain controlling unless this amendment is explicitly adopted. Alternatively retain original P01 -> P02 -> P03 sequence. General support for the roadmap is not the required signature.

Sources: [programme](../SCHOOL_OS_ENTERPRISE_IMPLEMENTATION_PROGRAMME_V2.md), [M04](M04_INTEGRATED_ARCHITECTURE_VALIDATION_AND_BUILD_PLAN.md), [registry v0.6](../registry/TSOS_V2_MASTER_RECORD_ITEM_REGISTRY_DRAFT.json), [discovery acceptance](../discovery/P01_DISCOVERY_ACCEPTANCE_HANDOFF_2026-11-26.md), [measured verification](../discovery/P01_MEASURED_VERIFICATION_AND_ACCEPTANCE_2026-11-26.md). Existing approval packets for metadata, bounded data and M3 canaries remain separate.

## Residual evidence disposition proposed for review

| Evidence | B01-A | Required before |
|---|---|---|
| Exact registry baseline and affected repository/toolchain lineage | Required now | B01-A code |
| Independent reviewer and named owner; explicit sequencing amendment | Required now | B01-A code |
| Cloud metadata, deployment parity, IAM/Rules, backup/PITR | Proposed defer only for isolated tooling; not accepted | affected live operations or release under existing P01/P04 gates |
| Actual record coverage, references, duplicates and historical type mappings | No live data in B01-A; unresolved fields marked hold | affected schema adoption and migration |
| M3 role canaries, tenant authorization and revocation | No auth/runtime behavior in B01-A | affected access implementation and cutover; original M3 holds |
| Actual read/cost/latency and recovery evidence | Zero cloud calls by design; no production certification | affected release/migration |
| Financial, provider, consent and school workflow decisions | Excluded from B01-A | affected domain adoption |
| Independent review of actual code and regression results | Required after code, before merge or dependent work | B01-A exit |

Deferral is conditional, not an approval or a relaxation of the existing production gates. Unresolved discovery evidence retains its original disposition. No additional Terminal/cloud request just to review this packet.

## B01-A engineering acceptance contract

Input: exact manifest v0.6, five shard files and immutable previous registry snapshot, all synthetic metadata. Proposed paths under scripts/architecture or existing architecture tooling convention, selected after checking current source. Node built-in APIs preferred, no new dependencies unless separately approved. No production credentials, network calls, Firebase SDK, app imports, configuration distribution, cloud collection, Rules, indexes, triggers, deploy workflow change or runtime wiring. No allocation of proposed identifiers or promotion of unresolved fields. B01-A is not the whole P03 phase.

Deliver a read-only registry loader and structural validator with deterministic diagnostics and exit status. Load only manifest-listed relative shard paths under registry root; reject traversal, duplicate paths, malformed JSON, version/count/owner mismatches, missing files, unexpected code membership, invalid manifest Git blob hash (compute Git blob SHA-1 from exact UTF-8 bytes for current SHA format), duplicate record and item identifiers, duplicate semantic names per record, unknown refs/value sets/shared field sets, enum/type mismatch, invalid cardinality/nullability metadata, and unreviewed changes/removals relative to explicitly supplied previous snapshot. Distinguish draft structural validity from executable readiness: unknown legacy/structured fields remain holds, not executable types. Do not claim historical field types validated. Keep previous 879 items and 43 source-interface definitions stable; new IDs remain proposed.

Tests: positive fixture from repository manifest; isolated synthetic negative fixtures for each validator rule including cross-shard duplicate, missing/corrupted shard, wrong owner, broken polymorphic reference, missing enum and inappropriate adoption. Test deterministic diagnostics, failure status, no mutation of fixtures. Run with pinned toolchain (current root package.json requires Node 22.22.1) and record exact command/result. Do not claim CI if not run. Integration into CI/configuration schema is later B01 work and requires review of actual workflow impacts. No need to run production/emulator tests merely for pure file validation. Existing main push deployment workflow can deploy depending on marker lineage and impact; no merge, manual deploy or CI modification authorized here. Inspect exact candidate impact before later merge.

## Owner review — revision 33

Owner reviewed the architecture overview and emphasized that premium one-to-one classes are the core existing business. M01 already models oneToOne separately from smallGroup and schoolProgramme, and M02 distinguishes participant grain. The following is a binding owner design priority for further review, not executable schema adoption:
- One-to-one is a first-class direct delivery path: learner -> enrollment in a oneToOne offering -> teaching assignment and schedule plan targeting enrollment -> actual session -> exactly one learner participant -> official individual attendance, learning evidence and applicable charge/earning. No artificial learning group or group-placement record is required; no additional compulsory Firestore reads merely to support group abstractions.
- Small-group path uses explicit learning group and effective group placement, group-level assignment/schedule, actual occurrence with verified participant roster and individual attendance/progress. Existing group-capacity and financial rules preserved until separately reviewed. Actual legacy occurrence/charge grain must be reconciled; no implicit merge/split. Both modes must support teacher reassignment, multiple courses, historical terms, timezone correctness and parent/teacher access. In-person school structures use their own appropriate context.
- Design and test 1:1 first in affected B03/B04/B05 compatibility slices; then group and school workflows. Priority does not exclude group classes or require a change to current live delivery.
- Existing business rules are the compatibility baseline, not immutable future policy. For V2, design advanced rules by domain, compare current behavior against proposed behavior, document rationale, exceptions, effective date, affected existing/new enrollments, impact, migration and tests. Separate owner approval before any policy change, no silent retroactive changes to attendance, agreed rates, billing/earnings, settlement, access or history. New rules initially prospective unless specific reviewed historical treatment is authorized. Maintain one authoritative writer per fact.

| Checklist decision | Owner feedback |
|---|---|
| Same Firestore database with modular collections | Previously supported direction; not explicitly selected in latest owner checklist response; confirm formal approval |
| Centralized master record/item dictionary | Previously supported direction; not explicitly selected in latest owner checklist response; confirm formal approval |
| Independent business records and relationships | Confirmed |
| Progressive development and lift-and-shift | Confirmed |
| Preservation of business rules | Confirmed with clarification: preserve current operations, intentionally design improved V2 rules for review |
| Multi-organisation and future multi-tenant architecture | Confirmed |
| Security, performance and reliability standards | Confirmed |
| B01-A isolated tooling and tests | Earlier general direction to proceed; not explicitly selected in latest owner checklist response; confirm scoped authorization |

Do not interpret the five confirmed decisions as approval of the three unconfirmed items or independent engineering sign-off. The existing phase sequence and production gates remain in force.

## Approval record (open)

- Leadership accountable owner: designation and explicit decision pending.
- Independent engineering reviewer: designation, scope review, decision and signature pending.
- Exact approved branch/commit, files, expiry/review point: pending; verify fresh head before code.
- Accepted exceptions: none adopted yet.
- P01/P02/P03 gate amendment: proposed only.

B00 is not closed until independent review and explicit approval or original acceptance sequence completes. If amendment approved, perform only B01-A, then return for review of implementation and test evidence. All other B groups remain gated. No application code or cloud state changed by this document.
