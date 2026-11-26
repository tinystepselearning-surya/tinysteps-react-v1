import test from 'node:test';
import assert from 'node:assert/strict';
import {createSyntheticRequestLane as create} from './identity-transport-request-lane.mjs';
import {FIELD_MASKS} from './identity-verification-safety-core.mjs';
const time={seconds:'1700000000',nanos:123000000};
const cols=['authAccessReadModels','authIdentities','people','roleAssignments','organisationMemberships','users','schoolUsers'];
const actor=i=>({uid:'synthetic-uid-'+i,personId:'synthetic-person-'+i,
  authIdentityId:'auth_'+String(i).padStart(32,'0'),role:'teacher',organisationId:null,legacySchoolId:null});
const plan=(n=1)=>({scope:'synthetic-only',actors:Array.from({length:n},(_,i)=>actor(i)),
  startMs:100,endMs:300100,maxAttempts:n*7,maxSlots:n*107});
const fixture=(p=plan())=>{let now=100;const lane=create(p,()=>now);
  return {lane,clock:n=>{now=n;},step:(i,c,t=time)=>{const k=lane.reserve(i,c);lane.settle(k,'completed',t);return k;}};};
function prefix(f){for(const c of cols.slice(0,3))f.step(0,c);}
const denied=(f,fn,code)=>{assert.throws(fn,/LANE_STOPPED/);assert.equal(f.lane.report().code,code);};
test('lane exact seven descriptors and masks',()=>{
  const f=fixture();
  for(const c of cols){
    const t=f.step(0,c),b=t.request.body;
    assert.equal(t.collection,c);assert.equal(t.timeoutMs,5000);
    if(c==='roleAssignments'||c==='organisationMemberships'){
      assert.equal(t.request.method,'runQuery');assert.equal(t.slots,51);
      assert.deepEqual(b.structuredQuery,{select:{fields:FIELD_MASKS[c].map(fieldPath=>({fieldPath}))},
        from:[{collectionId:c}],where:{fieldFilter:{field:{fieldPath:'personId'},op:'EQUAL',
          value:{stringValue:'synthetic-person-0'}}},limit:{value:51}});
      assert.equal(b.parent,'projects/tsos-synthetic-transport/databases/(default)/documents');
    }else{
      assert.equal(t.request.method,'batchGetDocuments');assert.equal(t.slots,1);
      const id=c==='authIdentities'?actor(0).authIdentityId:c==='people'?actor(0).personId:actor(0).uid;
      assert.deepEqual(b.documents,[b.database+'/documents/'+c+'/'+id]);
      assert.equal(b.database,'projects/tsos-synthetic-transport/databases/(default)');
      assert.deepEqual(b.mask.fieldPaths,FIELD_MASKS[c]);
    }
    if(c==='authAccessReadModels')assert.equal(Object.hasOwn(b,'readTime'),false);
    else assert.deepEqual(b.readTime,time);
    assert.ok(Object.isFrozen(b));
  }
  assert.deepEqual(f.lane.report(),{scope:'synthetic-only',executableReady:false,status:'DESCRIPTORS_COMPLETE',
    code:null,completedActors:1,plannedActors:1,reservedAttempts:7,reservedSlots:107,
    completed:7,failed:0,unknown:0,inFlight:0});
});
test('lane exact 10 actor budget',()=>{const f=fixture(plan(10));
  for(let i=0;i<10;i++)for(const c of cols)f.step(i,c);
  const r=f.lane.report();assert.equal(r.reservedAttempts,70);assert.equal(r.reservedSlots,1070);
  assert.equal(r.completedActors,10);assert.throws(()=>f.lane.reserve(10,cols[0]),/LANE_COMPLETE/);});
test('lane parallel queries then legacy',()=>{const f=fixture();prefix(f);
  const a=f.lane.reserve(0,cols[3]),b=f.lane.reserve(0,cols[4]);
  assert.equal(f.lane.report().inFlight,2);f.lane.settle(b,'completed',time);f.lane.settle(a,'completed',time);
  f.step(0,cols[5]);f.step(0,cols[6]);assert.equal(f.lane.report().status,'DESCRIPTORS_COMPLETE');});
