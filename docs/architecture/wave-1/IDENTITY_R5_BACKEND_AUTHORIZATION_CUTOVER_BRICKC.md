# Wave 1 R5C1 — School-Domain Backend Authorization Cutover

**Status:** R5C2C13 COMPLETE IN PRODUCTION — ready for next bounded Admin mutation slice
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


## R5C2C2 — generic-user update and archive

The next mutation slice is limited to the two generic-user mutations whose export topology is
independently deployable:

~~~text
adminUpdateUser
adminArchiveUser
~~~

Both already use canonical-primary identity writers and maintain the canonical-derived
`authAccessReadModels` projection. This slice changes requester Admin authorization only:

~~~text
authAccessReadModels/{request.auth.uid}
→ ensureCanonicalAdmin
~~~

The shared `helpers/adminGuard.ts` remains unchanged.

The following apparently related mutations are intentionally deferred:

- `adminCreateUser`: its wrapper module also exports `backfillTeacherDocs`, so changing the
  canonical create implementation would make that additional Function deployment-reachable;
- `adminSetUserRole`: its wrapper module also exports four Learning Partner assignment
  callables, so changing the canonical role implementation would broaden the deployment set.

R5C2C2 therefore prefers exact deployment isolation over grouping all generic-user mutations
in one rollout.

### R5C2C2 acceptance target

Expected bounded production impact:

~~~text
adminUpdateUser
adminArchiveUser
~~~

Expected deployment properties:

- Functions impacted: exactly 2;
- full Functions deployment: false;
- Hosting changed: false;
- Firestore Rules changed: false;
- Firestore indexes changed: false;
- shared legacy Admin guard unchanged.

Acceptance completed locally on branch head:

~~~text
972abed69ce308157a2f691947cea2e68a1f418f
~~~

Validated:

- focused R5C2C2 lint: passed;
- Functions TypeScript build: passed;
- full Functions unit estate: **136 files passed, 2 skipped; 1117 tests passed, 25 skipped**;
- canonical auth-user activation + Wave 1 authorization regressions: **16/16 passed**;
- deployment-impact/deployment contract tests: **81/81 passed**;
- Functions impacted: **exactly 2**;
- full Functions deployment: no;
- Hosting changed: no;
- Firestore Rules changed: no;
- Firestore indexes changed: no;
- AVS callable transport verification required: no.

Validated production targets:

~~~text
adminArchiveUser
adminUpdateUser
~~~

R5C2C2 is acceptance-complete.

### R5C2C2 production closeout

PR #617 merged the second bounded Admin mutation slice.

~~~text
Merge commit: 626df1bc0b168883f4df9f607525a6161dc40f0b
Deploy workflow: 37223337451
Deploy run number: 3889
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
adminArchiveUser
adminUpdateUser
~~~

R5C2C2 is production-complete.

The shared legacy `helpers/adminGuard.ts` remains unchanged for not-yet-migrated callables.
`adminCreateUser` and `adminSetUserRole` remain deferred because their current wrapper
topology broadens deployment reachability.


## R5C2C3 — password-management mutations

R5C2C3 is limited to the two independently deployable Admin password-management callables:

~~~text
adminGenerateResetLink
adminResetPassword
~~~

This slice changes requester Admin authorization only:

~~~text
authAccessReadModels/{request.auth.uid}
→ ensureCanonicalAdmin
~~~

Existing password-management behavior remains unchanged:

- reset-link generation continues to use Firebase Auth password-reset links;
- reset-link requests continue to be written to `password_reset_requests`;
- direct Admin password reset continues to update Firebase Auth;
- password-reset audit/request records remain unchanged.

The shared `helpers/adminGuard.ts` remains unchanged.

The following account mutations are intentionally outside this slice:

- `adminDeleteUser`: destructive hard-delete semantics warrant an independent rollout;
- `adminCreateUser`: current wrapper topology also exports `backfillTeacherDocs`;
- `adminSetUserRole`: current wrapper topology also exports four Learning Partner assignment callables.

### R5C2C3 acceptance target

Expected bounded production impact:

~~~text
adminGenerateResetLink
adminResetPassword
~~~

Expected deployment properties:

- Functions impacted: exactly 2;
- full Functions deployment: false;
- Hosting changed: false;
- Firestore Rules changed: false;
- Firestore indexes changed: false;
- shared legacy Admin guard unchanged.

Acceptance completed locally on branch head:

~~~text
2a3a29ba60142054d75c904ff41639c275778ebf
~~~

Validated:

- focused R5C2C3 lint: passed;
- Functions TypeScript build: passed;
- full Functions unit estate: **137 files passed, 2 skipped; 1120 tests passed, 25 skipped**;
- canonical auth-user activation + Wave 1 authorization regressions: **16/16 passed**;
- deployment-impact/deployment contract tests: **81/81 passed**;
- Functions impacted: **exactly 2**;
- full Functions deployment: no;
- Hosting changed: no;
- Firestore Rules changed: no;
- Firestore indexes changed: no;
- AVS callable transport verification required: no.

Validated production targets:

~~~text
adminGenerateResetLink
adminResetPassword
~~~

R5C2C3 is acceptance-complete.

### R5C2C3 production closeout

PR #619 merged the password-management mutation slice.

~~~text
Merge commit: 7b1d66b513ed4fca5c997680bbd1c8cd9b883ffb
Deploy workflow: 37224473282
Deploy run number: 3891
Result: success
~~~

