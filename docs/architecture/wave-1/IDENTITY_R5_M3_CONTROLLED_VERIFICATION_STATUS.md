# M3 controlled verification — independent preflight and blocked live gates

**2026-10-10, Asia/Kolkata. Verdict: HOLD / NOT PASSED.**
Milestones 1 and 2 remain complete; Milestone 3 remains IN PROGRESS.
Examined latest `main`: `0092f47291a3c4d3305e31e96ccdc6e5494d306f` (PR #703).
Work branch: `codex/m3-controlled-readonly-preflight`.

Phase A passed its source checks and metadata reconciliation. **Phase B failed
closed because the owner approval packet is incomplete.** Phases C and D were
not started. Phase E is limited to offline source/mock evidence; no production
metrics were requested. Phase F records the safe work and remaining requirements.
This is a blocked execution report, not an authorization or population-coverage
certificate. No production documents, user sessions or application callables were
accessed; no writes, deployments, role changes, refreshes or backfills occurred.

## 1. Source preflight and deployment integrity

Reviewed PRs [#699](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/699),
[#700](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/700),
[#701](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/701),
[#702](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/702), and
[#703](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/703),
the original production report, authorization-parity plan, cache-remediation
document and production-canary approval packet. All five PRs are merged.

| Evidence | Independently established result |
|---|---|
| #699 acceptance [38044733888](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/38044733888) | Previously inspected in this investigation: all four jobs passed; source/emulator characterization only |
| #700 acceptance [38045796726](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/38045796726) | Previously inspected: all three jobs passed; audit-only change |
| #701 production [38049616488](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/38049616488) | Refetched job steps: Hosting deployment and live integrity check passed; Functions, Rules and index deployment steps skipped |
| #702 acceptance [38050637842](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/38050637842) | Refetched: individual test repair, unfiltered application suite and zero-impact jobs passed on acceptance head `2d1fa3a95299c8dd6df35cc71e52de987f47d6f7`; acceptance precedes temporary-workflow retirement |
| #703 acceptance [38052191629](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/38052191629) | Refetched: all three M3 jobs passed on `bf47d6a7e068b595f6abd865e2494c71951d3a7d` |
| #703 main [38052335547](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/38052335547) | Refetched: analysis passed, deploy/recovery skipped on the examined baseline |

Phase-A metadata-only Firebase commands succeeded with the existing CLI context:
`firestore:databases:get (default)` and `functions:list`, explicitly targeting
`tinysteps-react-v1`. The single previously inventoried database is Standard,
Firestore Native, `asia-south1`. Functions metadata still reports **198 ACTIVE
Node.js 22 Functions in asia-south1**. No Firebase MCP tools are exposed; Firebase
CLI is available. Metadata success proves only those permissions, not document,
browser-user, Cloud Monitoring, Billing, impersonation or write permissions.

| Resource | Remote production marker |
|---|---|
| Functions | `81af741aef78ea3d8e3cac66e548455ce3a9b43f` |
| Hosting | `8e694ecedb9eecee87a82d1aa9faa080c7f73046` |
| Firestore Rules | `a07f0affa8255a25aaa14ce86e65c8ee1e188e23` |
| Firestore indexes | `dc3a585438c2f29b53118f1b06d42de49d9e6729` |

Public [Hosting build metadata](https://tinystepslearning.com/build-info.json)
matches the Hosting marker. The only Hosting advance since #700 is the expected
#701 cache remediation. Functions and Firestore markers remain unchanged. Deployed
Rules/Storage byte digests and out-of-band deployment absence remain unverified;
markers alone cannot prove those properties.

The source audit inspected 240 production files with zero legacy Admin guard
consumers. The parity and #703 canary-safety preflights passed. All five ledger
flags remain false: `firestoreRulesCutover`, `storageRulesCutover`,
`targetUserBusinessReaderCutover`, `preAuthLoginResolverCutover`,
`destructiveOperations`. `productionMutationsAuthorized` remains false and
`finalExitGate` remains `not_attempted`.

### Endpoint and access-path disposition

| Proposed/candidate path | Classification | Disposition |
|---|---|---|
| Web SDK `getDocFromServer` on an exact existing fixture | Read-only operation; target safety/access unverified until owner supplies allowlist | BLOCKED by missing approval; no queries, listeners or cached-success substitution |
| `getSessionsManagementSnapshot` | Potentially write-capable through bootstrap; rebuild also reads uncapped enrollments | EXCLUDED, even if a preliminary metadata check suggests initialization |
| `adminRefreshSessionsManagementSnapshot` | Write-capable rebuild | EXCLUDED |
| `getSessionsManagementDateSnapshot` | Canonical guard plus date/related-row retrieval; full read budget not independently approved | EXCLUDED / UNVERIFIED for this run |
| `auditParentPaymentBackfillDryRun` | Unbounded-read path, despite dry-run/output limits | EXCLUDED |
| `applyParentPaymentBackfillForSafeParents` | Write-capable, also uses audit loaders | EXCLUDED |
| Rolling create/repair/lifecycle/transition callables | Write-capable or mode-dependent; nested authorization does not make them read-only | EXCLUDED |
| `auditApprovedPrincipals` operator sampler | Bounded read-only facade; not a browser permission check | BLOCKED by separate operator/actor approval gate |
| Teacher subscriptions / parent upcoming UI / full portal navigation | Listeners, uncapped histories or implicit callable paths | EXCLUDED from exact-document canaries |
| Any other endpoint or document not explicitly allowlisted | UNVERIFIED | Default deny; no discovery-by-request |

No exact production resource path was supplied. This inventory classifies proposed
operation classes and known exclusions; it does not claim all 198 deployed
Functions have been independently certified read-only.

## 2. Per-role expected allow/deny matrix

The following expectations are provisional test designs derived from repository
Rules; the owner must bind them to approved existing non-sensitive fixtures and
confirm intent. All live outcomes are **NOT RUN — APPROVAL MISSING**.

| Role | Expected allow | Expected deny | Additional boundary |
|---|---|---|---|
| Global Admin | Approved admin projection point read for an actor with intended legacy and canonical Admin authority | Other approved non-Admin actors denied on the same admin-only resource | A Firestore allow proves current Rules behavior, not canonical callable authorization |
| Founder | Selected management fixture permitted by Founder Rules, such as an approved synthetic charge | Admin-only projection outside Founder read scope | Mutation-denial assertions only in local emulator; no live write probe |
| School Admin | Approved active school in its membership | Other school's fixture; global-admin projection | Verify both school contexts, each direction |
| Teacher | Assigned synthetic session/progress fixture | Other Teacher's unassigned fixture; admin-only projection | Two independent ownership contexts; verify each direction |
| Parent | Own synthetic wallet/progress fixture | Other Parent's fixture; admin-only projection | Two independent ownership contexts; verify each direction |
| Learning Partner | Assigned school fixture with matching LP ownership | Unassigned school; admin-only projection | Global LP role is insufficient without resource assignment |

Stop the entire live work package on an unexpected allow; record only its ordinal
test label and safe outcome, then obtain owner review. An unexpected denial is a
potential regression. Missing documents, invalid sign-in, expired sessions,
timeouts and network failures are inconclusive. A denied test passes only on the
expected permission error from a valid authenticated server-forced request.

No authentication tokens, cached sessions, Admin-minted tokens, service-account
impersonation, shared credentials or real customer sessions were obtained. Future
tests must use each approved actor's legitimate supported sign-in mechanism.

## 3. Canonical source-model coverage and freshness

**Live source coverage, active-state validity, source drift and projection age:
NOT VERIFIED for every role. Approved actor count: 0. Sampled actor count: 0.**

Offline sampler tests passed for all six roles, malformed/missing/inactive/stale
projections, scope mismatch, overflow and redaction. The sampler is unchanged:
maximum 12 distinct approved actors, 7 SDK-get attempts per actor, and two exact
Person-scoped queries with limit 51 (50 records plus overflow sentinel). Maximum
returned documents is 107 per actor. These are request/result bounds, not billed
read ceilings. Stop on overflow; never widen, paginate or invoke refresh writers.

Canonical schema remains version 1 / `canonical-derived`; active Person AND
AuthIdentity are required for active access. Global roles require active global
assignments. School Admin requires active role/membership intersection at the
approved organization. Parser validity is not freshness: it does not enforce an
age limit. Source comparison is non-atomic and any mismatch requires a stable-window
recheck before remediation. Actual Firebase Auth disabled state, organization
record status and population completeness are outside this sampler's claim.

## 4. Legacy/canonical parity and resolved findings

- **High, unresolved:** legacy Firestore/Storage Admin uses users/roles plus
  `superUser` and identity-specific exception types; canonical backend uses an
  active global Admin projection with no such fallback. Exception decisions and
  corresponding real actor mappings are absent. No exception identifier is output.
- **High, unverified:** legacy school membership versus canonical organization
  scope, Founder selected reads, and Parent/Teacher/LP ownership must be verified
  with the approved two-context matrix. A role projection alone proves none of
  these resource-specific boundaries.
- **Resolved in code and deployment lineage:** #701 actor-bound v4 cache,
  session revalidation, logout/account-switch invalidation and authorization-error
  denial. Fresh unfiltered tests cover the merged code. Do not carry forward #700's
  historical cache defect as an unfixed current finding. Live account-transition
  validation remains unverified and full portal navigation is excluded here.
- **Resolved test debt:** #702 repaired all six stale contracts. The fresh full
  suite ran without those exclusions; normal configured skips remain explicit.

## 5. Operation counts and cost evidence

| Quantity | Evidence in this work package |
|---|---|
| Production canary SDK attempts | 0; execution deliberately blocked |
| Production operator sampler SDK attempts | 0; execution deliberately blocked |
| Production documents returned by this investigation | 0; metadata operations are reported separately |
| Actual Firestore billed reads | NOT VERIFIED / null; no approved metrics window or metrics authorization record |
| Incremental reads attributable to a test | NOT VERIFIED / null; no live test or isolated traffic window |
| SDK requests in synthetic characterization | One principal get per load; two sequential loads make two gets. Parent detail loader makes five get operations per parent |

Zero document reads by this audit does **not** mean zero application-wide billing.
Neither query-result counts nor mock SDK calls may be relabeled as billed reads.
No Monitoring/Billing IAM probe, credential elevation or customer-linked metric
query was attempted after the approval gate failed.

Fresh source/mock evidence continues to show:

1. Delegated rolling paths can run both wrapper and legacy canonical guards.
   Two principal gets are a static path estimate corroborated by loader mocks;
   no production call was benchmarked and these mutation paths are excluded.
2. Named-parent payments are fetched before slicing. Selected payment allocations,
   charges, wallet transactions and month records have uncapped child queries.
   Parent limits are applied after allocation reads; response counters can omit
   already fetched records later filtered out. Severity: **high read-budget /
   completeness risk**, not a measured bill or proven financial misstatement.
3. A Sessions Management unchanged-revision path has a static three-point-get
   estimate (principal/current/projection state); changed data adds shards/deltas
   and related rows. Bootstrap writes and uncapped enrollment retrieval exclude
   the endpoint from this run regardless of cache remediation.
4. Parent upcoming-session loading makes two parent-scoped queries for sessions
   and enrollments before local filtering, without server row/date caps. Teacher
   hooks use date/owner-scoped subscriptions with cleanup and batched enrollment
   lookups; a denied batch can fall back to individual gets. Repeated enrichment
   is a possible amplification path; its frequency is not measured.

The separate [finance pagination proposal](IDENTITY_R5_M3_FINANCE_READ_PAGINATION_PROPOSAL.md)
defines completeness, cursor/order compatibility, concurrent-change handling,
independent page/run caps, incomplete-result rejection and required regressions.
No financial query was optimized or rewritten in this PR.

## 6. Fresh regression evidence and reproducibility

Commands were run from the examined baseline with Node 22.22.1 and existing
dependencies. Test inputs are synthetic; local emulator writes are not production
writes. Private/raw diagnostics remain under `/tmp/tinysteps-m3-controlled-evidence`.
Do not upload raw Rules/debug logs; they may reproduce source identifiers.

| Check | Result |
|---|---|
| M3 source + authorization parity + #703 safety preflight | All PASS |
| Parity, safety-preflight and bounded-sampler Node tests | 25 passed |
| Identity foundation/verify/backfill/deployment Node tests | 76 passed |
| Unfiltered application Vitest suite | 694 files / 4,428 tests passed; 17 files / 116 tests skipped |
| Separate complete Functions suite | 179 files / 1,261 tests passed; 2 files / 25 tests skipped |
| Application typecheck + Functions build | PASS |
| Application and Functions lint | PASS; application retains 17 existing warnings |
| Full application build / prerender / postbuild checks | PASS |
| Firestore emulator, isolated two-worker rerun | 14 files / 87 tests passed |
| Storage emulator | 4 tests passed |
| Deployment-impact classifier | PASS: 0 Functions; Hosting, Firestore Rules and indexes unchanged; explicit diff also confirms Storage Rules, runtime and ledger unchanged |

The application suite already includes Functions tests; counts are not additive
unique coverage. First Firestore invocation completed 57 tests but timed out in
three setup hooks, skipping their 30 tests. The observed cause was the 10-second
setup timeout, not a permission assertion failure; concurrent build/test resource
contention is a plausible contributor, not a proven root cause. The isolated
two-worker rerun passed all 87 tests. An initial log-directory setup race also
prevented two command groups from starting; they were rerun after the directory
existed, and no unexecuted command was counted as a pass.

Reproduce the source package without credentials:

```sh
npm --prefix functions run build
node scripts/milestone3-system-audit.mjs
node scripts/milestone3-authorization-parity-audit.mjs
node scripts/milestone3-canary-read-safety-preflight.mjs
node --test scripts/test/milestone3-*.node-test.mjs
```

For local permission tests use demo projects, never production fixtures. Run
Firestore alone with `--maxWorkers=2`; run Storage with its exact fixture project
`demo-tinysteps-m3-storage-parity` so cross-service Rules lookups agree.
Build-generated public assets were restored; this package changes documentation
and privacy-safe evidence only. No runtime, Rules, index, ledger or sampler changes.

## 7. Exact missing approval and evidence requirements

The existing [approval packet](IDENTITY_R5_M3_PRODUCTION_CANARY_APPROVAL_PACKET.md)
still states **PREPARED, NOT APPROVED**, with blank owner-reserved fields. The new
request authorizes safe investigation but expressly conditions live reads on this
packet; it does not fill those fields. Complete these items privately:

1. Owner approval record naming designated, controlled accounts for all six roles,
   expected roles/active states and two school, two Parent and two Teacher contexts.
   No more than 12 actors for the sampler. Do not send identifiers in chat/GitHub.
2. Legitimate supported sign-in sessions for those actors, with no impersonation,
   shared credentials, Admin-minted tokens or unapproved session/token extraction.
3. Exact existing non-sensitive Firestore document allowlist, private fixture
   ownership and school mapping, and expected allow/deny result for each test.
4. Explicit project/origin and production revision approval, start/end window,
   per-actor and total operation/row limits, timeout/retry policy, model-age
   threshold and security-stop protocol. The project is known; execution approval
   and the time/budget fields are not supplied.
5. Separate operator authorization and least-privilege read access for the bounded
   sampler. Browser-session approval and metadata CLI access do not grant it.
6. Separate Cloud Monitoring/Billing authorization, approved metric scope/window,
   attribution baseline and expected metric delay if billed-read evidence is sought.

Additional unverified exit evidence: actual per-role outcomes and two-context
isolation; canonical age/drift and exception-role parity; actual billed and
incremental usage; deployed Rules/Storage artifact identity; named owner acceptance
or remediation of blocking findings. None is inferred from passing CI.

## 8. Dependency-ranked next batches and verdict

| Order | Batch | Exit evidence / owner |
|---|---|---|
| 1 | Complete private actor/resource/session/operator approval | Identity/security owner; all six missing packet groups addressed or explicitly declined |
| 2 | Run approved exact-document canaries and separately bounded principal sample | Audit operator; server-forced outcomes, drift/freshness and isolation evidence; unexpected allow stops work |
| 3 | Reconcile legacy exceptions and school mappings | Identity/security owner; evidence from batch 2, explicit decisions, separate remediation PR if needed; no automatic Rules cutover |
| 4 | Review and implement finance pagination in a separate work item | Finance owner; proposal's exhaustive synthetic equivalence and incomplete-result regressions before any live sample |
| 5 | Measure authorized operational read/error budgets; optimize only after measurement | Operations/backend owners; independent billing/attribution evidence, then optional principal/enrichment deduplication or parent-history bounds |
| 6 | Final independent M3 exit review | All required live gates plus deployed lineage, residual-risk decisions and passing regressions; no automatic merge/deploy |

Batch 4 design can proceed offline without batch 2, but its implementation and
production sample need their own review. Responsible roles above are proposed
owners, not recorded risk acceptance.

**Milestone-3 readiness: NOT PASSED.** Independently safe verification is complete;
live verification remains stopped at the owner's explicit approval gate. Keep every production
cutover flag disabled. No production fix, deployment or final-exit flag is part of
this evidence package.
