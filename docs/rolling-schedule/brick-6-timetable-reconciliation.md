# Rolling Schedule Brick 6 — bounded timetable reconciliation

## Purpose

Brick 6 allows an already-rolling enrollment to change its recurring timetable without falling back to the legacy finite scheduler and without broad-scanning `classSessions`.

The edit boundary is the same operational horizon used everywhere else in the rolling program: **today through today + 14 days (Asia/Kolkata)**.

## Reconciliation model

For an existing rolling enrollment, the server computes two deterministic recurrence sets for the same 14-day window:

1. occurrences from the currently persisted recurrence;
2. occurrences from the requested recurrence.

It then reconciles only the union of those deterministic session IDs:

- **stale** — old occurrence ID no longer present in the new recurrence;
- **retained** — same date/time ID still exists and may need a duration/schedule metadata patch;
- **added** — new occurrence ID that the rolling materializer may create.

There is no `classSessions where enrollmentId == ...` query and no attempt to rewrite historical sessions.

## Protected records

A timetable edit must not cancel or mutate a session when any of the following applies:

- occurrence is not in the future;
- attendance already exists;
- session is completed/consumed/settled/paid/locked or otherwise protected;
- billing or teacher-earning linkage exists inline;
- a `billingCharges/{sessionId}` or `teacherEarnings/{sessionId}` record exists;
- session is a makeup, manual one-off, reschedule, replacement, approved-request or historical exception;
- deterministic ID is occupied by another enrollment.

Protected stale records are left untouched. Existing canonical readers can exclude stale normal records after the enrollment recurrence changes.

## Mutable versus immutable fields

For a safe retained future regular session, Brick 6 may update only timetable-delivery fields such as:

- start/end time;
- duration;
- schedule revision and occurrence key;
- rolling source/delivery metadata;
- current enrollment join URL;
- update audit fields.

Brick 6 deliberately does **not** rewrite immutable financial snapshot fields on an already-created session. Billing and teacher-pay snapshots stay tied to the session creation contract.

## Edit rollback/retry safety

The enrollment stores a reconciliation marker containing the previous schedule, previous class-start boundary, target fingerprint and target revision.

The schedule pointer is suspended while reconciliation/refill is incomplete. If materialization fails after the bounded schedule transaction commits, the state is marked `failed`, the worker due pointer remains null, and the same requested timetable can be retried using the stored previous schedule without advancing the revision a second time.

If an occurrence was cancelled by an earlier Brick 6 timetable edit and a later timetable brings that exact occurrence back, it may be restored only when the cancellation marker proves it was created by rolling timetable reconciliation and the session is still unprotected.

## Paused enrollments

A paused rolling enrollment may save a timetable change, but Brick 6 does not generate active sessions or arm the due pointer while it remains paused. Normal Brick 5 Resume semantics perform the 14-day refill when delivery becomes active again.

## Explicitly out of scope

Brick 6 does not:

- switch the admin UI to the rolling callables;
- alter teacher reassignment behavior;
- alter parent or teacher long-range calendar projection;
- alter monthly forecasting/analytics;
- migrate or bulk-prune legacy far-future sessions;
- change attendance correction, makeup/reschedule, billing, teacher earnings or historical correction semantics;
- merge anything into `main`.

Those remain later integration bricks.
