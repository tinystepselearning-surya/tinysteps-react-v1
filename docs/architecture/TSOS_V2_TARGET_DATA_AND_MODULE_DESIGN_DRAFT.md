# TSOS V2 — Target data and module design, first design draft

**Status:** Owner-directed design proposal, independent review pending; not an approved P02/P03 gate exit, executable schema or production change authorization.
**Date:** 26 November 2026 IST. Source pin: 701c7ec832dbe9c531964496fa09cd4a4948ddd2.
**Authority:** [Frozen master blueprint v1](TINY_STEPS_SCHOOL_OS_MASTER_BLUEPRINT_V1.md), [adopted engineering standard](SCHOOL_OS_ENTERPRISE_ARCHITECTURE_STANDARD_V1.md), [Wave 0 current-to-canonical map](wave-0/CURRENT_TO_CANONICAL_MAP.md), [V2 programme](SCHOOL_OS_ENTERPRISE_IMPLEMENTATION_PROGRAMME_V2.md). This is a design input to the proposed sequencing ADR; stricter existing gates prevail.

## 1. Direction and non-goals

Design the intended long-term logical architecture first, reuse sound current structures, extend compatible ones and introduce absent capabilities additively. Capture genuinely new facts prospectively after approved implementation. Migrate existing data into designated canonical collections/subcollections within the same Firestore database by default when the destination contract and affected release gates are ready. This is incremental transformation, not a wholesale copy or new database requirement. Preserve existing IDs where verified, provider aliases, business history, access behavior and online operations. No blanket copy, invented history, permanent dual authority, generic EAV store, or destructive cleanup. Separate physical stores only with a reviewed justification.

A missing field in source is not evidence that the fact is absent in production. Distinguish verified source contracts, historical evidence, unverified live coverage and candidate new design. No allocation of new production record IDs, collection provisioning, code/runtime wiring, migration or data capture is authorized here.

## 2. Domain design catalogue (18 frozen ownership boundaries)

Record names below are logical types, not allocated collection paths. Existing and candidate surfaces must be confirmed against the record catalogue, source readers/writers, Rules/indexes and separately approved live evidence. Use one domain owner per fact.

| Existing domain | Target records / capabilities | Starting disposition |
|---|---|---|
| Growth & CRM | Lead, attribution, campaign and enquiry occurrence | Preserve current returning-enquiry semantics; extend attributable facts only when needed |
| Admissions | AdmissionsCase, AdmissionAssessment, recommendation, outcome | Extract from mixed demo workflow; preserve history; do not treat demo as academic session |
| Learner & Enrollment SIS | LearnerProfile, GuardianRelationship, Household, Enrollment, institutional placement | Reuse identity foundation; narrow enrollment; household/placement coverage unverified |
| Academic Catalogue & Curriculum | Programme, Course, CurriculumVersion, Skill, LessonDefinition, DeliveryOffering | Preserve Course IDs and curriculum assets; version curriculum and delivery separately |
| Learning / LMS | LearningActivity, Assignment, Submission, Feedback | Classify existing learning/progress paths before adoption; add missing evidence prospectively |
| Assessment & Mastery | AssessmentDefinition, RubricVersion, AssessmentEvidence, MasteryProjection | Preserve existing evidence grain; individual observations are not reconstructed from school aggregates |
| Scheduling & Classroom | LearningGroup, GroupPlacement, TeachingAssignment, SchedulePlan, ClassSession, SessionParticipant, SessionStaff | Preserve session IDs and provider links; extract independently changing relationships |
| Attendance & Evidence | AttendanceRecord, AttendanceRevision, AttendanceEvidence | Preserve official decisions and corrections; separate external evidence; no billing policy changes |
| Student Success | StudentSuccessCase, Goal, Intervention, FollowUp | Confirm current surfaces; add missing structured workflows |
| Faculty & Workforce | FacultyProfile, FacultyEngagement, recruitment, training, QA and availability | Extend existing faculty foundation and training; distinguish assignments from engagement |
| Finance | BillingAccount, Charge, Payment, PaymentAllocation, Earning, Payout, journal/evidence | Preserve authoritative financial history and reconcile allocations/amounts; no inferred balances |
| Commerce & Entitlements | Product, CommercialOffer, CommercialAgreement, Subscription/Purchase, EntitlementGrant | Separate academic delivery from commercial terms; preserve effective prices and access |
| Communication | Conversation, NotificationIntent, DeliveryAttempt | Reuse integrations and consent; no duplication of provider payloads by default |
| Support / Service Desk | SupportCase, escalation, resolution evidence | Classify current request workflows before new records |
| Safeguarding & Consent | ConsentRecord, restricted SafeguardingCase, health/emergency access as approved | Design separately restricted access and retention; collect minimum necessary facts only |
| Content & Resource Platform | LearningResource, AssetReference, resource access metadata | Preserve working worksheets/games/media; retain bounded reads and provider aliases |
| School Partnerships | Organisation/Campus, partnership/programme context, academic year/grade/section | Reuse organisation and existing school programme; keep B2B aggregates distinct from individual SIS |
| Credentials & Academic Reporting | AcademicReport, CredentialAward, evidence references | Version reports/credentials; derive from authoritative records, no fabricated mastery |

