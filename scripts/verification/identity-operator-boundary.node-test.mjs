import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,realpathSync,rmSync,readdirSync,statSync,chmodSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {APPROVAL_DOMAIN,SOURCE_PIN,POLICY_PIN} from './identity-operator-approval.mjs';
import {consumeSyntheticApproval} from './identity-operator-replay.mjs';
import {superviseSyntheticFixture} from './identity-operator-supervisor.mjs';

const owner=generateKeyPairSync('ed25519'),reviewer=generateKeyPairSync('ed25519'),operator='synthetic-operator';
const trust={ownerKey:owner.publicKey,reviewerKey:reviewer.publicKey,operator,clock:Date.now};
const root=t=>{const d=realpathSync(mkdtempSync(join(tmpdir(),'tsos-synthetic-replay-')));t.after(()=>rmSync(d,{recursive:true,force:true}));return d;};
function sorted(v){return Array.isArray(v)?v.map(sorted):v!==null&&typeof v==='object'?
  Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])])):v;}
function fixture(overrides={}){
  const now=Date.now();const m={schema:'tsos-r2-synthetic-approval-v1',scope:'synthetic-only',purpose:'canonical-principal-sampler',
    database:'projects/tsos-synthetic-transport/databases/(default)',sourcePin:SOURCE_PIN,policyPin:POLICY_PIN,
    approvalId:'synthetic-boundary',operator,issuedAtMs:now-1000,notBeforeMs:now-500,expiresMs:now+15000,maxAgeMs:1000,
    maxAttempts:7,maxSlots:107,actors:[{uid:'synthetic-uid',personId:'synthetic-person',authIdentityId:'auth_'+'1'.repeat(32),
      role:'teacher',organisationId:null,legacySchoolId:null}],...overrides};
  const bytes=Buffer.from(JSON.stringify(sorted(m))),message=Buffer.concat([Buffer.from(APPROVAL_DOMAIN),bytes]);
  return {bytes,ownerSignature:sign(null,message,owner.privateKey),reviewerSignature:sign(null,message,reviewer.privateKey)};
}
const reserve=(directory,args=fixture(),config=trust)=>consumeSyntheticApproval({directory,trust:config,...args});
const run=(directory,scenario,args=fixture(),maxRunMs=1500)=>superviseSyntheticFixture({directory,...trust,...args,scenario,maxRunMs});
const marker=d=>{const names=readdirSync(d);assert.equal(names.length,1);assert.match(names[0],/^[a-f0-9]{64}$/);
  const s=statSync(join(d,names[0]));assert.equal(s.size,0);assert.equal(s.mode&0o777,0o600);};

