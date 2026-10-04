# Wave 1 R5C1 — School-Domain Backend Authorization Cutover

**Status:** R5C2C1 COMPLETE IN PRODUCTION — ready for next bounded Admin mutation slice  
**Lifecycle phase:** R5 backend authorization cutover  
**Production Admin callable authority:** legacy `users/{uid}` until R5C2  
**Production school requester authority before deployment:** legacy `users/schoolUsers`  
**Production Firestore Rules authority:** legacy `users/schoolUsers` until R5D  
**Legacy write freeze:** no  
**Destructive retirement:** no

## Why R5C is split

R5B independently reconciled all 227 Firebase-backed canonical access projections.

A direct change to the shared `helpers/adminGuard.ts` would fan out to approximately 124
Cloud Functions in one deployment. That is unnecessary for the first production cutover and
creates a larger rollback surface than the brick strategy allows.

R5C is therefore split:

~~~text
R5C1  school-domain requester authorization
R5C2  shared Admin callable authorization
R5D   Firestore Security Rules
~~~

## R5C1 scope

### Canonical authorization reader

~~~text
functions/src/schoolOS/identity/authAccessAuthorization.ts
~~~

The helper point-reads:

~~~text
authAccessReadModels/{request.auth.uid}
~~~

and fails closed unless the record has:

- schemaVersion = 1;
- authority = canonical-derived;
- firebaseUid equal to the document key;
- a valid Person ID and source AuthIdentity ID;
- valid Person/AuthIdentity lifecycle states;
- an `accessActive` value consistent with those lifecycle states;
- only allowed global roles;
- no duplicate global roles;
- valid school organisation IDs;
- no duplicate school scopes.

Inactive lifecycle records may parse for diagnostics, but role/scope authorization predicates
always deny them.

### School requester authorization

~~~text
functions/src/helpers/schoolAuthorization.ts
~~~

R5C1 removes requester authorization reads from:

~~~text
users/{uid}
schoolUsers/{uid}
~~~

and uses the reconciled canonical-derived access model instead.

Tiny Steps Admin:

~~~text
accessActive == true
AND globalRoles contains admin
~~~

Learning Partner:

~~~text
accessActive == true
AND globalRoles contains learningPartner
AND schools/{schoolId}.learningPartnerId == request.auth.uid
~~~

The final UID equality intentionally preserves the existing operational UID boundary.

School Admin reader:

~~~text
accessActive == true
AND schoolId in schoolAdminOrganisationIds
AND school is not archived
~~~

### School evidence actor names

The school authorization result carries canonical `personId`.

Review and assessment display names now use:

~~~text
people/{personId}.displayName
~~~

instead of depending on a legacy user profile returned by the authorization helper.

That Person read is presentation/audit metadata only; it does not participate in the
authorization decision.

## Explicitly deferred to R5C2

The shared callable Admin guard remains unchanged in R5C1:

~~~text
functions/src/helpers/adminGuard.ts
~~~

This means general Admin-only callables continue using the existing legacy compatibility
authority until the separately validated/deployed R5C2 brick.

This is deliberate sequencing, not a fallback inside the R5C1 school authorization path.

## Read-cost boundary

Ordinary school authorization:

~~~text
authAccessReadModels/{uid}: 1 point read
schools/{schoolId}:         1 point read
~~~

School evidence writes add one canonical Person point read when a human-readable actor name
is required.

No `users` or `schoolUsers` read is performed by the R5C1 school authorization helper.

## Operational UID boundary

R5C1 does not change operational IDs used by:

- school Learning Partner assignment;
- teacher earnings;
- availability;
- blocked slots;
- sessions;
- attendance;
- finance;
- existing operational references.

## Non-goals

R5C1 does not:

- switch the shared Admin guard;
- change Firestore Rules;
- change Storage Rules;
- cut over target-user business/profile reads;
- cut over pre-auth username/phone resolution;
- delete `users` or `schoolUsers`;
- freeze compatibility writes;
- move role-root subcollections;
- change Firebase Auth UIDs;
- authorize destructive retirement.

## Acceptance gates

Before merge:

