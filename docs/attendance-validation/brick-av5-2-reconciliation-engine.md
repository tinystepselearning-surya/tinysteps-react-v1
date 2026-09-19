# AV5.2 — Attendance Reconciliation Engine

Status: **implemented as a deterministic sidecar reconciliation engine. No Firestore writer, Cloud Function export, scheduler, or operational attendance mutation is introduced in this brick.**

## Purpose

AV5.1 answers:

```text
What does the validated Teams evidence recommend?
present | absent | review
```

AV5.2 answers:

```text
How does that recommendation compare with the attendance already stored in Tiny Steps?
```

It produces one AV0-style validation-case classification:

```text
VERIFIED
MISSING_ATTENDANCE
ATTENDANCE_CONFLICT
POSSIBLE_FALSE_PRESENT
MISSING_TEAMS_EVIDENCE
AMBIGUOUS
```

`ORPHAN_TEAMS_CLASS` is intentionally not emitted here because AV5.2 starts from an already matched Tiny Steps classSession. Orphan detection belongs to the later batch-matching stage that compares unmatched Teams evidence against expected Tiny Steps sessions.

## Canonical Tiny Steps attendance

AV5.2 mirrors the AV0 canonical read rules:

```text
present -> present
late -> present
absent -> absent
no_show -> absent
rescheduled / reschedule_requested -> rescheduled
completed / scheduled / cancelled -> no attendance mark
```

This is read-time normalization only. Existing historical documents are not rewritten.

## Reconciliation matrix

### AV5 = PRESENT

| Existing Tiny Steps attendance | AV5.2 classification | Recommendation |
| --- | --- | --- |
| Present / Late | VERIFIED | none |
| Missing | MISSING_ATTENDANCE | correct_to_present |
| Absent | ATTENDANCE_CONFLICT | correct_to_present |
| Rescheduled | ATTENDANCE_CONFLICT | review |

### AV5 = ABSENT

| Existing Tiny Steps attendance | AV5.2 classification | Recommendation |
| --- | --- | --- |
| Absent / No show | VERIFIED | none |
| Missing | MISSING_ATTENDANCE | correct_to_absent |
| Present / Late | POSSIBLE_FALSE_PRESENT | correct_to_absent |
| Rescheduled | ATTENDANCE_CONFLICT | review |

### AV5 = REVIEW

AV5.2 never converts REVIEW into Present or Absent.

- stored Present + materially unsupported/incomplete class proof -> `POSSIBLE_FALSE_PRESENT`, action `review`;
- incomplete Teams attendance evidence without a stored Present -> `MISSING_TEAMS_EVIDENCE`;
- identity, session-reference, occurrence-threshold, or other unresolved uncertainty -> `AMBIGUOUS`;
- recommended action remains `review`.

## Reschedule protection

A stored `rescheduled` value is never overwritten or normalized into Present/Absent by AV5.2.

Even when Teams evidence strongly supports Present or Absent, AV5.2 produces an `ATTENDANCE_CONFLICT` requiring review.

This protects:

- reschedule lineage;
- reschedule credits;
- replacement-session relationships;
- existing billing/teacher-pay safeguards.

Any eventual operational correction belongs to AV7 and must use the existing approved correction pathways.

## POSSIBLE_FALSE_PRESENT semantics

There are two intentionally different cases:

1. **AV5 safely proves Absent** while Tiny Steps stores Present:
   - classification: `POSSIBLE_FALSE_PRESENT`
   - recommendation: `correct_to_absent`
   - still requires human review before any operational change.

2. **AV5 returns REVIEW** while Tiny Steps stores Present and the proof has a material concern such as incomplete attendance evidence, missing expected teacher, unresolved occurrence, or insufficient overlap:
   - classification: `POSSIBLE_FALSE_PRESENT`
   - recommendation: `review`
   - AV5.2 does not infer Absent.

This preserves the fail-closed rule.

## MISSING_TEAMS_EVIDENCE semantics

AV5.2 uses `MISSING_TEAMS_EVIDENCE` when AV5 cannot classify because attendance evidence is incomplete and the stored Tiny Steps status is not already a Present record requiring false-present review.

This does not mean the student was absent. It means evidence is insufficient.

## Output contract

`functions/src/attendanceValidation/reconciliationEngine.ts` returns:

```text
schemaVersion
brick = AV5.2
classSessionId
enrollmentId
kidId
teacherId
validationDecision
tinyStepsAttendance
classification
recommendedAction
resolutionStatus
reasons[]
sourceClassificationReasons[]
operationalMutationAllowed = false
```

## Safety boundary

AV5.2 is a pure deterministic function.

It does not:

- read Firestore itself;
- write `attendanceValidationCases`;
- update `classSessions`;
- update enrollment attendance;
- modify billing;
- modify teacher earnings;
- modify reschedule credits;
- invoke attendance-correction functions;
- export a Cloud Function;
- create a scheduled job.

The next brick may persist these case results to the validation-owned `attendanceValidationCases` collection in shadow mode.

## Test coverage

Regression tests cover:

- Present/Present -> VERIFIED;
- historical Late -> Present compatibility;
- Present/missing -> MISSING_ATTENDANCE;
- Present/Absent -> ATTENDANCE_CONFLICT;
- Present/Rescheduled -> review-only conflict;
- Absent/Absent -> VERIFIED;
- Absent/missing -> MISSING_ATTENDANCE;
- Absent/Present -> POSSIBLE_FALSE_PRESENT;
- Absent/Rescheduled -> review-only conflict;
- REVIEW + incomplete evidence + stored Present -> POSSIBLE_FALSE_PRESENT review;
- REVIEW + incomplete evidence + non-Present -> MISSING_TEAMS_EVIDENCE;
- identity uncertainty -> AMBIGUOUS;
- short overlap never becomes automatic Absent;
- every output keeps `operationalMutationAllowed: false`.

## Core invariant

> AV5.2 may describe a discrepancy and recommend a correction for human review. It may not perform the correction.
