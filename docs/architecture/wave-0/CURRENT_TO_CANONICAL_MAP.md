# School OS Wave 0 — Current to Canonical Map

**Status:** ACADEMIC & ENROLLMENT AUDIT COMPLETE — LIVE STRUCTURE VERIFIED  
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
| `users` / `User` | Auth-backed profile keyed today by Firebase UID; document also stores `uid`/`userId`, role and relationship arrays | Person + AuthIdentity + RoleAssignment + canonical relationships | **CONVERGE.** For existing people, preserve the current document-ID value as Person ID after live 1:1 verification, but model Firebase UID separately as AuthIdentity. Future Person IDs are not provider-derived. |
| `kids` / `Kid` | Primary learner creation path uses an auto-generated `kids` ID; parent/teacher/LP aliases and summary metrics are embedded | Person + LearnerProfile + GuardianRelationship + TeachingAssignment/other relationships + projections | **CONVERGE / canonical learner-ID candidate.** Preserve `kids` ID where live references reconcile; extract relationship authority and keep summary fields rebuildable. |
| root `students/{id}` | Learner-shaped namespace also used for learner-scoped progress/projection documents | LearnerProfile compatibility + learning projections | **COMPATIBILITY / PROJECTION until live classification.** Must not become a second Person authority; same-ID rows may remain learner-scoped projections keyed by canonical kid ID. |
| `parents/{parentId}/students/{studentId}` | Legacy student-creation path with its own auto-generated student ID | Legacy compatibility → explicit link to Person/LearnerProfile | **COMPATIBILITY.** Students are not Auth users. Link each meaningful legacy row to a canonical kid/person before retirement; never merge by name. |
| `parents` | Role mirror created at `parents/{uid}` for parent users; contains parent-specific profile/preferences | Person + RoleAssignment + guardian/household profile | **CONVERGE.** Role mirror, not independent Person authority. Preserve ID value where it matches the user/person ID. |
| `teachers` | Role mirror created at `teachers/{uid}` plus derived monthly `teachers/{id}/earnings/{month}` read model | Person + FacultyProfile / FacultyEngagement; monthly earnings child = projection | **CONVERGE/PRESERVE.** Teacher mirror is not separate Person authority; preserve the shared ID value after live verification and keep monthly earnings rebuildable. |
| `schools` / `SchoolRecord` | School profile, status, contact/location, LP assignment, current academic year | Organisation + School Partnerships | **Strong foundation.** Converge role/assignment fields without replacing working school identity. |
| `schoolUsers` / `SchoolUserAccess` | School-admin access keyed by user ID with `schoolIds[]` and `primarySchoolId` | OrganisationMembership + RoleAssignment | **CONVERGE.** Preserve verified user/person and school IDs; replace array authority with membership records while keeping access uninterrupted. |
| School academic year/grade/section models | Live footprint: 1 school, 1 academic year, no grades/sections/teachers/progress rows yet | Organisation/Campus + AcademicYear + Grade + Section + School Partnerships | **PRESERVE foundation.** No current migration conflict; keep Section distinct from general LearningGroup unless explicitly bridged later. |
| `enrollments` / `Enrollment` | 209 live docs; all resolve to Course and retain rate/currency/credits/topicProgress; teacher + schedule + finance/entitlement concerns remain embedded | Enrollment + DeliveryOffering relation + TeachingAssignment + SchedulePlan + Commerce/Entitlement/Finance | **PRESERVE ID/LIFECYCLE, NARROW OWNERSHIP.** 136 active-like; current-looking missing-teacher/unconfigured rows have no future sessions. |
| `courses` / `Course` | 9 live docs (7 active); all have name + track/area + duration; production currently has no numeric level, embedded price, topics, frequency or capacity fields | Programme + Course + CurriculumVersion + DeliveryOffering defaults where applicable | **CONVERGE.** Preserve Course IDs. Numeric level is a normalization gap, not a required existing invariant. Commercial ownership stays outside Course. |
| `classSessions` / `TeacherSession` | 14,257 physical occurrences; all 4,495 today/future rows resolve to Enrollment + Course and have financial snapshots; zero multi-learner sessions | ClassSession + SessionParticipant + SessionStaff + Attendance + historical finance/commercial snapshots where required | **PRESERVE occurrence history + CONVERGE relationships.** 161 missing Enrollment refs are all past-dated historical debt; no current/future orphan. |
| `operationalEnrollmentKeys` | 70 uniqueness reservations; all 70 resolve to Enrollment | Enrollment uniqueness/idempotency workflow state | **WORKFLOW asset.** Preserve until canonical Enrollment creation owns equivalent uniqueness guarantees. |
| `enrollmentCreationOperations` | 79 idempotency operation records | Command/idempotency evidence | **WORKFLOW/EVIDENCE.** Preserve migration-safe replay semantics. |
| `enrollmentCourseTransitions` | 5 completed transition records; all source/destination Enrollment and destination Course refs resolve | Enrollment lifecycle transition evidence | **PRESERVE EVIDENCE.** Keep new-enrollment-on-course-change behavior. |
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

