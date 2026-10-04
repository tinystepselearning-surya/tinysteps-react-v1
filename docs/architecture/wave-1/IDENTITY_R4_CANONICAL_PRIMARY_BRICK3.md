# Wave 1 — R4 Brick 3: Canonical-Primary Legacy Parent Student Callable

**Lifecycle stage:** R4 — canonical-primary create/update paths  
**Brick:** 3  
**Production entry point:** `createStudentForParent`  
**Production state in this implementation commit:** pending deployment  
**Reader cutover:** no  
**Security Rules cutover:** no  
**Legacy write freeze:** no  
**Destructive retirement:** no

## Purpose

Brick 3 migrates the remaining server-side learner-creation callable:

~~~text
createStudentForParent
~~~

from its historic nested legacy write:

~~~text
parents/{parentId}/students/{studentId}
~~~

to the same canonical-primary learner command used by `adminCreateStudent`.

Repository search finds no current application caller for this callable outside its export, and the verified Wave 0 production identity audit found:

~~~text
root students documents: 0
nested parents/*/students/* documents: 0
~~~

Therefore Brick 3 must not resurrect an empty legacy namespace merely for compatibility.

## Canonical creation path

The callable delegates to:

~~~text
executeCanonicalLearnerCreate
~~~

which creates the learner through the canonical identity/profile model first:

~~~text
people/{personId}
learnerProfiles/{personId}
guardianRelationships/{relationshipId}
learnerDetails/{personId}          when non-sensitive details exist
learnerPrivateProfiles/{personId}  when sensitive/private details exist
learnerReadModels/{personId}
~~~

Temporary compatibility remains only on legacy surfaces that are still proven live:

~~~text
kids/{personId}
users/{parentId}.childIds[]
~~~

No `parents/{parentId}/students/{personId}` document is created.

## Rich learner field ownership

The dormant callable historically accepted fields that did not appear in the R1/R2 production field inventory because the nested student collection contained zero live documents.

Brick 3 assigns permanent ownership before allowing those fields to be written again.

### General learner detail

~~~text
learnerDetails/{personId}
~~~

owns:

~~~text
preferredName
grade
board
gender
profilePhotoUrl
~~~

These are non-identity learner profile details.

### Restricted learner-private profile

~~~text
learnerPrivateProfiles/{personId}
~~~

owns:

~~~text
notes
emergencyContact
medicalNotes
~~~

This collection is written only by Admin SDK code.

There is deliberately no Firestore Rules match granting browser access to `learnerPrivateProfiles`, so it remains client-inaccessible under the current default-deny ruleset. A future reader must introduce an explicit restricted access contract before client exposure is permitted.

Sensitive values are not copied into the root `kids` compatibility document.

## Course assignment is not learner profile authority

The old callable accepted:

~~~text
courses[]
~~~

but only stored the strings on the nested student document. It did not create authoritative Enrollment records.

Brick 3 does not convert those strings into learner-profile authority and does not invent Enrollment records.

If a caller supplies a non-empty `courses[]`, the callable fails closed with:

~~~text
failed-precondition
~~~

and directs the caller to:

~~~text
create learner
→ admission/enrollment workflow
~~~

This preserves the architecture rule that programme/course participation belongs to Enrollment and related operational models.

## Legacy status handling

The old callable accepted:

~~~text
active
inactive
trial
~~~

The canonical Person status contract is:

~~~text
active
suspended
archived
~~~

There is no approved semantic mapping from the old `trial` or `inactive` values to a canonical Person lifecycle state.

Brick 3 therefore:

- accepts `active`;
- fails closed on `trial`;
- fails closed on `inactive`.

Trial/admission state belongs to admission/enrollment workflow, not Person identity.

No status is silently reinterpreted.

## Existing request/response compatibility

The callable continues to accept its historic request fields, including legacy DOB input. DOB is used only to calculate `ageYears` and is never stored.

The response continues to provide:

~~~text
success
parentId
studentId
message
timestamp
~~~

and adds:

~~~text
consistencyVerified
~~~

The returned `studentId` is now the canonical learner Person ID.

## Parent authority

The shared canonical writer requires:

~~~text
people/{parentId}
roleAssignments/{global parent role}
~~~

to establish parent authority.

It also requires the current `users/{parentId}` compatibility document only because `childIds[]` remains an active compatibility projection until later cutover.

The callable remains Admin-only. The shared Admin authorization helper is unchanged in this brick; authorization reader cutover belongs to R5.

## Privacy and telemetry

New Brick 3 telemetry uses deterministic namespaced SHA-256 identity tokens.

It does not emit:

- learner names;
- raw learner IDs;
- raw parent IDs;
- raw actor IDs;
- medical notes;
- emergency contact data;
- private notes.

Firestore telemetry writes remain zero.

## Legacy footprint

Brick 3 intentionally reduces future legacy footprint:

~~~text
parents/{parentId}/students/*  -> no new writes
root students/*                -> no new writes
~~~

The only retained learner compatibility writes are:

~~~text
kids/{personId}
users/{parentId}.childIds[]
~~~

because current readers still require them.

## Explicitly not cut over

Brick 3 does not migrate:

- browser-side `kidsService.createKid`;
- browser-side `kidsService.updateKid`;
- Student Management direct learner updates;
- auth-backed user creation/update;
- school identity writers;
- readers;
- Firestore Security Rules authority;
- legacy write freeze;
- destructive retirement.

## Validation

Focused validation covers:

~~~text
functions/test/canonicalPrimaryPlanner.spec.ts
functions/test/canonicalPrimaryWriter.spec.ts
functions/test/identityLegacySync.spec.ts
functions/test/parentStudentsCanonicalPrimary.spec.ts
~~~

Required gates before merge:

1. Functions TypeScript build passes.
2. rich learner detail routing is deterministic;
3. sensitive fields route only to `learnerPrivateProfiles`;
4. the `kids` compatibility projection contains no private fields;
5. no nested parent/student writes remain;
6. non-empty legacy `courses[]` fails closed;
7. legacy `trial` / `inactive` status fails closed;
8. existing Brick 2 and legacy-sync tests remain green;
9. production deployment impact is bounded;
10. the temporary validation workflow is removed before merge.

## Production activation rule

Merging implementation to `main` is not sufficient to expand the recorded production write scope.

The manifest may add:

~~~text
createStudentForParent:learner_create
~~~

to the active canonical-primary scope only after:

1. the bounded Functions deployment succeeds;
2. the Functions production marker advances;
3. production deployment evidence is recorded.

Because repository evidence shows no active application caller, a synthetic live invocation is not required merely to prove an unused API path. If this callable becomes actively used later, the first live invocation should be checked through the same bounded canonical/compatibility verification used for Brick 2.
