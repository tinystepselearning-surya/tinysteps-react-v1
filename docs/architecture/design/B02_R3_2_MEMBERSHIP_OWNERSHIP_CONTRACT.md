# B02-R3.2 — membership and ownership implementation contract

**State: design-only candidate, owner directs next implementation; dependent executable work held.** R3.1 PR #957 head 3bb347ce68aa2f13017e5732c95c7c6ac27c9b3e was open with no recorded independent reviews when inspected; tested code 1fef83d28cae8df483c855391cf55bc3ca236a51 passed 31/31 and strict TypeScript locally. R62 remains accepted. This packet is based on R62, not on a merged R3.1. It neither amends the sequencing gate nor approves runtime or live access. The owner requests R3.2 development; independent scoped acceptance of R3.1 is still required under the existing programme.

## 1. Exact source and registry contracts

| Evidence | Git blob |
|---|---|
| functions/src/schoolOS/identity/contracts.ts | be340ac4cb6be06effa1d09e1510a1e75f08c70a |
| functions/src/schoolOS/identity/idStrategy.ts | 02037d2dd897cd06f5dc67e32d20b70824ea1527 |
| functions/src/schoolOS/identity/authAccessReadModel.ts | 461dbab181c6d77b21fc75f5871ce6244dc840ab |
| registry/domains/identity-institutional.json (under docs/architecture) | f4f0efc8e54b749148f5b54e1b1d37ee807e5ee1 |
| Pending R3.1 scripts/architecture/institutional-context-contracts.ts | 1c13e2b1cfa74fe010eb3f7081e9e87d1414336b |

| Record | Fields and types (existing dictionary identifiers, not new allocations) |
|---|---|
| TMB | TMB-1001 tenantMembershipId: id; 1002 tenantId: reference TEN; 1003 personId: reference PER; 1004 status: active/inactive; 1005 effectiveStartAt and 1006 effectiveEndAt: optional nullable timestamp |
| MEM | MEM-1001 organisationMembershipId: id; 1002 organisationId: reference ORG; 1003 personId: reference PER; 1004 role: schoolAdmin/teacher/learningPartner/member; 1005 status: active/inactive; 1006 isPrimary: boolean; 1007 effectiveStartAt and 1008 effectiveEndAt: optional nullable timestamp |

MEM type-only reuse of v1 OrganisationMembershipRecord core fields is preferred; tenant scope derives from verified ORG-1007, not an extra duplicated tenant field in MEM. TMB eligibility is separate from MEM relationship and ROL permission. Person identity, learner, guardian, household, payer, teaching assignment and enrollment remain separate. No membership creates a person or grants access. Membership role is a relationship classification, not a new capability grant.

Current v1 buildOrganisationMembershipId hashes organisationId/personId/role, not an episode. Current v1 access projection selects active schoolAdmin membership intersected with an active organisation-scoped role; it ignores effective dates and queries all person memberships up to 51 results before rejecting overflow. Do not write future-dated or terminated-but-active new rows to this legacy lane. No rekeying or inserting multiple historic episodes into legacy membership collection. No assumptions about existing live membership dates, completeness or duplicate count.

## 2. Proposed isolated implementation contract

A new pure TypeScript module in scripts/architecture, outside Functions runtime, with type-only v1 references, imports the accepted R3.1 candidate helpers only after its acceptance. Parse exact ordinary data DTO shapes; reject unknown fields, inherited fields, accessors, symbols, invalid IDs and key mismatch; no implicit string trimming or legacy defaults. Freeze returned DTOs; no network/storage/SDK runtime. Reuse existing registry field names, no new dictionary fields. Validation distinguishes structure from temporal relationship status, and neither is an authorization decision.

Timestamp candidate for synthetic DTOs: integer UTC epoch milliseconds within Firestore timestamp date bounds, without Date objects, numeric strings, client timezone conversion, rounding or guessing. Source timestamp fields remain unchanged; future adapter must preserve nanosecond precision or explicitly hold nonrepresentable timestamps. Absent and explicit null are distinct preserved historical observations. Neither absent nor null start establishes eligibility; known start is required for a positive temporal result. For prospective active records, explicit null end means open-ended only when authorized capture proves that meaning; missing end is unknown, not open-ended. For legacy data, even explicit null must not be assumed to prove open-ended eligibility without provenance. Synthetic fixtures explicitly stipulate interpretation; future persisted contract must bind provenance. If both known endpoints exist require end > start. Half-open [start,end); no positive result at end instant. Explicit evaluation instant; no implicit Date.now. Inactive status cannot be eligible even within interval. No claim of historical as-of eligibility from a current status alone; historical episodes require actual history.

