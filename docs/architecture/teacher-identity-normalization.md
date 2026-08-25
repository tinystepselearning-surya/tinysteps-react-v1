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

**B3 decision: zero production backfill writes.** The single missing enrollment is left untouched rather than guessing an assignment. The nine records that already contain canonical `teacherId` are not physically rewritten in B3; B2 prevents new mismatches and B5 will retire or clean the redundant aliases through a separately controlled migration.

This is intentionally safer than forcing every active enrollment to have a teacher: enrollment creation can legitimately exist before a teacher has been assigned.

### B3 production execution outcome

Two guarded physical-repair approaches were evaluated and stopped without changing production data:

- An atomic Admin SDK transaction was denied because the CI service account intentionally has no Firestore document-write IAM.
- A Firebase Security Rules-authenticated transaction could not create its temporary custom token because that service account intentionally lacks `iam.serviceAccounts.signBlob`.

No broad IAM role was granted and neither failure produced a partial write. A fresh bounded read-only audit on 2026-08-25 again found exactly 107 operational enrollments, 142 current/future sessions, six enrollment alias mismatches, and three scheduled-session alias mismatches. It also verified that the nine canonical user records exist and have teacher role, and found no mismatched non-scheduled session target.

No existing privileged callable is narrow enough for this repair. The teacher reassignment and transferred-session repair callables update broader identity, scheduling, join-link, child ownership, or audit state by design, so reusing them for alias-only cleanup would violate the B3 scope.

### B3 authorization hardening

Firestore teacher authorization for `enrollments` and `classSessions` is canonical-first:

- when the document contains `teacherId`, only that canonical UID can authorize teacher access;
- legacy aliases cannot expand access when `teacherId` exists, even if an alias is stale;
- direct legacy document reads retain an alias fallback only when the `teacherId` field is absent;
- teacher collection queries are canonical-only because an alias-constrained Firestore query cannot prove that every matching document lacks `teacherId`;
- admin and parent authorization paths are unchanged.

This neutralizes the authorization risk from the nine stale records while deferring their physical cleanup to B5. Operational teacher readers already query canonical `teacherId` first; optional alias queries fail closed without discarding successful canonical results. Focused emulator tests cover canonical teacher document and query access, stale-alias document and query denial, unrelated teacher denial, legacy-by-ID fallback, admin and parent access, and post-reassignment denial for the old alias teacher.

### Trigger safety review

Current production code has one enrollment trigger and three class-session triggers in scope:

- enrollment message-thread sync compares child, parent, teacher, LP, and status identity fields; an alias-only enrollment rewrite could sync a thread because `teacherIds` participates in that fingerprint, but it cannot regenerate sessions or touch finance;
- session revenue processing exits immediately for scheduled-to-scheduled writes before any accrual or reversal;
- the active parent attendance projection fingerprint excludes teacher aliases, so alias-only session writes exit before projection reads;
- no class-session trigger schedules reminders, regenerates sessions, recalculates attendance, changes join links, or enters lead/demo workflows.

Because B3 performs no production writes, none of these triggers is invoked by the closeout.

## Phase B4 — read cutover

- Measure legacy fallback usage.
- When active/future operational documents consistently contain canonical `teacherId`, stop issuing alias queries on normal teacher screens.
- Keep an explicit, bounded legacy-history compatibility path where required.

### B4 execution outcome — 2026-08-25

- Today/Schedule, Upcoming Sessions, My Students, the Schedule student selector, and the teacher-student enrollment loader now use canonical operational teacher reads.
- The active teacher paths no longer issue collection queries on `teacherIds`, `assignedTeacherId`, `primaryTeacherId`, `teacherUid`, or `teacher_id`.
- Canonical `teacherId` wins when stored legacy aliases disagree.
- `kids.teacherIds` remains because it represents a legitimate child-level relationship rather than operational session/enrollment ownership.
- B4 passed exact-head CI and was merged before B5 began.

## Phase B5 — retirement

Only after fallback usage is effectively zero:

- stop writing legacy aliases;
- remove obsolete alias indexes;
- simplify Firestore rules;
- remove compatibility code;
- optionally clean redundant alias fields from documents in a separately reviewed migration.

### B5 implementation boundary — 2026-08-25

B5 separates **runtime retirement** from **physical historical cleanup** so the migration remains zero-downtime and does not rewrite production data merely to make documents look uniform.

The B5 branch changes the active operational contract as follows:

- client enrollment/session ownership builders now emit only canonical `teacherId`;
- Cloud Functions enrollment/session ownership builders now emit only canonical `teacherId`;
- teacher reassignment and session-generation paths that use those shared builders therefore stop creating or refreshing redundant teacher aliases;
- the dead teacher-session alias collection fallback helper left behind by B4 is removed;
- Attendance Corrections operational `classSessions` and `enrollments` reads are cut over to canonical `teacherId` queries;
- source guards prevent those active readers from reintroducing operational alias queries;
- legacy parsing remains available for bounded audit, repair, transfer-history, and direct-document compatibility where an old record has no canonical `teacherId`;
- `kids.teacherIds` remains explicitly supported.

### What B5 does not do automatically

B5 does **not** mass-delete alias fields from existing Firestore documents. A normal update that writes canonical `teacherId` only may leave pre-existing alias fields physically present on the document. Those fields are ignored for canonical operational ownership and cannot override `teacherId` authorization.

A physical alias-removal migration remains separately reviewed because it would generate production writes and could activate document triggers. It must not be coupled to normal reassignment, attendance, billing, earnings, or schedule operations.

### Firestore rules safety boundary

The B3 rule shape already provides the desired runtime model:

- teacher collection queries for operational `enrollments` and `classSessions` are canonical-only;
- when `teacherId` exists, only that canonical UID authorizes teacher access;
- the remaining alias rule path is limited to a **direct document read of a legacy record that has no `teacherId`**.

B5 intentionally does not remove that last direct-history fallback until historical/completed records are separately audited for canonical coverage. Removing it based only on the current/future B3 sample could hide an old completed session or historical attendance record.

### Index retirement safety boundary

Composite indexes are removed only when their query shape has no live operational consumer. Indexes belonging to other domains are not teacher-identity aliases merely because they use similarly named fields. In particular, `demoSessions.assignedTeacherId` is a real demo-assignment field and remains outside this migration.

Dead-code/index cleanup must therefore distinguish:

- operational `classSessions` / `enrollments` compatibility aliases — B5 retirement target;
- `kids.teacherIds` — keep;
- demo-assignment fields — keep;
- historical audit/repair readers — keep until their historical purpose is retired.

## Non-negotiable behavior

Normalization must not change:

- canonical teacher access to a class;
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
