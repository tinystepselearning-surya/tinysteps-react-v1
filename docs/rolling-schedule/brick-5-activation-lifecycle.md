# Rolling Schedule — Brick 5: Activation & Lifecycle Wiring

## Scope

Brick 5 connects the inert rolling primitives from Bricks 1–4 to explicit admin-only backend entry points while keeping the existing production admin UI and legacy finite scheduler untouched.

It introduces two new callables:

- `saveRollingEnrollmentSchedule`
- `setRollingEnrollmentLifecycle`

The current `saveEnrollmentScheduleAndGenerateSessions`, `pauseEnrollmentUpcomingSessions`, `resumeEnrollmentSchedule`, and `setEnrollmentStatus` callables remain available and unchanged in this brick. The admin UI does not switch to the new callables until the later cutover brick.

## Schedule activation

`saveRollingEnrollmentSchedule` accepts the operational schedule data already used by the admin form:

- enrollment ID;
- enrollment start date;
- classes start date;
- fee per class;
- currency;
- Teams join URL;
- weekly recurring slots;
- optional idempotency key.

It writes the canonical rolling contract:

```ts
schedule: {
  schemaVersion: 1,
  deliveryMode: 'rolling',
  timezone: 'Asia/Kolkata',
  revision: 1,
  weeklySlots: [...],
}
```

The finite stop fields are explicitly removed during activation:

- `schedule.weeksAhead`
- `schedule.plannedSessions`
- `schedule.endDateYmd`

Legacy `weekdays`, `timeHHmm`, and `durationMins` aliases are temporarily retained for reader compatibility only. They do not control recurrence.

For an operational enrollment, activation immediately invokes Brick 3's deterministic materializer for exactly `today + 14 days`. For a paused enrollment, the recurrence is saved but the due pointer remains suspended and no new sessions are generated.

## Safe Brick 5 boundary for schedule edits

Brick 5 supports first activation and idempotent re-saves of the same recurrence. If an enrollment is already canonical rolling and its weekday/time/duration/start-date recurrence changes, Brick 5 fails closed rather than leaving stale future sessions behind.

Bounded timetable-edit reconciliation is intentionally deferred to the next brick.

## Lifecycle semantics

`setRollingEnrollmentLifecycle` recognizes only:

- `active` / `resume`
- `paused` / `pause`
- `discontinued` / `discontinue`

The enrollment `status` field remains the lifecycle source of truth. No duplicate `isActive` or `scheduleEnabled` boolean is introduced.

### Pause

Pause is indefinite. The operation:

1. sets enrollment status to `paused`;
2. clears `nextOccurrenceYmd` and `nextMaterializationDueYmd` so the daily worker has no due work;
3. point-reads only deterministic recurrence session IDs inside the current 14-day operational window;
4. cancels only untouched future regular sessions;
5. preserves historical, manual, makeup, reschedule, attendance-linked, finance-linked, completed, locked, and already-cancelled sessions.

No full enrollment session scan is used.

### Resume

Resume is permitted only from a non-terminal rolling enrollment. Before status changes, Brick 5 preflights that the recurrence is still materializable with a canonical teacher, valid schedule, and financial terms.

The operation then:

1. changes status to `active`;
2. preserves/reacquires the operational child+course enrollment key;
3. restores only future sessions that were specifically cancelled by rolling Pause;
4. immediately rematerializes the exact 14-day window;
5. restores the due pointer for Brick 4 edge replenishment.

Manual or discontinued cancellations are never automatically restored.

### Discontinue

Discontinue is terminal in the rolling lifecycle. It:

1. sets status to `discontinued`;
2. releases the operational child+course key;
3. clears the rolling due pointer;
4. safely cancels only untouched regular sessions inside the 14-day operational window;
5. preserves all historical, attendance, finance, makeup, reschedule, manual, and protected records.

## Firestore read/write discipline

Lifecycle session work is bounded by the same 14-day recurrence identities as the materializer. Session discovery uses deterministic point reads, not:

```ts
classSessions.where('enrollmentId', '==', enrollmentId)
```

Finance protection uses exact deterministic `billingCharges/{sessionId}` and `teacherEarnings/{sessionId}` point reads.

## Worker race hardening

Brick 4's daily due query returns a snapshot that could theoretically become stale if an admin pauses/discontinues an enrollment during the same run. Brick 5 hardens the worker by re-reading each due enrollment immediately before edge-plan construction. Because Pause/Discontinue clears the due pointer first, a stale due-query snapshot cannot normally generate a post-pause session.

This adds at most one bounded enrollment read per due enrollment, not one read per active student.

## Explicit non-goals

Brick 5 does not:

- switch the admin UI to rolling callables;
- remove the legacy finite callable exports;
- implement rolling schedule-time edits;
- reconcile teacher reassignment;
- change parent or teacher long-range calendars;
- change monthly analytics;
- migrate or prune existing far-future sessions;
- alter attendance, historical correction, makeup, reschedule, or actual finance logic;
- merge anything to `main`.

Those remain later bricks.
