# P01.1-D12 — bounded reconciliation design and offline accounting prototype

**Status: source design and synthetic prototype verified; NOT production adapter or live approval.** 26 November 2026 IST. Main 701c7ec832dbe9c531964496fa09cd4a4948ddd2; draft #933 stacked on #932. No runtime code, credentials, database requests, provider calls, mutations, deploy or migration. No fresh full CI. Keep P01.2/P01.3 live and M3 held.

## 1. Source inspection — existing audit limits and destructive tools

| Source | Actual source behaviour | Disposition |
|---|---|---|
| scripts/audit-identity-references.mjs:784–854 | 12 root collection reads plus nested students collectionGroup/fallback parent enumeration; field-select but no global query/read limits; fallback concurrency 10 | exclude live execution; require bounded scope and completeness |
| scripts/audit-academic-enrollment.mjs:599–674 | 13 root collection reads plus school traversal; years/teachers and four subcollections per year, uncapped | exclude live execution; scope nested traversal, no silent truncation |
| scripts/audit-global-progress-enrollment.mjs:13–24,81–91,325–327 | requires project env and initializes ADC at module top level; 20,001 enrollment and 50,001 progress query sentinels, curriculum point read; additional getAll for two root refs per exception child | not import-safe as library, large caps and extra fan-out; no live invocation |
| scripts/avs-production-soak-audit.mjs:50–95,129–198 | exact project gate, historical IST date range, per-query cap+1 and checkpoint remaining cap; parallel case/dirty/run reads then nested checkpoint gets | bounded per workset, not approval or global billed-read guarantee; no provider calls requested |
| functions/src/scripts/auditParentClassAttendanceV4.ts:5,73–83,137–162 | initializes Admin; reads full adminStats day subcollection before lookback/report; local report | no live execution; lookback is not query cap |
| functions/src/scripts/wipeKidGameData.ts:68–95,127–196,271 | environment-selected Admin SDK; full child enumeration, subcollection gets, bulk deletion and field deletion, confirmation/limit flags | destructive HOLD; no execution or import |
| functions/src/scripts/wipeSingleKidGameplayData.ts:43–70,88–120,142–178 | Admin initialization, single child read and subcollection scans; dry-run flag, explicit confirmation, delete fields/docs on apply | destructive HOLD even dry-run may read private data |
| scripts/milestone3-bounded-principal-audit.mjs:21–61,66–124 | preexisting injected facade, 7 SDK attempts/actor, max 12 actors, person-scoped queries limit <=51 | separate M3 operator gate; do not replace with this prototype |

Tree path inventory at same pin: 282 script-source files, 73 match test naming/path heuristic, 209 other paths; heuristic is not safety classification. Seven selected scripts above have specific source evidence in addition to prior D5/D10 work. Remaining imports/provider/live effects require targeted review before any execution. Current source catalogue delta separately records seven academic schemaVersion-probe paths in audit collector; their existence and authority are unknown.

## 2. Proposed actual adapter contract — NOT implemented or approved

Start with existing pure audit reducers (auditIdentitySnapshot, auditAcademicEnrollmentSnapshot) only after isolating entrypoint imports and replacing the collector; don't rewrite their domain logic without regression parity. Restrict a future live adapter to exact private manifest, independent reviewer and least-privilege operator; metadata-only packet does not grant document access.

- Manifest contains exact approved environment, main SHA, resource path/field allowlist, query predicates, deterministic ordering, cap per workset, total request/returned-document budgets including sentinel, time window, retention and approved purpose. Validate before any request. Resolve resource aliases against approved scope only; no caller-built dynamic collection path, fallback, unbounded get, arbitrary getAll, listener, retries or write method. No raw manifest/identifiers in repository.
- Plan fixed and dependent query fan-out separately; reserve cap+1 for bounded sets and one slot per point read before dispatch; do not dispatch if global reserve fails. Nested discovery must stop at approved parent/child budgets; no implicit recursive traversal. Use field projection, not an unrestricted row read.
- A cap+1 sentinel means overflow/incomplete, not a successful sample. Do not truncate and pass. Missing, denied, error, stale/drift, inconsistent snapshots and unexamined cohort are separate dispositions. An SDK request/returned-document budget is not billed reads (index entries, Rules, retry and minimum charges differ). Measure cost separately.
- Return only aggregate counts, denominator and exact verified scope, explicit unverified cohorts, no raw document contents or individual identifiers. A successful bounded sample never implies population completeness. Cross-read changes require source watermark/cohort consistency or inconclusive result; this prototype does not implement snapshot consistency or business reducers.
- Before live activation: separately reviewed executable adapter with real query builder enforcement, timeout/cancellation, budget reservation for dependent reads, field masks, project validation, privacy output and independent negative tests; approved cap/time/fixtures; no production repair or writes. No new deployment required for offline evidence.

## 3. Executable count-only reference prototype (documentation scope)

This pure function validates a fixed **synthetic** operation list and simulated response counts. It cannot access Firebase, call a connector, accept actual paths or return private data. The limits 40 simulated attempts, 1000 reserved returned slots and 100 per set are intentionally conservative prototype ceilings, not proposed authorization or measured production budgets. A future real adapter must enforce bounds before each SDK dispatch and cannot rely on this after-the-fact model. No production mode, retries or automatic continuation.

