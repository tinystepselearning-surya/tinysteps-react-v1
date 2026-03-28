# Tiny Steps Legacy Reader Removal Plan (Staged, Metrics-Gated)

## Scope
This plan inventories active compatibility readers and defines safe removal phases for:
- `studentId`
- `kidIds`-only compatibility paths
- `teacherIds` compatibility paths
- `parentIds` compatibility paths

This is a removal **plan only**. No compatibility readers are removed in this pass.

## Active Reader Inventory

### High risk (finance/lifecycle critical)
1. `functions/src/onSessionComplete.ts`
- Enrollment resolution fallback reads: `kidId`, `studentId`, `kidIds`
- Business risk: incorrect resolution can affect credits, charges, earnings.
- Remove only after:
  - enrollment canonical coverage thresholds are met
  - reconciliation shows near-zero unresolved enrollment references
  - fallback telemetry/diagnostics are near-zero for a sustained window

2. `functions/src/revenue.ts`
- Enrollment/session fallback reads still reference `studentId` and `kidIds`.
- Business risk: charge/earning linkage integrity and payout fairness.
- Remove only after:
  - Step 1 backfill run clears unresolved enrollment references
  - reconciliation mismatches remain stable near-zero

3. `functions/src/lifecycle.ts`
- Canonical patching still reads `studentId`, `kidIds`, `parentIds`, `teacherIds` for compatibility.
- Business risk: enrollment lifecycle updates can drift if old shape remains unresolved.
- Remove only after:
  - enrollment backfill plus ambiguity resolution
  - coverage report readiness is green

### Medium risk (ops/session generation)
4. `functions/src/createSessionsFromSchedule.ts`
- Reads `kidIds`, `parentIds`, `teacherIds` as compatibility fallback.
- Business risk: generated class sessions may miss identity fields if removed too early.
- Remove only after:
  - canonical enrollment writer + backfill confirms canonical IDs on all active enrollments
  - schedule/session reconciliation confirms no missing links

### Medium/low risk (parent/admin UI read paths)
5. `src/pages/parent/ParentDashboard.tsx`
- Enrollment query falls back to `studentId` only when canonical `kidId/kidIds` queries return zero.
- Profile filtering still accepts `studentId` compatibility match.
- Risk: parent visibility gaps if removed before backfill completion.

6. `src/hooks/useData.ts`
- `useEnrollmentsForStudents` now canonical-first, with conditional `studentId` fallback.
- `useEnrollments` still accepts `studentId` when `kidId/kidIds` absent.
- Risk: admin/teacher list views may miss legacy enrollments if removed too early.

## Readiness Gates (must pass before removals)

### Data coverage gates
Use `adminStats/enrollmentCanonicalCoverage`:
- `kidIdPct >= 99.0`
- `kidIdsPct >= 99.0`
- `parentIdPct >= 99.0`
- `activeLikeTeacherIdPct >= 95.0`
- `ambiguousCount == 0`

### Integrity gates
Use `adminStats/financeReconciliationReports/runs/*`:
- `completedSessionsWithUnresolvedEnrollment == 0` (or tightly controlled known exceptions)
- `teacherMonthlyRollupMismatches == 0` (or fully explained)
- `completedSessionsMissingFinancialWithoutValidSuppression` at/near zero

### Runtime fallback gates
Telemetry events introduced in UI:
- `parent_legacy_fallback_used`
- `legacy_reader_fallback_used`

Operational aggregate path:
- `adminStats/legacyFallbackUsage/days/{yyyy-mm-dd}`

Removal should wait until fallback event rate is near-zero for at least 14 consecutive days.

## Staged Removal Plan

### Phase A (low-risk UI cleanup)
Prerequisites:
- coverage gates green for 14 days
- fallback telemetry near-zero for parent/dashboard reads

Actions:
1. Remove `studentId` fallback in `ParentDashboard` enrollment/profile filters.
2. Remove `studentId` fallback branch in `useEnrollmentsForStudents`.

### Phase B (service-layer compatibility removal)
Prerequisites:
- Phase A completed without regressions
- reconciliation remains clean for 14 days

Actions:
1. Remove `studentId` compatibility branches from non-finance UI/service readers.
2. Remove `parentIds`/`teacherIds` array fallback reads where canonical singular IDs are guaranteed.

### Phase C (finance/lifecycle critical removal)
Prerequisites:
- Phase B completed
- backfill unresolved/ambiguous set is zero (or explicit approved exceptions)
- reconciliation remains clean across a full month close cycle

Actions:
1. Remove compatibility enrollment resolution reads from `onSessionComplete`.
2. Remove legacy finance-path fallback reads from `revenue.ts`.
3. Remove lifecycle/session-generation compatibility reads in `lifecycle.ts` and `createSessionsFromSchedule.ts`.

## Guardrails During Removal
1. Remove readers one module at a time.
2. Deploy with short observation windows and rollback path.
3. Keep reconciliation schedules active and monitored before/after each phase.
4. Do not remove finance/lifecycle compatibility in the same release as unrelated product changes.
