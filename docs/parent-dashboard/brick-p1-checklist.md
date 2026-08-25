# Brick P1 Acceptance Checklist

Brick P1 is complete when all items below are true.

- [x] Classes and curriculum lessons have separate domain types and summaries.
- [x] Lesson completion is defined only by explicit `lessonStatus: completed`.
- [x] `proficient` and `mastered` are skill/mastery outcomes, not completion commands.
- [x] Legacy teacher evidence without `lessonStatus` is classified as `in_progress`, not silently completed.
- [x] Curriculum completion percentage is derived only from completed lessons divided by canonical curriculum total.
- [x] Curriculum count invariants can detect contradictory summaries.
- [x] Class month summary distinguishes completed, upcoming, cancelled, no-show, reschedule-requested, rescheduled, unresolved-past, and other states.
- [x] Selected-child data lookup never falls back to family totals.
- [x] Family balance and child-month billing are explicitly different scopes.
- [x] No production writer, migration, UI, attendance projection, or finance behaviour is changed in this brick.
- [x] Unit tests cover the contract semantics.

Before merge:

- [ ] Full CI green on exact PR head.
- [ ] Final diff review confirms no production wiring slipped into P1.
- [ ] Merge only after explicit approval.
