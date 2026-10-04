# Tiny Steps School OS Enterprise Architecture Standard v1.0

**Status:** ADOPTED COMPANION STANDARD  
**Scope:** Cross-cutting engineering rules for long-lived School OS capabilities  
**Architecture source of truth:** [TINY_STEPS_SCHOOL_OS_MASTER_BLUEPRINT_V1.md](./TINY_STEPS_SCHOOL_OS_MASTER_BLUEPRINT_V1.md)  
**Migration roadmap:** [SCHOOL_OS_MIGRATION_ROADMAP_V1.md](./SCHOOL_OS_MIGRATION_ROADMAP_V1.md)

## 1. Purpose

This standard strengthens the School OS blueprint with engineering disciplines used by mature,
long-lived integrated enterprise platforms.

The inspiration includes publicly observable characteristics of platforms such as Epic:
stable domain concepts, long-lived identifiers, integrated workflows, context-aware access,
explicit interoperability contracts, compatibility during modernization, and separation of
operational work from reporting/analytics.

This is **principle adoption, not technology imitation**.

Tiny Steps does **not** adopt Epic's proprietary data model, healthcare-specific complexity,
deployment model, database technology, or internal implementation assumptions.

The default Tiny Steps platform remains:

- Firebase Authentication;
- Firestore;
- Gen-2 Cloud Functions;
- the existing React application;
- provider integrations behind Tiny Steps-owned contracts.

Physical decomposition changes only when measured scale, reliability, security, compliance or
operational evidence requires it.

## 2. Platform laws

Every School OS capability must conform to these laws.

### 2.1 One authoritative owner per business fact

A fact has one canonical owner.

Other copies may exist only as:

- projections;
- compatibility mirrors;
- caches;
- search indexes;
- analytics;
- external-provider evidence.

A derived copy must not silently become competing authority.

### 2.2 Stable identity is separate from authentication and operational context

A Person, Organisation, Course, Enrollment, Session, Payment or other durable concept must not
change identity merely because an authentication provider, email, phone, teacher assignment,
class group, portal or external provider changes.

Authentication IDs and provider IDs are aliases/references unless the canonical model explicitly
defines otherwise.

### 2.3 Independently changing relationships are first-class records

Do not encode durable relationship truth primarily as convenience arrays or fields when the
relationship has its own lifecycle.

Examples include:

- GuardianRelationship;
- OrganisationMembership;
- RoleAssignment;
- Enrollment;
- GroupPlacement;
- TeachingAssignment;
- SessionParticipant;
- PaymentAllocation.

Convenience mirrors may exist only when their derivation and retirement rules are documented.

### 2.4 Transactional authority is separate from projections and analytics

Operational commands must read/write authoritative domain state.

Dashboards, aggregates, reporting stores, snapshots and analytics are derived.

The platform should conceptually follow:

~~~text
command
  ↓
canonical transactional state
  ↓
domain event / change signal
  ↓
operational projection
  ↓
reporting / analytics
~~~

A dashboard or report must never be promoted to business authority merely because it is easier
to query.

### 2.5 Commands, decisions and evidence are distinct

A request to perform an action is not the same thing as the accepted state change, and evidence
is not automatically the authoritative decision.

For sensitive workflows, model the distinction explicitly.

Example:

~~~text
Teams attendance evidence
        ↓
attendance validation
        ↓
AttendanceRecord
        ↓
AttendanceRevision / audit history
~~~

### 2.6 Authorization is contextual, scoped and fail-closed

Authorization must evaluate the minimum required combination of:

- authenticated subject;
- active identity status;
- role;
- organisation/scope;
- resource;
- requested action;
- lifecycle state where relevant.

A global role must not be used where organisation-scoped authority is required.

Unknown or contradictory identity/access state fails closed.

### 2.7 Workflow state transitions are explicit

Business workflows with meaningful lifecycle must use defined states and allowed transitions.

Do not infer workflow state from unrelated fields, UI position, button visibility or timestamps
alone.

Transitions should define:

- valid source states;
- valid destination state;
- actor/authority;
- invariants;
- side effects;
- audit evidence;
- idempotency behavior.

### 2.8 Configuration controls variation; code controls invariants

Prefer configuration for legitimate operational variation such as:

- programme settings;
- delivery frequencies;
- school-specific options;
- notification preferences;
- templates;
- feature availability;
- workflow parameters.

Do not put critical invariants, authorization policy, financial truth or safety rules into
unvalidated free-form configuration.

### 2.9 Historical business truth is append-safe

Financial, attendance, assessment, safeguarding and other material evidence should preserve
history.

Corrections should normally be represented through revision, reversal, adjustment or explicit
state transition rather than destructive replacement.

### 2.10 Reads and writes remain bounded

No operational path may depend on an unbounded scan as data volume grows.

Each path must have a defined cardinality expectation, query bound, pagination strategy,
partition key, or projection.

A feature that works only because current data is small is not production-ready.

### 2.11 Async work is idempotent, retryable, observable and reconcilable

Every asynchronous mutation must define:

- idempotency key or equivalent duplicate protection;
- retry behavior;
- terminal failure behavior;
- observable status;
- reconciliation path;
- safe replay semantics.

### 2.12 Integrations use contracts, not foreign schemas as authority

External providers remain adapters.

Microsoft Teams, Microsoft Graph, payment providers, email/SMS/WhatsApp providers, analytics
vendors and future partners must integrate through explicit Tiny Steps contracts.

Provider payloads may be retained as evidence, but provider schema must not become the School OS
domain model.

### 2.13 Compatibility is temporary and named

A compatibility layer must declare:

- why it exists;
- source authority;
- target authority;
- which readers still depend on it;
- how divergence is detected;
- retirement gate.

"Temporary" compatibility without a retirement condition becomes permanent technical debt and
is prohibited.

### 2.14 Modernize surfaces without destabilizing the domain core

UI, client framework, integration mechanism or provider modernization should not require
unnecessary replacement of stable domain concepts.

Prefer:

~~~text
stable domain contracts
        +
replaceable experience/integration adapters
~~~

over repeated full-stack rewrites.

### 2.15 Observability is part of correctness

Sensitive or high-value workflows must expose enough structured evidence to answer:

- what was requested;
- what decision was made;
- what changed;
- what did not change;
- which version/rule produced the result;
- whether retries occurred;
- whether reconciliation is clean.

Logs must remain privacy-safe and must not become a second system of record.

### 2.16 AI cannot become silent business authority

AI may:

- summarize;
- classify;
- recommend;
- draft;
- detect anomalies;
- assist operators.

AI may not silently become the authoritative source for:

- identity;
- authorization;
- attendance truth;
- enrollment;
- money;
- payouts;
- safeguarding;
- compliance;
- irreversible lifecycle state.

Material AI-assisted decisions require deterministic validation and, where appropriate, human
confirmation.

## 3. Logical execution lanes

School OS should maintain clear separation between six logical lanes.

### Lane A — Experience

Admin, Founder, Admissions, Teacher, Parent, Child, Learning Partner and School experiences.

The experience layer requests business actions and consumes projections. It does not own domain
truth.

### Lane B — Command and workflow

Validates intent, authorization, invariants and allowed state transitions.

Examples:

- enroll learner;
- assign teacher;
- reschedule session;
- mark attendance;
- record payment;
- archive identity.

### Lane C — Canonical transactional state

The authoritative state owned by each domain.

Examples:

- Person / AuthIdentity / RoleAssignment;
- Enrollment;
- ClassSession;
- AttendanceRecord;
- Charge / Payment / Earning.

### Lane D — Operational projections

Rebuildable read models optimized for bounded user-facing reads.

Examples:

- parent dashboard;
- sessions-management snapshot;
- auth access read model;
- teacher earnings rollup;
- upcoming-session projection.

### Lane E — Reporting and analytics

Historical, aggregate and management intelligence.

Reporting may lag operational truth within a defined SLA. It must not be required to complete a
transactional workflow.

### Lane F — Integration adapters

