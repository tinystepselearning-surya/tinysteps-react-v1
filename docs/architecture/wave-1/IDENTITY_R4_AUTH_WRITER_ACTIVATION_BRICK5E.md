# Wave 1 R4 — Brick 5E: Auth-backed canonical writer activation

**Status:** COMPLETE — production deployed and canary verified  
**Scope:** production wiring for generic auth-backed identity writers  
**Reader authority cutover:** no  
**Firestore Rules authority cutover:** no  
**Legacy write freeze:** no  
**Destructive retirement:** no

## Purpose

Bricks 5A–5D established and tested the canonical identity contract and the create,
update/role-transition, archive, teacher-profile, and compatibility-projection writers.

Brick 5E activates those writers behind the existing production user-management surfaces
while preserving the current UID-keyed operational compatibility layer.

## Identity invariant

For newly-created generic auth-backed users:

~~~text
Tiny Steps Person ID != Firebase UID
~~~

The Person ID is generated independently from Firebase Authentication.

~~~text
people/{personId}

authIdentities/{deterministicId}
  provider = firebase
  providerSubject = firebaseUid
  personId = personId
~~~

No activated writer infers Person ID from Firebase UID.

Existing migrated accounts may still have the same opaque value for Person ID and UID.
That remains legacy adoption, not a rule for new identities.

## Activated generic roles

The generic User Management flow supports:

~~~text
admin
founder
teacher
parent
learningPartner
~~~

Learners and School Admins are intentionally removed from the generic Create/Edit role
selectors.

- learners use the canonical learner/admission flow;
- school admins use the organisation/school membership flow.

New generic accounts may be created as active or suspended. Archive is a separate
lifecycle action.

## Production callable routing

The existing production Function names retain their original export modules so deployment
impact remains bounded:

~~~text
adminCreateUser
adminUpdateUser
adminArchiveUser
adminSetUserRole
~~~

Those modules now delegate to the validated canonical implementations.

A new callable is added:

~~~text
updateTeacherProfile
~~~

### Create

`adminCreateUser` now:

1. validates admin authority;
2. generates a Tiny Steps Person ID independently;
3. creates the Firebase Auth user;
4. sets role claims;
5. writes Person, AuthIdentity, RoleAssignment, PersonContact and applicable private state;
6. writes temporary UID-keyed compatibility documents;
7. compensates by deleting the Auth user if the Firestore transaction fails before commit;
8. returns both `uid` and `personId`.

### Update / role transition

`adminUpdateUser` and `adminSetUserRole` first resolve:

~~~text
firebaseUid -> AuthIdentity -> personId
~~~

They then update canonical Person/AuthIdentity/contacts/RoleAssignments and UID-keyed
compatibility state together.

Role transitions preserve role history:

~~~text
old RoleAssignment -> inactive
new RoleAssignment -> active/inactive from lifecycle state
~~~

Auth/claims changes are compensated when the canonical Firestore transaction fails before
commit.

### Archive

`adminArchiveUser` resolves UID -> Person, disables Firebase Auth, and canonically writes:

~~~text
people/{personId}.status = archived
authIdentities/{id}.status = archived
roleAssignments/{id}.status = inactive
personLifecycle/{personId}.archivedAt = server timestamp
~~~

The Auth disabled flag is compensated if the canonical transaction fails before commit.

### Teacher self-profile

Teacher profile edits no longer perform a browser-side:

~~~text
setDoc(users/{uid})
~~~

The browser calls `updateTeacherProfile`.

The callable writes canonical contact/private state and the temporary UID-keyed
compatibility profile. Bank/UPI/emergency fields are therefore no longer authored directly
from the browser.

## Decoupled legacy-sync protection

The live `users/{firebaseUid}` legacy-sync path now recognizes a canonical compatibility
projection only after corroborating all three layers:

~~~text
users/{firebaseUid}._wave1CanonicalProjection
people/{personId}.canonicalAuthority
authIdentities/{firebaseAuthIdentityId}
~~~

The command, write ID, Person ID, provider and Firebase provider subject must agree.

A valid canonical compatibility write therefore does not rematerialize:

~~~text
people/{firebaseUid}
~~~

for a decoupled user.

Malformed, forged or stale markers do not suppress legacy synchronization.

## Shadow-read compatibility

The user identity shadow adapter now uses:

~~~text
users/{uid}.canonicalPersonId || uid
~~~

This keeps legacy-adopted users compatible while making shadow verification correct for
new UID-decoupled users.

## User-management safety changes

The activation also:

- removes Kid and School Admin from generic Create/Edit role selectors;
- removes Archived from generic update status; archive uses the dedicated action;
- disables Edit/Archive for roles outside the generic identity flow;
- disables legacy hard-delete for all identity-bearing roles;
- removes the obsolete full `kids` collection read from Create User;
- removes the unused child-assignment field from generic parent creation;
- removes the client-side `adminToken` payload;
- removes debug logging that could echo submitted user/profile data or token fragments.

