# Parent Dashboard Rebuild — Brick P4 Classes & Attendance Projection

Status: **stacked implementation** on P3. Do not merge independently ahead of P1/P2/P3 review.

## Goal

Create one canonical parent-month / child read model for operational classes and attendance so every parent-facing class count has one semantic owner and a missing selected-child row is never replaced with family totals.

Canonical storage remains inside the existing bounded parent monthly read model:

```text
parentMonthlyReadModels/{parentId}/months/{monthKey}.attendance
```

Schema:

```text
schemaVersion = 3
modelType = class_attendance_v3
classAuthority = class_sessions
attendanceAuthority = completed_session_attendance
childRowsAuthoritative = true
```

## Canonical child scope

The authoritative consumer row is:

```text
attendance.byKid[kidId]
```

`kidId` / `kidIds` are the canonical class-session child identities.

Legacy aliases such as `studentId`, `studentUid`, `childId`, or `linkedStudentId` are migration diagnostics only. They do not create competing parent child rows.

A class session with no canonical child identity is counted in diagnostics as an unassigned source record and is not written under a fabricated `_unassigned` child.

If the selected child row does not exist, later parent UI bricks must show the class/attendance view as unavailable. They must not fall back to parent totals.

## Class lifecycle semantics

Every child-scoped session in the requested month is counted exactly once in one lifecycle bucket:

```text
completedSessions
scheduledSessions
inProgressSessions
cancelledSessions
noShowSessions
rescheduleRequestedSessions
rescheduledSessions
otherSessions
```

Invariant:

```text
completedSessions
+ scheduledSessions
+ inProgressSessions
+ cancelledSessions
+ noShowSessions
+ rescheduleRequestedSessions
+ rescheduledSessions
+ otherSessions
= totalSessions
```

Canonical legacy normalization includes:

- blank / upcoming / planned / open -> `scheduled`
- `inprogress` -> `in_progress`
- `canceled` -> `cancelled`
- `noshow` -> `no_show`
- `reschedule-requested` -> `reschedule_requested`

Unknown operational states remain visible under `otherSessions` instead of disappearing from totals.

## Upcoming vs unresolved past

Scheduled and in-progress sessions are partitioned by their scheduled start time:

```text
upcomingSessions
unresolvedPastSessions
pendingTimeUnknownSessions
```

Invariant:

```text
upcomingSessions
+ unresolvedPastSessions
+ pendingTimeUnknownSessions
= scheduledSessions + inProgressSessions
```

P4 deliberately does **not** add an hourly refresh function. An hourly parent/month refresh would reintroduce unnecessary Firestore reads.

Instead each child row stores the bounded list:

```text
pendingSessionStartAtMs[]
```

A shared parent selector can recalculate `upcomingSessions` vs `unresolvedPastSessions` from that same read model at display time. This makes the time-sensitive classification current without another Firestore query and without screen-specific business logic.

`date + startTime` legacy sessions are interpreted in IST when `startAt` is unavailable. A date without a time is classified under `pendingTimeUnknownSessions` rather than incorrectly assuming midnight.

## Attendance semantics

Attendance is a separate fact from class lifecycle.

P4 keeps attendance tied to completed class sessions. For completed sessions:

```text
presentSessions
lateSessions
absentSessions
attendanceMarkedSessions
attendanceUnmarkedCompletedSessions
attendancePct
```

`no_show` inside a completed attendance entry is normalized to absent. A class whose lifecycle status itself is `no_show` remains a class lifecycle fact and does not automatically become marked completed attendance.

Invariants:

```text
presentSessions + lateSessions + absentSessions = attendanceMarkedSessions
```

and:

```text
attendanceMarkedSessions + attendanceUnmarkedCompletedSessions = completedSessions
```

Attendance percentage:

```text
attendancePct = (presentSessions + lateSessions) / attendanceMarkedSessions
```

when attendance has been marked; otherwise it is `0`.

## Parent totals

The read model retains `attendance.totals` for compatibility/diagnostics, but explicitly marks:

```text
totalsScope = parent_month_child_session_instances
```

For a group class with two children, parent totals contain two child-session instances while each child row contains one session. Parent totals are therefore not a substitute for a selected child's row.

## Read-cost controls

P4 preserves the bounded V2 query strategy:

- normal source query: `parentId + date` bounded to the requested month;
- hard parent-month cap: 250 source sessions;
- capped compatibility path for legacy no-date records / genuine missing-index errors;
- hard compatibility history cap: 500 records;
- metadata-only session writes exit before any projection query.

This keeps the architecture compatible with the Firestore read-spike mitigation work already completed.

## Compatibility

The deployed Cloud Function export remains:

```text
onClassSessionReadModelWrite
```

`functions/src/parentMonthlyAttendanceProjection.ts` remains a compatibility barrel and now exports the V3 implementation. Deployment therefore replaces the old writer instead of adding a second competing trigger.

The V3 rows also retain deprecated V2 scalar aliases (`total`, `completed`, `scheduled`, `upcoming`, etc.) derived from the canonical fields. These aliases exist only to keep current parent consumers safe until P5/P8 cut over; they are not a second calculation.

## Explicitly deferred

P4 does **not**:

- redesign Parent Overview (P5);
- rebuild detailed lesson progress (P6);
- change teacher skill/mastery presentation (P7);
- redesign the Classes UI (P8);
- change billing/wallet semantics (P9);
- remove all old parent class queries or compatibility aliases yet (P10);
- add broad scheduled polling/backfill jobs.

P5 and P8 should consume the strict selected-child P4 selector rather than re-deriving class/attendance business meaning.
