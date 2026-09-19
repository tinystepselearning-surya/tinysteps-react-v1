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

## Brick 4 — changed-only latest check with cached Teams evidence

The admin-only callable:

```text
runAttendanceValidationLatestCheck
```

accepts one explicit `fromDate / toDate` range and supports at most **31 calendar days** per request.

It does not scan `classSessions`.

Instead it queries only:

```text
attendanceValidationDirtySessions
where serviceDateYmd >= fromDate
where serviceDateYmd <= toDate
orderBy serviceDateYmd
limit 100
```

For each returned dirty session it performs one exact read of:

```text
attendanceValidationCases/{sessionId}
```

If that case already has an `evidenceId`, the callable feeds the explicit session/evidence pair back through the existing AV5.3 runner. AV5.3 then performs its existing two exact point reads:

```text
classSessions/{sessionId}
attendanceValidationEvidence/{evidenceId}
```

and reruns identity, session proof, the strict >25-minute overlap rule, classification and reconciliation against the **current** Tiny Steps attendance.

### Read formula

For:

- `N` dirty markers found in the selected range;
- `M` of those already having cached evidence;

the bounded read budget before the shared staff-registry load is:

```text
N dirty-marker reads
+ N validation-case point reads
+ 2M AV5.3 point reads
= 2N + 2M
```

The staff registry is still loaded once for the AV5.3 batch, never once per session.

The callable returns these read counters to the admin client so the operation remains auditable.

### Baseline-required sessions

If a dirty session has no existing case or no cached `evidenceId`, Brick 4 does **not** call Graph and does not guess.

It returns that session under:

```text
baselineRequiredSessionIds
```

and keeps its dirty marker for the later first-time/fresh-evidence brick.

### Safe marker clearing

Only sessions that AV5.3 successfully reprocessed are eligible for dirty-marker deletion.

Deletion uses the marker's Firestore `lastUpdateTime` precondition.

If attendance changes again while validation is running, the marker update makes the guarded delete fail. The callable then keeps the marker so the newer change is picked up next time.

A guarded-delete failure does not undo the newly written AVS case and does not touch operational attendance.

### Explicit non-features

Brick 4 has:

- **0 Microsoft Graph calls**;
- no scheduler;
- no `classSessions` date-range scan;
- no attendance writer;
- no finance or teacher-pay writer;
- no automatic correction.

## Brick 5 — Admin Latest Check wiring

The Attendance Validation page now invokes the changed-only callable only when the admin explicitly clicks **Run Latest Check**.

UI behavior:

1. validate the selected date range;
2. enforce the backend's maximum 31-calendar-day Latest Check window;
3. call `runAttendanceValidationLatestCheck` in `asia-south1`;
4. show the returned changed-session/revalidation/read-budget summary;
5. automatically reload **saved AVS results for the same selected range**;
6. preserve the admin's active classification tab during that automatic reload.

The result summary explicitly shows:

- dirty sessions found;
- sessions revalidated from cached Teams evidence;
- sessions that still need first-time/fresh Teams evidence;
- bounded Firestore reads excluding the shared staff-registry load;
- whether the staff registry was loaded;
- Microsoft Graph call count;
- dirty markers cleared;
- skipped sessions;
- the 100-dirty-session cap condition;
- concurrent dirty-marker retention.

The Brick-5 path makes **zero Microsoft Graph calls**. It remains distinct from the future **Force Fresh Teams Evidence** action.

Cached viewing remains independent: **Load Saved Results** does not invoke the latest-check callable.

## Still deferred

This document does not yet activate:

- first-time date-range Teams evidence collection;
- Microsoft Graph refresh for missing/partial evidence;
- automatic corrections;
- any scheduled job.
