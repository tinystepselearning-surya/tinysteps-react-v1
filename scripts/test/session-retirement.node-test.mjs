import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PROJECT, REGION, REPOSITORY, JOBS, RETIRED_SESSION_FUNCTIONS, validateContext, retirementInventory, retireSessionFunctions } from '../deployment/session-retirement-lib.mjs';
import { resolveFunctionsImpact } from '../deployment/functions-impact-lib.mjs';
const sha = 'a'.repeat(40);
const env = { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/heads/main', GITHUB_REPOSITORY: REPOSITORY, FIREBASE_PROJECT_ID: PROJECT, FUNCTIONS_RETIRED_TARGETS: RETIRED_SESSION_FUNCTIONS.join(','), GITHUB_SHA: sha };
const functions = RETIRED_SESSION_FUNCTIONS.map(id => ({ name: `projects/${PROJECT}/locations/${REGION}/functions/${id}`, environment: 'GEN_2', labels: { 'deployment-scheduled': 'true' } }));
const jobs = JOBS.map(job => ({ name: job.name, httpTarget: { uri: job.urls[0] + '/' } }));
const regions = rows => [{ region: REGION, jobs: rows }, { region: 'us-central1', jobs: [] }];
test('exact CI context, commit and compiled retirement are required', () => {
  validateContext(env, sha, sha, {});
  for (const key of Object.keys(env)) assert.throws(() => validateContext({ ...env, [key]: 'wrong' }, sha, sha, {}));
  assert.throws(() => validateContext(env, sha, 'b'.repeat(40), {}), /stale/);
  assert.throws(() => validateContext(env, sha, sha, { [RETIRED_SESSION_FUNCTIONS[0]]: {} }), /exported/);
});
test('inventory matches exact jobs and ignores unrelated Admin projection', () => {
  const result = retirementInventory(functions, regions([...jobs, {name: `projects/${PROJECT}/locations/${REGION}/jobs/firebase-schedule-refreshSessionsManagementSnapshot4am-${REGION}`} ]));
  assert.equal(result.functions.length, 4);
  assert.equal(result.jobs.length, 3);
});
test('wrong region, generation, target, malformed or incomplete inventories fail closed', () => {
  for (const patch of [{environment:'GEN_1'}, {name:functions[0].name.replace(REGION,'us-central1')}, {labels:{}}]) {
    assert.throws(() => retirementInventory([{...functions[0],...patch}], regions(jobs)));
  }
  assert.throws(() => retirementInventory(functions, []));
  assert.throws(() => retirementInventory(functions, [{region:'us-central1',jobs:[]}]));
  assert.throws(() => retirementInventory(functions, regions([{...jobs[0],httpTarget:{uri:'https://unrelated.example'}}])));
  assert.throws(() => retirementInventory(functions, regions([{name:null}])));
});
test('renamed and cross-region orphan jobs are blocked without deletion', () => {
  const alias = { ...jobs[0], name: `projects/${PROJECT}/locations/us-central1/jobs/legacy-alias` };
  assert.throws(() => retirementInventory([], [...regions([]).slice(0,1), {region:'us-central1',jobs:[alias]}]), /Unallowlisted/);
});
test('Firebase cleanup and partial-deletion retries preserve unrelated jobs', async () => {
  for (const partial of [false,true]) {
    let fs = partial ? [] : [...functions]; let js = [...jobs]; const deleted=[];
    await retireSessionFunctions({
      inventory:async()=>[fs,regions(js)], assertContext:async()=>{}, record:async()=>{},
      deleteFunction:async id=>{deleted.push(id);fs=fs.filter(f=>!f.name.endsWith('/'+id));js=js.filter(j=>j.name!==JOBS.find(x=>x.id===id)?.name);},
      deleteJob:async name=>{deleted.push(name);js=js.filter(j=>j.name!==name);},
    });
    assert.equal(fs.length+js.length,0);
    assert.equal(deleted.length,partial?3:4);
  }
});
test('permissions, stale commit and verification failures cannot report success', async () => {
  for (const failure of ['inventory','context','delete','verification']) {
    const ops=[];
    await assert.rejects(retireSessionFunctions({
      inventory:async()=>{if(failure==='inventory') throw Error('permission');return [functions,regions(jobs)];},
      assertContext:async()=>{if(failure==='context') throw Error('stale');},
      deleteFunction:async()=>{ops.push('delete');if(failure==='delete') throw Error('permission');},
      deleteJob:async()=>{throw Error('should not reach');},record:async phase=>{ops.push(phase);},
    }));
    assert.ok(!ops.includes('after'));
    if (failure==='inventory'||failure==='context') assert.ok(!ops.includes('delete'));
  }
});
function sources(retired=false) {
  return new Map([
    ['functions/src/index.ts', "export {keep} from './keep';\n"+(retired?'':RETIRED_SESSION_FUNCTIONS.map(id=>`export {${id}} from './legacy';`).join('\n'))],
    ['functions/src/keep.ts', 'export const keep = {};'],
    ['functions/src/legacy.ts', RETIRED_SESSION_FUNCTIONS.map(id=>`export const ${id} = {};`).join('\n')],
    ['functions/src/scheduling/legacy14DayCutover.ts', 'export const AUTOMATIC_SESSION_CREATION_RETIRED = true;'],
  ]);
}
test('retirement-only has zero deployment targets and remains required with mixed topology/global impact', () => {
  const beforeSources=sources(),afterSources=sources(true);
  const result=resolveFunctionsImpact({changedFiles:['functions/src/index.ts'],beforeSources,afterSources});
  assert.equal(result.functionsDeploymentRequired,true); assert.equal(result.fullDeployment,false);
  assert.deepEqual(result.impactedFunctions,[]); assert.deepEqual(result.retiredFunctions,RETIRED_SESSION_FUNCTIONS);
  const mixed=resolveFunctionsImpact({changedFiles:['functions/src/index.ts','functions/package.json'],beforeSources,afterSources});
  assert.equal(mixed.fullDeployment,true);assert.deepEqual(mixed.retiredFunctions,RETIRED_SESSION_FUNCTIONS);
});
test('workflow permits full deployment, gates retirement and verifies before marker advancement', () => {
  const w=readFileSync('.github/workflows/deploy.yml','utf8');
  for(const name of ['Plan bounded Cloud Functions deployment','Deploy Cloud Functions in bounded batches']) {
    const step=w.slice(w.indexOf('- name: '+name)).split('\n      - name:')[0];
    assert.match(step,/functions_targets != '' \|\|/);assert.match(step,/functions_full_deployment == 'true'/);
  }
  assert.ok(w.indexOf('Retire obsolete session')<w.indexOf('Advance Functions production baseline'));
  assert.match(readFileSync('scripts/resolve-deployment-impact.mjs','utf8'), /retiredFunctions: functionsResult.retiredFunctions/);
});
test('Firebase grouped-name and codebase collisions cannot broaden deletion', () => {
  assert.throws(() => retirementInventory([...functions,{name:functions[0].name+'-unrelated',environment:'GEN_2'}],regions(jobs)), /Ambiguous/);
  assert.throws(() => retirementInventory([{...functions[0],labels:{'firebase-functions-codebase':'other'}}],regions(jobs)), /codebase/);
});
test('a completed retirement does not make every later hosting commit deploy Functions', () => {
  const result=resolveFunctionsImpact({changedFiles:['src/App.tsx'],beforeSources:sources(true),afterSources:sources(true)});
  assert.equal(result.functionsDeploymentRequired,false);
});

test('compiled retirement preserves live attendance, finance and Admin projection triggers', () => {
  const compiled=createRequire(import.meta.url)('../../functions/lib/index.js');
  for(const id of RETIRED_SESSION_FUNCTIONS) assert.ok(!Object.hasOwn(compiled,id));
  for(const id of ['ensureTeacherCalendarAttendanceSession','createTeacherCalendarAdHocSession',
    'saveTeacherSessionProgress','adminAttendanceCorrection','createAdminManualSession',
    'createAdminHistoricalAttendanceSession','onSessionComplete','onSessionRevenueWrite',
    'onBillingChargeWalletSync','onTeacherEarningsRollupWrite','refreshSessionsManagementSnapshot4am',
    'onSessionsManagementEnrollmentWrite','onSessionsManagementClassSessionWrite']) {
    assert.ok(compiled[id]?.__endpoint, id+' must remain deployed');
  }
});
