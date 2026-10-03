# Tiny Steps School OS Master Blueprint v1.0

**Status:** FROZEN ARCHITECTURE SOURCE OF TRUTH  
**Scope:** Long-term logical architecture for Tiny Steps Learning  
**Repository:** `tinystepselearning-surya/tinysteps-react-v1`  
**Companion roadmap:** [SCHOOL_OS_MIGRATION_ROADMAP_V1.md](./SCHOOL_OS_MIGRATION_ROADMAP_V1.md)

## 1. Purpose

This document defines the permanent architectural boundaries for Tiny Steps School OS.

It is a **logical architecture**, not a commitment to build every capability immediately and not a mandate to rewrite working systems. Existing production systems should be preserved and converged into this model incrementally.

The blueprint must support:

- B2C families and learners;
- B2B schools, campuses and institutional programmes;
- live 1:1, small-group and school delivery;
- curriculum, learning, assessment and mastery;
- scheduling, attendance and evidence;
- teachers and workforce operations;
- finance, commerce, subscriptions and entitlements;
- public and premium resources;
- multiple countries, time zones and currencies;
- analytics, attribution and AI;
- external providers without making provider schemas canonical.

## 2. Architecture principles

1. **One owner per business fact.** Every canonical fact belongs to one domain.
2. **Portals do not own business truth.** Admin, Teacher, Parent, Child and School experiences consume domains.
3. **Relationships are first-class when they change independently.**
4. **Canonical truth is separate from projections and analytics.**
5. **Academics, commerce, finance and access are separate concerns.**
6. **External systems are adapters, not sources of Tiny Steps business schema.**
7. **Reads and writes remain bounded as Tiny Steps grows.**
8. **Async processing is idempotent, retryable, observable and reconcilable.**
9. **AI may assist, analyse and recommend; deterministic domains retain authority.**
10. **Migration is incremental. No big-bang rewrite.**
11. **Architecture boundary does not equal build commitment.**
12. **Preserve proven working systems unless a canonical boundary requires convergence.**
13. **Shared experience before bespoke UI.** Reuse common page shells, navigation, templates and components wherever the information architecture and interaction pattern are materially the same; variation should normally come from configuration, content and scoped slots rather than copied page frameworks.
14. **Premium simplicity by default.** Tiny Steps experiences should follow an Apple-inspired design direction: clear hierarchy, generous whitespace, restrained colour, precise typography, polished interaction, purposeful motion and minimal visual noise. The product should feel premium, professional and calm rather than decorative, crowded, generic or template-like. Tiny Steps keeps its own brand identity and does not copy Apple assets or trade dress.

## 3. Six-layer architecture

### Layer 1 — Experience

Consumers of business domains:

- Public Web
- Founder / Admin
- Admissions / Operations
- Teacher
- Parent
- Child
- Learning Partner
- School Admin / Principal
- Future Partner / API consumers

### Shared Experience System

The Experience layer must converge on a reusable application design system rather than independently designed page families.

Prefer shared:

- application shells and authenticated portal frames;
- desktop/mobile navigation patterns;
- headers, breadcrumbs and page titles;
- list/detail/workspace templates;
- cards, tables, filters, tabs and status treatments;
- forms, validation, dialogs and empty/loading/error states;
- responsive layout primitives;
- accessibility and interaction behaviour;
- typography, spacing, colour and design tokens.

A role or domain may configure the shared shell and expose different navigation/items, but should not fork the underlying framework without a genuine interaction or security requirement.

The existing blog authority architecture is the reference pattern: a shared site-wide renderer/layout carries common structure while article-specific content and curated configuration vary on top. The wider web app should apply the same principle to operational and learning experiences.

A shared component does **not** mean every screen must look identical. It means repeated interaction patterns have one maintained implementation and controlled variants.

### Visual Design Direction

Across public pages and authenticated products, the default aesthetic is **premium, professional, minimal and calm**, taking strong inspiration from Apple's design simplicity while remaining distinctly Tiny Steps.

Prefer:

- strong information hierarchy and one obvious primary action;
- generous whitespace and breathing room;
- restrained, intentional colour rather than rainbow or decorative palettes;
- excellent typography, spacing and alignment;
- fewer, higher-quality surfaces instead of many competing cards;
- subtle borders, depth and motion only when they clarify structure or interaction;
- high-quality imagery and illustration with clear purpose;
- concise copy and progressive disclosure rather than showing everything at once;
- consistent responsive behaviour across desktop, tablet and mobile;
- polished loading, empty, error, success and transition states;
- accessibility as part of the premium experience, not a separate visual mode.

Avoid:

