# Wave 0 Exit Review — School OS

**Status:** COMPLETE  
**Decision:** **GO — WAVE 1 MAY BEGIN AT EXPAND**  
**Reviewed baseline:** main through Shared Experience PR #569  
**Production migration authorized by this document:** No

## 1. Purpose

This review determines whether Wave 0 has completed its architecture-contract objective and whether Tiny Steps can safely begin Wave 1 — Identity & Relationships.

The decision is deliberately narrower than "all migration is approved."

A **GO** means:

- canonical ownership is sufficiently defined;
- production evidence supports the key identity and academic assumptions;
- migration execution rules are frozen;
- Wave 1 may begin with an EXPAND brick.

It does **not** authorize an unbounded backfill, read switch, legacy deletion or cross-domain rewrite.

## 2. Wave 0 package completion

| # | Work package | Status | Primary evidence |
|---:|---|---|---|
| 1 | Engineering Delivery Baseline | **COMPLETE** | local-first preflight/testing; deployment-only permanent GitHub workflow; temporary CI retirement rules |
| 2 | Architecture Contracts + Current-State Map | **COMPLETE** | Wave 0 contracts + current-to-canonical ownership map |
| 3 | Identity & References Audit | **COMPLETE** | code audit + live read-only Firestore reconciliation + bounded exception classification |
| 4 | Academic & Enrollment Audit | **COMPLETE** | code audit + live Course/Enrollment/Schedule/Session verification |
| 5 | Shared Experience / Design-System Inventory | **COMPLETE** | repository-wide static shell/component/token inventory and convergence rules |
| 6 | Migration Standard + Exit Review | **COMPLETE** | Migration Execution Standard v1 + this exit review |

## 3. Wave 0 exit-gate review

### Gate 1 — Canonical terminology is stable

**PASS**

The following core concepts have stable definitions in the blueprint/contracts:

- Person;
- AuthIdentity;
- RoleAssignment;
- LearnerProfile;
- GuardianRelationship;
- Household;
- Organisation;
- OrganisationMembership;
- Programme;
- Course;
- CurriculumVersion;
- DeliveryOffering;
- Enrollment;
- LearningGroup;
- GroupPlacement;
- TeachingAssignment;
- SchedulePlan;
- ClassSession;
- SessionParticipant;
- SessionStaff;
- canonical/evidence/projection/workflow/compatibility classes.

No current Wave 1 decision requires inventing a competing vocabulary.

### Gate 2 — High-value current structures have a destination or explicit unresolved status

**PASS**

The current-to-canonical map covers the major production structures used by Identity, Learner/Enrollment, Scheduling, Admissions, Schools, Finance, Communication, Attendance and platform workflows.

Remaining unresolved concepts are explicitly registered for later domain waves, including:

- progress record taxonomy;
- parent-wallet exact ledger/projection classification;
- reschedule-credit ownership;
- generic cases;
- generic game sessions/transactions;
- recording retention/evidence semantics.

These do not block Wave 1 Identity & Relationships because their canonical dependency comes later.

### Gate 3 — Identity/ID reuse rules are agreed and production-verified

**PASS**

Live Identity audit established:

- 223 users;
- populated userId values match user document ID at 222/222;
- populated uid values match user document ID at 76/76;
- 188/188 parent role mirrors align;
- 30/30 teacher role mirrors align;
- 194 kids;
- no live root students;
- no live nested parent-students;
- zero learner/parent/teacher identity ambiguity in Enrollment.

Decision:

~~~text
existing users/{id}
→ preserve value as existing Person.id
→ Firebase UID becomes AuthIdentity.providerSubject

kids/{kidId}
→ preserve as canonical learner/person identity candidate
~~~

New Person IDs are Tiny Steps generated and are not provider/email/phone-derived.

### Gate 4 — Relationship duplication is understood

**PASS**

Current convenience relationships are documented, including:

- users.childIds[];
- assignedKids[];
- learner parent aliases;
- learner/Enrollment teacher fields;
- schoolIds[];
- Enrollment teacherId/parentId;
- session aliases.

Target authority is explicit:

~~~text
GuardianRelationship
TeachingAssignment
OrganisationMembership
RoleAssignment
GroupPlacement
SessionParticipant
SessionStaff
~~~

Legacy fields may remain compatibility paths during cutover but cannot remain competing permanent authority.

### Gate 5 — Canonical truth vs projection/workflow/evidence is understood

**PASS**

Wave 0 explicitly classifies:

- canonical operational state;
- immutable/ledger/evidence;
- projection/read model;
- analytical data;
- workflow/operational state;
- external evidence;
- legacy compatibility.

Examples already verified:

- teacher monthly earnings child records are projection;
- parent monthly read models are projection;
- operationalEnrollmentKeys are uniqueness/workflow state;
- enrollmentCreationOperations are idempotency/workflow evidence;
- enrollmentCourseTransitions are lifecycle evidence;
- attendance external evidence does not own attendance truth.

### Gate 6 — Academic/Enrollment dependency decisions required by Wave 1 are stable

**PASS**

Live audit established:

- 9 Courses, 7 active;
- 209 Enrollments;
- 209/209 Enrollment → Course references resolve;
- no Enrollment identity ambiguity;
- 14,257 ClassSessions;
- all 4,495 current/future sessions resolve to Enrollment + Course;
- zero multi-learner ClassSessions;
- existing enrollment uniqueness/transition safeguards are internally consistent.

This confirms Wave 1 can preserve current Enrollment/Scheduling behaviour while changing identity foundations underneath through compatibility adapters.

