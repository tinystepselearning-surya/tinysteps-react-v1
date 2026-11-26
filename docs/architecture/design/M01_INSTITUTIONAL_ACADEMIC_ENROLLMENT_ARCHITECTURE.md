# M01 — Institutional, academic and enrollment foundations (D02–D04)

**Status:** Owner-directed consolidated design draft; implementation and production gates unchanged. 26 November 2026 IST. 
**Authority:** [v1 blueprint](../TINY_STEPS_SCHOOL_OS_MASTER_BLUEPRINT_V1.md), [enterprise standard](../SCHOOL_OS_ENTERPRISE_ARCHITECTURE_STANDARD_V1.md), [D01 identity](D01_IDENTITY_ARCHITECTURE.md), [registry](../registry/TSOS_V2_MASTER_RECORD_ITEM_REGISTRY_DRAFT.json), [Wave 0 map](../wave-0/CURRENT_TO_CANONICAL_MAP.md). This document completes a first integrated design pass, not independent design approval.
**Evidence:** Historical source pin 701c7ec832dbe9c531964496fa09cd4a4948ddd2; directly compared current main blobs for SchoolProgramme.ts, Enrollment.ts, schoolAuthorization.ts, schoolAcademic.ts, rollingScheduleCompatibility.ts, rollingScheduleCourseTransition.ts, firestore.indexes.json and Wave 1 ledger (all eight unchanged). Current models.ts Course/Topic, School.ts and schoolCurriculum.ts inspected directly. Earlier D01 drift caveat remains. No full rebaseline or deployed verification.

## 1. Unified target entity graph

Tenant -> Organisation -> Campus (optional for virtual delivery); Tenant -> contextual principal memberships; Person -> LearnerProfile; Organisation -> AcademicYear -> Grade -> Section; Programme -> Course via explicit programme-course membership; Course -> CurriculumVersion -> Unit -> Skill/lesson relationships; Course -> DeliveryOffering -> Enrollment -> LearnerProfile; Enrollment -> GroupPlacement -> LearningGroup; TeachingAssignment -> exactly one Enrollment or LearningGroup; institutional placement -> LearnerProfile + academic year/section; SchedulePlan -> Enrollment or LearningGroup (D05); ClassSession -> participant/staff records (D05); attendance and finance consume versioned delivery evidence, not mutable current enrollment attributes.

Distinguish commercial agreement, entitlement and billing account (D08), faculty engagement (D09), and learning evidence (D07). No second Person, Enrollment, Course, or school attendance authority. A physical section is not automatically a delivery group; an institutional placement is not the same as an academic course enrollment.

## 2. D02 — Tenant, organisation and authorization

Recommended deployment topology: retain existing Firebase project/default Firestore for Tiny Steps-owned operations. Treat tenant as security/customer boundary, organisation as operating/legal entity, campus as location. Tiny Steps online and owned preschool may operate within one tenant with explicitly authorized sharing; a B2B service relationship is NOT authority to join school customer data or grant its principal access to other schools. Independent SaaS tenants default isolated; evaluate a dedicated project/database/stamp before onboarding where contractual/security/recovery needs warrant it. Do not create per-record-type physical databases.

| Record | Candidate storage | Grain and owner | Migration posture |
|---|---|---|---|
| TEN Tenant | tenants/{tenantId} | One customer/security boundary; platform identity | New candidate; collision check |
| ORG Organisation | organisations/{organisationId} | Existing institutional identity | Reuse; add tenant binding prospectively after approved mapping |
| CAM Campus | campuses/{campusId} | Physical location belonging to one organisation | New candidate; no fake campus for online |
| MEM OrganisationMembership | organisationMemberships/{membershipId} | Existing person/organisation/role relationship | Reuse, retain existing ID and role vocabulary |
| TMB TenantMembership | tenantMemberships/{membershipId} | Person/tenant admission or access eligibility; not a business permission | New candidate |
| CTX ContextualRoleGrant | contextualRoleGrants/{grantId} | Proposed tenant/org/campus-scoped capability grant | New candidate only if existing ROL extension cannot satisfy context safely; prefer extend ROL, never competing grant authority |
| OPR OrganisationProfile | organisationProfiles/{organisationId} | Existing operational contact/location/profile | Reuse |
| OAS OrganisationAssignment | organisationAssignments/{assignmentId} | Existing explicit LP responsibility | Reuse, distinct from membership and role |
| SPTN partnership relationship | Logical SchoolPartnership concept; physical binding pending D09 | Provider/customer contract and explicitly scoped service relationship | Do not use shared tenant ownership to imply access |

