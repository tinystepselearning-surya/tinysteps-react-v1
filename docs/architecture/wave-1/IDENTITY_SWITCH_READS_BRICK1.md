# Wave 1 — SWITCH READS Brick 1: Legacy-Authoritative Shadow Adapter

**Migration:** `wave1-identity-foundation-v1`  
**Lifecycle phase:** SWITCH READS preparation  
**Brick:** 1 of the read-cutover sequence  
**Production authority after this brick:** legacy identity paths remain authoritative

## Purpose

Introduce one central backend identity read adapter that can compare current legacy identity records with the verified canonical identity model without allowing canonical state to change application behaviour.

This brick creates the adapter and regression coverage only.

It does **not** wire the adapter into a live production request path yet.

## Authority contract

Every Brick 1 result is explicitly:

~~~text
authority = legacy
~~~

The adapter always returns the legacy source document as the business result.

Canonical documents are shadow-only comparison inputs.

A canonical mismatch, missing document or read error is classified in the shadow observation and must not replace or override the legacy result.

If the legacy authority itself is missing, canonical state is not promoted automatically.

## Supported shadow readers

The adapter lives at:

~~~text
functions/src/schoolOS/identity/readAdapter.ts
~~~

It provides bounded point-read shadow comparisons for:

~~~text
users
  -> people
  -> authIdentities
  -> global roleAssignments

kids
  -> people
  -> learnerProfiles
  -> guardianRelationships

schools
  -> organisations

schoolUsers
  -> organisationMemberships
  -> organisation-scoped schoolAdmin roleAssignments
~~~

No collection-wide canonical scan is used in a request-path adapter.

## Shadow classifications

~~~text
match
legacy_missing
canonical_missing
semantic_mismatch
canonical_read_error
~~~

Each observation includes:

- source collection;
- privacy-safe 12-character SHA-256 subject token;
- number of expected canonical point reads;
- number of canonical documents successfully read;
- missing canonical kinds;
- semantic mismatch field names;
- canonical read-error kinds;
- legacy-read latency;
- canonical-shadow-read latency.

Raw identity IDs are not required in future telemetry.

## Read-cost boundary

Brick 1 adds **zero production Firestore reads** because no live request path imports the adapter yet.

When Brick 2 wires a canary surface, read amplification is bounded to deterministic point reads derived from the already-read legacy identity:

- user: Person + AuthIdentity + known global RoleAssignment(s);
- learner: Person + LearnerProfile + verified GuardianRelationship(s);
- school: Organisation;
- school user: OrganisationMembership + organisation-scoped RoleAssignment per explicit school ID.

The adapter does not issue unbounded queries.

## Failure safety

Canonical reads are individually contained.

A canonical read failure produces:

~~~text
status = canonical_read_error
authority = legacy
~~~

A semantic mismatch produces:

~~~text
status = semantic_mismatch
authority = legacy
~~~

A missing canonical target produces:

~~~text
status = canonical_missing
authority = legacy
~~~

None of these states switch authority.

A legacy Firestore read failure is intentionally not swallowed because legacy remains the declared production authority.

## Role safety

The adapter preserves the Wave 1 role boundary:

- normal application roles remain global RoleAssignments;
- `schoolAdmin` is not treated as a global role;
- school-admin authority is compared through explicit OrganisationMembership plus organisation-scoped RoleAssignment.

## Regression coverage

~~~text
functions/test/identityReadAdapter.spec.ts
~~~

Coverage includes:

- exact user shadow match while legacy remains authoritative;
- semantic mismatch without canonical promotion;
- canonical read error containment;
- canonical missing classification;
- learner/profile/guardian parity;
- school Organisation parity;
- organisation-scoped schoolAdmin membership/role parity;
- legacy-missing case does not promote canonical state.

## What this brick does not do

Brick 1 does not:

- modify Firebase Authentication;
- write canonical identity documents;
- update legacy identity documents;
- switch any production read to canonical authority;
- create a fallback from canonical to legacy because canonical is not primary yet;
- emit persistent telemetry;
- create Households;
- change identity write authority;
- remove any compatibility path.

## Validation before merge

From the branch:

~~~bash
npm --prefix functions run lint
npm --prefix functions run build
npm --prefix functions run test -- test/identityReadAdapter.spec.ts
npm run test:wave1-identity-foundation
~~~

All must pass before merge.

## Next brick

**SWITCH READS Brick 2 — production shadow canary + divergence telemetry**

Brick 2 should wire this adapter into one deliberately narrow, low-risk identity read surface while continuing to return legacy data.

Only Brick 2 should begin collecting real production parity, fallback/mismatch and latency evidence.

Canonical-primary reads remain out of scope until that evidence is clean.
