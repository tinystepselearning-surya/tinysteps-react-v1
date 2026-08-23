# Tiny Steps Firestore / Database Architecture Audit — Current Findings

**Audit date:** 23 August 2026  
**Tracking:** #58  
**Audit branch:** `audit/firestore-architecture-optimization`  
**Code baseline reviewed:** `19dc8c8f55ed2a95e86040a0151a41431acf1cc5`

## Executive verdict

Tiny Steps does **not** need a database rewrite. The current Firestore architecture contains several good modern patterns, but it also carries accumulated compatibility debt from earlier generations of the application. The main efficiency problem is not Firestore itself: it is that some screens and backend projections still read more data than the user actually needs, and legacy field aliases force duplicate queries/indexes.

The production event storm on 23 August was a separate high-severity trigger/idempotency incident and has already been contained. This audit focuses on the **normal steady-state architecture** so that ordinary daily usage is bounded, measurable and scalable.

### Overall state

| Area | Current assessment |
|---|---|
| Lead/demo business workflow | Keep; backend/read shape needs further optimization |
| Teacher session fetching | Significantly improved since June; one canonical live query + one-time legacy fallback |
| Parent Payments | Strong V2 architecture; paginated/read-model based |
| Messaging | Strong current architecture; bounded live thread/message queries |
| Admin Analytics | Improved from V1, but still broad and expensive in detailed views |
| Student Management | Improved from prior live monitors, but still reads large lists |
| Parent dashboard | Mostly scoped, but session/history readers can over-fetch |
| Backend read models | Useful direction, but attendance recomputation remains an amplifier |
| Security Rules | Functional but complex; broad `/users` reads and alias-based ownership should be retired |
| Indexes | Many are legitimate, but legacy aliases create avoidable index/write/storage overhead |
| Read observability | Development instrumentation exists; production attribution still incomplete |

## What has already improved since the June audit

The repository already contains meaningful improvements. These should be preserved rather than accidentally reverted.

### Teacher sessions

The old design used up to six live listeners for teacher aliases. Current `useTeacherSessions` and `useUpcomingSessions` now use **one canonical live `teacherId` query** and perform legacy alias queries as one-time fallbacks. Listener cleanup is explicit. This materially reduces normal teacher dashboard amplification.

**Files:**
- `src/pages/teacher/hooks/useTeacherSessions.ts`
- `src/pages/teacher/hooks/useUpcomingSessions.ts`

Residual debt: the fallback still exists because historical data may use `teacherIds`, `assignedTeacherId`, `primaryTeacherId`, `teacherUid`, or `teacher_id`. The long-term solution is data canonicalization followed by fallback/index retirement.

### Parent Payments

`ParentPayments.tsx` now defaults to `ParentPaymentsV2`; legacy maintenance is lazy-loaded only when explicitly opened. V2 uses:

- server-side page size of 10
- `collectionGroup('months')` read models
- aggregate sums/counts
- page-scoped parent/charge/wallet reads
- on-demand detail loading

This is the architecture to replicate elsewhere.

**Files:**
- `src/pages/admin/ParentPayments.tsx`
- `src/pages/admin/ParentPaymentsV2.tsx`

### Analytics

`AnalyticsDashboard.tsx` now points to `AnalyticsDashboardV2`, which replaced always-live raw collection listeners with one-time reads/aggregates. This is better, although detailed views still load large raw sets.

### Student Management

The old live 1,000-kid / 2,000-credit monitors were reduced. Kids are currently loaded once (still up to 1,000); the credits monitor is conditional and one-time; only the operational session-request queue remains live and bounded to 200.

### Messaging

Current message threads are bounded to 100 and selected-thread messages to 50, with correct unsubscribe behavior. This is a good realtime pattern.

**Files:**
- `src/hooks/useMessageThreads.ts`
- `src/hooks/useThreadMessages.ts`

---

# Ranked current findings

## P0 / Critical

### C1. Parent monthly attendance projection recomputes a parent-month from session reads on every class-session write

**Status:** Active  
**Workflow:** Backend / Parent dashboard projections  
**Source:** `functions/src/parentMonthlyReadModels.ts`

`onClassSessionReadModelWrite` reacts to every `classSessions/{sessionId}` write and invokes `recomputeParentMonthAttendanceReadModel` for affected parent/month targets.

