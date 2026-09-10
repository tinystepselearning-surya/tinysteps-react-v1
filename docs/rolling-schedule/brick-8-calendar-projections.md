# Brick 8 — Parent and teacher long-range calendar projections

## Scope

Brick 8 keeps the physical `classSessions` store bounded to the rolling operational horizon while allowing parent and teacher calendars to display recurring classes beyond that horizon.

No projection created by this brick is persisted to Firestore.

## Authority

- Brick 1 `rollingScheduleRecurrence` remains the recurrence calculator.
- Brick 2 `enrollmentRollingScheduleContract` remains the enrollment schedule/lifecycle authority.
- Only canonical rolling enrollments in the active lifecycle state may produce speculative calendar rows.
- Paused, terminal, inactive and not-yet-converted legacy enrollments produce no speculative rows.

## Physical vs display-only boundary

`ROLLING_SCHEDULE_HORIZON_DAYS` is 14. Real operational sessions remain authoritative from today through today + 14 inclusive.

Projection begins at today + 15. If the requested calendar range ends inside the physical horizon, the projection helper returns no rows.

## Real-session override

A persisted `classSessions` document always wins over a recurrence projection for the same enrollment/date/start-time occurrence. This includes persisted cancelled or otherwise non-operational rows. Projection must never resurrect or conceal a real session state.

## Parent behavior

- Today and Upcoming continue to consume real canonical session documents only.
- Upcoming remains the existing 14-day operational view.
- The full class calendar combines real rows with display-only projections beyond the physical horizon.
- Projected rows cannot open a class link or become an actionable parent session.
- Attendance/history/billing calculations are unchanged.

## Teacher behavior

- Month/week/workweek/day calendar ranges combine real sessions with display-only recurrence rows where the range extends beyond the physical horizon.
- The already-existing teacher enrollment query retains the schedule rows it has already read; Brick 8 adds no second enrollment query for projection.
- Projected rows cannot open attendance. They are explicitly identified as planned recurring entries until the real session is materialized.
- Makeup/reschedule credits and other persisted exceptions remain real-session workflows.

## Non-goals

Brick 8 does not change monthly planned analytics, finance, billing, historical correction, session materialization, the rolling worker, lifecycle reconciliation, or legacy far-future cleanup. Monthly planned analytics remains a later brick.