```js
function checkSyntheticBudget(plan, observations) {
  // Offline count-only model; no adapter, database, environment or I/O.
  const invalid = () => ({status:"REJECTED",attempts:0,reserved:0,returned:0,complete:false});
  const isInt = (v,min,max) => Number.isSafeInteger(v)&&v>=min&&v<=max;
  const exact = (v,keys) => v!==null&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.prototype.hasOwnProperty.call(v,k));
  if(!exact(plan,["mode","maxAttempts","maxReturned","operations"])||plan.mode!=="synthetic"||!isInt(plan.maxAttempts,1,40)||!isInt(plan.maxReturned,1,1000)||!Array.isArray(plan.operations)||plan.operations.length<1||plan.operations.length>plan.maxAttempts||!Array.isArray(observations))return invalid();
  const allowed=["identity_fixture","guardian_fixture","enrollment_fixture","occurrence_fixture","charge_fixture","earning_fixture","wallet_fixture","school_fixture"];
  const seen=new Set();
  let reserved=0;
  for(const op of plan.operations){
    if(!exact(op,["id","kind","cap"])||!allowed.includes(op.id)||seen.has(op.id)||!["point","boundedSet"].includes(op.kind)||!isInt(op.cap,1,100)||op.kind==="point"&&op.cap!==1)return invalid();
    seen.add(op.id);
    reserved+=op.cap+(op.kind==="boundedSet"?1:0);
  }
  if(reserved>plan.maxReturned||observations.length>plan.operations.length)return invalid();
  let attempts=0,returned=0;
  const result=(status,complete=false)=>({status,attempts,reserved,returned,complete});
  for(let i=0;i<plan.operations.length;i++){
    if(i>=observations.length)return result("INCOMPLETE");
    const op=plan.operations[i],obs=observations[i];
    if(!exact(obs,["id","status","count"])||obs.id!==op.id||!["ok","missing","denied","error","drift"].includes(obs.status)||!isInt(obs.count,0,op.cap+(op.kind==="boundedSet"?1:0)))return result("INVALID_OBSERVATION");
    attempts++;returned+=obs.count;
    if(obs.status!=="ok")return result(obs.status==="missing"?"MISSING_REFERENCE":"INCONCLUSIVE");
    if(op.kind==="point"&&obs.count!==1)return result("MISSING_REFERENCE");
    if(op.kind==="boundedSet"&&obs.count>op.cap)return result("OVERFLOW");
  }
  return result("SYNTHETIC_SCOPE_COMPLETE",true);
}
```

## 4. Executed synthetic cases

Executed the exact function above in an isolated JavaScript evaluator against 20 synthetic inputs. Assertions: expected status, completeness flag, and overflow stop count. This is newly executed **prototype-only** evidence, not the Node repository test suite, not CI, not Firebase emulator or production validation.

| Case | Expected | Observed |
|---|---|---|
| exact reserved budget | SYNTHETIC_SCOPE_COMPLETE | SYNTHETIC_SCOPE_COMPLETE |
| empty set permitted | SYNTHETIC_SCOPE_COMPLETE | SYNTHETIC_SCOPE_COMPLETE |
| sentinel overflow stops | OVERFLOW | OVERFLOW |
| missing point | MISSING_REFERENCE | MISSING_REFERENCE |
| explicit missing | MISSING_REFERENCE | MISSING_REFERENCE |
| denied | INCONCLUSIVE | INCONCLUSIVE |
| network error | INCONCLUSIVE | INCONCLUSIVE |
| source drift | INCONCLUSIVE | INCONCLUSIVE |
| partial input | INCOMPLETE | INCOMPLETE |
| out of order | INVALID_OBSERVATION | INVALID_OBSERVATION |
| count above sentinel | INVALID_OBSERVATION | INVALID_OBSERVATION |
| budget insufficient | REJECTED | REJECTED |
| attempt budget insufficient | REJECTED | REJECTED |
| duplicate scope | REJECTED | REJECTED |
| unknown scope | REJECTED | REJECTED |
| production mode | REJECTED | REJECTED |
| unexpected manifest field | REJECTED | REJECTED |
| unexpected observation payload | INVALID_OBSERVATION | INVALID_OBSERVATION |
| extra retry | REJECTED | REJECTED |
| noninteger cap | REJECTED | REJECTED |

Result: **20/20 passed.** Example valid plan: point cap 1, bounded-set caps 5 and 4; reserve 1+6+5=12 slots, max 3 attempts; observations 1,5,4 complete only synthetic scope, 6 rows in first set stops after attempt 2. Invalid plan yields zero attempts. All simulated observations are counts, not documents.

Remaining: use offline fixture tests from repository after isolated checkout; implement actual adapter in separate reviewable code scope only if controlling programme/owner authorizes it; no modification to production audit scripts or deployment workflow. P01 remains partial. Next D13: complete remaining critical execution evidence (offline CI/actual marker resolver) and private metadata approval handoff; targeted dynamic path/producer closure only as required. No P02 advancement before acceptance.
