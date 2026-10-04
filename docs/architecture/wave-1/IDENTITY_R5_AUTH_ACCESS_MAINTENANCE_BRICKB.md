# Wave 1 R5B — Auth Access Read Model Backfill and Live Maintenance

**Status:** COMPLETE — production backfill and independent reconciliation clean  
**Lifecycle phase:** R5 reader / Firestore Rules cutover preparation  
**Production reader authority after this brick:** legacy compatibility  
**Production Rules authority after this brick:** legacy `users` / `schoolUsers`  
**Auth access read model:** populated + maintained, but not authoritative  
**Legacy write freeze:** no  
**Destructive retirement:** no

## Purpose

R5A established the UID-keyed canonical-derived authorization projection:

~~~text
authAccessReadModels/{firebaseUid}
~~~

R5B makes that projection production-current before any reader or Security Rules authority
is switched.

R5B has two responsibilities:

1. populate every current Firebase auth-backed canonical identity;
2. keep the derived document current whenever authorization-relevant canonical identity
   changes.

## Authority remains unchanged

R5B does **not** authorize requests from `authAccessReadModels`.

Current backend and Firestore Rules behavior remains unchanged while the new projection is
built and observed.

Canonical truth remains:

~~~text
people
authIdentities
roleAssignments
organisationMemberships
~~~

The UID-keyed document remains a derived authorization/read model only.

## Live maintenance strategy

R5B intentionally avoids broad Firestore triggers on:

~~~text
people
authIdentities
roleAssignments
organisationMemberships
~~~

A normal identity transaction modifies several of those documents. One trigger per canonical
collection would multiply reads and produce redundant refreshes.

Instead, maintenance is attached to the bounded orchestration points that already know an
authorization-relevant identity transaction has completed.

### Canonical-primary auth writers

One best-effort refresh runs after a successful canonical transaction for:

~~~text
adminCreateUser
adminUpdateUser
adminSetUserRole
adminArchiveUser
~~~

Teacher self-profile writes do **not** refresh the access model because contact, bank,
emergency and teaching-profile edits do not change authorization.

### Best-effort callable semantics

The canonical identity transaction remains the business commit boundary.

If access-model refresh fails after commit:

- the callable does not roll back a valid Person/AuthIdentity/RoleAssignment mutation;
- the user operation does not falsely report failure;
- a privacy-tokenized warning is emitted;
- the bounded reconciliation process can repair the projection.

This is safe because R5B does not yet make the read model authoritative.

### Legacy user synchronization

A genuine legacy `users/{uid}` identity change still projects into canonical identity
through the existing compatibility trigger.

After a successful non-blocked sync, R5B strictly refreshes:

~~~text
authAccessReadModels/{uid}
~~~

If the legacy user is deleted and its canonical projection is removed, R5B deletes the
corresponding derived access document so stale authorization state cannot survive.

Background maintenance failures remain retryable through the existing trigger retry policy.

Canonical-primary compatibility writes that are corroborated and suppressed by the
legacy-sync loop guard do not cause a second refresh; their originating canonical callable
already performed the single maintenance refresh.

### School-admin synchronization

Legacy `schoolUsers` remains the compatibility source for current school-admin membership
until its later cutover.

After successful schoolUsers synchronization R5B:

1. re-reads the current schoolUsers source after canonical synchronization;
2. considers both previous and current Person references;
3. resolves each Person to Firebase UID via canonical AuthIdentity;
4. strictly refreshes the UID-keyed access model.

This correctly removes or adds organisation IDs when membership changes or is deleted.

## Read-cost boundary

There is no periodic trigger fan-out.

An authorization-relevant canonical auth-user mutation performs one read-model refresh,
which consists of bounded canonical reads:

~~~text
AuthIdentity:                 1 point read
Person:                       1 point read
RoleAssignments:             bounded query <= 50
OrganisationMemberships:     bounded query <= 50
Read-model write:             1 document
~~~

No legacy `users` read is introduced by the refresh itself.

## Backfill executor

~~~text
scripts/wave1-auth-access-read-model-backfill.mjs
scripts/migrations/wave1-auth-access-read-model-backfill-lib.mjs
scripts/test/wave1-auth-access-read-model-backfill.node-test.mjs
~~~

The executor loads the same compiled R5A implementation used by Functions, rather than
duplicating authorization semantics.

