# P01.1-D5 — remaining writer reconnaissance and discovery gap register (26 November 2026 IST)

**Status:** Scoped evidence verified; full writer closure NOT complete. Main 701c7ec832dbe9c531964496fa09cd4a4948ddd2, unchanged. Draft #933 stacked on #932. No production access, data changes, Auth changes, script execution, endpoint invocation, runtime/Rules edits or deployment. Independent engineering reviewer/owner approval pending.

## 1. Games and insights: new source evidence

| Source anchor | Reads and authority | Writes / boundaries |
|---|---|---|
| functions/src/games/recordLevelResult.ts:157–332 | authenticated linked child or canonical Admin; required eventId/child/game/progress/level, schemaVersion 1, size limits | create-only kids/{kidId}/gameSessions/{eventId} at 257–303; duplicate event ID returns idempotent result. Event persistence is not rollup completion. |
| src/games/engine/recordLevelResult.ts:45–182 | generates/reuses eventId; callable | eventId cleared on successful callable; preserve retry contract |
| functions/src/triggers/onGameSessionCreate.ts:82–324 | game event, resolved child, config/gamesCatalog, rollupsApplied marker, level completion marker | separate writes to levelCompletions, gameProgress, activity/head, skillTagStats and final rollupsApplied marker; no common transaction observed. Failure handling may log without throwing. |
| functions/src/gameProgressSummary.ts:95–160 | gameProgress event | merges per-game gameSummaries derived record |
| src/pages/KidsPhonicsMission.tsx:397–398,1270–1283 | direct client progress and event callable | setDoc merge gameProgress and separately recordLevelResult; both are legitimate source writers to map |
| src/pages/kids/games/phonics/LetterTracingGame.tsx:1060–1074; LetterTracingWithSounds.tsx:1317–1331 | client game progress | direct setDoc merge gameProgress |
| functions/src/games/ensureGamesCatalogNow.ts:21–64; games/helpers/ensureGamesCatalog.ts:77,675 | legacy users Admin role | catalog patch merge config/gamesCatalog |
| functions/src/games/cleanupGamesCatalogNow.ts:28 onward | legacy Admin role, catalog and normalization | maintenance path invokes patch helper and normalizes catalog; not diagnostic-only |
| functions/src/runInsightsRollupNow.ts:14–27; setInsightsEnabled.ts:30–76 | legacy user role | manual rollup and config/insights writes respectively |
| functions/src/scheduled/batchInsightsRollup.ts:753–1022 | config enabled and catalog; game sessions, kid docs, gameSummaries/progress/activity | batched game summaries and __overview, config freshness update. Three daily schedule roots already classified in B. |
| functions/src/scheduled/globalLearnersRollup.ts:62–78,81–245 | parent users, country resolution | batch country backfill on source parent records before public aggregate Storage object save. NOT a strictly read-only report job. |

Exact Rules: firestore.rules:999–1019 allow scoped gameSessions create with own createdByUid (no update/delete) and scoped gameProgress create/update; 1023–1033 server-maintained summaries/activity; 1042–1045 frozen compatibility summary path. Thus callable authorization alone does not describe every write route. Additional legacy and skill-stat paths require exhaustive mapping. No client policy change approved.

Field seed: gameSessions eventId/gameId/progressDocId/levelId/schemaVersion/createdByUid; gameProgress, levelCompletions, rollupsApplied, skillTagStats, gameSummaries and activity/head are distinct event-derived/progress state; config/gamesCatalog is catalog configuration; config/insights is control/freshness metadata. Preserve direct-progress semantics until authorized replacement. Do not classify user-controlled progress as verified assessment evidence without a separate contract.

D5-R1: event creation has idempotency protection but rollup marker is written after independent updates. Partial failure/retry may leave incomplete or repeated derived increments depending on existing values and recovery; direct progress writers also coexist. Need replay and partial-failure tests, not a claimed live defect.
D5-R2: country backfill and public aggregate generation are distinct effects. Validate allowed user fields and aggregate privacy, source cohort definition, storage publication and rollback before migrating; no live counts collected.

