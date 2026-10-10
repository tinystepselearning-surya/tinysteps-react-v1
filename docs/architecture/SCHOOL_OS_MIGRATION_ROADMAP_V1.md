# Tiny Steps School OS Migration Roadmap v1.0

**Status:** ACTIVE MIGRATION ROADMAP  
**Architecture source of truth:** [TINY_STEPS_SCHOOL_OS_MASTER_BLUEPRINT_V1.md](./TINY_STEPS_SCHOOL_OS_MASTER_BLUEPRINT_V1.md)  
**Enterprise engineering standard:** [SCHOOL_OS_ENTERPRISE_ARCHITECTURE_STANDARD_V1.md](./SCHOOL_OS_ENTERPRISE_ARCHITECTURE_STANDARD_V1.md)

## 1. Purpose

This roadmap defines how the current Tiny Steps production architecture should converge toward School OS v1.0 **without a big-bang rewrite**.

The roadmap is deliberately organized into **seven waves**, not a long list of low-level implementation tasks.

Each wave may contain several PRs and may overlap in limited, controlled ways. A later wave must not invalidate the ownership contracts established by earlier waves.

## 2. Migration rules

1. **Preserve production stability over architectural purity.**
2. **Reuse current IDs wherever the old ID already represents the correct canonical concept.**
3. **Do not rewrite strong existing systems merely to rename them.**
4. **Canonicalize upstream truth before downstream analytics.**
5. **Use bounded backfills and reconciliation, never one enormous migration.**
6. **Every legacy field/collection gets a destination before retirement.**
7. **Read models may remain while their upstream source changes.**
8. **Finance and historical evidence are migrated conservatively and append-safely.**
9. **No legacy path is removed until its replacement is verified in production.**
10. **Architecture work and feature work should remain separable whenever possible.**
11. **Converge repeated UI before adding another variant.** New and migrated experiences should reuse shared shells, navigation, templates and components wherever the interaction model is materially the same.
12. **Use premium simplicity as the visual default.** New and migrated experiences should converge on an Apple-inspired Tiny Steps design language: clear hierarchy, generous whitespace, restrained colour, precise typography, purposeful motion and minimal visual noise.
13. **Treat accessibility, performance, privacy and public discoverability as migration gates.** These qualities must not regress while canonical data and UI structures are being changed.
14. **Apply the enterprise architecture standard to every durable migration.** Preserve explicit authority, contextual authorization, bounded operations, auditable transitions, rebuildable projections, provider boundaries, compatibility retirement gates and deployment blast-radius control.

## 3. Standard migration lifecycle

Every major canonical migration follows:

```text
EXPAND
   ↓
BACKFILL
   ↓
VERIFY
   ↓
SWITCH READS
   ↓
OBSERVE
   ↓
STOP LEGACY WRITES
   ↓
RETIRE
```

A wave is not complete because new code exists. It is complete only when canonical ownership is verified and the old path is either explicitly retained for compatibility or safely retired.

---

# Wave 0 — Architecture Contracts

**Implementation status:** COMPLETE — Wave 0 exit review passed.  
**Entry decision:** Wave 1 may begin at EXPAND. See `wave-0/WAVE_0_EXIT_REVIEW.md` and `wave-0/MIGRATION_EXECUTION_STANDARD_V1.md`.


## Objective

Freeze the language and ownership rules before changing production data structures.

## Scope

- adopt the v1.0 blueprint as source of truth;
- define canonical names and ownership;
- define ID, lifecycle, relationship, time and money conventions;
- define migration/versioning standards;
- identify canonical vs projection vs legacy compatibility concepts;
- establish architecture decision review for new features;
- define the shared experience-system contract for app shells, navigation, templates, components and controlled variants;
- define the premium/minimal visual design contract and the design tokens/principles needed to enforce it consistently;
- define cross-cutting accessibility, performance, child/family privacy and public discoverability contracts;
- define design-system governance so shared components gain controlled variants instead of parallel copies.

## Deliverables