CTX is an unresolved alternative, not a new canonical store or registry allocation. Final ADR chooses either extension of ROL or a successor with explicit handoff; no simultaneous independent grant authority. SPTN is descriptive label, not a three-letter record code.

TEN status active/suspended/closed; CAM and TMB status active/inactive; contextual grants must agree with resource owner. All candidate paths require source collision/dependency checks; no blanket namespace move. Existing root/nested paths retained until verified migration. Scope binding for new tenant-owned roots is tenantId, plus organisationId/campusId when meaningful; tenantId is a security partition, not a substitute for policy enforcement. Platform-global Person data remains tightly controlled. Tenant-specific views and local IDs do not expose cross-tenant identity links. Explicit authority and lawful purpose required for linkage.

Authorization resolver (design): authenticated principal -> current trusted tenant eligibility -> valid scoped grant/capability -> resource scope equality -> domain relationship and purpose -> field allowlist. Missing, unknown, revoked or inconsistent context fails closed for NEW paths. Existing paths stay under current Rules/authorization until separately gated. Never trust tenantId/role in request or custom claims alone. Tenant membership alone grants no student access. Tenant changes require fresh context; cache keys include tenant/actor/scope/policy revision. Revocation design must bound staleness, invalidate projections, and recheck high-risk writes; no numeric SLA without evidence. Separate platform support access (explicit ticket, scoped, time-bound, audited) from customer roles. No broad customer list of people. Jobs, exports, links, media, collection-group queries, caches, reports and restore destinations enforce same scope. Server Admin SDK bypasses Rules, so enforce commands independently; direct clients default deny on new paths until reviewed.

| Actor | Proposed target access; preserve current behavior |
|---|---|
| Platform admin/founder | Explicit current global operations under existing policy; future tenant-specific support scope, no new implicit rights |
| Assigned learning partner | Existing assigned-school management scope; no cross-customer access beyond explicit relationship |
| Existing schoolAdmin/principal | Current reader only; do not grant writes by renaming role |
| Future owned preschool principal | Separately approved school/campus capabilities for roster, attendance and management |
| Teacher | Assigned learner/group/session and minimum necessary information; no unrelated finance/health/staff-private access |
| Parent/guardian | Verified guardian and permitted learner/field access, not household membership alone |
| Finance/admissions/support | Explicit task-scoped capabilities; no default unrestricted learner chart |
| Learner | Own approved age-appropriate learning surface; no permission implied by mere profile |

Migration: schools -> ORG/OPR; schoolUsers -> MEM/ROL using verified IDs and scope; school LP assignment -> OAS; school-local teacher profile remains local until verified Person/FPR linkage; no name/email-only merge or customer linking. TEN/CAM/TMB facts require approved authoritative mapping or prospective capture; do not infer tenant or campus from geography. Preserve existing principal read-only behavior confirmed by ensureSchoolReader/ensureSchoolManager. Existing school status active/paused/archived semantics preserved. Exact support grants, revocation SLA, tenant isolation mechanism and independent customer onboarding remain review gates.

## 3. D03 — Academic catalogue and institutional structure

