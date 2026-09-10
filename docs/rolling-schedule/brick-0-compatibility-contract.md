# Rolling Schedule — Brick 0 Compatibility Contract

## Purpose

Brick 0 introduces no production scheduling behaviour. It freezes the existing product contracts that the rolling recurring schedule must preserve before later bricks change session materialization.

## Non-negotiable compatibility rules

1. **Parent operational horizon remains 14 days.**
   - Today / Upcoming reads stay bounded to the existing `PARENT_UPCOMING_CLASS_DAYS = 14` policy.
   - Parent calendar remains capable of representing a complete selected month.
   - Historical class views remain history-capable rather than being restricted to the rolling horizon.

2. **Enrollment recurrence remains the schedule source of truth.**
   - Canonical schedule shape is `schedule.weeklySlots`.
   - Legacy `weekdays + timeHHmm + durationMins` remains readable during migration.
   - Finite `plannedSessions`, `weeksAhead`, and `endDateYmd` are not removed in Brick 0; later bricks will stop using them as delivery caps only after compatibility is proven.

3. **Existing class-session integrity remains authoritative.**
   - Ordinary recurring sessions must match enrollment identity, weekday, time, and duration.
   - Inactive/paused enrollment sessions must not become operationally visible merely because a session document exists.

4. **Schedule exceptions remain separate.**
   - Makeup, reschedule, approved one-off/manual, ad-hoc, and replacement sessions are not forced to match the weekly recurrence slot.
   - Rolling schedule reconciliation must not rewrite or delete these exception sessions.

5. **Historical attendance correction remains isolated.**
   - Historical correction must not reactivate enrollments.
   - Historical correction must not regenerate recurring schedules.
   - It may create an audited completed historical session so existing attendance/finance logic can operate normally.

6. **Finance remains session-based.**
   - Parent billing and teacher earnings continue to derive from real `classSessions` and their attendance/completion state.
   - Immutable financial terms remain versioned session snapshots (`billingRateSnapshot`, `teacherPayRateSnapshot`, currency, snapshot version).
   - Recurrence/projection rows must never themselves create financial entries.

7. **No bulk migration in Brick 0.**
   - No existing enrollment or session is rewritten.
   - No Firestore trigger behaviour is changed.
   - No UI field is removed.

## Brick 0 acceptance gate

Brick 0 is green only when:

- the new compatibility-contract test suite passes;
- the existing repository test suite remains green;
- typecheck/build/CI remain green;
- the PR contains no runtime production-code changes.

## Planned sequence after Brick 0

- **Brick 1 — Recurrence Core:** pure recurrence/date materialization helpers, still no scheduler activation.
- **Brick 2 — Enrollment Schedule Contract:** introduce rolling-schedule metadata and backward-compatible writes while retaining old fields for existing records.
- **Brick 3 — 14-Day Materializer:** deterministic bounded session creation with complete financial snapshots; no scheduled worker yet.
- **Brick 4 — Due Pointer + Worker:** bounded due-enrollment query and idempotent rolling replenishment.
- **Brick 5 — Admin Schedule UI:** remove planned-session/weeks/end-date controls from the normal admission workflow and expose Active/Pause lifecycle cleanly.
- **Brick 6 — Lifecycle Reconciliation:** bound pause/resume, schedule edit, teacher reassignment, and course-transition repair to the real rolling window.
- **Brick 7 — Parent/Teacher Calendar Projection:** display recurrence-derived planned dates beyond the materialized 14-day horizon without creating session documents.
- **Brick 8 — Analytics Planned Projection:** calculate planned monthly sessions/revenue from recurrence plus real-session overrides while leaving actual finance unchanged.
- **Brick 9 — Legacy Cutover & Cleanup:** compatibility telemetry, controlled retirement of finite delivery caps, and only then optional targeted cleanup.

Each brick must be reviewed independently before proceeding to the next one.