The recompute now attempts a good parent + date-bounded query. However:

1. every qualifying class-session write can cause a complete month recomputation;
2. if the bounded query errors, it falls back to **all sessions for that parent**;
3. if the bounded query returns empty, it again falls back to **all sessions for that parent**.

This turns a single session update into O(number of sessions in the parent/month), or in fallback mode O(all historical parent sessions).

**Risk:** backend read amplification during attendance/status/session updates.

**Safe target architecture:**

- Add a semantic before/after guard so irrelevant fields do not trigger projection work.
- Prefer incremental/delta projection updates where correctness permits.
- If full recomputation is required, keep it strictly parent + month bounded.
- An empty bounded result must be a valid result, not a reason to scan all history.
- Never silently broaden a query merely because an index/query failed; surface/monitor the configuration problem instead.

**Regression protection:** attendance totals, monthly parent view and session state changes must remain identical.

**Success metric:** one ordinary class-session update causes O(1) or bounded-month reads; never a historical parent scan.

---

### C2. Leads & Enquiries loads growing operational collections as broad realtime streams

**Status:** Active  
**Workflow:** Admin leads/admissions  
**Sources:**
- `src/pages/admin/leadsRealtime.ts`
- `src/pages/admin/LeadsInquiriesWorkspaceV2.tsx`
- `src/services/demoSessionsService.ts`

Opening the current Leads & Enquiries workspace can establish live reads for:

- the entire `leads` collection ordered by `createdAt`
- the entire `demoSessions` collection
- the entire `demoSessionsPrivate` collection
- all active teacher user documents

UI bucket/month/date filters do not sufficiently bound the Firestore streams themselves.

This means cost grows with historical data rather than with the number of records currently being worked.

**Safe target architecture:**

- Keep realtime only for the **active operational window**.
- Server-filter/paginate Closed/history.
- Stop loading every private demo phone record; load private data only for visible rows or embed a safe display/search projection where appropriate.
- Query demos by operational status/time window rather than all history.
- Preserve instant new-enquiry notification and bucket transitions.

**Success metric target:** opening Leads should have a fixed upper bound independent of lifetime lead count; idle page should receive only genuinely relevant changes.

---

## P1 / High

### H1. Analytics V2 still performs broad raw reads

**Status:** Active  
**Workflow:** Admin analytics  
**Source:** `src/pages/admin/AnalyticsDashboardV2.tsx`

When detailed analytics views require core data, the browser still reads entire `users`, `enrollments` and `courses` collections. Month loading also fetches raw month sets for `billingCharges`, `teacherEarnings` and `classSessions`.

The page is no longer permanently realtime, which is a substantial improvement, but it is still doing reporting work in the browser that should increasingly be served by aggregate/read-model documents.

**Safe target architecture:**
- Overview: aggregate/read-model documents only.
- Finance/delivery/teacher drilldowns: load only when the corresponding subview is opened.
- Paginate raw rows; do not load an entire month merely to compute summary cards.
- Reuse canonical finance/month projections already introduced for Parent Payments.

**Success metric:** analytics overview should be tens of reads, not proportional to total users/enrollments/month sessions.

---

### H2. Student Management loads a large pseudo-page instead of true server pagination

**Status:** Active  
**Workflow:** Admin students  
**Source:** `src/pages/admin/StudentManagement/StudentList.tsx`

Current page startup performs:

- all parent users (`role == parent`)
- all teacher users (`role == teacher`)
- up to 1,000 kids
- realtime requested session queue up to 200
- optional reschedule-credit monitor up to 2,000 when explicitly shown

This is better than the prior all-live implementation, but 1,000 students plus all parent/teacher profiles is still too broad for a growing application.

**Safe target architecture:** true server pagination (e.g. 25/50 rows), server search/filter queries, and ID-scoped profile enrichment only for visible results. Keep the small operational request queue realtime.

---

### H3. Parent upcoming sessions reads all parent sessions and all parent enrollments, then filters future rows in memory

**Status:** Active  
**Workflow:** Parent  
**Source:** `src/pages/parent/hooks/useUpcomingSessions.ts`

The parent query is ownership-safe (`parentId == uid`) but has no date bound. A parent with years of history will pay for old sessions even when the UI only needs upcoming classes.

