# Brick P2 — Teacher → Learning Contract

## Goal

Make the teacher the explicit authority for **curriculum lesson completion** while keeping **skill mastery** independent.

Brick P2 changes the canonical teacher progress editor and the progress document written at:

`students/{kidId}/progress/{topicId}`

It does not yet switch the parent course-progress projection to the new status field. That is Brick P3.

## Teacher workflow

For every taught lesson, the teacher records two separate things:

1. **Lesson status**
   - `in_progress` — the lesson was taught/reviewed but needs more teaching or practice.
   - `completed` — the curriculum lesson is complete for this child's pace.

2. **Learning evidence**
   - skill ratings;
   - strengths;
   - needs-practice skills;
   - teacher remark;
   - derived legacy mastery retained for compatibility.

The UI explicitly tells teachers that skill stars do **not** complete a lesson.

## Canonical fields written

Every teacher save continues to write the existing learning fields and now also writes:

- `learningContractVersion: 2`
- `lessonStatus: in_progress | completed`
- `lessonStatusSource: teacher`

When lesson status is first established or changed:

- `lessonStatusUpdatedAt`
- `lessonStatusUpdatedBy`

When the teacher transitions a lesson into completed:

- `completedAt`
- `completedBy`

When a teacher reopens a completed lesson:

- `lessonStatus: in_progress`
- `completedAt: null`
- `completedBy: null`
- `reopenedAt`
- `reopenedBy`

Ordinary skill/note edits to an already completed lesson do **not** reset `completedAt`.

## Legacy safety

Existing rows may have ratings/mastery but no explicit lesson status.

P2 does not mass-migrate them. When a teacher next edits one of those lessons:

- existing learning evidence resolves to `in_progress`;
- the next teacher save explicitly adopts `lessonStatus: in_progress` unless the teacher chooses `completed`;
- `mastered` or `proficient` never silently becomes completed.

This preserves old learning evidence while moving records onto the new contract through normal teacher use.

## Important boundaries

Brick P2 intentionally does **not**:

- change class attendance or class counts;
- infer lessons from classes;
- change parent billing;
- change the parent course-progress projection;
- backfill old lesson statuses;
- delete old mastery/check fields;
- add a second progress collection.

`students/{kidId}/progress/{topicId}` remains the canonical current lesson state.

## Why P3 is still required

The existing course projection on `main` still has legacy completion semantics based partly on mastery. P3 will cut that projection over to `lessonStatus` and make all parent lesson counts reconcile from the same source.

P2 therefore establishes the authoritative teacher write contract first; P3 consumes it.
