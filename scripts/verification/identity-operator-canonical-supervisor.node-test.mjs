import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,realpathSync,rmSync,readdirSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {APPROVAL_DOMAIN,SOURCE_PIN,POLICY_PIN} from './identity-operator-approval.mjs';
import {superviseSyntheticCanonical} from './identity-operator-canonical-supervisor.mjs';

assert.equal(process.version,'v22.22.1');
const owner=generateKeyPairSync('ed25519'),reviewer=generateKeyPairSync('ed25519'),operator='synthetic-operator';
const trust={ownerKey:owner.publicKey,reviewerKey:reviewer.publicKey,operator};
const root=t=>{const d=realpathSync(mkdtempSync(join(tmpdir(),'tsos-synthetic-replay-')));
  t.after(()=>rmSync(d,{recursive:true,force:true}));return d;};
const roles=['admin','founder','teacher','parent','learningPartner','schoolAdmin'];
function actor(role,i){
  const uid='synthetic-uid-'+i,school=role==='schoolAdmin';
  // Fixture golden derivation only; worker verifies with actual compiled builder.
  return {uid,personId:'synthetic-person-'+i,authIdentityId:'auth_'+createHash('sha256')
    .update(['authIdentity','firebase',uid].join('\u001f')).digest('hex').slice(0,32),role,
    organisationId:school?'synthetic-org-'+i:null,legacySchoolId:school?'synthetic-school-'+i:null};
}
function sorted(v){return Array.isArray(v)?v.map(sorted):v!==null&&typeof v==='object'?
  Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])])):v;}
function fixture(actors,overrides={}){
  const now=Date.now(),m={schema:'tsos-r2-synthetic-approval-v1',scope:'synthetic-only',purpose:'canonical-principal-sampler',
    database:'projects/tsos-synthetic-transport/databases/(default)',sourcePin:SOURCE_PIN,policyPin:POLICY_PIN,
    approvalId:'synthetic-canonical-approval',operator,issuedAtMs:now-1000,notBeforeMs:now-500,expiresMs:now+120000,
    maxAgeMs:30000,maxAttempts:actors.length*7,maxSlots:actors.length*107,actors,...overrides};
  const bytes=Buffer.from(JSON.stringify(sorted(m))),message=Buffer.concat([Buffer.from(APPROVAL_DOMAIN),bytes]);
  return {bytes,ownerSignature:sign(null,message,owner.privateKey),reviewerSignature:sign(null,message,reviewer.privateKey)};
}
const run=(directory,args,maxRunMs=30000)=>superviseSyntheticCanonical({directory,...trust,...args,maxRunMs});
const marker=d=>{const names=readdirSync(d);assert.equal(names.length,1);assert.match(names[0],/^[a-f0-9]{64}$/);
  const s=statSync(join(d,names[0]));assert.equal(s.size,0);assert.equal(s.mode&0o777,0o600);};
test('supervised signed six-role cohort exercises compiled canonical sampler and locked SDK; replay refused',{timeout:40000},async t=>{
  const d=root(t),a=fixture(roles.map(actor)),x=await run(d,a);
  assert.deepEqual(x,{scope:'synthetic-only',executableReady:false,status:'CANONICAL_FIXTURE_COMPLETE',code:null,
    started:true,reaped:true,escalated:false,cleanupPending:false,outcome:'fixture-complete',
    result:{scope:'synthetic-only',status:'CANONICAL_FIXTURE_COMPLETE',actors:6,attempts:42,slots:642,returned:32}});
  assert.ok(!JSON.stringify(x).includes('synthetic-uid'));marker(d);
  const y=await run(d,a);assert.equal(y.code,'APPROVAL_REPLAY');assert.equal(y.started,false);assert.equal(y.result,null);
});
test('invalid signature prevents canonical worker dispatch',{timeout:5000},async t=>{
  const d=root(t),a=fixture([actor('parent',1)]);a.ownerSignature.fill(0);
  const x=await run(d,a);assert.equal(x.code,'APPROVAL_INVALID');assert.equal(x.started,false);assert.equal(x.result,null);
  assert.deepEqual(readdirSync(d),[]);
});
test('signed wrong derived ID fails closed; no success and approval not refunded',{timeout:40000},async t=>{
  const d=root(t),bad={...actor('teacher',1),authIdentityId:'auth_'+'f'.repeat(32)},a=fixture([bad]);
  const x=await run(d,a);assert.equal(x.status,'STOPPED');assert.equal(x.code,'SUPERVISOR_WORKLOAD_FAILED');
  assert.equal(x.started,true);assert.equal(x.reaped,true);assert.equal(x.cleanupPending,false);assert.equal(x.result,null);
  marker(d);assert.equal((await run(d,a)).code,'APPROVAL_REPLAY');
});
test('expired approval never starts canonical worker',{timeout:5000},async t=>{
  const d=root(t),x=await run(d,fixture([actor('parent',1)],{issuedAtMs:1,notBeforeMs:2,expiresMs:3}));
  assert.equal(x.code,'APPROVAL_INVALID');assert.equal(x.started,false);assert.equal(x.result,null);
  assert.deepEqual(readdirSync(d),[]);
});
test('one millisecond supervisor budget never accepts canonical workload or refunds approval',{timeout:10000},async t=>{
  const d=root(t),a=fixture([actor('parent',1)]),x=await run(d,a,1);
  assert.equal(x.status,'STOPPED');assert.equal(x.code,'SUPERVISOR_DEADLINE');assert.equal(x.result,null);
  assert.equal(x.cleanupPending,false);marker(d);assert.equal((await run(d,a)).code,'APPROVAL_REPLAY');
});