Shared platform foundations (not extra competing business domains): Person/AuthIdentity/RoleAssignment/OrganisationMembership, tenancy/context, schema/item registry, access/audit, config, integration adapters, projections and analytics. Physical school operations are capabilities mapped to existing owners (e.g. daily attendance to Attendance, fee collection to Finance, pickup permissions to Safeguarding); any new domain requires reviewed ADR. Do not equate physical daily attendance with online session billing.

## 3. Physical storage and record contract

Existing verified source constants in `functions/src/schoolOS/identity/contracts.ts` are `people`, `authIdentities`, `roleAssignments`, `learnerProfiles`, `guardianRelationships`, `households`, `organisations`, `organisationMemberships`. Reuse these contracts; do not create parallel identity collections. Their existence as code constants does not certify complete production population or role cutover. Maintain current root/nested layouts unless an approved dependency, query or isolation requirement justifies change.

Candidate logical bindings for first academic slice (not provisioned and not allocated): Enrollment retains existing `enrollments/{id}` identifier/lifecycle; TeachingAssignment, SchedulePlan, DeliveryOffering and GroupPlacement may use candidate roots `teachingAssignments`, `schedulePlans`, `deliveryOfferings`, `groupPlacements` only after catalogue/live path collision checks and ownership approval. These names already appear as unresolved inventory probes; they are not proven empty. Commercial terms destination remains pending Commerce/Finance contract review. Preserve `classSessions/{id}` occurrence history and `billingCharges`/ `teacherEarnings` as current strong candidates per Wave 0. Do not introduce a universal `v2` namespace or a second canonical Enrollment.

Every record contract must declare: stable record type and item identifiers; owner; storage binding and ID strategy; field type/cardinality/null/unknown semantics; schema version; effective time/history; actor and provenance as appropriate; access context and sensitivity; invariants; indexes/query budgets; commands/read models; current source mapping; migration and retirement gates. Tenant context and authorization must agree; never rely on a tenant field alone. Record/item IDs below are not allocated, and no mandatory fields are imposed on old documents by this draft.

## 4. First worked slice — enrollment and delivery

Source `src/types/Enrollment.ts` at pin contains id, studentId, courseId, parentId, optional teacherId/lpId, status, ratePerSession, billingCycle, creditsTotal/Used/Remaining and timestamps. This interface is not the full production schema. Wave 0 also identifies scheduling, group and financial dependencies. The following is a draft semantic mapping, not a migration script.

