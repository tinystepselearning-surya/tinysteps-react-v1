# Wave 1 — SWITCH READS Brick 3: Legacy → Canonical Compatibility Sync

**Migration:** `wave1-identity-foundation-v1`  
**Lifecycle phase:** SWITCH READS preparation  
**Brick:** 3  
**Production read authority after this brick:** legacy  
**Production write authority after this brick:** legacy  
**Canonical role after this brick:** continuously synchronized compatibility projection

## Why Brick 3 exists

BACKFILL and independent VERIFY proved the canonical identity graph was correct at a point in time.

Brick 2 then proved, on real production parent traffic, that the legacy user identity and its canonical Person, AuthIdentity and RoleAssignment agreed during shadow reads.

That still leaves one cutover risk:

> legacy identity is still the live write authority.

Without a live compatibility path, a user, learner, school or school-admin membership created or changed after VERIFY could make the canonical shadow stale before any canonical-primary read canary begins.

Brick 3 closes that gap.

## Brick 2 production evidence entering Brick 3

The Brick 2 function was deployed as revision:

~~~text
getparentworksheetresources-00049-ruf
~~~

Production shadow observation on 2026-10-04 recorded:

~~~text
shadow events:                 11
distinct privacy-safe subjects: 5
status=match:                  11
semantic mismatches:            0
canonical missing:              0
canonical read errors:          0
adapter errors:                 0
~~~

Every healthy sampled read expected and read exactly three canonical documents.

This evidence permits the compatibility-sync brick to proceed. It does **not** authorize canonical-primary reads by itself.

## Implementation

### Sync engine

~~~text
functions/src/schoolOS/identity/legacySync.ts
~~~

### Firestore triggers

~~~text
functions/src/identityLegacySyncTriggers.ts
~~~

The four triggers are:

~~~text
users/{sourceId}
  -> onWave1LegacyUserIdentityWrite

kids/{sourceId}
  -> onWave1LegacyKidIdentityWrite

schools/{sourceId}
  -> onWave1LegacySchoolIdentityWrite

schoolUsers/{sourceId}
  -> onWave1LegacySchoolUserIdentityWrite
~~~

They synchronize only the Wave 1 canonical targets:

~~~text
people
authIdentities
roleAssignments
learnerProfiles
guardianRelationships
organisations
organisationMemberships
~~~

Households remain deferred.

## Authority contract

Brick 3 does **not** change the application write path.

Existing production writers continue to write:

~~~text
users
kids
schools
schoolUsers
Firebase Authentication
~~~

The new triggers project those legacy-authoritative changes into canonical identity.

No application request is changed to write canonical identity first.

No canonical document is allowed to change the legacy business result.

## Concurrency safety

Firestore event delivery is not an ordering guarantee.

Therefore the sync engine does not blindly trust the event's `after` snapshot as current truth.

For every identity-relevant event it:

1. opens a Firestore transaction;
2. rereads the current legacy source document inside that transaction;
3. derives the canonical state from that current source;
4. validates bounded source references;
5. reads the affected canonical documents;
6. writes the canonical projection atomically.

If the legacy source changes while the transaction is in progress, Firestore transaction conflict handling reruns against the newer source state.

This prevents an older event from overwriting a newer canonical projection.

## Identity-field filter

The trigger is intentionally quiet for unrelated updates.

Examples that do **not** require a canonical identity write include:

- learning-partner assignment arrays on `users`;
- unrelated operational timestamps;
- teacher assignment fields on learners;
- other non-identity metadata.

Each source has a small comparable identity projection.

The sync engine runs only when that projection changes, or when the source document is created or deleted.

The trigger invocation itself still exists for a matching collection write, but unnecessary canonical reads/writes are skipped immediately.

## Canonical ownership guard

The compatibility layer may modify only documents owned by:

~~~text
migrationId = wave1-identity-foundation-v1
sourceCollection = current legacy collection
sourceId = current legacy document ID
~~~

If an affected canonical document exists but is owned by something else:

~~~text
outcome = blocked
blockingIssues = ["canonical_target_owned_elsewhere"]
~~~

No partial canonical mutation is performed for that source event.

This prevents the temporary compatibility layer from overwriting a future canonical-owned record.

## Create and update semantics

For a missing migration-owned target:

~~~text
create canonical projection
createdAt = server timestamp
updatedAt = server timestamp
~~~

For an existing migration-owned target whose identity semantics changed:

~~~text
replace with the current deterministic projection
preserve createdAt
updatedAt = server timestamp
~~~

If the canonical semantics already match:

~~~text
no canonical write
~~~

The materialized business fields and migration provenance intentionally match the original Wave 1 BACKFILL contract.

## Relationship and role cleanup

A write can make a previously valid canonical document obsolete.

Examples:

- parent → teacher role change;
- learner moves from one explicit guardian reference to another;
- school-admin membership removes a school.

The trigger compares the current canonical plan with the triggering event's previous legacy state.

A previous migration-owned target that is no longer expected is deleted.

Deletion is bounded to deterministic documents derived from that exact previous source record. The layer never scans or bulk-deletes canonical identity.

This is projection cleanup, not historical-domain deletion.

## Legacy source deletion