| Record | Candidate path | Grain / target behavior |
|---|---|---|
| PRG Programme | programmes/{programmeId} | Academic programme; reusable across offerings where authorized |
| CRS Course | courses/{courseId} | Preserve course identity, academic definition only |
| PCM ProgrammeCourse | programmeCourses/{membershipId} | Explicit course-to-programme relationship/order; many-to-many if required |
| CUR CurriculumVersion | curriculumVersions/{curriculumVersionId} | One version of curriculum for one course; published versions immutable |
| UNT CurriculumUnit | curriculumVersions/{curriculumVersionId}/units/{unitId} | Ordered version-specific unit |
| SKL Skill | skills/{skillId} | Stable assessable competence with versioned interpretation if changed |
| USK UnitSkill | curriculumVersions/{curriculumVersionId}/units/{unitId}/skillLinks/{linkId} | Explicit unit-skill mapping; bounded queries |
| AYR AcademicYear | schools/{schoolId}/academicYears/{yearId} | Preserve current school/year key; future organisation context mapping |
| TRM AcademicTerm | schools/{schoolId}/academicYears/{yearId}/terms/{termId} | Candidate new period within year |
| GRD Grade | schools/{schoolId}/academicYears/{yearId}/grades/{gradeId} | Existing grade/year context |
| SEC Section | schools/{schoolId}/academicYears/{yearId}/sections/{sectionId} | Existing institutional class cohort |

Nested academic paths intentionally retain current school root while organisation identity converges. Canonical references use verified school->organisation mapping; year/grade/section IDs may be local to parent paths, never use bare sectionId as global identifier. For registry references define contextual composite keys, not strings presumed globally unique; no duplicate root copies. Year rollover creates next-year records; never rewrite old year/grade/section history. Current year pointer remains existing school command transaction; migrate authority only after equivalent atomic contract. Terms are optional by programme; school local dates/calendar/time zone are explicit. Programme/course/curriculum may be shared as approved platform catalogue; tenant-specific copies/overrides require separate ownership and version references. No arbitrary cross-tenant catalogue access. 

Course source: src/types/models.ts Course includes optional id, name, area, level, description, durationMinutes, sessionFrequency, ratePerSession, topics, prerequisites, targetAge, targetGrade, maxStudentsPerSession, status, createdBy/At, updatedAt. This is a source interface, not proof of all fields in live documents. Target course retains name/area/description/level as academic facts when verified; curriculum topics and skill relationships move to CUR/UNT/USK after mapping; duration/frequency/capacity are delivery parameters (DLV); pricing belongs to Commerce/Finance, not Course. Age/grade targeting remains guidance, not access/placement eligibility unless an approved rule says so. Preserve all legacy values; do not fabricate missing level, dates, content, assessment or currency. School phonics constants preserve existing stage IDs, labels, order and TS reading-level references as internal programme benchmarks, not standardized norms. Publish curriculum versions with content hash, review actor and effective date; do not silently edit historical lesson/assessment references. D07 supplies lesson definitions, observation and skill evidence. B2B aggregate progress remains aggregate; no synthetic individual observations.

State design: course draft/active/inactive source codes retained; programme draft/active/retired, curriculum draft/published/retired proposed; publish verifies version uniqueness, valid ordered units and referenced skills. Retire prevents new selection, not historical resolution. AYR planned/current/closed and GRD/SEC active/inactive preserve existing codes. Validate term/date bounds and no conflicting current academic year. Current grade/section checks include some nontransactional guards in existing source; future command design must protect concurrent deactivate/create, without claiming existing production bug.

## 4. D04 — Academic enrollment and delivery

| Record | Candidate path | Grain and ownership |
|---|---|---|
| DLV DeliveryOffering | deliveryOfferings/{offeringId} | Course delivered in a defined format/context; catalogue |
| ENR Enrollment | enrollments/{enrollmentId} | One learner in one academic offering/lifecycle; SIS, retain existing IDs |
| GRP LearningGroup | learningGroups/{groupId} | Actual delivery cohort within offering/context; scheduling |
| GPL GroupPlacement | groupPlacements/{placementId} | One effective learner enrollment-to-group episode |
| TAS TeachingAssignment | teachingAssignments/{assignmentId} | One faculty responsibility episode for enrollment OR group |
| IPL InstitutionalPlacement | institutionalPlacements/{placementId} | Learner/year/grade/section/campus placement; SIS; not a duplicate course enrollment |