External systems exchange data through versioned contracts without redefining canonical School
OS semantics.

## 4. Context-aware authorization contract

Every authorization helper or Rules predicate should be classifiable as one of:

~~~text
global authority
organisation-scoped authority
resource relationship authority
self-service authority
system/service authority
~~~

A request should conceptually answer:

~~~text
Who is acting?
Is the identity active?
What role is active?
In which scope?
On which resource?
For which action?
Does lifecycle state permit it?
~~~

### Required properties

- requester authorization must not depend on target-user convenience fields;
- school authority must remain organisation-scoped;
- self-service paths must not automatically imply Admin authority;
- operational Firebase UID references may remain where they are the correct operational key;
- authorization read models must be derived from canonical authority and independently
  reconcilable;
- role changes must invalidate or refresh derived access state predictably.

## 5. Workflow and state-machine contract

A workflow that can be corrected, retried, cancelled, reopened or audited must have an explicit
state model.

Examples include:

- lead → demo → admission;
- enrollment lifecycle;
- rolling schedule lifecycle;
- session lifecycle;
- attendance validation;
- payment reconciliation;
- teacher payout;
- school academic-year lifecycle.

A state transition implementation should prefer one authoritative transition path instead of
multiple screens directly mutating overlapping fields.

## 6. Projection and reporting contract

A projection must document:

- canonical source(s);
- key/grain;
- rebuild strategy;
- freshness expectation;
- update trigger;
- idempotency;
- reconciliation check;
- whether partial failure can affect business truth.

A projection may be discarded and rebuilt without losing authoritative history.

If that statement is false, it is probably not a projection.

## 7. Configuration contract

Configuration is appropriate when business policy legitimately varies while invariants remain
stable.

Configuration must be:

- schema-validated;
- versioned where behavior changes materially;
- scoped;
- auditable for sensitive workflows;
- provided with safe defaults;
- backward-compatible or migratable.

Do not encode critical policy only in UI constants or undocumented environment values.

## 8. Event and audit contract

Material business changes should leave durable evidence sufficient for reconstruction of who,
what, when and why.

Prefer domain-specific revision/ledger records over generic audit blobs when the history itself
has business meaning.

Examples:

- AttendanceRevision;
- payment allocation/reversal;
- earning adjustment;
- role assignment lifecycle;
- enrollment transition history.

Audit metadata supplements canonical records; it does not replace them.

## 9. Integration contract

Each external integration must define:

- Tiny Steps canonical concept being exchanged;
- provider identifier mapping;
- direction of exchange;
- trigger;
- retry/idempotency;
- privacy boundary;
- error/reconciliation path;
- version/deprecation strategy.

Where an industry standard is suitable, prefer the standard over a bespoke contract.

Where no useful standard exists, define a small explicit Tiny Steps contract rather than expose
internal Firestore structure.

## 10. Compatibility and deprecation contract

A change that replaces a production path follows:

~~~text
introduce replacement
  ↓
backfill / synchronize where required
  ↓
verify
  ↓
switch bounded readers/writers
  ↓
observe
  ↓
freeze legacy path
  ↓
retire
~~~

No compatibility layer may be removed until:

- active callers are known;
- replacement coverage is complete;
- production reconciliation is clean;
- rollback/observation criteria are satisfied.

No compatibility layer may remain indefinitely without an explicit reason and owner.

## 11. Operational safety standard

High-risk changes should be deployed with the smallest practical blast radius.

Prefer:

- one or a few independently deployable Functions;
- explicit impact classification;
- no unrelated Hosting/Rules/index deployments;
- production readiness verification;
- baseline markers;
- rollback isolation.

Avoid changing high-fanout shared helpers until callers have either migrated or the full impact
is intentionally accepted.

The Wave 1 canonical Admin-authorization rollout is the reference implementation of this rule.

## 12. Data lifecycle standard

Data lifecycle must distinguish:

- active operational state;
- archived business state;
- legally/financially required history;
- evidence;
- derived projections;
- disposable caches;
- deletion/anonymisation-eligible personal data.

