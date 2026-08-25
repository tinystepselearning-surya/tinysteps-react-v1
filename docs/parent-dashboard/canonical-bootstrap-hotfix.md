# Existing-student canonical projection bootstrap hotfix

## Problem

P3 and P4 are event-driven projections. Students and class sessions that existed before those writers were deployed do not automatically replay their historical writes. P5 therefore correctly rendered canonical course progress or selected-child month class totals as unavailable even though legacy learning/skill/session records still existed.

## Bootstrap contract

Course progress now uses the authenticated `bootstrapParentCourseProgress` callable whenever the selected child/course projection is missing or stale. The callable independently verifies:

- the caller has the parent role;
- the parent owns the requested child identity;
- an operational enrollment assigns that course to that child.

The original deterministic `v1-course-*` / `v2-course-*` request-document trigger remains for already-loaded clients, with the same backend ownership and assignment validation. New clients do not consult those documents, so an old `requested`, `processing`, `failed`, or partially handled request can no longer lock out recovery.

Current-month class attendance uses its separate bounded repair callable and is unchanged by the P3 repair.

## Read and cost bounds

This is not a mass backfill.

- P3 ownership: three direct child-identity reads.
- P3 assignment validation: one parent/course query capped at 21 returned enrollment documents (20 accepted; an oversized result fails closed).
- P3 current-row check: one projection and one curriculum-definition read.
- P3 child progress bootstrap: at most 251 returned progress documents (250 accepted; an oversized result fails closed), followed by one projection write.
- A repeated ensure for an already-current row performs no progress-history read and no projection write.
- P4 parent-month bootstrap: at most 250 month sessions.
- P4 missing-index compatibility path: at most 500 parent history sessions before filtering to the requested month.
- P4 bootstrap is limited to the current IST month.
- The browser deduplicates concurrent ensures for the same parent/child/course. A later navigation can retry after failure.

## Semantic guarantees

The bootstrap reuses the existing P3/P4 canonical builders rather than introducing alternate calculations.

- One successfully saved canonical teacher progress document contributes one curriculum completion.
- Re-saving that same lesson after mastery, rating, strength, practice-area, remark, or learning-status edits does not add another completion.
- P3 course and stage counts continue to reconcile to configured curriculum topics.
- P4 child rows continue to use canonical `kidId` / `kidIds` only.
- Selected-child class totals never fall back to parent/family totals.
- P4 lifecycle and attendance invariants are validated before the bootstrap writes the projection.

## Lifecycle

This hotfix is a lazy repair bridge for records created before P3 existed or stranded behind a failed request. Once the canonical projection exists, the normal P3 event writer remains responsible for keeping it current. The legacy request-document trigger can be retired after rollout compatibility is no longer needed.
