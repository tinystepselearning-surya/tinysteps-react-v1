# School OS Wave 0 — Architecture Contracts

**Status:** ACTIVE  
**Wave:** 0 — Architecture Contracts  
**Architecture source of truth:** [../TINY_STEPS_SCHOOL_OS_MASTER_BLUEPRINT_V1.md](../TINY_STEPS_SCHOOL_OS_MASTER_BLUEPRINT_V1.md)  
**Migration roadmap:** [../SCHOOL_OS_MIGRATION_ROADMAP_V1.md](../SCHOOL_OS_MIGRATION_ROADMAP_V1.md)

## 1. Purpose

Wave 0 converts the frozen School OS v1.0 blueprint into practical contracts that future implementation work must follow.

Wave 0 does **not** migrate Firestore data, rewrite working modules, rename collections in production, or change runtime behaviour.

Its job is to make future migrations unambiguous:

- what each canonical concept means;
- which domain owns it;
- which current structures are canonical, derived, compatibility-only or mixed;
- how IDs, relationships, time, money, projections and migrations are handled;
- which shared experience and product-quality rules new work must respect.

## 2. Wave 0 non-goals

Wave 0 does not:

- redesign working scheduling or finance systems;
- introduce microservices or a new database;
- replace Firebase Authentication;
- move existing production documents;
- delete legacy fields or collections;
- create new UI merely to demonstrate the architecture;
- force all current code to use final names immediately.

The output is a migration-safe contract, not a rewrite.

## 3. Canonical terminology

### Identity and relationships

| Canonical term | Meaning |
|---|---|
| Person | Stable Tiny Steps human identity |
| AuthIdentity | Authentication-provider identity linked to a Person |
| RoleAssignment | Scoped authority/role relationship |
| LearnerProfile | Learner-specific profile attached to a Person |
| GuardianRelationship | Guardian ↔ learner relationship |
| Household | B2C family/billing/relationship grouping |
| Organisation | School, company or institutional identity |
| OrganisationMembership | Person ↔ organisation relationship |

### Academic and delivery

| Canonical term | Meaning |
|---|---|
| Programme | Broad academic programme family |
| Course | Defined academic course |
| CurriculumVersion | Immutable/versioned curriculum definition |
| Skill | Learning outcome / competency |
| LessonDefinition | Planned instructional definition |
| DeliveryOffering | Operational delivery form of a Course, such as 1:1, small group or school programme |
| Enrollment | One learner participating in one DeliveryOffering over a lifecycle |
| LearningGroup | Operational learner grouping |
| GroupPlacement | Enrollment ↔ LearningGroup relationship |
| TeachingAssignment | Expected teaching responsibility for an Enrollment or LearningGroup |
| SchedulePlan | Recurring timetable intent |
| ClassSession | One individual academic delivery occurrence |
| SessionParticipant | Learner participation relationship for one ClassSession |
| SessionStaff | Actual staff relationship for one ClassSession |

### Evidence and learning

| Canonical term | Meaning |
|---|---|
| AttendanceEvidence | Evidence used to support attendance truth |
| AttendanceRecord | Current authoritative attendance decision |
| AttendanceRevision | Preserved correction/history of attendance truth |
| Assessment | Structured measurement event/evidence |
| SkillEvidence | Evidence supporting a learner/skill conclusion |
| Mastery | Derived/rebuildable learner-skill state |
| LearningResource | Reusable content/resource object |

### Commerce and finance

| Canonical term | Meaning |
|---|---|
| Product | Commercial item sold |
| CommercialOffer | Market-facing commercial terms |
| CommercialAgreement | Negotiated institutional/B2B terms |
| EntitlementGrant | Authoritative right to access a product/resource/service |
| BillingAccount | Financial account owned by a household, organisation or person |
| Charge | Money owed |
| Payment | Money received |
| PaymentAllocation | Application of a Payment to one or more obligations |
| Earning | Teacher/faculty pay entitlement |
| Payout | Money paid to teacher/faculty |

### Data and platform

| Canonical term | Meaning |
|---|---|
| Command | Requested business action |
| DomainEvent | Fact emitted after an accepted domain change |
| Projection | Rebuildable read-optimized operational view |
| Analytical Data | Historical/management intelligence, not operational authority |
| External Evidence | Provider evidence retained without allowing the provider to define Tiny Steps business truth |

