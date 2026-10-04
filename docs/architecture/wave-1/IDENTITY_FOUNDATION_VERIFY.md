# Wave 1 — Identity VERIFY

**Migration:** `wave1-identity-foundation-v1`  
**Execution posture:** Local Mac, read-only  
**Current lifecycle state:** BACKFILL complete; VERIFY pending  
**Read switch:** not authorized by this phase

## Purpose

Prove independently that the 1,253 canonical identity documents created during BACKFILL are structurally, referentially and semantically correct against the current production source authority.

This verifier does not import the backfill materialization helper. It independently derives the expected identity graph from the legacy source collections plus Firebase Authentication and compares that graph with the canonical collections.

## Verifier

~~~text
scripts/wave1-identity-foundation-verify.mjs
~~~

Independent verification model:

~~~text
scripts/verification/wave1-identity-verify-lib.mjs
~~~

Regression tests:

~~~text
scripts/test/wave1-identity-verify.node-test.mjs
~~~

## Production baseline being verified

Source baseline:

~~~text
users                  223
Firebase Auth users    225
kids                   194
schools                  1
schoolUsers               1
~~~

Canonical baseline:

~~~text
people                    417
authIdentities            223
roleAssignments           223
learnerProfiles           194
guardianRelationships     194
organisations               1
organisationMemberships     1
households                  0
--------------------------------
total                    1,253
~~~

## Verification layers

### 1. Structural

For every canonical document:

- deterministic document ID is independently re-derived;
- required schema/audit/migration fields match;
- createdAt and updatedAt exist as Firestore timestamps;
- document ID agrees with its canonical identity field;
- there are no unexpected canonical documents.

### 2. Semantic

The verifier independently compares current legacy source meaning with canonical state:

- user Person name/kind/status;
- Firebase AuthIdentity UID/provider/status;
- global RoleAssignment role/status;
- learner Person and LearnerProfile identity/name/age/country/status;
- GuardianRelationship parent/learner/primary/status;
- school Organisation ID/name/status/legacy code;
- schoolAdmin OrganisationMembership and organisation-scoped RoleAssignment.

No name/email/phone/address heuristic is used.

### 3. Referential

The verifier requires:

- every AuthIdentity → existing Person;
- every RoleAssignment → existing Person;
- organisation-scoped RoleAssignment → existing Organisation;
- schoolAdmin roles are never global;
- every LearnerProfile → learner Person;
- every GuardianRelationship guardian and learner both exist;
- every OrganisationMembership Person and Organisation both exist;
- no duplicate logical AuthIdentity, role, guardian relationship or organisation membership.

### 4. Migration boundary

The verifier also checks:

- source counts have not changed from the completed backfill baseline;
- canonical counts remain exact;
- the two Firebase Auth-only accounts remain excluded;
- Household remains empty/deferred;
- zero blocking source-model contradictions exist.

If legacy source data changed after BACKFILL, VERIFY fails instead of silently treating the original backfill as current.

## Privacy

The verifier reads identity fields required for semantic comparison but reports:

- no names;
- no emails;
- no phone numbers;
- no raw IDs;
- mismatch samples use short SHA-256 tokens only.

## Write safety

The production verifier contains no Firestore write methods.

It performs:

~~~text
Firestore writes: 0
Firebase Auth writes: 0
~~~

The regression test also source-checks the verifier for Firestore mutation calls.

## Local execution

Fetch the VERIFY branch:

~~~bash
git fetch origin
git checkout wave1/identity-verify
git pull origin wave1/identity-verify
~~~

Run the verifier regression tests:

~~~bash
node --test scripts/test/wave1-identity-verify.node-test.mjs
~~~

Then run the production verifier:

~~~bash
node scripts/wave1-identity-foundation-verify.mjs \
  --project tinysteps-react-v1
~~~

No confirmation flag exists because VERIFY has no write mode.

## Required exit result

The expected healthy output is:

~~~text
People: 417/417
Auth identities: 223/223
Role assignments: 223/223
Learner profiles: 194/194
Guardian relationships: 194/194
Organisations: 1/1
Organisation memberships: 1/1
Households: 0/0 (deferred)

Expected documents: 1253
matched: 1253
missing: 0
unexpected: 0

Semantic mismatches: 0
Broken/reference invariant issues: 0
Blocking source-model issues: 0
Auth-only canonical leaks: 0

Source baseline unchanged: true
Canonical baseline exact: true

VERIFIED: true
Writes performed: 0
~~~

Only after this result is reviewed may the migration manifest move from `backfill_complete` to `verified`.

VERIFY completion still does not authorize deleting legacy data, stopping legacy writes, replacing Firebase UIDs or migrating unrelated domains.

## Next lifecycle phase

After VERIFY:

~~~text
SWITCH READS
~~~

That phase must introduce canonical read adapters and bounded fallback/observability before production identity reads are moved.


## Production VERIFY result

Read-only production VERIFY completed successfully on 2026-10-04.

Regression test result:

~~~text
tests 7
pass 7
fail 0
~~~

Production verifier result:

~~~text
People: 417/417
Auth identities: 223/223
Role assignments: 223/223
Learner profiles: 194/194
Guardian relationships: 194/194
Organisations: 1/1
Organisation memberships: 1/1
Households: 0/0 (deferred)

Expected documents: 1253
Matched: 1253
Missing: 0
Unexpected: 0

Semantic mismatches: 0
Broken/reference invariant issues: 0
Blocking source-model issues: 0
Auth-only accounts excluded: 2
Auth-only canonical leaks: 0

Source baseline unchanged: true
Canonical baseline exact: true

VERIFIED: true
Writes performed: 0
~~~

Production report:

~~~text
reports/wave1-identity-verify-2026-10-04T06-04-13-420Z.json
~~~

The VERIFY phase is therefore complete.

Current authority is still unchanged:

~~~text
legacy identity collections
= production read/write authority

canonical identity collections
= verified canonical shadow state
~~~

VERIFY completion authorizes planning the SWITCH READS brick only. It does not itself switch reads, stop legacy writes, delete legacy data, replace Firebase UIDs, create Households or migrate unrelated domains.
