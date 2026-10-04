# Wave 1 R5C — Backend Current-Principal Authorization Cutover

**Status:** validation pending  
**Lifecycle phase:** R5 backend reader / authorization cutover  
**Production backend authorization before deployment:** legacy compatibility  
**Production Firestore Rules authority:** legacy `users` / `schoolUsers`  
**Legacy write freeze:** no  
**Destructive retirement:** no

## Purpose

R5B populated and independently reconciled:

~~~text
authAccessReadModels/{firebaseUid}
~~~

for all current Firebase-backed canonical identities.

R5C makes that canonical-derived read model authoritative for **backend current-principal
authorization**.

This is deliberately narrower than a blanket replacement of every `users` read in the
codebase.

## Cutover scope

### 1. Admin callable authorization

~~~text
functions/src/helpers/adminGuard.ts
~~~

`ensureAdmin` / `isCurrentAdmin` now authorize from:

~~~text
authAccessReadModels/{request.auth.uid}
~~~

Requirements:

- schema version is supported;
- authority = `canonical-derived`;
- embedded Firebase UID matches the document key;
- Person/AuthIdentity lifecycle flags are internally consistent;
- `accessActive == true`;
- active global roles include `admin`.

Firebase custom claims remain an authentication cache only.

There is **no fallback** to:

~~~text
users/{uid}
~~~

A missing or malformed canonical access document fails closed.

### 2. School-domain requester authorization

~~~text
functions/src/helpers/schoolAuthorization.ts
~~~

The authenticated requester is resolved from the same UID-keyed canonical-derived access
document.

Authorization rules become:

#### Tiny Steps Admin

~~~text
accessActive == true
AND globalRoles contains admin
~~~

#### Learning Partner

~~~text
accessActive == true
AND globalRoles contains learningPartner
AND schools/{schoolId}.learningPartnerId == request.auth.uid
~~~

The final equality intentionally preserves the current operational Firebase UID boundary.

#### School Admin reader

~~~text
accessActive == true
AND schoolId in schoolAdminOrganisationIds
AND school is not archived
~~~

`schoolUsers/{uid}` is no longer consulted for requester authorization.

### 3. School evidence actor names

The school authorization result now carries canonical `personId`.

School review / assessment actor display names are read from:

~~~text
people/{personId}.displayName
~~~

instead of relying on a legacy `users/{uid}` profile returned by the authorization helper.

This profile read is presentation/audit metadata only; it is not part of the authorization
decision.

## Canonical authorization reader

New helper:

~~~text
functions/src/schoolOS/identity/authAccessAuthorization.ts
~~~

The reader validates the R5A/R5B projection before exposing a principal.

Fail-closed checks include:

- schema version;
- canonical-derived authority;
- Firebase UID/document-key equality;
- required Person/AuthIdentity references;
- valid Person status;
- valid AuthIdentity status;
- `accessActive` consistency with lifecycle state;
- allowed global role values only;
- no duplicate global roles;
- valid school-organisation IDs;
- no duplicate school scopes.

A principal with inactive lifecycle may parse for diagnostics, but all authorization predicates
return false.

## Read-cost boundary

For ordinary backend authorization:

~~~text
authAccessReadModels/{uid}: 1 point read
~~~

School authorization additionally reads:

~~~text
schools/{schoolId}: 1 point read
~~~

School evidence writes perform one extra canonical Person point read only when a human-readable
actor name is needed.

There is no query fan-out and no fallback legacy read.

## Operational UID boundary

R5C does **not** change operational IDs used by:

- school Learning Partner assignment;
- teacher earnings;
- availability;
- blocked slots;
- sessions;
- attendance;
- finance;
- existing operational references.

Firebase UID remains the operational reference where already required.

## Explicit non-goals

R5C does not yet cut over target-user business/profile reads in workflows such as:

- LP assignment target validation;
- permanent user deletion;
- admin user lists;
- pre-auth username/phone login resolution;
- legacy compatibility writer orchestration.

Those reads are not current-requester authorization and require their own canonical reader
contracts.

R5C also does not:

- change Firestore Security Rules;
- change Storage Rules;
- delete `users` or `schoolUsers`;
- freeze legacy writes;
- move teacher subcollections;
- change Firebase Auth UIDs;
- authorize destructive retirement.

## Firestore Rules

Rules remain unchanged in R5C.

R5D is the dedicated Security Rules cutover after backend authorization has deployed and been
verified.

## Acceptance gates

Before merge:

1. Functions TypeScript build passes.
2. R5C authorization-reader unit tests pass.
3. Routing tests prove:
   - Admin guard has no `users` read;
   - school requester authorization has no `users` or `schoolUsers` read;
   - Learning Partner operational UID equality is preserved;
   - school evidence actor name comes from canonical Person.
4. Existing R5A/R5B identity/access tests remain green.
5. Existing authorization/routing regressions remain green.
6. Deployment-impact analysis identifies only required Functions.
7. No Hosting, Firestore Rules, or index deployment is introduced.

## Production gate

After merge:

1. deploy only impacted Functions;
2. verify every impacted Function is ready;
3. verify production build/deployment marker;
4. perform bounded Admin + school authorization smoke checks where possible;
5. keep Firestore Rules unchanged.

Only after clean R5C production verification may R5D begin.