### A. User identity vs role/relationships — code decision recorded

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

Existing auth-backed users may preserve their current `users` document-ID value as the initial Person ID **only after the live audit confirms 1:1 consistency**. Firebase UID then becomes an AuthIdentity provider subject rather than the semantic Person owner. Wave 1 must migrate authority without breaking current Firebase login behaviour.

### B. Duplicate learner shapes — canonical direction recorded

Both `kids` and `students` exist with overlapping learner semantics.

Repository evidence makes `kids/{kidId}` the canonical learner-ID candidate. Root `students` and nested `parents/{parentId}/students/{studentId}` must be reconciled as projection/compatibility/legacy rows. The live audit must determine which rows share the canonical kid ID and which require an explicit link. No collection or learner record is deleted or merged by naming alone.

### C. Enrollment mixes domains — ownership decision recorded

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

Live audit confirms this is a migration boundary, not a data-integrity failure: all 209 Enrollment→Course references resolve, all 209 retain money/credit snapshots, and the working idempotency/transition safeguards are consistent. Preserve Enrollment identity/history while extracting TeachingAssignment, SchedulePlan, Commerce/Entitlement/Finance ownership.

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

### E. Course / curriculum / delivery ownership — decision recorded

Legacy code supports academic, delivery and commercial Course fields, but live production Course documents are leaner: all 9 have name/track/duration, while none currently populate price, topics, frequency, capacity or numeric level. Target ownership remains:

```text
Programme → Course → CurriculumVersion
                    ↓
             DeliveryOffering
                    +
         Product / CommercialOffer
```

Do not backfill a numeric level merely because an older admin form expected one; define explicit academic sequence metadata during canonical migration.

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
- local `preflight` validation plus the deployment-only GitHub workflow.

## 5. Verified academic/enrollment state and remaining unresolved items

Identity decisions are recorded in [IDENTITY_REFERENCE_AUDIT.md](./IDENTITY_REFERENCE_AUDIT.md).

Academic/enrollment decisions and live evidence are recorded in [ACADEMIC_ENROLLMENT_AUDIT.md](./ACADEMIC_ENROLLMENT_AUDIT.md).

Verified production facts:

- 9 Courses, 7 active;
- 209 Enrollments; 209/209 Course references resolve;
- 51 active-like canonical rolling schedules, 83 active-like legacy-compatible schedules, 2 active-like unconfigured rows with no future sessions;
- 14,257 ClassSessions; 4,495 today/future rows all have Enrollment, Course and financial snapshot coverage;
- zero multi-learner ClassSessions;
- 161 missing Enrollment references exist only on past ClassSessions;
- all 70 operational enrollment keys resolve;
- all 5 enrollment course transitions are complete and internally resolved;
- no standalone Programme/CurriculumVersion/DeliveryOffering/LearningGroup/GroupPlacement/TeachingAssignment/SchedulePlan production collections exist yet.

Non-academic items that remain unresolved for later work packages:

- `progress` record taxonomy;
- `parentWallets` canonical/subledger/projection classification;
- `rescheduleCredits` ownership;
- generic `cases`;
- generic game `sessions` / `transactions`;
- recording retention/evidence semantics;
- Shared Experience / design-system ownership and reuse inventory.

No production migration is authorized merely because Wave 0 ownership is now defined.

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

Identity/reference and Academic/Enrollment work packages are complete.

The next Wave 0 work package is **Shared Experience / Design-System Inventory**:

- application shells and portal frames;
- desktop/mobile navigation;
- shared page/header/breadcrumb patterns;
- list/detail/workspace templates;
- tables, filters, forms, dialogs and status components;
- responsive/accessibility/loading/empty/error patterns;
- duplicated feature-specific UI that should become controlled variants;
- design tokens and visual-governance ownership.

No runtime UI rewrite begins merely because the inventory exists.
