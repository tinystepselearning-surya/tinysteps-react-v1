# Wave 1 — Identity Profile Retirement Migration

**Migration ID:** `wave1-identity-profile-retirement-v1`  
**Purpose:** move the remaining mandatory data required to retire `users`, `kids`, `schools`, and `schoolUsers` as identity authorities.

## Preconditions

The Wave 1 identity core is already reconciled:

~~~text
Expected canonical core documents: 1265
Matched:                          1265
Missing:                             0
Drifted:                             0
Conflicts:                           0
Unexpected:                          0
Blocking source issues:              0
~~~

The production retirement inventory then found:

~~~text
users:       225 docs / 46 field paths
kids:        196 docs / 100 field paths
schools:       1 doc  / 23 field paths
schoolUsers:   1 doc  / 10 field paths

blocking field mappings: 135
initially unclassified paths: 43
missing role/profile mirrors: 1
~~~

The 43 previously unclassified paths now have explicit dispositions in the retirement field map.

## Separation of concerns

The migration does not turn `people` into another giant legacy document.

Permanent state is split by responsibility.

### Identity core — unchanged

~~~text
people
authIdentities
roleAssignments
learnerProfiles
guardianRelationships
organisations
organisationMemberships
~~~

This migration does not mutate those collections.

### Person contact

~~~text
personContacts/{personId}
~~~

Carries the app contact/location metadata currently needed outside Firebase Auth:

~~~text
email
phone
phoneCountryCode
phoneLocal
whatsappE164
timezone
countryCodeSource
countryCodeUpdatedAt
~~~

`people.countryCode` remains the canonical country identity attribute.

### Role profiles

Existing role/profile mirror collections are promoted into permanent role profile stores:

~~~text
parents/{personId}
teachers/{personId}
learningPartners/{personId}
admins/{personId}
~~~

They receive canonical profile metadata plus only role-profile fields that exist for the source user.

Legacy aliases are normalized rather than duplicated:

~~~text
qualification / qualifications
  -> qualifications

specialization / specializations
  -> specializations[]

languages / languagesSpoken
  -> languages[]
~~~

Other profile fields include, where present:

~~~text
yearsExperience
city
bio
region
preferences
~~~

The missing production role/profile mirror is created by this migration.

These collections are role profile stores, not Person authorities.

### Restricted staff-private profile

Sensitive staff fields are moved out of the general identity/contact profile:

~~~text
staffPrivateProfiles/{personId}
~~~

Fields include:

~~~text
bankAccountNumber
bankAccountHolderName
bankIfscCode
upiId
emergencyContactName
emergencyContactPhone
~~~

The historical `bankAccount` alias is normalized into `bankAccountNumber`.

The collection remains client-inaccessible until an explicit restricted access contract is introduced. Migration uses Admin SDK only.

### Person lifecycle metadata

~~~text
personLifecycle/{personId}
~~~

Preserves legacy archival facts without expanding the verified Person schema:

~~~text
archivedAt
archivedBy
archivedReason
~~~

Person status itself remains in `people` / `learnerProfiles`.

### Learner detail

~~~text
learnerDetails/{personId}
~~~

Carries non-identity learner details that were not part of the Wave 1 identity core:

~~~text
grade
~~~

Legacy `kids.age` does not require another migration. The original canonical materializer already maps it into:

~~~text
learnerProfiles.ageYears
~~~

### Learner derived read model

~~~text
learnerReadModels/{personId}
~~~

Preserves the current derived root snapshots:

~~~text
summary
progress
~~~

This includes the existing `progress.byGame.letter-tracing` snapshot and the current summary/game aggregate tree.

These are explicitly derived data, not identity authority.

Later reader/writer cutover can rebuild or maintain this target from the canonical game/session sources.

### Learner repair provenance

~~~text
learnerProvenance/{personId}
~~~

Preserves repair audit fields:

~~~text
repairedFromBrokenStudentId
repairedFromEnrollmentId
repairSource
~~~

