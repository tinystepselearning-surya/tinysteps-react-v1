# School OS Wave 0 — Current to Canonical Map

**Status:** INITIAL VERIFIED BASELINE  
**Wave:** 0 — Architecture Contracts  
**Source branch baseline:** `main` after School OS v1.0 freeze  
**Purpose:** Document current production concepts and their intended School OS ownership before any schema migration.

## 1. Evidence reviewed

This baseline was derived from current repository artifacts including:

- `firestore.rules`;
- `src/types/User.ts`;
- `src/types/Kid.ts`;
- `src/types/Student.ts`;
- `src/types/Enrollment.ts`;
- `src/types/Teacher.ts`;
- `src/types/School.ts`;
- `src/types/SchoolProgramme.ts`;
- `src/types/models.ts`;
- `src/types/lessonLibrary.ts`;
- `src/lib/attendanceValidationContract.ts`;
- finance/read-model Functions and architecture documents already on `main`.

This is a Wave 0 ownership map, not a physical Firestore schema proposal.

## 2. Current → canonical mapping

| Current concept / collection | What exists today | Canonical destination | Classification / migration posture |
|---|---|---|---|
| `users` / `User` | Auth UID, profile, single role, contact fields, `childIds[]`, `assignedKids[]` | Person + AuthIdentity + RoleAssignment + canonical relationships | **Mixed legacy/current.** Preserve auth compatibility; split relationship authority later. |
| `kids` / `Kid` | Learner profile plus parent IDs, teacher/LP fields and summary metrics | LearnerProfile + GuardianRelationship + TeachingAssignment/other relationships + projections | **Mixed.** Learner identity can be preserved; embedded relationships/summary become non-authoritative. |
| `students` / `Student` | Second learner-shaped model with parent IDs and summary | LearnerProfile + GuardianRelationship + projections | **Overlapping learner model.** Do not delete until identity audit determines canonical ID mapping. |
| `parents` | Root collection exists; parent-facing DTOs also exist separately | Person + GuardianRelationship + Household | **Needs schema inventory.** Do not assume collection semantics from name alone. |
| `teachers` | Teacher records plus derived monthly `teachers/{id}/earnings/{month}` read model | FacultyProfile / FacultyEngagement; monthly earnings child = projection | **Preserve.** Separate workforce identity/engagement from finance projections. |
| `schools` / `SchoolRecord` | School profile, status, contact/location, LP assignment, current academic year | Organisation + School Partnerships | **Strong foundation.** Converge role/assignment fields without replacing working school identity. |
| `schoolUsers` / `SchoolUserAccess` | School-admin access with `schoolIds[]` and primary school | OrganisationMembership + RoleAssignment | **Relationship model to normalize.** Preserve access during migration. |
| School academic year/grade/section models | School structure and current progress/evidence structures | Organisation/Campus + AcademicYear + Grade + Section + School Partnerships | **Mostly aligned.** Review `teacherIds[]` relationship arrays and snapshot semantics. |
| `enrollments` / `Enrollment` | Learner/course plus teacher, LP, parent, rate, billing cycle and credit fields | Enrollment + TeachingAssignment + relationships + Commerce/Finance | **High-value mixed aggregate.** Preserve IDs where valid; split ownership gradually. |
| `courses` / `Course` | Academic course plus duration/frequency/rate/topics | Course + CurriculumVersion + DeliveryOffering + Product/CommercialOffer where commercial | **Academic/commercial mix.** Price must leave academic ownership over time. |
| `classSessions` / `TeacherSession` | Session plus teacher aliases, learner aliases/arrays, time, attendance map, fee and reschedule links | ClassSession + SessionParticipant + SessionStaff + Attendance + finance/commercial snapshots as required | **High-value mixed aggregate.** Preserve working scheduling system; converge in Wave 3. |
| `leads` | Prospect/lead records | Lead in Growth & CRM | **Canonical direction clear.** Preserve lead history through admission/enrollment. |
| `demoSessions` | Admission scheduling, teacher assignment, observed child level, outcome, follow-up/conversion data | AdmissionsCase + AdmissionAssessment + shared scheduling capability | **Mixed admissions aggregate.** Do not force into academic ClassSession. |
| `demoSessionsPrivate` | Parent phone/private admission data sidecar | Admissions private/PII boundary | **Good pattern to preserve.** Reinforces sensitive-data separation. |
| `teacherInquiries` | Teacher recruiting/inquiry intake | Candidate / Application in Faculty & Workforce | **Canonical direction clear.** |
| `lessonFolders`, `lessons`, `lessonCatalog` | Lesson/content records | LearningResource + LessonDefinition where academic | **Needs content taxonomy audit.** |
| `parentWorksheetLibrary`, `classSamples` | Parent/public learning resources and samples | LearningResource + entitlement/access policy where needed | **Content/resource platform.** |
| `progress` | Learner progress records; current shapes include scores/status-like data | Learning evidence / Assessment / Mastery projection depending record semantics | **Do not map blindly.** Requires record-shape audit. |
| `billingCharges` | Parent/service charges used by finance workflows | Charge | **Strong canonical candidate.** Preserve financial history. |
| `payments` | Payments and allocation-related data | Payment + PaymentAllocation | **Strong canonical candidate.** Preserve append/audit behaviour. |
| `parentWallets` | Parent credit/wallet state and transactions | BillingAccount/credit subledger or projection, depending transaction semantics | **Needs finance classification audit.** Do not flatten into simple balance. |
| `invoices` | Invoice-shaped financial records | Financial document / billing representation | **Potential legacy/secondary finance representation.** Authority must be verified before migration. |
| `teacherEarnings` | Event/earning documents; current revenue code identifies these as source-of-truth for teacher earnings | Earning | **Preserve as authoritative finance history unless later audit disproves.** |
| `teachers/{id}/earnings/{month}` | Derived monthly earnings read model | Projection | **Confirmed derived.** Must remain rebuildable. |
| `teacherPayouts` | Teacher payout records | Payout | **Canonical direction clear.** |
| `teacherPaymentOffsets` | Teacher payment adjustments/offsets | Adjustment / payout allocation concept | **Finance audit required for exact destination.** |
| `paymentConfirmations` | Payment confirmation workflow data | Finance workflow/operational state | **Not separate financial truth unless verified.** |
| `rescheduleCredits` | Credits related to rescheduling | Scheduling/Commerce/Finance boundary | **Explicit unresolved item.** Requires rule audit before ownership decision. |
| `parentMonthlyReadModels` | Bounded parent/month operational read models | Projection | **Preserve as architectural asset.** Upstream source may change; consumer model can remain. |
| `adminStats` | Admin/global aggregate data | Projection / Analytics | **Never canonical business truth.** |
| `attendanceValidationCases` and related validation collections | Sidecar attendance evidence, classifications, resolutions and workflow state | Attendance Evidence + workflow/projection state | **Strongly aligned.** Current contract already states Tiny Steps operational attendance remains source of truth. |
| Session attendance map inside `classSessions` | Current operational attendance representation | AttendanceRecord + AttendanceRevision, with external evidence separate | **Compatibility authority today; future canonical extraction in Wave 3.** |
| `messages`, `messageThreads`, `notifications` | Communication records and delivery/notification data | Communication domain | **Canonical direction clear; distinguish conversation from delivery attempts.** |
| `parentClassRecordings` | Parent-visible recording references | Documents/Media + classroom evidence/access metadata | **Retention/access ownership audit required.** |
| `whatsappInboundUnmatched` | Integration-side unmatched inbound state | Integration workflow state | **Not business-domain truth.** |
| `bulkUploadJobs` | Background import/job state | Workflow/Operational State | **Platform workflow state.** |
| `ai-usage-logs`, `ai-error-logs`, `debug` | AI/technical operational logs | Platform observability | **Not canonical domain data.** |
| `gameData`, `leaderboards`, generic `sessions` / `transactions` | Game/legacy generic collections visible in rules | Learning/Practice, analytics or workflow depending actual record shape | **Unresolved.** Inspect before assigning canonical ownership. |
| `cases` | Generic cases collection visible in rules | Support/Safeguarding/other depending record type | **Unresolved.** Generic name is insufficient evidence. |

