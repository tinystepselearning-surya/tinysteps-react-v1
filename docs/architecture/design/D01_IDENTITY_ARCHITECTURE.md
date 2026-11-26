# D01 — Identity architecture (target design)

**Status:** Owner-directed design draft, independent review pending; no P02/P03/P04 authorization or production changes. 
**Evidence baseline:** 701c7ec832dbe9c531964496fa09cd4a4948ddd2. On 26 November 2026, main was 79 commits ahead; the compare response listed 30 changed paths, mainly analytics/workflows. Direct blob comparisons confirmed unchanged identity contracts, canonical learner writer, Firestore/Storage Rules, Wave 1 ledger, profile migration contract and school authorization helper. This is scoped revalidation, not full main rebaseline or deployment parity.
**References:** [v1 blueprint](../TINY_STEPS_SCHOOL_OS_MASTER_BLUEPRINT_V1.md), [engineering standard](../SCHOOL_OS_ENTERPRISE_ARCHITECTURE_STANDARD_V1.md), [Wave 1 ledger](../wave-1/migrations/identity-foundation-v1.json), [profile migration](../wave-1/IDENTITY_PROFILE_RETIREMENT_MIGRATION.md), [master registry](../registry/TSOS_V2_MASTER_RECORD_ITEM_REGISTRY_DRAFT.json).

## 1. Target ownership and topology

One Person represents one verified individual within an authorized identity boundary. Do not automatically link independent customers' records or infer identity from contact/name similarity. Firebase Auth UID remains a provider subject, not the new Person ID. Preserve already verified IDs, current login, current access behavior and existing canonical writers. A person can hold multiple roles, and a learner can exist without a login. The role, household, guardian, payer and teaching-assignment facts are independent. Tenant isolation, campus context and membership authorization are detailed in D02; until approved, no external tenant onboarding or automatic cross-tenant linking.

| Record | Target document path | Grain / ownership | Design disposition |
|---|---|---|---|
| PER Person | people/{personId} | One identity; identity | Reuse existing contract |
| AUT AuthIdentity | authIdentities/{authIdentityId} | One provider account binding; identity | Reuse existing IDs, provider subject uniqueness within issuer |
| ROL RoleAssignment | roleAssignments/{roleAssignmentId} | One person/role/scope grant; identity | Reuse; scope changes subject to D02 |
| LRN LearnerProfile | learnerProfiles/{learnerProfileId} | One learner profile per Person within authorized boundary; SIS | Reuse; preserve verified IDs |
| GUA GuardianRelationship | guardianRelationships/{guardianRelationshipId} | One guardian Person–learner Person relationship; SIS | Reuse; historical changes audited |
| HOU Household | households/{householdId} | One household; SIS | Existing source contract; migration held |
| HMB HouseholdMembership | householdMemberships/{householdMembershipId} | One effective membership episode between Person and Household; SIS | Proposed candidate; collision and dependency review required |
| CNT PersonContact | personContacts/{personId} | One contact profile; identity | Preserve existing contract |
| PLC PersonLifecycle | personLifecycle/{personId} | Existing archival metadata; identity | Preserve; not itself a full history ledger |
| LDT LearnerDetail | learnerDetails/{personId} | Existing nonidentity learner detail; SIS | Preserve grade compatibility; academic placement ownership D03/D04 |
| FPR FacultyProfile | teachers/{personId} | Existing teacher role profile; workforce | Preserve; not new Person or employment authority |
| PPR ParentProfile | parents/{personId} | Existing parent role preferences/profile; SIS | Preserve |
| LPP LearningPartnerProfile | learningPartners/{personId} | Existing LP role profile; workforce | Preserve |
| APR AdminProfile | admins/{personId} | Existing admin role profile; identity | Preserve |
| SPR StaffPrivateProfile | staffPrivateProfiles/{personId} | Restricted staff data; workforce | Preserve server-only access pending explicit contract |
| LRM LearnerReadModel | learnerReadModels/{personId} | Rebuildable summary/progress; SIS projection | Preserve; never authoritative |
| LPV LearnerProvenance | learnerProvenance/{personId} | Repair evidence; SIS | Preserve; never current identity authority |
| ORG Organisation | organisations/{organisationId} | Institution identity; identity/platform | Existing; D02 |
| MEM OrganisationMembership | organisationMemberships/{organisationMembershipId} | Person/organisation membership; identity/platform | Existing; D02 |

