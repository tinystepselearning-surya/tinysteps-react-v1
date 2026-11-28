// Fixed local-only actual adapter verification. No live Auth, production access or schema adoption.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const project='demo-tsos-gate-b-authority',host='127.0.0.1',port=8793;
const database='projects/'+project+'/databases/(default)',parent=database+'/documents/';
assert.equal(process.env.TSOS_GATE_B_EMULATOR_ONLY,'1');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,host+':'+port);
assert.equal(process.env.GCLOUD_PROJECT,project);
assert.equal(process.version,'v22.22.1');
const allowed=new Set(['PATH','HOME','TMPDIR','TZ','TSOS_GATE_B_EMULATOR_ONLY','FIRESTORE_EMULATOR_HOST','GCLOUD_PROJECT']);
for(const key of Object.keys(process.env)){
  if(allowed.has(key)||key==='NODE_TEST_CONTEXT'&&process.env[key]==='child-v8')continue;
  if(key==='__CF_USER_TEXT_ENCODING'&&process.platform==='darwin'){delete process.env[key];continue;}
  throw Error('UNEXPECTED_ENVIRONMENT');
}
const functionsDir=fileURLToPath(new URL('../../functions/',import.meta.url)),req=createRequire(join(functionsDir,'package.json'));
const lock=readFileSync(join(functionsDir,'package-lock.json'));
assert.equal(createHash('sha1').update('blob '+lock.length+'\0').update(lock).digest('hex'),'9acb6ce6fd6881f3606853ca534939ff79649fe4');
function info(resolver,name,version){
  let dir=dirname(resolver.resolve(name));
  for(;;){let p;try{p=JSON.parse(readFileSync(join(dir,'package.json'),'utf8'));}catch{}
    if(p?.name===name){assert.equal(p.version,version);return createRequire(join(dir,'package.json'));}
    const up=dirname(dir);assert.notEqual(up,dir);dir=up;
  }
}
const sdk=info(req,'@google-cloud/firestore','7.11.6'),gax=info(sdk,'google-gax','4.6.1');
info(req,'firebase-admin','13.7.0');info(gax,'@grpc/grpc-js','1.14.1');info(gax,'google-auth-library','9.15.1');info(gax,'retry-request','7.0.2');
const grpc=gax('@grpc/grpc-js'),{GoogleAuth,OAuth2Client}=gax('google-auth-library'),{v1:{FirestoreClient}}=req('@google-cloud/firestore');
function client(endpointPort=port){
  assert.ok(Number.isInteger(endpointPort)&&endpointPort>0&&endpointPort<=65535);
  const authClient=new OAuth2Client({universeDomain:'googleapis.com'});authClient.setCredentials({access_token:'owner'});
  return new FirestoreClient({servicePath:host,port:endpointPort,projectId:project,fallback:false,
    auth:new GoogleAuth({authClient,projectId:project,universeDomain:'googleapis.com'}),universeDomain:'googleapis.com',
    sslCreds:grpc.credentials.createInsecure(),gaxServerStreamingRetries:false,'grpc.enable_retries':0,'grpc.max_receive_message_length':65536});
}