Production deployment facts:

- Functions planned: 2;
- Functions deployed: 2;
- bounded Cloud Functions deployment: success;
- full Functions deployment: no;
- Functions production marker advanced to the merge commit;
- Hosting deployment: skipped;
- Firestore Rules deployment: skipped;
- Firestore indexes deployment: skipped;
- School/AVS/lead transport verification: not required;
- recovery job required: no.

Deployed Functions:

~~~text
adminGenerateResetLink
adminResetPassword
~~~

R5C2C3 is production-complete.

The next bounded mutation slice is intentionally `adminDeleteUser` alone because hard-delete
semantics deserve an isolated production and rollback boundary.


## R5C2C4 — admin hard-delete

R5C2C4 deliberately contains a single destructive mutation:

~~~text
adminDeleteUser
~~~

Its requester Admin authorization moves from the legacy shared guard to:

~~~text
authAccessReadModels/{request.auth.uid}
→ ensureCanonicalAdmin
~~~

The destructive business behavior is otherwise unchanged.

Hard-delete protections retained by this slice:

- the requester cannot delete their own Admin account;
- parent accounts cannot be hard-deleted;
- learner/kid/student accounts cannot be hard-deleted;
- school Admin accounts cannot be hard-deleted;
- protected identities must use archive/lifecycle behavior instead.

Existing cleanup scope is also preserved:

- delete the Firebase Auth user;
- delete `users/{uid}`;
- delete the applicable role-mirror document;
- do **not** cascade-delete kids, sessions, invoices, enrollments, or unrelated domain records.

This slice is intentionally one Function so destructive authorization behavior has an isolated
production, observation, and rollback boundary.

Still deferred:

- `adminCreateUser`: coupled to `backfillTeacherDocs` through its wrapper module;
- `adminSetUserRole`: coupled to four Learning Partner assignment callables through its wrapper.

### R5C2C4 acceptance target

Expected bounded production impact:

~~~text
adminDeleteUser
~~~

Expected deployment properties:

- Functions impacted: exactly 1;
- full Functions deployment: false;
- Hosting changed: false;
- Firestore Rules changed: false;
- Firestore indexes changed: false;
- shared legacy Admin guard unchanged.

Acceptance completed locally on branch head:

~~~text
7c7a67094d9a73a3e5ca3347a59cae196479b875
~~~

Validated:

- focused R5C2C4 lint: passed;
- Functions TypeScript build: passed;
- full Functions unit estate: **138 files passed, 2 skipped; 1123 tests passed, 25 skipped**;
- canonical auth-user activation + Wave 1 authorization regressions: **16/16 passed**;
- deployment-impact/deployment contract tests: **81/81 passed**;
- Functions impacted: **exactly 1**;
- full Functions deployment: no;
- Hosting changed: no;
- Firestore Rules changed: no;
- Firestore indexes changed: no;
- AVS callable transport verification required: no.

Validated production target:

~~~text
adminDeleteUser
~~~

R5C2C4 is acceptance-complete.

### R5C2C4 production closeout

PR #621 merged the isolated hard-delete mutation slice.

~~~text
Merge commit: d67eed72e03538ac2021bb2aaf69e72ad25e715e
Deploy workflow: 37226742668
Deploy run number: 3893
Result: success
~~~

Production deployment facts:

- Functions planned: 1;
- Functions deployed: 1;
- Functions checkpoint-ready: 1/1;
- deployment batches: 1;
- full Functions deployment: no;
- Functions production marker advanced to the merge commit;
- Hosting deployment: skipped;
- Firestore Rules deployment: skipped;
- Firestore indexes deployment: skipped;
- School/AVS/lead transport verification: not required;
- recovery job required: no.

Deployed Function:

~~~text
adminDeleteUser
~~~

R5C2C4 is production-complete.

The next bounded Admin mutation slice should remain independently deployable.


## R5C2C5 — teacher profile Admin-on-behalf mutation

R5C2C5 moves one additional independently deployable mutation boundary:

~~~text
updateTeacherProfile
~~~

The callable serves two authorization modes:

1. a teacher editing their own profile;
2. an Admin editing another teacher's profile.

This brick changes only mode 2.

Admin-on-behalf authorization moves from:

~~~text
users/{request.auth.uid}
→ helpers/adminGuard.ts
~~~

to:

~~~text
authAccessReadModels/{request.auth.uid}
→ ensureCanonicalAdmin
~~~

There is no legacy Admin fallback and no Firebase custom-claim business-authority fallback.

Teacher self-service remains unchanged for this brick. The callable still verifies the
requesting teacher from the current compatibility user record before allowing a self-profile
mutation. That self-service reader is a separate R5 target-user/current-user reader-cutover
concern and is deliberately not bundled into this Admin authorization slice.

The mutation path remains canonical-primary:

~~~text
resolvePersonIdFromFirebaseUid
→ planCanonicalTeacherProfileUpdate
→ writeCanonicalTeacherProfileUpdatePlan
~~~

### R5C2C5 non-goals

This brick does not:

- change teacher self-service authorization;
- change teacher profile fields or validation;
- change canonical teacher-profile write semantics;
- change Firebase Auth UIDs;
- modify the shared legacy `helpers/adminGuard.ts`;
- modify Firestore Rules or Storage Rules;
- migrate `adminCreateUser` or `adminSetUserRole`;
- migrate finance, attendance, scheduling, enrollment or demo mutations;
- freeze legacy writes;
- authorize destructive identity retirement.