**Safe target architecture:** parentId + future date/startAt bounded query, with only active/current enrollment information necessary for validation.

**Success metric:** cost depends on upcoming sessions, not historical session count.

---

### H4. Shared enrollment readers still contain whole-collection and legacy fan-out patterns

**Status:** Active  
**Workflow:** Admin/shared  
**Source:** `src/hooks/useData.ts`

`useAllEnrollments()` reads the entire enrollments collection with only a 30-second stale time.

`useEnrollmentsForStudents()` performs canonical `kidId` + `kidIds` queries, then a `studentId` fallback for misses, then course/user enrichment reads.

**Safe target architecture:**
- retire `useAllEnrollments` from growing admin screens in favor of aggregate counts or server-paginated/status-scoped queries;
- complete canonical enrollment coverage;
- retain fallback only behind measured migration telemetry until coverage is proven complete, then delete it.

---

### H5. Lead attribution analytics queries the same logical range through three timestamp fields

**Status:** Active  
**Workflow:** Admin acquisition analytics  
**Source:** `src/pages/admin/LeadSourceAnalysis.tsx`

For a selected date range, the component runs three Firestore queries using:

- `receivedAt`
- `requestedAt`
- `createdAt`

and deduplicates results in the browser.

This is a compatibility strategy, but the same lead may be billed multiple times.

**Safe target architecture:** define one canonical lead-received timestamp, measure coverage, backfill only missing records safely, then use one query.

---

### H6. Firestore Security Rules preserve broad internal `/users` reads

**Status:** Active  
**Workflow:** Security / all authenticated internal roles  
**Source:** `firestore.rules`

Current `/users/{uid}` read rule intentionally preserves broad internal lookup behavior for signed-in non-school-admin users. This increases both privacy surface and the chance that frontend code will use whole-role/whole-user collection reads for convenience.

Rules also keep extensive teacher alias ownership logic and repeatedly consult the authenticated user document for role/status compatibility.

**Safe target architecture:**
- maintain coarse role in trusted auth claims where operationally appropriate;
- define narrow profile/directory projections for cross-user display needs;
- allow full user profile only to self/admin or explicitly justified roles;
- remove legacy ownership aliases only after canonical migration is proven complete;
- keep rule tests for every persona.

**Non-negotiable:** do not weaken authorization to save reads.

---

### H7. Daily enrollment canonical-coverage job scans all enrollments

**Status:** Active scheduled migration/monitoring debt  
**Workflow:** Backend maintenance  
**Source:** `functions/src/enrollmentCanonicalCoverage.ts`

`runEnrollmentCanonicalCoverageDaily` runs every day at 02:45 IST and pages through the entire enrollment collection to calculate legacy/canonical coverage.

This is useful during migration, but it should not become permanent infrastructure once canonicalization is complete.

**Safe target architecture:** use it as a temporary migration guard with explicit retirement criteria, or replace with incremental counters/low-frequency audit once coverage is stable.

---

## P2 / Medium

### M1. Generic `useRealtimeData` has incorrect listener lifecycle semantics

**Status:** Likely legacy; active reachability still must be confirmed  
**Source:** `src/hooks/useRealtime.ts`

The hook creates `onSnapshot` inside an async IIFE. The unsubscribe returned by the IIFE is not returned from the React effect itself. Inline `constraints` arrays can also change identity on every render.

Known consumers found include old/simple components such as:
- `components/teacher/TeacherSessionList.tsx`
- `components/lp/LPDuesTracker.tsx`
- `components/parent/ParentProgressDashboard.tsx`

Some of these also read whole collections then filter client-side.

**Action:** prove whether they are reachable from current routes. If dead, delete. If active, fix cleanup and replace broad reads.

---

### M2. Legacy `useKidAttendance` is an N+1 landmine

**Status:** No active consumer found in repository search; removal candidate  
**Source:** `src/hooks/useData.ts`

It reads the broad attendance collection and then runs another subcollection query for every returned record. It is not acceptable if ever reactivated.

**Action:** delete after import/reachability confirmation, or replace with canonical class-session/month projection.

---

### M3. Legacy `useMessages` is unbounded but appears unused

**Status:** No active consumer found  
**Source:** `src/hooks/useMessages.ts`

It listens to all messages containing the teacher participant and builds conversations client-side without a limit. Current `messageThreads` architecture is safer and bounded.

