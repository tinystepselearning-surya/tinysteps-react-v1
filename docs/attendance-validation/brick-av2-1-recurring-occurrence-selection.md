# AV2.1 — Recurring Teams Occurrence Selection

Status: **complete — implemented, production-proven on a real recurring Tiny Steps class, and temporary proof endpoint retired from source.**

AV2.1 hardens AV2 for recurring Microsoft Teams meetings, where one meeting identity can expose multiple transcript artifacts and multiple attendance reports across different class occurrences.

## Goal

Select the single Microsoft Teams occurrence that corresponds to the canonical Tiny Steps class-session window before any attendance records are collected.

AV2.1 remains evidence-only. It does not decide Present/Absent/Rescheduled and does not mutate operational attendance or finance.

## Implementation

`functions/src/attendanceValidation/occurrenceSelectingGraphClient.ts` decorates the AV1 Graph client for one expected class-session window.

The selector:

- validates the canonical scheduled start/end window;
- requires attendance reports to contain usable meeting start/end timestamps;
- computes overlap between each attendance report and the scheduled class window;
- rejects reports with no overlap;
- selects the unique report with the strongest overlap;
- fails closed on equal-best ambiguity instead of guessing;
- allows only the selected attendance report to reach the attendance-record fetch path;
- filters transcript metadata to the same scheduled occurrence with bounded timing tolerance;
- preserves pagination/completeness signals rather than treating partial Graph pages as complete.

## Production proof — 2026-09-19

A private, temporary production-proof Function exercised AV2 + AV2.1 against one real completed Tiny Steps recurring class using the exact canonical Firestore session window and the enrollment-bound Teams join URL.

Sanitized proof result:

```text
proofContractVersion: 1
ok: true
collectionStatus: complete
meetingResolved: true
selectedTranscriptCount: 1
selectedAttendanceReportCount: 1
selectedAttendanceRecordCount: 2
transcriptsComplete: true
attendanceReportsComplete: true
attendanceRecordsComplete: true
issueKinds: []
operationalMutationAllowed: false
```

The scheduled class window used for occurrence selection was:

```text
2026-09-16 20:00–20:35 Asia/Kolkata
2026-09-16 14:30–15:05 UTC
```

The proof demonstrated the key AV2.1 invariant: from a recurring Teams meeting that exposes multiple historical artifacts, only the single attendance report corresponding to the expected Tiny Steps scheduled class was selected.

## Persistence verification

The production proof wrote only the validation-owned sidecars:

- `attendanceValidationRuns`
- `attendanceValidationEvidence`

Both documents were read back successfully from production Firestore.

Verified state:

```text
run status: complete
evidence collection status: complete
attendance report count: 1
transcript count: 1
issue count: 0
operationalMutationAllowed: false
```

The Firestore REST representation of an empty issues array was `{"arrayValue":{}}`; an explicit null/array check confirmed the real issue count was zero.

No `classSessions`, `enrollments`, billing, teacher earnings, reschedule credits, or attendance-correction records were written by the proof.

## Privacy boundary

The repository does not record the production student name, participant names, participant email addresses, organizer object ID, Teams join URL, meeting code/passcode, transcript body, Microsoft access token, tenant ID, client ID, or client secret.

The durable proof record is limited to sanitized counts, completeness state, timing, and architecture-level conclusions.

## Temporary endpoint retirement

The private `runAv2TeamsEvidenceProof` endpoint existed only to establish the production proof.

After the proof passed:

- the production evidence sidecars were retained for auditability;
- the temporary Function export was removed from `functions/src/index.ts`;
- the temporary endpoint source module was removed;
- the deployment impact resolver was hardened so this explicitly allowlisted proof-function retirement does not trigger an unnecessary full-fleet Functions deployment;
- deletion of the already-deployed Cloud Function is performed as an explicit production cleanup mutation.

The occurrence-selection library and its regression tests remain because they are part of the AV2.1 runtime evidence contract consumed by later AVS bricks.

## Handoff

AV2 + AV2.1 are complete and production-proven.

AV3/AV3.1 provide identity mapping and stable-identity precedence.
AV4 provides the session-proof engine.
AV5 can consume these proven inputs to produce validation recommendations while preserving the rule that operational attendance is changed only through an approved correction path.