1. Functions TypeScript build passes.
2. Canonical authorization-reader tests pass.
3. Routing tests prove school authorization reads no `users` or `schoolUsers`.
4. Learning Partner operational UID equality remains intact.
5. School evidence uses canonical Person displayName.
6. Existing R5A/R5B tests remain green.
7. Existing authorization/teacher earning regressions remain green.
8. Deployment impact is bounded to the required school-domain Functions.
9. No Firestore Rules or index deployment is introduced.

## Production gate

After merge:

1. deploy only impacted Functions;
2. verify every impacted Function is ready;
3. smoke-check school Admin / Learning Partner / School Admin authorization paths;
4. keep the shared Admin guard and Firestore Rules unchanged.

After clean R5C1 production verification, proceed to **R5C2 shared Admin authorization
cutover**, using a separately bounded rollout plan.


## Acceptance validation

Acceptance workflow:

~~~text
Run ID: 37215814782
Result: success
~~~

Validated gates:

- Functions TypeScript build: passed.
- Focused Functions identity/access tests: **48/48 passed** across 7 files.
- Architecture/authorization regressions: **22/22 passed** across 3 files.
- Total focused regression coverage: **70/70 passed** across 10 files.
- Teacher earning adjustment routing: 7/7 passed.
- Teacher pay withholding routing: 7/7 passed.
- Deployment impact analysis: passed.

Validated deployment impact:

~~~text
Functions deployment required: true
Functions full deployment: false
Functions impacted: 13
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
AVS callable transport verification required: false
~~~

Bounded Function targets:

~~~text
schoolCreateAcademicYear
schoolCreateReview
schoolGetProgrammeSnapshot
schoolRecordAssessmentSummary
schoolSetCurrentAcademicYear
schoolSetGradeStatus
schoolSetSectionStatus
schoolSetTeacherStatus
schoolUpdateCurriculumProgress
schoolUpdateTeacherTraining
schoolUpsertGrade
schoolUpsertSection
schoolUpsertTeacher
~~~

The earlier broad-cutover experiment was not accepted for deployment because changing the
shared Admin guard would fan out to approximately 124 Functions. R5C1 deliberately leaves
that guard unchanged and limits production impact to the 13 school-domain Functions above.

The temporary validation workflow is retired before merge.


## Production rollout stage 1

PR #609 merged the first bounded R5C1 school-domain cutover.

~~~text
Merge commit: 7899fe6e5e34cc9af099855e7054a9f4bc6d222c
Deploy workflow: 37216030978
Deploy run number: 3881
Result: success
~~~

Deployment facts:

- Functions planned: 13;
- Functions deployed: 13;
- Functions verified checkpoint-ready: 13/13;
- deployment batches: 2;
- full Functions deployment: no;
- School callable transport verification: passed;
- Functions production marker advanced to the merge commit;
- Hosting deployment: skipped;
- Firestore Rules deployment: skipped;
- Firestore indexes deployment: skipped.

## School-management requester-guard hardening

Post-deployment boundary inspection found that `functions/src/schools.ts` owns a separate
local `ensureCurrentActiveAdmin` guard for five school-management callables.

That guard was not imported from `helpers/schoolAuthorization.ts`, so it was outside the
initial 13-Function dependency graph.

R5C1 therefore adds a second, still-bounded cutover for:

~~~text
adminAssignSchoolLearningPartner
adminCreateSchool
adminLinkSchoolUser
adminUnlinkSchoolUser
adminUpdateSchool
~~~

The local requester guard now authorizes from:

~~~text
authAccessReadModels/{request.auth.uid}
~~~

and does not call the shared legacy `helpers/adminGuard.ts`.

Legacy `users/{targetUid}` reads remain in these workflows only where the administrator is
validating the target Learning Partner or target School Admin being assigned. Those are
target-user business/profile compatibility reads, not requester authorization, and remain a
separate reader-migration scope.

### Hardening validation

~~~text
Workflow run: 37216635790
Result: success
~~~

Validated:

- Functions TypeScript build: passed;
- R5C authorization tests: **22/22 passed** across 3 files;
- architecture/authorization/teacher earning regressions: **22/22 passed** across 3 files;
- total focused tests: **44/44 passed**;
- Functions impacted: **5**;
- full Functions deployment: false;
- Hosting changed: false;
- Firestore Rules changed: false;
- Firestore indexes changed: false.

The temporary hardening validation workflow is retired before merge.

### Production rollout stage 2