**Action:** remove dead legacy hook after reachability verification.

---

### M4. Parent Payments invoice drilldown loads all billing history for one parent

**Status:** Active, on-demand only  
**Source:** `src/pages/admin/ParentPaymentsV2.tsx`

The main page architecture is good. However, opening invoice integrity currently queries all `billingCharges` for the selected parent and then fetches referenced sessions, even though the invoice is for a selected month.

**Action:** constrain by canonical service/month key where correctness allows; keep explicit integrity fallback as an admin-only diagnostic rather than default path.

---

### M5. Admin stats reads all sessions for today to count active ones

**Status:** Active  
**Source:** `src/hooks/useAdminStats.ts`

Users/kids/courses correctly use server counts. Today sessions are still read as documents and filtered by status client-side.

**Action:** use aggregate count queries / canonical active-status field or a daily read model once status semantics are stable.

---

### M6. Index inventory reflects legacy schema debt

**Status:** Active configuration  
**Source:** `firestore.indexes.json`

Composite indexes exist for multiple class-session teacher aliases and overlapping legacy query forms. These do **not** generate reads by themselves, but they increase index storage/write work and make the legacy schema harder to retire.

**Action:** map each index to a current query after canonical migrations. Delete only indexes proven unused by source + production query evidence.

---

## P3 / Monitor / currently acceptable

### A1. Current messaging V2

Bounded 100-thread realtime list and 50 selected messages, with cleanup. Keep this pattern.

### A2. Parent Payments V2

Server pagination, aggregate queries, read models and on-demand enrichment are the desired model. Optimize only residual detail readers.

### A3. Teacher Today/Upcoming primary query

Current canonical live query is scoped by teacher and date. Keep realtime behavior for teachers. The remaining task is retiring one-time legacy fallbacks after coverage is proven.

### A4. `globalLearnersRollup`

Daily parent-role scan is bounded to once/day and selects only necessary fields. Monitor as user count grows, but it is not a current priority.

### A5. `batchInsightsRollup`

Runs three times per day and processes game sessions incrementally after `lastRunAt`; then performs per-affected-kid projection reads. Monitor with function/read metrics, but the shape is materially better than full-history recomputation.

---

# Security Rules audit — current direction

## Good

- Legacy `/sessions` is fully locked.
- Core write surfaces frequently route mutations through admin/backend functions.
- Parent finance/read-model access is parent scoped.
- `classSessions` list/get ownership predicates are explicit.
- Server-maintained read models deny direct client writes in several places.

## Needs modernization

1. **Broad `/users` internal read permission** should be replaced with least-privilege directory/profile projections.
2. **Role/status resolution** still falls back heavily to `/users/{uid}`. Claims should become the primary coarse authorization input where operationally reliable; user-doc checks can remain for status/revocation-sensitive cases.
3. **Teacher ownership aliases** preserve six field forms. They should shrink to canonical `teacherId` once coverage is proven.
4. **Kid vs student duplication** keeps rule helpers checking both models. Define canonical ownership and retire mirrored compatibility paths deliberately.
5. Rule changes must be paired with emulator tests for Admin, Teacher, Parent, LP, School Admin and Kid personas.

---

# Read budgets to adopt

These are architecture targets, not current measured production numbers. Query Insights must validate/adjust them.

| Screen / action | Target initial reads | Idle target | Realtime requirement |
|---|---:|---:|---|
| Admin Leads — active pool | <= 150 bounded docs | near-zero except relevant changes | Yes for active/open lifecycle |
| Admin Leads — history/closed | <= 50/page | 0 | No; pagination/manual refresh |
| Admin Students | <= 50/page + small queues | only request-queue changes | Session-request queue only |
| Parent Payments | <= 30–60/page | 0 | No |
| Analytics overview | <= 20–40 projection/aggregate reads | 0 | No |
| Analytics drilldown | <= 100/page | 0 | No |
| Teacher Today | <= 30–50 | only same-teacher/today changes | Yes |
| Teacher Upcoming day | <= 30–50 | only selected-day changes | Yes |
| Parent dashboard overview | <= 30 | 0 | Usually no |
| Parent upcoming classes | proportional only to upcoming window | 0 | Optional; one-time + refresh is acceptable |
| Message threads | <= 100 | relevant changes only | Yes |
| Selected message thread | <= 50 | relevant messages only | Yes |

