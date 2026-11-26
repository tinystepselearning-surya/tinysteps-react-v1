# P01.1-D13 — offline verification and discovery acceptance evidence

**26 November 2026 IST. P01 in progress.** Main `701c7ec832dbe9c531964496fa09cd4a4948ddd2`. Reviewed D12 head `b01397ec894c8a5770b2999ee5290928b7a169bf` on draft #933, stacked on open #932 at `df281b19145406d139679e0922af3a3bf92ff213`. GitHub comparison showed 38 commits ahead, zero behind and 16 Markdown-only paths relative to main before D13. P01.2, live P01.3, M3, retirement and P02 remain held. D13 changes documentation only.

## 1. Fresh offline execution

The local checkout's last fetched main was `ff18e4c39e7e0ad5ecf56414dbc3c14ea0f5fd52`. Direct Git fetch in a disposable repository failed at GitHub DNS. Reconstructed the audited runtime source in scratch from a Git archive of that cached main plus all 253 paths from the GitHub comparison to the audited pin (83 added, 170 modified). Verified each replacement against its GitHub blob SHA. The reconstruction supplied the tested file contents. It had no audited commit objects or verified candidate tree identity. The draft's Markdown-only delta does not change the tested runtime files.

Node 22.22.1 and npm 10.9.4. Offline `npm ci` could not use the writable cache paths needed for a Git dependency. Reused isolated copies of local installed packages and checked their versions against the pinned lockfiles. All 1,370 root and 794 Functions installed lockfile entries checked matched. Another 67 and 23 optional or dev-optional entries, respectively, were absent. This is local regression evidence with version-checked dependencies. A clean separately provisioned installation remains CI evidence to obtain. Test commands ran with a clean environment and without production credentials.

| Evidence | Execution and observed result |
|---|---|
| Application and operational regression | **223 passed across 32 files.** Ran the workflow's 24 operational Vitest files plus eight focused files covering portal clocks, auth bootstrap, Upcoming, Teacher Dashboard, session time and time zone, historical attendance routing and teacher enquiry guardrails. |
| Critical application suite | `npm run test:critical -- --maxWorkers=4` **107 passed across seven files**. Some cases overlap the preceding suite. |
| Functions regression | `npm --prefix functions test -- --maxWorkers=4` **1,408 passed, 80 skipped**, 193 passed files and four fully skipped files. Skipped cases include emulator-gated work and one worksheet test. The no-emulator configuration excluded the SEO attribution integration file. |
| Functions TypeScript | `npm --prefix functions run build` **passed**. |
| Source and migration ledger | All three M3 offline source/read-safety audit commands exited zero. System audit verdict: code and ledger gate passed with live authorization unverified. The canary preflight preserved the unauthorized/live-pending verdict. The source snapshot has no Git HEAD. |
| Node verification harnesses | **29/29 passed** across M3 authorization parity, canary read-safety preflight, canary outcome reduction, identity reference audit and academic enrollment audit unit tests. Ran test entry points only. |
| Fresh Firestore/Storage security emulator | **Blocked before tests.** Firebase CLI 15.37.0 attempted Firestore and Storage against `demo-tinysteps-m3-storage-parity`, using pinned Rules files and loopback listeners. The sandbox returned `listen EPERM` for the hub and emulator ports. A separate ephemeral loopback bind reproduced `EPERM`. The GitHub connector cannot dispatch the workflow, and the browser session was signed out. |
| Existing CI | [Run 45602427036](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/45602427036) rechecked. All three historical jobs passed, including both emulator steps. This is baseline evidence on main, dated 25 November IST. |

No production or external provider business data was accessed. No fresh I01–I13 live reconciliation, role canaries or browser end-to-end checks are claimed. The earlier D10 matrix remains the scenario-level evidence index.

## 2. Deployment-impact check

Refreshed all four production-marker comparisons against the reviewed draft head. The merge base for each comparison matched its marker, with zero behind. The deployment workflow is main-push triggered. Marker ancestry is Git evidence and cannot establish deployed artifact identity.

| Marker ref | Resolved marker | Changed paths to D12 head | Relevant classifier output |
|---|---|---:|---|
| `ci/functions-production` | `00950ac1b2560cd0a99a2ae12b541c2af1ab23b4` | 90 | Functions deploy false, full false, targets 0, retired 0 |
| `ci/hosting-production` | `701c7ec832dbe9c531964496fa09cd4a4948ddd2` | 16 | Hosting false, no IndexNow notifier delta |
| `ci/firestore-rules-production` | `b181dbca2e835869bf52b3ba0632b957234eae1d` | 88 | Rules changed false |
| `ci/firestore-indexes-production` | `7f93c81a9eea909f06d76c1a2d6ba1c3df5b6e9f` | 257 | Indexes changed false. Classifier flags Firestore validation because this older marker comparison includes a Rules delta. |

**Actual resolver CLI gate: incomplete.** Invoked the unmodified resolver with real main, draft and all four marker SHAs. It stopped at the first local `git merge-base --is-ancestor` with Git exit 128 because actual objects could not be fetched. No fake commits, marker changes or forced recovery flags were used.

The original resolver library then ran on GitHub's actual comparison path lists, including old and new filenames for renames, and the pinned `firebase.json`. Both the event and Functions marker comparisons had no `functions/src/` or `firebase.json` changes, so the same pinned 250-file Functions snapshot was used on both sides. Hosting, Rules and Indexes classification used their own separate marker comparisons. The table records the outputs relevant to each artifact. This supplemental classification supports zero intended deployment impact for the reviewed docs-only delta. The release gate still requires the unchanged CLI to run on fresh exact Git history for the final candidate, with each marker resolved as an ancestor and all output flags reviewed, followed by the owner gate.

## 3. Significant source dependency closure

