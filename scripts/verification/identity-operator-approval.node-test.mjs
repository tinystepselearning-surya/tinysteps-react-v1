import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {APPROVAL_DOMAIN,SOURCE_PIN,POLICY_PIN,createSyntheticApprovalVerifier} from './identity-operator-approval.mjs';

const owner=generateKeyPairSync('ed25519'),reviewer=generateKeyPairSync('ed25519'),other=generateKeyPairSync('ed25519');
const now=1700000000000,operator='synthetic-operator';
const actor=i=>({uid:'synthetic-uid-'+i,personId:'synthetic-person-'+i,
  authIdentityId:'auth_'+i.toString(16).padStart(32,'0'),role:'teacher',organisationId:null,legacySchoolId:null});
const manifest=()=>({schema:'tsos-r2-synthetic-approval-v1',scope:'synthetic-only',
  purpose:'canonical-principal-sampler',database:'projects/tsos-synthetic-transport/databases/(default)',
  sourcePin:SOURCE_PIN,policyPin:POLICY_PIN,approvalId:'synthetic-approval',operator,
  issuedAtMs:now-1000,notBeforeMs:now-500,expiresMs:now+10000,maxAgeMs:1000,
  maxAttempts:7,maxSlots:107,actors:[actor(1)]});
function sorted(v){
  if(Array.isArray(v))return v.map(sorted);
  if(v!==null&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])]));
  return v;
}
const encode=m=>Buffer.from(JSON.stringify(sorted(m)));
function signed(bytes,o=owner.privateKey,r=reviewer.privateKey,domain=APPROVAL_DOMAIN){
  const message=Buffer.concat([Buffer.from(domain),bytes]);
  return [bytes,sign(null,message,o),sign(null,message,r)];
}
const guard=(overrides={})=>createSyntheticApprovalVerifier({ownerKey:owner.publicKey,reviewerKey:reviewer.publicKey,
  operator,clock:()=>now,...overrides});
const invalid=(m,overrides={})=>assert.throws(()=>guard(overrides).consume(...signed(encode(m))),{message:'APPROVAL_INVALID'});