- Master Blueprint v1.0;
- this Migration Roadmap;
- canonical terminology glossary where needed;
- legacy-to-canonical mapping maintained as migration work begins;
- shared experience/design-system contract, using the existing reusable blog authority layout as the precedent for configuration-driven page families;
- visual direction contract for premium, professional, Apple-inspired simplicity while preserving Tiny Steps' own brand identity;
- product-quality contracts for accessibility, performance, privacy and public discoverability;
- shared-first design-system governance contract.

## Exit gate

Wave 0 is complete when new architectural work can answer:

- who owns each business fact;
- what is canonical;
- what is derived;
- what is legacy;
- whether a proposed schema change conforms to v1.0;
- whether a new or migrated web experience can reuse an existing shared shell/template/component before a bespoke implementation is approved;
- whether the proposed experience meets the premium-simplicity standard rather than introducing unnecessary visual complexity;
- whether accessibility, performance, child/family privacy and intended public discoverability are preserved.

**No production data migration is required to complete Wave 0.**

---

# Wave 1 — Identity & Relationships

## Objective

Create stable human, household, organisation and authorization foundations without breaking current authentication or IDs.

## Canonical direction

```text
Person
AuthIdentity
RoleAssignment
LearnerProfile
GuardianRelationship
Household
Organisation
OrganisationMembership
```

## Preserve

- Firebase Authentication;
- existing user/kid IDs where they can safely serve as canonical IDs;
- current portals while compatibility projections/aliases are required.

## Converge

Legacy concepts such as:

```text
parentId / parentIds[]
teacherId on learner
assignedKids[]
childIds[]
schoolIds[]
single role fields
```

toward canonical relationships and scoped authorization.

## Exit gate

- important human identities resolve to stable canonical IDs;
- guardian/household and organisation relationships have one authoritative path;
- existing login flows continue to work;
- new features no longer create new authoritative relationship arrays.

---

# Wave 2 — Academic & Enrollment Core

## Objective

Canonicalize what Tiny Steps teaches and what a learner is enrolled in.

## Canonical direction

```text
Programme
Course
CurriculumVersion
Skill
LessonDefinition
DeliveryOffering
Enrollment
LearningGroup
GroupPlacement
TeachingAssignment
```

## Key contracts

- Enrollment = one learner in one academic Delivery Offering;
- teacher assignment is not learner identity;
- changing group placement does not change academic enrollment;
- curriculum history is versioned;
- academic Course / Delivery Offering is separate from commercial Product.

## Preserve

- working curriculum and lesson structures where they can map into the canonical model;
- existing enrollment IDs where semantically valid;
- existing operational projections until consumers are ready.

## Exit gate

- one authoritative enrollment meaning exists;
- teacher/group relationships are no longer conceptually part of learner identity;
- curriculum versions can preserve historical learning context;
- new academic features use the canonical vocabulary.

---

# Wave 3 — Scheduling & Attendance

## Objective

Make delivery, session participation, teaching staff and attendance evidence consistent around the canonical academic core.

## Canonical direction

```text
SchedulePlan
ClassSession
SessionParticipant
SessionStaff
AttendanceEvidence
AttendanceRecord / revisions
```

Admissions assessments reuse scheduling/meeting capabilities but remain Admissions-owned records.

## Preserve

- strong rolling-schedule architecture;
- existing session-management/read-model improvements;
- Teams evidence and attendance-validation work;
- current bounded parent/teacher/admin projections where sound.

## Converge

- embedded learner/session relationship aliases;
- mixed scheduling vs attendance statuses;
- learner-level teacher snapshots where group-level/session-level staff ownership is more correct.

## Exit gate

- a delivered academic class has one canonical session identity;
- learner participation and actual session staff are explicit;
- attendance evidence is distinct from final attendance truth;
- corrections preserve history;
- parent/teacher/admin session views remain bounded.

---

# Wave 4 — Finance, Commerce & Access

## Objective

Preserve the mature finance foundation while introducing clean commercial and entitlement boundaries.

## Canonical direction

### Finance

```text
BillingAccount
Charge
Payment
PaymentAllocation
Adjustment / Credit
Earning
Payout
PayoutAllocation
```

### Commerce

```text
Product
CommercialOffer
CommercialAgreement
Order / Subscription
EntitlementGrant
```

## Key contracts