Deleting a parent document does not imply that nested/subcollection data has been safely
retired.

Destructive deletion requires explicit dependency and retention gates.

## 13. Domain application

### Identity & Access

Use stable Person/AuthIdentity/RoleAssignment/OrganisationMembership concepts.
Authorization is derived, scoped and fail-closed.

### Admissions

Lead, demo and admission state transitions should be explicit. CRM convenience views are
projections, not enrollment authority.

### Academic & Enrollment

Course/programme truth, DeliveryOffering and Enrollment remain separate from commerce,
scheduling and teacher identity.

### Scheduling

SchedulePlan expresses intent; ClassSession expresses an occurrence. Reschedule history and
actual session evidence must remain distinguishable.

### Attendance

Evidence, authoritative attendance decision and revision history remain separate.

### Workforce

Teacher identity/profile, availability, teaching assignment, earnings and payouts are separate
concepts with independent lifecycles.

### Finance

Charges, payments, allocations, earnings, adjustments and payouts are append-safe and
reconcilable. Reports never own financial truth.

### Schools

Organisation, membership, scoped role and school programme configuration remain separate from
global identity.

### Messaging & Notifications

Messages and notification delivery are operational domains. Provider delivery receipts are
evidence, not canonical user state.

### Analytics

Analytics consumes canonical semantics and projections. It must not define production
relationships or financial truth.

### AI

AI consumes authorized, purpose-limited context and returns assistance. Deterministic domain
logic remains authoritative.

## 14. Prohibited patterns

Do not introduce:

- one giant user/student document as the authority for unrelated domains;
- direct UI mutation of multi-domain state;
- dashboard aggregates as transactional authority;
- unbounded production collection scans;
- irreversible overwrite of financial/evidence history;
- role checks based only on custom claims when canonical scoped authority exists;
- provider-specific schemas as canonical business models;
- hidden workflow state encoded through UI conditions;
- permanent dual-write compatibility without reconciliation and retirement gates;
- cross-domain transactions merely to save a query;
- configuration that bypasses invariants or authorization;
- AI-generated mutations that bypass deterministic validation;
- platform rewrites whose primary justification is fashion rather than evidence.

## 15. Architecture decision checklist

A significant feature is not architecturally ready until it can answer:

1. Which domain owns each fact?
2. What is canonical versus evidence, projection, cache or analytics?
3. What stable identifier owns the lifecycle?
4. Which relationships change independently?
5. What is the command and allowed state transition?
6. What authorization context is required?
7. Is the operational path bounded at 10× scale?
8. What happens on retry or duplicate delivery?
9. Can every projection be rebuilt?
10. What history must remain immutable or append-safe?
11. Which external provider is being adapted, and where is that boundary?
12. Which behavior belongs in configuration versus code?
13. How is the change observed and reconciled?
14. How can it be migrated incrementally?
15. What is the compatibility retirement gate?
16. Does the change preserve privacy, accessibility, performance and discoverability contracts?
17. Is AI advisory or authoritative?
18. Does the deployment blast radius match the actual change?

If these answers are unclear, implementation should pause at architecture review.

## 16. What Tiny Steps intentionally does not copy

This standard does **not** require:

- Epic software or licensing;
- healthcare-specific workflow complexity;
- a proprietary hierarchical database;
- a single monolithic executable;
- on-premises deployment;
- hospital-grade feature breadth;
- database-per-domain;
- microservices;
- Kubernetes;
- a new analytics platform before existing scale requires it.

The target is the same quality of **discipline**—stable concepts, explicit authority, contextual
access, controlled workflows, compatibility, auditability and long-term evolvability—implemented
with the simplest technology appropriate for Tiny Steps.

## 17. Governance

This standard is a companion to the School OS Master Blueprint.

When there is a conflict:

1. the Master Blueprint owns canonical domain boundaries;
2. this standard owns cross-cutting enterprise engineering discipline;
3. the Migration Roadmap owns sequencing;
4. wave/brick documents own implementation evidence.

A future exception requires a documented reason based on product need, safety, scale, regulation
or measurable operational evidence.
