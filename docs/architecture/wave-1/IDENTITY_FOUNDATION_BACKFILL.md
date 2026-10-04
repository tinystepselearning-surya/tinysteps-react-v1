# Wave 1 — Identity Foundation Backfill

**Migration:** `wave1-identity-foundation-v1`  
**Execution posture:** Local Mac, manual and bounded  
**Current authority:** legacy identity collections remain authoritative  
**Read switch:** not part of this brick

## Purpose

Populate the canonical identity collections from the already-verified legacy identity sources.

This phase does **not** redesign IDs. It materializes the deterministic mapping established in EXPAND.

Expected production target from the final EXPAND dry run:

| Canonical collection | Expected documents |
|---|---:|
| people | 417 |
| authIdentities | 223 |
| roleAssignments | 223 |
| learnerProfiles | 194 |
| guardianRelationships | 194 |
| organisations | 1 |
| organisationMemberships | 1 |
| **Total** | **1,253** |

`households` remains deferred.

## Source → target

- `users` → Person + Firebase AuthIdentity + global RoleAssignment
- `kids` → learner Person + LearnerProfile + GuardianRelationship
- `schools` → Organisation
- `schoolUsers` → OrganisationMembership + organisation-scoped schoolAdmin RoleAssignment

Existing verified user IDs, learner IDs and school IDs are preserved.

## Executor

~~~text
scripts/wave1-identity-foundation-backfill.mjs
~~~

Pure materialization and safety helpers:

~~~text
scripts/migrations/wave1-identity-backfill-lib.mjs
~~~

Regression tests:

~~~text
scripts/test/wave1-identity-backfill.node-test.mjs
~~~

Local checkpoint:

~~~text
reports/wave1-identity-backfill-checkpoint.json
~~~

`reports/` is ignored by Git and may contain the raw document-ID cursor required for safe resume. Normal reports use hashed source tokens rather than raw IDs.

## Safety contract

The executor:

- is scoped to Firebase project `tinysteps-react-v1`;
- requires an explicit `--confirm-project tinysteps-react-v1` for production writes;
- requires an explicit per-run record limit;
- enforces at most 250 source records per write run;
- enforces at most 100 Firestore writes per batch;
- keeps all writes for one source record in the same write batch;
- uses deterministic canonical IDs;
- treats an already-correct canonical document as unchanged;
- may update only a canonical document already owned by this same migration/source record;
- refuses to overwrite a canonical document owned by another source/migration;
- refuses unexpected canonical target documents;
- verifies the checkpoint against already-written canonical state before resuming;
- stops on blocking source/reference/materialization conflicts;
- verifies the selected documents after every write run;
- never modifies Firebase Authentication;
- never deletes legacy or canonical records;
- does not create Household records;
- does not switch reads or writes.

## Canonical field policy

Backfill copies only verified identity fields needed by the canonical contracts.

### Person from users

- Person ID = existing verified `users/{uid}` document ID
- display name = current displayName/name (Firebase display name is fallback only)
- status = current canonical status; legacy missing status maps to active
- kind = adult, except an actual kid role maps to learner

### Person / LearnerProfile from kids

- Person ID = existing `kids/{kidId}`
- LearnerProfile ID = same kid ID
- name = existing learner name fields
- age = explicit legacy age/ageYears only
- country = explicit legacy countryCode only
- no inferred age, country, guardian or household

### AuthIdentity

- provider = Firebase
- provider subject = exact verified Firebase Auth UID
- disabled Auth users remain disabled
- Auth-only orphan accounts remain excluded

### GuardianRelationship

- only explicit `primaryParentId`, `parentId` and `parentIds` references are used
- relationship type = parent
- primary marker follows the verified primary reference
- no surname/email/phone/address inference

### Organisation

- Organisation ID = existing school ID
- name/status are copied from the school source
- existing schoolCode is retained as legacySchoolCode

### OrganisationMembership

- generated only from verified schoolUsers membership
- schoolAdmin remains organisation-scoped
- primary membership follows primarySchoolId

## Local execution sequence

First build the already-reviewed identity planner and run the permanent backfill tests:

~~~bash
npm --prefix functions run build
node --test scripts/test/wave1-identity-backfill.node-test.mjs
~~~

### 1. Fresh production dry run — zero writes

~~~bash
node scripts/wave1-identity-foundation-backfill.mjs \
  --dry-run \
  --project tinysteps-react-v1
~~~

Required before any write:

~~~text
blocking issues = 0
target conflicts = 0
unexpected target documents = 0
ready for bounded write = true
writes performed = 0
~~~

### 2. Canary — 20 source records

Only after reviewing the dry-run output:

~~~bash
node scripts/wave1-identity-foundation-backfill.mjs \
  --write \
  --project tinysteps-react-v1 \
  --confirm-project tinysteps-react-v1 \
  --limit 20
~~~

The canary must finish with:

~~~text
post-write selected mismatches = 0
~~~

### 3. Continue the backfill

The checkpoint resumes automatically.

~~~bash
node scripts/wave1-identity-foundation-backfill.mjs \
  --write \
  --project tinysteps-react-v1 \
  --confirm-project tinysteps-react-v1 \
  --limit 250
~~~

Repeat the same command until:

~~~text
Checkpoint complete: true
~~~

With the current source population, only a small number of bounded runs should be required.

### 4. Final reconciliation — zero writes

~~~bash
node scripts/wave1-identity-foundation-backfill.mjs \
  --reconcile \
  --project tinysteps-react-v1
~~~

The exit signal is:

~~~text
RECONCILED: true
missing = 0
drifted = 0
conflicts = 0
unexpected = 0
blocking source/planning issues = 0
~~~

## Authority after BACKFILL

Even after successful reconciliation:

~~~text
users / kids / schools / schoolUsers
= still the production write/read authority

canonical identity collections
= shadow canonical state
~~~

BACKFILL completion does **not** authorize SWITCH READS.

## Rollback

No destructive rollback is used.

If a run fails:

1. stop;
2. do not delete already-created canonical documents;
3. inspect the local report/checkpoint;
4. correct the source/tooling issue;
5. rerun the idempotent executor;
6. reconcile forward.

## Retirement

The executor and migration-specific report-shape tests remain until identity cutover is completed and observed. The deterministic ID strategy and canonical identity contracts remain permanent platform assets.


## Production execution result

Production execution completed successfully on 2026-10-04 using the local Mac bounded executor.

### Write runs

| Run | Source records | Canonical docs created | Write batches | Post-write mismatches |
|---|---:|---:|---:|---:|
| Canary | 20 | 59 | 1 | 0 |
| Bounded run 2 | 250 | 750 | 8 | 0 |
| Bounded run 3 | 149 | 444 | 5 | 0 |
| **Total** | **419** | **1,253** | **14** | **0** |

No canonical document required an update during initial backfill.

The final checkpoint completed successfully.

### Final reconciliation

Read-only reconciliation result:

~~~text
Expected canonical documents: 1,253
Matched:                     1,253
Missing:                         0
Drifted:                         0
Conflicts:                       0
Unexpected:                      0
Blocking source/planning issues: 0
Writes performed:                0
RECONCILED:                   true
~~~

Therefore the BACKFILL phase is complete.

Current authority remains unchanged:

~~~text
legacy identity collections
= current production read/write authority

canonical identity collections
= fully populated shadow canonical state
~~~

This completion does not authorize SWITCH READS, STOP LEGACY WRITES, deletion, Firebase UID replacement, Household inference, or any unrelated domain migration.

The next lifecycle phase is VERIFY / read-switch readiness review.