## Architecture test alignment

Three stale architecture tests were corrected to match already-upgraded production
contracts:

- teacher earning adjustment authorization now asserts `ensureAdmin(...)`;
- teacher pay withholding authorization now asserts `ensureAdmin(...)`;
- learner creation authorization now asserts `ensureAdmin(...)` plus
  `canonicalPrimaryWriter`, rather than direct `users` collection access.

The focused correction run passed before the final activation acceptance run.

## Build hygiene

The parent payment dialog already used `@/lib/tinyStepsPaymentDetails`, but
`tsconfig.json` lacked the corresponding TypeScript alias.

Brick 5E adds:

~~~json
"@/lib/*": ["src/lib/*"]
~~~

The underlying module already existed; no payment behavior or payment details were changed.

## Acceptance validation

Acceptance head:

~~~text
baebb59b668aa11574bfa0de6df573023d452567
~~~

Acceptance workflow:

~~~text
Run ID: 37206842107
Result: success
~~~

Validated gates:

- Functions TypeScript build: passed.
- Frontend TypeScript typecheck: passed.
- Focused Functions identity tests: **84/84 passed** across 10 files.
- Activation/authorization/browser routing tests: **35/35 passed** across 5 files.
- Playwright Chromium production-prerender dependency: installed successfully.
- Deployable Hosting build/prerender: passed.
- Deployment impact resolution: passed.
- Temporary activation workflow removed before merge.

## Deployment impact

The impact analyzer reports:

~~~text
Functions source changed: true
Functions validation required: true
Functions deployment required: true
Functions full deployment: false
Functions impacted: 15
Hosting changed: true
Firestore Rules changed: false
Firestore indexes changed: false
~~~

The bounded Function target set is:

~~~text
adminArchiveUser
adminCreateUser
adminSetUserRole
adminUpdateUser
assignLPToParent
assignLPToTeacher
backfillTeacherDocs
getParentWorksheetResources
onWave1LegacyKidIdentityWrite
onWave1LegacySchoolIdentityWrite
onWave1LegacySchoolUserIdentityWrite
onWave1LegacyUserIdentityWrite
unassignLPFromParent
unassignLPFromTeacher
updateTeacherProfile
~~~

Some unchanged callable behavior appears in the bounded target list because those Functions
share source modules with the activated role/identity code. The deployment is still bounded;
it is not a full Functions deployment.

## Production deployment evidence

Brick 5E merged to `main` as PR #603.

~~~text
Main merge commit: 87e0c0ef0a92755374cba2bfc9fb3baa694b4340
Deploy workflow run: 37207219299
Deploy run number: 3875
Result: success
Completed: 2026-10-04T14:02:52Z
~~~

Deployment facts:

- bounded Functions deployment: **15/15 ready**;
- full Functions deployment: **no**;
- Hosting deployment: **success**;
- Firestore Rules deployed: **no**;
- Firestore indexes deployed: **no**;
- recovery job required: **no**.

The deployed Function set matched the validated impact plan exactly.

## Production canary evidence

A dedicated suspended Parent test identity created through the live Admin User Management
screen was used as the create-path canary. The verifier recorded only privacy-safe hash
tokens for UID, Person ID and email.

~~~text
Canary verification workflow run: 37209875109
Result: success
Role: parent
Status: suspended
~~~

Verified invariants:

- exactly one matching Firestore compatibility user exists;
- exactly one matching Firebase Auth account exists;
- Firebase Auth account is disabled for suspended status;
- `users/{uid}.canonicalPersonId` is present;
- Firebase UID and canonical Person ID are different;
- `people/{personId}` exists;
- **`people/{firebaseUid}` does not exist**;
- deterministic Firebase AuthIdentity exists;
- AuthIdentity provider is `firebase`;
- AuthIdentity providerSubject equals Firebase UID;
- AuthIdentity personId equals canonical Person ID;
- global Parent RoleAssignment exists and belongs to the Person;
- UID-keyed `users/{uid}` compatibility document exists;
- UID-keyed `parents/{uid}` compatibility mirror exists and points to the Person;
- Firebase Auth disabled state matches suspended lifecycle state.

Privacy-safe evidence tokens:

~~~text
uid:      e2003bba0d50
personId: b30a7af631c7
email:    44d55924fce0
~~~

No raw Firebase UID or Person ID is recorded in the architecture evidence.

## Brick 5E verdict

All activation gates are satisfied.

R4 auth-backed canonical-primary writes are now **production-active** for the approved
generic roles:

~~~text
admin
founder
teacher
parent
learningPartner
~~~

Compatibility roots remain UID-keyed until the later reader/rules and role-root key
cutovers. This does not authorize R5–R8 retirement actions.
