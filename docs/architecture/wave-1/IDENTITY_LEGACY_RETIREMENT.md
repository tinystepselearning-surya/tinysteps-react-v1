# Wave 1 — Canonical Identity Legacy Retirement

**Goal:** migrate every required identity/profile/access field out of the legacy identity stores, make canonical writes authoritative, move all readers and security rules, freeze legacy writes, reconcile, and retire the legacy identity documents.

## User-approved end state

The temporary dual-model period is not the final architecture.

The end state is:

- new users are created in canonical identity/profile structures;
- new learners are created in canonical identity/profile structures;
- school access uses canonical organisation membership;
- application authorization no longer requires `users/{uid}`;
- parent/teacher/learner access no longer requires legacy identity fields on `users` or `kids`;
- the compatibility sync bridge is retired;
- legacy identity documents are removed only after every required field and reader has a permanent replacement.

Existing Firebase UIDs remain stable. Preserving a Firebase UID is identity continuity, not preservation of the old document model.

## Why deletion cannot be the first action

BACKFILL and VERIFY migrated the Wave 1 **identity graph**:

- Person
- Firebase AuthIdentity
- RoleAssignment
- LearnerProfile
- GuardianRelationship
- Organisation
- OrganisationMembership

The legacy documents still contain additional profile and operational fields that were deliberately outside that identity-only migration.

Examples include:

- user email/phone/contact details;
- role-specific profile fields;
- legacy child/LP assignment mirrors;
- learner grade and operational summary fields;
- school contact/location data;
- school Learning Partner assignment metadata;
- live Firestore Security Rules and backend/frontend readers that still reference legacy collections;
- subcollections under legacy document paths.

Deleting the parent documents before those dependencies move would create data loss or production authorization failures.

## Retirement sequence

### R1 — field and dependency inventory

Run a privacy-safe production audit over:

~~~text
users
kids
schools
schoolUsers
~~~

The audit records:

- document counts;
- every field path;
- field type frequency;
- known destination category;
- whether that field blocks retirement;
- role/profile mirror coverage;
- canonical collection counts;
- known legacy subcollection namespaces.

The report never includes names, email values, phone values or raw document IDs.

### R2 — canonical profile completion

Add permanent canonical destinations for fields not represented in the current identity core.

Expected categories include:

~~~text
personContacts
role-specific profiles
extended learnerProfiles
organisation/school profiles
explicit operational relationships
~~~

Existing role-specific profile collections may be promoted to permanent profile stores where their schema and ownership are appropriate.

No field is dropped merely because it looks redundant. A field may be removed only after its replacement/derivation is proven.

### R3 — production backfill and independent verification

Backfill the newly added profile/relationship targets from legacy source data.

Requirements:

- deterministic/idempotent;
- bounded writes;
- checkpoint/resume;
- no raw PII in reports;
- independent verifier;
- exact zero-blocker reconciliation before authority changes.

### R4 — canonical-primary create/update paths

Change admin/backend identity writers so new records are created in canonical structures first.

During a short compatibility interval, any legacy document still required by an unmigrated reader is generated as a **compatibility projection only**.

It is no longer the source of truth.

### R5 — reader and Firestore Rules cutover

Move all production consumers off legacy identity authority, including:

- backend callables;
- frontend queries;
- Firestore Security Rules;
- parent/teacher/admin/school authorization;
- messaging and display-name resolution;
- billing/attendance lookups;
- scheduling teacher/parent lookups;
- school portal access.

No legacy collection can be retired while a live authorization or business-critical reader still depends on it.

### R6 — legacy subcollection relocation

Known legacy child namespaces include:

~~~text
users/{uid}/progress
users/{uid}/gameStats

kids/{kidId}/progress
kids/{kidId}/curriculum
kids/{kidId}/gameSessions
kids/{kidId}/gameProgress

schools/{schoolId}/academicYears
schools/{schoolId}/learningPartnerAssignments
schools/{schoolId}/activity
~~~

These must either move to canonical/permanent parent paths or be explicitly retained as non-identity domain data under a permanent renamed/defined model.

Deleting a Firestore parent document does not automatically migrate/delete its subcollections, so this is an explicit retirement gate.

### R7 — freeze legacy writes

Once all readers have moved:

- block application writes to legacy identity documents;
- remove compatibility projection writers;
- observe for unexpected attempted legacy writes;
- run a final canonical reconciliation.

### R8 — destructive retirement

Only after all gates are green:

- export/retain the required audit evidence;
- delete legacy identity documents in bounded batches;
- verify no canonical/reference regressions;
- remove obsolete code, rules, indexes and triggers;
- mark Wave 1 legacy retirement complete.

## Current field classification

The audit currently recognizes these categories.

### `users`

Already represented by canonical identity:

~~~text
uid
userId
displayName
name
firstName
lastName
status
countryCode
role
rawRole
roles
~~~

Require permanent contact/profile/relationship handling before deletion:

~~~text
email
phone
phoneCountryCode
phoneLocal
address
city
state
pincode
communicationLanguage
sessionTime
paymentMethods
preferences
qualification
specialization
yearsExperience
bio
region
bankAccountNumber
bankIfscCode
bankAccountHolderName
bankDetails
creditsBalance
childIds
assignedLPs
assignedTeachers
assignedParents
~~~

Compatibility-only candidates that still require verification before dropping:

~~~text
provider
permissions
~~~

### `kids`

Already represented by canonical identity:

~~~text
fullName
name
displayName
studentName
firstName
lastName
status
countryCode
parentId
parentIds
primaryParentId
~~~

Require permanent learner/domain handling:

~~~text
age
ageYears
grade
gender
school
schoolName
teacherId
teacherIds
assignedTeacherId
primaryTeacherId
teacherUid
teacher_id
lpId
assignedLPs
courseId
courseIds
enrollmentId
enrollmentIds
summary
~~~

### `schools`

Already represented or partially represented by `organisations`:

~~~text
name
status
countryCode
schoolCode
~~~

Require permanent organisation profile/relationship handling:

~~~text
nameSearch
contact
location
learningPartnerId
learningPartnerName
learningPartnerEmail
learningPartnerAssignedAt
~~~

### `schoolUsers`

Expected to be fully replaceable by:

~~~text
organisationMemberships
roleAssignments
~~~

for:

~~~text
userId
role
schoolIds
primarySchoolId
status
~~~

Any production field not in the known map appears as an **unclassified blocker**.

## Audit command

From the repository root:

~~~bash
node scripts/wave1-identity-legacy-retirement-audit.mjs \
  --project tinysteps-react-v1
~~~

The command is read-only against Firestore and Firebase Auth.

Expected terminal footer:

~~~text
Firestore writes performed: 0
Auth writes performed: 0
~~~

The generated report is written under:

~~~text
reports/wave1-identity-legacy-retirement-audit-*.json
~~~

## Retirement gate

Legacy deletion is prohibited unless all of the following are true:

~~~text
unknown field mappings             = 0
required field migrations pending  = 0
missing required role profiles     = 0
canonical reconciliation failures  = 0
legacy-primary readers              = 0
legacy-primary security rules       = 0
legacy-primary writers              = 0
unmigrated legacy subcollections    = 0
~~~

Only then can destructive deletion be considered complete and safe.
