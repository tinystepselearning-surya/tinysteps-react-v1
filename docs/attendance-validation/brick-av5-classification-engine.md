# AV5 — Classification Engine

Status: **Brick 1 implemented: deterministic classification contract and engine; no production export, scheduler, Firestore writer, or operational attendance mutation.**

## Purpose

AV5 consumes the already-built AV4 session proof and converts it into one validation recommendation:

```text
present | absent | review
```

These are validation recommendations only. Tiny Steps remains the operational attendance system of record.

AV5 does not directly write:

- `classSessions`
- `enrollments`
- billing
- teacher earnings
- reschedule credits
- operational correction records

`operationalMutationAllowed` is always `false`.

## Deterministic decision tree

AV5 fails closed whenever any prerequisite is not proven.

```text
AV4 proof
  |
  |-- session reference valid and matches AV3 identity?
  |      no -> REVIEW
  |
  |-- recurring Teams occurrence resolved and overlaps scheduled window?
  |      no -> REVIEW
  |
  |-- AV3 identity confidence verified?
  |      no -> REVIEW
  |
  |-- expected assigned teacher present?
  |      no -> REVIEW
  |
  |-- attendance evidence complete?
  |      no -> REVIEW
  |
  |-- any learner-side participant present?
  |      no -> ABSENT
  |
  |-- meaningful-overlap threshold configured?
  |      no -> REVIEW
  |
  |-- teacher/learner scheduled overlap meets calibrated threshold?
  |      no -> REVIEW
  |
  `-- yes -> PRESENT
```

## Why short overlap is REVIEW, not ABSENT

AV4 deliberately leaves the meaningful-overlap threshold configurable for later calibration. When a learner-side participant exists but overlap is below the configured threshold, AV5 does not infer absence. That case may represent:

- a late join;
- an early leave;
- connectivity issues;
- a shortened legitimate class;
- a calibration threshold that needs adjustment.

Therefore `meaningful_overlap_not_met` routes to `review`.

## Why no learner-side participant can be ABSENT

AV5 may recommend `absent` only when all of the stronger prerequisites have already passed:

- exact Tiny Steps session reference is verified;
- correct recurring Teams occurrence is selected;
- AV3 staff identity is verified;
- expected teacher participated;
- attendance report and records are complete;
- no participant remains classified as learner-side.

This is intentionally narrower than treating “missing evidence” as absence. Any evidence gap routes to `review`.

## Output contract

`functions/src/attendanceValidation/classificationEngine.ts` returns:

```text
schemaVersion
brick = AV5
sourceProofSchemaVersion
classSessionId
enrollmentId
kidId
teacherId
decision
recommendedAttendanceOutcome
requiresHumanReview
reasons[]
proofIssues[]
operationalMutationAllowed = false
```

For `review`, `recommendedAttendanceOutcome` is `null`.

For `present` or `absent`, it mirrors the validation recommendation but still does not authorize an operational write.

## Test coverage

The AV5 regression suite covers:

- verified PRESENT;
- verified ABSENT with no learner-side participant;
- expected teacher missing -> REVIEW;
- incomplete attendance evidence -> REVIEW;
- session reference mismatch -> REVIEW;
- wrong/unresolved recurring occurrence -> REVIEW;
- AV3 identity conflict -> REVIEW;
- overlap threshold unavailable -> REVIEW;
- overlap below threshold -> REVIEW, never ABSENT;
- all decisions preserve `operationalMutationAllowed: false`.

## Explicitly deferred

This brick does not yet:

- reconcile the recommendation against existing Tiny Steps attendance;
- create `attendanceValidationCases`;
- assign AV0 case classifications such as `VERIFIED` or `ATTENDANCE_CONFLICT`;
- persist AV5 results;
- export a Cloud Function;
- schedule a production job;
- calibrate meaningful-overlap thresholds;
- invoke the AV7 correction pathway.

Those belong to later AV5 reconciliation/persistence work and AV8 calibration.

## Core invariant

> AV5 may recommend Present, Absent, or Review from deterministic proof. It may not change operational attendance or finance.
