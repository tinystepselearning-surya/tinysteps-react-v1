// Owner-local, fixed demo project launcher; never a production operator.
// Retains its own temporary directory/logs for review. No delete RPC or file removal.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createOwnedGroups,waitBounded} from './r5a-owned-process-groups.mjs';
import {createHash} from 'node:crypto';
import {copyFileSync,mkdtempSync,mkdirSync,openSync,closeSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve,delimiter} from 'node:path';
import {fileURLToPath} from 'node:url';
// Independent review and prerequisite R5-C PASS required; do not bypass.
throw Error('R5C_EXECUTION_REVIEW_HOLD');
const root=fileURLToPath(new URL('../../',import.meta.url));
const project='demo-tsos-r5c-transaction',host='127.0.0.1',port='8791';
const pin='9d43599ed6151199e8d604dc87fac51218e49e5f3a48519b1ae560bbe5e3382d';
const path=[dirname(process.execPath),process.env.PATH??'/usr/bin:/bin'].join(delimiter);
const baseEnv={PATH:path,TZ:'UTC'};
assert.ok(process.platform==='darwin'||process.platform==='linux','SUPPORTED_LOCAL_HOST_REQUIRED');
assert.equal(process.version,'v22.22.1');
assert.equal(process.argv.length,3,'Usage: node scripts/verification/run-r5c-transaction-emulator.mjs /absolute/path/to/emulator.jar');
function command(program,args,env=baseEnv){
  const out=spawnSync(program,args,{cwd:root,env,encoding:'utf8',timeout:3000,maxBuffer:65536});
  if(out.error||out.signal||out.status===null)throw Error('LOCAL_PREREQUISITE_FAILED');
  return out;
}
const git=command('git',['status','--porcelain']);
assert.equal(git.status,0);assert.equal(git.stdout.trim(),'','CLEAN_CHECKOUT_REQUIRED');
const head=command('git',['rev-parse','HEAD']);assert.equal(head.status,0);assert.match(head.stdout.trim(),/^[a-f0-9]{40}$/);
const lock=readFileSync(join(root,'functions/package-lock.json'));
assert.equal(createHash('sha1').update('blob '+lock.length+'\0').update(lock).digest('hex'),'9acb6ce6fd6881f3606853ca534939ff79649fe4');
const work=mkdtempSync(join(tmpdir(),'tsos-r5c-local-'));
mkdirSync(join(work,'home'),{mode:0o700});mkdirSync(join(work,'tmp'),{mode:0o700});
const env={...baseEnv,HOME:join(work,'home'),TMPDIR:join(work,'tmp')};
const java=command('java',['-version'],env);
assert.equal(java.status,0);assert.match(java.stderr,/"21(?:\.|")/,'JAVA_21_REQUIRED');
function listeners(pid){
  const out=command('lsof',['-nP',...(pid?['-a','-p',String(pid)]:[]),'-iTCP:'+port,'-sTCP:LISTEN','-Fp'],env);
  assert.ok(out.status===0||out.status===1,'PORT_INSPECTION_FAILED');
  if(out.status===1){assert.equal(out.stdout.trim(),'');return [];}
  const rows=out.stdout.trim().split('\n').filter(s=>s.startsWith('p')).map(s=>Number(s.slice(1)));
  assert.ok(rows.length&&rows.every(n=>Number.isSafeInteger(n)&&n>0),'PORT_INSPECTION_FAILED');
  return rows;
}
assert.deepEqual(listeners(),[],'DEDICATED_PORT_ALREADY_IN_USE');
const jar=join(work,'emulator.jar');
copyFileSync(resolve(process.argv[2]),jar);
assert.equal(createHash('sha256').update(readFileSync(jar)).digest('hex'),pin,'EMULATOR_CHECKSUM_MISMATCH');
console.log('R5-C local-only checkout: '+head.stdout.trim());
console.log('Verified Firestore emulator 1.19.8 checksum; local logs retained in '+work);
const groups=createOwnedGroups();
let interrupted=false;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function start(program,args,childEnv,stdio){
  return groups.start(program,args,{cwd:root,env:childEnv,stdio});
}
function interrupt(){interrupted=true;groups.interrupt();}
process.on('SIGINT',interrupt);process.on('SIGTERM',interrupt);
const log=openSync(join(work,'emulator.log'),'wx',0o600);
try{
  const emulator=start('java',['-Duser.home='+env.HOME,'-Djava.io.tmpdir='+env.TMPDIR,'-jar',jar,
    '--host',host,'--port',port,'--project_id',project,'--single_project_mode','true','--single_project_mode_error','true'],env,['ignore',log,log]);
  const deadline=performance.now()+60000;
  let ready=false;
  while(performance.now()<deadline&&!interrupted&&!emulator.done){
    const pids=listeners();
    if(pids.length){assert.deepEqual([...new Set(pids)],[emulator.child.pid],'WRONG_PORT_OWNER');ready=true;break;}
    await delay(500);
  }
  assert.ok(ready&&!interrupted&&!emulator.done,'LOCAL_EMULATOR_NOT_READY');
  const test=start(process.execPath,['--unhandled-rejections=strict','--test','scripts/verification/r5c-transaction-emulator.node-test.mjs'],
    {...env,TSOS_R5C_EMULATOR_ONLY:'1',FIRESTORE_EMULATOR_HOST:host+':'+port,GCLOUD_PROJECT:project},['ignore','inherit','inherit']);
  const result=await waitBounded(test.completion,180000);
  assert.ok(result&&result.code===0&&!result.signal&&!interrupted&&!emulator.done,'LOCAL_PROBE_FAILED_OR_TIMED_OUT');
  // No PASS until all groups have been checked and the port released.
}finally{
  const failures=[];
  try{await groups.cleanupAll();}catch(err){failures.push(err);}
  try{assert.deepEqual(listeners(),[],'LOCAL_PORT_NOT_RELEASED');}catch(err){failures.push(err);}
  try{closeSync(log);}catch(err){failures.push(err);}
  process.off('SIGINT',interrupt);process.off('SIGTERM',interrupt);
  if(failures.length)throw new AggregateError(failures,'LOCAL_SUPERVISOR_CLEANUP_FAILED');
}
assert.ok(!interrupted,'LOCAL_PROBE_INTERRUPTED');
console.log('=== R5-C LOCAL EMULATOR CHECKS COMPLETED ===');
