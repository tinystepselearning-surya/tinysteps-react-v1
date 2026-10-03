# School OS Migration Execution Standard v1

**Status:** FROZEN FOR WAVE 1 ENTRY  
**Applies from:** Wave 1 onward  
**Architecture source:** Tiny Steps School OS Master Blueprint v1.0  
**Lifecycle:** EXPAND → BACKFILL → VERIFY → SWITCH READS → OBSERVE → STOP LEGACY WRITES → RETIRE

## 1. Purpose

This standard defines how Tiny Steps executes canonical migrations safely.

It turns the roadmap lifecycle into an operational contract covering migration metadata, bounded execution, reconciliation, compatibility paths, read/write cutover, exception ownership, observation, retirement, rollback and test/workflow retirement.

This is an execution standard, not a new runtime service.

## 2. Core rules

1. Production stability has priority over architectural purity.
2. Every migration advances one documented canonical owner.
3. Migrations are bounded, resumable and observable.
4. No destructive step occurs in EXPAND, BACKFILL or VERIFY.
5. A compatibility field/path may remain only with one documented canonical destination.
6. Legacy and canonical paths must not become two permanent authorities.
7. Backfills never infer identity or relationships from names, email similarity or unverified heuristics.
8. Existing IDs are preserved when the current ID already represents the correct canonical concept.
9. Historical finance/evidence/session records are preserved conservatively.
10. Projections may be rebuilt; canonical/ledger/evidence records are not casually rewritten.
11. Read-switch and write-switch are separate decisions.
12. A migration is not complete because new code exists.
13. Temporary scripts/tests/workflows must have an explicit retirement decision.
14. No scheduled migration workflow is created unless the business process itself genuinely requires recurrence.
15. Permanent GitHub Actions remain deployment-focused; one-off audit/migration workflows, if temporarily used, are removed after the bounded run.

## 3. Migration unit

A migration unit is intentionally narrow.

A unit should usually cover one canonical concept or one tightly-coupled relationship, for example:

- Person + AuthIdentity adoption;
- GuardianRelationship backfill;
- TeachingAssignment extraction;
- SchedulePlan extraction;
- Course → Programme relation;
- Enrollment → DeliveryOffering relation.

Do not combine unrelated domain migrations merely because they touch the same legacy document.

## 4. Required migration manifest

Every migration brick must have a manifest or equivalent checked-in declaration with these fields.

### Identity

~~~text
migrationId
wave
domain
canonicalOwner
title
status
sourceBaselineCommit
implementationCommit
schemaVersion
environment
~~~

### Scope

~~~text
sourcePaths[]
targetPaths[]
sourceFilter / eligibilityRule
excludedScopes[]
compatibilityPaths[]
~~~

### Authority

~~~text
sourceAuthorityBefore
targetAuthorityAfter
readAuthorityDuringMigration
writeAuthorityDuringMigration
projectionDependencies[]
~~~

### Safety

~~~text
dryRunRequired
maxWritesPerBatch
maxRecordsPerRun
checkpointStrategy
idempotencyKey
retryPolicy
rollbackStrategy
secretsPolicy
~~~

### Verification

~~~text
sourceEligibleCount
attemptedCount
createdCount
updatedCount
unchangedCount
skippedCount
failedCount
unresolvedCount
reconciledCount
mismatchCount
invariantChecks[]
~~~

### Cutover

~~~text
readSwitchCriteria[]
readSwitchedAt
observationCriteria[]
observationStartedAt
observationCompletedAt
legacyWriteStopCriteria[]
legacyWritesStoppedAt
retirementCriteria[]
retiredAt
~~~

### Ownership

~~~text
exceptionOwner
operationalOwner
reviewer
retirementOwner
~~~

Exact physical storage may be JSON, TypeScript or Markdown as long as the required facts remain machine- or human-verifiable.

## 5. Migration state machine

Allowed migration states:

~~~text
planned
expanded
backfilling
backfill_complete
verifying
verified
read_switched
observing
legacy_writes_stopped
retirement_ready
retired
blocked
rolled_back
~~~

A migration cannot skip directly from expanded to retired.

