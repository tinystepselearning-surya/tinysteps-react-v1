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
