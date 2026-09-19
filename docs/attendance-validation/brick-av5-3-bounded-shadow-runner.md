# AV5.3 — Bounded Case Persistence / Shadow Runner

Status: **implemented as a bounded, explicit-work-list shadow runner and validation-owned case store. No Cloud Function export, scheduler, collection-wide operational scan, or operational attendance mutation is introduced in this brick.**

## Purpose

AV5.3 connects the already-built AVS logic into one shadow-mode pipeline:

    explicit classSessionId + evidenceId work list
            ↓
    exact point reads only
            ↓
    AV3 identity bridge
            ↓
    AV4 session proof
            ↓
    AV5.1 Present / Absent / Review
            ↓
    AV5.2 reconciliation
            ↓
    attendanceValidationCases/{deterministicCaseId}

The output is still observational. Tiny Steps attendance remains the operational system of record.

## Firestore read-efficiency contract

AV5.3 is deliberately designed to prevent the read-amplification problem discussed before implementation.

### Hard rules

The runner:

- does **not** query or scan `classSessions`;
- does **not** read `enrollments`, `kids`, billing, teacher earnings, reschedule credits, or finance collections;
- accepts only an explicit list of `classSessionId + evidenceId` pairs;
- caps one run at **100 work items**;
- reads exactly the requested `classSessions/{id}` and `attendanceValidationEvidence/{id}` documents;
- loads the AV3 staff registry once per run, not once per session;
- performs **zero pre-reads** of `attendanceValidationCases` before writing;
- uses deterministic case document IDs, so reruns overwrite the same shadow case rather than creating duplicate documents.

### Point-read budget

For N work items:

    operational/evidence point-read budget = 2 × N documents

plus one shared staff-registry load for the entire run.

For example:

    10 sessions  -> 20 exact point reads + one shared registry load
    50 sessions  -> 100 exact point reads + one shared registry load
    100 sessions -> 200 exact point reads + one shared registry load

The runner never performs an unbounded operational collection query.

## Staff-registry behavior

`runAv53ShadowWithFirestore(...)` loads the AV3.2 production staff registry exactly once per run.

That shared load currently reads:

- active Tiny Steps internal staff from `users`;
- validation-owned `attendanceValidationStaffIdentities` overrides.

The resulting registry is reused for every session in the batch.

Registry integrity warnings are copied into each shadow case for audit visibility.

## Existing attendance read

AV5.3 reads attendance only from the already-loaded `classSessions/{id}` document.

It resolves the expected child's nested attendance entry:

    classSessions/{sessionId}.attendance[{kidId}]

It does not use the session lifecycle field such as `status = completed` as a substitute for learner attendance.

Historical vocabulary is normalized by AV5.2:

- `late` -> Present
- `no_show` -> Absent
- reschedule variants -> Rescheduled

No operational document is rewritten.

## Case persistence

Cases are written only to:

    attendanceValidationCases/{caseId}

For matched Tiny Steps sessions:

    caseId = classSessionId

For explicit evidence whose expected Tiny Steps session document is missing:

    caseId = orphan_{evidenceId}

Writes use deterministic replacement semantics. AV5.3 does not read the existing case first.

Each case contains:

    schemaVersion
    brick = AV5.3
    runId
    evidenceId
    observedAt
    classSessionId
    enrollmentId
    kidId
    teacherId
    tinyStepsAttendance
    validationDecision
    classification
    recommendedAction
    resolutionStatus
    reasons[]
    sourceClassificationReasons[]
    proofIssues[]
    identityIssues[]
    staffRegistryIssues[]
    inputFingerprint
    operationalMutationAllowed = false

The fingerprint allows later tooling to see whether the underlying validation state changed between runs while the case identity remains stable.

## Missing and mismatched inputs

AV5.3 fails closed.

### Session exists, evidence missing

Creates `MISSING_TEAMS_EVIDENCE` with `recommendedAction = review`.

### Evidence exists, expected Tiny Steps session missing

Creates `ORPHAN_TEAMS_CLASS` with `recommendedAction = review`.

This orphan classification is possible without an unbounded scan because the caller explicitly supplied the expected session/evidence pair.

### Both documents missing

No phantom case is written. The work item is reported as skipped.

### Operational/evidence reference mismatch

Creates `AMBIGUOUS` with `recommendedAction = review`.

The runner never trusts mismatched enrollment, teacher, child, or session references.

## Threshold behavior

The meaningful teacher/learner overlap threshold remains an explicit runner input.

If it is `null`, the existing fail-closed AV4/AV5 behavior remains REVIEW and then AMBIGUOUS/review. AV5.3 does not invent a production threshold.

## Safety boundary

AV5.3 may write only validation-owned case documents.

It does **not** update:

- `classSessions`;
- `enrollments`;
- attendance;
- billing charges;
- teacher earnings;
- reschedule credits;
- parent balances;
- operational correction records.

It does not invoke AV7.

`operationalMutationAllowed` is always `false`.

## Deployment state

This brick intentionally does **not** export a callable Function, HTTP Function, Firestore trigger, or scheduled Function.

So merging this brick makes the bounded runner available in the codebase without activating a production workload.

Production activation should be a separate reviewed brick after the case schema and read budget are approved.

## Tests

The AV5.3 regression suite covers exact work-item processing, deterministic case IDs, nested child-attendance resolution, missing evidence, orphan evidence, reference mismatch, missing documents, null-threshold fail-closed behavior, staff-registry warning propagation, the 100-item hard cap, duplicate-session rejection, stable case identity across reruns, fingerprint changes, zero case pre-reads, and the no-mutation invariant.

## Core invariant

> AV5.3 may read only explicitly requested session/evidence pairs and may write only validation-owned case documents. It may never scan operational collections or mutate operational attendance/finance.
