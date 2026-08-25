# Parent Dashboard Rebuild

The parent dashboard is being rebuilt as a sequence of independently reviewable bricks.

## Architecture rule

Parent-facing screens present facts owned by canonical operational systems. A metric may be displayed in more than one place, but its business meaning is defined once and consumers must not invent alternate calculations.

## Bricks

- **P1 — Canonical Data Contract:** class, lesson, skill, child-identity, and finance scopes plus invariants. No production behaviour changes.
- **P2 — Teacher → Learning Contract:** explicit teacher-controlled lesson status and canonical lesson review writes.
- **P3 — Course Progress Projection:** one canonical course/stage completion projection.
- **P4 — Classes & Attendance Projection:** child-scoped monthly class/attendance semantics.
- **P5 — Parent Overview:** rebuild the overview from canonical projections only.
- **P6 — Detailed Lesson Progress:** reconciled course/stage/lesson tracker.
- **P7 — Skills & Teacher Feedback:** teacher evidence without duplicate learning calculations.
- **P8 — Classes Experience:** operational class history, attendance, cancellations and reschedules.
- **P9 — Payments / Wallet:** family and child billing scopes made explicit.
- **P10 — Legacy Retirement:** remove obsolete calculations/fallbacks only after the new path is proven.

## Current contract docs

- `brick-p1-data-contract.md` — semantic foundation and invariants.
- `brick-p2-teacher-learning-contract.md` — teacher-owned lesson completion and learning evidence writes.
