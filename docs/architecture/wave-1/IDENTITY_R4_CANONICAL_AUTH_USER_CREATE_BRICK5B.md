# Wave 1 R4 — Brick 5B: Canonical auth-backed user create writer

**Status:** COMPLETE — validated implementation; production wiring remains OFF  
**Scope:** writer implementation + regression coverage only  
**Production wiring:** OFF  
**Production behavior change:** none  
**Reader cutover:** no  
**Firestore Rules cutover:** no  
**Legacy write freeze:** no  
**Destructive deletion:** no

## Purpose

Brick 5A froze the Firebase UID ↔ canonical Person compatibility contract. Brick 5B
implements the canonical-primary Firestore writer that a later activation of
`adminCreateUser` will use.

This brick is intentionally not wired to the callable yet.

Activating creation alone would leave newly-created decoupled users exposed to legacy
`adminUpdateUser` and browser teacher-profile writes. Those paths still write UID-keyed
documents and do not yet maintain all person-keyed canonical profile state. Production
activation therefore waits until the matching update/profile writer bricks are complete.

## Supported generic auth-backed roles

The generic canonical create writer supports:

~~~text
admin
founder
teacher
parent
learningPartner
~~~

It does not canonicalize these through the generic flow:

~~~text
kid
schoolAdmin
~~~

Reasons:

- Tiny Steps learners are not generic Firebase Auth users; learner creation already has its
  own canonical-primary flow.
- School Admin authority is organisation-scoped and requires the school membership flow;
  it must not be represented as a global RoleAssignment merely to fit the generic user form.

No current production behavior changes in this brick because `adminCreateUser` is not
yet switched.

## New-user identity rule

For every new generic auth-backed user:

~~~text
personId != firebaseUid
~~~

The writer refuses same-value creation. This makes the Wave 0 semantic separation explicit
for all newly issued identities.

Firebase UID remains:

~~~text
AuthIdentity.providerSubject
~~~

Person ID remains:

~~~text
Person.personId
~~~

## Canonical write set

A normal auth-backed create plans:

~~~text
people/{personId}
authIdentities/{deterministicAuthIdentityId}
roleAssignments/{deterministicRoleAssignmentId}
personContacts/{personId}
~~~

When restricted staff-private fields are supplied:

~~~text
staffPrivateProfiles/{personId}
~~~

Every canonical document carries the same canonical-primary ownership tuple:

~~~text
authority = canonical-primary
command   = auth_user_create
writeId   = one unique write identifier
~~~

## Compatibility write set

Until the later reader/rules/key cutovers, the current operational paths remain keyed by
Firebase UID:

~~~text
users/{firebaseUid}
teachers/{firebaseUid}
parents/{firebaseUid}
learningPartners/{firebaseUid}
admins/{firebaseUid}
~~~

Only the applicable role mirror is written.

Each compatibility document carries:

~~~text
canonicalPersonId
_wave1CanonicalProjection
~~~

The marker contains both:

~~~text
canonicalPersonId
providerSubject = firebaseUid
~~~

so the future activation bridge can corroborate the projection against canonical Person and
AuthIdentity state.

## No duplicate role-root profile

For a decoupled identity, this brick never plans both:

~~~text
teachers/{firebaseUid}
teachers/{personId}
~~~

or the equivalent parent/admin/LP pair.

The UID-keyed root remains the temporary operational compatibility location. Person-keyed
permanent role-profile activation remains deferred until the shared role-root key cutover is
safe.

The writer also probes the person-keyed role-root path as a collision guard before writing.

## Contact and private-state separation

General contact fields move immediately to:

~~~text
personContacts/{personId}
~~~

Sensitive staff payment fields move to:

~~~text
staffPrivateProfiles/{personId}
~~~

Current compatibility mirrors retain the fields their deployed readers still require.

Parent address/payment-method fields and teacher/LP role-profile fields are intentionally
not invented as new canonical Person fields. They remain compatibility profile data until
the role-profile writer/key strategy is activated.

## Atomic Firestore writer

`writeCanonicalAuthUserCreatePlan` performs one Firestore transaction that:

1. reads every canonical and compatibility collision probe;
2. rejects any pre-existing target or cross-key collision;
3. writes all canonical and compatibility documents together;
4. uses one server timestamp boundary;
5. performs bounded post-write verification.

If any collision is found, no planned document is committed.

Firebase Auth creation itself is not performed by this module. The later callable
activation must create the Auth user and use compensating deletion if the Firestore
transaction fails.

## Required activation sequence

Brick 5B is deliberately implementation-only.

Before `adminCreateUser` can switch in production:

1. canonical user update behavior must support decoupled Person IDs;
2. role transitions must update canonical RoleAssignments safely;
3. teacher self-profile edits must stop writing directly to `users/{uid}`;
4. contact/private profile changes must maintain person-keyed canonical state;
5. the `users/{uid}` canonical projection trigger must understand decoupled markers and
   must never rematerialize `people/{uid}`;
6. activation must have callable-level compensation and post-write verification;
7. a controlled production canary must verify Auth, Person, AuthIdentity, role, claims and
   compatibility paths together.

## Non-goals

Brick 5B does not:

- modify or deploy `adminCreateUser`;
- modify `adminUpdateUser`;
- modify `adminArchiveUser`;
- modify TeacherProfile browser writes;
- modify legacy-sync production behavior;
- modify Firestore Rules;
- create production users;
- migrate existing users;
- move teacher earnings/availability subcollections.

## Next

After this implementation is validated and merged, continue with the matching
auth-backed update/role-transition writer before production activation.


## Validation evidence

Validated implementation commit:

~~~text
ab82da80995d5c12a5dae74e27842a9d088fb34f
~~~

Temporary validation workflow:

~~~text
Run ID: 37204088176
Result: success
~~~

Results:

- Functions TypeScript build: passed.
- Focused test files: 5/5 passed.
- Focused tests: 43/43 passed.
  - canonicalPrimaryAuthUserCreate: 10/10.
  - authPersonCompatibility: 9/9.
  - canonicalPrimaryPlanner: 7/7.
  - canonicalPrimaryWriter: 6/6.
  - identityLegacySync: 11/11.
- Functions source changed: yes.
- Functions validation required: yes.
- Functions deployment required: no.
- Impacted deployed Functions: 0.
- Hosting changed: no.
- Firestore Rules changed: no.
- Firestore indexes changed: no.
- Production writes: none.
- Temporary validation workflow retired before merge.