### Gate 7 — Shared Experience governance is documented

**PASS**

Repository inventory established:

- shared UI primitive foundation;
- MobileTabBar shared by 4/5 authenticated portals;
- AppShellHeader partial convergence;
- public Header/Footer canonical ownership;
- AuthenticatedAppShell target;
- Workspace/List/Detail/Form template direction;
- semantic Loading/Empty/Error/Access/Status contracts;
- Tailwind + semantic CSS-variable token direction;
- accessibility/native safe-area behaviour as shared capability.

No UI rewrite is required to begin Wave 1.

### Gate 8 — Migration evidence/retirement standard exists

**PASS**

Migration Execution Standard v1 defines:

- migration manifest;
- bounded lifecycle;
- compatibility registry;
- exception registry;
- reconciliation requirements;
- read/write authority;
- rollback;
- observation;
- legacy-write stop;
- retirement criteria;
- secrets policy;
- CI posture;
- temporary test/workflow retirement.

### Gate 9 — No unresolved ownership contradiction blocks Wave 1

**PASS**

Wave 0 found bounded stale/historical exceptions but no unresolved conceptual contradiction requiring a different identity model.

Important bounded exceptions remain:

- stale active-looking Enrollment with missing learner and no future sessions;
- stale active-looking learner/Enrollment teacher reference with no future sessions;
- stale assigned demo;
- historical demo attribution;
- orphan Learning Partner mirrors;
- admin mirror consistency gap;
- historical session references to retired/missing Enrollments.

These must be classified/handled by the relevant migration brick, but they do not prevent the canonical identity structures from being expanded.

## 4. Product-quality gate

Wave 1 implementation must preserve the product-quality contracts frozen in the master blueprint.

### Accessibility

No migration may knowingly regress keyboard access, focus visibility, labels, semantic navigation or WCAG 2.2 AA-targeted behaviour.

### Performance

Identity compatibility/read adapters must not introduce unbounded reads or global scans into portal request paths.

### Privacy

Child/family identity backfills must read only the minimum fields required for identity/relationship reconciliation.

### Public discoverability

Wave 1 is primarily authenticated-domain work. Public route/canonical/search behaviour should remain untouched unless explicitly required and separately verified.

## 5. Engineering gate

**PASS**

Permanent workflow model is still:

~~~text
local validation
→ PR
→ main
→ deploy.yml
→ production verification
~~~

One-off audit workflows created during Wave 0 were removed after use.

Wave 1 must not recreate multiple permanent CI workflows.

## 6. Formal decision

# GO — WAVE 1 MAY BEGIN

Wave 0 has satisfied its objective.

Wave 1 may begin with:

~~~text
Wave 1 — Identity Foundation Expand
~~~

The first brick may define the physical canonical identity/relationship schema and compatibility contracts.

## 7. What this GO authorizes

Authorized:

- create Wave 1 branch/brick;
- define physical Person/AuthIdentity/RoleAssignment/LearnerProfile/relationship schemas;
- define Firestore indexes/security contracts;
- implement canonical repositories/adapters/commands;
- add compatibility readers/projections;
- add dry-run migration tooling;
- add bounded migration reports/tests;
- perform read-only production audits required to finalize backfill scope.

## 8. What this GO does not authorize

Not yet authorized:

- broad production identity backfill without a reviewed manifest/dry run;
- switching parent/teacher/admin reads to canonical records before VERIFY;
- stopping legacy writes;
- deleting users/kids/parents/teachers fields or collections;
- changing Firebase Auth identifiers;
- replacing Enrollment/Scheduling/Attendance/Finance structures;
- deleting historical stale/orphan records;
- moving unrelated domain migrations into Wave 1.

Each later phase requires its own migration gate.

## 9. Wave 1 entry invariants

Wave 1 must preserve:

1. Firebase login behaviour.
2. Existing verified user and kid ID values.
3. Parent/teacher access.
4. Current Enrollment and ClassSession reference behaviour.
5. Current school access.
6. Resource-scoped authorization.
7. Existing production UI flows.
8. Historical evidence/finance/session records.
9. Bounded Firestore reads/writes.
10. Compatibility until canonical read/write cutover is verified.

## 10. Recommended first Wave 1 brick

### Wave 1 — Identity Foundation Expand

Deliverables:

- physical Person schema;
- physical AuthIdentity schema;
- physical RoleAssignment schema;
- LearnerProfile schema;
- GuardianRelationship schema;
- OrganisationMembership schema;
- Household/Organisation reference contracts required for identity scope;
- compatibility mapping from users/kids/role mirrors;
- security/index design;
- deterministic ID-adoption rules;
- migration manifest;
- dry-run reconciliation plan;
- local tests + permanent-invariant decision.

Non-goals for the first brick:

- no mass backfill;
- no read switch;
- no legacy-write stop;
- no deletion;
- no UI redesign;
- no scheduling/finance rewrite.

## 11. Wave 0 completion statement

Wave 0 is complete when measured against both the Migration Roadmap and the Wave 0 Architecture Contracts.

The architecture is now sufficiently specific to answer:

- who owns the business fact;
- what is canonical;
- what is derived/evidence/workflow;
- what is legacy compatibility;
- whether an ID is preserved or replaced;
- how a relationship migrates;
- how a backfill is bounded and reconciled;
- when reads may switch;
- when legacy writes may stop;
- when retirement is safe;
- how shared UI should be reused instead of copied.

Wave 0 therefore closes with **GO for Wave 1 EXPAND**.
