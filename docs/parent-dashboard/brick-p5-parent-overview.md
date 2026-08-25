# Brick P5 — Parent Overview

## Goal

Make the Parent Overview a small, trustworthy summary surface that **displays canonical facts but does not recalculate them**.

P5 is a consumer brick. It does not redefine lesson completion, class lifecycle, attendance, or finance semantics.

## Canonical inputs

### Course progress

Overview accepts only the current Brick P3 child/course projection when all of the following are true:

- `schemaVersion === 3`
- `modelType === child_course_progress_v3`
- `completionAuthority === teacher_progress_save`
- `definitionStatus === configured`
- the projection course matches the selected course
- course counts reconcile
- every stage reconciles
- summed stage counts reconcile back to the course counts

P3 defines one completed curriculum lesson as one canonical lesson progress document successfully saved by the teacher. Re-saving the same lesson updates that document and does not add another completion.

If those conditions are not met, course progress is **unavailable** while the bounded P3 repair runs. P5 does not substitute mastery, a monthly progress rollup, class counts, or a client-side curriculum calculation.

### Classes and attendance

Overview accepts only the Brick P4 **selected child + selected month** row.

- Family `totals` never substitute for a missing child row.
- A missing child row is displayed as unavailable, not zero.
- `upcoming` and unresolved-past counts are rematerialized from the same P4 row's pending timestamps, without another Firestore read.
- Raw bounded class-session reads remain temporarily available only for the Next Class preview and join action. Brick P8 owns the final Classes cutover.

### Skills snapshot

P5 may show actual teacher-provided evidence already captured by the teacher learning contract, such as:

- latest rated lesson
- teacher remark
- explicit strengths
- explicit needs-practice items

P5 must not turn mastery or game signals into a synthetic confidence score, and skill ratings do not create extra curriculum completions.

### Wallet

The existing wallet/payment surface remains visible in P5. Finance semantics are not changed here; Brick P9 owns the ledger-driven finance cutover.

## Deliberately excluded from P5

The Overview does **not** show:

- guessed confidence
- invented recommendations
- synthetic learning narratives derived from unrelated signals
- a detailed lesson tracker
- alternate mastery-based completion percentages
- family class totals on a selected-child screen

Detailed lesson rows belong to P6. Skills/teacher-feedback normalization belongs to P7. Classes history belongs to P8. Finance reconciliation belongs to P9. Legacy deletion belongs to P10.

## Display behavior

P5 distinguishes a genuine zero from unavailable data.

Examples:

- canonical `0 / 12` saved lessons → show `0%`
- canonical selected-child `0` sessions → show zero class activity
- missing/rejected/stale P3 projection → `Not available` until repaired
- missing P4 child row even when family totals exist → `Not available`

## Implementation boundary

`parentOverviewProjection.ts` is the P5 selection boundary. It validates P3 course data, selects P4 child/month data, and exposes the view-ready canonical summary.

The large `ParentDashboard.tsx` still contains legacy calculations used by tabs scheduled for later retirement. P5 ensures the **Overview no longer consumes them as fallbacks**.

## Acceptance invariants

1. One teacher-saved canonical lesson contributes exactly one curriculum completion.
2. Re-saving stars/status/feedback on the same lesson does not increment completion again.
3. Mastery cannot create an additional Parent Overview course completion.
4. A P3 V1/V2 or wrong-authority projection is rejected.
5. Stage totals and course totals must reconcile before P5 renders course progress.
6. A missing P4 selected-child row never falls back to family totals.
7. Zero and unavailable are visually distinct.
8. P5 does not render guessed confidence or recommendations.
9. P5 does not render detailed lesson rows.
10. Existing wallet behavior is unchanged pending P9.