## 2. Public AI knowledge refresh

functions/src/ai/refreshPublicKb.ts:101,195–251,255–350: canonical Admin guard; external public KB JSON fetch; deactivation of active chunks in batches; per selected URL builds new chunks and writes deterministic chunk IDs to public_kb_chunks. Retired paths also deactivated. Deactivation and replacement are separate commits. D5-R3: failed replacement could leave missing active chunks until recovery; investigate generation/activation consistency and rollback before redesign. No invocation or public publication in this session. AI content and school records must remain separate; no learner data may be inferred from the public KB.

## 3. Session request producer follow-up (D2-R1)

firestore.rules:869–871 exact teachers/{teacherId}/sessionRequests/{requestId} rule allows Admin or signed-in matching UID read/create/update/delete; collection-group read Admin at 874–876. This supports possible producer paths even though no current in-repo producer was located by default-branch code search for sessionRequests, sessionRequests addDoc and sessionRequests setDoc (results: Admin StudentList, Rules, indexes, read-audit doc). Search is not exhaustive; native apps, historical clients and indirect helpers may still write. StudentList approval/reject and listener verified D2. Do not remove approval or narrow access until producer inventory, legitimate usage and expected owner scope confirmed. No production request data queried.

## 4. Maintenance and migration script inventory seed

Recursive tree returned 3382 blob entries (3729 paths including directories in earlier baseline), not truncated. 282 executable-source extension files under scripts/ and functions/src/scripts/ (.mjs/.cjs/.js/.ts/.sh/.py; includes tests, libraries and SEO work). Count is path inventory, not executable command count or complete write classification. Selected critical scripts inspected, none executed.

| Source | Source mode and effect | Gate |
|---|---|---|
| scripts/audit-identity-references.mjs:64–71,714,879–934 | project-selected Firebase audit and local JSON report; source labels read-only | bounded private authorization and report retention required before live read |
| scripts/audit-academic-enrollment.mjs:58–64,542,698–746 | Firebase project-selected reference audit and local report | same; historical comments are not new live verification |
| scripts/audit-shared-experience.mjs:393–418 | local report writer; full transitive source input review pending | do not infer live safety from name |
| scripts/wave1-identity-foundation-backfill.mjs:82–112,714–753,886–898,1064–1086 | explicit dry-run/write/reconcile, write requires limit, production-only write branch and batch commits | held migration ledger and separate owner approval; never execute write on this discovery |
| scripts/wave1-auth-access-read-model-backfill.mjs:61–136,391,405–491,620–621 | dry-run/write/reconcile and write limit; read-model write path | not an approved canary or migration |
| scripts/runTeacherStudentSnapshotRepair.mjs:189,278,303,376–384 | REST reads; PATCH apply branch, default dry run | production repair authorization required, preflight and exact affected fixtures |
| scripts/milestone3-system-audit.mjs / milestone3-canary-read-safety-preflight.mjs | B inspected safety entry points | existing M3 packet governs; no runtime execution |
| scripts/resolve-deployment-impact.mjs / deployment/functions-impact-lib.mjs | A/B static classification of docs | actual git graph execution on integration candidate still outstanding |

Remaining executable path classification: create manifest from tree, tag test/library/local-only/deployment/provider/live-read/live-write or unresolved, trace imports and command invocations. Never run script solely to find what it does. D5 completed selected inspection, not all 282 scripts.

## 5. Consolidated evidence-gap matrix

