# Rolling Schedule — Brick 9: Monthly Planned Analytics Projection

## Scope

Brick 9 moves the **scheduled-month management forecast** away from requiring a physically pre-generated classSession for every planned class in the selected month.

It does not change actual billing, settlements, attendance, teacher earnings, historical correction, session materialization, lifecycle, or the 14-day operational horizon.

## Forecast authority

### Historical month

A month before the current IST month remains **actual-session based**.

- persisted regular schedule sessions are counted;
- current enrollment lifecycle does not erase historical delivery evidence;
- makeup, reschedule, manual/one-off and other schedule exceptions stay outside the regular planned-session metric;
- cancelled and existing non-planned statuses keep the previous exclusion semantics.

### Current month

The month is intentionally hybrid.

- dates through **today IST** use persisted real sessions;
- dates after today use canonical rolling recurrence for active enrollments;
- if a real regular session already exists for a future recurrence occurrence, that real document overrides the synthetic forecast status and fee evidence;
- a persisted cancelled/rescheduled recurrence occurrence therefore removes that occurrence from the planned total;
- a stale far-future session that no longer belongs to the current canonical recurrence does not inflate the forecast.

### Future month

For an active canonical rolling enrollment, the full month is recurrence-derived from:

- canonical `schedule.weeklySlots`;
- `classesStartDateYmd` lower bound;
- the Brick 1 recurrence engine;
- the Brick 2 rolling enrollment lifecycle contract.

No far-future classSession creation is required merely to show the management forecast.

Paused, discontinued, terminal and otherwise inactive rolling enrollments do not generate speculative future planned occurrences.

## Real-session overrides

A persisted regular schedule session wins over a recurrence projection when either:

- its deterministic session ID matches the recurrence occurrence; or
- its enrollment/date/start-time identity matches a legacy/nonstandard real document.

Exception sessions are intentionally excluded from the override index, so a makeup or manual class occurring at the same time cannot accidentally replace the regular recurrence occurrence in the management plan.

## Legacy compatibility

Unconverted legacy schedules remain **real-session only**. Brick 9 does not infer an endless future plan from legacy finite schedule fields.

Regular legacy sources recognized for actual compatibility are:

- `enrollmentSchedule`;
- `enrollmentScheduleReplace`;
- `enrollmentScheduleRepair`;
- source-less historical regular rows;
- the rolling source `rolling_schedule`.

`weeksAhead`, `plannedSessions` and `endDateYmd` are never used as forecast stopping rules for canonical rolling recurrence.

## Revenue forecast

The scheduled revenue estimate uses the same planned occurrence set.

For a persisted real occurrence, immutable `billingRateSnapshot` is preferred when available, followed by the existing session/enrollment/course fee fallbacks. A recurrence-only future occurrence uses enrollment/course fee configuration.

Missing fee configuration is counted explicitly; revenue is never invented.

## Actual finance remains unchanged

Brick 9 does **not** replace any actual-money authority.

- billed revenue remains the canonical finance aggregate;
- settled revenue remains the canonical finance aggregate;
- completed billed session count remains charge-ledger based;
- teacher earnings remain certified rollup / teacherEarnings-ledger based;
- session net revenue remains based on actual session charges minus actual teacher earnings.

The existing “Estimated Teacher Payout (Planned)” remains an estimate only: recurrence-derived planned session count × realized average payout per session.

## Firestore/read budget

No new Firestore dataset or query is introduced.

Finance and Delivery already load the selected-month `classSessions`, enrollments and courses. Brick 9 performs the recurrence calculation in memory from those existing datasets.

The projection helper itself imports no Firebase API and performs no reads or writes.

## Explicit non-goals

Brick 9 does not:

- widen the real-session horizon beyond today + 14 days;
- persist analytics projection rows;
- create billing charges or teacher earnings from projections;
- change P4 attendance authority;
- change parent/teacher calendar projection behavior from Brick 8;
- clean up legacy far-future documents;
- remove legacy backend finite scheduler callables;
- merge anything to `main`.

Legacy retirement / optional targeted cleanup remains the final cutover brick after the analytics dependency is removed.
