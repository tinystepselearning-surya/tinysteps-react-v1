# Wave 0 — Academic & Enrollment Audit

**Status:** CODE AUDIT COMPLETE — LIVE READ-ONLY VERIFICATION PENDING  
**Wave:** 0 — Architecture Contracts  
**Runtime changes:** None  
**Production writes:** Forbidden in this work package

## 1. Purpose

This work package defines how Tiny Steps' current academic, enrollment and scheduling structures map into the frozen School OS model without rewriting the working enrollment or rolling-schedule system.

Canonical target:

```text
Programme
Course
CurriculumVersion
DeliveryOffering
Enrollment
LearningGroup
GroupPlacement
TeachingAssignment
SchedulePlan
ClassSession
SessionParticipant
SessionStaff
```

The audit separates academic definition, delivery configuration, learner participation, teaching responsibility, recurring timetable intent and physical class occurrences.

## 2. Repository evidence reviewed

Primary evidence:

- `src/types/Enrollment.ts`
- `src/types/Teacher.ts`
- `src/types/models.ts`
- `src/lib/createEnrollmentCallable.ts`
- `src/lib/scheduling/enrollmentRollingScheduleContract.ts`
- `src/lib/scheduling/rollingScheduleRecurrence.ts`
- `functions/src/lifecycle.ts`
- `functions/src/helpers/status.ts`
- `functions/src/scheduling/rollingScheduleLifecycle.ts`
- `functions/src/scheduling/rollingScheduleMaterializer.ts`
- `functions/src/scheduling/rollingScheduleCourseTransition.ts`
- `functions/src/scheduling/futureScheduleInspection.ts`
- `functions/src/scheduling/futureSchedulePlan.ts`
- `src/pages/admin/CourseManagement/CreateCourseForm.tsx`
- `src/pages/admin/CourseManagement/EditCourseForm.tsx`
- `src/pages/admin/EnrollmentManagement/CreateEnrollmentForm.tsx`
- `src/pages/admin/StudentManagement/AssignCourseModal.tsx`
- `src/types/SchoolProgramme.ts`
- `src/services/schoolProgrammeService.ts`
- `functions/src/helpers/schoolCurriculum.ts`
- `functions/src/schoolRead.ts`
- `functions/src/schoolProgress.ts`

Repository-wide searches also found no implementation of standalone `LearningGroup`, `GroupPlacement`, `DeliveryOffering` or `TeachingAssignment` outside architecture documents.

## 3. Verified current academic topology

### 3.1 Course is currently a mixed aggregate

The admin course model currently combines academic definition with delivery and commercial defaults.

Academic-shaped fields include:

```text
name
area
level
description
topics[]
prerequisites[]
targetAge[]
targetGrade[]
status
```

Delivery-shaped fields include:

```text
durationMinutes
sessionFrequency
maxStudentsPerSession
```

Commercial field:

```text
ratePerSession
```

Therefore current `courses/{courseId}` cannot remain the permanent owner of all these concerns.

### 3.2 Course IDs are deliberate academic identifiers

Course creation derives a stable slug-style document ID from the course name and also stores `courseId` in the document.

Enrollment creation validates the referenced course document and requires the course to be active.

**Direction:** preserve existing Course IDs where they continue to represent the same academic course. Do not generate replacement IDs merely to introduce the School OS structure.

### 3.3 Curriculum is not versioned today

Current course authoring embeds mutable `topics[]` and `prerequisites[]` directly on Course.

The school partnership path also has code-owned phonics curriculum/stage definitions in `schoolCurriculum.ts`.

The repository does not currently expose a standalone immutable `CurriculumVersion` authority.

This means a future curriculum migration must distinguish:

- Course identity;
- a versioned curriculum definition;
- learner/session progress against that version;
- school programme progress snapshots.

### 3.4 Enrollment is already the strongest current delivery aggregate

Current enrollment creation establishes one operational enrollment around:

