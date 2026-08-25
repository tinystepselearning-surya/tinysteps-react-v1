# Parent Dashboard Rebuild — Brick P1 Data Contract

Status: **contract only**. This brick deliberately does not change production UI, Firestore writers, migrations, billing, attendance, or teacher workflows.

## Goal

Make every parent-facing number traceable to one authoritative operational fact. Parent UI may repeat a fact in multiple places, but it must not independently reinterpret or recalculate business meaning.

## Canonical domains

### 1. Child identity

- `kidId` is the canonical operational child key.
- `studentId`, `studentUid`, `linkedStudentId`, and `studentRefId` are compatibility/migration aliases only.
- A missing selected-child `byKid[kidId]` row must return **unavailable**, never silently fall back to parent/family totals.

### 2. Classes and attendance

Authoritative source: class-session / attendance system.

A class is a scheduled operational session. It is not a curriculum lesson.

Parent month semantics:

- `totalSessions`: every session record counted in the requested child/month scope.
- `completedSessions`: sessions whose canonical class status is `completed`.
- `upcomingSessions`: scheduled/in-progress sessions whose start is in the future.
- `cancelledSessions`: cancelled sessions.
- `noShowSessions`: no-show sessions.
- `rescheduleRequestedSessions`: sessions awaiting reschedule handling.
- `unresolvedPastSessions`: scheduled/in-progress sessions whose start time is already in the past.

No class count may be used to derive curriculum completion.

### 3. Curriculum lessons

Authoritative source: teacher lesson-progress record plus canonical curriculum definition.

Canonical field:

```text
lessonStatus = not_started | in_progress | completed
```

Rules:

- A lesson becomes `completed` only from explicit teacher-controlled `lessonStatus: completed`.
- Skill mastery never completes a lesson.
- `mastered` is a learning-performance result, not a curriculum-completion instruction.
- `proficient` is a learning-performance result, not a curriculum-completion instruction.
- Legacy progress with real teacher learning evidence but no `lessonStatus` is treated as `in_progress` until a controlled migration/review assigns an explicit lesson state.

Course completion:

```text
completionPct = completedLessons / totalLessons
```

Required invariant:

```text
completedLessons + inProgressLessons + notStartedLessons = totalLessons
```

Stage summaries and course summaries must be produced from the same canonical lesson states. The UI must never show a course total such as 15/40 when stage totals cannot reconcile to 15 completed lessons.

### 4. Skills and mastery

Authoritative source: teacher ratings / observations.

Canonical mastery scale:

```text
not_started | emerging | developing | proficient | mastered
```

Skills remain independent from lesson completion. A valid record can be:

```text
lessonStatus: completed
mastery: developing
```

or:

```text
lessonStatus: in_progress
mastery: proficient
```

### 5. Finance

Authoritative source: billing ledger, parent wallet, and allocation-aware monthly billing model.

- `familyBalance` is parent/family scope.
- A selected child's monthly billed/settled/due amounts come only from the canonical `byKid[kidId]` row.
- Family balance must never be labelled as the selected child's balance.
- Missing child billing data must not fall back to family totals.

## Parent presentation rule

Every parent-facing metric must have exactly one semantic owner:

| Metric | Owner |
| --- | --- |
| Classes completed / upcoming / cancelled | class-session & attendance model |
| Lessons completed / in progress | teacher lesson status + curriculum |
| Skill mastery / strengths / practice areas | teacher progress ratings |
| Family balance | parent wallet / ledger |
| Child monthly due | monthly billing `byKid` projection |

The same canonical metric may appear on Overview, Insights, or a detail page, but those screens must consume the same value rather than re-derive it.

## Brick P1 safeguards added in code

`src/lib/parentDashboardDataContract.ts` provides pure contract helpers for:

- canonical lesson-state classification;
- mastery normalization independent from completion;
- curriculum summary calculation;
- curriculum invariant validation;
- class-month status summarization;
- strict child-row selection without family fallback.

Unit tests lock these semantics before later bricks wire them into production.

## Explicitly deferred

Brick P1 does **not**:

- modify teacher saves;
- add `lessonStatus` to production documents;
- reinterpret existing production progress;
- migrate legacy child identities;
- change parent UI;
- alter current class/attendance projections;
- alter finance;
- delete legacy calculations.

Those changes belong to later reviewed bricks after the contract is green.
