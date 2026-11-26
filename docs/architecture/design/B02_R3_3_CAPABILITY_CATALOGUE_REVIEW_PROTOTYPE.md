# B02-R3.3 — standalone role and capability catalogue review prototype

**Status: exploratory implementation for independent review; not adopted authorization policy.** Owner explicitly directs the next standalone prototype after approving the five product/architecture recommendations. R62 remains the accepted baseline (970fd0ac1ad8167c73ced75fa22f80e78b1de8b8). PR #957 (R3.1, 31/31 owner Mac tests) still had no independent review; PR #958 (R3.2 standalone, 26 cases authored) remains draft. This new branch starts from R62 and imports neither unmerged candidate. Dependent R3.2–R3.4 integration, production schema adoption and live gates remain held. No sequencing waiver or independent approval inferred.

## Product and source basis

The D01/D02/M01 and proposed R3.1 action matrix require one logical role authority per permission, no blanket institutional access, separate membership and capability checks, no mandatory campus/group for premium 1:1, current revocation independent of T-1 reporting, and preserved existing B2B behavior. Existing v1 source at R62: contracts.ts be340ac4cb6be06effa1d09e1510a1e75f08c70a; idStrategy.ts 02037d2dd897cd06f5dc67e32d20b70824ea1527; authAccessReadModel.ts 461dbab181c6d77b21fc75f5871ce6244dc840ab; authAccessAuthorization.ts 812429177c5dd9c7fcad6616e4a7d05bac20aeb5 (under functions/src/schoolOS/identity); helpers/schoolAuthorization.ts 0f2fa04cd1b5ed70c9ae9581d3eb7215cdcbfd6b. Registry identity-institutional shard f4f0efc8e54b749148f5b54e1b1d37ee807e5ee1. New policy labels and version are draft synthetic identifiers, not allocated registry IDs, current roles or persisted schema versions.

The v1 loader reads all person role rows, rejects unknown role/scope vocabulary, and does not enforce successor date/revision restrictions. Do not insert any candidate role or tenant/campus scope into existing v1 roleAssignments, even with extra fields. Do not introduce a competing writable CTX authority. Actual physical compatibility lane and handoff require a separately reviewed ADR and full affected reader/writer inventory; no partition implementation in this prototype.

## Candidate version 1 — explicit action/scope pairs

| Template | Proposed action(s) | Exact scope | Additional relationship condition |
|---|---|---|---|
| institutionCreator | institution.create | tenant | Approved institution operator |
| campusCreator | campus.create | organisation | Approved campus operator |
| ownedSchoolRosterOperator | institution.manageRoster | organisation or campus (two distinct entries) | Active placement |
| schoolAttendanceOperator | attendance.markSchoolDaily | campus | Assigned school register |
| onlineInstructor | attendance.markOnlineSession; learner.readTeachingView | organisation | Assigned online session / active teaching assignment respectively |
| campusInstructor | learner.readTeachingView | campus | Active teaching assignment |
| guardianViewer | learner.readGuardianView | organisation | Verified guardian, purpose and restrictions |
| financeViewer | finance.readApprovedView | organisation | Approved finance scope |
| financePoster | finance.post | organisation | Approved command and authoritative ledger |
| partnerSchoolViewer | partner.readSchool | organisation | Verified partner reader |
| partnerSchoolOperator | partner.readSchool; partner.manageAssignedSchool | organisation | Verified reader / assigned partner school respectively |
| scopedSupportOperator | platform.supportScoped | tenant | Approved time-bound support case |

12 proposed role templates, 15 explicit role/action/scope entries, 12 action names. These are least-privilege review candidates, not a final owner-approved per-role matrix. Existing admin/founder/teacher/parent/kid/learningPartner/schoolAdmin semantics remain unchanged. No automatic mapping from old labels; no wildcard, role hierarchy, grant inheritance or implicit read permission from finance posting. Principal/support broader privileges, campus-specific finance or cross-organisation guardian arrangements need explicit subsequent review; missing pairs do not remove any existing right. No generic cross-tenant support. An operator may receive multiple separately approved grants later; combination semantics not implemented here.

## Implementation and verification

- scripts/architecture/capability-catalogue-review-prototype.ts (blob f030bd77b2aa5ea76f6ba1bc0fb05f856dda452a) uses a frozen closed catalogue and type-only legacy role/scope references, exact four-field data input, exact policy version, role/action/scope matching, fixed error codes. Returns candidate-policy-match or no-policy-match, always authorizationEvaluated:false; match carries requirement metadata and flags requiring current authority, exact resource scope, domain relationship and field policy. Does not evaluate any of those, accept grants or return allow. No SDK, network, clock, database, claims, current person/tenant/organisation/campus status, expiry, revocation or resource data. Ordinary DTO input only, not hostile JS process isolation.
- scripts/architecture/capability-catalogue-review-prototype.node-test.mjs (blob b934bf33707726683a977f1e31cfb8944f19bb94) has 26 authored cases, including separation of duties, exact scope, legacy role rejection, unsupported versions, injection attempts, immutable catalogue, exhaustive cross-product matrix over candidate roles/actions and six scope strings, registry and five source pins. Authored cases not executed in pinned environment; no new test pass claim. Cross-product checks are inside one test case, not hundreds of independent tests.
- Future consolidated validation: exact clean candidate, Node 22.22.1 and Functions locked TS 5.9.3, same strict noEmit flags as R3.1, new TS path and node --experimental-strip-types --unhandled-rejections=strict --test with the new test path. Combine with R3.1/R3.2 only after reviewed sequencing and exact combined branch created. No new dependencies or cloud credentials needed. Accepted 570 unchanged; R3.1 31 owner-local passed; R3.2 26 and R3.3 26 authored pending execution.

Next: independently review explicit role/capability pairs, complete R3.1 scoped acceptance and review the standalone candidates; decide reviewed compatibility lane before implementing dependent ownership joins or contextual resolver. R3.4 must verify trusted current identity/authority, exact scope/owner and grant/relationship/effective interval, field/purpose restrictions, revocation fencing and safe transaction recheck; never trust caller-provided booleans or catalogue match as a grant. All existing production, P01/P02/P03/M3 and security acceptance gates remain unchanged. No main merge, production access, deployment, new record/role allocation or runtime wiring.

## Consolidated owner Mac verification — 27 November 2026 IST

Supersedes earlier pending-test statements for this standalone candidate only. Exact tested commit 7024f18a5b335e62575478aa09e2e28ff6d7ac9b: strict noEmit TypeScript validation PASS, 26/26 tests PASS, zero failures, cancellations, skips or todos; Node test duration 78.050292 ms. The supplied set-e command checks clean detached checkout, exact SHA, Node 22.22.1, Functions TypeScript 5.9.3 and lock blob 9acb6ce6fd6881f3606853ca534939ff79649fe4. Owner transcript ends ALL FOUR COMPONENT CHECKS COMPLETED; 31 + 26 + 26 + 42 = 125/125 across separate commits. R3.1 repeat is not another 31 unique tests. No integrated execution, CI rerun, live authorization or production read/write verified. npm installation succeeded (794 packages); inherited git dependency integrity-check and deprecation warnings remain separate maintenance findings, not audited or remediated here. Detached-HEAD warnings expected. R62 and previous 570-test acceptance unchanged. Independent scoped review of the four candidates and reviewed compatibility-lane decision remain required; no merge, production schema adoption, or gate waiver.
