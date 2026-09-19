# AV8 — Meaningful-Overlap Threshold Calibration

Status: **implemented as a pure, offline calibration engine. The engine itself still does not deploy or operationally adopt thresholds. A later contract-v2 business decision adopted a strict >25-minute production overlap rule; see `contract-v2-25-minute-overlap.md`.**

## Purpose

AV4 deliberately leaves the teacher/learner meaningful-overlap threshold injectable:

```text
AV4 proof
  maxTeacherLearnerOverlapSeconds
        +
human-reviewed outcome
        ↓
AV8 calibration analysis
        ↓
candidate threshold metrics
```

The reason is safety: the threshold determines when a fully verified teacher/learner meeting may be promoted from `REVIEW` to a validation recommendation of `PRESENT`.

AV8 must therefore be calibrated from real, human-reviewed classes rather than guessed from a nominal 35–40 minute lesson duration.

## What AV8 does

`functions/src/attendanceValidation/calibrationEngine.ts` provides one deterministic analyzer:

```text
analyzeMeaningfulOverlapCalibration(...)
```

It accepts:

- explicit human-reviewed AV4 proof samples;
- the exact AV5.3 case input fingerprint for each reviewed sample, binding the human label to a specific evidence revision;
- an explicit list of candidate overlap thresholds in seconds;
- an explicit calibration policy defining:
  - minimum eligible reviewed samples;
  - minimum human-confirmed Present samples;
  - minimum human-confirmed Absent samples;
  - maximum tolerated false-positive rate;
  - minimum Present recall.

For each candidate threshold it reports:

- predicted Present count;
- predicted Review count;
- true positives;
- false positives;
- true negatives;
- false negatives;
- precision;
- Present recall;
- false-positive rate;
- whether the candidate satisfies the caller-supplied policy.

It also produces a deterministic SHA-256 fingerprint of the eligible reviewed dataset so two reports can be compared against exactly the same evidence cohort and exact reviewed case revisions. A reused case ID with a different AV5.3 input fingerprint changes the AV8 dataset fingerprint.

## Calibration eligibility

A sample is eligible only when the overlap threshold is actually the variable being calibrated. The caller must provide the 64-character SHA-256 `inputFingerprint` from the exact reviewed AV5.3 case revision; AV8 rejects malformed fingerprints rather than silently accepting unversioned human labels. The reviewed case ID must also match the AV4 proof's `classSessionId`, preventing a human label from being paired with another session's proof.

AV8 excludes samples when any of these upstream proof gates are unsafe:

- inconclusive human review outcome;
- unsupported AV4 proof schema;
- Tiny Steps / evidence session reference mismatch;
- unresolved or wrong Teams occurrence;
- identity requires review;
- expected teacher is not verified;
- learner side is not present;
- attendance evidence is incomplete;
- overlap metric is invalid.

This is intentional.

For example, a Teams meeting with no learner-side participant can already be classified by AV5 without an overlap threshold. Including that class in overlap calibration would distort the threshold dataset.

Likewise, a class with ambiguous identity must be fixed at the identity layer; AV8 must not compensate for it by lowering or raising an overlap threshold.

## Human decision vocabulary

Calibration input accepts:

```text
present
absent
review
```

But only **definitive** human decisions are allowed to influence threshold metrics:

- human `present` is the positive class;
- human `absent` is the negative class for measuring false-positive risk;
- human `review` is excluded as `human_review_inconclusive` because an inconclusive review is not ground truth.

This does **not** mean AV8 converts a below-threshold class to Absent.

The runtime AV5 rule now uses contract-v2 strict semantics:

```text
overlap > threshold   -> eligible for PRESENT recommendation
overlap <= threshold  -> REVIEW
```

For the adopted 1,500-second threshold, exactly 25:00 remains REVIEW and 25:01+ becomes eligible for PRESENT, assuming every upstream safety gate passes.

Absence continues to require the separate AV5 deterministic no-learner-side pathway.

## Production-threshold adoption happened separately

At the time AV8 was originally implemented, the repository did not contain an approved calibration cohort and AV8 therefore did not invent a production number.

After that implementation, Tiny Steps explicitly approved a **strictly greater than 25-minute** business rule for teacher/learner simultaneous scheduled overlap.

That adoption is intentionally separate from the AV8 analyzer:

- contract version increased to 2;
- AV4 production default became 1,500 seconds;
- runtime comparison became strict `>`;
- AV5 decision order remained unchanged;
- AV5.3 production omission now inherits the versioned default;
- AV7 correction approval remains unchanged.

AV8 remains useful for future evidence-based recalibration, but it does not itself authorize changing the versioned production contract.

## Candidate selection is not threshold adoption

If the supplied reviewed cohort satisfies the supplied policy, AV8 may return:

```text
status = candidate_available
bestCandidateSeconds = N
```

That result is diagnostic only.

Every AV8 report contains:

```text
thresholdAdoptionAllowed = false
operationalMutationAllowed = false
```

A later explicitly reviewed change is required before any candidate can become a versioned production contract threshold.

Per AV0, any actual production threshold change must:

1. be supported by reviewed shadow evidence;
2. increase the attendance-validation contract version;
3. add regression tests around the adopted number;
4. preserve the validation-only / admin-approved correction boundary.

## Deterministic candidate ranking

When more than one threshold satisfies the supplied policy, AV8 ranks passing candidates conservatively by:

1. lower false-positive rate;
2. higher Present recall;
3. higher threshold when the first two metrics tie.

This intentionally prefers avoiding a false Present recommendation over recovering an additional Present case when both thresholds already satisfy the caller's minimum policy.

This ranking is deterministic and still does not authorize adoption.

## No production workload

AV8 introduces no:

- scheduler;
- HTTP endpoint;
- callable Function;
- Firestore trigger;
- collection scan;
- Firestore read;
- Firestore write;
- background agent;
- automatic attendance correction.

The module is pure computation over explicit inputs.

## AV7 boundary remains unchanged

AV8 cannot invoke the AV7 correction workflow.

Even after a threshold is eventually adopted, AV5/AV5.2 may only produce validation recommendations. A financially meaningful attendance correction still requires the existing AV7 admin-approved pathway and its existing finance/teacher-pay safeguards.

## Tests

The AV8 test suite covers:

- policy-constrained candidate selection;
- insufficient reviewed evidence;
- no candidate satisfying the policy;
- false-positive-first ranking when multiple candidates pass;
- exclusion of unsafe AV4 proof samples;
- deterministic dataset fingerprinting;
- exact case-revision fingerprint binding;
- malformed case-fingerprint rejection;
- case/proof session-identity mismatch rejection;
- invalid threshold/policy input rejection;
- duplicate reviewed-case rejection;
- the hard no-adoption / no-operational-mutation invariant.

## Core invariant

> AV8 may measure how candidate overlap thresholds perform against explicit human-reviewed evidence, but it may not invent, adopt, deploy, or operationally act on a threshold by itself.