- crowded dashboards;
- excessive cards, pills, badges, gradients or shadows;
- decorative UI that competes with the task;
- inconsistent spacing, typography, icon styles or navigation;
- dense "admin template" aesthetics;
- novelty effects or animation without functional value;
- visual complexity added merely to make a page feel feature-rich.

Simplicity must not remove necessary information or functionality. The goal is **reduced cognitive load with high craft**, not emptiness.

### Layer 2 — Business Domains

Where educational, operational and commercial truth lives.

### Layer 3 — Shared Platform Foundations

Capabilities used across domains:

- Identity & Authentication
- Authorization / Resource Scope
- Organisation & Tenancy
- Time Zone / Locale / Calendar
- Configuration / Feature Flags
- Search
- Documents & Media
- Audit
- API / Schema contracts

### Layer 4 — Automation & Integrations

- Commands
- Domain events
- Background workflows / task queues
- Reconciliation
- Teams, OneDrive, WhatsApp, payment, email, search and analytics adapters

### Layer 5 — Data & Intelligence

- Read models / projections
- Analytical data
- Semantic metrics
- Attribution
- BI
- Governed AI context and recommendations

### Layer 6 — Trust & Platform Engineering

- Security and privacy
- Reliability
- Backups / disaster recovery
- Observability and alerts
- CI/CD
- Environment management
- Schema migration
- Cost and capacity governance

## 4. Canonical business domains

Tiny Steps has **18 principal business domains**.

| # | Domain | Canonical responsibility |
|---:|---|---|
| 1 | Growth & CRM | identifiable prospects, leads, attribution and campaigns |
| 2 | Admissions | assessment/demo journey, recommendation and admission case |
| 3 | Learner & Enrollment SIS | learners, guardians, households and academic enrollments |
| 4 | Academic Catalogue & Curriculum | programmes, courses, curriculum versions, stages, units and skills |
| 5 | Learning / LMS | lessons, assignments, practice, submissions and feedback |
| 6 | Assessment & Mastery | assessment evidence, rubrics, skill evidence and mastery |
| 7 | Scheduling & Classroom | recurring plans, sessions, exceptions, meetings and delivery placement |
| 8 | Attendance & Evidence | attendance evidence, decision, correction and history |
| 9 | Student Success | goals, concerns, interventions and follow-ups |
| 10 | Faculty & Workforce | recruitment, onboarding, engagement, availability, training and QA |
| 11 | Finance | charges, payments, allocations, earnings, payouts and ledgers |
| 12 | Commerce & Entitlements | products, commercial offers, subscriptions, purchases, licences and access |
| 13 | Communication | conversations, notification intent and delivery |
| 14 | Support / Service Desk | operational, technical, billing and scheduling cases |
| 15 | Safeguarding & Consent | safeguarding, recording/media/data consent and restricted records |
| 16 | Content & Resource Platform | worksheets, games, media, lesson assets and public/premium resources |
| 17 | School Partnerships | schools, campuses, implementation programmes and B2B relationship lifecycle |
| 18 | Credentials & Academic Reporting | reports, certificates, achievements and credentials |

These are **ownership boundaries**, not 18 separate applications or databases.

## 5. Canonical core model

At the highest useful level:

```text
IDENTITY
Person
Household
Organisation
Roles / Relationships
        │
        ▼
ACADEMICS
Programme
Course
Curriculum Version
Skills / Lessons
Delivery Offering
        │
        ▼
LEARNER DELIVERY
Enrollment
Learning Group
Group Placement
Teaching Assignment
Schedule Plan
Class Session
Session Participant / Session Staff
        │
        ▼
EVIDENCE
Attendance
Learning Evidence
Assessment
Mastery
        │
        ▼
COMMERCIAL
Product
Commercial Offer
Commercial Agreement
Subscription / Purchase
Entitlement Grant
        │
        ▼
FINANCE
Billing Account
Charge
Payment / Allocation
Teacher Earning / Payout
```

Supporting flows:

```text
Lead → Admissions Case → Admission Assessment → Enrollment

Faculty → Teaching Assignment → Session Staff

Content → Learning / Assessment

Attendance + Assessment + Learning → Student Success / Reporting

Organisation → School Partnership → Institutional Delivery
```

## 6. Final canonical definitions

### Person

Permanent Tiny Steps human identity. Authentication provider identity is separate.

### Learner

A learner profile attached to a Person. It does not own parent, teacher, attendance, finance or mastery relationships.

### Enrollment

**One learner participating in one academic Delivery Offering over a defined lifecycle.**

Enrollment does not own teacher, schedule, payment balance, attendance, mastery, guardian relationship or group placement.

