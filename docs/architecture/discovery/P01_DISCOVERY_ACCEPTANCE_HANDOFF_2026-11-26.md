# P01.1-D11 — discovery acceptance and verification handoff

**Status: PREPARED / P01 IN PROGRESS; live gates HOLD.** 26 November 2026 IST. Pinned main 701c7ec832dbe9c531964496fa09cd4a4948ddd2. Draft #933 on #932. This is a decision and execution handoff, not approval, phase exit, or implementation of P02. No production reads, mutations, credential use, migrations, deployments, or fresh runtime tests.

## 1. Evidence and current migration commitments (P01.8)

Re-read the existing Wave 1 migration ledger `docs/architecture/wave-1/migrations/identity-foundation-v1.json`, M3 controlled verification status, profile migration contract, v1 architecture standard and roadmap. Do not introduce a conflicting migration ledger or overwrite historical status.

| Obligation | Ledger evidence (historical, not fresh live verification) | Current disposition |
|---|---|---|
| Wave 0 architecture contracts | v1 roadmap and enterprise standard; current-to-canonical map | retain; V2 additive, not replacement |
| Wave 1 identity core backfill | 419 source records, 1253/1253 targets matched, 4 Oct 2026; 423 sources and 1265/1265 targets after catch-up, zero reported missing/drift/conflicts/unexpected | historical verification; household excluded; current population/coverage unknown |
| Wave 1 profile migration | 891/891 targets matched, independent verification 4 Oct 2026, zero reported semantic issues or unexpected migration-owned targets | historical verification; preserve permanent role profiles and compatibility |
| Canonical-primary write adoption | ledger records scoped canonical writes; D3/D7 verified selected current source routes | do not infer global writer/reader cutover |
| Wave 1 M3 | switchReads.status r5_milestone3_final_system_verification_in_progress; nextBrick r5_m3_live_role_canary_and_read_model_freshness_read_only_gate; finalExitGate not_attempted; productionMutationsAuthorized false | HOLD, separate actor/fixture/operator approval; no live access |
| Retirement | readSwitchedAt, legacyWritesStoppedAt, retiredAt null; legacyWritesFrozen false; destructiveDeletionAuthorized false | no deletions, write freeze or global cutover |
| Other v1 waves | Wave 2 academic, Wave 3 scheduling, Wave 4 finance, Wave 5 consolidation, Wave 6 intelligence/governance | use current domain evidence; no historical implementation completion inferred |

M3 r5c flags firestoreRulesCutover, storageRulesCutover, targetUserBusinessReaderCutover, preAuthLoginResolverCutover and destructiveOperations remain false. Historical ledger fields are not fresh authorization. Existing scheduled verification evidence 45602427036 passed on pinned main; no live role, canonical coverage or billed-read pass.

D11 catalogue delta: 168 unique structural paths, 160 scoped, eight unresolved. Added six permanent role/profile/derived/provenance/organisation paths backed by migration source/contract plus three existing legacy reader paths; corrected parent/teacher role-profile classification. See catalogue revision 3. The legacy useData attendance reader scans root and nested child records and compares UTC dates; current mounted consumer unknown. Do not modify or revive it on this basis. Pending paths, dynamic paths, scripts/native/indirect edges and live field coverage remain unknown.

## 2. Current open PR overlap and dependency disposition

GitHub open PR search at pinned main: #932 controlling programme, #933 stacked discovery draft. Existing #929 lead optimization, #928 discontinued enrollment, #924 finance, #925 worksheets and #927 combined audit remain separate, open. #927 overlaps finance/worksheet work; do not merge or duplicate based on this handoff. Other open SEO PRs #926/#887/#882/#867/#821/#814 separate. Re-pin and re-evaluate affected path/edge evidence after any main change. No merges authorized by this document.

## 3. Executable offline verification handoff (no deployment)

Actual environment check this session: no Git checkout or gh CLI, Node 22.16.0/npm 10.9.2; root package requires Node 22.22.1. GitHub connector exposes read and failed-job retry but not workflow dispatch. Do not manufacture local commits or use production credentials. Existing `.github/workflows/milestone3-system-verification.yml` inspected in full: manual workflow_dispatch, contents:read, three jobs, no deploy command, no production credential references; draft docs path not among PR path filters. Existing emulator package script uses production-named project ID, so verify isolation and use a demo project for any separately run emulator; do not reuse actual production credentials. The existing CI job is a regression job, not owner approval. Fresh manual run is recommended on exact candidate from GitHub Actions UI, not the deployment workflow, after authorized operator verifies current workflow/test inputs. No workflow triggered in this session.