| Record | Candidate fields / semantics | Mapping / unknowns |
|---|---|---|
| Enrollment | stable enrollment ID, learner profile reference, delivery offering reference, lifecycle status, effective start/end, schema version | Preserve ID and status semantics; resolve student/course/offer references via verified mapping; do not manufacture dates |
| GuardianRelationship | guardianPersonId, learnerPersonId, relationshipType, status | Existing canonical contract; parentId is a reference candidate, not sufficient proof of guardian or payer role |
| TeachingAssignment | assignment ID, target enrollment OR learning group, faculty reference, effective start/end, status | teacherId is current assignment candidate; verify history and independent group teaching; lpId needs role-specific classification |
| SchedulePlan | plan ID, target, IANA time zone, recurrence, effective period, exceptions | Derive only from verified scheduling sources; no inferred local time zone or recurrence |
| DeliveryOffering | offering ID, course reference, delivery mode, curriculum version link if known, status | Existing course ID preserved; no automatic new course per enrollment or invented curriculum version |
| GroupPlacement | placement ID, enrollment reference, group reference, effective period, status | Only for confirmed group membership; no artificial group for 1:1 |
| Commercial Offer/Agreement and applicable fee/entitlement records | commercial term reference, amount in validated currency/minor units, effective dates, billing rule, access grant where applicable | Finance/Commerce review ratePerSession/billingCycle and historical credits separately; not automatic credits recreation or conversion to entitlement |
| Enrollment operational view | bounded authorized projection composed from canonical owners, schema/source revision and freshness | Keep existing UI response contracts; rebuildable, not authoritative; measure read amplification |

New field capture: use explicit unknown/uncollected/not-applicable states where needed; required prospectively only when the relevant workflow and validation are approved. Existing records are not rejected simply because they lack newly introduced fields. Derived values require deterministic evidence; manual corrections are audited; do not overwrite original history.

Example invariants: one enrollment per approved learner/offering lifecycle key; preserve existing course-change/new enrollment behavior and uniqueness reservations; teacher change does not change enrollment identity; exactly one assignment target; preserve session-level historical rates; present-only online billing remains unchanged; provider evidence is not official attendance; any ambiguous identity or money mapping is quarantined, not guessed. Effective date and time-zone rules reviewed with domain owner.

## 5. Migration playbook per record family

1. Inventory actual affected source readers/writers, legacy aliases, indexes, access and production coverage; choose REUSE, EXTEND, EXTRACT/MIGRATE or NEW.
2. Approve target contract and fields, destination collision review, provenance/mapping, compatibility, recovery/restore and bounded costs. Define field-level unknown/default behavior.
3. Build and test additively in isolated development with synthetic fixtures after relevant phase authorization. New live capture requires its own approved release, least-privilege Rules/server commands and rollback. No live records merely for testing.
4. For existing records, run separately approved bounded read-only dry-run with exact scope, deterministic mapping, missing/ambiguous counts, financial control totals and read/write budget. Do not copy data with unverified ownership.
5. Backfill idempotent batches with checkpoints and conflict detection, preserve source IDs/mapping and business timestamps, and guard against overwriting newer canonical facts. Set one authoritative writer per fact; any temporary mirror/catch-up has explicit direction and exit date.
6. Reconcile eligible/mapped/excluded/error counts, references, semantic parity, amount totals by payer/period/currency, permission-denial tests and read/latency budgets. Require approved recovery evidence and a rollback plan that preserves writes received after cutover.
7. Switch consumers by small feature-flagged slices with shadow checks and explicit rollback triggers. Transfer write authority separately where warranted. Keep current portals/mobile contracts and integrations functional.
8. Observe, reconcile and retire legacy only with complete affected dependency evidence, independent acceptance, explicit deletion authority and retention/recovery policy. No automatic deletion.

## 6. Next design sequence and review

Proposed sequence: (A) shared identity/context and metadata design reuse; (B) academic catalogue/enrollment/delivery contracts; (C) scheduling/attendance/evidence; (D) commerce/finance; (E) scoped preschool capabilities; (F) remaining domains and shared experiences. Dependency order follows the controlling programme, including Wave 1 M3 holds; design may explore later domains but implementation must respect actual gates. For each slice produce a record dictionary, current-to-target mapping, command/query and permission contract, migration class, test/rollback plan and read/write budget.

Owner direction supports design-first and selective same-database migration. Independent review and explicit sequencing ADR remain outstanding; this document is a proposed design artifact for that review, not formal P02/P03 activation. No production access, application code changes, data writes or CI/runtime results claimed.
