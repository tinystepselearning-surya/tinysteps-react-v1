# Existing-student canonical projection bootstrap hotfix

## Problem

P3 and P4 are event-driven projections. Students and class sessions that existed before those writers were deployed do not automatically replay their historical writes. P5 therefore correctly rendered canonical course progress or selected-child month class totals as unavailable even though legacy learning/skill/session records still existed.

## Bootstrap contract

The parent dashboard may create a deterministic Firestore request only when the corresponding canonical projection is missing:

- Course progress: `v1-course-{canonicalCourseId}`
- Current-month class attendance: `v1-attendance-{YYYY-MM}`

The request path is scoped to the authenticated parent and child. Firestore rules require the parent to own the child and deny client update/delete operations. A backend Firestore trigger independently re-validates parent-child ownership before rebuilding anything.

## Read and cost bounds

This is not a mass backfill.

- P3 child progress bootstrap: at most 250 progress documents for one child.
- P4 parent-month bootstrap: at most 250 month sessions.
- P4 missing-index compatibility path: at most 500 parent history sessions before filtering to the requested month.
- P4 bootstrap is limited to the current IST month.
- Deterministic request IDs mean repeated page refreshes do not create repeated rebuild triggers.

## Semantic guarantees

The bootstrap reuses the existing P3/P4 canonical builders rather than introducing alternate calculations.

- Only explicit teacher `lessonStatus = completed` completes a curriculum lesson.
- Mastery, ratings, strengths, practice areas, remarks, or other teacher learning evidence may make a lesson `in_progress`, but never `completed`.
- P3 course and stage counts continue to reconcile to configured curriculum topics.
- P4 child rows continue to use canonical `kidId` / `kidIds` only.
- Selected-child class totals never fall back to parent/family totals.
- P4 lifecycle and attendance invariants are validated before the bootstrap writes the projection.

## Lifecycle

This hotfix is a migration bridge for records created before P3/P4 existed. Once the canonical projection exists, normal P3/P4 event writers remain responsible for keeping it current. P10 may retire the bootstrap request bridge after migration coverage is proven complete.
