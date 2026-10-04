# Wave 1 — Independent Identity Profile Verification

**Migration:** `wave1-identity-profile-retirement-v1`  
**Lifecycle gate:** independent verification after production profile reconciliation  
**Production authority change:** none  
**Writes performed:** none

## Purpose

The migration reconciliation proves that the migration planner currently considers every planned target satisfied.

This verifier provides a second implementation path. It independently derives the required profile targets from the current legacy source documents and compares them with production target state.

It does **not** import:

~~~text
scripts/migrations/wave1-identity-profile-retirement-lib.mjs
~~~

That separation prevents a shared planner bug from automatically passing both migration reconciliation and verification.

## Implementation

Verifier:

~~~text
scripts/wave1-identity-profile-verify.mjs
~~~

Independent verification model:

~~~text
scripts/verification/wave1-identity-profile-verify-lib.mjs
~~~

Regression tests:

~~~text
scripts/test/wave1-identity-profile-verify.node-test.mjs
~~~

## Verification scope

The verifier independently derives and checks expected documents in:

~~~text
personContacts
personLifecycle
staffPrivateProfiles
parents
teachers
learningPartners
admins
learnerDetails
learnerReadModels
learnerProvenance
organisationProfiles
organisationAssignments
~~~

For every expected target it verifies the migrated semantic subset and requires Firestore-style `createdAt` and `updatedAt` audit timestamps.

Existing unrelated fields are allowed because the migration contract uses merge semantics and promoted role-profile collections can contain operational fields outside the migration's ownership.

The verifier also detects unexpected documents still carrying this migration's ownership metadata.

## Independent retirement dependency checks

The verifier independently checks the gates required before the legacy root fields can eventually be retired:

1. every legacy user still has a canonical Person;
2. every legacy learner still has a canonical Person and LearnerProfile;
3. every school still has a canonical Organisation;
4. every `users.childIds[]` backlink is represented by a canonical GuardianRelationship;
5. every legacy learner teacher reference is evidenced by a usable Enrollment, historical Enrollment, or ClassSession;
6. each school Learning Partner reference resolves to canonical Person and legacy user evidence;
7. school Learning Partner name/email snapshots do not contradict the referenced current legacy user.

## Read-only contract

The production verifier:

- uses Firestore reads only;
- does not use `FieldValue`;
- does not create a Firestore batch;
- does not call `set`, `update`, or `delete`;
- does not call Firebase Auth mutation APIs;
- reports `writesPerformed: 0`;
- emits only hashed subject samples and aggregate counts.

## Local validation

~~~bash
node --check scripts/verification/wave1-identity-profile-verify-lib.mjs
node --check scripts/wave1-identity-profile-verify.mjs
node --check scripts/test/wave1-identity-profile-verify.node-test.mjs
node --test scripts/test/wave1-identity-profile-verify.node-test.mjs
~~~

## Production verification

After the implementation is merged and local credentials point to the production project:

~~~bash
node scripts/wave1-identity-profile-verify.mjs \
  --project tinysteps-react-v1
~~~

A passing run must report:

~~~text
Missing targets: 0
Semantic/profile issues: 0
Unexpected migration-owned targets: 0
Retirement dependency issues: 0
VERIFIED: true
Writes performed: 0
~~~

The expected target count is derived from current source state on every invocation. It is intentionally not frozen to a historic count because legacy identity stores remain live until later write-authority cutover.

## What a pass authorizes

A pass completes the independent profile-migration verification gate.

It does **not** authorize:

- deleting legacy identity documents;
- freezing legacy writes;
- switching all readers;
- switching Security Rules;
- changing Firebase Authentication;
- changing canonical identity-core documents.

Those remain later retirement gates.
