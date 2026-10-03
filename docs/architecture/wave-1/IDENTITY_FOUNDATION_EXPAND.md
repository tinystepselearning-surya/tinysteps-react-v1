# Wave 1 — Identity Foundation Expand

**Status:** EXPAND IMPLEMENTATION — DRY-RUN VERIFICATION PENDING  
**Wave:** 1 — Identity & Relationships  
**Migration phase:** EXPAND  
**Production writes:** None in this brick  
**Read switch:** Not authorized  
**Legacy deletion:** Forbidden

## 1. Objective

Introduce the physical canonical identity contracts needed by Wave 1 without changing current production authority.

This brick expands the platform to understand:

~~~text
Person
AuthIdentity
RoleAssignment
LearnerProfile
GuardianRelationship
Household
Organisation
OrganisationMembership
~~~

while current production continues to use:

~~~text
users
kids
parents / teachers / learningPartners / admins
schools
schoolUsers
Firebase Authentication
~~~

as the active compatibility paths.

## 2. Non-goals

This brick does **not**:

- mass-backfill canonical collections;
- switch application reads;
- change Firebase Auth UIDs;
- stop legacy writes;
- delete users/kids/role mirrors/schoolUsers;
- infer households;
- migrate teacher assignments;
- change Enrollment, Scheduling, Attendance, Commerce or Finance;
- redesign portal UI.

## 3. Physical collection contract

Wave 1 reserves these canonical collections:

| Collection | Canonical responsibility | Initial ID rule |
|---|---|---|
| `people` | permanent Tiny Steps human identity | existing user ID or existing kid ID where verified |
| `authIdentities` | authentication-provider identity → Person mapping | deterministic hash of provider + provider subject |
| `roleAssignments` | scoped role/authorization assignment | deterministic hash of person + role + scope |
| `learnerProfiles` | learner-specific identity profile | same ID as learner Person |
| `guardianRelationships` | guardian ↔ learner relationship | deterministic hash of guardian + learner + relationship type |
| `households` | household grouping | schema reserved; creation deferred pending explicit boundary rule |
| `organisations` | school/company/partner identity | existing school ID where verified |
| `organisationMemberships` | Person membership in Organisation | deterministic hash of organisation + person + membership role |

Schema version begins at:

~~~text
schemaVersion = 1
~~~

Runtime contracts are implemented under:

~~~text
functions/src/schoolOS/identity/
~~~

## 4. Existing ID adoption

### Auth-backed people

For existing `users/{documentId}`:

~~~text
Person.id = existing users document ID
~~~

only when populated `uid` and/or `userId` do not contradict that document ID.

The dry run also checks the **actual Firebase Authentication UID directory** rather than assuming Firestore document IDs are Auth UIDs.

### Learners

For existing `kids/{kidId}`:

~~~text
Person.id = kidId
LearnerProfile.id = kidId
LearnerProfile.personId = kidId
~~~

This preserves the verified production learner identity namespace.

### Schools

For existing `schools/{schoolId}`:

~~~text
Organisation.id = schoolId
Organisation.type = school
~~~

No replacement school ID is introduced.

## 5. Deterministic relationship IDs

Relationship/adapter IDs use SHA-256-derived deterministic IDs rather than concatenating raw arbitrary IDs into Firestore paths.

Patterns:

~~~text
AuthIdentity
  hash(provider, providerSubject)

RoleAssignment
  hash(personId, role, scopeType, scopeId)

GuardianRelationship
  hash(guardianPersonId, learnerPersonId, relationshipType)

OrganisationMembership
  hash(organisationId, personId, role)
~~~

Properties:

- retry-safe;
- deterministic;
- no duplicate relationship record on rerun;
- provider/relationship IDs remain independent from Person ID;
- future Auth UID changes do not change Person ID.

## 6. Role scope

Platform-wide roles may initially map to global RoleAssignment records:

- admin;
- founder;
- teacher;
- parent;
- kid where a real auth-backed kid user exists;
- learningPartner.

`schoolAdmin` is **not** automatically promoted to a global role.

It must be produced from verified `schoolUsers` membership and scoped to an Organisation:

~~~text
RoleAssignment
  personId
  role = schoolAdmin
  scopeType = organisation
  scopeId = schoolId
~~~

This prevents current single-role convenience data from becoming unscoped long-term authorization.

## 7. Guardian migration

Guardian relationship sources are:

- `kids.primaryParentId`;
- `kids.parentIds[]`;
- legacy `kids.parentId`.

The planner refuses automatic backfill when:

- primary/legacy parent IDs contradict each other;
- primary parent is not represented in parentIds where parentIds exists;
- no guardian reference exists;
- the guardian source does not resolve to a Person source.

The first relationship type is:

~~~text
parent
~~~

because current source fields explicitly represent parents.

No relationship is inferred from shared surname, phone number, email or address.

## 8. Household rule

The Household schema is introduced, but **Household backfill is deliberately deferred**.

Wave 0 did not establish a safe rule such as:

~~~text
one parent = one household
~~~

and that inference could be wrong for:

- two guardians;
- siblings;
- blended families;
- shared parental access;
- future institutional guardianship patterns.

GuardianRelationship can migrate independently first.

