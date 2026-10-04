# Wave 1 R4 — Brick 5C: Canonical auth-backed user update and role-transition writer

**Status:** COMPLETE — validated implementation; production wiring remains OFF  
**Scope:** writer implementation + regression coverage only  
**Production wiring:** OFF  
**Production behavior change:** none  
**Reader cutover:** no  
**Firestore Rules cutover:** no  
**Legacy write freeze:** no  
**Destructive deletion:** no

## Purpose

Brick 5B implemented canonical-primary creation for new generic auth-backed users, but did
not activate it. Brick 5C implements the matching update/role-transition writer so a
decoupled Person can be edited without falling back to the historical assumption that
Firebase UID is the Person ID.

This brick remains unwired. Production activation waits until profile/archive paths and the
decoupled compatibility trigger are ready.

## Supported roles

The generic update writer supports:

~~~text
admin
founder
teacher
parent
learningPartner
~~~

`kid` and `schoolAdmin` remain dedicated-flow roles:

- learner identity is managed by the learner canonical-primary path;
- school-admin authority is organisation-scoped and must be maintained by school membership
  workflows, not a global generic RoleAssignment.

## Identity resolution expectation

The writer receives both:

~~~text
personId
firebaseUid
~~~

and requires the deterministic Firebase AuthIdentity to prove:

~~~text
provider = firebase
providerSubject = firebaseUid
personId = personId
~~~

It supports both:

~~~text
legacy adopted identity: personId == firebaseUid
new decoupled identity:  personId != firebaseUid
~~~

Equality is therefore supported for migrated users but is never used as an inference rule.

## Same-role update

For a normal profile/status update the canonical writer updates:

~~~text
people/{personId}
authIdentities/{authIdentityId}
personContacts/{personId}
roleAssignments/{currentRoleAssignmentId}
~~~

The compatibility writer updates:

~~~text
users/{firebaseUid}
<roleRoot>/{firebaseUid}
~~~

Every canonical update receives:

~~~text
canonicalAuthority.command = auth_user_update
canonicalAuthority.writeId = one update write ID
~~~

Every compatibility update receives the matching `_wave1CanonicalProjection`.

## Role transition

A role change never rewrites historical role identity in place.

Instead:

~~~text
old RoleAssignment -> inactive
new RoleAssignment -> active/inactive from Person status
~~~

The current UID-keyed role compatibility root transitions in parallel:

~~~text
oldRoleRoot/{firebaseUid} -> delete root document
newRoleRoot/{firebaseUid} -> set compatibility profile
~~~

Firestore subcollections under an old role root are not recursively deleted by this writer.
Their later relocation/retirement remains a separate Wave 1 concern.

The writer never creates the new role root at `{personId}` while UID-keyed operational
paths remain active.

## Status mapping

~~~text
Person active     -> AuthIdentity active   -> RoleAssignment active
Person suspended  -> AuthIdentity disabled -> RoleAssignment inactive
Person archived   -> AuthIdentity archived -> RoleAssignment inactive
~~~

Firebase Authentication enable/disable is external to this Firestore writer and remains a
callable orchestration responsibility at activation.

## Contact update behavior

The generic admin update form currently changes:

~~~text
displayName
email
phone
role
status
~~~

Brick 5C updates only those canonical fields. Existing contact metadata such as
`phoneCountryCode`, `phoneLocal`, timezone and other fields are preserved by merge and
are not erased merely because the generic form does not submit them.

## Preconditions and collision guards

Before any write the transaction requires:

1. `people/{personId}`;
2. the deterministic Firebase AuthIdentity;
3. `users/{firebaseUid}`;
4. the previous RoleAssignment.

Each must agree with the requested Person/UID/role relationship.

When transitioning roles, any existing destination RoleAssignment or role-mirror document
is accepted only if it belongs to the same Person/UID. Otherwise the writer fails closed.

For a decoupled identity, the person-keyed destination role-root path is also checked as a
guard against accidentally creating split role roots.

## Atomic write and verification

The Firestore transaction performs all required/guarded reads before mutation, then applies
canonical and compatibility operations together.

After commit, bounded verification checks:

- Person mapping and write authority;
- AuthIdentity UID ↔ Person mapping;
- PersonContact ownership;
- RoleAssignment ownership;
- compatibility user projection marker;
- compatibility role mirror ownership;
- requested deletion of the previous role root.

## Activation gates remaining

Brick 5C still does not activate the auth-backed writer family. Before activation:

1. archive lifecycle metadata must be canonical-primary;
2. teacher self-profile writes must move off direct browser `users/{uid}` writes;
3. the legacy user trigger must understand/corroborate decoupled canonical projections;
4. the callable orchestration must update Firebase Auth and claims with compensation;
5. generic user UI must stop offering unsupported generic `kid` / `schoolAdmin` paths or
   route them to their dedicated flows;
6. a production canary must verify login, claims, Person, AuthIdentity, RoleAssignment,
   contacts and compatibility roots together.

## Non-goals

Brick 5C does not:

- modify `adminUpdateUser`;
- modify `adminArchiveUser`;
- modify `TeacherProfile.tsx`;
- modify Firebase Auth state or custom claims;
- modify Firestore Rules;
- change production data;
- activate person-keyed role roots;
- move earnings/availability subcollections.

## Next

After validation and merge, implement canonical archive/profile writer coverage and the
decoupled user-projection bridge, then activate the auth-backed writer family as one
controlled production cutover.


## Validation evidence

Validated implementation commit:

~~~text
567ffe548247052398b421bfd0726056b6ca91d3
~~~

Temporary validation workflow:

~~~text
Run ID: 37204376145
Result: success
~~~

Results:

- Functions TypeScript build: passed.
- Focused test files: 4/4 passed.
- Focused tests: 40/40 passed.
  - canonicalPrimaryAuthUserUpdate: 10/10.
  - canonicalPrimaryAuthUserCreate: 10/10.
  - authPersonCompatibility: 9/9.
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