## 3. Confirmed ownership conflicts to resolve later

### A. User identity vs role/relationships

Current `User` contains both authentication/profile data and relationship arrays such as:

```text
childIds[]
assignedKids[]
role
```

School OS v1.0 separates:

```text
Person
AuthIdentity
RoleAssignment
GuardianRelationship
TeachingAssignment
```

Wave 1 should migrate authority without breaking current Firebase login behaviour.

### B. Duplicate learner shapes

Both `kids` and `students` exist with overlapping learner semantics.

Wave 0 must determine:

- whether both remain active;
- which IDs are referenced by current sessions/enrollments;
- whether one is canonical and one compatibility;
- whether any records must be linked rather than merged.

No collection should be deleted based on naming alone.

### C. Enrollment mixes domains

Current Enrollment includes:

```text
studentId
courseId
teacherId
lpId
parentId
ratePerSession
billingCycle
credits*
```

School OS ownership separates those concepts across:

```text
Enrollment
TeachingAssignment
GuardianRelationship / Household
Commerce
Finance
```

This is a major migration boundary, not an immediate refactor.

### D. ClassSession mixes delivery, relationships, attendance and finance

Current session types contain multiple aliases for teacher/learner identity, embedded attendance and fee fields.

The target model separates:

```text
ClassSession
SessionParticipant
SessionStaff
Attendance
Financial/commercial snapshots where required
```