Inputs for a fixture relationship check: exact tenant and organisation key/records, minimal verified person key/status fixture, exact TMB, exact MEM where organisation context required, and evaluation instant. Optional campus is checked via R3.1 only if applicable; membership does not confer campus-specific entitlement. Confirm TMB person matches Person, tenant matches TEN, MEM person matches same Person and organisation matches ORG, ORG belongs to TEN. Status gates for prospective temporal result: Person active, Tenant active, TMB active and current interval, and for organisation-specific relation ORG active, MEM active and current interval. Paused/archived institution, unknown/expired interval, cross-owner, suspended person and inactive membership cannot be positive. Return explicit structurally valid/invalid and temporal relation current/not-current/unknown separately; fixed reason code, authorizationEvaluated:false. No policy resolver, role grant, authenticated principal claim or resource entitlement. Different roles on same person/org allowed as independent classifications; isPrimary not an access decision and no blanket primary exclusivity rule assumed.

## 3. Stable relationship identity and history

Candidate logical keys: TMB=(tenantId,personId); MEM=(organisationId,personId,membershipRole). Organisation tenant must be independently verified; don't invent or duplicate owner. One current relationship per logical key, with separate effective episodes/history concept for rejoin. Keep existing v1 MEM IDs where verified. New key candidate: domain/version-separated SHA-256 of canonical UTF-8 JSON array of strictly validated ASCII ID/role strings; full 64 lowercase hex, explicit tmb2_/mem2_ namespace only for new approved facts. Hash inputs bounded and exact, no normalization; compare stored tuple on any collision, stop on mismatch. This is a prospective key proposal, not allocation or migration. A legacy alias must not become a second independently writable membership; unresolved mapping held. Separate history physical path/registry code remains open. Never erase a prior effective interval to reactivate a relation without reviewed historical retention.

A fixture duplicate detector should take a bounded supplied candidate set (proposed 100 rows, no DB scan), validate each, reject duplicate record IDs and duplicate logical current relationship keys; distinct roles or verified distinct institutions allowed. Detect only duplicates within the explicitly supplied set; no global uniqueness certification. Historical overlap detection is deferred until episode contract approved. Actual future atomic uniqueness uses exact deterministic key plus expected revision, and reads/writes authority and audit/history in a transaction. Concurrent creation must converge or conflict, not make two rows. Same operation ID and same normalized payload only after current authorization may return prior result; changed payload conflicts. No command writer implemented in this increment.

## 4. Required product acceptance fixtures

| Case | Expected |
|---|---|
| One person with online and preschool MEM in same TEN | Distinct valid relationships; no new Person |
| Same person with approved TMB in two tenants | Distinct explicit eligibility only; no cross-tenant visibility |
| Online membership with no campus | Valid shape |
| Exact owned physical campus | Valid ownership shape, no entitlement |
| Same person/org different membership roles | Distinct logical keys; no role-derived permission |
| TMB missing, wrong person or wrong tenant | Not current/invalid as applicable, never access |
| MEM missing for organisation-specific evaluation | Not current/unknown, never access |
| MEM points to another org or person | Ownership mismatch |
| ORG parent mismatch | Reject |
| Campus from other org in same tenant | Reject via R3.1 |
| Suspended Person or Tenant, inactive TMB/MEM, paused/archived ORG | No positive temporal relation |
| Before start, exactly start, one ms before end, exactly end | Not current, current, current, not current respectively for otherwise valid fixture |
| Equal/reversed endpoints, malformed/unsafe timestamp, invalid evaluation instant | Reject |
| Missing/null start or unknown end | Unknown, never positive |
| Explicit synthetic open end with known start | Current only if other conditions satisfied |
| Distinguish missing and null; invalid fields/accessors/key mismatch | Exact shape and privacy-safe failure |
| Same logical key under another ID, duplicate ID, input overflow | Reject bounded duplicate assessment |
| Deterministic tuple encoding and disjoint domains | Stable key; distinguish tuple component/role changes |
| Existing v1 key/parser/projection sources and R3.1 blobs | Unchanged; all existing 31 focused cases continue passing |
| Registry item IDs, field names, optionality, enum sets | Exact pin; no registry adoption |

## 5. Integration and operational budget

