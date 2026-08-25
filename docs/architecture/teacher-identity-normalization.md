# Teacher identity normalization

## Canonical contract

For operational records such as `enrollments` and `classSessions`, the canonical teacher ownership field is:

```text
teacherId = Firebase Authentication UID of the teacher
```

The following fields are legacy compatibility aliases and are not independent ownership concepts:

- `teacherIds`
- `assignedTeacherId`
- `primaryTeacherId`
- `teacherUid`
- `teacher_id`

`kids.teacherIds` is intentionally excluded from this rule because a child can legitimately have multiple teachers across different courses.

## Why this is staged

Existing production data and older readers still use legacy aliases. Removing aliases in one deployment could hide sessions, break historical ownership, or interfere with teacher reassignment. The migration therefore remains zero-downtime and compatibility-first.

## Phase B1 — contract and audit

- Define `teacherId` as the canonical field in one shared client contract.
- Keep current alias readers unchanged in behavior.
- Centralize the teacher-session fallback alias list so new readers cannot invent another field name.
- Add a bounded, read-only production audit for active enrollments and future sessions.
- Do not mutate production documents.
- Do not delete indexes or security-rule compatibility.

## Phase B2 — canonical writers

After the B1 audit is reviewed:

- Make every active enrollment/session writer resolve one canonical teacher UID first.
- Continue compatibility aliases temporarily, but derive them only from canonical `teacherId` so aliases cannot disagree.
- Cover enrollment creation, scheduled session generation, makeup sessions, historical admin sessions, and teacher transfers.
- Reject ambiguous writes rather than persisting conflicting teacher ownership.

## Phase B3 — bounded backfill decision

- Run a dry-run report first.
- Backfill only documents that are missing `teacherId` and whose canonical teacher can be determined safely.
- Never infer teacher ownership only from current child ownership when historical/reassignment context is unavailable.
- Do not rewrite historical teacher ownership merely because a child's current teacher changed.
- Preserve reassignment history as the source of truth for historical transitions.
- A record with no canonical teacher and no legacy teacher references is **not** an automatic backfill candidate.

### Production dry-run result — 2026-08-25

The bounded production audit scanned 107 operational enrollments and 142 current/future class sessions.

- 106/107 operational enrollments already contained canonical `teacherId`.
- One active enrollment had no canonical teacher and no legacy teacher references.
- That enrollment also had no schedule configuration and no open future sessions in the bounded operational session set, so there was no trustworthy teacher identity to infer.
- 142/142 current/future class sessions contained canonical `teacherId`.
- There were zero legacy-only enrollment or class-session records in the operational sample.
- Six enrollments and three scheduled sessions had legacy alias fields that disagreed with an already-present canonical `teacherId`.

**B3 decision: zero production backfill writes.** The single missing enrollment is left untouched rather than guessing an assignment. Records that already contain canonical `teacherId` are not rewritten merely to cosmetically align aliases; B2 prevents new mismatches, B4 moves normal readers to the canonical field, and B5 retires the redundant aliases after fallback usage reaches zero.

This is intentionally safer than forcing every active enrollment to have a teacher: enrollment creation can legitimately exist before a teacher has been assigned.

## Phase B4 — read cutover

- Measure legacy fallback usage.
- When active/future operational documents consistently contain canonical `teacherId`, stop issuing alias queries on normal teacher screens.
- Keep an explicit, bounded legacy-history compatibility path where required.

## Phase B5 — retirement

Only after fallback usage is effectively zero:

- stop writing legacy aliases;
- remove obsolete alias indexes;
- simplify Firestore rules;
- remove compatibility code;
- optionally clean redundant alias fields from documents in a separately reviewed migration.

## Non-negotiable behavior

Normalization must not change:

- which teacher can see a class;
- teacher transfers or transfer history;
- completed or historical attendance ownership;
- teacher earnings attribution;
- parent class visibility;
- join links or scheduling;
- admin reassignment behavior;
- Firestore authorization semantics during the compatibility phase.

## Read-only audit

Run with an authenticated operator/service account that has read access:

```bash
node scripts/audit-teacher-identity.mjs --project tinysteps-react-v1
```

Optional arguments:

```bash
--limit 250
--start-date YYYY-MM-DD
--summary-only
```

The script is intentionally bounded to at most 500 documents per collection and performs no writes. It reports missing canonical IDs, aliases that disagree with `teacherId`, status-level coverage, and summary-only evidence for whether a missing enrollment has an operational future-session teacher signal.
