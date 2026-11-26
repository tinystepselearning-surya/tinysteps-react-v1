import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {parseTenantMembership as tmb,parseOrganisationMembership as mem,observeMembershipFixture as observe,candidateTenantMembershipKey as tkey,candidateOrganisationMembershipKey as mkey,inspectMembershipSet as inspect,MEMBERSHIP_ROLES,MEMBERSHIP_STATUSES} from './membership-contract-review-prototype.ts';

const t=Object.freeze({tenantMembershipId:'fixture-tmb-a',tenantId:'fixture-tenant-a',personId:'fixture-person-a',status:'active',effectiveStartAt:1000,effectiveEndAt:2000});
const m=Object.freeze({organisationMembershipId:'fixture-mem-a',organisationId:'fixture-org-a',personId:t.personId,role:'teacher',status:'active',isPrimary:false,effectiveStartAt:1000,effectiveEndAt:2000});
const pair=(documentId,record)=>({documentId,record});
const ok=r=>{assert.equal(r.ok,true);return r.value;};
const bad=(r,code)=>assert.deepEqual(r,{ok:false,code});
const obs=(record,at,syntheticOpenEnd=false)=>ok(observe({kind:'tenant',documentId:record.tenantMembershipId,record,at,syntheticOpenEnd}));
const set=(...records)=>inspect({kind:'tenant',rows:records.map(r=>pair(r.tenantMembershipId,r))});
test('exact TMB shape and frozen copy',()=>{const x=ok(tmb(t.tenantMembershipId,t));assert.deepEqual(x,t);assert.notEqual(x,t);assert.ok(Object.isFrozen(x));});
test('exact MEM shape and frozen copy',()=>{const x=ok(mem(m.organisationMembershipId,m));assert.deepEqual(x,m);assert.notEqual(x,m);assert.ok(Object.isFrozen(x));});
test('MEM preserves role and primary without permission',()=>{const x=ok(observe({kind:'organisation',documentId:m.organisationMembershipId,record:{...m,role:'schoolAdmin',isPrimary:true},at:1500,syntheticOpenEnd:false}));assert.equal(x.authorizationEvaluated,false);assert.equal(x.temporal,'current');});
test('key must match exact record ID',()=>{bad(tmb('fixture-other',t),'KEY_MISMATCH');bad(mem('fixture-other',m),'KEY_MISMATCH');});
test('unsafe IDs rejected',()=>{for(const personId of ['', ' a','a\n','a/b','a\u001fb','a'.repeat(129)])bad(tmb(t.tenantMembershipId,{...t,personId}),'ID');});
test('unknown fields rejected, no implicit permission or tenant duplication',()=>{bad(tmb(t.tenantMembershipId,{...t,role:'admin'}),'FIELD');bad(mem(m.organisationMembershipId,{...m,tenantId:t.tenantId}),'FIELD');});
test('missing required fields and invalid enum rejected',()=>{const {personId,...x}=t;bad(tmb(t.tenantMembershipId,x),'FIELD');bad(tmb(t.tenantMembershipId,{...t,status:'closed'}),'ENUM');bad(mem(m.organisationMembershipId,{...m,role:'founder'}),'ENUM');});
test('isPrimary is boolean, not coerced',()=>bad(mem(m.organisationMembershipId,{...m,isPrimary:'false'}),'BOOLEAN'));
test('accessor and inherited fields rejected without invoking getter',()=>{let invoked=false;const x={...t};Object.defineProperty(x,'personId',{enumerable:true,get(){invoked=true;return t.personId;}});bad(tmb(t.tenantMembershipId,x),'SHAPE');assert.equal(invoked,false);bad(tmb(t.tenantMembershipId,Object.assign(Object.create({extra:1}),t)),'SHAPE');});
test('timestamp bounds and exact integer semantics',()=>{for(const v of [NaN,Infinity,1000.5,'1000',new Date(1000),-62135596800001,253402300800000,undefined])bad(tmb(t.tenantMembershipId,{...t,effectiveStartAt:v}),'TIME');});
test('equal and reversed intervals rejected',()=>{for(const effectiveEndAt of [1000,999])bad(tmb(t.tenantMembershipId,{...t,effectiveEndAt}),'INTERVAL');});
test('half-open interval boundaries',()=>{for(const [at,expected] of [[999,'not-current'],[1000,'current'],[1999,'current'],[2000,'not-current']])assert.deepEqual(obs(t,at),{scope:'synthetic-membership-only',authorizationEvaluated:false,temporal:expected});});
test('inactive status cannot be current',()=>assert.equal(obs({...t,status:'inactive'},1500).temporal,'not-current'));
test('absent and explicit null start preserved but unknown',()=>{const {effectiveStartAt,...x}=t;assert.equal(Object.hasOwn(ok(tmb(t.tenantMembershipId,x)),'effectiveStartAt'),false);assert.equal(ok(tmb(t.tenantMembershipId,{...x,effectiveStartAt:null})).effectiveStartAt,null);assert.equal(obs(x,1500).temporal,'unknown');assert.equal(obs({...x,effectiveStartAt:null},1500).temporal,'unknown');});
test('missing end never interpreted as open end',()=>{const {effectiveEndAt,...x}=t;assert.equal(obs(x,1500,true).temporal,'unknown');});
test('explicit null end requires declared fixture interpretation',()=>{const x={...t,effectiveEndAt:null};assert.equal(obs(x,1500).temporal,'unknown');assert.equal(obs(x,1500,true).temporal,'current');assert.equal(obs(x,999,true).temporal,'not-current');});
test('invalid evaluation instant and open-end flag rejected',()=>{const x={kind:'tenant',documentId:t.tenantMembershipId,record:t,at:1500,syntheticOpenEnd:false};bad(observe({...x,at:'1500'}),'TIME');bad(observe({...x,syntheticOpenEnd:'true'}),'BOOLEAN');});
test('candidate keys deterministic and versioned',()=>{const a=ok(tkey('fixture-tenant-a','fixture-person-a'));assert.match(a,/^tmb2_[0-9a-f]{64}$/);assert.equal(a,ok(tkey('fixture-tenant-a','fixture-person-a')));assert.notEqual(a,ok(tkey('fixture-tenant-b','fixture-person-a')));});
test('candidate keys domain and tuple separated',()=>{const a=ok(mkey('fixture-org-a','fixture-person-a','teacher'));assert.match(a,/^mem2_[0-9a-f]{64}$/);assert.notEqual(a,ok(mkey('fixture-org-a','fixture-person-a','member')));assert.notEqual(a,ok(tkey('fixture-org-a','fixture-person-a')));assert.notEqual(ok(tkey('ab','c')),ok(tkey('a','bc')));});
test('same supplied current record ID rejected',()=>bad(set(t,t),'DUPLICATE_ID'));
test('duplicate logical relationship under different ID rejected',()=>bad(set(t,{...t,tenantMembershipId:'fixture-tmb-b'}),'DUPLICATE_RELATIONSHIP'));
test('one person can have distinct tenant relationships',()=>assert.deepEqual(ok(set(t,{...t,tenantMembershipId:'fixture-tmb-b',tenantId:'fixture-tenant-b'})),{count:2,authorizationEvaluated:false}));
test('distinct role classifications in same institution allowed',()=>{const x={...m,organisationMembershipId:'fixture-mem-b',role:'member'};assert.equal(ok(inspect({kind:'organisation',rows:[pair(m.organisationMembershipId,m),pair(x.organisationMembershipId,x)]})).count,2);});
test('bounded set rejects overflow and sparse or accessor entries',()=>{bad(inspect({kind:'tenant',rows:Array(101).fill(null)}),'BOUND');bad(inspect({kind:'tenant',rows:Array(1)}),'SHAPE');let invoked=false;const rows=[null];Object.defineProperty(rows,0,{enumerable:true,get(){invoked=true;return pair(t.tenantMembershipId,t);}});bad(inspect({kind:'tenant',rows}),'SHAPE');assert.equal(invoked,false);});
const read=p=>readFileSync(new URL('../../'+p,import.meta.url));
const sha=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
test('registry fields and enum contract pinned',()=>{
  const shard=read('docs/architecture/registry/domains/identity-institutional.json');assert.equal(sha(shard),'f4f0efc8e54b749148f5b54e1b1d37ee807e5ee1');
  const records=JSON.parse(shard).records;
  for(const [code,record] of [['TMB',t],['MEM',m]]){
    const items=records.find(x=>x.code===code).items;
    assert.deepEqual(items.map(x=>x.semanticName).sort(),Object.keys(record).sort());
    assert.deepEqual(items.filter(x=>x.cardinality==='0..1').map(x=>x.semanticName).sort(),['effectiveEndAt','effectiveStartAt']);
    assert.ok(items.every(x=>x.nullable===(x.semanticName==='effectiveStartAt'||x.semanticName==='effectiveEndAt')));
  }
  const manifest=JSON.parse(read('docs/architecture/registry/TSOS_V2_MASTER_RECORD_ITEM_REGISTRY_DRAFT.json'));
  assert.deepEqual(manifest.valueSets.find(x=>x.id==='membershipRole').codes,[...MEMBERSHIP_ROLES]);
  assert.deepEqual(manifest.valueSets.find(x=>x.id==='activeInactive').codes,[...MEMBERSHIP_STATUSES]);
});
test('legacy contracts and read-model compatibility sources unchanged',()=>{
  for(const [path,pin] of [['functions/src/schoolOS/identity/contracts.ts','be340ac4cb6be06effa1d09e1510a1e75f08c70a'],['functions/src/schoolOS/identity/idStrategy.ts','02037d2dd897cd06f5dc67e32d20b70824ea1527'],['functions/src/schoolOS/identity/authAccessReadModel.ts','461dbab181c6d77b21fc75f5871ce6244dc840ab']])assert.equal(sha(read(path)),pin,path);
});
