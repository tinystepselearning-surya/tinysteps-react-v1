# Wave 1 R5A — Canonical Auth Access Read Model Contract

**Status:** validation pending  
**Lifecycle phase:** R5 reader / Firestore Rules cutover preparation  
**Production reader authority:** unchanged  
**Production Rules authority:** unchanged  
**Production behavior change:** none  
**Legacy write freeze:** no  
**Destructive retirement:** no

## Why R5A exists

R4 completed canonical-primary writes for learners and approved auth-backed users.

The next migration goal is to switch backend readers and Firestore Rules away from legacy
`users/{firebaseUid}` identity authority.

A direct Rules cutover to the canonical source collections is not safe because two canonical
document keys are intentionally hashed:

~~~text
authIdentities/{hashed deterministic id}
roleAssignments/{hashed deterministic id}
~~~

Firestore Security Rules cannot calculate those SHA-256-derived IDs from
`request.auth.uid`.

R5A therefore introduces one **derived, UID-keyed authorization read model**:

~~~text
authAccessReadModels/{firebaseUid}
~~~

It is a read projection only.

It is **not** a new Person, AuthIdentity, RoleAssignment, membership, profile, or business
authority.

## Canonical source authority

The read model is derived exclusively from:

~~~text
people
authIdentities
roleAssignments
organisationMemberships
~~~

The loader does not read:

~~~text
users
parents
teachers
learningPartners
admins
schoolUsers
~~~

That property is regression-tested.

## Read-model key

Document ID:

~~~text
firebaseUid
~~~

This key is deliberate.

Firebase Authentication supplies:

~~~text
request.auth.uid
~~~

Firestore Rules can therefore point-read exactly one document without a query or a hash
calculation.

## Record shape

Version 1:

~~~text
authAccessReadModels/{firebaseUid}

schemaVersion: 1
authority: canonical-derived
firebaseUid
personId
personStatus
authStatus
accessActive
globalRoles[]
schoolAdminOrganisationIds[]
sourceAuthIdentityId
updatedAt
~~~

### accessActive

~~~text
true only when:
  Person.status == active
  AND
  AuthIdentity.status == active
~~~

Suspended, disabled, or archived identity state therefore denies access even when an active
role assignment remains present.

### globalRoles

Only active global RoleAssignments are included.

Allowed global access roles:

~~~text
admin
founder
teacher
parent
kid
learningPartner
~~~

`schoolAdmin` is intentionally excluded from globalRoles because it is organisation-scoped.

### schoolAdminOrganisationIds

A school ID appears only when **both** canonical conditions are true:

1. active `organisationMemberships` record:
   - same Person;
   - role = schoolAdmin;
   - status = active;
2. active organisation-scoped `roleAssignments` record:
   - same Person;
   - role = schoolAdmin;
   - scopeType = organisation;
   - scopeId = the same organisation;
   - status = active.

This avoids globalising school-admin authority.

## Loader contract

`loadCanonicalAuthAccessInput` starts from Firebase UID and uses:

1. deterministic Firebase AuthIdentity point read;
2. canonical Person point read;
3. bounded RoleAssignment query by Person ID;
4. bounded OrganisationMembership query by Person ID.

Default bounds:

~~~text
RoleAssignments:            max 50
OrganisationMemberships:   max 50
~~~

The loader fails closed if either bound is exceeded.

It also fails closed on:

- missing AuthIdentity;
- provider mismatch;
- providerSubject/UID mismatch;
- AuthIdentity/Person mismatch;
- invalid Person/Auth status;
- unknown canonical role;
- invalid role scope;
- invalid assignment/membership status;
- any assignment/membership that belongs to another Person.

## Writer contract

`refreshAuthAccessReadModel` writes exactly:

~~~text
authAccessReadModels/{firebaseUid}
~~~

It performs no legacy compatibility writes.

R5A does not wire this writer into any production Function.

## Firestore Rules intent

A later R5 Rules brick can define predicates conceptually equivalent to:

~~~text
access document exists
AND accessActive == true
AND role is present in globalRoles
~~~

School access can additionally require:

~~~text
schoolId in schoolAdminOrganisationIds
~~~

Direct client access to the read-model collection should remain denied. Rules can still use
server-side document lookups during rule evaluation.

The actual Rules change is **not** part of R5A.

## Migration sequence after R5A

### R5B — populate and maintain

- production dry-run;
- bounded backfill of every current Firebase auth-backed canonical identity;
- independent reconciliation;
- wire canonical create/update/archive/role/profile paths to refresh the read model;
- wire organisation membership changes for school-admin access;
- no reader/rules switch yet.

### R5C — backend reader/authorization cutover

- switch `ensureAdmin` / current-role backend helpers;
- switch selected backend identity readers;
- compare legacy compatibility state as shadow/fallback only during observation;
- preserve operational Firebase UID references.

### R5D — Firestore Rules cutover

- replace `users/{uid}` role/status predicates with `authAccessReadModels/{uid}`;
- replace `schoolUsers/{uid}` authority with school IDs from the canonical-derived read model;
- run full emulator authorization regression suite;
- deploy Rules only after clean production read-model reconciliation.

## Operational UID boundary

R5 does **not** change teacher operational identifiers used by:

- earnings;
- availability;
- blocked slots;
- sessions;
- attendance;
- finance;
- other operational references.

Those remain Firebase UID-keyed until the later role-root/subcollection relocation sequence.

## Non-goals

R5A does not:

- switch any production reader;
- change Firestore Rules;
- backfill production read models;
- add triggers/callables;
- change Firebase custom claims;
- remove `users` or `schoolUsers`;
- change operational teacher IDs;
- freeze legacy writes;
- authorize deletion.

## Validation

The focused regression suite must prove:

- active global-role projection;
- inactive lifecycle behavior;
- active school-admin intersection;
- UID ↔ Person/AuthIdentity validation;
- Person ownership validation for roles/memberships;
- invalid role fail-closed behavior;
- bounded queries;
- zero reads from legacy `users`;
- exactly one UID-keyed read-model write;
- zero legacy writes.

Only after Functions build + focused tests + deployment-impact analysis are green may R5A merge.
