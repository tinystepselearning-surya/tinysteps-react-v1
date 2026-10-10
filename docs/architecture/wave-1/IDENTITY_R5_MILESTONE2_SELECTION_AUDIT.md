# R5 Milestone 2 — remaining Admin authorization selection audit

Date: 2026-10-10
Baseline: `main` after PR #689 (`6fe9a47bd4a7db61057cc42c0b93e9f2f064f5b0`)
Status: **selection audit only — no production authorization switch approved**

## Milestone boundary
Milestone 1 operational authorization (AVS, rolling scheduling/enrollment, messaging) is completed, with exit CI run 38037626614 and production closeout ledger merged in #689.

Milestone 2 owns **remaining** legacy `ensureAdmin` callables outside the already-migrated operational entry points. Never modify the shared `helpers/adminGuard.ts` as a shortcut: that would pull its entire transitive Function dependency graph into a single deployment.

## Fresh code-search inventory

Source-module search for imports of `helpers/adminGuard` and calls to `ensureAdmin(` on the baseline found these **14** remaining importer modules (helper itself excluded):

| Source module | Risk / boundary |
|---|---|
| `assignLP.ts` | Parent/teacher learning-partner assignment; four callables |
| `voidTeacherOrphanEarnings.ts` | Teacher earning void |
| `wallet.ts` | Wallet configuration, payment, adjustments and reconciliation; multiple callables and trigger |
| `revenue.ts` | Finance, earnings and revenue operations; multiple callables and triggers |
| `lifecycle.ts` | Legacy enrollment/manual-session functions and related enrollment operations |
| `adminSetUserRoleCanonical.ts` | Privileged role mutation |
| `parentPaymentBackfillDryRun.ts` | Read-only-style parent-payment backfill audit callable; verify any operational side effects |
| `recordTeacherPayoutV2.ts` | Teacher payout mutation |
| `adminCorrectDemoCompletion.ts` | Demo completion correction, possible earning side effects |
| `sessionsManagementSnapshot.ts` | Sessions management read/admin refresh; scheduled + Firestore triggers |
| `parentPaymentBackfillWriteMode.ts` | High-risk finance backfill write |
| `createSessionsFromSchedule.ts` | Legacy implementation imported by rolling compatibility; not necessarily directly deployed under old names |
| `certifyTeacherEarningsSessionCreateFastPath.ts` | Earnings certification |
| `adminAttendanceCorrectionTeacherPayDecision.ts` | Attendance correction / teacher pay decisions, including trigger |

This is a **source-import inventory**, not a complete deployment root map. Verify active exports in `functions/src/index.ts`, transitive dependencies, production traffic, and side effects before any migration.

## First bounded selection

**Candidate R5C2C33: `auditParentPaymentBackfillDryRun`**, subject to exact dependency-impact validation and read-only contract review.

Why candidate: single `ensureAdmin` call in one module, audit-oriented operation, and a potentially narrow callable-root blast radius. This is **not authorization to deploy**: selection is conditional on reading its implementation and confirming it never performs write-mode or expensive unbounded scans.

Required gates:
1. Confirm `index.ts` exports the intended callable and classify both direct and transitive imports.
2. Run baseline deployment-impact classification for a proposed isolated guard replacement. Reject any full Functions redeployment and unexpected Function roots.
3. Verify canonical Admin prerequisite access in `authAccessReadModels/{firebaseUid}`, fail-closed behavior, and role semantics.
4. Verify audit remains dry-run only, preserves input limits and response contract, and does not increase Firestore reads outside the added bounded canonical principal lookup.
5. Add denial/missing-principal regression and existing parent-payment audit tests; run full Functions suite, build, lint.
6. Accept and merge only after green temporary CI, then verify the exact production Function checkpoint before advancing.

Higher-risk wallet, teacher earnings, role administration and legacy scheduler work must stay in **separate** bounded slices; do not batch them with the candidate.


## Batch progress and next dependency audit

### R5C2C33 — audit dry-run requester

- PR #691, merged at `c1d1340e596d57d9d71db14096ab430b789fdc73`.
- Acceptance CI `38038798336` passed. Production run `38039242562` verified 2/2 deployed Function roots and advanced the Functions checkpoint.
- Migrated callable: `auditParentPaymentBackfillDryRun`. The write-mode callable `applyParentPaymentBackfillForSafeParents` was redeployed because it transitively imports the shared dry-run module, **but its legacy requester guard was not switched**.
- The original query-limit/cost caveat is tracked separately; no finance query or backfill behavior changed in this authorization migration.

### R5C2C34 — teacher-finance Admin requesters

- PR #692, merged at `ebfcca46149b40f13818706715e27a11fc83c8a5`.
- Acceptance CI `38039355014` passed. Production run `38039489423` verified 4/4 deployed Function roots and advanced the Functions checkpoint.
- Migrated `recordTeacherPayoutV2`, `voidTeacherOrphanEarnings`, `certifyTeacherEarningsSessionCreateFastPath`, and `adminCorrectDemoCompletion`.
- The business logic and finance writes remain unchanged.

### R5C2C35 — identity administration and LP assignments

- PR #693, merged at `7f50afbabe75da964ab2372b27ec9645d561408f`.
- Acceptance CI `38039642887` passed: focused/full Functions tests, build, lint, exact five-root impact with no Hosting/Firestore deployment.
- Migrated `assignLPToParent`, `unassignLPFromParent`, `assignLPToTeacher`, `unassignLPFromTeacher`, and `adminSetUserRole`, which is re-exported by the same LP module.
- **Separate production checkpoint verification pending as of this draft.** Do not mark production verified until exact 5/5 evidence is available.

### Remaining boundary inventory after C35 code merge

A fresh direct-source audit (not just lagging code-search index results) found seven source modules retaining 34 `ensureAdmin(` calls:

| Legacy module | Remaining guard calls | Selection considerations |
|---|---:|---|
| `wallet.ts` | 9 | Payment and wallet mutations, configuration, read models, triggers — large blast radius |
| `revenue.ts` | 7 | Payments/earnings/revenue and reporting triggers — high finance risk |
| `lifecycle.ts` | 7 | Legacy enrollment and sessions; compatibility code transitively imports parts of it |
| `createSessionsFromSchedule.ts` | 6 | Transitive dependency of rolling compatibility; original exported names overridden by compatibility adapter |
| `sessionsManagementSnapshot.ts` | 3 | Snapshot read/refresh plus triggers and cron; protect Firestore read volume |
| `parentPaymentBackfillWriteMode.ts` | 1 | Payment backfill mutation, requires strict write-gate and idempotency regression |
| `adminAttendanceCorrectionTeacherPayDecision.ts` | 1 | Attendance correction and teacher-pay disposition, including trigger |

These counts are **source guard call sites**, not the number of active or impacted Cloud Functions. Prioritize new slices only after exact transitive-impact classification. Do not modify the shared `helpers/adminGuard.ts` or combine the highest-risk finance and legacy scheduler graphs into a single deployment.