PR #610 deployed the five school-management requester guards.

~~~text
Merge commit: 2f65d1596504e067c289a60ba191ed190abfb629
Deploy workflow: 37216816454
Deploy run number: 3882
Result: success
~~~

Verified:

- Functions planned: 5;
- Functions deployed: 5;
- Functions ready: 5/5;
- full Functions deployment: no;
- school callable transport verification: passed;
- Hosting changed: no;
- Firestore Rules changed: no;
- Firestore indexes changed: no;
- recovery job required: no.

R5C1 is therefore production-complete.

## R5C2 bounded Admin rollout

Changing the shared `helpers/adminGuard.ts` directly would still fan out to approximately
124 Functions. R5C2 therefore migrates callers in bounded slices through:

~~~text
functions/src/helpers/canonicalAdminGuard.ts
~~~

The staged guard authorizes exclusively from:

~~~text
authAccessReadModels/{request.auth.uid}
~~~

It has no `users/{uid}` fallback and does not accept Firebase custom claims as business
authority.

### R5C2A — low-risk read/audit slice

The first slice contains only five report/audit callables:

~~~text
auditTeacherEarningsCanonicalCoverage
getAdminTeacherEarningAdjustments
getAdminTeacherPayWithholdings
auditTeacherTodaySessions
traceStudentTransferHistory
~~~

This slice intentionally excludes user/account mutation, attendance mutation, finance
mutation, scheduling mutation, enrollment mutation, and lifecycle mutation.

The shared legacy Admin guard remains untouched for all other callables until their own
bounded migration slice is validated and deployed.


## R5C2A production closeout

PR #611 merged the first bounded general-Admin authorization slice.

~~~text
Merge commit: fe0b17c5c82d301e062a3d17f1371815e911b8ba
Deploy workflow: 37218362402
Deploy run number: 3883
Result: success
~~~

Production deployment facts:

- Functions planned: 5;
- Functions deployed: 5;
- Functions checkpoint-ready: 5/5;
- deployment batches: 1;
- full Functions deployment: no;
- Functions production marker advanced: yes;
- Hosting deployment: skipped;
- Firestore Rules deployment: skipped;
- Firestore indexes deployment: skipped;
- recovery job required: no.

Deployed Functions:

~~~text
auditTeacherEarningsCanonicalCoverage
auditTeacherTodaySessions
getAdminTeacherEarningAdjustments
getAdminTeacherPayWithholdings
traceStudentTransferHistory
~~~

R5C2A is production-complete.

The shared legacy `helpers/adminGuard.ts` remains unchanged for all not-yet-migrated
callables. The next authorized stage is another bounded Admin slice, not a fleet-wide shared
guard replacement.


## R5C2B — diagnostic Admin endpoints

The second general-Admin slice stays non-mutating.

Functions:

~~~text
getAdminHistoricalAttendanceCandidates
auditAllTransferredSessionSnapshotIssues
~~~

Requester authorization for all three is:

~~~text
authAccessReadModels/{request.auth.uid}
→ ensureCanonicalAdmin
~~~

with no fallback to the legacy `users/{uid}` Admin record or Firebase custom claims.

Target-entity compatibility/profile reads remain allowed where the diagnostic itself needs
historical teacher or parent data. Those target reads are not requester authorization
authority.

The initially considered `auditParentPaymentBackfillDryRun` endpoint is intentionally
deferred. Its module is imported by the mutating
`applyParentPaymentBackfillForSafeParents` Function, so changing that module would force the
write-mode Function into the deployment set. R5C2B refuses that coupling and keeps the
payment pair for a dedicated finance authorization slice.

This slice intentionally excludes:

- finance report persistence;
- attendance validation writes;
- snapshot/cache refresh writes;
- user/account mutation;
- enrollment or schedule repair;
- lifecycle mutation.


### R5C2B acceptance

Final validation workflow:

~~~text
Run: 37218961723
Head: 37638a66bb5563326621094b96a13743d605ea7b
Result: success
~~~

Validated:

- Functions authorization/diagnostic tests: 18/18;
- historical attendance routing regression: 4/4;
- deployment-impact classifier: 27/27;
- impacted Functions: exactly 2;
- full Functions deployment: no;
- Hosting changed: no;
- Firestore Rules changed: no;
- Firestore indexes changed: no.

