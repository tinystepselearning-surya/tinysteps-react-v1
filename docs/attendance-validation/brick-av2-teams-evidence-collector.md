# AV2 — Teams Evidence Collector

Status: **implemented as an evidence-only backend library; no scheduled production collector is exported or activated in this brick.**

AV2 converts raw Microsoft Teams meeting artifacts into auditable Tiny Steps attendance-validation evidence without changing operational attendance, finance, reschedules, teacher earnings, or correction records.

## Hard boundary

AV2 inherits the AV0/AV1 invariant:

> Attendance Validation may READ operational Tiny Steps data and Microsoft Teams evidence. It may WRITE only validation-owned collections. It must not directly mutate operational attendance or financial collections.

AV2 writes only:

- `attendanceValidationRuns`
- `attendanceValidationEvidence`

It does not write:

- `classSessions`
- `enrollments`
- `billingCharges`
- `teacherEarnings`
- `rescheduleCredits`
- attendance correction records
- any other operational collection

## What this brick adds

### 1. Deterministic interval normalization

`functions/src/attendanceValidation/evidenceIntervals.ts`

AV2 preserves raw Microsoft join/leave intervals, then derives auditable metrics from normalized interval unions.

Rules:

- preserve every raw source interval in stored evidence;
- reject malformed, missing or non-positive intervals from derived-time calculations;
- merge overlapping, duplicate and directly adjacent valid intervals to avoid double counting;
- never replace multiple source intervals with only first-join/last-leave evidence;
- clip scheduled dwell to `[scheduledStart, scheduledEnd]`;
- derive percentages from the scheduled Tiny Steps duration and bound them to `0–100%`;
- provide pair-overlap utilities for AV3/AV4 after identity resolution.

AV2 can therefore calculate participant-level:

```text
observedSeconds
scheduledSeconds
scheduledDwellPercentage
firstJoinDateTime
lastLeaveDateTime
```

and can calculate overlap between any two interval sets without assigning identities.

## 2. Teams evidence collection

`functions/src/attendanceValidation/teamsEvidenceCollector.ts`

For one expected Tiny Steps session, the collector:

1. validates and snapshots the Tiny Steps session reference;
2. hashes the stored Teams join URL instead of persisting it in clear text;
3. resolves the scheduled Teams `onlineMeeting` through AV1;
4. lists transcript metadata;
5. lists attendance reports;
6. lists participant attendance records per report;
7. preserves raw participant join/leave intervals;
8. calculates participant-level interval metrics;
9. stores artifact completeness and collection issues explicitly;
10. emits one validation run record + one evidence document.

## 3. Privacy-minimized identity hints

AV2 deliberately does **not** decide which Teams participant is the teacher or learner. That belongs to AV3.

To support AV3 without unnecessarily persisting personal identifiers:

- participant email addresses are lower-cased and SHA-256 hashed before persistence;
- Microsoft identity IDs are SHA-256 hashed before persistence;
- display names are not persisted by AV2;
- full Graph identity payloads are not persisted;
- the Teams join URL is hashed;
- transcript body/content is not fetched or stored by AV2;
- meeting passcodes, access tokens and Graph credentials are never stored.

Raw participant record IDs and Microsoft attendance-report IDs are retained because they are artifact identifiers required for auditability and repeatable Graph retrieval.

## 4. Completeness is explicit

AV2 never silently treats a first Graph page as complete.

If Microsoft returns `@odata.nextLink`, the evidence document is marked `partial` and records that another page exists. Pagination traversal is intentionally deferred rather than pretending the evidence is complete.

The same rule applies independently to:

- transcripts;
- attendance reports;
- attendance records for each report.

## 5. Missing evidence never becomes absence

Collection states are evidence-pipeline states only:

```text
complete
partial
missing_reference
meeting_not_found
failed
```

Examples:

- missing Tiny Steps join URL → `missing_reference`
- Teams meeting cannot be resolved → `meeting_not_found`
- transcript API disabled → `partial`
- attendance records rate-limited after bounded AV1 retries → `partial`
- application-access-policy failure → `failed` or `partial` depending on collection stage
- malformed interval → retained as raw source evidence but excluded from derived duration

None of these states changes or implies Tiny Steps `Present`, `Absent`, or `Rescheduled`.

## 6. Firestore persistence adapter

`functions/src/attendanceValidation/evidenceStore.ts`

The adapter atomically batches the run + evidence writes into only the validation-owned collections:

```text
attendanceValidationRuns/{runId}
attendanceValidationEvidence/{evidenceId}
```

Documents are merge-written to make retries idempotent for the same deterministic run/evidence identifiers.

## Evidence schema highlights

Evidence documents include:

```text
schemaVersion
calculationVersion
runId
source
collectionStatus
collectedAt
organizerUserId
session snapshot
meeting metadata
transcript metadata
attendance reports
participant records
raw attendance intervals
participant interval metrics
artifact completeness
artifact availability
collection issues
```

`recordingAvailable` remains `null` in AV2 because recording evidence is not required and recording-content handling remains outside the current privacy contract.

## AV2 deliberately does not do

AV2 does **not**:

- map Teams participant identities to Tiny Steps teacher/student identities;
- infer identity from display name;
- decide Present/Absent/Rescheduled;
- calculate teacher–learner overlap as an attendance conclusion;
- classify a class as Verified/Probable/Conflict;
- create validation cases;
- correct operational attendance;
- change billing or teacher earnings;
- consume/create reschedule credits;
- fetch or persist complete transcript bodies;
- download/analyze recordings;
- export a scheduled Firebase collector;
- bind the Microsoft Graph production secret.

## Brick handoff

### AV3 — Identity Bridge

AV3 will map privacy-minimized participant evidence to Tiny Steps teacher, learner, parent/device and approved alias identities. After AV3 produces mappings, the overlap utilities already implemented in AV2 can calculate teacher–learner overlap without guessing.

### AV4 — Session Matching & Class-Proof

AV4 will calibrate thresholds and assign validation classifications using scheduled-window overlap plus supplemental evidence. AV2 contains no hard attendance threshold.

### AV5 — Reconciliation

AV5 will compare validation classifications with canonical Tiny Steps attendance and create review cases. It still will not directly mutate attendance.

## Production activation gate

AV2 library code may merge before Microsoft production credentials are configured because it exports no new scheduled Cloud Function.

Do not deploy an active Graph collector until the AV1 service-principal gate is complete:

```text
[ ] Entra application created
[ ] Application permissions + admin consent complete
[ ] organizer-scoped application access policy complete
[ ] Graph transcript access configured
[ ] server-side secret created
[ ] app-only token exchange verified
[ ] known meeting resolution verified
[ ] transcript metadata verified
[ ] attendance reports verified
[ ] attendance records with join/leave intervals verified
```

## Core invariant

> AV2 records what Microsoft Teams can objectively prove and what it cannot prove. It does not replace Tiny Steps attendance and it never converts missing evidence into learner absence.