test('two distinct signers bind exact synthetic plan; result immutable and non-executable',()=>{
  const m=manifest(),args=signed(encode(m)),result=guard().consume(...args);
  assert.deepEqual(result,{scope:'synthetic-only',executableReady:false,
    plan:{scope:'synthetic-only',actors:m.actors,startMs:m.notBeforeMs,endMs:m.expiresMs,maxAttempts:7,maxSlots:107},maxAgeMs:1000});
  assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.plan)&&Object.isFrozen(result.plan.actors)&&Object.isFrozen(result.plan.actors[0]));
  args[0].fill(0);m.actors[0].role='admin';assert.equal(result.plan.actors[0].role,'teacher');
});
test('ten actor exact bounds accepted without dispatch',()=>{
  const m=manifest();m.actors=Array.from({length:10},(_,i)=>actor(i+1));m.maxAttempts=70;m.maxSlots=1070;
  assert.equal(guard().consume(...signed(encode(m))).plan.actors.length,10);
});
test('school context schema accepted without implying school permission',()=>{
  const m=manifest();Object.assign(m.actors[0],{role:'schoolAdmin',organisationId:'synthetic-org',legacySchoolId:'synthetic-school'});
  assert.equal(guard().consume(...signed(encode(m))).executableReady,false);
});
test('same signer cannot serve both trust roles',()=>{
  assert.throws(()=>guard({reviewerKey:owner.publicKey}),{message:'APPROVAL_TRUST_CONFIG'});
});
test('private key rejected in trust configuration',()=>{
  assert.throws(()=>guard({ownerKey:owner.privateKey}),{message:'APPROVAL_TRUST_CONFIG'});
});
test('invalid operator trust config rejected',()=>{
  assert.throws(()=>guard({operator:'real-operator'}),{message:'APPROVAL_TRUST_CONFIG'});
});
test('tampered bytes rejected',()=>{
  const args=signed(encode(manifest()));args[0]=encode({...manifest(),maxAgeMs:2000});
  assert.throws(()=>guard().consume(...args),{message:'APPROVAL_INVALID'});
});
test('wrong signer rejected',()=>{
  assert.throws(()=>guard().consume(...signed(encode(manifest()),owner.privateKey,other.privateKey)),{message:'APPROVAL_INVALID'});
});
test('swapped signatures rejected',()=>{
  const [b,o,r]=signed(encode(manifest()));assert.throws(()=>guard().consume(b,r,o),{message:'APPROVAL_INVALID'});
});
test('cross-purpose signature rejected',()=>{
  assert.throws(()=>guard().consume(...signed(encode(manifest()),owner.privateKey,reviewer.privateKey,'TSOS:BROWSER\0')),{message:'APPROVAL_INVALID'});
});
test('one signature missing rejected',()=>{
  const [b,o]=signed(encode(manifest()));assert.throws(()=>guard().consume(b,o),{message:'APPROVAL_INVALID'});
});
test('valid approval cannot be consumed twice in same verifier',()=>{
  const g=guard(),args=signed(encode(manifest()));g.consume(...args);
  assert.throws(()=>g.consume(...args),{message:'APPROVAL_ALREADY_ATTEMPTED'});
});
test('failed attempt cannot be retried in same verifier',()=>{
  const g=guard();assert.throws(()=>g.consume(Buffer.alloc(0)),{message:'APPROVAL_INVALID'});
  assert.throws(()=>g.consume(...signed(encode(manifest()))),{message:'APPROVAL_ALREADY_ATTEMPTED'});
});
test('noncanonical signed bytes rejected',()=>{
  const b=Buffer.from(JSON.stringify(sorted(manifest()),null,2));
  assert.throws(()=>guard().consume(...signed(b)),{message:'APPROVAL_INVALID'});
});
test('duplicate signed JSON key rejected',()=>{
  const b=Buffer.from(encode(manifest()).toString().replace(/^\{/,'{"scope":"synthetic-only",'));
  assert.throws(()=>guard().consume(...signed(b)),{message:'APPROVAL_INVALID'});
});
test('oversized bytes rejected',()=>{
  assert.throws(()=>guard().consume(...signed(Buffer.alloc(32769,32))),{message:'APPROVAL_INVALID'});
});
test('clock exception redacted',()=>invalid(manifest(),{clock:()=>{throw Error('private-fixture');}}));
test('expired at exact boundary',()=>invalid(manifest(),{clock:()=>now+10000}));
test('before approved window rejected',()=>invalid(manifest(),{clock:()=>now-501}));
test('invalid clock rejected',()=>invalid(manifest(),{clock:()=>NaN}));
for(const [name,change] of [
  ['production scope',m=>m.scope='production'],
  ['browser purpose',m=>m.purpose='browser-canary'],
  ['other endpoint',m=>m.database='projects/other/databases/(default)'],
  ['source drift',m=>m.sourcePin='0'.repeat(40)],
  ['policy drift',m=>m.policyPin='0'.repeat(40)],
  ['wrong operator',m=>m.operator='synthetic-other'],
  ['non synthetic approval id',m=>m.approvalId='not-synthetic'],
  ['issue after start',m=>m.issuedAtMs=now],
  ['issue too early',m=>m.issuedAtMs=now-400000],
  ['window too long',m=>m.expiresMs=now+300000],
  ['zero freshness',m=>m.maxAgeMs=0],
  ['excess freshness',m=>m.maxAgeMs=300001],
  ['extra field',m=>m.extra='not-allowed'],
  ['wrong attempt budget',m=>m.maxAttempts=8],
  ['wrong slot budget',m=>m.maxSlots=108],
  ['non synthetic actor',m=>m.actors[0].uid='not-synthetic'],
  ['duplicate actor',m=>{m.actors.push(actor(1));m.maxAttempts=14;m.maxSlots=214;}],
  ['eleven actors',m=>{m.actors=Array.from({length:11},(_,i)=>actor(i+1));m.maxAttempts=77;m.maxSlots=1177;}],
  ['wrong context',m=>m.actors[0].organisationId='synthetic-org'],
  ['extra actor field',m=>m.actors[0].secret='fixture']
])test('signed but unauthorized: '+name,()=>{const m=manifest();change(m);invalid(m);});