### R5C2C5 acceptance target

Expected deployment impact:

~~~text
Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  updateTeacherProfile
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

Acceptance requires:

1. Functions TypeScript build passes.
2. Full Functions unit estate passes.
3. R5C2C5 routing regression proves canonical Admin authorization and preserved teacher self-service.
4. Canonical teacher-profile writer regressions pass.
5. Deployment-impact/deployment-contract tests pass.
6. Deployment impact resolves to exactly `updateTeacherProfile`.
7. No full Functions deployment, Hosting deployment, Firestore Rules deployment or index deployment is introduced.

Production remains unauthorized until this acceptance gate is green and the temporary
validation workflow is retired.


### R5C2C5 validation evidence

Pull-request acceptance completed successfully before production merge.

~~~text
Workflow run: 37459908142
Run number: 3
Validated head: b5988662c4c429b0f71149885d9662061a97bca4
Result: success

Focused lint: passed
Functions build: passed
Full Functions unit estate: passed
Deployment classifier and contract tests: passed

Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  updateTeacherProfile
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

The temporary validation workflow is retired before merge. Production verification remains
required after the main-branch deployment before R5C2C5 can be marked complete in production.


### R5C2C5 production evidence

R5C2C5 completed production deployment successfully.

~~~text
Pull request: #627
Merge commit: 645aadf48c1d9f327663c920aab209c4f00904d2
Deploy workflow run: 37460377440
Deploy run number: 3900
Result: success

Functions deployment required: true
Functions full deployment: false
Impacted/deployed Functions: exactly 1
  updateTeacherProfile

Hosting deployed: false
Firestore Rules deployed: false
Firestore indexes deployed: false
Functions production baseline advanced: true
~~~

R5C2C5 is therefore complete in production. The next Wave 1 backend-authorization
step is the next independently deployable bounded Admin mutation slice (R5C2C6).


## R5C2C6 — message-thread maintenance mutation

R5C2C6 moves one independently deployable Admin-only maintenance mutation:

~~~text
syncMessageThreadsForActiveStudents
~~~

Authorization moves from:

~~~text
users/{request.auth.uid}
→ helpers/adminGuard.ts
~~~

to:

~~~text
authAccessReadModels/{request.auth.uid}
→ ensureCanonicalAdmin
~~~

There is no legacy Admin fallback and no Firebase custom-claim business-authority fallback.

The maintenance behavior is intentionally unchanged:

- active learner IDs are collected from the existing enrollment/kids/students sources;
- processing remains bounded in groups of 10;
- message-thread payload construction remains unchanged;
- writes remain idempotent upserts through the existing helper;
- error reporting remains capped at 20 items;
- the callable name, region, timeout and memory remain unchanged.

### R5C2C6 non-goals

This brick does not:

- change message-thread schema or participant resolution;
- change active-learner selection rules;
- change automatic message-thread triggers;
- change frontend Admin Dashboard behavior;
- modify the shared legacy `helpers/adminGuard.ts`;
- migrate `adminCreateUser` or `adminSetUserRole`;
- change Firestore Rules or Storage Rules;
- change finance, attendance, scheduling, enrollment or demo business mutations;
- freeze legacy writes;
- authorize destructive identity retirement.

### R5C2C6 acceptance target

Expected deployment impact:

~~~text
Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  syncMessageThreadsForActiveStudents
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

Acceptance requires:

1. Functions TypeScript build passes.
2. Full Functions unit estate passes.
3. R5C2C6 routing regression passes.
4. Deployment-impact/deployment-contract tests pass.
5. Deployment impact resolves to exactly `syncMessageThreadsForActiveStudents`.
6. No full Functions deployment, Hosting deployment, Firestore Rules deployment or index deployment is introduced.

Production remains unauthorized until this acceptance gate is green and the temporary
validation workflow is retired.


### R5C2C6 validation evidence

Pull-request acceptance completed successfully before production merge.

~~~text
Workflow run: 37461403190
Run number: 1
Validated head: 7b0c74449cc577901a8d5ead248cad8a51315f36
Result: success

Focused lint: passed
Functions build: passed
Full Functions unit estate: passed
Deployment classifier and contract tests: passed

Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  syncMessageThreadsForActiveStudents
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

The temporary validation workflow is retired before merge. Production verification remains
required after the main-branch deployment before R5C2C6 can be marked complete in production.


### R5C2C6 production evidence

R5C2C6 completed production deployment successfully.

~~~text
Pull request: #629
Merge commit: 38aefed3b9b6275841ab872248e1ba0f7bd49d16
Deploy workflow run: 37461876533
Deploy run number: 3902
Result: success

Functions deployment required: true
Functions full deployment: false
Impacted/deployed Functions: exactly 1
  syncMessageThreadsForActiveStudents

Hosting deployed: false
Firestore Rules deployed: false
Firestore indexes deployed: false
Functions production baseline advanced: true
~~~

R5C2C6 is therefore complete in production. The next Wave 1 backend-authorization
step is the next independently deployable bounded Admin mutation slice (R5C2C7).


## R5C2C7 — teacher-student snapshot repair mutation

R5C2C7 moves one independently deployable Admin-only repair mutation:

~~~text
adminRepairTeacherStudentSnapshots
~~~

Authorization moves from:

~~~text
users/{request.auth.uid}
→ helpers/adminGuard.ts
~~~

to:

~~~text
authAccessReadModels/{request.auth.uid}
→ ensureCanonicalAdmin
~~~

There is no legacy Admin fallback and no Firebase custom-claim business-authority fallback.

The repair behavior is intentionally unchanged:

- `apply !== true` remains a dry run;
- explicit enrollment targeting remains supported;
- page size remains bounded to 25–500 enrollments;
- write commits remain bounded by `MAX_BATCH = 400`;
- only missing/placeholder student snapshot names are repaired;
- only future session-like snapshots are eligible for session repair;
- run evidence continues to be written under `adminStats/teacherStudentSnapshotRepairRuns/runs`;
- callable name, region, memory and timeout remain unchanged.

### R5C2C7 non-goals

This brick does not:

- change snapshot repair eligibility;
- change learner/teacher identity semantics;
- change historical sessions;
- alter automatic transfer or scheduling behavior;
- modify the shared legacy `helpers/adminGuard.ts`;
- migrate `adminCreateUser` or `adminSetUserRole`;
- change Firestore Rules or Storage Rules;
- change finance, attendance, scheduling or demo authority;
- freeze legacy writes;
- authorize destructive identity retirement.

### R5C2C7 acceptance target

Expected deployment impact:

~~~text
Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  adminRepairTeacherStudentSnapshots
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

Acceptance requires:

1. Focused lint passes.
2. Functions TypeScript build passes.
3. Full Functions unit estate passes.
4. Existing snapshot-repair helper regressions pass.
5. R5C2C7 authorization-routing regression passes.
6. Deployment-impact/deployment-contract tests pass.
7. Deployment impact resolves to exactly `adminRepairTeacherStudentSnapshots`.
8. No full Functions deployment, Hosting deployment, Firestore Rules deployment or index deployment is introduced.

Production remains unauthorized until this acceptance gate is green and the temporary
validation workflow is retired.


### R5C2C7 validation evidence

Pull-request acceptance completed successfully before production merge.

~~~text
Workflow run: 37462966975
Run number: 1
Validated head: 40c24fe253a29a30b79d7338e6cdca56edad723b
Result: success

Focused lint: passed
Functions build: passed
Focused snapshot repair regressions: passed
Full Functions unit estate: passed
Deployment classifier and contract tests: passed

Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  adminRepairTeacherStudentSnapshots
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

The temporary validation workflow is retired before merge. Production verification remains
required after the main-branch deployment before R5C2C7 can be marked complete in production.


### R5C2C7 production evidence

R5C2C7 completed production deployment successfully.

~~~text
Pull request: #631
Merge commit: 1358a76193a454bdf89a737fad03a79ef09bb402
Deploy workflow run: 37463361554
Deploy run number: 3904
Result: success

Functions deployment required: true
Functions full deployment: false
Impacted/deployed Functions: exactly 1
  adminRepairTeacherStudentSnapshots

Hosting deployed: false
Firestore Rules deployed: false
Firestore indexes deployed: false
Functions production baseline advanced: true
~~~

R5C2C7 is therefore complete in production. The next Wave 1 backend-authorization
step is the next independently deployable bounded Admin mutation slice (R5C2C8).


## R5C2C8 — public KB refresh mutation

R5C2C8 moves one independently deployable Admin-only maintenance mutation:

~~~text
refreshPublicKb
~~~

Authorization moves from:

~~~text
users/{request.auth.uid}
→ helpers/adminGuard.ts
~~~

to:

~~~text
authAccessReadModels/{request.auth.uid}
→ ensureCanonicalAdmin
~~~

There is no legacy Admin fallback and no Firebase custom-claim business-authority fallback.

The KB refresh behavior is intentionally unchanged:

- the callable still reads the curated hosted `kb.json`;
- requested/default path selection remains unchanged;
- retired-path chunk deactivation remains unchanged;
- chunking/tokenization rules remain unchanged;
- Firestore writes remain bounded through existing 400-document paging/batches;
- active chunks remain idempotent merge writes keyed by deterministic URL/chunk IDs;
- callable name, region, memory and timeout remain unchanged.

### R5C2C8 non-goals

This brick does not:

- change AI retrieval ranking or answer behavior;
- change `kb.json` content or public-page content;
- change the KB schema or collection name;
- change the Admin UI for KB refresh;
- modify the shared legacy `helpers/adminGuard.ts`;
- migrate `adminCreateUser` or `adminSetUserRole`;
- change Firestore Rules or Storage Rules;
- change finance, attendance, scheduling, enrollment or demo authority;
- freeze legacy writes;
- authorize destructive identity retirement.

### R5C2C8 acceptance target

Expected deployment impact:

~~~text
Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  refreshPublicKb
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

Acceptance requires:

1. Focused lint passes.
2. Functions TypeScript build passes.
3. R5C2C8 authorization-routing regression passes.
4. Existing Wave 1 authorization-hardening regression passes.
5. Full Functions unit estate passes.
6. Deployment-impact/deployment-contract tests pass.
7. Deployment impact resolves to exactly `refreshPublicKb`.
8. No full Functions deployment, Hosting deployment, Firestore Rules deployment or index deployment is introduced.

Production remains unauthorized until this acceptance gate is green and the temporary
validation workflow is retired.


