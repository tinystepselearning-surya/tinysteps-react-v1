# R5 Milestone 3 — Step 5: controlled production canary readiness

**Prepared:** 2026-10-15 (Asia/Kolkata)
**Current baseline:** `main` at `7018e264c2e373b0738351b8693d9e2b99c8d69e` (Step 4 PR #726)
**Decision:** **HOLD — OWNER APPROVAL AND PRIVATE ACTOR/FIXTURE PACKET MISSING.**
**Scope:** Current-source and approval-readiness review only. **Zero authenticated production document reads, writes, impersonation, role changes, rules cutovers, finance scans or backfills.** This document does not approve or schedule a live run.

## 1. Verified baseline and earlier gates

| Gate | Evidence | Decision |
| --- | --- | --- |
| Step 1 CI repair | [PR #723](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/723) | Completed |
| Step 2 scheduling, teacher attendance and finance emulator | [PR #724](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/724) | Completed for offline/emulator scope |
| Step 3 all six roles, tenant/owner isolation | [PR #725](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/725) | Completed for source/emulator scope; no live role parity |
| Step 4 financial pagination prototype and consistency | [PR #726](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/726); [M3 verification](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/38771464866); [synthetic finance](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/38771464843); [Firestore emulator](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/38771465084) | Completed **offline only**; production finance queries remain uncapped and excluded |
| Lint repair and targeted Functions deployment | [PR #727](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/727); [Firebase #3994](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/38767286237) | Verified successful |
| Post-Step-4 deployment analysis | [Firebase #3995](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/38772640216) | Analysis succeeded; artifact deployment skipped |
| Production principal/Rules canaries | [Issue #706](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/706) | **NOT APPROVED / NOT RUN** |
| Real production finance read safety | [Issue #705](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/705) | **OPEN**, no approved live payment/ledger audit |

CI PASS documents properties of source and synthetic fixtures only. The automated daily M3 preflight must still be rerun against the latest reviewed production commit before any approved operator action. Check current Hosting, Functions and Rules production markers rather than trusting the October 10 metadata baseline.

## 2. Required six-role production evidence — proposed, NOT executed

These are expectations inferred from **current compatibility Firestore Rules** and prior emulators, not a declaration that canonical browser permissions are switched. Actual exact existing **non-sensitive** document paths and school/owner mappings must be selected and approved **privately**, never committed.

| Controlled role | Expected positive point read | Expected negative point read | Minimum contexts |
| --- | --- | --- | --- |
| Global Admin | Existing approved admin-only Sessions Management projection *document* via browser Web SDK (NOT a callable) | Same approved document must deny a separate non-Admin actor | 1 Admin |
| Founder | Existing approved non-sensitive management/charge fixture explicitly allowed to Founder | Admin-only projection denied | 1 Founder |
| School Admin | Active assigned school fixture | Other school + Admin-only fixture denied | 2 independently assigned school contexts |
| Teacher | Assigned synthetic session fixture | Other teacher's session + Admin-only fixture denied | 2 different teacher owners |
| Parent | Own synthetic wallet/session fixture | Other parent's wallet/session + Admin-only fixture denied | 2 different parent owners |
| Learning Partner | Explicitly assigned school fixture | Unassigned school + Admin-only fixture denied | 2 independently assigned LP/school contexts |

**No synthetic Firestore data creation is authorized in production.** Fixtures must already exist and be expressly approved as non-sensitive. Denial checks use only the allowed **read** operation: do not attempt writes even to prove they would be denied. Owner must review exact current Rules for every selected path, including cross-school and legacy/canonical role mapping.

## 3. Private owner-controlled approval checklist (all currently unchecked)

- [ ] Identify the designated security owner and record explicit authorization in a secure private channel, not in GitHub or this document.
- [ ] Confirm exact Firebase project, Hosting origin, **latest deployed** commit marker and a short execution window; abort on any unexpected mismatch.
- [ ] Approve controlled accounts for Admin, Founder, two School Admin contexts, two Teachers, two Parents, and Learning Partners assigned to two distinct schools. For the **separate canonical sampler**, approve no more than 12 distinct actors.
- [ ] Approve supported **legitimate user sign-in sessions** separately for each browser canary actor. Do not share passwords, cookies, tokens, private account identifiers or raw sign-in data in GitHub/chat. Do not mint Admin tokens or impersonate users to claim Rules parity.
- [ ] Privately enumerate exact full document paths that already exist; for each read, record expected allow/deny, role, school ownership, type/sensitivity and expected source-of-truth mapping.
- [ ] Approve a small read budget: **only `getDocFromServer` point reads**, initially one positive and one negative case per eligible actor; **maximum two server point-read attempts per actor, 24 total**; **zero retries, listeners, collection queries, callables or writes**. A separate owner can amend budgets only through a new private approval.
- [ ] Approve a brief time window (suggest no more than 15 minutes), independent 10-second per-attempt timeout handling, maximum 24 SDK point-read attempts, stop conditions and safe redacted result retention.
- [ ] Make a **separate** approval decision for the bounded canonical principal operator sampler; it is not a browser Rules permission test. Source contract caps at 12 actors, 7 SDK gets each and two person-scoped queries `limit(51)` each; these limits are **not** billed-read ceilings.
- [ ] Separately approve metrics reader IAM and an observation window if actual Firestore billed-read comparisons are required. Do not equate SDK attempts, returned documents, estimated query rows or billing.
- [ ] Confirm roles/legacy exceptions and Founder/School Admin/Teacher/Parent/LP ownership against expected Rules *before* each run. Missing/inactive canonical identity or unexpected grant must stop execution.
- [ ] Designate who reviews the redacted allow/deny evidence, makes the final call and can halt the plan.

**Current approved actor count: 0. Approved production document targets: 0. SDK production canary operations: 0. Real measured billed reads: NOT VERIFIED.**

## 4. Strict production exclusions

Do not call `getSessionsManagementSnapshot` (may bootstrap writes), `adminRefreshSessionsManagementSnapshot`, `getSessionsManagementDateSnapshot`, `auditParentPaymentBackfillDryRun`, `applyParentPaymentBackfillForSafeParents`, any rolling session create/repair/cutover handler, principal-refresh/backfill writers, or any other endpoint whose full side effects were not independently established. Do not use full parent/teacher UI navigation for the small point-read canary: routing can implicitly invoke listeners or write-capable callables. Do not touch live receipts, wallets, payouts or student work.

Only authorized signed-in user Web SDK `getDocFromServer` against a single **exact allowlisted existing non-sensitive** document is eligible after Gate B approval. A positive case passes only if the server confirms an allowed response under the approved identity and context. A negative case passes only on Firestore `permission-denied` from a valid signed-in session. Network error, missing document, timeout or expired auth is **INCONCLUSIVE**, not a permission denial. Unexpected allow or actor/scope mismatch => **STOP**, preserve redacted ordinal evidence, request owner review. Never run mutation-denial probes in production.

The separate bounded principal audit `scripts/milestone3-bounded-principal-audit.mjs` is prepared, but cannot run without independent operator IAM, an approved actor manifest, bounded source queries and a private sign-off. It must never be used as evidence that browser Security Rules allowed a request.

## 5. Next gate and output schema (no private values)

The appointed operator must first reconfirm production-marker lineage, latest source preflight `scripts/milestone3-canary-read-safety-preflight.mjs`, current held migration flags and unchanged approved role matrix. If any prerequisite is missing, report **HOLD** without attempting a live sign-in or read.

The future privacy-safe report must state: reviewed commit and environment class (but no private account/project-linked identifiers), approval presence (not credentials), actor count, six role categories, positive/negative case **ordinal** and PASS/FAIL/INCONCLUSIVE, two-school / two-parent / two-teacher isolation, canonical-principal evidence separately, SDK attempt/result counts, real billed-read evidence or `NOT_VERIFIED`, stop reasons by fixed code, zero live writes, no Rule changes and `milestone3Exit: NOT_PASSED` until independent final verification.

**Step 5 result at this checkpoint: PREPARATION COMPLETE / LIVE EXECUTION ON HOLD.** R5 Milestone 3 remains **IN PROGRESS**. No Firestore/Storage Rules or global identity reader cutover is authorized, and legacy Admin exceptions plus finance runtime pagination remain separate unresolved issues.