- academics do not own price;
- finance does not own curriculum;
- access is determined by entitlements, not `isPremium`;
- customer, payer and beneficiary may differ;
- historical money and teacher-pay terms are preserved.

## Preserve

- current append-oriented finance strengths;
- existing billing/payment/earning history;
- current reconciliation mechanisms until canonical replacements are proven.

## Exit gate

- commercial purchase/access logic is independent of academic definitions;
- finance has one authoritative ledger direction;
- school and household billing fit the same BillingAccount concept;
- new digital access uses entitlement grants.

---

# Wave 5 — Domain Consolidation

## Objective

Move remaining business capabilities onto the canonical foundations without creating parallel architectures.

## Domains consolidated in this wave

- Growth & CRM;
- Admissions;
- Learning / LMS;
- Assessment & Mastery;
- Content & Resource Platform;
- Student Success;
- Faculty & Workforce;
- Communication;
- Support;
- Safeguarding & Consent;
- School Partnerships;
- Credentials & Academic Reporting.

## Principles

- no separate school identity or learner universe;
- no separate digital-learning identity universe;
- admission assessment shares platform capabilities without becoming a normal class;
- resources use common metadata/alignment/access concepts;
- mastery is evidence-derived;
- school programmes use Organisation foundations;
- safeguarding remains more restricted than ordinary support;
- Parent, Teacher, Admin, School, Learning Partner and learning experiences converge on shared application shells, navigation primitives and reusable workspace/page templates wherever role-specific requirements do not require a genuinely different interaction model;
- migrated experiences converge visually on the same premium, restrained Tiny Steps design language instead of retaining unrelated legacy aesthetics.

## Exit gate

- every active business capability has a documented canonical owner;
- duplicated lifecycle/state models are reduced rather than expanded;
- B2C and B2B share foundations while retaining different workflows;
- no new domain introduces its own identity, finance, scheduling or entitlement system;
- repeated page structures and interaction patterns no longer create parallel UI frameworks when a shared configurable template/component can own them;
- migrated surfaces meet the premium-simplicity visual standard without sacrificing information density required by the workflow.

---

# Wave 6 — Intelligence, Governance & Legacy Retirement

## Objective

Complete the School OS convergence by moving management intelligence onto canonical semantics and retiring obsolete compatibility paths.

## Canonical direction

```text
Canonical Domains
      ↓
Domain events / export
      ↓
Analytical platform
      ↓
Semantic metrics
      ↓
BI / attribution / forecasting / governed AI
```

## Scope

- one semantic metrics catalogue;
- acquisition → admissions → enrollment → revenue → retention lineage;
- historical analytics outside operational Firestore where scale warrants;
- governed AI context and provenance;
- projection/reconciliation observability;
- final retirement of verified legacy aliases and duplicate collections;
- architecture fitness checks for future work.

### Planned Wave 6 deliverable — Admissions & Enrollment Insights

**Status:** PLANNED, NOT IMPLEMENTED. Deliver under School OS Wave 6 after Wave 2 enrollment semantics, Wave 3 attendance/session evidence, and relevant domain projection contracts are certified. Do not build a parallel authority or ship unverified metrics earlier.

**Experience:** A read-only `Analytics → Admissions & Enrollment Insights` view, replacing the need for a mutable Course Management reporting screen. Canonical courses and identifiers remain authoritative in the Academic & Enrollment domain; retirement of the old admin UI must not delete course documents or impair course selectors.

**Business questions and metric contract to certify:**
- Current active course enrollments and unique active learners (clearly distinguish the two; handle concurrent courses).
- New learner admissions versus additional-course enrollments, transfers/transitions, and reactivations, by consistent month/cohort.
- Ended enrollments, genuine learner exits, course progression, and returning students; do not count transitions as student loss.
- Verified attended classes per enrollment and per learner, including distributions and median/average lifetime classes; deduplicate evidence for rescheduled, double-length and overlapping sessions.
- Enrollment duration and cohort retention at 30/60/90 days, with right-censoring for ongoing cohorts; distinguish unknown exit dates/reasons from verified outcomes.
- Per-course comparisons and trend windows only where periods, denominators, enrollment identities and evidence are comparable.