The two intended production targets are:

~~~text
auditAllTransferredSessionSnapshotIssues
getAdminHistoricalAttendanceCandidates
~~~

The parent-payment dry-run remains deferred because changing its shared module would also
redeploy the mutating `applyParentPaymentBackfillForSafeParents` Function.


## R5C2B production closeout

PR #613 merged the second bounded general-Admin authorization slice.

~~~text
Merge commit: 2597656e677de8ac99f7b5c428799a21c587c9f7
Deploy workflow: 37220092324
Deploy run number: 3885
Result: success
~~~

Production deployment facts:

- Functions planned: 2;
- Functions deployed: 2;
- Functions checkpoint-ready: 2/2;
- deployment batches: 1;
- full Functions deployment: no;
- Functions production marker advanced: yes;
- Hosting deployment: skipped;
- Firestore Rules deployment: skipped;
- Firestore indexes deployment: skipped;
- recovery job required: no.

Deployed Functions:

~~~text
auditAllTransferredSessionSnapshotIssues
getAdminHistoricalAttendanceCandidates
~~~

R5C2B is production-complete.

The parent-payment dry-run/write pair remains deferred to a dedicated finance authorization
slice because they share one implementation dependency boundary.

The shared legacy `helpers/adminGuard.ts` still remains in place for callables that have
not yet moved through a bounded canonical-authorization slice.


## R5C2C1 — learner profile mutations

R5C2C begins with the smallest independently deployable mutation slice:

~~~text
adminCreateStudent
adminUpdateStudent
~~~

Both callables already use canonical-primary learner writers. This slice changes only requester
Admin authorization from the legacy shared guard to:

~~~text
authAccessReadModels/{request.auth.uid}
→ ensureCanonicalAdmin
~~~

The shared `helpers/adminGuard.ts` remains unchanged. Enrollment lifecycle, archive, scheduling,
attendance, finance, and account mutation callables remain outside this slice.

### R5C2C1 local acceptance

Validation was run locally on branch head:

~~~text
f076af1a9c52b601ab6aacbdb05d338b27d5b0c1
~~~

Results:

- Functions TypeScript build: passed.
- Full Functions unit estate: **135 files passed, 2 skipped; 1114 tests passed, 25 skipped**.
- R5C2C1 learner-mutation routing: **3/3 passed**.
- Wave 1 authorization hardening: **8/8 passed**.
- Deployment-impact/deployment contract tests: **81/81 passed**.
- Functions impacted: **exactly 2**.
- Full Functions deployment: no.
- Hosting changed: no.
- Firestore Rules changed: no.
- Firestore indexes changed: no.
- AVS callable transport verification required: no.

The affected preflight's repository-wide Functions lint step is blocked by a pre-existing
`@typescript-eslint/no-unused-vars` issue in `functions/src/adminCreateUserCanonical.ts`.
That file is unchanged by R5C2C1 and contains the same issue on base
`00912936e632c4d4b9bd9c3140c305539b3ac48f`. It is intentionally not repaired in this PR,
because doing so would enlarge the production Function deployment boundary.

Validated production targets:

~~~text
adminCreateStudent
adminUpdateStudent
~~~

R5C2C1 is therefore acceptance-complete.

### R5C2C1 production closeout

PR #615 merged the first bounded Admin mutation slice.

~~~text
Merge commit: 793fdde9797f231faf2c26ee8054196fb3881d80
Deploy workflow: 37222376388
Deploy run number: 3887
Result: success
~~~

Production deployment facts:

- Functions planned: 2;
- Functions deployed: 2;
- Functions checkpoint-ready: 2/2;
- deployment batches: 1;
- full Functions deployment: no;
- Functions production marker advanced to the merge commit;
- Hosting deployment: skipped;
- Firestore Rules deployment: skipped;
- Firestore indexes deployment: skipped;
- School/AVS/lead transport verification: not required;
- recovery job required: no.

Deployed Functions:

~~~text
adminCreateStudent
adminUpdateStudent
~~~

R5C2C1 is production-complete.

The shared legacy `helpers/adminGuard.ts` remains unchanged for not-yet-migrated callables.
The next stage must remain another bounded mutation slice; enrollment lifecycle, scheduling,
attendance and finance should continue to be isolated rather than moved together.