### Teaching Assignment

Expected teaching responsibility for either:

- a 1:1 Enrollment; or
- a Learning Group.

### Group Placement

The relationship placing an enrolled learner into a Learning Group. Moving groups does not change the academic Enrollment.

### Class Session

One actual/scheduled academic delivery occurrence.

### Admission Assessment

An Admissions-owned assessment that reuses shared scheduling/calendar/meeting capabilities. It is not forced to be an academic Class Session.

### Delivery Offering

Academic delivery form of a Course, such as live 1:1, small group or school programme.

### Product / Commercial Offer

Commercial objects describing what is sold and under what market terms. They are not academic curriculum objects.

### Commercial Agreement

Negotiated B2B/institutional commercial terms.

### Entitlement Grant

Authoritative commercial/access grant for a person, learner, household or organisation.

### Projection

A rebuildable, read-optimized view. A projection is never canonical business truth.

## 7. Business fact ownership

| Business fact | Canonical owner |
|---|---|
| Human identity | Person |
| Authentication | AuthIdentity |
| Permissions | RoleAssignment / scoped authorization |
| Learner identity | LearnerProfile |
| Guardian relationship | GuardianRelationship |
| Household | Household |
| School/company | Organisation |
| Organisation membership | OrganisationMembership |
| Academic enrollment | Enrollment |
| Group placement | Group Placement |
| Teaching responsibility | Teaching Assignment |
| Curriculum | CurriculumVersion |
| Skill | Skill |
| Lesson definition | LessonDefinition |
| Resource | LearningResource |
| Recurring timetable | SchedulePlan |
| Individual class | ClassSession |
| Learner class participation | SessionParticipant |
| Actual class staff | Session Staff |
| Attendance decision | AttendanceRecord |
| Attendance proof | AttendanceEvidence |
| Assessment evidence/result | Assessment domain |
| Mastery | projection derived from evidence |
| Student intervention | StudentSuccessCase |
| Teacher engagement | Faculty / Workforce |
| Money owed | Charge |
| Money received | Payment |
| Payment application | PaymentAllocation |
| Teacher pay entitlement | Earning |
| Teacher payment | Payout |
| Commercial item | Product |
| Commercial terms | Commercial Offer / Agreement |
| Access | EntitlementGrant |
| Conversation | Communication |
| Support issue | SupportCase |
| Consent | ConsentRecord |
| Safeguarding matter | SafeguardingCase |
| Credential | CredentialAward |
| Dashboard metric | Projection / Analytics |

## 8. Relationship rule

A relationship that can change independently must not be embedded merely for screen convenience.

Avoid making these authoritative:

```text
learner.teacherId
parent.childIds[]
teacher.assignedKids[]
school.teacherIds[]
```

Use canonical relationship records such as:

```text
GuardianRelationship
TeachingAssignment
GroupPlacement
OrganisationMembership
```

Small, bounded descriptive arrays may remain where they are not growing business relationships.

## 9. Data model classes

Tiny Steps uses four conceptual data classes:

1. **Canonical operational state** — what is true now.
2. **Immutable / ledger / evidence records** — what happened.
3. **Projections / read models** — optimized operational views.
4. **Analytical data** — historical management and learning intelligence.

Commands and domain events are interaction mechanisms, not competing stores of truth.

## 10. Automation and integration contract

The long-term execution flow is:

```text
Command
   ↓
Domain validation
   ↓
Canonical state change
   ↓
Domain event
   ↓
Async workflows / integrations
   ↓
Projections / notifications / analytics
```

Required properties:

- bounded work;
- idempotent consumers;
- safe retries;
- visible unresolved failures;
- periodic reconciliation for critical invariants;
- no dependence on event ordering;
- provider failures do not invalidate canonical Tiny Steps state.

## 11. Scale and reliability contract

At 10×–20× scale:

- parent views depend on that household/learner, not total Tiny Steps size;
- teacher views depend on that teacher and bounded date windows;
- operational lists are paginated and bounded;
- global aggregates are projections/analytics, not hot canonical documents;
- heavy historical work runs asynchronously in bounded batches;
- read models may be rebuilt from canonical truth;
- operational Firestore is not the long-term historical BI warehouse.

## 12. Security and trust contract

- Authentication and authorization are separate.
- Authorization is resource-scoped, not merely `role === ...`.
- High-risk mutations go through validated backend commands.
- Sensitive domains, especially safeguarding and finance, have narrower access.
- External provider credentials remain in managed secret infrastructure.
- Production, staging and development should be separated as the platform matures.
- Backups are paired with restore verification.
- Sensitive AI context is authorization-filtered before model access.

