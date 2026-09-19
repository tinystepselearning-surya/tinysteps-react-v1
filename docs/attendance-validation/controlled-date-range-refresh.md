# Attendance Validation — Controlled Date-Range Refresh

Status: **in progress on Draft PR #403.**

This work adds the admin workflow approved after AV8 without introducing scheduled polling.

## Architecture

The admin screen separates three concepts:

1. **Load Saved Results** — read cached AVS cases for an explicit service-date range.
2. **Run Latest Check** — later backend step that processes only sessions known to have changed or evidence known to be incomplete.
3. **Force Fresh Teams Evidence** — later exceptional action that deliberately re-queries Microsoft Graph.

These operations must never be presented as the same kind of refresh.

## Brick 1 — canonical service date

AV5.3 case schema v2 persists:

```text
serviceDateYmd
```

This is the exact IST date already resolved by AV5.3's September-2026 scope check. No extra Firestore read is introduced.

## Brick 2 — cached date-range UI

The Admin Attendance Validation page now:

- performs **no AVS case read on page-open**;
- defaults the selectable lower bound to 2026-09-01;
- loads cached results only after **Load Saved Results** is clicked;
- queries only `attendanceValidationCases` by `serviceDateYmd`;
- limits each page to 100 saved case documents;
- supports explicit pagination;
- keeps search local to loaded cases;
- replaces the classification select with horizontal button tabs.

The disabled **Run Latest Check** button intentionally remains separate until its backend is complete.

## Brick 3 — zero-scan changed-session markers

To avoid polling or rescanning historical sessions, Tiny Steps writes one small validation-owned sidecar when canonical attendance actually changes:

```text
attendanceValidationDirtySessions/{sessionId}
```

A marker contains:

- `sessionId`;
- `serviceDateYmd`;
- reason;
- server `dirtyAt`;
- schema version;
- `operationalMutationAllowed = false`.

The marker is written only after the operational attendance batch has committed.

### Sources currently covered

- teacher attendance changes through `saveTeacherSessionProgress`;
- admin corrections through `adminAttendanceCorrection`.

The comparison normalizes canonical aliases before deciding whether attendance changed, so:

- Present -> Present with notes edited: no dirty write;
- Late -> Present: no dirty write;
- No Show -> Absent: no dirty write;
- Absent -> Present: dirty write;
- Present -> Rescheduled: dirty write.

### Failure boundary

Dirty-marker persistence is best-effort.

If its sidecar write fails:

- the teacher/admin attendance change remains committed;
- billing/teacher-pay behavior is unchanged;
- the error is logged for AVS diagnostics;
- AVS never becomes a dependency of the operational attendance writer.

### Cost model

There is:

- no scheduler;
- no Firestore collection scan;
- no read-before-write;
- no Graph call.

A real attendance status change adds at most **one validation-owned Firestore write**.

The browser is denied all access to the dirty-session collection. A later admin-only backend callable will consume these markers.

## Still deferred

This document does not yet activate:

- first-time date-range evidence collection;
- dirty-marker consumption;
- Microsoft Graph refresh;
- automatic corrections;
- any scheduled job.