## 6. Phase gates

### EXPAND

Purpose: introduce canonical structures and compatibility-safe code.

Required:

- target schema/contract exists;
- target security/authorization is defined;
- target writes are idempotent;
- legacy reads continue working;
- no destructive legacy mutation;
- dry-run tooling exists where a backfill is required;
- migration manifest is created.

Exit:

- canonical target can safely receive records;
- existing user flows remain intact.

### BACKFILL

Purpose: populate canonical state from verified legacy authority.

Required:

- dry run first;
- bounded batches;
- checkpoint/resume;
- explicit skipped/failed/unresolved counts;
- no name/email-based identity inference;
- no automatic deletion of legacy records;
- write amplification and Firestore cost considered.

Exit:

- all eligible records are accounted for as migrated, unchanged, skipped, failed or unresolved.

### VERIFY

Purpose: prove target state represents the intended source truth.

Required:

- count reconciliation;
- reference integrity;
- domain-specific invariant checks;
- compatibility-path comparison where applicable;
- representative exceptions reviewed;
- unresolved records have explicit classification/owner.

Exit:

- no unexplained mismatch blocks cutover.

### SWITCH READS

Purpose: make canonical state the primary read authority.

Required:

- canonical reads proven on production-like/live data;
- bounded fallback behaviour defined if still necessary;
- metrics/logging identify fallback usage;
- rollback is read-switch reversal, not destructive target deletion.

Exit:

- primary flows read canonical state successfully.

### OBSERVE

Purpose: verify real production behaviour after read cutover.

Required:

- sufficient business cycle/window for the domain;
- no unexplained divergence;
- no material reliability/performance/access regressions;
- downstream projections/integrations remain correct.

Exit:

- observation criteria satisfied.

### STOP LEGACY WRITES

Purpose: end competing authority.

Required:

- canonical writes cover all current mutation paths;
- no active workflow depends on legacy write authority;
- any compatibility mirror is one-way from canonical if still needed.

Exit:

- legacy path is read-only compatibility or unused.

### RETIRE

Purpose: remove obsolete compatibility safely.

Required:

- no active legacy reads/writes;
- retained historical/evidence obligations understood;
- backup/retention obligations satisfied;
- import/runtime references verified;
- temporary scripts/tests/workflows retirement decision executed.

Exit:

- obsolete path removed or intentionally retained with documented reason.

## 7. Compatibility-path registry

Every compatibility path must record:

~~~text
compatibilityId
legacyPath
canonicalDestination
authorityClass
readers[]
writers[]
introducedOrRetainedAt
currentDirection
removalCriteria
owner
status
~~~

Allowed currentDirection examples:

- legacy → canonical backfill;
- canonical → legacy projection;
- read fallback only;
- historical read only.

Disallowed steady state:

~~~text
legacy ↔ canonical bidirectional authority
~~~

unless an explicitly time-bounded migration step proves why it is unavoidable.

## 8. Exception registry

Every unresolved record/category must be one of:

- data defect requiring correction;
- stale active-looking state requiring business closure;
- historical compatibility debt;
- intentionally preserved evidence/history;
- unsupported legacy variant requiring manual mapping;
- orphan retirement candidate;
- blocked by another domain wave.

Each exception requires:

~~~text
exceptionId
migrationId
category
count
scope
businessImpact
owner
requiredAction
blocksCutover
resolutionStatus
~~~

Raw child/family identifiers must not be committed to public repository artifacts. Protected operational reports may contain the minimum identifiers needed for authorized remediation.

## 9. Read/write authority rules

During migration, each fact must have one declared authority.

~~~text
Before cutover:
legacy field = write authority
canonical record = shadow/verification target

After read switch but before legacy-write stop:
canonical record = read authority
legacy field = temporary write compatibility only if explicitly declared

After legacy-write stop:
canonical record = read/write authority
legacy field = compatibility projection or historical record only
~~~

A convenience projection must never become an accidental write authority.

## 10. Backfill implementation rules

Backfills must:

- be idempotent;
- tolerate restart;
- use deterministic IDs where canonical reuse is intended;
- avoid unbounded collection scans in request paths;
- batch writes conservatively;
- expose progress/checkpoints;
- classify every record;
- surface failures rather than silently dropping them;
- avoid creating duplicate canonical records on retry;
- avoid mutating historical evidence merely to normalize shape.

For Firestore, use bounded pagination/cursors rather than a single enormous mutation.

## 11. Verification standard

Verification has four layers:

1. **Structural** — target exists and required fields/relationships are present.
2. **Referential** — canonical references resolve.
3. **Semantic** — business meaning matches source authority.
4. **Operational** — real application flows behave correctly after cutover.

Counts alone are not sufficient.

## 12. Rollback standard

Rollback must be designed before mutation.

Preferred rollback hierarchy:

1. revert read switch;
2. disable new canonical write path/feature flag;
3. resume known-good legacy writer if still retained;
4. reconcile forward.

Do not automatically delete canonical records created by a migration unless deletion is independently proven safe.

For ledger/evidence/history migrations, forward correction is normally preferred over destructive rollback.

## 13. Security and secrets

- production service-account JSON is never committed;
- existing managed secret infrastructure is reused;
- migration access is least-privilege where practical;
- read-only audits use read-only behaviour even when credentials technically allow writes;
- high-risk mutations require explicit bounded execution approval;
- logs/artifacts avoid unnecessary child/family/contact data;
- temporary artifacts use minimal retention.

## 14. CI/CD and execution posture

Permanent model remains:

~~~text
Local Mac
  → development/preflight validation
  → PR review
  → merge to main
  → single deployment workflow
  → production verification
~~~

Migration-specific validation belongs primarily in local tooling/tests.

If a one-off GitHub Action is useful for a read-only production audit or explicitly approved bounded migration:

- it is temporary;
- it has no schedule;
- it is scoped to one migration;
- it uploads bounded evidence;
- it is removed immediately after the run.

Do not rebuild a permanent migration-CI farm.

## 15. Test retirement

Every migration brick states which tests are permanent invariants and which are temporary migration tests.

Permanent examples:

- authentication/authorization;
- relationship integrity;
- enrollment uniqueness;
- scheduling integrity;
- attendance authority;
- finance/earnings integrity;
- entitlement/access;
- deployment safety.

Temporary examples:

- one-time legacy alias coverage;
- historical backfill fixtures;
- transitional dual-read assertions;
- migration-report shape.

Temporary tests retire after canonical cutover is observed, the legacy path is stopped/retired and equivalent permanent invariant coverage exists where required.

## 16. Standard migration evidence summary

Every completed phase must be able to answer:

- What source records were eligible?
- What target records were created/updated?
- What was unchanged?
- What was skipped?
- What failed?
- What remains unresolved?
- Do source and target reconcile?
- Which path is authoritative now?
- Is any fallback still used?
- When can the next phase start?
- What temporary tooling still exists?
- What conditions allow retirement?

## 17. Wave 1 entry constraint

Wave 1 may begin only with identity/relationship scope defined by the roadmap:

~~~text
Person
AuthIdentity
RoleAssignment
LearnerProfile
GuardianRelationship
Household
Organisation
OrganisationMembership
~~~

Wave 1 must preserve Firebase Authentication, verified existing user/kid IDs, current portal behaviour and compatibility projections/aliases until canonical reads/writes are proven.

Wave 1 must not opportunistically rewrite Scheduling, Finance, Attendance, Commerce or unrelated domain data.

## 18. First Wave 1 implementation posture

The first Wave 1 implementation brick should begin with **EXPAND**, not a broad backfill.

Recommended first brick:

~~~text
Wave 1 — Identity Foundation Expand
~~~

Scope:

- define physical canonical schema/contracts for Person, AuthIdentity, RoleAssignment, LearnerProfile and relationship records;
- define indexes/security/authorized commands;
- define compatibility adapters;
- create dry-run/backfill tooling;
- no legacy deletion;
- no read switch;
- no broad production mutation until dry-run and bounded write plan are reviewed.

That keeps the architecture dependency order intact and minimizes blast radius.
