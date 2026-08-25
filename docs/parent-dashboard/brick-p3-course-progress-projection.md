# Parent Dashboard Rebuild — Brick P3 Course Progress Projection

Status: **canonical projection in production; saved-lesson completion repair in review**.

## Goal

Create one canonical child + course read model for curriculum completion so the parent experience cannot derive course completion from mastery, attendance, class counts, or independent screen-level calculations.

Canonical read model:

```text
students/{kidId}/courseProgress/{courseId}
```

Current schema:

```text
schemaVersion = 3
modelType = child_course_progress_v3
completionAuthority = teacher_progress_save
```

## Completion authority

A curriculum lesson is completed when the teacher successfully saves that canonical lesson in the Teacher Topic Progress editor.

The teacher editor writes one durable document per canonical lesson:

```text
students/{kidId}/progress/{topicId}
```

Therefore:

- first successful **Save / Save & Back / Save & Next** for a canonical lesson = one completed curriculum lesson;
- re-saving the same lesson after changing stars, strengths, practice areas, notes, or learning status updates the same document and does **not** add another completion;
- a saved lesson may still have learning status **Still learning**; that means the child needs more teaching/practice, not that the lesson should disappear from curriculum completion;
- deleting the canonical saved progress document removes that lesson from completion.

The following never create an additional curriculum completion by themselves:

- `lessonStatus` / learning-status choice;
- `mastery = mastered` or `proficient`;
- numeric mastery percentages;
- skill ratings / stars;
- strengths / practice areas;
- attendance or class-session completion.

This distinction is deliberate: **lesson progress is the teacher's saved curriculum record; mastery is the child's proficiency evidence.**

## Canonical course invariant

For every configured course:

```text
completedTopics + notStartedTopics = totalTopics
inProgressTopics = 0
```

and:

```text
overallPct = completedTopics / totalTopics
```

`totalTopics` comes from the canonical curriculum definition. Saved progress documents that do not belong to a canonical curriculum topic cannot inflate the denominator or completed count.

## Canonical stage invariant

The V3 read model includes `stageSummaries[]` built from the same canonical curriculum topics and saved lesson records as the course summary.

Each stage contains:

```text
key
label
order
totalTopics
completedTopics
inProgressTopics = 0
notStartedTopics
completionPct
```

The course counts are derived from the stage counts, so stage totals and course totals reconcile by construction.

## Incremental write strategy

The projection remains event-driven from:

```text
students/{kidId}/progress/{topicId}
```

For an already-valid V3 projection:

- a first save changes the lesson from `not_started` to `completed`;
- a re-save changes `completed` to `completed`, so the count remains unchanged;
- a removed saved lesson changes `completed` back to `not_started`.

The deployed Cloud Function export remains:

```text
onStudentProgressReadModelWrite
```

so deployment replaces the prior writer rather than installing a competing writer.

## Existing-parent repair

Parents may already have a V2 projection created under the superseded `teacher_lesson_status` rule. Those rows can show `0/40` even while the teacher Skills view clearly contains many previously saved lesson records.

The parent projection hook treats any non-V3 row as stale and creates one deterministic bounded repair request:

```text
v2-course-{courseId}
```

The backend:

1. verifies the authenticated parent owns the selected child;
2. reads the canonical curriculum definition;
3. scans at most 250 existing child progress documents;
4. keeps only canonical topics for the selected course;
5. rebuilds V3 by counting each saved canonical lesson once.

The old `v1-course-*` request id remains accepted temporarily for rollout compatibility, while the new `v2-course-*` id bypasses already-completed requests created under the old contract.

There is deliberately **no global mass backfill**. Existing students repair lazily when their parent view requests that child/course, while all future teacher saves update V3 automatically.

## Missing curriculum definition

When a course has no canonical curriculum definition, the projection records:

```text
definitionStatus = missing
```

and does not invent course totals from progress rows. Parent UI must present this as unavailable rather than fabricate a percentage.

## Consumer contract

P5 Overview and P6 Insights accept only:

```text
schemaVersion = 3
modelType = child_course_progress_v3
completionAuthority = teacher_progress_save
```

This prevents stale V2 or mastery-derived data from being shown as canonical course progress.

## Explicit separation from other bricks

P3 does not make these facts interchangeable:

- P4/P8 class sessions and attendance;
- P7 skill mastery / teacher ratings;
- P9 wallet and billing.

A child may therefore have many completed classes, a different number of saved curriculum lessons, and skill ratings that continue to change after a lesson was saved. Those are separate facts by design.