## 4. ID contract

1. Business IDs are stable and immutable once issued.
2. Email addresses and phone numbers are never canonical IDs.
3. Firebase Auth UID is an authentication identifier, not automatically the permanent conceptual Person ID.
4. Existing IDs should be reused when they already represent the correct canonical concept.
5. External provider IDs are aliases/references, not Tiny Steps canonical IDs.
6. A migration may introduce a new canonical ID only when the current ID represents the wrong concept or cannot safely remain stable.
7. Legacy aliases may remain readable during migration but must have one documented canonical destination.


### 4.1 Existing identity adoption rules

Repository identity audit establishes these migration rules:

1. Existing auth-backed users may preserve the current `users` document-ID **value** as their initial `Person.id` after live 1:1 verification.
2. Preserving that opaque value does not preserve semantic coupling to Firebase. Firebase UID is represented separately as `AuthIdentity.providerSubject`.
3. A later auth-provider/UID change must not change `Person.id`.
4. New Person IDs are Tiny Steps generated and are not derived from Firebase UID, email or phone.
5. Existing `parents/{id}`, `teachers/{id}`, `learningPartners/{id}` and `admins/{id}` are role/profile mirrors, not separate Person authorities.
6. Existing `kids/{kidId}` is the canonical learner-ID candidate. Root/nested `students` require explicit compatibility/projection classification before retirement.
7. Existing IDs are never merged based only on name, email similarity or collection naming.
8. Identity adoption requires a read-only reconciliation report before any backfill/write migration.


## 5. Relationship contract

If a relationship can change independently, it is modeled as a relationship record rather than authoritative convenience fields/arrays.

Examples:

```text
GuardianRelationship
TeachingAssignment
GroupPlacement
OrganisationMembership
```

Convenience fields such as `teacherId`, `childIds[]`, `assignedKids[]` or `teacherIds[]` may exist temporarily for compatibility or projection use, but must not become competing authoritative relationship models.


### 5.1 Academic and enrollment adoption rules

The Academic & Enrollment audit freezes these migration rules:

1. Existing Course IDs are preserved where they continue to represent stable academic Course identity.
2. Programme is introduced above Course; current Course `area`/`track` values are migration inputs rather than permanent Programme authority.
3. CurriculumVersion is introduced as immutable/versioned academic definition. Mutable legacy Course fields such as `topics[]` must not become the final curriculum authority.
4. DeliveryOffering is introduced between Course and Enrollment to own delivery form/context such as 1:1, group or institutional delivery. Commercial price remains outside DeliveryOffering.
5. Enrollment remains one learner participating in one DeliveryOffering over a lifecycle. Existing Enrollment IDs and lifecycle history are preserved.
6. Expected teacher responsibility migrates from `enrollment.teacherId` to TeachingAssignment. Actual session staff remains a ClassSession-level relationship.
7. Recurring timetable intent migrates from `enrollment.schedule` to SchedulePlan. `scheduleMaterialization` remains projection/workflow state.
8. LearningGroup and GroupPlacement are not inferred from learner arrays, Course capacity defaults or School Sections. They are introduced only for genuine multi-learner delivery.
9. Course progression/correction continues to create a new Enrollment linked to the previous Enrollment; historical Course identity is never rewritten in place.
10. Enrollment price, teacher-pay, billing-cycle and credit fields are preserved as historical/operational snapshots while authority moves to Commerce, Entitlement, Finance and Faculty domains.
11. Past ClassSessions whose historical Enrollment was retired/missing remain historical evidence; migrations must not fabricate Enrollments solely to satisfy a foreign-key shape.
12. Production Course documents currently do not populate numeric `level`; canonical academic sequencing must be defined explicitly rather than blindly backfilling the legacy form field.


## 6. Lifecycle contract

1. Each domain owns its own lifecycle vocabulary.
2. Scheduling lifecycle, delivery outcome and attendance outcome are distinct.
3. Rescheduled/cancelled are scheduling facts, not attendance outcomes.
4. Historical lifecycle changes that matter for audit or finance are preserved.
5. Unknown/legacy states should remain visible during migration rather than silently disappearing.
6. A compatibility normalizer may translate legacy values at boundaries, but it must not create a second source of truth.

## 7. Time contract

For business events that depend on local civil time, preserve:

```text
startsAtUtc / endsAtUtc
timezone (IANA)
serviceDateLocal
```

Rules:

- UTC timestamps are used for global chronology.
- IANA time zones express local civil-time rules.
- Local service date is stored when billing, attendance, scheduling or reporting depends on the local day.
- New architecture must not assume all future business activity is IST even when current operational defaults are India-centric.

## 8. Money contract

Canonical money values use:

```text
amountMinor
currency
```

Rules:

- currency is explicit;
- display formatting is not financial storage;
- historical agreed rates/terms are snapshotted where later changes must not rewrite history;
- academic Course definitions do not own commercial price;
- finance ledgers remain auditable and append-oriented.

Exact conversion, tax and invoice rules live in finance/commercial standards rather than this Wave 0 contract.

## 9. Canonical vs derived contract

Every important data structure must be classified as one of:

1. **Canonical operational state**
2. **Immutable/ledger/evidence**
3. **Projection/read model**
4. **Analytical data**
5. **Workflow/operational state**
6. **External evidence/integration state**
7. **Legacy compatibility**

A structure may not silently move between categories.

A projection may be optimized, cached, denormalized and replaced, but must not become the only owner of the underlying business fact.

## 10. Shared experience contract

New and migrated interfaces follow the School OS Shared Experience System:

- shared application shells and portal frames;
- shared desktop/mobile navigation primitives;
- shared page/header/breadcrumb patterns;
- reusable workspace, list and detail templates;
- shared tables, filters, forms, dialogs and status treatments;
- controlled variants before copied implementations;
- shared accessibility, loading, empty, error and responsive behaviour.

The existing reusable blog authority layout is the reference precedent: common structure is maintained once while page-specific content/configuration varies on top.

## 11. Visual and product-quality contract

Tiny Steps uses a premium, professional, minimal, Apple-inspired visual direction while remaining its own brand.

New work must preserve:

- clear hierarchy;
- generous whitespace;
- restrained colour;
- precise typography/alignment;
- minimal visual noise;
- purposeful motion;
- responsive consistency;
- WCAG 2.2 AA target for applicable user-facing surfaces;
- performance as a product-quality requirement;
- child/family privacy by design;
- public search/AEO/AI discoverability where intended.

## 12. Migration contract

Every canonical migration follows:

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

Each migration must record enough evidence to determine:

- source scope;
- target scope;
- skipped/failed records;
- reconciliation result;
- remaining compatibility paths;
- read-switch status;
- legacy-write stop status;
- retirement readiness.

No destructive retirement occurs merely because the replacement code exists.

## 13. Architecture decision gate

Every significant new feature or migration must identify:

- canonical owner;
- data class;
- relationship model;
- migration posture;
- bounded access path;
- projection/rebuild strategy where applicable;
- integration boundary;
- AI authority boundary if relevant;
- shared UI/template reuse decision;
- accessibility/performance/privacy/discoverability impact.

## 14. Wave 0 work packages

Wave 0 uses six bounded work packages:

1. **Engineering delivery baseline** — local-first development validation, deployment-only GitHub Actions, and test/workflow retirement rules.
2. **Contracts & current-state map** — establish this contract and verified legacy-to-canonical inventory.
3. **Identity/reference audit — COMPLETE** — code-level decisions, live read-only verification and bounded exception dispositions are recorded in `IDENTITY_REFERENCE_AUDIT.md`.
4. **Academic/enrollment audit — COMPLETE** — code-level ownership decisions, live read-only verification and migration-debt classification are recorded in `ACADEMIC_ENROLLMENT_AUDIT.md`.
5. **Shared experience/design-system inventory** — identify reusable shells/templates/components and controlled variants.
6. **Migration standard & Wave 0 exit review** — freeze migration metadata, compatibility and review gates before Wave 1.

These are planning packages, not six new runtime systems.

## 15. Wave 0 exit gate

Wave 0 is complete when:

- canonical terminology is stable;
- every high-value current collection/model has a documented canonical destination or explicit unresolved status;
- identity/ID reuse rules are agreed;
- relationship duplication is understood;
- current projections are distinguished from canonical truth;
- shared experience/design-system governance is documented;
- migration evidence and retirement gates are agreed;
- no unresolved ownership contradiction blocks Wave 1.

Until then, Wave 1 production migration should not begin.