Existing path evidence is source contract or historical migration contract, not current production inventory. Existing organisationProfiles and organisationAssignments remain in D02. Role profiles do not confer authorization by their existence.

## 2. Relationships and integrity

- PER 1 to 0..many AUT; an authentication subject maps to at most one verified Person in the applicable issuer/boundary. Existing Auth identities, provider aliases and Firebase UID login remain intact. Never store access tokens, passwords or credentials in identity records.
- PER 1 to 0..1 LRN within the approved identity boundary. Preserve the current verified ID strategy; do not assume every learnerProfileId is equal to personId.
- PER 1 to 0..many ROL; each assignment points to exactly one person and valid scope. Existing global/organisation/household vocabulary is retained until D02 reviews it. Global privileges require explicit policy, never membership-derived escalation.
- GUA connects exactly one guardian Person to exactly one learner Person (not learnerProfileId); each endpoint may participate in many relationships. isPrimary is a designation, not proof of unrestricted access or consent. No self-edge. Multiple guardians and changes must be supported. Any restricted/custody access policy must be checked separately; no automatic grant from relationship alone.
- HOU 1 to 0..many HMB; PER 1 to 0..many membership episodes, subject to approved scope and deduplication. At most one active membership per person/household pair (candidate invariant); no inferred shared household from surname, phone, guardian link or shared payer. Primary contact must be a verified eligible member when the new membership contract is active; do not enforce this retrospectively before reconciliation. Membership grants neither guardian access, payment responsibility nor consent.
- Role profiles, contact and lifecycle metadata depend on Person. Learner detail/read model/provenance maintain existing person-keyed path. Teacher relationships derive from TeachingAssignment and historical session/enrollment evidence, not a child-level teacher list. Organisation membership, faculty engagement, enrollment and billing account are independent contracts.
- Archive/disable is not delete. Identity status, Auth disable, learner lifecycle, roles and membership have distinct effects. Commands must preserve existing behavior during transition; state changes use explicit transition rules and auditable corrections, no cascading delete.

## 3. Field contracts and item dictionary

Reuse the 43 source-backed identity fields in the registry, including exact optionality/nullability. Preserve source enum codes, common schemaVersion, createdAt/updatedAt, createdBy/updatedBy and optional migration provenance. Persisted timestamps are resolved timestamps, not write sentinel values. Candidate field IDs are not adopted. No implicit migration to a new schema version.

| Record | Source-backed fields (record-specific) | Target decision |
|---|---|---|
| PER | personId, kind, status, displayName, optional countryCode | Preserve; proposed dateOfBirth remains unbound and purpose-gated. Do not derive from age. |
| AUT | authIdentityId, personId, provider, providerSubject, status | Preserve; provider subject is restricted, not secret credential. |
| ROL | roleAssignmentId, personId, role, scopeType, scopeId (nullable), status | Preserve; validate scope consistency; D02 defines future context. |
| LRN | learnerProfileId, personId, status, optional ageYears/countryCode | Preserve; no fabricated birth dates; countryCode overlaps PER and requires ownership review. |
| GUA | guardianRelationshipId, guardianPersonId, learnerPersonId, relationshipType, isPrimary, status | Preserve; candidate effective periods/history deferred until policy and source review. |
| HOU | householdId, status, optional primaryContactPersonId/countryCode | Preserve source contract, keep held rollout. |
| ORG/MEM | Existing complete source field seeds in registry | D02 owns detailed design. |