Do not introduce new UI, collection, write trigger, IAM, Rules, role enum, cache, index or migration. Future resolver uses exact TMB and selected MEM point lookups, alongside already-resolved Person/TEN/ORG; reuse trusted context once per operation, no membership scan to render every learner. Actual current authority/freshness, policy and domain relationship checked separately. No inferred rights from T-1 reporting. Premium one-to-one requires neither campus nor group records. Partner school principal remains current reader; LP scope unchanged. Membership validation is not authorization. Preserve existing direct parent/teacher workflows, historical finance and attendance behavior.

Acceptance sequence: independent reviewer records scoped R3.1 approval and applicable sequencing decision; then implement R3.2 only in isolated branch with focused strict TypeScript and combined R3.1/R3.2 synthetic tests. No generic repeat of 570 tests if old executable pins unchanged. Consider grouped R3.3/R3.4 validation after their separate design approval; do not call a future role resolver production-ready. If owner wishes to begin dependent prototype coding before R3.1 independent acceptance, explicit reviewed development-only sequencing amendment is required; both still independently reviewed before integration and all live gates held. No such amendment inferred from general continue direction.

No tests executed, no code written, no accepted revision change in this design increment. Independent reviewer absent at preparation; no reviewer identity invented. Next action is scoped R3.1 review (or formally reviewed sequencing amendment), not more IAM checks.

## 6. Owner decisions and standalone review prototype

Owner explicitly approves the five product and sequencing recommendations: institutional shared core, single person/multiple memberships, separate roles/permissions, existing database and business continuity with real-time operations/T-1 reports, grouped isolated R3.2–R3.4 development. Record this as owner product approval, NOT independent technical acceptance. Independent review of PR #957 remains absent. To make progress without depending on its unmerged code, prepare a standalone review-only synthetic membership prototype on the R62-based draft PR #958. This exploratory code does not import R3.1, change its acceptance status, or implement the dependent ownership join/resolver; no formal R3.2 adoption or sequencing gate waiver. Independent review of the development sequence and both candidates remains required before integration.

- Prototype `scripts/architecture/membership-contract-review-prototype.ts`, blob f98d9b2f68961388e4242cae7258b956465713cc: exact TMB/MEM DTO shape, v1 MEM type-only reuse, optional/null timestamp preservation, half-open interval observation (synthetic open end explicit), versioned prospective hash keys, bounded 100-row same-kind supplied-set duplicate check. Returns authorizationEvaluated:false for observations; no person/tenant/organisation source lookup, current authority, permission, historical replay, or persistence. Duplicate checking includes inactive records in the supplied current-record set; historical episodes not supported. No global uniqueness or concurrency claim.
- Focused cases `scripts/architecture/membership-contract-review-prototype.node-test.mjs`, blob a29324e693676f05148e6fbbd2ff675f3769d380: 26 tests authored, not yet executed. Exact registry and three legacy source pins included. No runtime imports except node:crypto, no SDK, network or application data. No new record allocation. Prototype repeats minimal prospective DTO validation independently rather than changing R3.1; consolidate only after reviewed integration.

Pinned verification after review of scope (or alongside the later combined milestone): Node 22.22.1, Functions locked TypeScript 5.9.3, clean exact candidate, same tsc arguments as R3.1 with the new TS path, then node --experimental-strip-types --unhandled-rejections=strict --test scripts/architecture/membership-contract-review-prototype.node-test.mjs. Expected 26 passing tests, not a result. No additional infrastructure check required. Existing accepted R62 and 570 tests, R3.1 owner-local 31/31 unchanged. No production or baseline merge. R3.3/R3.4 formal development and R3.2 ownership joins remain pending acceptance/explicit reviewed sequencing.

## Consolidated owner Mac verification — 27 November 2026 IST

Supersedes earlier pending-test statements for this standalone candidate only. Exact tested commit a405cd761697342b737b8831b067046cad49dda2: strict noEmit TypeScript validation PASS, 26/26 tests PASS, zero failures, cancellations, skips or todos; Node test duration 72.841709 ms. The supplied set-e command checks clean detached checkout, exact SHA, Node 22.22.1, Functions TypeScript 5.9.3 and lock blob 9acb6ce6fd6881f3606853ca534939ff79649fe4. Owner transcript ends ALL FOUR COMPONENT CHECKS COMPLETED; 31 + 26 + 26 + 42 = 125/125 across separate commits. R3.1 repeat is not another 31 unique tests. No integrated execution, CI rerun, live authorization or production read/write verified. npm installation succeeded (794 packages); inherited git dependency integrity-check and deprecation warnings remain separate maintenance findings, not audited or remediated here. Detached-HEAD warnings expected. R62 and previous 570-test acceptance unchanged. Independent scoped review of the four candidates and reviewed compatibility-lane decision remain required; no merge, production schema adoption, or gate waiver.