| Surface | D13 evidence and disposition |
|---|---|
| Teacher session requests | Historical teacher `addDoc` creation is visible in `0008cd67c` in `src/pages/teacher/components/schedule/ScheduleView.tsx`. `467284417` removed the older teacher request interface, subscription and delete path. At the pinned source, `StudentList.tsx:1733–1769,2293–2382,2629–2636` still has a bounded Admin collection-group subscription and approval/rejection cleanup of the same request path. Historical producer identified. Dynamic writers, older clients and external/manual producers remain open. Preserve the Admin compatibility workflow. |
| Teacher enquiries | `7a39569f3` (#717) removed the public Careers client writer and closed public applications. Pinned `CareersPage.tsx`, `firestore.rules`, `TeacherInquiriesWorkspace.tsx:120,238,259` and the fresh workspace guardrails corroborate the Admin reader and stage/close writers. Keep historical records and the active Admin workflow. Confirm any standalone or external recruitment intake and retention separately. |
| Invoice and PhonePe dependency | The pinned route registers Checkout and Callback in `src/app/routes.tsx:868–870`. Checkout reads `invoices/{invoiceId}` and calls `createPhonePeOrder`. Callback calls `verifyPhonePePayment`. Neither endpoint is defined in pinned `functions/src`. Parent invoice hooks and the LP component supply additional source readers whose current mounting was not established. The invoice producer, deployed endpoint status and operational owner remain open. No provider call or payment attempted. |
| Game skill statistics | `applyTagStats.ts:47–90` is a batch writer with no located caller at the pin across app, Functions and scripts. Current game exports and their implementations do not reference it. `wipeKidGameData.ts:214–217` is a separate destructive consumer. Historical data, external effects and retention remain open. Keep the helper and deletion hold. |
| Firebase database selection and native packages | `src/lib/firebaseConfig.ts:74,76–129` uses the Firebase JS app and default Firestore selector in the web/Capacitor path. The checked native app source contains no separate Firestore native client or named database selector. The Data Connect emulator stanza in `firebase.json` supplies no client or connector evidence. Physical database IDs, regions, native releases, external integrations and separate data stores still require approved inventory. |
| Seven academic probes | Exact operational collection-string search found the seven names only in `scripts/audit-academic-enrollment.mjs:667–673` among the inspected app, Functions, rules/indexes, scripts and native sources. The JS collector selects `schemaVersion`. Treat them as source probes with unresolved live existence and ownership. |

The catalogue count remains 175 structural paths, 160 scoped and 15 unresolved. This closes specific source lineage questions within existing scoped rows. It leaves the eight Rules-only unknowns, seven probes, untraced current writers and off-repository dependencies subject to separate evidence.

## 4. Bounded reconciliation verification

Independently extracted D12's exact documented function and reran the same 20 synthetic scenarios. **20/20 passed** with full result objects asserted, including `attempts`, `reserved`, `returned` and `complete`. Three additional observations establish implementation requirements:

- Extra observations after a sentinel overflow can be ignored by the reducer. The collector must enforce one dispatch per reserved operation and stop issuing requests before accepting subsequent observations.
- A `missing` status with a positive count currently returns `MISSING_REFERENCE`. The adapter needs a typed status/count contract and explicit handling of inconsistent transport results.
- The synthetic alias allowlist does not bind an alias to a document path, operation kind, projection or ordering. The adapter must enforce that binding in a reviewed manifest before dispatch.

The next implementation is an isolated read-only collector with an injected transport and synthetic/emulator-only entry point. Validate the allowlist, target and budget before dispatch. Enforce field masks, deterministic ordering, point/set shapes, cap+1, dependent-read reservation, timeouts and stop-on-error. Define snapshot consistency and privacy-safe aggregate output, then compare results against the existing reducers on the same fixtures. Add representative negative tests before reviewing any production adapter or separate bounded application-data scope. The count prototype provides no billed-read or production coverage evidence.

## 5. Acceptance evidence and prerequisites for P02

| Gate | D13 disposition and remaining requirement |
|---|---|
| P01.1 / P01.4 source and dependencies | Scoped source evidence and fresh regression results added. Finish review of significant indirect, script, native/older-client and off-repository dependencies. Confirm finance/payment and recruitment ownership. |
| P01.2 / live P01.3 | HOLD. [Metadata-only packet](P01_METADATA_ONLY_APPROVAL_PACKET_2026-11-26.md) is prepared. Owner must privately designate operator and reviewer and approve exact resources, actions, bounds and retention. Application sampling needs separate approval. |
| P01.5 / P01.6 integrity and authorization | Offline source and selected application/Functions tests recorded. Fresh security emulator run on an isolated runner is still required. Build and verify the bounded adapter offline before requesting live sample approval. M3 live actor and data scope remains a separate hold. |
| P01.7 reliability and release | Full-history actual marker CLI and owner review are required before merge. Baseline read/latency/cost and recovery evidence plus owner RPO/RTO decisions remain pending. |
| P01.8 migration reconciliation | Rechecked pinned ledger. M3 read-switch/live canary is still in progress, final exit remains unattempted and production mutation and retirement gates remain held. Earlier historical migration counts remain historical. |
| P01.9 acceptance and P02 | Prepared for owner and independent engineering review. Sign off on reviewed evidence, residual risk owners and ordered backlog. P02 then requires its own owner authorization, adopted v1 alignment, domain and ADR decisions, privacy/retention review and engineering governance. |

Next eligible execution: obtain the fresh isolated security emulator result and complete the exact-history resolver from a runner with Git fetch and loopback access. Continue source-only dependency closure and prepare the offline adapter scope. No merge, release, data migration, Rules edit or phase promotion is authorized. Revert this documentation delta to roll back the D13 evidence update.