New HMB seed:
| Item | Field | Type / cardinality | Invariant |
|---|---|---|---|
| HMB-1001 | householdMembershipId | opaque ID, 1 | Stable identity of episode; document key must match |
| HMB-1002 | householdId | HOU reference, 1 | Existing approved household |
| HMB-1003 | personId | PER reference, 1 | Existing authorized Person |
| HMB-1004 | status | active/ended, 1 | Explicit lifecycle; no silent reactivation of ended episode |
| HMB-1005 | effectiveStartAt | timestamp, 0..1 | Known validity start; required on new capture if approved |
| HMB-1006 | effectiveEndAt | timestamp, 0..1 | Known validity end; required for newly recorded closure if approved |

Use a new episode on rejoin; reserve uniqueness for active pair with transactionally checked key/reservation (mechanism/path to review with existing writer and D02). Do not use a permanent pair key as the historical episode ID. A missing historical start/end is unknown, not the migration time. End must not precede known start. Proposed common audit field set for HMB requires separate typed contract and item namespace review.

Historical profile migration documents specify the following field families (not exhaustive typed contracts): CNT email, phone, phoneCountryCode, phoneLocal, whatsappE164, timezone, countryCodeSource, countryCodeUpdatedAt; PLC archivedAt/archivedBy/archivedReason; LDT grade; FPR/PPR/LPP/APR role-specific profile metadata, qualifications/specializations/languages and applicable preferences; SPR restricted payout and emergency contact fields; LRM summary/progress; LPV repair provenance. Do not copy all fields across every role. Keep full profile item allocation and exact nullability pending focused source/schema review; retain working contracts in the meantime. Do not introduce redundant contact or demographic authorities. CountryCode owner follows existing PER contract unless reviewed change.

## 4. Proposed service boundaries (logical contracts, not function names to deploy)

| Command / query | Authority / invariants | Behavior |
|---|---|---|
| createPerson / createLearner | Identity and SIS; explicit operator or supported current parent workflow | Reuse canonicalPrimaryWriter and existing compatibility contracts; atomic same-database core writes where supported; no duplicate Person, no automatic login creation |
| linkAuthIdentity | Identity; authorized account-linking and uniqueness checks | Preserve UID; Firebase Auth lifecycle is a separate system with explicit failure/reconciliation handling |
| updateContact / correctPerson | Identity; field-specific policy, actor and revision | No generic unrestricted patch, never log sensitive field values |
| grantRole / revokeRole | Identity/security; authorized grant scope and policy | No self-escalation; preserve existing M3 holds; define revocation freshness in D02 |
| addGuardian / endGuardian | SIS/security; verified relationship and consent/access policy | Audit, no inferred relationship, no automatic Auth grant or payer linkage |
| createHousehold / addMember / endMember | SIS; approved membership workflow, valid references, uniqueness | New additive functionality only after approved release; separate guardian/billing semantics |
| archivePerson / restorePerson | Identity plus affected domain owners | Check dependencies, explicit lifecycle transitions, no destructive cascade, reconcile Auth and role effects |
| getPersonContext / getAuthorizedLearners | Identity/SIS scoped query | Use current compatible DTO/read models; do not return private staff fields or broad household roster |

Reuse existing commands/functions if equivalent. Candidate command names above are contracts, not evidence of existing endpoints. Verify current role, learner creation, Firebase Auth and mobile behavior before new writer adoption. Idempotency and optimistic concurrency/transaction checks required on any new mutation; reject ambiguous identity mappings; use existing audit and compatibility mechanisms rather than a second parallel authority.

## 5. Security and reads

