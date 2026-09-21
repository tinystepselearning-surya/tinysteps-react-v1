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

It does not use `classSessions` to discover changed work.

Instead it discovers changed work only from:

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

If that case already has an `evidenceId`, the callable feeds the explicit session/evidence pair back through AV5.3. AV5.3 keeps the two exact point reads for each work item and may additionally perform one bounded same-service-date `classSessions` context query per represented date. That bounded query is used only to count same enrollment + learner + teacher rows currently marked Present so the >25-minute-per-Present rule can be applied safely to multi-session days.

The same-day context query never discovers new AVS work and never mutates operational attendance.

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

## Brick 6B — first-time date-range Teams evidence collection

First-Time Baseline is the explicit Graph-backed path for a date range that has never been validated before.

It remains separate from:

- **Load Saved Results** — cached case reads only;
- **Run Latest Check** — changed-only reconciliation against cached evidence;
- **Force Fresh Teams Evidence** — one existing case, explicitly re-read from Graph.

### Range gate

The callable accepts `fromDate` / `toDate` with these hard limits:

- permanent lower bound: **2026-09-01**;
- maximum range: **31 calendar days**;
- `toDate` must be **yesterday IST or earlier**.

The completed-date rule prevents the first-time cursor from stepping past a class that has not finished yet.

### Bounded cursor

Each explicit click scans at most **100 session documents plus one lookahead session**.

The cursor is persisted in the backend-only collection `attendanceValidationBaselineRanges/{rangeId}` using the selected from/to dates, last service date, last session document id, cumulative scanned/existing/fresh/blocked counts, and completion status.

The browser cannot read or write this cursor collection.

When the same exact range is already complete, the callable returns after only the baseline-state check: **0 Graph calls, 0 session scan, 0 AV5.3 run**.

### Existing cases are never fresh-refetched

For every baseline batch, AVS point-reads the corresponding deterministic validation-case ids. If a case already exists, baseline reuses it and performs no Teams collection for that session. Only sessions without a saved AVS case enter first-time evidence collection.

### Organizer resolution

Organizer identity stays server-side and is resolved once per invocation from the canonical AVS Teams organizer configuration.

Teacher email, teacher UPN, display name, session organizer fields, and stale evidence are not used as Microsoft Graph organizer fallbacks.

If the canonical organizer cannot be resolved, the session is not dropped. It is routed through AV5.3 as **MISSING_TEAMS_EVIDENCE / REVIEW** using a deterministic missing-evidence placeholder id. Missing or failed Graph evidence never becomes Absent.

### Session snapshot

First-time collection needs no prior AV2 document. The baseline snapshot reconstructs enrollment id, canonical teacher id (including supported legacy aliases), kid id, course id, current Tiny Steps attendance, current Teams join URL, and scheduled start/end.

Timing precedence is persisted `startAt/endAt`, then IST `date + startTime/endTime`, then duration fallback from `durationMinutes/durationMins`. Malformed or unresolved timing fails closed and becomes a visible Missing Teams Evidence case.

### Graph and AVS flow

`classSession -> organizer resolution -> AV1 Graph client -> AV2/AV2.1 occurrence-safe Teams evidence -> attendanceValidationRuns/evidence -> one shared AV5.3 batch -> attendanceValidationCases`

For operational Present rows, the AV5.3 batch uses the adopted strict production rule on the **IST service date**: verified expected-teacher + learner overlap must be greater than 25:00 per Tiny Steps Present row. Two Present rows therefore require >50:00 total same-day overlap. Non-Present rows retain scheduled-window occurrence matching. All identity and evidence-completeness gates still apply.

### Read budget

For one maximum 100-session batch, the explicit upper bound before the shared staff-registry load is:

- 1 baseline-state read;
- up to 101 session-query documents (100 + one lookahead);
- up to 100 validation-case point reads;
- up to 1 canonical organizer-config read when fresh evidence is needed;
- up to 200 AV5.3 point reads.

That is a conservative ceiling of **403 bounded reads plus one shared staff-registry load**. Most batches are lower because existing AVS cases do not enter fresh collection. The callable returns actual counters for every batch.

### Graph budget

