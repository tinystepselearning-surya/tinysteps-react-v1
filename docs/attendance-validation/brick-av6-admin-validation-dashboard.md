# AV6 — Admin Attendance Validation Dashboard

Status: **implemented as a read-only, bounded admin view over AV5.3 validation-side cases. No correction workflow, production AVS scheduler, or operational attendance mutation is introduced in this brick.**

## Purpose

AV6 gives Tiny Steps admins one operational screen for inspecting AVS results without opening Firestore or reading raw Teams evidence.

Admin path:

    /surya?tab=attendance-validation

Route aliases:

    /surya/attendance-validation
    /admin/attendance-validation

The dashboard is available only inside the existing admin area.

## What the dashboard shows

The page reads saved validation-side case documents only after the admin selects a service-date range and clicks **Load Saved Results**. It displays:

- observed time;
- class session ID;
- Tiny Steps attendance;
- AVS Present / Absent / Review decision;
- AV0-style case classification;
- recommended action;
- resolution status;
- enrollment, kid, teacher, evidence and run IDs on inspection;
- reconciliation/proof/identity/staff-registry signals already stored on the case.

No additional child, parent, teacher, enrollment, billing or finance lookup is performed.

## Firestore read budget

AV6 deliberately does not use a realtime listener and no longer auto-loads AVS cases merely because the admin opens the page.

A saved-result request performs a service-date-bounded query:

    attendanceValidationCases
    where serviceDateYmd >= selectedFrom
    where serviceDateYmd <= selectedTo
    orderBy serviceDateYmd desc
    limit 100

The first page therefore reads at most **100 saved case documents**. Additional pages are loaded only when the admin explicitly clicks **Load next 100 saved results**.

Changing the date inputs, search text, or classification tab causes **zero Firestore reads** until a load action is clicked.

There are no reads from:

- classSessions;
- users;
- kids;
- enrollments;
- billingCharges;
- teacherEarnings;
- rescheduleCredits.

Summary cards are computed from the already-loaded 100-document window. They are explicitly labelled as loaded-window counts and must not be interpreted as whole-history totals.

## September 2026 scope

The dashboard reflects the permanent AVS scope established in AV5.3:

    validation start date = 2026-09-01

July and August 2026 are not backfilled.

The producer-side AV5.3 scope guard remains the authority for excluding pre-September sessions. AV6 does not perform a historical operational scan to rediscover that boundary.

## Read-only safety

AV6 exposes no browser mutation action.

The screen has no:

- correction button;
- attendance update;
- billing action;
- teacher-pay action;
- reschedule action;
- case-resolution writer.

Firestore rules permit admins to read:

    attendanceValidationCases/{caseId}

Browser clients are denied create/update/delete access to that collection.

Trusted Admin SDK AVS code remains the only writer.

## Privacy and read minimization

AV6 intentionally displays validation IDs and signals already persisted on the case.

It does not resolve IDs into names by reading users/kids/enrollments. This avoids extra Firestore reads and keeps the dashboard aligned with the privacy-minimized AVS sidecar architecture.

If richer human-readable snapshots are needed later, they should be added to the validation case at production-run time rather than causing N+1 dashboard lookups.

## Date range and result tabs

The dashboard now separates cached viewing from future revalidation work:

- **From / To** choose the Tiny Steps service-date range;
- **Load Saved Results** reads cached AVS cases only;
- **Run Latest Check** is a separate control reserved for the later changed-only backend brick;
- classification navigation is presented as horizontal button tabs rather than a select menu;
- ID search remains client-side across the already-loaded cases.

Tabs include:

- All;
- Verified;
- Missing attendance;
- Conflict;
- False present;
- Missing Teams;
- Orphan;
- Ambiguous.

Switching tabs or search terms causes **zero additional Firestore reads**.

## Empty state

Opening the page performs no case query. The initial state asks the admin to choose a date range and load saved results.

If the selected range has no saved AVS cases, the dashboard says so explicitly. This remains a valid state until a production validation run has created cases for that range.

## Explicitly deferred

AV6 does not:

- activate AV5.3 in production;
- execute the disabled **Run Latest Check** control;
- schedule Teams/Firestore validation;
- mutate attendance;
- approve corrections;
- resolve cases;
- invoke existing attendance-correction pathways;
- calibrate overlap thresholds.

Approved correction workflow remains AV7.

## Core invariant

> AV6 may inspect a bounded set of validation-side cases. It may not read broad operational collections or mutate attendance, finance, earnings, credits or reschedules.
