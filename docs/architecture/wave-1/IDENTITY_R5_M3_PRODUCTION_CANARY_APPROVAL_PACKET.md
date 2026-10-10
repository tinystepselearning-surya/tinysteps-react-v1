# Wave 1 / R5 Milestone 3 — production canary authorization packet

**State: PREPARED, NOT APPROVED.** This file defines the handover to an operator or Codex with an authorized local Firebase context. It does **not** grant access, start production reads, approve user impersonation, or close Milestone 3.

**Repository baseline at preparation:** `main` commit `70251e12822b8ce667b3ee41a4a5a763c6520c08` (PR #702). Obtain a fresh `main` and rebuild the source evidence immediately before execution. Previous audit: `IDENTITY_R5_M3_PRODUCTION_VERIFICATION_REPORT.md`, synthetic parity: `IDENTITY_R5_M3_AUTHORIZATION_PARITY_AND_CANARY_PLAN.md`, P1 cache remediation: PR #701.

## 1. Independently verified source-safety findings

The privacy-safe source preflight is `node scripts/milestone3-canary-read-safety-preflight.mjs`. Its automated regressions are `node --test scripts/test/milestone3-canary-read-safety-preflight.node-test.mjs`. It consumes local repository files only. Its PASS means the known write and unbounded-read risks are correctly **excluded**, **not** that production authorization or read budgets are green.

| Source | Confirmed issue | Production-canary disposition |
|---|---|---|
| `functions/src/sessionsManagementSnapshot.ts` | `getSessionsManagementSnapshot` can `rebuildSnapshot('bootstrap')` when metadata is absent or schema mismatches; `adminRefreshSessionsManagementSnapshot` rebuilds directly. Reads may trigger writes to leases/shards/metadata | **BLOCKED** for no-write live canaries; do not assume an apparently normal GET-like callable is read-only |
| Same module | Date snapshot fetch is authenticated and constructs a date payload; potentially substantial reads | **BLOCKED** pending independent write/read/authorization review |
| `functions/src/parentPaymentBackfillDryRun.ts` | `loadParentPaymentBackfillPayments` applies `.limit(limitPayments)` only when `parentId` is absent; for a named parent it retrieves all payments then slices | **BLOCKED** pending bounded and completeness-preserving query hardening |
| Same module | For selected payments, allocations `.get()` has no per-payment server-side cap | **BLOCKED**: capped payments do not cap allocation reads |
| Same module | Parent charges, wallet transactions and monthly read-model child queries are uncapped | **BLOCKED**: small parent count is not a billed-read bound |
| `functions/src/parentPaymentBackfillWriteMode.ts` | Contains explicit `mode: write` workflow and transactional mutations | **BLOCKED**, even for a canary described as "validation" |
| Canonical identity / sampler | `ensureCanonicalAdmin` loads the UID-keyed derived principal; prepared sampler enforces max 12 actors and 7 SDK-get attempts per actor, plus two bounded source queries of up to 51 returned rows each | **PREPARED BUT NOT AUTHORIZED**; service credentials are not browser authorization evidence |
| Browser cache | PR #701 moved Sessions Management to actor-bound v4 cache and removed authorization-denied fallback | Verified in source/tests; real account-transition behavior remains a separate approved live test |

## 2. Owner approval packet — complete privately before *any* production document read

The designated Tiny Steps owner/security operator must approve:

1. **Firebase project and environment:** exact project ID, Hosting origin, expected `main` production commit and intended read window. Re-confirm the correct account/environment before every run.
2. **Test actors:** explicitly designated, controlled accounts for global Admin, Founder, School Admin, Teacher, Parent and Learning Partner. Include at least two independent school/organization contexts, two parent ownership contexts and two teacher ownership contexts. Keep total distinct actors at **12 or fewer** for the source sampler.
3. **Expected role and scope:** per-actor permitted and denied actions, school organization-to-legacy-school mapping, active/inactive expectation, and supported sign-in method. The owner approves impersonation/session use **only for those designated test identities**.
4. **Exact existing resources:** allowlisted, non-sensitive **full Firestore document paths** for each positive and negative test. The resource fixtures must already exist. Do not create or alter production fixtures as part of this authorization audit. Include their intended owner/school context privately.
5. **Separate operator principal sampler access:** bounded database point-read/query IAM (if available). Approval of browser actor sessions **does not** authorize Admin SDK enumeration. Never use Admin SDK to claim that Firestore/Storage client Rules allowed an operation.
6. **Run budgets:** maximum per-actor SDK operations, maximum retrieved docs, total request window, timeout/retry policy, age/freshness review threshold, and a small Cloud Monitoring/Billing metric window. Counters are not equivalent to billed reads.
7. **Stop rules:** unexpected allow, role/scope mismatch, missing canonical principal, failed sign-in, unexpected writes, any resource outside allowlist, sampler overflow, source drift, billing spike, or unavailable evidence. Denied and unavailable/network error must not be conflated.

Do **not** put private actor manifests, UID/email/school names, password, tokens, cookies, raw documents, snapshot text, SDK debug logs, or query paths containing identities in GitHub, chat, PR comments or report artifacts. Store the private manifest securely outside the repository.

## 3. Safe order of execution

**Gate A — local/offline only.** Fetch latest `main`; verify production/CI marker and held flags. Run the local source preflight and regression tests. Source or permissions mismatch: stop, open a test/documentation PR only.

**Gate B — approved client-user authentication.** Under each approved actor's own authenticated user session, perform only `getDocFromServer` or equivalent server-forced point reads on the allowlisted documents. Do not use real customer/child content. Run one positive and one negative target per actor. Never run collection scans, queries with no cap, broad list/read listeners, mutation probes, UI routes that silently invoke write-capable callables, or emulator identities against production. A negative outcome passes only on expected `permission-denied`; `not-found`, timeout, expired credentials and network errors are **inconclusive**. An unexpected allow stops the actor and escalates.

**Gate C — separately approved canonical source sample.** If IAM and manifest approvals are explicit, run the existing operator-injected `auditApprovedPrincipals` under a read-only database facade: at most 12 actors, at most 7 SDK gets per actor (84 attempts total), two person-scoped `.limit(51)` queries per actor, and at most 107 documents returned per actor in the code contract. Overflow is an inconclusive failure requiring owner review; do not paginate without a separate authorization. These are **SDK operation/return limits**, not billed-read guarantees. Verify canonical role/school mapping, source drift, inactive models and age thresholds, without writing refreshed models.

**Gate D — read-cost evidence.** Capture aggregate SDK get attempts, successes/errors, document result counts, listener attach/deliver/detach only if intentionally used (default none), and test window. Obtain Cloud Monitoring/Firestore usage or Billing metrics independently where access permits. Differentiate *operation count*, *document results*, *server billed reads*, and *attributable incremental usage*. Shared-production baseline traffic precludes precise per-request billed attribution without isolation. If metrics unavailable, leave `actualProductionBilledReads` **NOT_VERIFIED**.

**Gate E — review and closeout.** Write a privacy-safe result matrix with explicit PASS / FAIL / INCONCLUSIVE by role and expected allow/deny, a separate canonical sampler verdict and cost-budget verdict, evidence links, stopped actions and remaining owner decisions. Open a PR for *tests, documentation, reports or operator-approved safe fixes*; do not merge automatically. Do not change any `milestone3.finalExitGate` or production Rules/reader cutover flags.

## 4. Minimum output contract

A combined result must include `sourcePreflight`, `approvedActorCount` (no identifiers), `perRoleAllowDeny`, `twoSchoolIsolation`, `twoParentOwnerIsolation`, `twoTeacherOwnerIsolation`, `founderReadOnlyEmulator`, `canonicalSourceSample`, `modelAgeAndDrift`, `sdkOperations`, `billedReadEvidence`, `unverifiedGates`, `unexpectedGrants`, `productionWritesPerformed: false`, and `milestone3Exit: NOT_PASSED` pending independent final gate.

**Reserved for owner approval:** `APPROVED ACTORS: ______`; `ALLOWLIST & EXPECTATIONS: ______`; `PROJECT & WINDOW: ______`; `MAX OPERATIONS / DURATION: ______`; `CLOUD METRICS ACCESS: ______`; `OWNER APPROVAL RECORD: ______`. No values should be checked into GitHub. Empty fields mean **live verification is not authorized**.