### Modes

~~~text
--mode dry-run
--mode write
--mode reconcile
~~~

### Bounds

Defaults:

~~~text
maximum Firebase AuthIdentity source records: 250
maximum bounded write selection:             250
privacy-safe sample size:                    20
~~~

The executor fails if source/read-model inventory exceeds the configured bound.

### Dry-run

Dry-run:

- queries only Firebase-provider AuthIdentity records;
- derives expected state from canonical identity collections;
- reads the current access-model collection;
- classifies create/update/unchanged/conflict/unexpected;
- performs zero writes.

### Write

Write mode refuses to proceed if:

- canonical planning fails;
- a current read-model document has foreign authority;
- a UID field contradicts its document key;
- an unexpected access-model document exists.

A bounded subset may be selected with:

~~~text
--write-limit 20
~~~

Each selected UID is refreshed through the production R5A implementation, causing a fresh
canonical read immediately before its one-document write.

### Reconcile

Reconcile independently re-derives all expected records and succeeds only when:

~~~text
missing/create = 0
update         = 0
conflict       = 0
unexpected     = 0
planning error = 0
~~~

## Privacy

Backfill reports contain no raw:

- Firebase UID;
- Person ID;
- email address;
- name;
- phone number.

Diagnostic samples contain 12-character SHA-256 tokens only.

## Production rollout sequence

After merge and bounded Functions deployment:

1. run production dry-run;
2. require zero planning/conflict/unexpected blockers;
3. run a small canary write;
4. verify canary writes independently;
5. run the remaining bounded write;
6. run independent full reconciliation;
7. record production counts and evidence in the Wave 1 manifest.

R5C is blocked until reconciliation is clean.

## Non-goals

R5B does not:

- change `ensureAdmin`;
- switch any backend reader to the new access model;
- change Firestore Rules;
- change Storage Rules;
- change teacher operational UID references;
- move earnings/availability/blocked-slot subcollections;
- freeze compatibility writes;
- delete legacy identity roots.

## Next

After clean production backfill + maintenance evidence:

**R5C — backend identity/authorization reader cutover to canonical-derived access state.**

Firestore Rules remain a later R5D brick.


## Acceptance validation

Acceptance head:

~~~text
304cd79e5b7bb215e55407afeee050f3795b5090
~~~

Acceptance workflow:

~~~text
Run ID: 37211505883
Result: success
~~~

Validated gates:

- Functions TypeScript build: passed.
- Focused Functions identity tests: **75/75 passed** across 9 files.
- Authorization/routing regressions: **16/16 passed** across 2 files.
- Backfill planner tests: **7/7 passed**.
- Total focused tests: **98/98 passed**.
- Backfill CLI load/help verification: passed.
- Deployment impact analysis: passed.
- Temporary validation workflow is retired before merge.

## Validated deployment impact

~~~text
Functions deployment required: true
Functions full deployment: false
Functions impacted: 13
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

Bounded Function targets:

~~~text
adminArchiveUser
adminCreateUser
adminSetUserRole
adminUpdateUser
assignLPToParent
assignLPToTeacher
backfillTeacherDocs
onWave1LegacyKidIdentityWrite
onWave1LegacySchoolIdentityWrite
onWave1LegacySchoolUserIdentityWrite
onWave1LegacyUserIdentityWrite
unassignLPFromParent
unassignLPFromTeacher
~~~

The LP assignment/backfill and non-user identity triggers appear because they share source
modules with the changed canonical user/legacy-sync code. Their business behavior is not
changed by R5B.

No Hosting, Rules, or index deployment is required.

## Production evidence gate

R5B remains incomplete until:

1. merge reaches main;
2. all 13 bounded Functions deploy successfully;
3. production dry-run reports zero planning/conflict/unexpected blockers;
4. a bounded canary write succeeds;
5. the remaining bounded backfill succeeds;
6. independent full reconciliation reports zero pending/mismatch/unexpected records.

Only then may R5C begin.


## Production deployment and backfill evidence

### Deployment

R5B merged as PR #606.

~~~text
Merge commit: baaaf13e64c8a60a0ac42227a6615484ad6dc2fa
Deploy workflow: 37211747231
Deploy run number: 3878
Result: success
~~~

Deployment facts:

