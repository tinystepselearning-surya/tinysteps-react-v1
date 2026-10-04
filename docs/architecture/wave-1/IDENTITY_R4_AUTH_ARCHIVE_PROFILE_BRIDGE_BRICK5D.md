# Wave 1 R4 — Brick 5D: Auth archive, teacher profile, and projection bridge

**Status:** validation pending  
**Scope:** implementation + regression coverage only  
**Production wiring:** OFF  
**Production behavior change:** none  
**Reader cutover:** no  
**Firestore Rules cutover:** no  
**Legacy write freeze:** no  
**Destructive deletion:** no

## Purpose

Bricks 5B and 5C implemented canonical-primary create and update/role-transition writers
without activating them. Brick 5D completes the remaining implementation dependencies
needed before the auth-backed writer family can be switched as one controlled production
cutover.

Brick 5D adds:

1. canonical auth-user archive/lifecycle handling;
2. canonical teacher self-profile handling;
3. a decoupled `users/{firebaseUid}` projection corroboration bridge.

No deployed callable or browser writer is changed in this brick.

## Canonical archive writer

`canonicalPrimaryAuthUserArchive.ts` archives identity state without inferring Person ID
from Firebase UID.

Required existing relationship:

~~~text
Firebase UID
  -> deterministic AuthIdentity
  -> Person ID
  -> current global RoleAssignment
~~~

Canonical writes:

~~~text
people/{personId}                  status = archived
authIdentities/{authIdentityId}    status = archived
roleAssignments/{roleAssignmentId} status = inactive
personLifecycle/{personId}         archivedAt / archivedBy / reason
~~~

Compatibility writes remain UID-keyed:

~~~text
users/{firebaseUid}
<roleRoot>/{firebaseUid}
~~~

The Firestore writer does not disable Firebase Auth. That remains callable orchestration in
the final activation brick.

## Canonical teacher profile writer

The current teacher UI writes profile, bank and emergency details directly to
`users/{uid}`. The Brick 5D writer provides the server-side canonical replacement.

Canonical destinations:

~~~text
people/{personId}                  write authority / update ownership
personContacts/{personId}          phone / timezone
staffPrivateProfiles/{personId}    bank / UPI / emergency contact
~~~

Temporary compatibility destinations:

~~~text
users/{firebaseUid}
teachers/{firebaseUid}
~~~

For a migrated legacy identity where `personId == firebaseUid`, the existing
`teachers/{uid}` document can also act as the permanent role-profile document.

For a new decoupled identity where `personId != firebaseUid`, the writer explicitly
refuses a simultaneous `teachers/{personId}` root. The UID-keyed teacher root remains a
compatibility/operational root until the shared role-root key/subcollection migration.

The writer supports explicit clearing of profile/private fields by writing null/empty
canonical values rather than deleting the Person or profile identity.

## Auth-user projection corroboration bridge

A canonical auth-backed writer must still emit `users/{firebaseUid}` compatibility state
while current readers and Rules depend on it.

The legacy user-sync trigger cannot be allowed to interpret that canonical compatibility
document as a new legacy Person whose ID is the Firebase UID.

`authUserProjectionBridge.ts` therefore accepts a user projection only when all three
layers corroborate the same write:

~~~text
users/{firebaseUid}._wave1CanonicalProjection
people/{personId}.canonicalAuthority
authIdentities/{deterministicFirebaseAuthIdentityId}
~~~

The supported canonical commands are:

~~~text
auth_user_create
auth_user_update
auth_user_archive
teacher_profile_update
~~~

Corroboration validates:

- canonical-primary authority;
- supported command;
- identical writeId;
- canonicalPersonId;
- provider = firebase;
- providerSubject = source Firebase UID;
- Person ID agreement;
- deterministic AuthIdentity mapping UID -> Person.

A forged, malformed, stale or partially written marker does not suppress legacy behavior.

The helper is intentionally not wired into the live trigger in Brick 5D. Trigger wiring
belongs to the final activation brick, where it can be validated with the callable changes
as one atomic migration boundary.

## Activation gate after Brick 5D

After Brick 5D is validated, the remaining work is a controlled activation brick that must
change all related live writers together:

- `adminCreateUser`;
- `adminUpdateUser`;
- `adminSetUserRole`;
- `adminArchiveUser`;
- teacher self-profile callable and browser routing;
- decoupled user projection suppression in `onWave1LegacyUserIdentityWrite`;
- generic User Management role routing so `kid` and `schoolAdmin` use dedicated flows.

Firebase Auth and custom-claim mutation remain orchestration responsibilities around the
canonical Firestore writers.

## Non-goals

Brick 5D does not:

- deploy or wire a new callable;
- modify `adminCreateUser`, `adminUpdateUser`, `adminArchiveUser` or
  `adminSetUserRole`;
- modify `TeacherProfile.tsx`;
- modify the live identity legacy-sync trigger;
- modify Firestore Rules;
- move teacher earnings, availability or blocked-slot subcollections;
- create or mutate production users.

## Next

After Brick 5D passes focused validation and merges with zero deployment impact, proceed to
the final R4 auth-backed writer activation brick. That brick will be production-impacting
and will require a controlled production canary after deployment.
