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
