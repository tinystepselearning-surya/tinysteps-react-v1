# B02-R5-A.1 — partial execution-safety hardening (execution HOLD)

Owner approved continued offline development following independent review of 05a073629f0379f9d8e556915735c19dd3c4f8aa. This is a staged correction, not an execution approval. Both launcher and worker deliberately throw before any emulator or SDK initialization. The worker's transaction logic and budgets remain unchanged. Do not bypass either guard.

## Implemented
- H01 partial: separate read-only reviewer-SHA preflight with exact detached HEAD, clean tracked/untracked status, actual source byte checks, lock pin and repeat HEAD check. Not yet wired to an approved execution entrypoint. Expected SHA must be supplied externally after independent review. Fresh locked install and resolved installed-code checks remain mandatory.
- H02 partial: reusable owned process-group controller tracks the PGID independently of direct child completion, escalates TERM to KILL, checks group disappearance and direct child exit, attempts all groups via allSettled, prevents new children after interrupt/cleanup. Launcher checks port release on success and failure, emits completion only after cleanup. PID/PGID reuse, escaped groups, orphan reaping and whole-run deadlines still require a stronger OS containment boundary and target-host validation.
- Database-free helper tests: 5/5 on Linux Node v22.16.0 (not the pinned Mac runtime). Mocked leader-exit/descendant and multi-group error scenarios, actual harmless direct child termination, missing-group behavior and bounded wait. Git blob pins 99c90ba47906d75282c34d48580b5d25e2470835 and 8a03d537076cb228b14c26017094429654903758 match the tested files. No emulator, database, network transport or cloud commands executed.

## Outstanding gates
- H01/M03: fresh isolated checkout and locked installation (not in production worktree), trusted executable paths, verify resolved dependency integrity and provenance, repeat external exact SHA validation immediately before approved launch.
- H03: no certified macOS process-level isolation yet. Prefer a dedicated credential-free disposable guest with host mounts/sharing disabled, externally enforced loopback-only networking and whole-guest/process watchdog. A native Mac sandbox is an alternative only after actual denial canaries and independent review. Do not rely on HOME or environment flags as isolation.
- M01/M02: database-free retry instrumentation against exact SDK, whole-run watchdog, actual descendant and port cleanup fault tests, target host Node 22.22.1 and Java 21. Preflight and integrated launcher not yet executed.
- L02: sanitized stage-level diagnostics deferred. L01/M04: future separately reviewed transaction invariants, no budget expansion.
- H04: separate R3.1 fail-closed authoritative revocation and trusted time/fence work; R3 runtime integration remains HOLD.
- Owner reported exact v1.19.8 JAR SHA-256 match; upstream provenance independently unverified.

Keep 3 fixed cohorts, 6 transactions, 43 logical dispatches, 19 maximum attempted write entries, 13 expected successful writes, zero delete RPCs and zero production operations. No production database, rules, credentials, deploy or main merge. Next: target-host containment and database-free test evidence, then independent review of new exact candidate before considering removal of HOLD guards. No claims of completed R5-A.1 or accepted R3/R5.
