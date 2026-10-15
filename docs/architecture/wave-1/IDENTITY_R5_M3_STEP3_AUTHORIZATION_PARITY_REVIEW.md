# R5 Milestone 3 — Step 3 authorization parity: six-role independent review

**Date:** 2026-10-15 (IST)
**Starting baseline:** `main` at `7129cdeb6c8b8c30ab1f610931e51bc0537b0b04` (Step 2 PR #724).
**Mode:** Source / synthetic Firebase emulator verification only. Not a production access certificate.
**Status:** IN VERIFICATION. Acceptance run references and verdict are maintained in PR review. No live actor canaries approved or run.
**Authority:** Current deployed Firestore and Storage Rules remain in compatibility mode; global reader/Rules switches and destructive retirement remain ON HOLD.

## Role-specific decision and evidence matrix

| Role | Canonical Function authority | Current browser Firestore / Storage authority | Emulator acceptance surface | Live conclusion |
| --- | --- | --- | --- | --- |
| Global Admin | Active UID-keyed principal, global `admin` role, no exception fallback | Active legacy `users/{uid}` role and historical exception routes | Valid legacy Admin accepted; inactive/orphan rejected; canonical-only browser denied while compatibility Rules remain | NOT VERIFIED |
| Founder | Distinct active `founder` role, not global Admin | Selected management reads, mutation denied; never elevate to Admin-only Storage write | Founder allowed selected charge read but denied Admin projection, charge mutation and Admin-only image write | NOT VERIFIED |
| School Admin | Active scoped `schoolAdminOrganisationIds`; not global Admin | Active legacy `schoolUsers/{uid}` membership, school status and active `users/{uid}` | Positive own-school/negative other-school both ways across two synthetic schools; no global Admin projection | NOT VERIFIED |
| Teacher | Active `teacher` role; object authorization remains endpoint-specific | Active legacy role plus current teacher ownership on class session | Two teachers read own scheduled classes only; inactive state and Admin-only Storage denied | NOT VERIFIED |
| Parent | Active `parent` role; object authorization remains endpoint-specific | Active legacy role plus class and wallet ownership | Two parents read only own session and wallet; denied other owner's records and Admin-only Storage | NOT VERIFIED |
| Learning Partner | Active `learningPartner` role; global role does not grant universal school access | Active legacy role and explicit `schools.learningPartnerId` assignment | Two LP actors can read their assigned schools only, not the other school or Admin projection or Admin-only Storage | NOT VERIFIED |

**Important:** Synthetic emulator PASS describes current compatibility Rules, not equivalence to canonical production identities. Canonical principal presence is not evidence of browser permission until a separately approved Rules cutover.

## Independent verification scope

1. Re-run privacy-safe source audit `scripts/milestone3-authorization-parity-audit.mjs`, with negative/mutation tests for held flags, legacy exceptions and canonical fallback safety.
2. Re-run the full Functions suite and canonical guard tests, including role matrix, invalid projections and inactive fail-closed cases.
3. Re-run Firestore Rules emulator suite, including newly added two-tenant School Admin/LP and two-owner Teacher/Parent positive and negative tests.
4. Re-run Storage Rules emulator, including explicit Founder, School Admin, Teacher, Parent and LP denial for Admin-only image uploads while preserving the known legacy Admin and synthetic superUser behavior.
5. Re-run the complete Milestone 3 operational regression suite. All tests are local or in disposable emulators; nothing reads or writes production records.
6. Verify the exact diff is only tests and this report, with **0** Functions, Hosting, Rules, indexes or Firebase deployment impact.

## Open parity gaps and decisions (do not resolve silently)

**P1 — Legacy Admin exception policy.** Both Firestore and Storage Rules still accept certain legacy `superUser` and identity-specific exception types that the canonical `ensureCanonicalAdmin` guard rejects. Review whether each intended Admin has an explicit active canonical global RoleAssignment, then obtain a least-privilege owner decision. Never auto-grant Admin because an old exception exists. Do not copy legacy identities into the report.

**P1 — Canonical-only browser parity.** A canonical Admin without matching legacy `users` authority remains rejected by current browser Rules. This is expected while rules cutover is held. It must not be labeled a runtime regression or fixed without a separately planned R5D transition.

**P1 — School tenant mapping.** Legacy `schoolUsers.schoolIds` and canonical `schoolAdminOrganisationIds` must be compared with approved cross-system organization mapping and real representative memberships before Rules changes.

**P1 — Production actor parity.** No production credential, synthetic service impersonation or browser account enumeration is permitted. Issue #706 owner-private approved actor manifest, exact existing non-sensitive document allowlist, run budget and legitimate sign-in sessions are required before any real read-only tests. Parent/Teacher isolation needs at least two distinct contexts each.

**P2 — Live freshness/read budget.** Canonical derived records may be structurally valid yet stale; no recent production source-versus-projection comparison or actual billed reads has been established. These remain NOT VERIFIED. Finance pagination risk issue #705 is separate.

## Step 3 decision boundary

- **Source and emulator parity verification** can be closed when current-HEAD M3 tests, source auditor, Firestore/Storage positive and negative matrix and deploy-impact guard all PASS, with issue #706 and owner exception decisions explicitly OPEN.
- **Actual live six-role parity** cannot be passed without the separately approved read-only production actor canary. A failed or unavailable gate remains HOLD; never mistake source/CI PASS for authorization to migrate Firestore/Storage Rules.
- **Milestone 3 exit:** NOT PASSED. R5D Rules, broader global-reader switches and legacy retirement remain blocked; production identity changes require separately approved PRs and verification.
