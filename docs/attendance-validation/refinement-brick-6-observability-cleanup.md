# AVS Refinement Brick 6 — Observability, Error Taxonomy, and Cleanup

Brick 6 makes AVS production-diagnosable without turning Microsoft Graph failures into attendance judgments.

## Final supported operator surface

- Load Results
- Run Validation
- Advanced -> Re-fetch Teams Data
- Re-fetch this case

## Failure taxonomy

Infrastructure and evidence problems now emit privacy-safe descriptors with a stable code, category, retry disposition, operator action, source/stage, and safe HTTP/Graph codes. Raw Teams emails, Microsoft object IDs, join URLs, participant names, organizer IDs, and raw Graph error messages are not added to Brick 6 diagnostics.

Categories: business_review, retryable_infrastructure, configuration, authorization, request, unknown_infrastructure.

Retry dispositions: review, retry, admin_action, reload, do_not_retry.

## Evidence semantics

Missing meeting references and genuinely missing/ambiguous meetings remain business-review outcomes.

Rate limits, transient Graph failures, configuration failures, permission failures, and unexpected attendance-evidence infrastructure errors do not become attendance-review evidence. Blocking failures in meeting resolution, attendance reports, or attendance records stop that fresh validation attempt and preserve a dirty session for later recovery.

Transcript errors are supplemental and do not block attendance validation when attendance-report evidence remains usable.

## Retry rules

Range re-fetch generations persist retryability per failed case. Retry Failed Re-fetches selects only retryable failures. Configuration, permission, request-state, and unknown action-required failures are surfaced but not blindly retried.

## Baseline recovery

First-time evidence blocked by organizer or attendance-evidence infrastructure is written back to the AVS dirty queue with reason validation_infrastructure_retry so a completed historical cursor cannot permanently swallow a repairable infrastructure failure.

## Cleanup

The old browser callables runAttendanceValidationLatestCheck and runAttendanceValidationFirstTimeBaseline are removed from the browser callable contract and client region map. Their wrappers remain private compatibility shims; their batch helpers remain server-internal dependencies of Run Validation.

The obsolete deterministic attendanceValidationForceFreshRanges contract constant is removed. Historical documents remain denied by Firestore rules and can be deleted separately after production soak.

## Locked invariants

No change to strict >1500 seconds per Present row, same-day Present pooling, non-Present scheduled matching, expected teacher + learner proof, identity fail-closed rules, operational attendance, scheduling, billing, payments, teacher earnings, realtime listeners, or nightly Graph scanning.