- bounded Functions deployment: 13;
- verified ready: 13/13;
- full Functions deployment: no;
- recovery job: skipped;
- Hosting: unchanged;
- Firestore Rules: unchanged;
- Firestore indexes: unchanged.

Production reader authority and Rules authority therefore remain legacy compatibility while
the read-model population gate is completed.

### Production dry-run

Read-only production dry-run:

~~~text
Workflow run: 37212571831
Result: dry_run_ready
~~~

Inventory:

~~~text
Firebase AuthIdentity sources: 227
Canonical expected read models: 227
Existing read models: 0
Create: 227
Update: 0
Unchanged: 0
Conflict: 0
Unexpected: 0
Planning issues: 0
Blocking issues: 0
Writes performed: 0
~~~

This proves canonical planning is clean and the population is within the 250-record bound.

### Canary write attempt 1 — CLI runtime boundary

~~~text
Workflow run: 37212938314
Attempted writes: 20
Succeeded: 0
Failed: 20
Production documents created: 0
~~~

Cause:

The CLI loaded the compiled Functions identity module from `functions/node_modules` while
using the root `firebase-admin` Firestore client. A `FieldValue.serverTimestamp()`
sentinel created by the Functions package instance cannot be serialized by the root
Firestore package instance.

The executor was corrected so canonical semantics are still loaded from the compiled R5A
implementation, while the CLI creates the timestamp sentinel from the same root
`firebase-admin` runtime that owns its Firestore client.

This was an executor/runtime boundary only. It does not affect deployed Functions, where the
Firestore client and FieldValue share one package/runtime.

### Canary write attempt 2 — CI IAM boundary

~~~text
Workflow run: 37213537477
Attempted writes: 20
Succeeded: 0
Failed: 20
Production documents created: 0
Error: PERMISSION_DENIED
~~~

The audited GitHub deploy principal intentionally has:

~~~text
roles/datastore.viewer
~~~

and not general Firestore document-write authority.

The migration will **not** broaden CI IAM merely to complete a one-time bounded backfill.

### Approved operator execution path

The corrected executor and a gated operator runner are:

~~~text
scripts/wave1-auth-access-read-model-backfill.mjs
scripts/run-r5b-production-auth-access-backfill.sh
~~~

The runner performs, in order:

1. production dry-run;
2. strict dry-run gate;
3. maximum 20-record canary write;
4. strict canary-write gate;
5. independent read-only canary verification;
6. remaining bounded write;
7. strict post-write gate;
8. independent full reconciliation.

It stops immediately on any planning issue, conflict, unexpected document, failed write or
reconciliation mismatch.

Tooling validation:

~~~text
Workflow run: 37214162302
Result: success
~~~

Validated:

- Functions build;
- runner shell syntax;
- backfill planner tests;
- backfill CLI load/help.

R5C remains blocked until the operator-run reports:

~~~text
create = 0
update = 0
conflict = 0
unexpected = 0
planningIssueCount = 0
pendingWrites = 0
result = reconciled
~~~


## Production backfill closeout

Operator execution completed successfully on 4 October 2026.

~~~text
Report directory:
reports/r5b-production-20261004T155059Z
~~~

### Canary

~~~text
Expected: 227
Attempted: 20
Succeeded: 20
Failed: 0
After canary existing: 20
Remaining create: 207
Update: 0
Conflict: 0
Unexpected: 0
Blocking issues: 0
~~~

Independent read-only canary verification confirmed the 20 written records as unchanged and
reported no conflict, unexpected document, planning issue, or blocker.

### Remaining bounded backfill

~~~text
Attempted: 207
Succeeded: 207
Failed: 0
Expected after write: 227
Existing after write: 227
Unchanged: 227
Create: 0
Update: 0
Conflict: 0
Unexpected: 0
Pending writes: 0
Blocking issues: 0
Result: write_complete_reconciled
~~~

### Independent full reconciliation

~~~text
Report:
reports/r5b-production-20261004T155059Z/05-reconcile.json

Result: reconciled
Planning issues: 0
Expected: 227
Existing: 227
Unchanged: 227
Create: 0
Update: 0
Conflict: 0
Unexpected: 0
Pending writes: 0
Blocking issues: 0
Writes performed: 0
~~~

All R5B production gates are satisfied.

R5C backend authorization/reader cutover is now authorized.

Firestore Security Rules remain unchanged until the later R5D brick.