## 13. International model

Tiny Steps remains one platform.

Relevant domains may carry:

```text
country
locale
IANA timezone
currency
tax context
academic calendar
```

Do not create country-specific application architectures unless regulation or business requirements truly require isolation.

## 14. Commercial model

One commercial foundation supports:

- B2C live classes;
- family plans;
- digital subscriptions;
- school licences;
- negotiated institutional programmes;
- bundles;
- future premium resources.

The model distinguishes:

- **Customer** — enters the commercial relationship;
- **Payer** — settles the financial obligation;
- **Beneficiary** — receives the service/access.

These may be the same entity but must not be assumed to be.

## 15. Analytics and AI

### Analytics

Canonical operational systems feed an analytical platform. A semantic metrics catalogue defines measures such as Lead, Enrollment, Active Learner, Revenue, Attendance and Retention once for all dashboards.

Analytics must preserve lineage from acquisition through admission, enrollment, revenue and retention.

### AI

AI belongs to the Data & Intelligence layer:

```text
Authorized Context
      ↓
Assist / Analyze / Recommend
      ↓
Validated action
      ↓
Normal Domain Command
```

AI does not silently own attendance, finance, enrollment, teacher pay, safeguarding or final academic truth.

## 16. Architecture standards

The detailed implementation rules live outside this master blueprint as standards or code-level decisions. Examples include:

- Firestore access standards;
- event/idempotency standards;
- security standards;
- migration standards;
- integration standards;
- finance ledger standards;
- observability and cost standards;
- shared UI / design-system standards.

This keeps the master blueprint stable and concise.

## 17. Prohibited architectural patterns

Do not introduce:

- browser-wide scans of growing operational collections;
- growing relationship arrays as canonical truth;
- dashboards/read models as business authority;
- external provider schemas as Tiny Steps domain schemas;
- direct AI writes to sensitive canonical state;
- non-idempotent financial/event side effects;
- country-specific platform copies without a real requirement;
- separate B2B, digital or AI databases merely because the experience differs;
- destructive rewriting of financial/evidence history;
- big-bang schema migrations;
- permanent legacy dual-write paths;
- a microservice/Kubernetes migration without demonstrated need;
- duplicate portal shells, navigation systems or page-template implementations where a shared configurable experience would satisfy the same interaction need;
- one-off copies of shared forms, tables, cards, loading/error states or interaction primitives without a documented exception;
- visually noisy or "feature-rich" UI created through unnecessary cards, gradients, badges, shadows, colours or motion;
- inconsistent page aesthetics that make Tiny Steps feel like multiple unrelated products;
- low-fidelity generic admin-template styling when a simpler, more polished composition can serve the same task.

## 18. Architecture decision gate

Every significant new feature must answer:

1. Which domain owns the business truth?
2. Is the data canonical, evidence, projection or analytics?
3. Is a proposed field actually an independently changing relationship?
4. Does another domain already own the concept?
5. Will access remain bounded at 10× scale?
6. Can a projection be rebuilt?
7. Does an external provider remain an adapter?
8. Can migration occur incrementally?
9. Does AI remain outside canonical authority?
10. Is the feature being built now, or merely supported by the blueprint?
11. Can the experience reuse an existing shared shell, navigation, template or component before creating a new implementation?
12. Does the visual design meet the Tiny Steps premium-simplicity standard: clear hierarchy, restraint, consistency, accessibility and minimal cognitive load?

If ownership is ambiguous, a bespoke UI duplicates an existing shared interaction without justification, or the experience introduces unnecessary visual complexity, the feature is not architecturally ready.

## 19. What v1.0 does not require

This blueprint does **not** require:

- microservices;
- Kubernetes;
- database-per-domain;
- replacing Firebase / Firestore / Gen-2 Functions;
- rewriting working scheduling or finance systems;
- implementing all 18 domains immediately;
- implementing interoperability standards immediately;
- a separate school platform;
- a separate digital-learning platform;
- a separate AI system of record.

Logical modularity is the goal. Physical decomposition is introduced only when evidence requires it.

## 20. Change control

This document is the architecture source of truth for School OS v1.0.

Future changes should be made only when one of the following is true:

- a domain boundary is proven incorrect;
- a material new business model cannot fit cleanly;
- scale/security/regulation invalidates a current principle;
- a migration exposes an ownership contradiction.

Implementation detail alone does not justify changing the master blueprint.

Migration sequencing and exit gates are defined in [SCHOOL_OS_MIGRATION_ROADMAP_V1.md](./SCHOOL_OS_MIGRATION_ROADMAP_V1.md).