| Programme obligation | Existing evidence | Missing proof / next action | Status |
|---|---|---|---|
| P01.1 source pin and export inventory | A/B/C; 198/198 named export constructors | delta re-pin if main changes | scoped verified |
| P01.1 routes, authorization, automation | A/B; D1–D5 actual selected callers and rules | complete route/service/direct-client/worker/provider and app wiring; full executable manifest | partial |
| P01.1 deployment lineage | A/B marker checks | run real Git-based resolver against candidate and all markers; named independent reviewer | blocked on local Git checkout/approval |
| P01.2 live project/infrastructure | source .firebaserc/firebase.json only | approved read-only metadata for database, region, IAM, indexes, backup/PITR, deployment revision, provider routing | HOLD |
| P01.3 source collection and fields | A literal paths; C and D1–D5 field seeds | consolidated path-keyed catalogue with types, grain, source ownership, sensitivity, optionality and unknowns; no registry ID assignment yet | partial |
| P01.3 live schema/coverage | none newly acquired | approved bounded field presence/type/aggregate checks only, no personal values in evidence | HOLD |
| P01.4 all reader/writer closure | D1–D5 selected roots/helpers | actual per-root resource edges incl indirect helpers, direct SDK/native, script and provider calls | partial |
| P01.5 reference/duplicate reconciliation | historical Wave 0/1 evidence | re-pin audit scripts, approved aggregates and read caps; cross-domain identity/occurrence/finance reference checks | pending / live HOLD |
| P01.6 role/canary policy | B, D1–D4 exact source Rules and guards | effective overlapping Rules, emulator and approved principal fixtures, M3 approval | partial / live HOLD |
| P01.7 performance/cost/recovery | query shapes, source limits only | measured read/write/cost/freshness/errors and verified backup/recovery evidence | pending |
| P01.8 migration reconciliation | earlier ledger and source bridge evidence | current ledger and evidence delta, no M3 mutation authorization | pending / M3 HOLD |
| P01.9 inventory/backlog approval | A–D5 documents | consolidated risk prioritization, ownership and review/acceptance evidence; no phase exit until gates met | pending |

Coverage sanity check: complete export manifest is 198 roots; D1–D4 exact name mention scan returned 65 mentioned, 133 not mentioned. This is a conservative lexical triage only: grouped tables, module names and aliases cause false negatives; mentions are not verified dependency closure. Do not report 65/198 as a completeness metric. Instead assign explicit resource/mutation/auth/transaction/evidence status per root, starting remaining finance/AVS/projection/identity roots. D5 newly inspected games/insights/AI roots must be incorporated without repeating source work.

## 6. Consolidated risk register and priority

| Risk family | Evidence | Priority recommendation (not approved change) |
|---|---|---|
| D2-R1/R2/R3 | session approval non-atomic, historical occurrence identities and partial success | high: data integrity and historical finance; verify actual producers and protected-session/retry test matrix |
| D2-R4 | audit/repair side effects | high: read-only gate safety; classify every command/script before live use |
| D3-R1/R3/R4 | prospect vs learner, Auth/Firestore partial success and legacy authority | high: identity/access/data integrity; preserve M3 hold |
| D3-R2 | multiple returning enquiries and acknowledgement | medium: CRM history and staff task fidelity |
| D4-R1/R3/R4 | school scoping/redaction, async membership, resources and provider authorization | high: access isolation and privacy; test before new domain exposure |
| D4-R2, D5-R1 | auto-ID evidence/messages, downstream game rollup replay | medium/high based on measured data impact; test partial failure |
| D5-R2/R3 | country backfill/public rollup and knowledge replacement | medium: public aggregate/privacy and publication continuity; verify mutation policy and rollback |

No confirmed live incidents. Priority is a proposed source-risk order, not a change to controlling roadmap. Existing pending #929/#928/#924/#925/#927 remain separate; main unchanged, re-pin if merged.

## 7. Next eligible work

D6: create explicit root-level dependency/status ledger keyed by the existing 198 export names (reuse A–D5 anchored rows, no repeat), with remaining finance/attendance-validation/projection and identity operation paths first; map unknowns instead of marking completeness. Build source collection/field catalogue in parallel only where supported. Then remaining script/client/native and effective authorization coverage. Prepare a separately reviewable metadata-only production approval packet (P01.2) with exact resource scope and zero document sampling until authorized. No live access or phase advancement until required approvals. M3 remains held, no changes to migration ledger. No fresh CI or actual deployment-impact resolver. Rollback close/revert documentation only.
