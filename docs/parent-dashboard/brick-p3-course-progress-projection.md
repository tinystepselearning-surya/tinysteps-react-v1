# Parent Dashboard Rebuild — Brick P3 Course Progress Projection

Status: **stacked implementation** on P2. Do not merge independently ahead of P1/P2 review.

## Goal

Create one canonical child + course read model for curriculum completion so the parent experience can no longer derive course completion from mastery, attendance, class counts, or independent screen-level calculations.

Canonical read model:

```text
students/{kidId}/courseProgress/{courseId}
```

Schema:

```text
schemaVersion = 2
modelType = child_course_progress_v2
completionAuthority = teacher_lesson_status
```

## Completion authority

A curriculum lesson is completed only when the teacher progress record contains:

```text
lessonStatus = completed
```

The following never complete a lesson by themselves:

- `mastery = mastered`
- `mastery = proficient`
- numeric mastery percentages
- skill ratings
- strengths / practice areas
- legacy `status = completed`
- attendance or class-session status

Legacy teacher progress with genuine learning evidence but no explicit `lessonStatus` is conservatively projected as `in_progress`.

## Canonical course invariant

For every configured course:

```text
completedTopics + inProgressTopics + notStartedTopics = totalTopics
```

and:

```text
overallPct = completedTopics / totalTopics
```

`totalTopics` comes from the canonical curriculum definition. Progress documents that do not belong to a canonical curriculum topic cannot inflate the denominator or completed count.

## Canonical stage invariant

The V2 read model includes `stageSummaries[]` built from the same curriculum topics and the same lesson states as the course summary.

Each stage contains:

```text
key
label
order
totalTopics
completedTopics
inProgressTopics
notStartedTopics
completionPct
```

The course counts are derived from the stage counts, so the stage totals and course totals reconcile by construction.

This removes the architecture that could produce contradictions such as:

```text
Course: 15 / 40 completed
Stage 1: 0 / 12
Stage 2: 0 / 8
...
```

## Incremental write strategy

The projection remains event-driven from:

```text
students/{kidId}/progress/{topicId}
```

For an already-valid V2 projection, one teacher progress write updates only the affected course/stage delta plus a bounded recent-evidence window.

The trigger reads the canonical curriculum definition before applying the delta so stage ownership and course totals remain curriculum-owned rather than progress-document-owned.

## Controlled bootstrap

A V1 projection or a V2 projection whose stored curriculum shape no longer matches the canonical definition is not incrementally trusted.

On the next relevant teacher progress write, the function performs a one-time course bootstrap from that child's progress documents + the canonical curriculum definition, then resumes incremental V2 updates.

There is deliberately **no mass backfill in P3**. Existing untouched students are not rewritten merely because this brick exists.

## Missing curriculum definition

When a course has no canonical curriculum definition, the projection records:

```text
definitionStatus = missing
```

and does not invent course totals from progress rows. Later parent UI bricks must present this as unavailable rather than fabricating a percentage.

## Compatibility

The deployed Cloud Function export name remains:

```text
onStudentProgressReadModelWrite
```

The old module path is retained as a compatibility barrel, but it now exports the V2 implementation. This ensures deployment replaces the old writer instead of deploying two competing writers to the same read model.

The React hook keeps all existing V1 fields while exposing V2 fields (`notStartedTopics`, stage summaries, schema/authority metadata) for later parent UI bricks.

## Explicitly deferred

P3 does **not**:

- redesign the Parent Overview UI (P5);
- rebuild the detailed lesson tracker (P6);
- change skill/mastery presentation (P7);
- change class or attendance semantics (P4/P8);
- change billing or wallet semantics (P9);
- mass-migrate old progress rows;
- delete all legacy parent calculations yet (P10).

Because the rebuild is stacked, consumer cutover can happen in later bricks without exposing a partially migrated parent experience on `main`.

Final review requires full repository CI to pass on the exact P3 head commit before the PR is considered build-complete.
