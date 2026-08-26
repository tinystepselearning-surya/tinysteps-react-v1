# Parent Dashboard Rebuild — Brick P8 Parent Classes Experience

Status: **implementation branch**

## Goal

Make the Parent **Classes** domain a coherent operational experience while preserving the architecture established in P1–P7:

- classes are not curriculum lessons;
- attendance is a class fact, not a learning-mastery fact;
- finance remains outside P8;
- monthly class and attendance totals come from one canonical selected-child projection;
- session detail rows remain bounded and are used for navigation/history, not to invent a second monthly aggregate.

P8 covers the planned parent experience:

```text
Next class
Upcoming classes
Completed/history detail
Attendance
Cancellations
Reschedule requests / rescheduled sessions
Needs-review operational records
Calendar
Recordings
```

No learning metrics are introduced inside this domain.

## Canonical monthly authority

P8 consumes the P4 model stored at:

```text
parentMonthlyReadModels/{parentId}/months/{monthKey}.attendance
```

and accepts it only when:

```text
schemaVersion = 3
modelType = class_attendance_v3
childRowsAuthoritative = true
```

The selected-child source is strictly:

```text
attendance.byKid[kidId]
```

The shared selector remains:

```text
selectCanonicalParentChildMonthClassAttendance(...)
```

P8 additionally validates the materialized row with:

```text
parentChildClassAttendanceInvariantErrors(...)
```

If the selected child row is missing or invalid, P8 displays **unavailable**. It does not substitute `attendance.totals` or any whole-family count.

## Monthly presentation

The Classes screen now presents explicit wording such as:

> **15 completed of 18 August sessions**

instead of an ambiguous fraction.

The canonical summary includes:

- total sessions;
- completed sessions;
- upcoming sessions;
- cancelled sessions;
- no-show sessions;
- reschedule requests;
- rescheduled sessions;
- needs-review sessions;
- completed-class attendance: present, late, absent;
- marked vs awaiting-attendance completed sessions;
- attendance percentage over marked completed sessions.

`Needs review` is a presentation grouping of P4 operational buckets only:

```text
unresolvedPastSessions
+ pendingTimeUnknownSessions
+ otherSessions
```

It is not a parent task and is labelled accordingly.

## Session detail authority

The existing bounded `classSessions` reader remains responsible for details needed to render and act on individual sessions:

- date/time;
- course;
- teacher;
- join link;
- next/upcoming rows;
- history rows;
- calendar rows.

Those reads continue through the existing bounded parent session read policy and canonical-enrollment integrity filtering. P8 does **not** derive the monthly aggregate from these browser rows.

This division is intentional:

```text
P4 monthly projection = aggregate truth
bounded classSessions = operational detail/navigation
```

## Read-cost behavior

P8 does not add polling or an unbounded class query.

The canonical monthly reader uses the same React Query cache key already used by Parent Overview:

```text
["parentMonthlyBillingReadModel", parentId, monthKey]
```

Therefore:

- navigating from Overview to Classes normally reuses the cached monthly document;
- opening Classes directly requires at most the existing parent-month document read;
- missing canonical child rows use the existing bounded/idempotent `bootstrapParentClassAttendance` repair once per parent/child/month per app session;
- no hourly refresh was added.

The selected child identity also reuses the existing ParentDashboard kids query cache:

```text
["parentKids", parentId]
```

A valid `kidId` URL selection wins. When the dashboard is opened normally without a `kidId` parameter, P8 uses the same first linked child that ParentDashboard selects by default. A stale/invalid URL child id is rejected in favour of that valid dashboard default. No extra Firestore child lookup is added.

The P4 materializer recalculates upcoming vs unresolved-past from stored pending start timestamps at display time.

## Child-switch safety

When the selected child or month changes, P8 immediately clears the previous canonical month row before loading the replacement. One child’s class summary is never temporarily displayed under another selected child.

## Reschedule semantics

The P4 monthly summary keeps the lifecycle counts separate:

```text
reschedule_requested -> Reschedule requests
rescheduled          -> Rescheduled
```

The existing ParentDashboard compatibility normalizer historically groups both raw states into the same detail-history bucket. P8 therefore presents that filter as **Reschedules**, while recovering the original raw session status for each detail row so parents still see the precise row label:

```text
reschedule_requested -> Reschedule requested
rescheduled          -> Rescheduled
```

Neither lifecycle state exposes a Join Class action.

## Recordings

The existing parent recording-folder resource remains available from Classes. P8 does not create a duplicate recording store or copy recording URLs into the monthly projection.

## Explicitly out of scope

P8 does not:

- change teacher scheduling or attendance writes;
- change class-session lifecycle writers;
- change lesson completion/progress semantics;
- read or calculate skill/mastery data;
- calculate charges from class counts;
- change wallet/ledger/billing semantics;
- add broad Firestore history scans;
- remove all compatibility readers (P10).

## Regression requirements

P8 tests assert that:

- the explicit monthly wording is `completed of total month sessions`;
- monthly lifecycle/attendance presentation is derived from the canonical P4 child row;
- unavailable selected-child data never falls back to parent/family totals;
- normal entry with no `kidId` resolves to ParentDashboard's first linked child;
- stale URL child ids do not become canonical projection keys;
- reschedule-requested and rescheduled row labels remain distinct inside the combined Reschedules history bucket;
- completed/cancelled/no-show/reschedule states never expose Join Class;
- next-class selection still prefers a joinable class today, then the next future class;
- existing bounded detail filters, calendar/resource callbacks, India-time display, loading and empty states remain intact.