### R5C2C8 validation evidence

Pull-request acceptance completed successfully before production merge.

~~~text
Workflow run: 37485929917
Run number: 1
Validated head: d7da1c5d1a4a3ddb948d178cf9f2b8bcffd6657c
Result: success

Focused lint: passed
Functions build: passed
Focused R5C2C8 regressions: passed
Wave 1 authorization-hardening regression: passed
Full Functions unit estate: passed
Deployment classifier and contract tests: passed

Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  refreshPublicKb
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

The temporary validation workflow is retired before merge. Production verification remains
required after the main-branch deployment before R5C2C8 can be marked complete in production.


### R5C2C8 production evidence

R5C2C8 completed production deployment successfully.

~~~text
Pull request: #633
Merge commit: bc6104769e52559b3d24e3dd80fa603060908a72
Deploy workflow run: 37487049626
Deploy run number: 3906
Result: success

Functions deployment required: true
Functions full deployment: false
Impacted/deployed Functions: exactly 1
  refreshPublicKb

Hosting deployed: false
Firestore Rules deployed: false
Firestore indexes deployed: false
Functions production baseline advanced: true
~~~

R5C2C8 is therefore complete in production. The next Wave 1 backend-authorization
step is the next independently deployable bounded Admin mutation slice (R5C2C9).


## R5C2C9 — transferred-session snapshot repair mutation

R5C2C9 moves one independently deployable Admin-only repair mutation:

~~~text
repairTransferredTeacherSessionSnapshots
~~~

Authorization moves from:

~~~text
users/{request.auth.uid}
→ helpers/adminGuard.ts
~~~

to:

~~~text
authAccessReadModels/{request.auth.uid}
→ ensureCanonicalAdmin
~~~

There is no legacy Admin fallback and no Firebase custom-claim business-authority fallback.

The repair behavior is intentionally unchanged:

- `dryRun === true` remains non-writing;
- enrollment/kid targeting remains unchanged;
- teacher-transition matching remains unchanged;
- only sessions on/after the requested date are considered;
- teacher, learner, course and join-link snapshot repair semantics remain unchanged;
- write commits remain bounded by `MAX_BATCH = 400`;
- callable name and region remain unchanged.

### R5C2C9 non-goals

This brick does not:

- change transfer detection or transfer history;
- change enrollment scheduling or materialization;
- change canonical teacher-field construction;
- change learner identity or profile authority;
- modify the shared legacy `helpers/adminGuard.ts`;
- migrate `adminCreateUser` or `adminSetUserRole`;
- change Firestore Rules or Storage Rules;
- change finance, attendance or demo authority;
- freeze legacy writes;
- authorize destructive identity retirement.

### R5C2C9 acceptance target

Expected deployment impact:

~~~text
Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  repairTransferredTeacherSessionSnapshots
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

Acceptance requires:

1. Focused lint passes.
2. Functions TypeScript build passes.
3. R5C2C9 authorization-routing regression passes.
4. Full Functions unit estate passes.
5. Deployment-impact/deployment-contract tests pass.
6. Deployment impact resolves to exactly `repairTransferredTeacherSessionSnapshots`.
7. No full Functions deployment, Hosting deployment, Firestore Rules deployment or index deployment is introduced.

Production remains unauthorized until this acceptance gate is green and the temporary
validation workflow is retired.


### R5C2C9 validation evidence

Pull-request acceptance completed successfully before production merge.

~~~text
Workflow run: 37489788409
Run number: 1
Validated head: d08022eaa063d917b66b44117406f5f3da3fec3b
Result: success

Focused lint: passed
Functions build: passed
Focused R5C2C9 regression: passed
Full Functions unit estate: passed
Deployment classifier and contract tests: passed

Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  repairTransferredTeacherSessionSnapshots
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

The temporary validation workflow is retired before merge. Production verification remains
required after the main-branch deployment before R5C2C9 can be marked complete in production.


### R5C2C9 production evidence

R5C2C9 completed production deployment successfully.

~~~text
Pull request: #635
Merge commit: 81fad862562fd26c934118129ce951134b36ad95
Deploy workflow run: 37490374498
Deploy run number: 3908
Result: success

Functions deployment required: true
Functions full deployment: false
Impacted/deployed Functions: exactly 1
  repairTransferredTeacherSessionSnapshots

Hosting deployed: false
Firestore Rules deployed: false
Firestore indexes deployed: false
Functions production baseline advanced: true
~~~

R5C2C9 is therefore complete in production. The next Wave 1 backend-authorization
step is the next independently deployable bounded Admin mutation slice (R5C2C10).


## R5C2C10 — enrollment canonical backfill mutation

R5C2C10 moves one independently deployable Admin-only migration mutation:

~~~text
adminBackfillEnrollmentCanonicalFields
~~~

Authorization moves from:

~~~text
users/{request.auth.uid}
→ helpers/adminGuard.ts
~~~

to:

~~~text
authAccessReadModels/{request.auth.uid}
→ ensureCanonicalAdmin
~~~

There is no legacy Admin fallback and no Firebase custom-claim business-authority fallback.

The migration behavior is intentionally unchanged:

- `apply !== true` remains dry-run only;
- scan pages remain bounded to 25–1000 enrollment documents;
- pagination remains explicit through `startAfterId`;
- ambiguous mappings remain non-writing;
- write commits remain bounded to 400 documents;
- audit evidence remains under `adminStats/enrollmentCanonicalBackfillRuns/runs`;
- callable name, region, memory and timeout remain unchanged.

