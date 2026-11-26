// Candidate transaction-port tests; not Firestore transaction, auth or Rules proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {buildAuthIdentityId} from '../../../functions/src/schoolOS/identity/idStrategy.ts';
import {ACTION,recordKey,campusIdentity} from './campus-contract-candidate.mjs';
import {createAuthorityTransactionCandidate} from './authority-transaction-candidate.mjs';
const require=createRequire(new URL('../../../functions/package.json',import.meta.url));
const {Timestamp}=require('firebase-admin/firestore');
const START=new Timestamp(0,1),END=new Timestamp(253402300799,0);
const audit={schemaVersion:1,createdAt:START,updatedAt:START,createdBy:'fixtureProvisioner',updatedBy:'fixtureProvisioner'};
const context=Object.freeze({}),operator=Object.freeze({}),other=Object.freeze({});
const req=Object.freeze({tenantId:'tenant-a',organisationId:'org-a',operationId:'operation-1',name:'First Campus',timeZone:'Asia/Kolkata'});
const requestB={...req,tenantId:'tenant-b',organisationId:'org-b'};
const rev={tenantId:'tenant-a',organisationId:'org-a',personId:'person-a',expectedGrantRevision:7,expectedGeneration:21};
const names={TEN:'tsosV2Tenants',OTB:'tsosV2OrganisationTenantBindings',TMB:'tsosV2TenantMemberships',MEM:'tsosV2OrganisationMemberships',VGR:'tsosV2AuthorityGrants',AFN:'tsosV2AuthorityFences',AOR:'tsosV2ActionRoutes',CAM:'tsosV2Campuses',OCR:'tsosV2OperationReceipts'};
const path=(code,...parts)=>names[code]+'/'+recordKey(code,parts);
function seed(db,t,o,uid,p){
 const set=(code,parts,data)=>db.set(path(code,...parts),{...audit,...data});
 const auth=buildAuthIdentityId('firebase',uid);
 db.set('authIdentities/'+auth,{...audit,authIdentityId:auth,personId:p,provider:'firebase',providerSubject:uid,status:'active'});
 db.set('people/'+p,{...audit,personId:p,status:'active'});
 db.set('organisations/'+o,{...audit,organisationId:o,type:'school',status:'active'});
 set('TEN',[t],{tenantId:t,name:'Tenant',status:'active'});
 set('OTB',[o],{tenantId:t,organisationId:o,status:'active',revision:1});
 const interval={effectiveStartAt:START,effectiveEndAt:END};
 set('TMB',[t,p],{tenantMembershipId:recordKey('TMB',[t,p]),tenantId:t,personId:p,status:'active',...interval});
 set('MEM',[t,o,p,'member'],{organisationMembershipId:recordKey('MEM',[t,o,p,'member']),tenantId:t,organisationId:o,personId:p,role:'member',status:'active',isPrimary:false,...interval});
 set('VGR',[t,o,p,ACTION],{grantId:recordKey('VGR',[t,o,p,ACTION]),tenantId:t,organisationId:o,personId:p,roleKey:'campusCreator',action:ACTION,status:'active',revision:7,...interval});
 set('AFN',[t],{tenantId:t,generation:21});
 set('AOR',[t,ACTION],{tenantId:t,action:ACTION,lane:'successor',epoch:1});
}
function harness(){
 const db=new Map();seed(db,'tenant-a','org-a','uid-a','person-a');seed(db,'tenant-b','org-b','uid-b','person-b');
 const h={db,reads:[],writes:[],calls:0,failCommit:false,loseAck:false,auth:{uid:'uid-a',expectedGeneration:null,expectedEpoch:null}};
 const runOnce=async fn=>{
  h.calls++;const pending=[];
  const result=await fn({get:async key=>{h.reads.push(key);return db.get(key)??null},create:(key,data)=>pending.push({kind:'create',key,data}),update:(key,data)=>pending.push({kind:'update',key,data})});
  if(h.failCommit)throw Error('fixture commit rejected');
  for(const x of pending)assert.equal(db.has(x.key),x.kind==='update');
  for(const x of pending){
   const v={...(db.get(x.key)??{}),...x.data};
   // Model server-time sentinel materialization only. No actual SDK transaction.
   if(x.kind==='create')v.createdAt=Timestamp.now();
   v.updatedAt=Timestamp.now();db.set(x.key,v);h.writes.push(x);
  }
  if(h.loseAck)throw Error('fixture acknowledgment lost');return result;
 };
 h.service=createAuthorityTransactionCandidate({runOnce,resolveVerifiedAuth:async c=>c===context?h.auth:c===other?{uid:'uid-b',expectedGeneration:null,expectedEpoch:null}:null,resolveProvisioner:async c=>c===operator?{actorId:'fixtureProvisioner',tenantId:'tenant-a',organisationId:'org-a',personId:'person-a'}:null});
 return h;
}
const grantPath=path('VGR','tenant-a','org-a','person-a',ACTION);
const fencePath=path('AFN','tenant-a');
const routePath=path('AOR','tenant-a',ACTION);
const campusPath=path('CAM','tenant-a','org-a','person-a',ACTION,req.operationId);
const receiptPath=path('OCR','tenant-a','person-a',ACTION,req.operationId);
const patch=(h,k,data)=>h.db.set(k,{...h.db.get(k),...data});
test('authorized command stages exactly two creates and twelve point reads',async()=>{const h=harness();assert.deepEqual(await h.service.execute(context,req),{status:'committed',campusId:campusIdentity(req,'person-a').campusId,revision:1});assert.equal(h.reads.length,12);assert.deepEqual(h.writes.map(x=>[x.kind,x.key]),[['create',campusPath],['create',receiptPath]]);assert.equal(h.db.get(receiptPath).semanticHash,campusIdentity(req,'person-a').semanticHash);assert.equal(h.db.get(receiptPath).name,undefined)});
test('second tenant positive and first tenant cross-scope denial',async()=>{const h=harness();assert.equal((await h.service.execute(other,requestB)).status,'committed');assert.equal((await h.service.execute(context,requestB)).status,'denied');assert.equal(h.writes.length,2)});
test('caller cannot supply actor or authority generation',async()=>{const h=harness();for(const r of [{...req,actorPersonId:'person-a'},{...req,generation:21}])assert.equal((await h.service.execute(context,r)).status,'denied');assert.equal(h.calls,0)});
test('unverified context denied before datastore',async()=>{const h=harness();assert.equal((await h.service.execute({uid:'uid-a'},req)).status,'denied');assert.equal(h.calls,0)});
test('replay and recovery both return minimal result without writes',async()=>{const h=harness();const a=await h.service.execute(context,req);assert.deepEqual(await h.service.execute(context,req),a);assert.deepEqual(await h.service.recover(context,req),a);assert.equal(h.writes.length,2)});
test('absent receipt recovery is indeterminate without create',async()=>{const h=harness();assert.equal((await h.service.recover(context,req)).status,'indeterminate');assert.equal(h.reads.length,12);assert.equal(h.writes.length,0)});
test('same operation changed payload conflicts without target read',async()=>{const h=harness();await h.service.execute(context,req);h.reads.length=0;assert.equal((await h.service.execute(context,{...req,name:'Changed'})).status,'conflict');assert.equal(h.reads.length,11);assert.equal(h.writes.length,2)});
test('receipt with missing target denies integrity',async()=>{const h=harness();await h.service.execute(context,req);h.db.delete(campusPath);assert.equal((await h.service.recover(context,req)).status,'integrity-denied');assert.equal(h.writes.length,2)});
test('orphan target denies integrity even during recovery',async()=>{const h=harness();await h.service.execute(context,req);h.db.delete(receiptPath);assert.equal((await h.service.recover(context,req)).status,'integrity-denied');assert.equal(h.writes.length,2)});
for(const [name,key,delta] of [
 ['inactive person','people/person-a',{status:'suspended'}],
 ['wrong tenant owner',path('OTB','org-a'),{tenantId:'tenant-b'}],
 ['expired membership',path('TMB','tenant-a','person-a'),{effectiveEndAt:new Timestamp(1,0)}],
 ['revoked grant',grantPath,{status:'revoked'}],
 ['wrong grant role',grantPath,{roleKey:'schoolAdmin'}],
 ['disabled route',routePath,{lane:'disabled'}],
 ['lookalike timestamp',grantPath,{effectiveStartAt:{seconds:0,nanoseconds:1}}],
 ['unknown field',fencePath,{surprise:true}]
])test(name+' denies before protected reads',async()=>{const h=harness();patch(h,key,delta);assert.equal((await h.service.execute(context,req)).status,'denied');assert.ok(!h.reads.includes(campusPath)&&!h.reads.includes(receiptPath));assert.equal(h.writes.length,0)});
test('trusted stale generation or route epoch denies',async()=>{for(const a of [{expectedGeneration:20},{expectedEpoch:2}]){const h=harness();Object.assign(h.auth,a);assert.equal((await h.service.execute(context,req)).status,'denied');assert.equal(h.reads.length,10);assert.equal(h.writes.length,0)}});
test('checked revocation increments grant and fence atomically in port',async()=>{const h=harness();await h.service.execute(context,req);h.reads.length=0;assert.equal((await h.service.revoke(operator,rev)).status,'revoked');assert.deepEqual(h.reads,[grantPath,fencePath]);assert.equal(h.db.get(grantPath).revision,8);assert.equal(h.db.get(grantPath).status,'revoked');assert.equal(h.db.get(fencePath).generation,22);assert.equal(h.db.get(grantPath).createdAt,START);assert.equal((await h.service.recover(context,req)).status,'denied');assert.equal(h.writes.length,4)});
test('revocation rejects spoofed operator, stale generation, wrong scope, overflow and repeated revocation',async()=>{const h=harness();for(const [c,r] of [[context,rev],[operator,{...rev,expectedGeneration:20}],[operator,{...rev,personId:'person-b'}],[operator,{...rev,expectedGrantRevision:Number.MAX_SAFE_INTEGER}]])assert.equal((await h.service.revoke(c,r)).status,'denied');assert.equal(h.writes.length,0);assert.equal((await h.service.revoke(operator,rev)).status,'revoked');assert.equal((await h.service.revoke(operator,{...rev,expectedGrantRevision:8,expectedGeneration:22})).status,'denied');assert.equal(h.writes.length,2)});
test('rejected commit stays indeterminate with no retry or mutation',async()=>{const h=harness();h.failCommit=true;assert.equal((await h.service.execute(context,req)).status,'indeterminate');assert.equal(h.calls,1);assert.equal(h.writes.length,0);h.failCommit=false;assert.equal((await h.service.recover(context,req)).status,'indeterminate');assert.equal(h.writes.length,0)});
test('lost acknowledgement recovered by separate read-only entry',async()=>{const h=harness();h.loseAck=true;assert.equal((await h.service.execute(context,req)).status,'indeterminate');assert.equal(h.calls,1);h.loseAck=false;assert.equal((await h.service.recover(context,req)).status,'committed');assert.equal(h.writes.length,2)});
