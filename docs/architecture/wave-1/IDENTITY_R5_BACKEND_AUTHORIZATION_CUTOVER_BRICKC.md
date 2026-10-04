# Wave 1 R5C1 — School-Domain Backend Authorization Cutover

**Status:** validation pending  
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