### R5C2C10 non-goals

This brick does not:

- change enrollment canonical-field mapping rules;
- change learner, parent or teacher authority;
- change enrollment creation or lifecycle behavior;
- change scheduling/materialization behavior;
- modify the shared legacy `helpers/adminGuard.ts`;
- migrate `adminCreateUser` or `adminSetUserRole`;
- change Firestore Rules or Storage Rules;
- change finance, attendance or demo authority;
- freeze legacy writes;
- authorize destructive identity retirement.

### R5C2C10 acceptance target

Expected deployment impact:

~~~text
Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  adminBackfillEnrollmentCanonicalFields
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

Acceptance requires:

1. Focused lint passes.
2. Functions TypeScript build passes.
3. R5C2C10 authorization-routing regression passes.
4. Full Functions unit estate passes.
5. Deployment-impact/deployment-contract tests pass.
6. Deployment impact resolves to exactly `adminBackfillEnrollmentCanonicalFields`.
7. No full Functions deployment, Hosting deployment, Firestore Rules deployment or index deployment is introduced.

Production remains unauthorized until this acceptance gate is green and the temporary
validation workflow is retired.


### R5C2C10 validation evidence

Pull-request acceptance completed successfully before production merge.

~~~text
Workflow run: 37491308537
Run number: 1
Validated head: 0614d5ab81ab08bd020bf14fcb99ec1b860628f2
Result: success

Focused lint: passed
Functions build: passed
Focused R5C2C10 regression: passed
Full Functions unit estate: passed
Deployment classifier and contract tests: passed

Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  adminBackfillEnrollmentCanonicalFields
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

The temporary validation workflow is retired before merge. Production verification remains
required after the main-branch deployment before R5C2C10 can be marked complete in production.


### R5C2C10 production evidence

R5C2C10 completed production deployment successfully.

~~~text
Pull request: #637
Merge commit: 537a8b9e80a57490806e77e19e8908adf88ac019
Deploy workflow run: 37491821994
Deploy run number: 3910
Result: success

Functions deployment required: true
Functions full deployment: false
Impacted/deployed Functions: exactly 1
  adminBackfillEnrollmentCanonicalFields

Hosting deployed: false
Firestore Rules deployed: false
Firestore indexes deployed: false
Functions production baseline advanced: true
~~~

R5C2C10 is therefore complete in production. The next Wave 1 backend-authorization
step is the next independently deployable bounded Admin mutation slice (R5C2C11).


### R5C2C11 prerequisite — AVS validator dependency isolation

The first R5C2C11 validation correctly failed its one-Function blast-radius gate because
`adminVerifyAttendanceValidationGroup` imported `exactAvsId` from
`cachedGroupRevalidationCallable.ts`. That made the cached-revalidation module a runtime
dependency of two deployed Functions.

The prerequisite isolates `exactAvsId` into
`attendanceValidation/avsId.ts` and moves only the manual-verification callable to that
helper. Cached revalidation authorization remains unchanged in the prerequisite.

Validation evidence:

~~~text
Workflow run: 37493943055
Result: success
Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  adminVerifyAttendanceValidationGroup
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

This prerequisite exists only to sever deployment coupling. R5C2C11 authorization must be
rebuilt from the updated production baseline and must independently resolve to exactly
`revalidateAttendanceValidationGroupCached`.


## R5C2C11 — cached attendance-validation group revalidation

R5C2C11 moves one independently deployable Admin-only AVS maintenance mutation:

~~~text
revalidateAttendanceValidationGroupCached
~~~

Authorization moves from:

~~~text
users/{request.auth.uid}
→ helpers/adminGuard.ts
~~~

to:

~~~text
authAccessReadModels/{request.auth.uid}
→ ensureCanonicalAdmin
~~~

There is no legacy Admin fallback and no Firebase custom-claim business-authority fallback.

A prerequisite deployment first removed the deployment-graph coupling from
`adminVerifyAttendanceValidationGroup` by moving its shared ID validator to
`attendanceValidation/avsId.ts`. That prerequisite was independently validated and
deployed as exactly one Function before this authorization cutover.

The AVS behavior is intentionally unchanged:

- one explicitly requested class-session/kid business group remains the unit of work;
- the callable uses cached AVS evidence only;
- the cached recheck continues to make zero Microsoft Graph logical calls;
- missing fresh Teams evidence still returns `fresh_teams_evidence_required`;
- join-link fallback behavior remains unchanged;
- only fully evaluable safe groups are persisted;
- callable name, region, memory, timeout and maxInstances remain unchanged.

### R5C2C11 non-goals

This brick does not:

- change AVS attendance decision rules;
- change Teams evidence collection or Graph authorization;
- change teacher identity rollout;
- change manual attendance verification;
- change attendance corrections or teacher-pay decisions;
- change scheduling, finance or enrollment authority;
- modify the shared legacy `helpers/adminGuard.ts`;
- change Firestore Rules or Storage Rules;
- freeze legacy writes;
- authorize destructive identity retirement.

### R5C2C11 acceptance target

Expected deployment impact:

~~~text
Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  revalidateAttendanceValidationGroupCached
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

Acceptance requires:

1. Focused lint passes.
2. Functions TypeScript build passes.
3. Existing cached-group revalidation regressions pass.
4. R5C2C11 authorization-routing regression passes.
5. Full Functions unit estate passes.
6. Deployment-impact/deployment-contract tests pass.
7. Deployment impact resolves to exactly `revalidateAttendanceValidationGroupCached`.
8. No full Functions deployment, Hosting deployment, Firestore Rules deployment or index deployment is introduced.

Production remains unauthorized until this acceptance gate is green and the temporary
validation workflow is retired.


### R5C2C11 validation evidence

The rebuilt R5C2C11 passed acceptance after the AVS dependency-isolation prerequisite.

~~~text
Workflow run: 37496183345
Run number: 3
Validated head: 71879f6b58fd505aee744a4d9910ddbb94581cf7
Result: success

Focused lint: passed
Functions build: passed
Focused R5C2C11 regressions: passed
Full Functions unit estate: passed
Deployment classifier and contract tests: passed

Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  revalidateAttendanceValidationGroupCached
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

The temporary validation workflow is retired before merge. Production verification remains
required after the main-branch deployment before R5C2C11 can be marked complete in production.


### R5C2C11 production evidence

R5C2C11 completed production deployment successfully after the validator-isolation
prerequisite removed the original two-Function dependency fanout.

~~~text
Pull request: #642
Merge commit: f75dc683832de4e2d09d506b72f7f3dba3c72082
Deploy workflow run: 37496485049
Deploy run number: 3914
Result: success

Functions deployment required: true
Functions full deployment: false
Impacted/deployed Functions: exactly 1
  revalidateAttendanceValidationGroupCached

AVS public transport verification: passed
Hosting deployed: false
Firestore Rules deployed: false
Firestore indexes deployed: false
Functions production baseline advanced: true
~~~

The original R5C2C11 attempt was intentionally superseded after its blast-radius gate exposed
the manual-verification dependency. The prerequisite was independently deployed first, and the
rebuilt C11 then validated and deployed as a genuine one-Function slice.

R5C2C11 is therefore complete in production. The next Wave 1 backend-authorization step is
the next independently deployable bounded Admin mutation slice (R5C2C12).


## R5C2C12 — createStudentForParent Admin authorization

R5C2C12 moves one independently deployable Admin-only learner creation callable:

~~~text
createStudentForParent
~~~

Authorization moves from:

~~~text
users/{request.auth.uid}
→ helpers/adminGuard.ts
~~~

to:

~~~text
authAccessReadModels/{request.auth.uid}
→ ensureCanonicalAdmin
~~~

There is no legacy Admin fallback and no Firebase custom-claim business-authority fallback.

The learner creation behavior is intentionally unchanged:

- the callable remains canonical-primary through `executeCanonicalLearnerCreate`;
- learner identity and compatibility projections remain transactionally planned by the existing canonical writer;
- guardian/parent relationship semantics remain unchanged;
- learner validation rules, private-profile behavior, response shape and telemetry remain unchanged;
- callable name, region, memory, timeout and maxInstances remain unchanged.

### R5C2C12 non-goals

This brick does not:

- change learner creation validation;
- change learner status mapping;
- change parent/guardian relationship authority;
- change enrollment creation or course assignment;
- change archive/reactivation behavior;
- modify the shared legacy `helpers/adminGuard.ts`;
- change Firestore Rules or Storage Rules;
- freeze legacy writes;
- authorize destructive identity retirement.

### R5C2C12 acceptance target

Expected deployment impact:

~~~text
Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  createStudentForParent
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

Acceptance requires:

1. Focused lint passes.
2. Functions TypeScript build passes.
3. Existing canonical-primary parent/student regressions pass.
4. R5C2C12 authorization-routing regression passes.
5. Full Functions unit estate passes.
6. Deployment-impact/deployment-contract tests pass.
7. Deployment impact resolves to exactly `createStudentForParent`.
8. No full Functions deployment, Hosting deployment, Firestore Rules deployment or index deployment is introduced.

Production remains unauthorized until this acceptance gate is green and the temporary
validation workflow is retired.


### R5C2C12 validation evidence

R5C2C12 passed its acceptance gate as a genuine one-Function authorization slice.

~~~text
Workflow run: 37608248912
Run number: 1
Validated head: 1b81fd73748b6207926e23e397cef7649bf4d8ff
Result: success

Focused lint: passed
Functions build: passed
Focused R5C2C12 regressions: passed
Full Functions unit estate: passed
Deployment classifier and contract tests: passed

Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  createStudentForParent
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

The temporary validation workflow is retired before merge. Production verification remains
required after the main-branch deployment before R5C2C12 can be marked complete in production.


### R5C2C12 production evidence

R5C2C12 completed its bounded production deployment successfully.

~~~text
Pull request: #647
Merge commit: 6573b59bd51e9dcafdc77adf752c2a57f5566b2d
Deploy workflow run: 37608533558
Deploy run number: 3919
Result: success

Functions deployment required: true
Functions full deployment: false
Impacted/deployed Functions: exactly 1
  createStudentForParent

Functions checkpoint-ready: 1/1
Hosting deployed: false
Firestore Rules deployed: false
Firestore indexes deployed: false
School/AVS/lead transport verification: not required
Functions production baseline advanced: true
Recovery job required: false
~~~