```text
enrollmentId
kidId
courseId
teacherId
parentId
lpId
status
schedule
classesStartDateYmd
ratePerSession
teacherPayPerSession
currency
billingCycle
credits*
topicProgress
```

The creation workflow already provides valuable invariants:

- explicit `operationId` for idempotency;
- `creationIntent` = initial course / additional course / transition;
- canonical child and course validation;
- prevention of duplicate operational child+course enrollment;
- `operationalEnrollmentKeys` as a uniqueness reservation;
- course-transition history rather than in-place course mutation.

These controls are architectural assets and should be preserved.

### 3.5 Enrollment is one learner, not a group

New enrollment writes persist one canonical `kidId`, with legacy aliases such as `studentId` and `kidIds[]` kept for compatibility.

The School OS contract therefore remains:

> **Enrollment = one learner participating in one DeliveryOffering over a lifecycle.**

A group class does not become a multi-learner Enrollment. Group participation is modeled separately through LearningGroup + GroupPlacement.

### 3.6 Teacher on Enrollment is expected responsibility

Current `enrollment.teacherId` drives expected teacher ownership and rolling-session materialization.

This maps to:

```text
TeachingAssignment
```

not permanent teacher identity embedded inside Enrollment.

Actual teacher delivery for an individual occurrence belongs to:

```text
SessionStaff
```

Current `classSessions.teacherId` remains the compatibility authority for that actual occurrence during migration.

### 3.7 Recurring schedule is embedded inside Enrollment

The current rolling-schedule contract stores timetable intent under:

```text
enrollment.schedule
```

Canonical shape includes:

```text
schemaVersion
deliveryMode = rolling
timezone
revision
weeklySlots[]
```

and the materializer tracks:

```text
scheduleMaterialization
horizonDays
scheduleRevision
materializedThroughYmd
nextOccurrenceYmd
nextMaterializationDueYmd
```

This is a strong precursor to:

```text
SchedulePlan
```

with `scheduleMaterialization` retained only as operational projection/workflow state.

### 3.8 Physical sessions are separate from timetable intent

The rolling materializer creates bounded physical `classSessions`.

That distinction should remain:

```text
SchedulePlan
      ↓ materializes
ClassSession
```

The system should not collapse future recurring intent and actual session occurrence into one object.

### 3.9 Course transitions already preserve lifecycle history

Current course transitions create a destination Enrollment and terminalize the source Enrollment.

They link history using fields such as:

```text
previousEnrollmentId
nextEnrollmentId
transitionOperationId
transitionType
correctedFromEnrollmentId
supersededByEnrollmentId
```

This is aligned with the School OS lifecycle principle: course progression/correction should not silently rewrite an existing enrollment's historical course identity.

### 3.10 Commerce, finance and entitlement are embedded in Enrollment

Current Enrollment stores:

```text
ratePerSession
feePerClass
teacherPayPerSession
currency
billingCycle
creditsTotal
creditsUsed
creditsRemaining
```

These are operationally useful today but cross domain boundaries.

Future ownership:

```text
CommercialOffer / CommercialAgreement
Billing / Finance
EntitlementGrant
Faculty Earning terms
```

Historical snapshots required to explain past billing/pay must remain immutable even after authority moves.

### 3.11 topicProgress does not belong to core Enrollment

`topicProgress` is created on Enrollment today.

Long term, learning evidence/mastery/progress belongs to learning/assessment projections, not the participation relationship itself.

Enrollment may remain a lookup key for progress, but should not become the sole academic evidence store.

## 4. B2C and B2B structure

### B2C / direct learner delivery

Current direct delivery uses:

```text
Course
  ↓
Enrollment
  ↓
embedded schedule
  ↓
ClassSession
```

Expected teacher responsibility is embedded on Enrollment.

There is no general B2C LearningGroup or GroupPlacement model in the current repository.

### B2B / schools