When a legacy source document is deliberately deleted, Brick 3 removes only the canonical identity documents that were deterministically projected from that source and still carry the same Wave 1 migration ownership.

This is required to prevent deleted legacy identities from surviving as false canonical-current identities.

Existing product safeguards remain unchanged. For example, protected parent/student hard-delete rules continue to be enforced by the existing admin workflow.

## Source-reference safety

Before a canonical write, the transactional sync checks the same important identity boundaries established by BACKFILL:

- user Person ID must not collide with a learner ID;
- learner Person ID must not collide with a user ID;
- explicit learner guardian references must resolve to legacy users;
- school-admin membership Person must resolve to a legacy user;
- school-admin organisation IDs must resolve to legacy schools;
- the existing planner continues to enforce UID/userId, guardian-primary and school-membership shape rules.

Permanent source-model contradictions are logged as blocked compatibility events rather than silently materialized.

## Firebase Authentication

For `users/{uid}`, the trigger reads the current Firebase Auth user and materializes:

~~~text
AuthIdentity.provider = firebase
AuthIdentity.providerSubject = exact uid
AuthIdentity.status = active | disabled | archived
~~~

Current supported profile/status writers already coordinate Auth profile/disabled state with a `users/{uid}` mutation.

Password-only and custom-claim-only updates do not alter the canonical identity projection and do not require an identity sync.

Brick 3 does not replace Firebase UID or Firebase Authentication as the authentication provider.

## Retry and failure policy

The Firestore triggers use retry-enabled event delivery for transient execution failures.

Permanent model/ownership conflicts are handled as a successful trigger invocation with:

~~~text
outcome = blocked
~~~

so an invalid source record cannot create an infinite retry loop.

Unexpected runtime failures are emitted as:

~~~text
wave1_identity_legacy_sync_error
~~~

and are rethrown so transient failures remain retryable.

## Telemetry

Successful/no-op/deletion/blocked sync executions emit:

~~~text
wave1_identity_legacy_sync
~~~

The payload contains:

- source collection;
- 12-character SHA-256 subject token;
- source existence;
- outcome;
- expected document count;
- create/update/delete/unchanged counts;
- blocking/non-blocking issue codes.

It contains no raw identity ID, name, email or phone.

Unexpected runtime errors emit:

~~~text
wave1_identity_legacy_sync_error
~~~

with only the source collection, hashed subject token and error class name.

No Firestore telemetry collection is created.

## Read/write cost boundary

One identity-relevant source write performs only bounded operations for that single identity record.

There is:

- no collection-wide canonical scan;
- no scheduled full identity scan;
- no per-request sync;
- no recursive trigger loop because canonical targets are different collections;
- no canonical write when semantics already match.

The number of target documents is bounded by explicit roles/guardians/school memberships on the one changed source record.

## Regression tests

~~~text
functions/test/identityLegacySync.spec.ts
~~~

Coverage includes:

- exact user → Person/AuthIdentity/RoleAssignment materialization;
- Firebase disabled-state mapping;
- role-transition stale cleanup planning;
- guardian-transition stale cleanup planning;
- organisation-membership stale cleanup planning;
- missing Firebase Auth identity blocking;
- legacy source deletion cleanup planning;
- unrelated-field skip behavior;
- timestamp-insensitive semantic comparison and migration ownership.

## Validation gate

Before merge:

~~~bash
npm --prefix functions run lint
npm --prefix functions run build
npm --prefix functions run test -- test/identityLegacySync.spec.ts test/identityReadAdapter.spec.ts test/identityShadowCanary.spec.ts
npm run test:wave1-identity-foundation
~~~

After deployment, production observation must confirm that live identity mutations synchronize cleanly and that Brick 2 shadow reads remain healthy.

## What Brick 3 does not do

Brick 3 does not:

- switch production reads to canonical authority;
- switch application writes to canonical-primary;
- stop legacy writes;
- change Firebase login or UID;
- infer Households;
- migrate role-specific profile collections;
- migrate Enrollment, Scheduling, Attendance, Finance or Commerce;
- delete unrelated historical records;
- relax the canonical ownership guard.

## Next brick

After Brick 3 is deployed, observed and reconciled:

**Brick 4 — narrow canonical-read canary**

That brick may allow canonical identity to become primary for one deliberately narrow read surface with an observable legacy fallback.

Until then:

~~~text
legacy read authority  = unchanged
legacy write authority = unchanged
canonical identity     = synchronized shadow/compatibility state
~~~

## Local validation result

The implementation was validated on the PR branch with a temporary no-secrets GitHub Actions workflow.

Validation run:

~~~text
run ID: 37185511318
validated implementation commit: 4c7aacb2ae8008392a932a5fc66b809c8df758bd
~~~

Result:

~~~text
Functions lint:                         passed
Functions TypeScript build:             passed

Focused Brick 1-3 identity tests:
  identityLegacySync:                    9/9
  identityReadAdapter:                   7/7
  identityShadowCanary:                  8/8
  focused total:                        24/24

Wave 1 identity foundation tests:        8/8
Authorization hardening tests:           8/8
~~~

The temporary validation workflow is retired before merge and is not part of the production CI surface.

This validation proves compilation and regression behavior. It does not replace post-deployment production observation of the four new compatibility triggers.