These are historical provenance, not live learner identity.

### Organisation profile

~~~text
organisationProfiles/{organisationId}
~~~

Carries school profile/operational metadata outside organisation identity:

~~~text
contact
location
nameSearch
currentAcademicYearId
~~~

### Organisation assignment

Current school Learning Partner assignment moves to:

~~~text
organisationAssignments/{deterministicId}
~~~

Fields:

~~~text
organisationAssignmentId
organisationId
personId
role = learningPartner
status = active
assignedAt
~~~

The deterministic ID is SHA-256-derived from:

~~~text
organisationAssignment
organisationId
personId
role
~~~

The old school-level `learningPartnerName` and `learningPartnerEmail` are denormalized snapshots.

They are not copied into the canonical assignment. Before they can be retired, the migration gate verifies that they agree with the referenced current LP user identity/contact. A mismatch blocks the write and requires explicit resolution.

## Derived relationship fields

Two legacy field families should not become new competing authorities.

### users.childIds

This is a convenience backlink.

Canonical relationship authority is:

~~~text
guardianRelationships
~~~

Before profile-retirement write mode is allowed, every legacy `users.childIds[]` entry must already be represented by a canonical guardian relationship.

If any backlink is not represented:

~~~text
legacy_child_backlink_missing_canonical_guardian_relationship
~~~

blocks the migration.

### kids.teacherId / kids.teacherIds

These are compatibility assignment fields.

The current delivery relationship remains represented through Enrollment.

Before those learner fields may be retired, every legacy teacher ID must be represented by at least one usable, non-archived Enrollment for that learner.

If not:

~~~text
legacy_kid_teacher_missing_usable_enrollment_assignment
~~~

blocks the migration.

This avoids creating a second new teacher-assignment authority during identity retirement.

## Write contract

Executor:

~~~text
scripts/wave1-identity-profile-retirement.mjs
~~~

Planner:

~~~text
scripts/migrations/wave1-identity-profile-retirement-lib.mjs
~~~

Modes:

~~~text
--dry-run
--write --limit N --confirm-project tinysteps-react-v1
--reconcile
~~~

Write limits:

~~~text
maximum source records/run: 250
maximum Firestore writes/batch: 100
~~~

Resume behavior is state-driven and idempotent rather than cursor-driven.

Every run re-derives expected state from current legacy source documents and selects only source records with missing/drifted target projections.

A completed target is therefore naturally skipped on the next run.

## Merge-only safety

This migration performs no destructive legacy mutation.

Writes use:

~~~text
set(..., { merge: true })
~~~

Existing unrelated fields in role profile documents remain intact.

New migration-owned targets fail closed if a conflicting identity or another migration owner is encountered.

This migration does not:

- delete a legacy document;
- delete a canonical/profile document;
- change Firebase Auth;
- change Firebase UID;
- mutate Wave 1 identity-core documents;
- authorize legacy retirement;
- change application read/write authority.

## Privacy

Reports contain:

- collection/count summaries;
- classifications;
- issue codes;
- 12-character SHA-256 source tokens.

Reports do not contain:

- names;
- email values;
- phone values;
- bank data;
- raw source IDs.

## Production dry-run command

~~~bash
node scripts/wave1-identity-profile-retirement.mjs \
  --dry-run \
  --project tinysteps-react-v1
~~~

Write mode must not be used until the dry run shows:

~~~text
Core issues: 0
Derived relationship issues: 0
Conflicts: 0
Ready for bounded write: true
~~~

## After this migration

A successful reconciliation proves that the mandatory root-document data required for retirement has a permanent destination.

It does **not** yet authorize deletion.

Remaining retirement gates still include:

1. independent profile-migration verification;
2. canonical-primary create/update paths;
3. backend/frontend reader cutover;
4. Firestore Security Rules cutover;
5. legacy nested/subcollection migration;
6. freeze legacy writes;
7. observe attempted legacy writes;
8. final no-loss reconciliation;
9. bounded destructive retirement.
