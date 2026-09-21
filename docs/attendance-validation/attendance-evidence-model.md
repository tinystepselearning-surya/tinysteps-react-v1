# Tiny Steps Attendance Validation Evidence Model

Status: **contract for AV2 evidence collection and AV4 class-proof logic.**

This model adopts the useful evidence concepts seen in external attendance platforms — join time, leave time, participation duration, meeting identity and automated evidence analysis — without replacing Tiny Steps' existing attendance system.

## Non-negotiable system boundary

Tiny Steps' existing operational attendance remains the source of truth.

```text
EXISTING TINY STEPS ATTENDANCE
        │
        │ read only
        ▼
ATTENDANCE VALIDATION EVIDENCE LAYER
        │
        ▼
VALIDATION / RECONCILIATION
        │
        ▼
ADMIN OR CONTROLLED RESOLUTION
        │
        ▼
EXISTING APPROVED CORRECTION MECHANISM
```

The evidence layer must never directly mutate `classSessions`, billing, teacher earnings, reschedule credits or other operational attendance/finance data.

The only future operational attendance outcomes remain:

- `Present`
- `Absent`
- `Rescheduled`

There is no future `Late` outcome. Historical `late` data remains backward-compatible and is interpreted as Present-equivalent where already defined by AS0.

## Evidence hierarchy

### Tier 1 — primary deterministic evidence

These are the strongest inputs for AV2/AV4:

1. a canonical Tiny Steps `classSession` exists with a resolved IST service date;
2. the Teams meeting can be resolved to the expected live-session identity;
3. the expected teacher participated;
4. the expected learner, or an identity linked to that learner, participated;
5. raw participant join/leave intervals are available;
6. teacher and learner participation overlap is measurable;
7. the overlap belongs to the same Tiny Steps IST service date.

For a Tiny Steps row already marked **Present**, the service date is authoritative and the scheduled clock time is not. A class scheduled at 3pm may legitimately run at 5pm or 6pm after a same-day reschedule.

For non-Present rows, AVS still uses scheduled-window occurrence matching before attaching evidence to that individual row. This prevents one real same-day class from being borrowed by unrelated unmarked or rescheduled rows.

### Tier 2 — supplemental class-proof evidence

These can increase or decrease confidence but are not required for attendance by themselves:

- transcript exists;
- speaker-attributed transcript exists;
- recording metadata indicates a recording exists;
- sustained teacher/learner turns are present;
- teaching language, questions, exercises or lesson activity are detected;
- meeting duration is consistent with the scheduled lesson.

Transcript and recording evidence are supporting signals, not mandatory attendance prerequisites.

### Tier 3 — never sufficient to infer absence

None of the following may independently become `Absent`:

- no transcript;
- no recording;
- transcript API disabled;
- recording disabled;
- Microsoft Graph failure or rate limit;
- participant display-name mismatch;
- learner joined from a parent account, iPad, guest/device name or another mapped identity;
- missing artifact caused by retention or permissions;
- ambiguous meeting resolution.

These conditions mean **missing/weak evidence or review required**, not absence.

## Raw evidence contract

AV2 must retain enough normalized evidence to reproduce every derived metric without storing unnecessary child transcript content.

### Expected Tiny Steps session snapshot — read only

```text
classSessionId
enrollmentId
teacherId
kidId / expected learner identity reference
courseId
scheduledStart
scheduledEnd
scheduledDurationSeconds
joinUrl or meeting reference
existingAttendanceStatus
```

### Teams meeting identity

```text
organizerUserId
onlineMeetingId
joinWebUrl hash/reference
attendanceReportId
meetingStartDateTime
meetingEndDateTime
transcriptIds[]
recordingAvailable (if known)
transcriptAvailable
```

Do not persist meeting passcodes, access tokens or credentials in validation evidence.

### Participant evidence

For every relevant participant record, preserve raw source data before deriving metrics:

```text
participantRecordId
identity reference / normalized identity hints
role
emailAddress if permitted and required for identity matching
totalAttendanceInSeconds
attendanceIntervals[]:
  joinDateTime
  leaveDateTime
  durationInSeconds
```

AV3 owns the mapping of these identities to Tiny Steps teacher/student identities. Display name alone must never be used as an authoritative learner match.

## Derived participation metrics

AV2/AV4 should derive metrics from raw intervals. They must remain reproducible and auditable.

```text
scheduledDurationSeconds
teacherObservedSeconds
learnerObservedSeconds
teacherScheduledSeconds
learnerScheduledSeconds
teacherLearnerOverlapSeconds
teacherLearnerScheduledOverlapSeconds
learnerScheduledDwellPercentage
teacherLearnerScheduledOverlapPercentage
teacherFirstJoin
teacherLastLeave
learnerFirstJoin
learnerLastLeave
```

### Calculation principles