**Engineering gates:** Reuse certified domain events/read models and explicitly owned semantic metrics; bounded, rebuildable, versioned projections with reconciliation, freshness/coverage metadata and access control. Avoid direct full historical Firestore scans, persistent dashboard listeners, new write paths, and duplicate facts. Preserve finance/evidence auditability and existing production operations. Validate historical data quality and test the metrics against canonical records before display; expose unknown/partial coverage instead of invented values.

**Release policy:** Independent feature PR(s), CI and domain-contract tests, no coupling to the UI-retirement PR. Initially ship verified course enrollment counts only when the canonical read model and filters are certified; retain advanced tenure, progression, and attendance insights as gated follow-ups.

## Exit gate

- management metrics use canonical definitions;
- operational dashboards rely on rebuildable projections;
- AI receives authorization-filtered context and cannot bypass domain authority;
- legacy aliases/collections retained only where explicitly documented;
- obsolete paths are removed only after production verification.

---

# 4. Sequencing constraints

The waves are ordered by dependency.

```text
Identity
   ↓
Academic / Enrollment
   ↓
Scheduling / Attendance
   ↓
Finance / Commerce
   ↓
Remaining domains
   ↓
Analytics / AI / retirement
```

This does **not** mean all work in a wave must finish before any safe work in the next wave begins. It means canonical dependency decisions must flow in this direction.

Examples:

- do not redesign teacher analytics before Teaching Assignment semantics are stable;
- do not rebuild entitlement analytics before entitlement truth exists;
- do not replace finance history while attendance/session upstream truth is still ambiguous;
- do not retire legacy IDs before canonical identity references are verified.

## 5. What should not be migrated first

Avoid starting with:

- a Firestore collection rename campaign;
- a total rewrite of Finance;
- a total rewrite of Scheduling;
- a new microservice layer;
- BigQuery/AI before canonical semantics;
- deletion of legacy aliases before read/write cutover;
- exact physical schema changes before logical ownership is established.

These create risk without improving the core model first.

## 6. Existing systems to treat as assets

The migration should reuse strong current work, especially where it already aligns with v1.0:

- rolling scheduling and session-management improvements;
- attendance evidence/validation architecture;
- append-oriented billing/payment/teacher-earning work;
- bounded parent monthly projections;
- admin analytics grain/period contracts;
- school portal foundations;
- the reusable blog authority renderer/layout pattern as the model for shared-template + per-page configuration;
- existing CI and regression guards.

The goal is **convergence**, not replacement for its own sake.

## 7. Migration evidence

Each canonical migration should leave enough evidence to answer:

- what source records were included;
- what canonical records were created/updated;
- what was skipped or failed;
- what compatibility path remains;
- whether source and target reconcile;
- when reads switched;
- when legacy writes stopped;
- when retirement became safe.

Exact storage/implementation of migration metadata is an implementation standard, not part of the master blueprint.

## 8. Completion definition

The School OS migration is not complete when all legacy names disappear.

It is complete when:

1. every important business fact has one canonical owner;
2. relationships no longer depend on convenience fields as authority;
3. projections are rebuildable;
4. B2C, B2B, digital and international models share the same foundations;
5. Finance and evidence history remain auditable;
6. integrations remain replaceable adapters;
7. analytics use canonical semantics;
8. AI cannot bypass business authority;
9. critical reads remain bounded as the platform grows;
10. repeated user experiences use maintained shared shells/templates/components wherever appropriate;
11. public and authenticated surfaces present a coherent premium, professional, minimal Tiny Steps visual language;
12. accessibility and performance do not regress during migration;
13. child/family data follows purpose-bound privacy and retention rules;
14. public pages preserve intended crawlability, canonical ownership and search/AI discoverability;
15. remaining legacy compatibility is intentional and documented.

## 9. Change control

This roadmap may be refined as production evidence emerges, but wave order should only change when dependency analysis shows a safer sequence.

Implementation PRs should cite the relevant **wave**, **canonical owner** and **exit criterion** they advance.

The architecture itself remains governed by [TINY_STEPS_SCHOOL_OS_MASTER_BLUEPRINT_V1.md](./TINY_STEPS_SCHOOL_OS_MASTER_BLUEPRINT_V1.md).