For a controlled local checkout (operator's Mac or approved isolated runner), with Node 22.22.1, no production credentials and synthetic fixtures:

1. Fetch origin main and both programme branches. Verify candidate HEAD, merge-base, clean tree and exact docs-only diff. Re-pin if changed; do not merge or push main.
2. Review install scripts/imports and prepare dependency environment. Existing CI uses npm ci --ignore-scripts and npm ci --prefix functions --include=dev; use isolation and inspect lifecycle scripts first. Verify test targets/emulator host before running. 
3. Run `node scripts/milestone3-system-audit.mjs`, `node scripts/milestone3-authorization-parity-audit.mjs`, `node scripts/milestone3-canary-read-safety-preflight.mjs`. These are local source/ledger scripts, not live canaries. Record output and stop on unexpected predicate change.
4. Run `node --test scripts/test/milestone3-canary-read-safety-preflight.node-test.mjs scripts/test/milestone3-authorization-parity.node-test.mjs scripts/test/milestone3-canary-outcome-reducer.node-test.mjs`. Run synthetic audit tests `npm run test:identity-reference-audit` and `npm run test:academic-enrollment-audit` after entrypoint inspection. Do not invoke their live audit CLI.
5. Run Functions build and regression: `npm --prefix functions run build`, `npm --prefix functions test`, `npm run test:critical`; execute D10 I01–I13 targeted tests and emulator cases with isolated demo project and loopback host; identify missing tests separately. Full workflow includes additional operational regressions. Keep evidence per test/commit, counts, exclusions and failures; do not equate green CI with production.
6. Actual deployment-impact resolver on integration candidate, using freshly fetched production marker branches: `node scripts/resolve-deployment-impact.mjs --before <main-sha> --functions-before <functions-marker-sha> --hosting-before <hosting-marker-sha> --firestore-rules-before <rules-marker-sha> --firestore-indexes-before <indexes-marker-sha> --sha <candidate-sha>`. Require exact valid ancestor markers; if missing/invalid, stop and investigate rather than allow recovery deploy. Require zero impacted/retired Functions, no full deployment, Hosting false, Rules/Indexes false for docs-only candidate. Existing M3 workflow uses main merge-base for its own non-main impact check, not all production markers; it cannot replace this gate. Never advance marker refs manually. No deployment workflow invocation.

Use `npm run preflight:plan -- --base origin/main` only as a plan, not proof. Local and manual CI remain NOT RUN here. The prior 19/19 independently reproduced static predicates remain source evidence only.

## 4. Acceptance gates (P01.9) and proposed responsible roles

Each role below is a required designation, not a claim of assigned authority. Tiny Steps leadership names owner and independent reviewer privately. No owner approval inferred from resume instruction.

| Gate | Current status | Required evidence | Proposed responsible role |
|---|---|---|---|
| P01.1 source inventory | partial | 198 root ledger, complete significant route/client/native/script/integration coverage; document excluded or unresolved paths | engineering |
| P01.2 infrastructure | HOLD | approved metadata-only packet; exact project/db/region, deployed revision/index/Rules, IAM, backup/PITR metadata; zero docs | security/operator |
| P01.3 record catalogue | partial | current 168-path source inventory + live schema/coverage evidence only under separate bounded approval; sensitivity/type/ownership, unknown dispositions | data/domain owner |
| P01.4 reader/writer closure | partial | significant actual callers, direct SDK/native/script and indirect effects, rule overlaps, external permissions; eight unresolved paths plus known high-risk gaps | engineering/security |
| P01.5 reference/duplicates | prepared, live HOLD | D10 I01–I13 and bounded approved aggregates, coverage and exception dispositions; no repair | data/finance/academic owner |
| P01.6 role policies | source verified, live HOLD | role-specific approved exact positive/negative fixtures; operator sampling separately approved, no M3 bypass | security reviewer |
| P01.7 performance/recovery | pending | comparable read/write/latency/error/freshness/cost metrics, actual marker resolver, backup/PITR and authorized nonproduction restore evidence; owner RPO/RTO/lifecycle proposal | reliability/finance owner |
| P01.8 migration reconciliation | scoped historical ledger verified | current migration scope/drift and ownership gaps; retain all holds; open PR overlap review | engineering/data owner |
| P01.9 acceptance | HOLD | named reviewer signs scope, residual risks and ordered backlog; source/CI/live evidence explicitly distinguished; P02 approval separate | leadership/reviewer |

Proposed next risk-ranked work: (1) approve metadata-only operator scope and obtain actual offline test execution/marker evidence, (2) bound integrity adapter and exact role test design, (3) measure baseline and recovery capability, (4) resolve significant unresolved resource/writer/retention paths with evidence and review, (5) finalize discovery acceptance. Items 1–4 may progress independently where permitted; no broad live data access granted. P09-A remains only after scoped security/data prerequisites and relevant P01/P02 approval, as controlling programme requires.

## 5. Owner handoff — decisions needed now

P01.2: review existing [metadata-only packet](P01_METADATA_ONLY_APPROVAL_PACKET_2026-11-26.md); privately designate operator and reviewer, exact resource/project and allowed surfaces, request window/budget and retention, then approve or decline metadata-only access. No application documents, live roles, provider business records or mutations under this scope. M3 and bounded application reconciliation require separate approval packets and actual access. Do not put credentials, actor identities, private fixtures, resource allowlist with personal identifiers or tokens in chat/repository. 

Offline CI: operator may manually run existing Milestone 3 System Verification workflow against docs branch using GitHub Actions UI; inspect exact head and collect actual run ID/conclusion, no deploy. Full candidate verification and resolver on actual Git history still required. If operator cannot execute, retain HOLD.

Next D12: source-only targeted script/caller classification and bounded reconciliation adapter design/test coverage (no live reads), plus execution/approval evidence if available. Do not keep reopening completed root inventories. P01 remains IN PROGRESS, no P02 implementation until relevant acceptance approvals. No runtime/data changes. Rollback close/revert documentation only.
