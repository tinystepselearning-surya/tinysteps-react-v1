# AV3.2 — Production Staff Identity Registry Wiring

Status: **implemented as a privacy-minimized production registry with automatic safe binding from fresh AVS evidence plus the existing admin-triggered cached-evidence maintenance path. There is no scheduler, no Graph directory lookup, and no operational attendance or finance write.**

## Purpose

AV3 already knows how to classify Microsoft Teams participants as:

- expected teacher;
- other Tiny Steps staff;
- learner-side participant;
- ambiguous staff.

This brick wires that logic to the real Tiny Steps staff directory safely.

The core requirement is conservative:

> A participant may be removed from learner-side evidence only when Tiny Steps can recognize that participant as internal staff through a deterministic staff identity signal.

## Production authority

Operational Tiny Steps `users` documents remain the authority for whether an account is internal staff and for the canonical `staffId`.

For teachers, the canonical Tiny Steps `teacherId` is the Firebase Auth UID, so the registry uses the user's canonical `uid` when present and falls back to the user-document id only for compatibility.

The production loader recognizes only internal staff-side roles:

```text
admin
teacher
learningPartner
learning-partner
rm   (legacy internal role)
```

Customer-side `schoolAdmin` identities are intentionally **not** classified as Tiny Steps staff-side. This prevents a school/customer participant from being silently excluded from learner-side evidence.

Inactive, suspended, archived, or deleted staff records are excluded.

## Identity signals

Each active internal staff entry supplied to AV3 contains only:

```text
staffId
role
emailAddressHash
microsoftIdentityIdHashes[]
```

### Email hash

The loader reads the existing Tiny Steps user email transiently, normalizes it to lowercase, hashes it with the same SHA-256 function used by AV2, and returns only the hash.

The raw email is not copied into the AVS registry result.

This gives us immediate compatibility with the existing business rule that Tiny Steps teachers join classes from Tiny Steps-managed Microsoft email accounts.

### Stable Microsoft identity

Stable Microsoft/Entra identity remains stronger than email when Graph supplies it.

Verified Microsoft identity hashes may be stored in the validation-owned collection:

```text
attendanceValidationStaffIdentities/{staffId}
```

Example logical shape:

```text
staffId: canonical Tiny Steps UID
status: active
emailAddressHash: optional SHA-256 hash
microsoftIdentityIdHashes:
  - SHA-256 hash of verified Microsoft identity id
```

Only hashes are accepted. Raw Microsoft object IDs or raw email addresses are rejected as invalid registry values.

No additional Microsoft Graph directory permission is required by this brick.

## Precedence

AV3.1 precedence remains unchanged:

1. stable Microsoft identity match when Graph supplies one;
2. email hash only as fallback when no stable identity is available;
3. stable identity/email disagreement -> REVIEW;
4. duplicate ownership -> REVIEW;
5. display names are never used.

The new registry adapter does not weaken those rules.

## Registry integrity checks

The builder explicitly reports:

- override for a user who is not active internal staff;
- malformed email hash;
- malformed Microsoft identity hash;
- duplicate email-hash ownership;
- duplicate stable-Microsoft-identity ownership;
- active staff with no usable identity signal.

These are diagnostic registry issues. They do not mutate attendance.

## Read/write boundary

This brick performs only:

```text
READ users
READ attendanceValidationStaffIdentities
BUILD privacy-minimized registry in memory
RETURN registry to AV3
```

It does **not** write:

- `users`;
- `classSessions`;
- `enrollments`;
- attendance;
- billing;
- teacher earnings;
- reschedule credits;
- correction records.

It does not populate `attendanceValidationStaffIdentities` in the background. Provisioning is allowed only through an explicit admin-triggered rollout that proves a unique mapping from cached AVS attendance evidence using the canonical Tiny Steps teacher email hash plus exactly one stable Microsoft identity hash. Ambiguous, conflicting, incomplete, duplicate-owned, disabled, or mismatched identities remain unchanged and route to review.

## Runtime use

