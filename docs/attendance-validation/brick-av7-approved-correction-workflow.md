# AV7 — Approved Attendance Validation Correction Workflow

Status: **implemented as an admin-approved bridge from AVS cases into the existing Tiny Steps attendance-correction pathway. AV7 does not introduce a second operational attendance writer.**

## Purpose

AV7 closes the loop between a reviewable `attendanceValidationCases` document and the already-existing admin attendance-correction workflow.

The flow is:

```text
AV6 validation case
        ↓
admin clicks Review correction
        ↓
existing Attendance Corrections workflow
        ↓
teacher-pay / finance safeguards remain active
        ↓
existing adminAttendanceCorrection callable
        ↓
attendance + correction audit + finance reconciliation
        ↓
AV7 resolution record + case resolution link
```

## Eligible cases

AV7 may bridge only cases that are still:

```text
resolutionStatus = needs_review
```

and whose AV5.2 recommendation is exactly one of:

```text
correct_to_present
correct_to_absent
```

Cases whose recommendation is `review` or `none` remain non-operational. AV7 does not convert ambiguous, missing-evidence, reschedule-conflict, or orphan cases into attendance mutations.

## Existing correction pathway remains authoritative

AV7 does **not** create a new correction callable.

The operational mutation remains:

```text
adminAttendanceCorrection
```

That existing function continues to own:

- class-session attendance changes;
- the `attendanceCorrections` audit record;
- billing reconciliation;
- teacher-earning reconciliation;
- teacher-pay decision enforcement;
- existing financial failed-precondition safeguards.

The AVS linkage is optional metadata on that existing call.

## Stale-case protection

The dashboard passes both:

```text
validationCaseId
validationCaseFingerprint
```

The server re-reads the validation case before applying the correction and rejects the request unless all of the following still match:

- case document exists;
- fingerprint is unchanged;
- class session matches;
- student matches;
- recommendation is an approvable correction;
- requested new attendance matches the AVS recommendation;
- AVS decision matches the requested status;
- current Tiny Steps attendance still matches the attendance captured by the AVS case;
- case is still `needs_review`;
- the exact case revision has not already been resolved.

If attendance or AVS state changed after the dashboard was loaded, the correction fails closed and the admin must refresh AVS.

## Admin review surface

The AV6 dashboard remains bounded to its existing 100-case one-shot read.

For eligible rows it now exposes:

```text
Review correction
```

That action navigates to the existing Attendance Corrections panel with the case/session/student/fingerprint/status pre-linked.

Inside the correction panel:

- the session is loaded by one exact `classSessions/{sessionId}` point read;
- teacher/date/student/session/new-status are locked to the AVS recommendation;
- the reason remains editable;
- existing teacher-payment controls remain active;
- create-missing-session mode is disabled for AVS-linked corrections.

No broad AVS-driven operational scan is introduced.

## Resolution persistence

When the existing correction succeeds, the same operational write batch also writes validation-owned linkage:

```text
attendanceValidationResolutions/{caseId}__{fingerprint-prefix}
attendanceValidationCases/{caseId}
```

The resolution records:

- validation case id;
- input fingerprint;
- approved action;
- session id;
- student id;
- previous attendance;
- corrected attendance;
- attendance correction id;
- approving admin identity;
- reason;
- server resolution timestamp.

The case is marked:

```text
resolutionStatus = resolved
resolutionDecision = approved_correction
resolutionId
attendanceCorrectionId
resolvedAction
resolvedAt
resolvedBy*
```

The deterministic resolution id prevents duplicate approval of the same exact AVS case revision while still permitting a later AVS revision with a new fingerprint.

## Safety boundary

AV7 preserves the AV0 architecture contract:

- AVS producer/validator code still writes only validation-owned collections.
- AV7 does not auto-correct attendance.
- Every correction requires an authenticated admin action.
- The operational attendance mutation is executed only by the pre-existing admin correction pathway.
- Existing teacher-pay and finance safeguards are not bypassed.
- Rescheduled/conflicted cases are not automatically rewritten.
- Browser code does not directly write AVS case or resolution documents.
- No new scheduler, Firestore trigger, or autonomous correction worker is added.

## Failure behavior

AV7 fails closed.

Examples:

- stale AVS fingerprint -> reject;
- session/student mismatch -> reject;
- current attendance changed since validation -> reject;
- recommendation is only `review` -> reject;
- requested status differs from recommendation -> reject;
- same case revision already resolved -> reject;
- existing finance/teacher-pay safety check fails -> existing correction failure is preserved and no AV7 resolution is written.

Because the resolution write shares the existing correction batch, a successful AV7-linked correction cannot leave the operational correction committed without its AV7 resolution link.

## Explicitly not included

AV7 does not:

- activate the AV5.3 production shadow workload;
- auto-approve corrections;
- auto-correct cases from confidence scores;
- correct rescheduled cases;
- create missing operational sessions from orphan AVS evidence;
- resolve ambiguous/review-only cases;
- tune AVS thresholds;
- change AV5.3 read budgets.

Threshold calibration remains AV8.