Proposed read/write matrix: Person/contact — own or purpose-authorized staff; learner data — verified guardian/assigned teacher/authorized scoped staff only as contract allows; AUT/ROL — restricted identity services and approved administrative views; HOU/HMB — purpose-authorized explicit membership access, not broad family search; SPR — server-only until approved restricted contract; LRM — same scoped access as underlying learner, data-minimized. No general public access. Do not change existing Rules as part of design. Firestore client reads expose document fields; use separate restricted documents and authorized DTOs. Admin SDK bypasses Rules: validate context on every server command/query and job. D02 must settle independent tenant boundaries and revocation before new roles go live.

Target query shapes for design: AUT exact provider+subject resolution using verified existing key strategy; ROL bounded person+scope+status; GUA bounded guardianPersonId/status or learnerPersonId/status; HMB bounded personId/status or householdId/status; profile detail direct key. Candidate composite indexes only after reviewing actual current indexes, query constraints, cardinality and security; no indexes created here. No unbounded collection scan, no per-item dictionary read and no N+1 household or learner loading. Preserve optimized existing parent/teacher views; measure current/target read counts and latency on representative fixtures, require no unexplained regression and explicit approval for additional cost. Hard numeric budgets set from actual affected baseline before implementation, not guessed.

## 6. Existing data and migration

Wave 1 already recorded historical core reconciliation (1265 matching records after catch-up) and independent profile verification (891 matching targets). These are historical checkpoints, not a fresh production count. The ledger remains the only identity migration authority. Do not re-backfill verified data merely because the programme is V2.

| Current source | Destination / policy |
|---|---|
| users | Existing PER/AUT/ROL, CNT and role profiles; verify per-field existing mappings, do not recreate people or change Firebase UID |
| kids | Existing PER/LRN/GUA, LDT/LRM/LPV; preserve historical learner IDs and references, no new child-level teacher authority |
| schools / schoolUsers | Existing ORG/MEM and organisation profile/assignment; D02, no permission broadening |
| user childIds | Compatibility backlink; reconcile to GUA, do not treat it as sole evidence or change current writer without gate |
| learner teacherId/teacherIds | Preserve source/historical evidence; converge on enrollment/assignment/session contracts under D04/D05 |
| Household facts not reliably known | Prospective capture after approved workflow; no inferred household or fake effective dates |
| New fields | Optional for old records until reviewed; collect prospectively; exact derived values only with provenance |

Per family: source/destination collision check, bounded dry run, immutable mapping/provenance, idempotent backfill/catch-up, conflict quarantine, semantic and reference reconciliation, authorized shadow comparison, controlled reader switch, writer ownership transfer, observation, explicit legacy retirement. Already canonical fields reused; no blanket duplicate v2 collection. Recovery evidence, backup/restore plan and rollback that preserves post-switch writes required before production migration. No historical profile rerun authorized.

## 7. Acceptance and test plan

Design review must settle code/field IDs, exact owner, key/uniqueness mechanism, profile field types, sensitive classification/retention, access, state transitions and D02 context before executable adoption. Test in isolated development after authorization:
- Same Person with parent and teacher roles; multiple children and multiple guardians; learner without Auth; independent identity namespaces and cross-tenant denial.
- Duplicate provider binding rejected; conflicting legacy aliases quarantined; existing Firebase login/UID and canonical IDs preserved.
- Household membership independent of guardian and payer; duplicate active membership, invalid reference, self-guardian and unauthorized scope denied; rejoin retains closed history.
- Revocation, suspended role and archive behavior; no private profile exposure, no broad listing, no escalation through direct SDK or server command.
- Retry/idempotency, concurrent create/update, unknown history, partial external Auth failure, rollback and compatibility parity.
- Measured read/write/latency budgets; source vs target counts/references; no unexplained divergences; no deletion of original records.

Existing M3 role/freshness gate, independent review, P01 acceptance and P02/P03/P04 implementation/release holds stay in force. No new tests, deployment or live verification performed here. D01 is a substantive initial design, not final acceptance; D02 next defines tenancy, membership scopes and campus boundaries. Shared profile/item details and security policies remain explicit follow-up rather than claimed complete.
