# Rolling Schedule — Brick 7 Admin Cutover

## Scope

Brick 7 switches the primary Students scheduling modal from the legacy finite-session controls to the rolling scheduling backend built in Bricks 1–6.

## Admin experience

The schedule modal keeps only the inputs that define the enrollment and its weekly timetable:

- enrollment/course
- fee per class
- enrollment start date
- classes start date
- weekly recurring slots
- Teams meeting link

The following finite controls are removed from the UI and from schedule-save payloads:

- generate for N weeks
- planned classes
- scheduling end date
- pause next N sessions

The UI states that recurrence is continuous while the enrollment is active and that only the next 14 days are operationally materialized.

## Save routing

- Legacy/non-rolling enrollment: `saveRollingEnrollmentSchedule` converts the existing timetable on first save.
- Canonical rolling enrollment: `reconcileRollingEnrollmentSchedule` applies bounded timetable reconciliation.
- No direct `classSessions` writes are performed by the UI.

Legacy schedule fields remain readable in the local enrollment type so an existing enrollment can be opened and converted without a database-wide migration. They are not sent as generation limits.

## Lifecycle routing

For canonical rolling enrollments the modal exposes:

- Pause schedule — indefinite until Resume
- Resume schedule
- Discontinue enrollment

These actions use `setRollingEnrollmentLifecycle`.

The existing student-enrollment discontinue action also detects canonical rolling enrollments and uses `setRollingEnrollmentLifecycle`; legacy enrollments retain the existing `setEnrollmentStatus` fallback until converted.

## Firestore/read behavior

The scheduling modal no longer performs a broad `classSessions where enrollmentId == ...` scan to calculate finite planned-class progress. Rolling status is derived from the enrollment document already loaded by the student-management query.

No migration, far-future session deletion, analytics change, parent/teacher calendar projection, teacher reassignment change, historical-attendance change, makeup/reschedule change, or finance-ledger change is part of this brick.

## Protected invariants

- Past/completed/billed/locked sessions remain untouched by the UI.
- Makeup, reschedule, manual and historical sessions remain outside recurring-schedule mutation.
- Existing legacy enrollments are converted only when explicitly saved by an admin; no mass conversion occurs.
- Terminal enrollments cannot be edited from the rolling schedule modal.
- Production `main` remains untouched until the entire rolling-schedule program is reconciled and approved.