1. Multiple join/leave intervals must be preserved; do not reduce evidence to only first join and last leave.
2. Overlapping/duplicate intervals should be normalized before summing to avoid double counting.
3. `teacherObservedSeconds` and `learnerObservedSeconds` are the union of each participant's valid intervals.
4. Scheduled participation metrics are computed after intersecting those intervals with `[scheduledStart, scheduledEnd]`.
5. `teacherLearnerOverlapSeconds` is the intersection of normalized teacher and learner intervals.
6. `teacherLearnerScheduledOverlapSeconds` is that overlap further intersected with the scheduled class window.
7. Percentages use `scheduledDurationSeconds` as the denominator and should be bounded to `0–100%`.
8. Microsoft-provided `totalAttendanceInSeconds` is retained as source evidence and may be cross-checked, but interval-derived metrics remain independently reproducible.

Example:

```text
Scheduled class: 16:00–16:35 (35 minutes)
Teacher:         16:00–16:36
Learner:         16:02–16:34

teacherScheduledSeconds = 2100
learnerScheduledSeconds = 1920
teacherLearnerScheduledOverlapSeconds = 1920
teacherLearnerScheduledOverlapPercentage = 91.4%
```

The validator stores the evidence and calculation, not merely `91.4%`.

## Same-day Present coverage rule

For Tiny Steps rows whose current operational attendance is **Present**, AVS evaluates verified expected-teacher + learner overlap across the full IST service date.

The production threshold remains strictly greater than 25 minutes per Present attendance:

```text
requiredSameDayOverlapSeconds =
  numberOfTinyStepsPresentSessionsForGroup × 1,500
```

Examples:

- 1 Present session -> same-day verified overlap must be **>25:00**;
- 2 Present sessions -> overlap must be **>50:00**;
- 3 Present sessions -> overlap must be **>75:00**.

The group key is service date + enrollment + learner + teacher. Different enrollments or teachers are never pooled.

Multiple same-day Teams attendance reports may contribute evidence. AVS unions teacher/learner overlap intervals across reports and deduplicates repeated copies of the same Teams report before summing, so overlapping or repeated evidence cannot inflate attendance time.

One 35-minute class therefore cannot verify two Tiny Steps Present rows. Conversely, one continuous 65-minute Teams class can verify two Present rows for the same group on that service date.

Same-day coverage requires complete attendance-report/attendance-record evidence plus verified teacher and learner identity. Transcript or recording metadata remains supplemental and cannot independently satisfy the attendance-duration threshold.

Evidence collected before calculation version 2 is not silently reinterpreted as full-day evidence. It continues through the prior exact-window path until refreshed.

## Decision boundary

This evidence model does **not** define a hard attendance threshold yet.

AV4 must calibrate thresholds against real Tiny Steps classes before any automatic class-proof decision is trusted. Examples such as 50%, 70%, 80% or 90% are not policy until calibration explicitly adopts them.

The evidence layer may produce validation classifications such as:

- `Verified`
- `Probable`
- `Needs Review`
- `Unmatched`
- `Missing Evidence`
- `Attendance Conflict`

These are validation classifications, **not new attendance statuses**.

AV5 later reconciles the validation result against the existing Tiny Steps operational status.

## Recording policy

Recording existence may be stored as an availability signal if Microsoft exposes it, but recording content is not required for the attendance validator.

No attendance decision may depend on a recording existing.

Downloading, retaining or analyzing child video/audio recordings requires a separate explicit privacy and retention decision and is outside this contract.

## Transcript policy

Transcript presence can strengthen proof that meaningful teaching occurred.

Rules:

- no transcript does not mean `Absent`;
- speaker attribution is useful but not mandatory;
- full transcript bodies should not be permanently persisted in Firestore by default;
- store transcript IDs, availability, timestamps, derived features and any privacy-approved brief summary/hash needed for validation;
- fetch full transcript content only when authorized processing or admin review requires it.

## Identity model

A learner may join Teams as:

- their own Microsoft identity;
- a parent identity;
- a family account;
- an iPad/device name;
- a guest identity;
- another known alias.

Therefore participant identity resolution belongs to AV3. AV4 consumes AV3's confidence/mapping result instead of guessing from display names.

## Brick ownership

### AV1 — Microsoft Graph Foundation

Must expose the raw meeting, attendance-report, attendance-record, interval and transcript APIs needed by this contract. It does not calculate attendance.

### AV2 — Teams Evidence Collector

Collects and normalizes raw meeting evidence into validation-owned storage. It preserves raw join/leave intervals and computes deterministic participation metrics without changing attendance.

### AV3 — Identity Bridge

Maps organizer/participant evidence to Tiny Steps teacher, enrollment and learner identities, including known parent/device aliases.

### AV4 — Session Matching & Class-Proof Engine

Uses scheduled-session identity, teacher/learner participation, scheduled-window overlap, duration and supplemental transcript signals to assign validation confidence/classification. Thresholds are calibrated here.

### AV5 — Attendance Reconciliation

Compares class-proof results with canonical Tiny Steps attendance and creates validation cases. It does not directly modify operational attendance.

## Core invariant

> Collect objective meeting evidence so Tiny Steps' existing attendance can be independently verified. Do not turn Teams evidence into a replacement attendance system.