`loadProductionStaffIdentityRegistry(db)` should be loaded once per AVS validation run and the returned `entries` passed into `bridgeEnrollmentIdentity(...)`.

It should not be reloaded separately for every class session.

## Explicit multi-teacher rollout

The Admin Attendance Validation screen can invoke `runAttendanceValidationLatestCheck` with `mode = identity_rollout`.

This mode:

1. reads only cached `attendanceValidationCases` and their referenced `attendanceValidationEvidence`;
2. considers active Tiny Steps users whose canonical role is `teacher`;
3. matches a teacher only when the cached attendance participant email hash equals that teacher's canonical Tiny Steps email hash;
4. permits one or more complete same-day attendance reports to contribute identity evidence;
5. requires exactly one stable Microsoft identity hash across all eligible cached evidence;
6. rejects duplicate email ownership, multiple observed identities, an identity already owned by another staff member, a different existing identity, or a disabled override;
7. stores hashes only in `attendanceValidationStaffIdentities/{teacherId}`;
8. revalidates cached AVS cases against the updated in-memory staff registry;
9. makes **zero Microsoft Graph calls** during rollout/revalidation;
10. preserves AV7 admin-resolved cases.

No raw Microsoft object ID or raw email is returned to the browser or written into the override collection.

## Test coverage

Regression tests cover:

- canonical Tiny Steps UID as staffId;
- email normalization + hashing;
- parent/customer exclusion;
- school-admin/customer-side exclusion;
- suspended/archived/deleted/inactive exclusion;
- stable Microsoft hash override;
- raw/malformed identifier rejection;
- duplicate email ownership detection;
- duplicate stable identity ownership detection;
- staff records with no usable identity signal;
- overrides cannot promote a non-staff user into staff.

## Production activation gate

Before AV5 reconciliation runs against real classes, confirm:

```text
[ ] every active teaching account has a usable Tiny Steps Microsoft email hash
[ ] stable Microsoft identity hashes are added where available/required
[ ] duplicate registry issues = 0
[ ] expected-teacher identity-missing issues = 0 for active teaching staff
[ ] registry is loaded once per validation run
[ ] AV3 identity conflicts continue to route to REVIEW
```

The registry wiring remains fail-closed. The explicit rollout may add a validation-owned identity hash only when all mapping gates pass; it never auto-corrects attendance, never reassigns an existing identity, and never uses display names.

## Core invariant

> Tiny Steps operational users define who is internal staff. AVS may use only privacy-minimized deterministic identity signals to exclude those staff from learner-side evidence.


## Brick 1 — automatic teacher identity binding

Fresh AVS evidence now attempts the same existing hashed-email + stable-Microsoft-identity proof automatically before AV5.3 evaluates the case.

The proof rules are unchanged:

- active Tiny Steps teacher only;
- exact canonical teacher id/session binding;
- complete attendance-record evidence;
- teacher email hash must be uniquely owned;
- exactly one stable Microsoft identity hash;
- display names are never used;
- existing different identity or duplicate ownership fails closed.

Successful ownership is persisted transactionally across:

```text
attendanceValidationStaffIdentities/{teacherId}
attendanceValidationMicrosoftIdentityClaims/{microsoftIdentityHash}
```

The claim document contains only the SHA-256 identity hash in its document id plus the owning Tiny Steps staff id and validation metadata. Raw Microsoft object IDs and raw emails are never stored.

The claim transaction guarantees that two concurrent AVS refreshes cannot assign the same Microsoft identity to different staff. Existing verified registry mappings can be backfilled into the claim collection by the existing cached identity maintenance path with zero Microsoft Graph calls.

Fresh evidence paths covered:

- first-time baseline;
- single-case Force Fresh;
- selected-range Force Fresh.

Selected-range Force Fresh loads the staff registry once per invocation and shares that immutable snapshot across its bounded workers. Each worker applies only its own transactionally accepted mapping to the AV5.3 registry passed for that case.

The existing cached identity rollout remains temporarily available as a maintenance/backfill fallback. Future fresh cases do not depend on an admin clicking Sync Teacher Identities.