test('lane denies unsupported collection',()=>{const f=fixture();denied(f,()=>f.lane.reserve(0,'private'),'REQUEST_DENIED');assert.equal(f.lane.report().reservedAttempts,0);});
test('lane denies wrong actor',()=>{const f=fixture(plan(2));denied(f,()=>f.lane.reserve(1,cols[0]),'REQUEST_DENIED');});
test('lane denies repeat',()=>{const f=fixture();f.step(0,cols[0]);denied(f,()=>f.lane.reserve(0,cols[0]),'REQUEST_DENIED');});
test('lane denies premature source',()=>{const f=fixture();denied(f,()=>f.lane.reserve(0,cols[1]),'REQUEST_ORDER');});
test('lane denies legacy before query completion',()=>{const f=fixture();prefix(f);f.lane.reserve(0,cols[3]);f.lane.reserve(0,cols[4]);denied(f,()=>f.lane.reserve(0,cols[5]),'REQUEST_ORDER');assert.equal(f.lane.report().inFlight,2);});
test('lane drains both siblings after failure without refund',()=>{const f=fixture();prefix(f);const a=f.lane.reserve(0,cols[3]),b=f.lane.reserve(0,cols[4]);f.lane.settle(a,'failed');assert.equal(f.lane.report().status,'STOP_DRAIN_REQUIRED');assert.throws(()=>f.lane.reserve(0,cols[5]),/LANE_STOPPED/);f.lane.settle(b,'unknown');const r=f.lane.report();assert.equal(r.status,'STOPPED');assert.equal(r.code,'TRANSPORT_FAILURE');assert.equal(r.reservedSlots,105);assert.equal(r.failed,1);assert.equal(r.unknown,1);});
test('lane late completed sibling never advances',()=>{const f=fixture();prefix(f);const a=f.lane.reserve(0,cols[3]),b=f.lane.reserve(0,cols[4]);f.lane.settle(a,'failed');f.lane.settle(b,'completed',time);assert.equal(f.lane.report().completedActors,0);assert.equal(f.lane.report().completed,4);});
test('lane abort sticky and drain',()=>{const f=fixture();const a=f.lane.reserve(0,cols[0]);f.lane.abort();assert.throws(()=>f.lane.reserve(0,cols[1]),/LANE_STOPPED/);f.lane.settle(a,'completed',time);assert.equal(f.lane.report().code,'OPERATOR_ABORT');});
test('lane rejects forged ticket',()=>{const f=fixture();const a=f.lane.reserve(0,cols[0]);denied(f,()=>f.lane.settle({...a},'completed',time),'UNKNOWN_TICKET');f.lane.settle(a,'unknown');assert.equal(f.lane.report().inFlight,0);});
test('lane snapshot required',()=>{const f=fixture();f.step(0,cols[0],null);assert.equal(f.lane.report().code,'SNAPSHOT_INVALID');});
test('lane snapshot mismatch',()=>{const f=fixture();f.step(0,cols[0]);f.step(0,cols[1],{...time,nanos:124000000});assert.equal(f.lane.report().code,'SNAPSHOT_INVALID');});
test('lane invalid snapshot precision',()=>{const f=fixture();f.step(0,cols[0],{...time,nanos:1});assert.equal(f.lane.report().code,'SNAPSHOT_INVALID');});
test('lane expiry before dispatch',()=>{const f=fixture();f.clock(300100);denied(f,()=>f.lane.reserve(0,cols[0]),'WINDOW_CLOSED');});
test('lane RPC deadline rejects completion',()=>{const f=fixture();const a=f.lane.reserve(0,cols[0]);f.clock(5100);f.lane.settle(a,'completed',time);assert.equal(f.lane.report().code,'RPC_DEADLINE');});
test('lane actor deadline bounds later dispatch',()=>{const f=fixture();f.step(0,cols[0]);f.clock(30100);denied(f,()=>f.lane.reserve(0,cols[1]),'WINDOW_CLOSED');});
test('lane clock regression',()=>{const f=fixture();f.step(0,cols[0]);f.clock(99);denied(f,()=>f.lane.reserve(0,cols[1]),'CLOCK_INVALID');});
test('lane window constrains timeout',()=>{const f=fixture({...plan(),endMs:200});assert.equal(f.lane.reserve(0,cols[0]).timeoutMs,100);});
test('lane input and output isolation',()=>{const p=plan();const f=fixture(p);p.actors[0].uid='synthetic-other';const a=f.lane.reserve(0,cols[0]);assert.ok(a.request.body.documents[0].endsWith('/synthetic-uid-0'));assert.throws(()=>a.request.body.mask.fieldPaths.push('extra'));assert.ok(Object.isFrozen(f.lane.report()));});
for(const [name,mutate] of [
  ['production scope',p=>p.scope='production'],['11 actors',p=>Object.assign(p,plan(11))],
  ['attempt budget',p=>p.maxAttempts=8],['slot budget',p=>p.maxSlots=108],
  ['non synthetic uid',p=>p.actors[0].uid='real-user'],['bad auth id',p=>p.actors[0].authIdentityId='wrong'],
  ['extra actor field',p=>p.actors[0].extra=true],['duplicate actors',p=>p.actors[1]={...p.actors[0]}],
  ['wrong role',p=>p.actors[0].role='unknown'],['unexpected organisation',p=>p.actors[0].organisationId='synthetic-org'],
  ['extra plan field',p=>p.extra=true],['window too long',p=>p.endMs=300101],
  ['actor getter',p=>Object.defineProperty(p.actors[0],'uid',{enumerable:true,get(){throw Error('getter invoked');}})]
])test('lane invalid plan: '+name,()=>{const p=plan(2);mutate(p);assert.throws(()=>create(p,()=>100),/^Error: PLAN_INVALID$/);});
