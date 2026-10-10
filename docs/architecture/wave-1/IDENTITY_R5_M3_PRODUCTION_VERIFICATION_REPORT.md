# Milestone 3 — production authorization and Firestore verification

Audit date: 2026-10-10 (Asia/Kolkata). Base: latest fetched `main`,
`df8df70941a8a6846fc9e80a1bf55b7ac3c02cbe` (merged PR #699).

**Verdict: HOLD / Milestone 3 remains IN PROGRESS.** Local verification passed;
approved live actors, principal coverage, browser canaries and billed-read budgets
are not verified. No exit flag, production source, Rules, indexes or identity
reader was changed. No production document was read or written by this audit.
Only deployment/database metadata and a public Hosting build marker were read.

## 1. Verified checks and evidence

### Entry baseline and available access

- Reviewed [PR #699](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/699),
  its parity/canary architecture document, the M3 final-verification document and
  the canonical identity ledger before adding audit tooling.
- Independently retrieved [acceptance run 38044733888](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/38044733888):
  all four jobs succeeded at `8ae21bd92e97bc7bf86304510b0dcf1bd149536e`.
  This is PR-head CI evidence, not a production-canary result.
- [Post-merge run 38044978512](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/38044978512)
  succeeded on the audit base: impact analysis reported zero Functions, Hosting,
  Rules and index changes; deployment and manual recovery jobs were **skipped**.
- Firebase plugin skill is available; no Firebase MCP operations are exposed in
  this session. Installed Firebase CLI is 14.26.0; Node is 22.22.1; Java is present.
  Existing CLI authorization successfully ran `firestore:databases:list`,
  `firestore:databases:get (default)` and `functions:list` for the configured project.
  Account identifiers and credential material were suppressed.
- Project and Hosting site: `tinysteps-react-v1`. Only database: `(default)`,
  `FIRESTORE_NATIVE`, edition `STANDARD`, location `asia-south1`.
  Functions inventory: **198 ACTIVE**, all reported in `asia-south1`, Node.js 22.
  Metadata permission success does not prove document-read IAM, browser permission,
  access to usage metrics, or deployed Rules/source byte identity. Write permissions
  were neither exercised nor tested.

| Resource | Remote production marker observed |
|---|---|
| Functions | `81af741aef78ea3d8e3cac66e548455ce3a9b43f` |
| Hosting | `7d006eb400fc42820028c470045b3fcbfabfccab` |
| Firestore Rules | `a07f0affa8255a25aaa14ce86e65c8ee1e188e23` |
| Firestore indexes | `dc3a585438c2f29b53118f1b06d42de49d9e6729` |

The Functions marker matches the M2 ledger. The public
[`build-info.json`](https://tinystepslearning.com/build-info.json) `gitSha` matches
the Hosting marker. These are lineage observations; no direct deployed Rules
digest or Storage release marker was independently obtained. No unexpected
deployment appeared in the inspected post-M2 GitHub runs, but out-of-band deploys
cannot be excluded by Git markers alone.

### Local regression results

| Check | Result |
|---|---|
| M3 system source/ledger audit | PASS; 240 production source files, zero legacy Admin consumers |
| M3 authorization parity source audit | PASS; held cutovers unchanged |
| Existing identity/backfill/deployment/parity Node tests | 81 passed |
| New bounded principal sampler | 12 passed; all six requested roles, overflow, redaction, missing/invalid/drift/inactive, tenant mismatch |
| Complete Functions suite after additions | 179 files / 1,261 tests passed; 2 files / 25 tests skipped |
| M3 operational regression matrix | 20 files / 158 tests passed |
| Additional snapshot and parent/teacher read behavior | 3 files / 26 tests passed |
| Firestore Rules local emulator | 14 files / 87 tests passed |
| Storage Rules local emulator, correct fixture project | 1 file / 4 tests passed |
| Functions TypeScript build; application typecheck | PASS |
| Application lint; Functions lint; new test lint | PASS; application retains 17 existing warnings |
| Full application build, prerender and postbuild checks | PASS after local-loopback permission retry |
| PR deployment-impact classifier | PASS: zero Functions; Hosting, Firestore Rules and indexes unchanged; explicit path diff also confirms Storage Rules unchanged |

Skipped Functions tests are not counted as passes. Logs are local diagnostic
artifacts under `/tmp/tinysteps-m3-evidence`; raw emulator logs are deliberately
not published, since Rules diagnostics can contain source literals. CI regenerates
safe source reports and synthetic test results. Build-generated public files were
restored; none belong to this PR.

## 2. Failures and root causes

1. Initial build could not bind its prerender server to `127.0.0.1:4173` inside
   the sandbox (`EPERM`). The same build passed with loopback permission.
2. Initial combined emulator invocation used `demo-tinysteps-m3-audit`, while
   Storage fixtures use `demo-tinysteps-m3-storage-parity`. One expected allow
   failed (`storage/unauthorized`); all 87 Firestore cases passed. Repeating Storage
   alone with its exact project ID passed all four cases. Use the existing CI's
   separate invocations to keep cross-service Rules lookups in the correct project.
3. New mock test initially used an explicit `any`; replaced it with a narrow
   recursive interface and reran lint successfully. No runtime fix was needed.
4. Storage's denied paths retain the known undefined token-email Rules warning
   from #699. Denial assertions pass; this is not evidence for a Rules cutover.

## 3. Canonical schema, bounded checks and unverified gates

Authority is `functions/src/schoolOS/identity/authAccessReadModel.ts`, with browser
independent parsing in `authAccessAuthorization.ts`. Document key is Firebase UID.
Required fields: `schemaVersion: 1`, `authority: canonical-derived`, matching
`firebaseUid`, `personId`, `sourceAuthIdentityId`, valid `personStatus` and
`authStatus`, consistent boolean `accessActive`, unique recognized `globalRoles`
and unique `schoolAdminOrganisationIds`. `updatedAt` is written by maintenance,
but **the authorization parser does not enforce age or source freshness**.

`accessActive` means active Person AND active AuthIdentity. Global roles come
from active, global RoleAssignments. School Admin access is the intersection of
active organization-scoped `schoolAdmin` RoleAssignments and active matching
OrganizationMemberships; it never implies global Admin. Founder, Teacher,
Parent and Learning Partner are distinct roles, not Admin aliases.

`ensureCanonicalAdmin` performs a UID point lookup and fails closed for missing,
invalid, inactive or non-Admin principals. It has no legacy/claim/identity exception
fallback. Maintenance has strict and best-effort paths; best-effort refresh failure
can leave an older projection. A structurally valid projection alone therefore
does not establish source parity or current Firebase Auth account status.

Existing source audits are safe offline. `wave1-auth-access-read-model-backfill.mjs`
has bounded whole-collection inventory and write modes: **not executed**. Neither
backfill nor `refreshAuthAccessReadModel` is a read-only verification operation.

### Prepared sampler (not executed against production)

`scripts/milestone3-bounded-principal-audit.mjs` exports `auditApprovedPrincipals`.
It has no CLI, credential discovery, Firebase app initialization or login flow.
Build Functions, then an authorized operator can inject a read-only database and
an explicitly approved private actor manifest. Do not commit that manifest.

- Maximum 12 distinct actors; UID/path and role validation occurs before any read.
- Per actor: five possible point reads (`authAccessReadModels`, deterministic
  `authIdentities`, linked `people`, `users`, `schoolUsers`) plus two queries scoped
  to that exact Person: RoleAssignments and OrganizationMemberships, each limit 51.
- The 51st row is an overflow sentinel for a 50-record bound. Overflow returns
  incomplete evidence; no pagination, retry, wider scan or implicit repair follows.
- Maximum **7 SDK get attempts / 107 returned documents per actor**, or 84 attempts /
  1,284 returned documents for 12 actors. These are operation/result bounds,
  **not billed-read ceilings**. Retries and service billing are separate.
- Reuses the canonical parser, source loader and pure builder. Detects absent or
  malformed projections, inactive state, source drift, expected role/scope absence,
  legacy role/status signals, superUser discrepancy and approved school mapping
  mismatch. It never invokes the refresh writer.
- Output contains actor ordinal, role, fixed issue codes, age category and counts;
  no UIDs, person/school IDs, emails, document payloads, identifier hashes or raw
  errors. Returned document counters do not report billing.
- Caller supplies `nowMs` and owner-approved `maxAgeMs`; old age alone is not proof
  of drift. Reads are non-atomic: recheck drift in a stable window before remediation.
  No population-wide completeness, actual Auth disabled-state, organization-record
  status, ownership, identity-specific exception or browser-access claim is made.

### Required production approval packet

Provide approval for a private manifest of designated test accounts representing
the six roles, including two school contexts, two Parent owners and two Teacher
contexts. Include expected canonical roles/scopes, approved legacy-school mapping,
specific existing non-sensitive resource paths, expected allow/deny outcomes,
run window, maximum request budget, freshness threshold and stop conditions.
Provide authorized user sign-in sessions through supported login and separately
authorize the bounded operator principal sampler. Do not send passwords or tokens
in chat, GitHub, manifests committed to the repo, or audit output.

No such actors/sessions or resource allowlist were supplied. **Phase 3 stopped
before authentication.** Metadata CLI access is not permission to impersonate users.

| Actor | Approved existing positive read to select | Negative read to select |
|---|---|---|
| Global Admin | Canonical-guarded, source-reviewed side-effect-free endpoint; approved admin projection point read | Role denials established using other approved actors |
| Founder | Approved synthetic `billingCharges` fixture | Admin-only projection; mutation denials only in emulator |
| School Admin | Approved own `schools` fixture with active membership | Other school's fixture and global-admin projection |
| Teacher | Assigned synthetic `classSessions`/progress fixture | Other Teacher's fixture and admin-only projection |
| Parent | Own synthetic `parentWallets`/progress fixture | Other Parent's fixture and admin-only projection |
| Learning Partner | Assigned synthetic `schools` fixture (`learningPartnerId`) | Unassigned school and admin-only projection |

Use Web SDK server reads (not cache-only success) and exact allowlisted paths,
no unrestricted listeners or list queries. Record fixed outcome/error categories
and counts only. A negative canary passes only on the expected permission denial;
timeout, unauthenticated, not-found or network failure is inconclusive. Do not log
snapshots or browser network headers. An unexpected allow stops that actor's run.
Never use Admin SDK to simulate browser permissions. Even an expected-denied write
could succeed: Founder read-only mutation denial and all other write denials remain
**emulator-only**, under the production no-write constraint.

**Endpoint exclusion:** `getSessionsManagementSnapshot` bootstraps via
`rebuildSnapshot` when metadata is absent/incompatible; that branch writes leases,
shards and metadata. Exclude it, manual refreshes, payment audits with unbounded
queries, scheduling mutations and full portal navigation that might trigger them.
Pre-reading metadata cannot eliminate a race; select an independently reviewed
side-effect-free endpoint. No callable was invoked in this investigation.

## 4. Authorization-parity risks

- **High / known hold:** Firestore and Storage still use legacy `users` authority,
  including `superUser` and identity-specific exception types. Canonical backend
  Admin requires active global canonical Admin. Both false allows relative to the
  canonical model and false denials for canonical-only Admin remain possible.
  No exception identifier or real-user outcome is reported.
- **High / unverified:** legacy `schoolUsers.schoolIds` and canonical organization
  scopes need actor-by-actor reconciliation. Founder has selected legacy read
  access but no implicit canonical Admin permission. Other role ownership checks
  still depend on resource fields and cannot be proven by a global role alone.
- **High / source-observed cache risk, live exposure unverified:** Sessions
  Management uses a single unscoped memory/sessionStorage cache; revalidation
  catches all errors and can return cached data even after authorization denial.
  The cache reset is named/used for tests; inspected AuthBootstrap, auth store and
  logout paths do not clear it. Existing tests explicitly characterize cached
  fallback. Add a separate remediation and account-switch/revocation test: bind
  cache and in-flight work to actor, clear on identity change, and never serve the
  fallback on authorization errors. This is not a claim of bypassing Firestore
  Rules or observed cross-user access in production.

## 5. Firestore read-cost findings

**Measured production billed reads: unavailable. Production SDK request counts:
unavailable.** No Cloud Monitoring/Billing metrics or isolated production request
trace was obtained. `firestoreReadLogging.ts` is DEV-only and reports result size /
SDK events, not billed reads; paths/errors may contain identity data, so do not
publish raw debug logs. Backend `dataRead` fields likewise describe selected
results, not all fetched documents, index reads, retries or Rules-dependent reads.

| Surface | Evidence type and result | Implication |
|---|---|---|
| Canonical principal load | Mock-observed: one `.get()` per load, two for two sequential loads | No request-local deduplication in loader; not a billing measurement |
| Rolling compatibility delegation | Static: wrapper guard then guarded legacy callable | Two principal reads on those paths, plus domain reads; preserve fail-closed guards when optimizing |
| Payment dry-run, explicit parent | Mock-observed uncapped payments query, then output slice; allocation query per selected payment also uncapped | `limitPayments` does not bound parent payment fetch cost |
| Parent-scoped payment detail | Mock-observed five get operations per parent: charges query, wallet point, transactions query, months query, user point | Three queries uncapped; `limitParents` does not bound returned documents |
| Payment audit formula | Static operation estimate: 1 guard + 1 payments query + K allocation queries + 5P parent operations | K selected payments, P selected parents; returned-row cost depends on uncapped collections |
| Sessions Management unchanged revision | Static: principal + current metadata + projection state = 3 point get operations | In-flight requests coalesce; sequential revalidation still contacts backend |
| Sessions Management changed/extra-date/bootstrap | Static: shards/deltas/related rows add reads; extra date caps sessions at 200; rebuild reads all enrollments | Neither constant-cost nor uniformly bounded; bootstrap also violates audit no-write rule |
| Parent upcoming sessions | Static: parent-scoped sessions and enrollments queries, then local filtering | Two SDK query calls can return an entire parent's history; no server date/row cap |
| Teacher sessions/upcoming hooks | Static: live session subscriptions, batched identity lookups and fallback point gets; cleanup present | Repeated snapshots or overlapping mounted hooks may repeat enrichment; no measured unnecessary-listener rate |
| Admin Sessions Management UI | Static: single projection-state listener, snapshot cache and revision check | Existing cost mitigation; validate cache isolation before extending cache lifetime |

For a later approved measurement, isolate a short run window, record SDK get/query/
listener attach-delivery-detach counts and server/cache origin without payloads,
and correlate with authorized Firestore usage metrics. Aggregate billed metrics
need background-traffic attribution; do not claim per-request billed reads from
SDK counts. Define read, latency, denied/missing-principal and freshness budgets
with the owner before declaring them healthy. AVS and session snapshot production
budgets remain open as required by the prior M3 exit document.

## 6. Prioritized recommendations

| Priority | Action | Required owner / evidence |
|---|---|---|
| P1 | Keep M3 exit and Rules/reader cutovers held until live gates are evidenced | Identity/security owner; approved actors, parity and exception decisions |
| P1 | Scope/invalidate Sessions Management cache and reject authorization-error fallback | Portal owner; synthetic account-switch/revocation tests, separate runtime PR |
| P1 | Preserve read-only canary boundary; exclude snapshot bootstrap endpoint | Audit owner; source-reviewed endpoint/resource allowlist |
| P2 | Bound/paginate payments, allocations, charges, transactions and month queries | Finance owner; separate completeness-safe pagination tests, never silently truncate financial conclusions |
| P2 | Verify projection drift/freshness and best-effort maintenance outcomes | Identity owner; bounded sample, separately approved Auth-status evidence and remediation |
| P2 | Add date/row bounds for parent upcoming reads with correctness tests | Portal owner; representative synthetic large-history fixtures |
| P3 | Measure and reduce duplicate delegated auth/enrichment reads | Backend owner; request-scoped verified principal design and revocation tests |
| P3 | Record deployed Rules/Storage release digests and attributable read budgets | Operations owner; least-privilege metadata/metrics evidence |

No owner risk acceptance is implied by listing a responsible role. No production
fix is included here. The workflow now runs this non-production audit PR's checks
on matching pull requests; previously its push trigger named an older branch and
only scheduled/manual runs covered current main. It retains contents-read permission
and runs only local/synthetic verification.

## 7. Readiness and next gate

Safe source, metadata and local regression phases are complete for the examined
base. Phase 2 tooling is prepared and synthetically verified; live source coverage
is blocked. Phase 3 is blocked on explicit test-actor/session/resource approval.
Phase 4 produced mock counts/static findings; production cost health is unverified.
Final milestone exit is **NOT PASSED**. The prior ledger remains unchanged.

Before exit: obtain approved bounded principal/canary evidence; resolve or obtain
named acceptance for parity/cache risks; quantify operational read/error budgets;
reconcile deployed artifact identity; pass the independent final gate and merge
its evidence. This PR is review-only and must not be automatically merged.