Backend invariant:

> One ordinary `classSessions` write must cause bounded O(1) or small-window work. It must never cause an unbounded historical parent/session scan.

---

# Remediation sequence

## Brick 1 — Backend read amplification guard

Target: `parentMonthlyReadModels` attendance projection.

- semantic before/after guard
- remove all-history fallback on empty bounded results
- verify required indexes
- measure reads per class-session update
- full regression tests for attendance/month read model

**Why first:** backend amplification can multiply silently without anyone keeping a page open.

## Brick 2 — Leads operational query architecture

- bounded active lead query
- status/date-scoped demo query
- row-scoped/private-phone loading or safe projection
- paginated Closed/history
- preserve instant new lead notification
- preserve Open → With Teacher → Admin Review → Closed behavior

## Brick 3 — Analytics read models and view gating

- no raw full collection load for overview
- only load detail datasets when that view is opened
- aggregates/read models for summary metrics
- bounded drilldown tables

## Brick 4 — Student Management server pagination

- 25/50-row server page
- server search/filter
- visible-row enrichment
- keep bounded operational queue realtime

## Brick 5 — Parent upcoming session window

- parent + future window query
- current enrollment validation only
- no historical session download for upcoming classes

## Brick 6 — Enrollment canonicalization retirement

- measure canonical coverage
- fix remaining outliers using dry-run/canary migration
- remove `studentId`/teacher alias fallback queries
- retire daily canonical coverage scheduler once stable

## Brick 7 — Security Rules modernization

- claims-first coarse role checks
- least-privilege user directory projections
- canonical teacher ownership
- retire kid/student compatibility only with coverage proof
- comprehensive emulator matrix

## Brick 8 — Dead/legacy reader removal

Candidate removals after reachability proof:
- `useRealtimeData` consumers / hook if obsolete
- `useKidAttendance`
- `useMessages`
- other legacy dashboards/services discovered by import graph

## Brick 9 — Index cleanup

- map every composite index to surviving query
- remove only proven legacy indexes
- consider single-field exemptions for large/unqueried fields

## Brick 10 — Observability and budgets

- Cloud Monitoring alerts for abnormal read/write/function/event rates
- Query Insights review after each brick
- production-safe read-budget telemetry where needed
- CI architecture tests for bounded queries, listener cleanup and trigger quiescence

---

# Verification standard for every brick

Every optimization PR must include:

1. **Business regression tests** for the affected persona/workflow.
2. **Query/read shape test** or deterministic unit test where feasible.
3. **Listener cleanup verification** for realtime paths.
4. **Before/after expected read model** documented in the PR.
5. **No migration without dry-run + canary + hard bound.**
6. **Post-deploy production measurement** using Query Insights / Monitoring.
7. **Rollback plan** if behavior or latency regresses.

A PR is not considered successful only because CI is green. It is successful when the workflow remains correct **and** production read/write behavior improves as predicted.

---

# Production evidence still required before final ranking

This report is based on current source architecture and the post-incident Firebase usage evidence. To convert static estimates into measured rankings, capture a quiet post-fix period in Firestore Query Insights and record:

- normalized query fingerprint
- execution count
- documents returned
- billable read operations
- latency
- time window

The strongest candidates above should then be mapped to their exact source labels/files. Query Insights data may arrive with delay, so lack of an immediate row is not evidence that a query did not run.

No production optimization should be merged solely from a static estimate when a high-risk operational workflow is involved.

---

# Definition of the target architecture

Tiny Steps should converge on these principles:

- **Canonical data:** one authoritative field/model per business concept.
- **Bounded reads:** data volume grows with the visible task, not the lifetime database.
- **Read models for dashboards:** reporting screens consume compact projections/aggregates rather than recomputing from raw facts.
- **Selective realtime:** only genuinely operational live data uses listeners.
- **Idempotent, quiescent backend:** events can be replayed without additional business writes and settle completely.
- **Least privilege:** users receive exactly the data access they need.
- **Observable cost:** every major screen and business event has an expected read/write/function budget.
- **Small safe migrations:** dry-run, canary, bounded batch, verification, retirement.

This audit deliberately preserves the application's current operating model. Optimization is an implementation improvement, not a reduction in functionality.