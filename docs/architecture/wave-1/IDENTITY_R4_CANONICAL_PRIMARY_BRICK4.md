# Wave 1 — R4 Brick 4: Browser Learner Writer Cutover

**Lifecycle stage:** R4 — canonical-primary create/update paths  
**Brick:** 4  
**Scope:** browser-side learner create/update writers  
**Reader cutover:** no  
**Security Rules cutover:** no  
**Legacy write freeze:** no  
**Destructive retirement:** no  
**Auth-backed user writer cutover:** no

## Purpose

Brick 4 removes the remaining browser-authoritative learner identity/profile writes.

## Production paths

- Student Management inline create now calls `adminCreateStudent`.
- Edit Student now calls the new admin-only `adminUpdateStudent` callable.
- Learning Partner assignment remains owned by the selected Enrollment; the child-level `kids.lpId` mirror is no longer written.
- `kidsService.createKid` and `kidsService.updateKid` are retired.

## Canonical learner update

`adminUpdateStudent` updates canonical state first:

- `people/{personId}`
- `learnerProfiles/{personId}`
- `learnerDetails/{personId}`

It then updates the temporary `kids/{personId}` compatibility projection in the same transaction.

The compatibility marker uses:

~~~text
authority = canonical-primary
command = learner_update
writeId = unique per update
canonicalPersonId = learner Person ID
~~~

The legacy-sync bridge suppresses the compatibility event only when the marker is corroborated by the matching `people/{personId}.canonicalAuthority`. Unmarked or forged browser/legacy edits remain eligible for legacy reconciliation during the transition.

## Lifecycle status

Ordinary `active` / `suspended` profile changes use `adminUpdateStudent`.

A transition into `archived` remains owned by `archiveKid`. When the edit dialog also changes profile fields, the canonical profile edit runs first and the lifecycle archive runs second.

## Out of scope

This brick does not authorize:

- canonical-primary reads;
- Firestore Security Rules authority changes;
- Firebase Auth / auth-backed user writer cutover;
- legacy write freeze;
- deletion of legacy collections or compatibility documents.

## Regression guards

- canonical update field normalization and fail-closed validation;
- corroborated `learner_update` projection suppression;
- inline create cannot use `addDoc(...kids...)`;
- Edit Student cannot call `updateKid`;
- LP assignment cannot update child-level LP state;
- `kidsService` no longer exports learner create/update writers.


## Validation gate

Branch validation completed successfully in workflow run `37201998962`.

- Functions TypeScript build: passed.
- Focused Functions tests: **33/33 passed**.
- Browser/lifecycle regression guards: **10/10 passed**.
- Functions deployment required: yes.
- Full Functions fleet deployment: no.
- Impacted Functions: **7** — `adminCreateStudent`, `adminUpdateStudent`, `createStudentForParent`, and the four Wave 1 legacy identity triggers.
- Hosting deployment required: yes.
- Firestore Rules deployment required: no.
- Firestore indexes deployment required: no.

## Production deployment

Production deployment completed successfully in Firebase workflow run `37202185246` / run number **3869** for merge commit `8fc827c9ef11e91e09f83f54313b49e05284dbdb`.

- Functions deployment: targeted, not full fleet.
- Batch 1: `adminCreateStudent`, `adminUpdateStudent`, `createStudentForParent`.
- Batch 2: `onWave1LegacyKidIdentityWrite`, `onWave1LegacySchoolIdentityWrite`, `onWave1LegacySchoolUserIdentityWrite`, `onWave1LegacyUserIdentityWrite`.
- Cloud Functions readiness verification: **7/7 ready**.
- Hosting production deployment: succeeded.
- Live deployment integrity/build identity verification: succeeded.
- Functions production baseline advanced to the merge commit.
- Hosting production baseline advanced to the merge commit.
- Firestore Rules deployment: not required.
- Firestore indexes deployment: not required.

The browser learner create/update cutover is now production-active.

The dedicated test parent/student identities are retained for later controlled production verification. Their canonical identity records are not cleanup targets. Any test enrollment or recurring schedule must remain disabled/archived so the retained identities do not generate operational sessions, reminders, attendance, teacher earnings, billing, or unnecessary Firestore activity.

R4 remains partial: auth-backed user writers, reader authority, Firestore Rules authority, legacy write freeze, and destructive retirement are still not authorized.