R5C2C12 is therefore complete in production. The next Wave 1 backend-authorization step is
the next independently deployable bounded Admin mutation slice. The exact next slice must be
selected from a fresh legacy-Admin-guard and deployment-topology audit rather than inferred
from numbering alone.


## R5C2C13 — Parent-payment monthly read-model Admin authorization

A fresh deployment-topology audit was run before selecting this slice.

~~~text
Selection audit workflow run: 37658500591
Result: success
Legacy adminGuard importer modules: 38
Deployed Function roots depending on at least one legacy importer: 85
One-Function legacy-guard boundaries identified: 17
Audit working-tree writes: 0
~~~

R5C2C13 selects the independently deployable callable:

~~~text
reconcileParentPaymentsMonthReadModels
~~~

The selection deliberately avoids higher-risk one-Function candidates that directly mutate
teacher payouts, attendance corrections, demo completion state, rolling schedules, or other
authoritative operational data.

Authorization moves from:

~~~text
users/{request.auth.uid}
→ helpers/adminGuard.ts
~~~

to:

~~~text
authAccessReadModels/{request.auth.uid}
→ ensureCanonicalAdmin
~~~

There is no legacy Admin fallback and no Firebase custom-claim business-authority fallback.

The parent-payment reconciliation behavior is intentionally unchanged:

- dry-run remains the default;
- the existing parent cap remains bounded at 1,500;
- authoritative payment documents are not written;
- billing-charge documents are not written;
- parent-wallet documents are not written;
- apply mode may rebuild only the derived `parentMonthlyReadModels/{parentId}/months/{monthKey}` projection;
- the existing billing/read-model derivation and mismatch semantics remain unchanged;
- callable name, region, memory and timeout remain unchanged.

### R5C2C13 non-goals

This brick does not:

- change billing or payment calculation authority;
- change wallet balances;
- change billing charges or payment allocation;
- change parent invoice policy;
- change monthly read-model derivation semantics;
- change the existing dry-run default or parent safety bound;
- modify the shared legacy `helpers/adminGuard.ts`;
- change Firestore Rules or Storage Rules;
- freeze legacy writes;
- authorize destructive identity retirement.

### R5C2C13 acceptance target

Expected deployment impact:

~~~text
Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  reconcileParentPaymentsMonthReadModels
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
~~~

Acceptance requires:

1. Focused lint passes.
2. Functions TypeScript build passes.
3. Existing parent monthly billing/read-model regressions pass.
4. R5C2C13 authorization-routing regression passes.
5. Wave 1 authorization-hardening regressions pass.
6. Full Functions unit estate passes.
7. Deployment-impact/deployment-contract tests pass.
8. Deployment impact resolves to exactly `reconcileParentPaymentsMonthReadModels`.
9. No full Functions deployment, Hosting deployment, Firestore Rules deployment or index deployment is introduced.

Production remains unauthorized until this acceptance gate is green and the temporary
validation workflow is retired.


### R5C2C13 validation evidence

R5C2C13 passed its acceptance gate as a genuine one-Function authorization slice.

~~~text
Workflow run: 37660719146
Run number: 3
Validated head: bb9763b8f32f3fbd68d5250e87e804a54e26b651
Result: success

Changed-file and ledger boundary: passed
Focused lint: passed
Functions build: passed
Focused C13 regressions: passed
  root focused files: 3 passed
  root focused tests: 22 passed
  Functions focused files: 2 passed
Full Functions unit estate: passed
  files: 151 passed, 2 skipped
  tests: 1167 passed, 25 skipped
Deployment classifier and contract tests: 81 passed, 0 failed

Functions deployment required: true
Functions full deployment: false
Impacted Functions: exactly 1
  reconcileParentPaymentsMonthReadModels
Hosting changed: false
Firestore Rules changed: false
Firestore indexes changed: false
AVS callable transport verification required: false
School callable transport verification required: false
Lead IAM verification required: false
~~~

The first acceptance attempt exposed one stale Wave 1 regression left behind by the already
production-complete R5C2C12 cutover: the hardening test still expected
`createStudentForParent` to call legacy `ensureAdmin`. That test-only assertion was corrected
to the canonical C12 contract and retained in the C13 acceptance gate; no C12 runtime behavior
was changed.

The temporary validation workflow is retired before merge. Production verification remains
required after the main-branch deployment before R5C2C13 can be marked complete in production.


### R5C2C13 production evidence

R5C2C13 completed its bounded production deployment successfully.

~~~text
Pull request: #651
Merge commit: 7c01fddf1531a5d7127ee4eec5d095bd4ccc81d4
Deploy workflow run: 37661529664
Deploy run number: 3923
Result: success

Functions deployment required: true
Functions full deployment: false
Impacted/deployed Functions: exactly 1
  reconcileParentPaymentsMonthReadModels

Deployment batches: 1/1
Cloud Functions verified: 1
Functions checkpoint-ready: 1/1
Hosting deployed: false
Firestore Rules deployed: false
Firestore indexes deployed: false
School callable transport verification: not required
AVS callable transport verification: not required
Lead attribution callable transport verification: not required
Functions production baseline advanced: true
Recovery job required: false
~~~

R5C2C13 is therefore complete in production. The next Wave 1 backend-authorization step
must remain another independently deployable bounded Admin mutation slice. The exact next
slice must be selected from a fresh post-C13 legacy-Admin-guard and deployment-topology
audit rather than inferred from numbering alone.
