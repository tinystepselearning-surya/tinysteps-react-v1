# Attendance Validation Contract v2 — 25-Minute Overlap Adoption

Status: **business-approved threshold adopted for production validation logic.**

## Business rule

Tiny Steps considers a Teams-backed class eligible for an AVS `PRESENT` recommendation only when the expected teacher and learner side have **strictly more than 25 minutes of simultaneous overlap inside the scheduled Tiny Steps class window**.

The adopted threshold is:

```text
25 minutes = 1,500 seconds
comparison = strictly greater than
```

Therefore:

```text
24:59 overlap -> REVIEW
25:00 overlap -> REVIEW
25:01+ overlap -> eligible for PRESENT
```

This threshold is only one gate. A class still requires all existing AV3/AV4 safety checks:

- correct Tiny Steps session references;
- correct Teams occurrence;
- verified expected teacher identity;
- verified learner-side participation;
- complete Teams attendance evidence.

If any of those gates fail, AV5 continues to return `REVIEW`.

## Absent remains separate

This change does not make a short learner visit equal to Absent.

AV5 continues to recommend `ABSENT` only when the session/occurrence/identity/evidence gates are verified, the expected teacher is present, and **no learner-side participant exists** in that selected occurrence.

If a learner-side participant exists but simultaneous overlap is 25:00 or less, the result is:

```text
REVIEW
```

not `ABSENT`.

## Contract version

`ATTENDANCE_VALIDATION_CONTRACT_VERSION` is increased from **1 to 2** because this is the first adopted runtime meaningful-overlap rule.

The production constants are represented in both contract/runtime layers and protected by regression tests.

## AV4

AV4 now defaults to:

```text
meaningfulOverlapSeconds = 1500
comparison = >
```

Explicit threshold injection remains available for deterministic tests and future calibration analysis. Explicit `null` remains a diagnostic fail-closed path only.

## AV5.3

Production AV5.3 callers may omit `meaningfulOverlapSeconds`; omission now resolves to the contract-v2 1,500-second threshold.

This is designed so the future production shadow activation does not accidentally run with an unconfigured threshold.

An explicit `null` still forces the previous diagnostic REVIEW behavior and is not the production default.

## AV8 calibration engine

AV8's candidate-threshold math now uses the same strict greater-than comparator as production:

```text
overlapSeconds > thresholdSeconds
```

This keeps calibration metrics and runtime semantics identical at threshold boundaries.

## Operational safety boundary

This contract change does **not** activate the AV5.3 production workload and does **not** auto-correct attendance.

It does not change:

- AV7 admin approval requirements;
- billing reconciliation;
- teacher earnings;
- reschedule credits;
- historical attendance;
- the September 1, 2026 validation-scope lower bound.

Even after AVS recommends Present/Absent, operational corrections still require the AV7 approved correction workflow.

## Regression boundaries

Tests explicitly protect:

- 24:59 -> not meaningful;
- 25:00 -> not meaningful;
- 25:01 -> meaningful;
- AV5.3 production-default inheritance;
- calibration/runtime comparator alignment;
- below-threshold learner participation remains REVIEW.