School structure already models:

```text
School
AcademicYear
Grade
Section
SchoolTeacher
SectionCurriculumProgress
```

A School Section is institutional academic structure. It must **not** be silently reused as the general School OS `LearningGroup`.

A later DeliveryOffering may reference institutional structures where appropriate, but:

```text
Section ≠ LearningGroup
```

unless an explicit mapping is created.

## 5. Canonical decisions

### D1 — Programme

Introduce `Programme` as the broad academic family above Course.

Current `area` / `track` values are migration inputs.

They are not sufficient permanent Programme identity because they are strings embedded in Course and may evolve independently from individual courses.

### D2 — Course

Preserve existing Course IDs when they represent stable academic course identity.

Course owns:

- academic purpose;
- level/sequence identity;
- programme relationship;
- high-level prerequisites/outcomes.

Course must gradually stop owning:

- market price;
- delivery capacity;
- timetable frequency;
- negotiated/institutional terms.

### D3 — CurriculumVersion

Introduce immutable/versioned CurriculumVersion.

Do not treat mutable `Course.topics[]` as the final curriculum authority.

Each DeliveryOffering/Enrollment/session-progress path must eventually be able to identify which curriculum version applied.

### D4 — DeliveryOffering

Introduce DeliveryOffering between Course and Enrollment.

It owns the operational delivery form/context, for example:

- 1:1;
- small group;
- school/institutional;
- applicable duration/capacity defaults;
- delivery policy/configuration.

Commercial price still belongs to Commerce, not DeliveryOffering.

### D5 — Enrollment

Preserve current Enrollment IDs and lifecycle history.

Canonical Enrollment becomes:

```text
one Person/LearnerProfile
participating in
one DeliveryOffering
over a lifecycle
```

It does not directly own:

- teacher relationship;
- recurring schedule;
- price/billing;
- entitlement balance;
- learning mastery.

Compatibility fields may remain during migration.

### D6 — TeachingAssignment

Migrate expected teacher responsibility from `enrollment.teacherId` to TeachingAssignment.

Scope must be explicit:

```text
TeachingAssignment → Enrollment
or
TeachingAssignment → LearningGroup
```

Do not use learner-level `kids.teacherId` as canonical assignment authority.

### D7 — SchedulePlan

Migrate recurring timetable intent from `enrollment.schedule` to SchedulePlan.

Preserve the proven rolling-schedule behavior:

- version/revision;
- timezone;
- weekly slots;
- local service date;
- bounded materialization;
- deterministic reconciliation.

`scheduleMaterialization` remains derived operational state.

### D8 — LearningGroup and GroupPlacement

No general LearningGroup/GroupPlacement authority exists today.

Introduce these only when a real multi-learner delivery workflow requires them.

Do not infer group membership from:

- `maxStudentsPerSession > 1`;
- legacy learner arrays;
- a School Section;
- a session that happens to contain multiple learner references.

### D9 — ClassSession

ClassSession remains one physical academic occurrence.

Future relationships:

```text
ClassSession
  ├─ SessionParticipant
  └─ SessionStaff
```

ClassSession may retain immutable historical snapshots needed for billing/audit, but does not own Course price or long-term teacher assignment.

### D10 — Course transition

Retain the current "new enrollment for new course" behavior.

Do not mutate an existing historical Enrollment from Course A to Course B.

Progression/correction is a lifecycle transition:

```text
Enrollment A
   ↓ transition
Enrollment B
```

with explicit linking/audit evidence.

### D11 — Commercial and credit separation

Treat:

- `Course.ratePerSession` as a legacy/default commercial field;
- enrollment rate/currency as historical negotiated/operational snapshots;
- credits as Commerce/Entitlement/Finance state.

No migration may delete past price/pay/credit evidence merely because a new CommercialOffer/Entitlement model exists.

## 6. Read-only production audit

Run:

```bash
npm run audit:academic-enrollment
```