test('durable empty reservation survives new verifier; same approval denied',t=>{
  const d=root(t),a=fixture();assert.equal(reserve(d,a).executableReady,false);marker(d);
  assert.throws(()=>reserve(d,a),{message:'APPROVAL_REPLAY'});
});
test('same approval identity cannot be re-signed into a second reservation',t=>{
  const d=root(t);reserve(d);assert.throws(()=>reserve(d,fixture({maxAgeMs:2000})),{message:'APPROVAL_REPLAY'});marker(d);
});
test('distinct synthetic approvals can be reserved in same journal',t=>{
  const d=root(t);reserve(d);reserve(d,fixture({approvalId:'synthetic-other'}));assert.equal(readdirSync(d).length,2);
});
test('invalid signature creates no marker',t=>{
  const d=root(t),a=fixture();a.ownerSignature.fill(0);assert.throws(()=>reserve(d,a),{message:'APPROVAL_INVALID'});assert.deepEqual(readdirSync(d),[]);
});
test('insecure directory permissions block reservation',t=>{
  const d=root(t);chmodSync(d,0o755);assert.throws(()=>reserve(d),{message:'APPROVAL_JOURNAL_BLOCKED'});assert.deepEqual(readdirSync(d),[]);
});
test('symlink alias to journal rejected',t=>{
  const d=root(t),alias=d+'-alias';symlinkSync(d,alias);t.after(()=>rmSync(alias,{force:true}));
  assert.throws(()=>reserve(alias),{message:'APPROVAL_JOURNAL_BLOCKED'});assert.deepEqual(readdirSync(d),[]);
});
test('expiry after durable reservation burns approval, no refund',t=>{
  const d=root(t),n=Date.now(),a=fixture({issuedAtMs:n-1000,notBeforeMs:n-500,expiresMs:n+1000});let calls=0;
  assert.throws(()=>reserve(d,a,{...trust,clock:()=>++calls===1?n:n+1000}),{message:'APPROVAL_JOURNAL_BLOCKED'});marker(d);
  assert.throws(()=>reserve(d,a,{...trust,clock:()=>n}),{message:'APPROVAL_REPLAY'});
});
test('clock regression after reservation burns approval',t=>{
  const d=root(t),n=Date.now();let calls=0;assert.throws(()=>reserve(d,fixture(),{...trust,clock:()=>++calls===1?n:n-1}),{message:'APPROVAL_JOURNAL_BLOCKED'});marker(d);
});
// Fixed test worker receives only disposable signed fixture bytes and public keys.
const WORKER=`import {createPublicKey} from 'node:crypto';
import {consumeSyntheticApproval} from ${JSON.stringify(new URL('./identity-operator-replay.mjs',import.meta.url).href)};
let s='';for await(const chunk of process.stdin)s+=chunk;const x=JSON.parse(s);
try{consumeSyntheticApproval({directory:x.directory,trust:{operator:x.operator,clock:Date.now,ownerKey:createPublicKey(x.ownerKey),reviewerKey:createPublicKey(x.reviewerKey)},bytes:Buffer.from(x.bytes,'base64'),ownerSignature:Buffer.from(x.ownerSignature,'base64'),reviewerSignature:Buffer.from(x.reviewerSignature,'base64')});console.log('RESERVED');}catch(e){console.log(e.message);}`;
function raceWorker(directory,a){return new Promise((resolve,reject)=>{
  const p=spawn(process.execPath,['--input-type=module','-e',WORKER],{env:{TZ:'UTC'},stdio:['pipe','pipe','pipe']});let output='',err='';
  const timer=setTimeout(()=>{p.kill('SIGKILL');reject(Error('worker timeout'));},5000);
  p.stdout.on('data',c=>output+=c);p.stderr.on('data',c=>err+=c);p.on('error',reject);
  p.on('close',code=>{clearTimeout(timer);if(code!==0||err)reject(Error('worker failed'));else resolve(output.trim());});
  p.stdin.end(JSON.stringify({directory,operator,ownerKey:owner.publicKey.export({format:'pem',type:'spki'}),reviewerKey:reviewer.publicKey.export({format:'pem',type:'spki'}),
    bytes:a.bytes.toString('base64'),ownerSignature:a.ownerSignature.toString('base64'),reviewerSignature:a.reviewerSignature.toString('base64')}));
});}
test('two independent processes racing consume exactly once; third restart rejected',async t=>{
  const d=root(t),a=fixture();assert.deepEqual((await Promise.all([raceWorker(d,a),raceWorker(d,a)])).sort(),['APPROVAL_REPLAY','RESERVED']);
  assert.equal(await raceWorker(d,a),'APPROVAL_REPLAY');marker(d);
});
test('supervisor accepts exact fixture result only after durable reservation and child close',async t=>{
  const d=root(t),a=fixture(),x=await run(d,'ok',a);assert.deepEqual(x,{scope:'synthetic-only',executableReady:false,status:'FIXTURE_COMPLETE',code:null,started:true,reaped:true,escalated:false,outcome:'fixture-complete'});marker(d);
  const y=await run(d,'ok',a);assert.equal(y.code,'APPROVAL_REPLAY');assert.equal(y.started,false);
});
test('invalid approval never spawns child',async t=>{
  const d=root(t),a=fixture();a.reviewerSignature.fill(0);const x=await run(d,'ok',a);assert.equal(x.code,'APPROVAL_INVALID');assert.equal(x.started,false);assert.deepEqual(readdirSync(d),[]);
});
test('unsupported command scenario refused before consuming approval',async t=>{
  const d=root(t),x=await run(d,'arbitrary-command');assert.equal(x.code,'SUPERVISOR_CONFIG');assert.equal(x.started,false);assert.deepEqual(readdirSync(d),[]);
});
for(const [scenario,code,deadline] of [
  ['hang','SUPERVISOR_DEADLINE',500],['ignore-term','SUPERVISOR_DEADLINE',500],['overflow','SUPERVISOR_OUTPUT_LIMIT',1500],
  ['stderr','SUPERVISOR_STDERR',1500],['bad-result','SUPERVISOR_RESULT_INVALID',1500],['exit-fail','SUPERVISOR_CHILD_FAILED',1500]
])test('supervisor stops '+scenario+' and retains consumption',async t=>{
  const d=root(t),a=fixture(),x=await run(d,scenario,a,deadline);assert.equal(x.code,code);assert.equal(x.status,'STOPPED');assert.equal(x.started,true);assert.equal(x.reaped,true);assert.equal(x.outcome,'unknown');
  if(scenario==='ignore-term')assert.equal(x.escalated,true);marker(d);assert.equal((await run(d,'ok',a)).code,'APPROVAL_REPLAY');
});
test('approval expiry prevents dispatch',async t=>{
  const d=root(t),x=await run(d,'ok',fixture({issuedAtMs:1,notBeforeMs:2,expiresMs:3}));assert.equal(x.started,false);assert.equal(x.code,'APPROVAL_INVALID');assert.deepEqual(readdirSync(d),[]);
});