Household creation requires a separate explicit boundary rule and dry run.

## 9. Organisation migration

Current `schools` map to `organisations`.

Current `schoolUsers` map to:

~~~text
OrganisationMembership
+
organisation-scoped RoleAssignment(schoolAdmin)
~~~

The planner blocks automatic migration if:

- schoolUsers document ID contradicts userId;
- role is not schoolAdmin;
- primarySchoolId is absent from schoolIds;
- no schoolIds exist;
- referenced Person source is missing;
- referenced School source is missing.

## 10. Compatibility posture

During EXPAND and initial BACKFILL:

~~~text
Legacy writes remain authoritative.
Canonical collections are shadow targets.
Current application reads stay unchanged.
~~~

Compatibility sources:

| Legacy source | Canonical destination |
|---|---|
| `users` | Person + AuthIdentity + RoleAssignment |
| `kids` | Person + LearnerProfile + GuardianRelationship |
| parent/teacher/LP/admin mirrors | role/profile compatibility evidence |
| `schools` | Organisation |
| `schoolUsers` | OrganisationMembership + scoped RoleAssignment |
| Firebase Auth | AuthIdentity provider evidence |

The first backfill must **not** dual-author relationships in both directions.

## 11. Security design

No client path is switched to the canonical collections in this brick.

Security posture for first backfill:

- canonical writes occur only through trusted backend/admin migration tooling;
- no new direct client write path is introduced;
- current Firebase Authentication remains unchanged;
- resource-scoped authorization remains based on current verified production paths until canonical authorization is proven;
- AuthIdentity provider subjects are not exposed merely because a Person is readable;
- child/family migration tooling reads only required identity/reference fields;
- reports avoid raw IDs unless a protected remediation artifact specifically requires them.

Before SWITCH READS, Firestore rules/authorized backend commands must explicitly define each portal's canonical access.

## 12. Index design

No new production query requires an index during this EXPAND brick because no runtime reads switch.

Expected later query shapes are registered now:

### AuthIdentity

- deterministic direct document lookup by provider + provider subject;
- optional personId lookup for account/security administration.

### RoleAssignment

- personId + status;
- scopeType + scopeId + status;
- scopeType + scopeId + role + status.

### GuardianRelationship

- guardianPersonId + status;
- learnerPersonId + status.

### OrganisationMembership

- personId + status;
- organisationId + status;
- organisationId + role + status.

Indexes should be added only when a real canonical read path is introduced, avoiding speculative index growth.

## 13. Dry-run planner

Command:

~~~bash
npm run audit:wave1-identity-foundation
~~~

The command:

1. compiles the canonical TypeScript contracts/planner;
2. reads Firestore identity/reference fields;
3. reads the Firebase Auth UID directory;
4. confirms user ↔ Auth UID coverage;
5. detects user/kid Person-ID collisions;
6. generates deterministic target-document plans;
7. detects target-document collisions;
8. checks guardian/school references;
9. checks whether canonical target collections are already populated;
10. reports blocking and non-blocking exceptions.

It performs:

~~~text
Firestore writes: 0
Auth writes: 0
~~~

The report is written to ignored:

~~~text
reports/wave1-identity-foundation-dry-run.json
~~~

## 14. Backfill gate

A bounded BACKFILL may be proposed only after the dry run shows:

- no unexplained Person-ID collision;
- verified Firebase Auth mapping for eligible auth-backed people;
- no unresolved blocking guardian reference contradiction;
- no unresolved blocking school-membership contradiction;
- no unexplained canonical target collision;
- existing canonical target contents are understood;
- source/target counts are reviewed;
- migration manifest remains valid.

A clean dry run does **not** itself perform or authorize writes.

## 15. Migration manifest

The checked-in manifest is:

~~~text
docs/architecture/wave-1/migrations/identity-foundation-v1.json
~~~

It follows Migration Execution Standard v1.

## 16. Test posture

Permanent candidate invariants introduced here:

- existing verified user ID adoption never silently changes Person ID;
- learner Person/LearnerProfile use the verified kid ID;
- deterministic AuthIdentity/relationship IDs are retry-safe;
- non-global roles require scope IDs;
- schoolAdmin never becomes an accidental global role;
- contradictory guardian relationships block automatic migration.

Temporary migration assets:

- Wave 1 identity dry-run script;
- dry-run report-shape tests where added later;
- one-off production audit workflow if used.

Retirement decision:

- deterministic ID helpers and canonical contracts are permanent platform assets;
- legacy planner remains through identity cutover, then is retired or narrowed to reconciliation;
- dry-run script retires after canonical cutover/observation unless retained as a permanent integrity audit;
- temporary GitHub workflows are removed immediately after each bounded run.

## 17. EXPAND exit criteria

This brick reaches EXPAND-complete when:

- canonical TypeScript contracts compile;
- deterministic ID rules pass tests;
- legacy planner tests pass;
- dry-run executes successfully against production read-only sources;
- Firebase Auth mapping is explicitly measured;
- blocking/non-blocking exceptions are classified;
- no production write/read-switch/deletion was performed;
- security/index requirements are documented;
- migration manifest is complete enough to govern BACKFILL planning.

Only after that review should a separate **Wave 1 Identity Backfill** brick be proposed.