The audit inspects structure only from:

- `courses`;
- `enrollments`;
- `classSessions`;
- `operationalEnrollmentKeys`;
- `enrollmentCreationOperations`;
- `enrollmentCourseTransitions`;
- candidate future canonical collections;
- school academic-year/grade/section/curriculum structure.

It does not select parent/student/teacher names, contact details, notes or payment transaction data.

Reports are written to ignored:

```text
reports/academic-enrollment-audit.json
```

Raw IDs are not included in issue samples.

## 7. Live verification questions

The production audit must establish:

1. how many Course documents are active and which mixed fields are actually populated;
2. whether every Enrollment resolves to an existing Course;
3. current Enrollment lifecycle/status distribution;
4. rolling vs legacy/unconfigured schedule coverage;
5. operational enrollment-key integrity;
6. transition-link integrity;
7. whether live/future sessions show genuine multi-learner delivery;
8. whether future sessions resolve to Enrollment and Course;
9. whether any standalone Programme/CurriculumVersion/DeliveryOffering/LearningGroup/etc. collections already exist;
10. actual School academic structure footprint.

## 8. Migration posture

| Current construct | Canonical destination | Posture |
|---|---|---|
| `courses` | Course + Programme relation + CurriculumVersion relation | CONVERGE |
| `courses.ratePerSession` | CommercialOffer / commercial defaults | MOVE AUTHORITY |
| Course delivery fields | DeliveryOffering defaults/config | MOVE AUTHORITY |
| `courses.topics[]` | CurriculumVersion | COMPATIBILITY → VERSION |
| `enrollments` | Enrollment | PRESERVE + NARROW |
| `enrollment.teacherId` | TeachingAssignment | COMPATIBILITY → RELATIONSHIP |
| `enrollment.schedule` | SchedulePlan | COMPATIBILITY → CANONICAL PLAN |
| `scheduleMaterialization` | scheduling projection/workflow state | PROJECTION |
| enrollment credits | Entitlement/Commerce/Finance | MOVE AUTHORITY |
| `topicProgress` | Learning/Assessment/Mastery projection | MOVE AUTHORITY |
| `classSessions` | ClassSession | PRESERVE + CONVERGE |
| session learner arrays | SessionParticipant | COMPATIBILITY → RELATIONSHIP |
| session teacher field/aliases | SessionStaff | COMPATIBILITY → RELATIONSHIP |
| school AcademicYear/Grade/Section | institutional academic structure | PRESERVE |
| School Section `teacherIds[]` | institutional assignment relationship | CONVERGE |
| `operationalEnrollmentKeys` | uniqueness reservation/workflow state | WORKFLOW |
| `enrollmentCreationOperations` | idempotency/workflow evidence | WORKFLOW |
| `enrollmentCourseTransitions` | lifecycle transition/audit evidence | PRESERVE EVIDENCE |

## 9. Audit-tool retirement decision

The audit script and its test are migration scaffolding.

| Asset | Current status | Retirement rule |
|---|---|---|
| `scripts/audit-academic-enrollment.mjs` | KEEP through academic/enrollment migration | Retire after canonical read/write cutover unless narrowed into permanent invariants. |
| `scripts/test/academic-enrollment-audit.node-test.mjs` | KEEP while audit exists | Retire with audit or retain only permanent invariant tests. |
| Architecture document | PERMANENT | Keep as architecture/migration record. |

No scheduled GitHub workflow should be created for this audit.

## 10. Exit gate

This work package is complete when:

- live Course/Enrollment/schedule/session structure is verified;
- mixed academic/commercial/delivery ownership is classified;
- current operational invariants are explicitly protected;
- any active orphan/missing references are classified;
- group-delivery evidence is understood rather than inferred;
- future canonical ownership is frozen;
- no production write is required merely to complete Wave 0.

After completion, Wave 0 proceeds to **Shared Experience / Design-System Inventory**.
