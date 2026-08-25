# Brick P2 — Acceptance Checklist

## Teacher contract

- [x] Teacher explicitly chooses `in_progress` or `completed`.
- [x] Skill mastery is independent from lesson completion.
- [x] Existing ratings/strengths/practice areas/remarks remain intact.
- [x] New/legacy records adopt explicit status only through a teacher save.
- [x] Completed timestamp is written only when transitioning into completed.
- [x] Ordinary edits to an already completed lesson do not reset completion time.
- [x] Reopening a lesson returns it to in progress without deleting learning evidence.

## Safety boundaries

- [x] No class/attendance semantics changed.
- [x] No billing/finance semantics changed.
- [x] No bulk production migration or backfill.
- [x] No duplicate progress collection introduced.
- [x] Parent course-progress projection remains a P3 responsibility.

## Merge gates

- [ ] Brick P1 is merged first.
- [ ] Exact-head full CI is green.
- [ ] P3 projection cutover is reviewed before enabling the new lesson status as the parent completion source.
- [ ] Final diff review confirms no unrelated operational changes.