The existing rolling-schedule/session system should be preserved and incrementally converged.

### E. Course mixes academic and commercial concerns

Current Course includes academic structure and `ratePerSession`.

Target ownership:

```text
Course / CurriculumVersion / DeliveryOffering
                  +
Product / CommercialOffer
```

Academic structure must not become dependent on market price.

## 4. Existing architecture to protect

Wave 0 treats the following as assets rather than rewrite targets:

- Firebase Authentication;
- current scheduling/rolling-schedule work;
- attendance validation sidecar and evidence separation;
- append-oriented finance/teacher-earning history;
- bounded parent monthly read models;
- admin analytics grain/period discipline;
- school portal foundations;
- reusable blog authority template;
- current CI/regression guards.

## 5. Explicitly unresolved before further audit

The following should remain marked **UNRESOLVED** until their record semantics are inspected:

- exact canonical Person ID reuse strategy;
- `kids` vs `students` canonical linkage;
- current `parents` collection authority;
- `progress` record taxonomy;
- `parentWallets` canonical/subledger/projection classification;
- `rescheduleCredits` ownership;
- generic `cases`;
- generic game `sessions` / `transactions`;
- recording retention/evidence semantics;
- precise school teacher/section relationship migration.

Wave 0 must resolve or explicitly defer each item before Wave 1 if it can affect identity or canonical ownership.

## 6. Migration posture labels

Future mapping updates use these labels:

| Label | Meaning |
|---|---|
| PRESERVE | Current construct already aligns well and should remain |
| CONVERGE | Current construct works but mixes concerns/aliases that should migrate gradually |
| PROJECTION | Derived/read-optimized; keep rebuildable |
| WORKFLOW | Operational process state, not domain truth |
| EVIDENCE | Evidence feeding a canonical decision |
| COMPATIBILITY | Legacy alias/path retained temporarily |
| UNRESOLVED | More current-state evidence required before assigning ownership |
| RETIRE LATER | Confirmed obsolete only after migration and verification |

## 7. Next Wave 0 work

The next Wave 0 review should focus on **Identity & References**:

- inventory current UID/document-ID usage across `users`, `kids`, `students`, `teachers`, `parents`, schools and enrollments;
- identify which IDs can be safely preserved;
- identify duplicate relationship authority;
- define compatibility rules without changing production data.

No runtime migration should begin until that audit is complete.
