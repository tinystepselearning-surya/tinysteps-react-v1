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

## Brick 6A — Fresh-evidence backend foundation

Brick 6A prepares the Microsoft Graph path without exporting or invoking a new Graph-backed callable.

### Session snapshot contract

`buildAvsEvidenceSessionSnapshot` converts one already-loaded `classSessions` document into the existing AV2 `ExpectedClassSessionSnapshot` contract.

It resolves:

- canonical service date;
- scheduled start/end from persisted timestamps or IST date/time fields;
- enrollment, teacher, kid and course IDs already present on the session;
- Teams link from `joinUrl`, then legacy `meetingLink` / `classLink`;
- canonical current attendance.

It fails closed for:

- unresolved service date;
- unresolved start/end time;
- classes that have not ended yet;
- cancelled/canceled/rescheduled sessions.

No enrollment, kid or teacher lookup is introduced by this helper.

### Stable evidence identity

Fresh evidence uses a stable SHA-256-derived run ID per `classSessionId`.

This is important because AV2's evidence document ID incorporates `runId`. A stable per-session run ID means repeated fresh checks for the same class overwrite that class's validation evidence instead of creating an unbounded new evidence document on every click.

### Explicit Graph limits

The fresh path constants are intentionally conservative:

```text
maximum selected range: 31 calendar days
maximum initial discovery: 500 class sessions
maximum Microsoft Graph batch: 10 class sessions
```

These are backend safety bounds, not an invitation to poll.

### Organizer resolution

The Microsoft organizer object ID remains server-side.

The backend first checks:

```text
attendanceValidationConfig/teams
```

Browser reads and writes to this collection are denied.

If config is absent, the resolver may inspect at most 25 existing AV2 evidence documents. Bootstrap is allowed only if those documents prove **exactly one** non-empty organizer ID.

- zero organizer IDs → fail closed;
- more than one organizer ID → fail closed;
- exactly one → persist it to the backend-only config once.

This reuses the already-proven AV2 production evidence without exposing the organizer ID to React code or inventing an unverified organizer.

Brick 6A performs no Graph call by itself and exports no new Cloud Function.

## Brick 6A — per-case Force Fresh Teams Evidence

Force Fresh is intentionally separate from cached viewing and changed-only Latest Check.

It is available only for an existing session-backed AVS case that already has:

- a current `classSessionId`;
- cached Teams evidence;
- an exact AVS `inputFingerprint`.

The browser sends only:

```text
caseId
inputFingerprint
```

The backend rereads the exact case and rejects the request if the fingerprint has changed.

### Organizer identity

Brick 6A does **not** introduce a new browser-visible organizer identifier and does not assume a global organizer.

The Microsoft organizer object ID is reused from the case's previous AV2 evidence document.

That makes Force Fresh safe for an already-known case without solving first-time organizer discovery prematurely.

### Fresh evidence flow

```text
exact AVS case
        ↓
prior AV2 evidence
        ↓
current classSession
        ↓
current Teams join URL + scheduled window
        ↓
Microsoft Graph fresh read
        ↓
new attendanceValidationRun
new attendanceValidationEvidence
        ↓
AV5.3 rerun with strict >25-minute overlap rule
        ↓
same AVS case rebuilt
```

The current operational session is used for the current join link, session identity, attendance and start/end timestamps.

If current legacy timing fields are absent, the previous evidence window is used as a fallback.

The previous evidence join URL cannot be reused because AV2 intentionally persists only its hash.

### Scope and cost

Force Fresh processes **one AVS case per click**.

Before the shared AV3 staff-registry load, the Firestore read budget is:

```text
1 validation case
+ 1 classSession
+ 1 previous evidence document
+ 1 dirty marker
+ 2 AV5.3 point reads
= 6 bounded reads
```

The callable also reports logical Graph method calls. A normal complete occurrence commonly requires meeting resolution, transcript listing, attendance-report listing and selected attendance-record retrieval, but the actual count is returned rather than assumed.

### Safety

Force Fresh:

- is admin-only;
- binds all three existing Microsoft Graph secrets server-side;
- requires exact case fingerprint match;
- never writes operational attendance;
- never writes billing or teacher earnings;
- writes only AVS run/evidence/case sidecars;
- clears an existing dirty marker only after the case is rebuilt;
- uses a `lastUpdateTime` precondition so a newer attendance change cannot be erased;
- automatically reloads the selected saved-results range after completion.

The Admin UI presents Force Fresh as an explicit per-case action and asks for confirmation because it makes new Microsoft Graph reads.

## Still deferred

This document does not yet activate:

- first-time date-range Teams evidence collection for sessions with no prior AVS evidence;
- automatic corrections;
- any scheduled job.
