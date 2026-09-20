# Attendance Validation — Brick AV0 Contract

Status: **contract only**. This brick does not change production attendance behavior, Firestore operational writers, billing, teacher earnings, reschedule credits, session scheduling, Microsoft Teams integration, or admin correction behavior.

## Goal

Define one enforceable architecture contract before Microsoft Teams evidence collection begins.

The validation system is a **sidecar observer and exception detector**. It may read existing Tiny Steps operational facts and write its own validation records, but it must not become a second attendance system.

## System-of-record rule

Tiny Steps remains the authoritative attendance system of record.

Microsoft Teams provides evidence only:

```text
Tiny Steps classSession
"What class was expected?"
+
Teams attendance report
"Who joined and for how long?"
+
Teams transcript
"Was meaningful teaching taking place?"
↓
Attendance validation result
```

A Teams transcript alone is never attendance truth.

## Canonical attendance vocabulary

Validation uses only:

```text
present | absent | rescheduled
```

Compatibility rules:

- historical `late` is interpreted as `present`;
- `reschedule_requested` and `rescheduled` are interpreted as the canonical business outcome `rescheduled`;
- historical `no_show` is interpreted as `absent`;
- unrelated lifecycle states such as `cancelled`, `scheduled`, `completed`, or `in_progress` are not silently converted into attendance outcomes.

No historical attendance document is rewritten by AV0.

## Evidence layers

### 1. Tiny Steps session identity

Purpose: identify the class that was expected.

Primary matching facts include:

- `sessionId`;
- `enrollmentId`;
- `teacherId`;
- `kidId` / `kidIds`;
- class date and start/end time;
- Teams join URL / meeting identity;
- reschedule lineage.

### 2. Teams attendance report

Purpose: provide participant and join-duration evidence.

This is stronger participant evidence than transcript speaker names because a child may be silent or may join using a parent/device/guest identity.

### 3. Teams transcript

Purpose: provide semantic evidence that meaningful teaching occurred.

It may help distinguish:

- genuine lesson activity;
- administrative/test meetings;
- teacher-only meetings;
- very short or incomplete meetings.

**Absence of a transcript does not prove student absence.**

## Validation classifications

Every reconciliation case must resolve to one of:

- `VERIFIED` — Teams evidence and Tiny Steps attendance agree;
- `MISSING_ATTENDANCE` — Teams evidence supports a class but Tiny Steps attendance is not marked;
- `ATTENDANCE_CONFLICT` — Teams evidence conflicts with the stored Tiny Steps attendance outcome;
- `POSSIBLE_FALSE_PRESENT` — Tiny Steps says Present but Teams evidence is materially inconsistent or missing;
- `NO_CLASS_OCCURRED` — a complete Graph attendance-report lookup proves there was no Teams occurrence for the exact scheduled slot and the Tiny Steps slot is unmarked or rescheduled;
- `MISSING_TEAMS_EVIDENCE` — expected Tiny Steps class exists but required Teams evidence cannot be found;
- `ORPHAN_TEAMS_CLASS` — Teams class evidence exists without a safe Tiny Steps session match;
- `AMBIGUOUS` — more than one plausible match or evidence is insufficient for a safe conclusion.

## Initial confidence bands

Deterministic matching uses initial calibration bands:

```text
90–100  verified
75–89   probable
50–74   needs review
<50      unmatched
```

These scores are **diagnostic only**. They do not grant permission to alter attendance or finance.

Contract v2 adopts a separate business-approved meaningful-overlap rule: the expected teacher and learner side must overlap for strictly more than 25 minutes inside the scheduled class window before AVS may recommend Present. Future threshold changes must increase the contract version and remain covered by tests. AV8 remains available for future calibration analysis.

## Validation-owned data

The sidecar may write only to:

```text
attendanceValidationRuns
attendanceValidationEvidence
attendanceValidationCases
attendanceValidationResolutions
```

Suggested record responsibilities:

### `attendanceValidationRuns`

One execution/reconciliation batch:

- date/range;
- started/completed timestamps;
- expected session count;
- Teams evidence count;
- matched/verified/conflict counts;
- agent/contract version;
- run status.

### `attendanceValidationEvidence`

Normalized evidence references:

- meeting id;
- transcript id;
- attendance report id;
- join URL;
- duration;
- participant count;
- artifact availability;
- derived teaching-activity signal;
- matching reason codes.

### `attendanceValidationCases`

One reconciled exception/verification case:

- `sessionId`;
- `enrollmentId`;
- `teacherId`;
- `kidId`;
- canonical Tiny Steps attendance;
- Teams evidence reference;
- confidence score/band;
- classification;
- reason codes;
- recommended action;
- resolution status.

### `attendanceValidationResolutions`

Human/automation resolution history:

- validation case id;
- decision;
- actor;
- timestamp;
- correction/manual-session id when an existing operational correction pathway is invoked.

## Protected production boundary

The validator may read operational collections needed for matching and diagnostics, including:

```text
classSessions
enrollments
kids
users
rescheduleCredits
billingCharges
teacherEarnings
```

It may **not directly write** those collections.

This is a hard invariant:

> Validation code may mutate only validation-owned collections.

A future approved correction must leave the sidecar and pass through the existing Tiny Steps admin correction/manual-session pathways. Those existing pathways remain responsible for audit, billing, teacher-pay, credits, and financial safeguards.

## Privacy contract

- Full Teams transcripts are **not stored in Tiny Steps by default**.
- Store artifact ids, metadata, derived signals, reason codes, and minimal summaries required for review.
- Raw transcript content should remain in Microsoft and be fetched on demand only when an authorized review requires it.
- No child transcript should be copied into validation storage merely because it exists.
- Any future retention duration for derived evidence must be explicit and configurable; AV0 does not introduce a deletion/migration job.

## AI boundary

Deterministic identity and time matching come first.

AI/semantic analysis may later assist with transcript activity classification, but it must not:

- infer attendance from a child name alone;
- treat missing transcript as absence;
- make teacher-pay decisions;
- directly correct attendance;
- directly alter billing or teacher earnings.

## Resolution boundary

AV0 permits **recommendations**, not operational actions.

Possible recommendation labels include:

```text
none
review
correct_to_present
correct_to_absent
mark_rescheduled
create_missing_session
```

AV7 will own the bridge from an admin-approved validation resolution into the already-existing Tiny Steps correction/manual-session mechanisms.

## AV0 invariants

1. Tiny Steps remains the attendance system of record.
2. Validation has only three canonical attendance outcomes: Present, Absent, Rescheduled.
3. Historical Late is read as Present and is never rewritten by this brick.
4. Teams attendance and transcript artifacts are evidence, not independent attendance truth.
5. Missing transcript never proves absence.
6. Validation writes are restricted to validation-owned collections.
7. No validation confidence score can directly mutate operational attendance or finance.
8. Full transcript storage is off by default.
9. Financially meaningful corrections remain behind the existing admin correction workflow.
10. AV0 itself has zero production behavior changes.

## Explicitly deferred

AV0 does **not**:

- configure Microsoft Entra or Graph permissions;
- call Microsoft Graph;
- ingest Teams artifacts;
- create Firestore validation documents;
- add an admin validation dashboard;
- perform session matching;
- reconcile real production attendance;
- auto-correct attendance;
- change billing or teacher earnings;
- migrate historical attendance;
- change reschedule-credit mechanics.

Those responsibilities begin in AV1 and later bricks only after this contract is green.