DLV retains candidate deliveryMode oneToOne/smallGroup/schoolProgramme; extend explicitly for in-person/hybrid modality through separate deliveryChannel (online/inPerson/hybrid) rather than confusing class size with channel. Group capacity is positive and effective; offering-level default and group override require approved policy and effective dates. Preserve published/current group limit (maximum four for current advertised small groups) and legacy business exceptions; never infer every school group must have four. New group join transaction checks capacity and active placement uniqueness using bounded counters/reservations with reconciliation; no unconditional count of entire roster on each write. 1:1 does not require artificial group. Assignment targetType enrollment or learningGroup; both must resolve to same tenant/offering context. Teachers may have multiple assignments; eligibility/availability checks separate D05/D09. Existing school section.teacherIds is compatibility/aggregate evidence, not canonical individual session staff.

Critical lifecycle correction: src/types/Enrollment.ts declares pending_teacher, pending_lp_assignment, pending_payment, active, cancelled, but rollingScheduleCompatibility also handles trial, paused, discontinued and terminal aliases; rollingScheduleCourseTransition explicitly uses completed/discontinued and distinguishes progression/correction. Do NOT use the five-value interface as exhaustive production enum or silently normalize active-like status. Keep the old source enum intact in registry, mark ENR-1004 target vocabulary unresolved, add a separate proposed mapping set only after complete lifecycle source/coverage review. Unknown status blocks migration of affected row, not silently cancels/reactivates. Preserve course-change creation of a NEW enrollment, progression vs correction, historical credits semantics, discontinuation, reactivation, rolling scheduling and idempotent operation keys. Preserve multiple courses per learner, returning enrolments and parent/teacher visibility. Teacher reassignment does not replace enrollment identity. Do not derive historical start/end from audit timestamps, current teacher or today's fee.

| Existing fact | Proposed destination / mapping |
|---|---|
| enrollment id | ENR stable verified ID |
| studentId/kidId/kidIds | Verified LearnerProfile reference; multi-learner shape requires explicit split/mapping decision, not arbitrary first child |
| courseId | Resolve Course and existing/new DLV from verified mode/context; no fabricated offering or universal default |
| parentId | Guardian/payer/context linkage only via verified evidence; no new guardian or payer by string copy |
| teacherId | TAS current relationship if verified; retain historical reassignment events and session staff snapshots |
| lpId | Existing LP responsibility; classify org/enrollment-specific semantics before migration |
| schedule/recurrence | SCP (D05); retain time zone, exception and materialization contract |
| ratePerSession/billingCycle | D08 commercial terms with effective dates; preserve session/charge snapshots |
| creditsTotal/Used/Remaining | Existing lifecycle/commerce evidence; preserve exact values and distinguish obsolete reschedule credits from relevant remaining course credits |
| group/section links | GPL or IPL only where verified; no inferred cohort from teacher/time coincidence |
| createdAt/updatedAt | Audit history, not business participation dates |
| operationalEnrollmentKeys, enrollmentCreationOperations, enrollmentCourseTransitions | Existing uniqueness/replay/evidence mechanisms retained until equivalent verified successor |

### Command and query boundaries

| Proposed service | Contract |
|---|---|
| createTenant/createCampus/assignMembership | Approved scoped operator, tenant identity and contextual authorization; no automatic onboarding |
| publishCurriculum/createOffering | Version/content checks, valid course, delivery parameters, scope; immutable published references |
| createAcademicYear/switchYear/upsertSection | Preserve current source commands, current-year transaction and historical records; enforce cross-scope and concurrent lifecycle checks |
| createEnrollment/transitionCourse | Reuse existing idempotency and uniqueness; preserve current enrollment operations and correction/progression distinctions |
| assignTeacher/changeTeacher | Effective-dated assignment, verified active faculty eligibility, no enrollment ID change; coordinate schedule changes D05 |
| placeLearner/moveGroup | Transactional scope/capacity checks, close old and create new episode where applicable; no historical rewrite |
| placeInSection/promoteLearner | Institutional placement per academic year, preserve previous year's data, explicit re-placement |
| pause/resume/endEnrollment | Current behavior retained; coordinate future scheduling and finance effects, no duplicate charges or historical mutation |
| getAcademicCatalogue/getEnrollmentContext/getGroupRoster | Bounded authorized projections; maintain existing portal/mobile DTOs and scoped field allowlists |

