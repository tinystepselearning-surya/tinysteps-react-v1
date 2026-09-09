# Rolling Schedule — Brick 1: Pure Recurrence Engine

## Scope

Brick 1 adds a deterministic, side-effect-free recurrence calculator only.

It does **not** read Firestore, write Firestore, change enrollment state, generate classSessions, alter lifecycle actions, change parent/teacher UI, or modify finance/attendance behavior.

## Contract

The engine:

- treats enrollment weekly recurrence as the future planning source;
- supports canonical `weeklySlots` plus the existing legacy `weekdays + timeHHmm + durationMins` shape;
- uses the existing Tiny Steps scheduling timezone, `Asia/Kolkata`;
- enumerates occurrences only inside an explicitly requested inclusive date range;
- never emits an occurrence before `classesStartDateYmd`;
- has no `plannedSessions`, `weeksAhead`, or normal end-date stopping rule;
- produces deterministic occurrence keys and the existing deterministic session ID shape: `enrollmentId_YYYYMMDD_HHMM`;
- rejects conflicting same-weekday/same-time slots that would collide on that deterministic session ID;
- keeps all date arithmetic independent from browser/server local timezone.

## Why this brick is isolated

Later bricks will use this same recurrence semantics for materialization and display/forecast projections. Brick 1 itself is intentionally not wired into production readers or writers, so it cannot change existing operations.

## Gate before Brick 2

- recurrence unit tests green;
- full repository CI green;
- no production source path imports the new engine yet;
- diff remains limited to the engine, its tests, and this documentation.