At most 100 sessions enter fresh collection per click. A normal complete Teams occurrence uses up to four logical Graph operations: meeting resolution, transcript metadata list, attendance-report list, and selected attendance-record list. The normal logical-call ceiling is therefore approximately **400 logical Graph calls** per batch. Transport retries inside `MicrosoftGraphClient` are not counted as additional logical operations.

### Writes and safety

Brick 6B writes only AVS-owned baseline cursor/progress, AV2 run/evidence sidecars, and AV5.3 validation cases. It does **not** write operational attendance, class-session scheduling fields, billing, payments, teacher earnings, reschedule credits, or correction records.

### Admin UI

The Attendance Validation page exposes a separate **Run First-Time Baseline** button. It asks for confirmation because Graph calls may occur, shows batch and cumulative progress plus Firestore/Graph counts, changes to **Continue Baseline** while more cursor batches remain, changes to **Baseline Complete** for the same completed range, and automatically reloads the selected saved-results range after every batch.

### Firestore index

The repository explicitly declares the cursor query index `classSessions: date ASC, __name__ ASC` so first production use does not depend on an implicit index assumption.

## Brick 6C — cached multi-teacher identity rollout

After the production Riya calibration established the correct stable-identity behavior, AVS generalizes that identity binding without adding another Cloud Function export.

The existing admin-only callable `runAttendanceValidationLatestCheck` accepts an explicit `identity_rollout` mode. Reusing the existing export avoids a global `functions/src/index.ts` topology change and therefore keeps deployment impact bounded to the existing latest-check function plus Hosting.

### Identity proof

For every cached AVS case in the selected range, the rollout considers the referenced cached AV2 evidence only when:

- the case teacher id matches the evidence-session teacher id;
- the active Tiny Steps user is a canonical `teacher`;
- the teacher has one unique canonical Tiny Steps email hash;
- exactly one attendance report is selected;
- attendance-report and attendance-record collection is complete;
- a participant email hash equals that teacher email hash;
- that participant exposes exactly one stable Microsoft identity hash.

Display names never participate.

The mapping is rejected when:

- the teacher is missing from the active staff registry;
- the teacher email is missing or shared;
- cached evidence yields zero or multiple stable identities;
- the teacher already has a different stable identity;
- the candidate identity belongs to another staff member;
- an existing identity override is disabled or conflicts.

Only hashes are stored.

### Cached revalidation

After safe identity mappings are written, cached AVS cases are rerun through AV3/AV4/AV5 from their existing evidence documents. This path makes **0 Microsoft Graph calls**.

Cases already resolved through AV7 admin correction are deliberately skipped so the rollout cannot erase an approved resolution audit link.

The selected date range remains capped at 31 days, and a single rollout run accepts at most 500 cached AVS cases. Larger ranges must be narrowed explicitly.

### Teacher filter reset

Changing the teacher filter now also resets:

- classification tab -> All;
- local search -> empty;
- expanded case -> closed.

This prevents a teacher from appearing to have no classes merely because a classification/search filter from the previously selected teacher is still active.

## Brick 6D — same-day coverage and multi-session duration allocation

Fresh Teams collection now treats the Tiny Steps IST service date as authoritative for **Present** attendance. The stored scheduled clock time may differ from the actual meeting time because a class can be rescheduled within the same day.

AV2 calculation version 2 retains every complete attendance report from the same IST service date and fetches attendance records for each selected report.

AV5.3 then evaluates one group at a time:

```text
serviceDateYmd + enrollmentId + kidId + teacherId
```

and applies:

```text
required overlap = Present session count × 1,500 seconds
comparison       = strictly greater than
```

Examples:

- one Present row + 35 minutes verified overlap -> Verified;
- two Present rows + one 35-minute Teams class -> Review;
- two Present rows + 50:00 exactly -> Review;
- two Present rows + 65 minutes verified overlap -> both Verified.

Raw teacher/learner overlap intervals are unioned and repeated Teams report ids are deduplicated, preventing double counting.

Non-Present rows do not inherit pooled shifted evidence. They continue through scheduled-window matching so a real class elsewhere on the same date cannot validate an unrelated unmarked slot.

Older calculation-version-1 cached evidence continues through legacy exact-window logic until Force Fresh or a new baseline produces version-2 evidence.

## Still deferred

Brick 6B still does **not** introduce:

- any scheduler or polling;
- automatic attendance correction;
- automatic finance mutation;
- an unbounded Graph scan.