import {buildAuthIdentityId} from '../../functions/src/schoolOS/identity/idStrategy.ts';
import {ACTION,recordKey,campusIdentity} from '../architecture/server-authority/campus-contract-candidate.mjs';
import {createAuthorityTransactionCandidate} from '../architecture/server-authority/authority-transaction-candidate.mjs';
import {createEmulatorPort,PROJECT,HOST,PORT} from '../architecture/server-authority/firestore-transaction-port-candidate.mjs';
assert.deepEqual([project,host,port],[PROJECT,HOST,PORT]);
const {Timestamp}=req('firebase-admin/firestore');
const START=new Timestamp(0,1000),END=new Timestamp(253402300799,0);
const audit={schemaVersion:1,createdAt:START,updatedAt:START,createdBy:'fixtureProvisioner',updatedBy:'fixtureProvisioner'};
const names={TEN:'tsosV2Tenants',OTB:'tsosV2OrganisationTenantBindings',TMB:'tsosV2TenantMemberships',MEM:'tsosV2OrganisationMemberships',VGR:'tsosV2AuthorityGrants',AFN:'tsosV2AuthorityFences',AOR:'tsosV2ActionRoutes',CAM:'tsosV2Campuses',OCR:'tsosV2OperationReceipts'};
const path=(code,...parts)=>names[code]+'/'+recordKey(code,parts);
const A={tenantId:'tenant-a',organisationId:'org-a',operationId:'operation-1',name:'First Campus',timeZone:'Asia/Kolkata'};
const B={...A,tenantId:'tenant-b',organisationId:'org-b'};
const missing={...A,operationId:'operation-missing'};
const racing={...A,operationId:'operation-race'};
const rev={tenantId:'tenant-a',organisationId:'org-a',personId:'person-a',expectedGrantRevision:7,expectedGeneration:21};
const entries=[];
function seed(t,o,uid,p){
 const set=(code,parts,data)=>entries.push([path(code,...parts),{...audit,...data}]);
 const auth=buildAuthIdentityId('firebase',uid);
 entries.push(['authIdentities/'+auth,{...audit,authIdentityId:auth,personId:p,provider:'firebase',providerSubject:uid,status:'active'}]);
 entries.push(['people/'+p,{...audit,personId:p,kind:'adult',displayName:'Synthetic Person',status:'active'}]);
 entries.push(['organisations/'+o,{...audit,organisationId:o,type:'school',name:'Synthetic Organisation',status:'active'}]);
 set('TEN',[t],{tenantId:t,name:'Synthetic Tenant',status:'active'});
 set('OTB',[o],{tenantId:t,organisationId:o,status:'active',revision:1});
 const interval={effectiveStartAt:START,effectiveEndAt:END};
 set('TMB',[t,p],{tenantMembershipId:recordKey('TMB',[t,p]),tenantId:t,personId:p,status:'active',...interval});
 set('MEM',[t,o,p,'member'],{organisationMembershipId:recordKey('MEM',[t,o,p,'member']),tenantId:t,organisationId:o,personId:p,role:'member',status:'active',isPrimary:false,...interval});
 set('VGR',[t,o,p,ACTION],{grantId:recordKey('VGR',[t,o,p,ACTION]),tenantId:t,organisationId:o,personId:p,roleKey:'campusCreator',action:ACTION,status:'active',revision:7,...interval});
 set('AFN',[t],{tenantId:t,generation:21});
 set('AOR',[t,ACTION],{tenantId:t,action:ACTION,lane:'successor',epoch:1});
}
seed('tenant-a','org-a','uid-a','person-a');seed('tenant-b','org-b','uid-b','person-b');
function pair(q,actor){const id=campusIdentity(q,actor);return {id,target:names.CAM+'/'+id.campusId,receipt:names.OCR+'/'+id.receiptKey}}
const a=pair(A,'person-a'),b=pair(B,'person-b'),m=pair(missing,'person-a'),r=pair(racing,'person-a');
const cross=path('TMB','tenant-b','person-a'),grant=path('VGR','tenant-a','org-a','person-a',ACTION),fence=path('AFN','tenant-a');
const allowedPaths=new Set([...entries.map(([p])=>p),... [a,b,m,r].flatMap(x=>[x.target,x.receipt]),cross]);
assert.equal(allowedPaths.size,29);
const contextA=Object.freeze({}),contextB=Object.freeze({}),stale=Object.freeze({}),operator=Object.freeze({});
const auth=async c=>c===contextA?{uid:'uid-a',expectedGeneration:null,expectedEpoch:null}:c===contextB?{uid:'uid-b',expectedGeneration:null,expectedEpoch:null}:c===stale?{uid:'uid-a',expectedGeneration:20,expectedEpoch:1}:null;
const provisioner=async c=>c===operator?{actorId:'fixtureProvisioner',tenantId:'tenant-a',organisationId:'org-a',personId:'person-a'}:null;
test('Gate B actual Firestore adapter, fixed two-tenant scope',{timeout:150000},async t=>{
 const budget={calls:145,reads:118,begins:13,terminals:13,attemptedWrites:28,successfulWrites:28,seeds:1};
 const ledger={calls:0,reads:0,begins:0,terminals:0,attemptedWrites:0,successfulWrites:0,seeds:0,commits:[],errors:[]};
 const seenTransactions=new Set(),clients=[client(),client()];
 const [left,right]=clients.map(client=>createEmulatorPort({client,allowedPaths,budget,ledger,seenTransactions}));
 const service=port=>createAuthorityTransactionCandidate({runOnce:port.runOnce,resolveVerifiedAuth:auth,resolveProvisioner:provisioner});
 const one=service(left),two=service(right);
 const outcome=async (promise,expected)=>assert.equal((await promise).status,expected);
 const noWrite=async (fn,reads)=>{
  const old=[ledger.reads,ledger.attemptedWrites,ledger.errors.length];await fn();
  assert.equal(ledger.reads-old[0],reads);assert.equal(ledger.attemptedWrites,old[1]);assert.equal(ledger.errors.length,old[2],'DENIAL_MUST_NOT_MASK_PORT_FAILURE');
 };
 try{
  await left.seed(entries);
  await noWrite(async()=>{
   await outcome(one.execute({uid:'uid-a'},A),'denied');
   await outcome(one.execute(contextA,{...A,actorPersonId:'person-a'}),'denied');
   await outcome(one.revoke(contextA,rev),'denied');
  },0);
  const base=ledger.reads;await outcome(one.execute(contextA,A),'committed');assert.equal(ledger.reads-base,12);
  const second=ledger.reads;await outcome(two.execute(contextB,B),'committed');assert.equal(ledger.reads-second,12);
  await noWrite(()=>outcome(one.execute(contextA,B),'denied'),6);
  await noWrite(()=>outcome(one.execute(stale,A),'denied'),10);
  await noWrite(()=>outcome(two.recover(contextA,A),'committed'),12);
  await noWrite(()=>outcome(one.execute(contextA,{...A,name:'Changed'}),'conflict'),11);
  await noWrite(()=>outcome(two.recover(contextA,missing),'indeterminate'),12);
  await noWrite(()=>outcome(one.revoke(operator,{...rev,expectedGeneration:20}),'denied'),2);
  assert.equal(ledger.errors.length,0,'PRE_RACE_PORT_FAILURE');
  t.diagnostic('GATE-B actual authority, tenant isolation, replay, conflict and absent recovery PASS');
  // No lock-holding barrier; independent clients contend on the same grant/fence read set.
  let ready=0,release;
  const opened=new Promise(r=>{release=r});
  const barrier=async()=>{if(++ready===2)release();let timer;try{await Promise.race([opened,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('BEGIN_BARRIER_TIMEOUT')),4000)})])}finally{clearTimeout(timer)}};
  // Both transactions are open before either reads; no waits after acquiring locks.
  const racer=port=>service({runOnce:fn=>port.runOnce(fn,barrier)});
  const [command,revocation]=await Promise.all([racer(left).execute(contextA,racing),racer(right).revoke(operator,rev)]);
  assert.equal(ready,2);
  assert.equal(revocation.status,'revoked');
  const revoked=ledger.commits.find(x=>x.kind==='update');
  assert.ok(revoked);
  const raced=ledger.commits.find(x=>x.paths.includes(r.target));
  if(command.status==='committed'){assert.ok(raced&&raced.time<revoked.time,'COMMAND_MUST_PRECEDE_REVOCATION')}
  else{assert.ok(['denied','indeterminate'].includes(command.status));assert.equal(raced,undefined)}
  // Only observed ABORTED contention is allowed, never an unexplained transport/integrity failure.
  assert.ok(ledger.errors.every(e=>e.code===grpc.status.ABORTED),'UNEXPECTED_PORT_FAILURE');
  if(command.status==='indeterminate')assert.ok(ledger.errors.some(e=>e.code===grpc.status.ABORTED),'UNEXPLAINED_INDETERMINATE');
  await noWrite(()=>outcome(one.recover(contextA,A),'denied'),8);
  await noWrite(()=>outcome(one.execute(contextA,missing),'denied'),8);
  await noWrite(()=>outcome(two.revoke(operator,{...rev,expectedGrantRevision:8,expectedGeneration:22}),'denied'),1);
  const g=await left.observe(grant),f=await left.observe(fence);
  assert.equal(g.status,'revoked');assert.equal(g.revision,8);assert.equal(f.generation,22);
  assert.equal(g.createdAt.seconds,START.seconds);assert.equal(g.createdAt.nanoseconds,START.nanoseconds);
  assert.equal(g.effectiveStartAt.nanoseconds,START.nanoseconds);
  assert.equal(g.updatedBy,'fixtureProvisioner');assert.equal(f.updatedBy,'fixtureProvisioner');
  async function verify(q,x,actor,exists){
   const target=await left.observe(x.target),receipt=await left.observe(x.receipt);
   if(!exists){assert.equal(target,null);assert.equal(receipt,null);return}
   assert.ok(target&&receipt);
   assert.deepEqual(Object.keys(target).sort(),['campusId','tenantId','organisationId','name','timeZone','status','revision','schemaVersion','createdAt','updatedAt','createdBy','updatedBy'].sort());
   assert.deepEqual(Object.keys(receipt).sort(),['receiptKey','tenantId','actorPersonId','action','semanticHash','campusId','committedRevision','schemaVersion','createdAt','updatedAt','createdBy','updatedBy'].sort());
   assert.equal(target.campusId,x.id.campusId);assert.equal(target.tenantId,q.tenantId);assert.equal(target.organisationId,q.organisationId);assert.equal(target.name,q.name);assert.equal(target.timeZone,q.timeZone);assert.equal(target.status,'active');assert.equal(target.revision,1);
   assert.equal(receipt.receiptKey,x.id.receiptKey);assert.equal(receipt.tenantId,q.tenantId);assert.equal(receipt.actorPersonId,actor);assert.equal(receipt.action,ACTION);assert.equal(receipt.semanticHash,x.id.semanticHash);assert.equal(receipt.campusId,x.id.campusId);assert.equal(receipt.committedRevision,1);
   for(const doc of [target,receipt]){assert.equal(doc.schemaVersion,1);assert.equal(doc.createdBy,actor);assert.equal(doc.updatedBy,actor);assert.ok(doc.createdAt instanceof Timestamp&&doc.updatedAt instanceof Timestamp);assert.ok(doc.createdAt.isEqual(doc.updatedAt))}
  }
  await verify(A,a,'person-a',true);await verify(B,b,'person-b',true);await verify(missing,m,'person-a',false);await verify(racing,r,'person-a',!!raced);
  assert.equal(ledger.begins,13);assert.equal(ledger.terminals,13);assert.equal(ledger.seeds,1);
  assert.equal(ledger.successfulWrites,raced?28:26);assert.equal(ledger.calls,ledger.reads+ledger.begins+ledger.terminals+ledger.seeds);
  t.diagnostic('GATE-B checked revocation and race PASS; order='+(raced?'command-before-revoke':'revocation-won-or-command-aborted'));
  t.diagnostic('GATE-B_LOCAL_PASS '+JSON.stringify({calls:ledger.calls,reads:ledger.reads,begins:ledger.begins,terminals:ledger.terminals,attemptedWrites:ledger.attemptedWrites,successfulWrites:ledger.successfulWrites,deleteCalls:0,productionOperations:0}));
 }finally{const closed=await Promise.allSettled(clients.map(c=>c.close()));assert.ok(closed.every(x=>x.status==='fulfilled'),'SDK_CLOSE_FAILED')}
});