New service names are logical proposals, not claims of existing functions. Existing transition callable spans multiple steps/commands; design for explicit progress, operation replay and reconciliation/compensation, not assumed single atomic transaction. Preserve authoritative writer per fact and compatibility direction during cutover.

## 5. Storage, query and security contracts

Root candidates are logical, scoped and unprovisioned. New paths default deny; validate scope at both command and query boundary, including related documents and projection outputs. Do not store unbounded membership arrays, arbitrary contact/health/fee details inside academic documents or query all learners. Existing read models preserved; academic metadata cached/versioned outside production Firestore item-level lookup. Query shapes to test (candidate composites only, not approved indexes):
- Tenant membership by authorized person+tenant+status; ORG by tenant+status; CAM by tenant+organisation+status.
- Course/Programme by authorized catalogue scope+status; curriculum version by verified course+version/status; nested units by order; academic years/grades/sections by exact scope.
- Enrollment by tenant+learner+status, tenant+offering+status; roster by exact group+active placement; assignment by target type/id or faculty+status; institutional placement by scoped year/section/status. Use bounded limit/cursor and deterministic order; no queries across tenant on a caller-supplied arbitrary key.
- Existing operational enrollment keys reserve learner/course uniqueness under existing semantics; new offering-aware uniqueness only after reviewed compatibility, no relaxing duplicates or breaking multiple-course enrollment.
- Compare current firestore.indexes.json against each final query and test emulator; no index deployed by this design. Budget read/write cost by exact workflow before code approval, including Rules-dependent reads, mirror/catch-up, index entries and projections; no numerical production cost claims. Avoid N+1 joins by bounded server queries/authorized projections with freshness/rebuild policy.

## 6. Migration waves and acceptance

1. Inventory and approve actual affected scope, source->target mapping, path collision, all writers and legacy/native/mobile consumers; keep current business behavior.
2. Approve D02 tenancy/permission and D03/D04 schemas/field IDs, storage keys, lifecycle rules and recovery. Implement additive contracts in isolated dev only after existing P01/P02/P03 gates. Test before production.
3. Reuse existing identity/school/course/enrollment data wherever appropriate. For new records, create only approved prospective data; plan selective bounded backfill for verifiable historical facts. No silent historical classification or duplicate authority.
4. Dry-run exact cohort and read/write budget; reserve IDs deterministically or maintain mapping ledger; compare counts/relationships/history/financial amounts; quarantine ambiguity, preserve originals.
5. Canary per scope, idempotent incremental catch-up, revision-aware writes, shadow compare, feature-flagged consumer switch, separate writer handoff. Restore/cutover plan preserves post-switch writes. Observe and retire only when dependency and explicit safety gates pass.

## 7. Cross-package validation and handoff

Design scenario checks (review, not executed runtime tests): same Person as parent and teacher; guardian with two children; two independent tenants cannot read each other's child, group, projection or media; partner principal remains reader; owned campus capability separate; virtual enrollment no fake campus; grade/year rollover retains history; one learner in multiple courses; teacher change retains enrollment; group movement retains episode history; duplicate active placement rejected; course correction and progression preserve distinct results and operation keys; legacy paused/trial/terminal status not discarded; curriculum retirement retains historical assessment; aggregate school progress never converted to child observations; fees/attendance never changed by schema extraction.

Registry consistency checks cover proposed code/field IDs, references and value sets; new contextual scope/reference semantics and all field bindings remain unadopted. Missing current production path, effective IAM/Rules, data cardinality, exact role lifecycle and full schema coverage explicitly unverified. D01 profile field detail remains pending. No live reads, runtime tests, CI or deployments. Independent review, P01 acceptance and formal P02/P03/P04/affected phase authorization remain required.

Next milestone M02: D05–D07 — scheduling, classroom, attendance, learning and assessment; then M03: D08–D10 — commerce/finance, school operations and platform foundations, followed by holistic design closure and approved implementation. Reconcile D02 scope and D03/D04 relationship semantics with subsequent packages rather than inventing duplicate records.
