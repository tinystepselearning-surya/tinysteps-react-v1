# Wave 1 R4 — Brick 5A: Auth-backed UID / Person compatibility contract

**Status:** COMPLETE — validated contract; no production wiring  
**Scope:** contract + resolver + regression coverage only  
**Production behavior change:** none  
**Reader cutover:** no  
**Firestore Rules cutover:** no  
**Legacy write freeze:** no  
**Destructive deletion:** no

## Purpose

R4 learner writers are already canonical-primary. The next writer family is auth-backed
users created and maintained through Firebase Authentication.

Wave 0 froze a critical identity rule:

- Firebase UID is an authentication-provider subject.
- Person ID is the stable Tiny Steps human identity.
- Existing auth-backed users may retain the current UID-shaped value as an adopted
  Person ID value, but that does not create semantic coupling.
- New Person IDs must be Tiny Steps-generated and must not be derived from Firebase
  UID, email or phone.

Current runtime code still uses Firebase UID as an operational key in several places,
including `users/{uid}`, teacher availability/blocked-slot paths, teacher finance
subcollections and Firestore Rules. Cutting `adminCreateUser` directly would therefore
risk reintroducing UID = Person coupling or creating duplicate role-root documents.

Brick 5A establishes the compatibility boundary before any auth-backed writer is switched.

## Contract

### Canonical identity

For a new auth-backed person:

```text
people/{personId}
authIdentities/{buildAuthIdentityId("firebase", firebaseUid)}
roleAssignments/{roleAssignmentId}
personContacts/{personId}
personLifecycle/{personId}
staffPrivateProfiles/{personId}   # staff roles only
```

The AuthIdentity record is the semantic bridge:

```text
Firebase UID -> AuthIdentity.providerSubject
             -> AuthIdentity.personId
             -> Person
```

No caller may infer `personId = firebaseUid`.

### Legacy-adopted existing users

Existing migrated users can have the same opaque value for both identifiers:

```text
personId == firebaseUid
```

This is an adopted-value coincidence only. It must not become a rule for new users.

### UID-keyed operational compatibility

Until R5/R6 removes the current UID-keyed assumptions, compatibility paths remain:

```text
users/{firebaseUid}
teachers/{firebaseUid}
parents/{firebaseUid}
learningPartners/{firebaseUid}
admins/{firebaseUid}
```

These paths are compatibility/operational projections during the migration, not Person
identity authority.

### Role-root duplication prohibition

For a decoupled identity where `personId != firebaseUid`, R4 MUST NOT create both:

```text
teachers/{firebaseUid}
teachers/{personId}
```

(or the equivalent parent/admin/learning-partner pair) while the same root collection is
still used by UID-keyed operational readers, collection scans, security rules or
subcollections.

Doing so would create duplicate logical people in one collection and could split teacher
availability, earnings or other operational subcollections across two roots.

Therefore, for decoupled identities, person-keyed permanent role-profile activation is
explicitly deferred until the role-root key cutover is safe. Canonical Person, AuthIdentity,
RoleAssignment, contact/lifecycle/private profile state can still be person-keyed.

## Resolver contract

`authPersonCompatibility.ts` provides two bounded server-side resolvers:

1. Firebase UID -> Person ID
   - deterministic point read of the Firebase AuthIdentity;
   - validates provider, provider subject and Person existence;
   - never silently falls back to `personId = uid`;
   - legacy same-value fallback is explicit and opt-in.

2. Person ID -> Firebase UID
   - bounded AuthIdentity lookup by Person ID;
   - requires exactly one Firebase identity;
   - validates the deterministic AuthIdentity document ID;
   - fails closed on ambiguity.

## Brick 5B activation gates

`adminCreateUser` must not be switched to canonical-primary until all of these remain true:

1. Tiny Steps generates Person ID independently of Firebase UID.
2. AuthIdentity is written with `providerSubject = firebaseUid` and `personId = personId`.
3. RoleAssignment is keyed from Person ID.
4. Existing UID-keyed login, Rules and operational paths continue working through an
   explicit compatibility projection.
5. No second person-keyed role-root document is created for a decoupled identity while
   UID-keyed role roots remain operational.
6. The write is atomic or compensating/verified so Auth and Firestore cannot silently
   diverge.
7. Regression tests cover both legacy-adopted same-value identities and new decoupled
   identities.

## Non-goals

Brick 5A does not:

- modify `adminCreateUser`;
- modify `adminUpdateUser`;
- modify `adminArchiveUser`;
- modify teacher profile browser writes;
- modify Firestore Rules;
- move teacher earnings/availability subcollections;
- activate person-keyed role-root profiles for decoupled identities;
- deploy a new Cloud Function;
- write production data.

## Next

After validation and merge, R4 Brick 5B can migrate `adminCreateUser` against this
contract without changing the frozen Wave 0 identity semantics.


## Validation evidence

Validated implementation commit:

```text
f55661e30e1012999e48c5ec7bbedf5632a214cd
```

Temporary GitHub Actions validation run:

```text
Run ID: 37203617328
Result: success
```

Validation results:

- Functions TypeScript build: passed.
- Focused identity test files: 4/4 passed.
- Focused identity tests: 29/29 passed.
  - authPersonCompatibility: 9/9.
  - identityReadAdapter: 7/7.
  - canonicalPrimaryPlanner: 7/7.
  - canonicalPrimaryWriter: 6/6.
- Functions source changed: yes.
- Functions validation required: yes.
- Functions deployment required: no.
- Impacted deployed Functions: 0.
- Hosting changed: no.
- Firestore Rules changed: no.
- Firestore indexes changed: no.
- Temporary validation workflow retired before merge.

No production data writes or Firebase deployment were required for Brick 5A.
