// B02-R1C controller integration: actual locked SDK, synthetic loopback only.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {setTimeout as sleep} from 'node:timers/promises';
import {exerciseSyntheticTransport} from './identity-transport-orchestration.mjs';
import {FIELD_MASKS} from './identity-verification-safety-core.mjs';

// Validate the sanitized process before loading third-party SDK modules.
// Node's isolated test worker adds NODE_TEST_CONTEXT. macOS may inject
// __CF_USER_TEXT_ENCODING even after env -i. Remove only the latter;
// preserve the runner marker and reject all other unexpected variables.
assert.equal(process.env.TSOS_OFFLINE_LOOPBACK,'1','use documented isolated command');
const allowedEnv=new Set(['PATH','HOME','TMPDIR','TSOS_OFFLINE_LOOPBACK','TZ']);
for(const key of Object.keys(process.env)){
  if(allowedEnv.has(key))continue;
  if(key==='NODE_TEST_CONTEXT'&&process.env[key]==='child-v8')continue;
  if(key==='__CF_USER_TEXT_ENCODING'&&process.platform==='darwin'){
    delete process.env[key];continue;
  }
  throw Error('unexpected environment key: '+key);
}

const functionsDir=fileURLToPath(new URL('../../functions/',import.meta.url));
const req=createRequire(join(functionsDir,'package.json'));
const lock=readFileSync(join(functionsDir,'package-lock.json'));
assert.equal(createHash('sha1').update('blob '+lock.length+'\0').update(lock).digest('hex'),
  '9acb6ce6fd6881f3606853ca534939ff79649fe4','lock drift');
assert.equal(process.version,'v22.22.1');
function info(resolver,name,version){
  let dir=dirname(resolver.resolve(name));
  for(;;){
    let p;
    try{p=JSON.parse(readFileSync(join(dir,'package.json'),'utf8'));}catch{}
    if(p?.name===name){assert.equal(p.version,version);return {dir,req:createRequire(join(dir,'package.json'))};}
    const parent=dirname(dir);assert.notEqual(parent,dir,'package not found');dir=parent;
  }
}
info(req,'firebase-admin','13.7.0');
info(req,'typescript','5.9.3');
const fsdk=info(req,'@google-cloud/firestore','7.11.6');
const gax=info(fsdk.req,'google-gax','4.6.1');
info(gax.req,'@grpc/grpc-js','1.14.1');
info(gax.req,'google-auth-library','9.15.1');
const grpc=gax.req('@grpc/grpc-js');
const loader=gax.req('@grpc/proto-loader');
const {GoogleAuth,OAuth2Client}=gax.req('google-auth-library');
const {v1:{FirestoreClient}}=req('@google-cloud/firestore');
const protoRoot=join(fsdk.dir,'build','protos');
const def=loader.loadSync(join(protoRoot,'google/firestore/v1/firestore.proto'),{
  includeDirs:[protoRoot],keepCase:false,longs:String,enums:String,defaults:false,oneofs:false
});
const service=grpc.loadPackageDefinition(def).google.firestore.v1.Firestore.service;
info(gax.req,'retry-request','7.0.2');
const db='projects/tsos-synthetic-transport/databases/(default)',parent=db+'/documents';
const actor={uid:'synthetic-uid',personId:'synthetic-person',authIdentityId:'auth_'+'a'.repeat(32),
  role:'teacher',organisationId:null,legacySchoolId:null};
const time={seconds:'1700000000',nanos:123000000};
const colOrder=['authAccessReadModels','authIdentities','people','roleAssignments','organisationMemberships','users','schoolUsers'];
const queryCols=['roleAssignments','organisationMemberships'];
const idFor=col=>col==='authIdentities'?actor.authIdentityId:col==='people'?actor.personId:actor.uid;
const str=stringValue=>({stringValue});
function doc(col,id){
  const fields={};
  if(col==='authAccessReadModels')fields.firebaseUid=str(id);
  if(col==='authIdentities')fields.authIdentityId=str(id);
  if(col==='people')fields.personId=str(id);
  if(queryCols.includes(col)){
    fields.personId=str(actor.personId);
    fields[col==='roleAssignments'?'roleAssignmentId':'organisationMembershipId']=str(id);
  }
  return {name:parent+'/'+col+'/'+id,fields};
}
async function run(scenario){
  const server=new grpc.Server(),calls=[],cancelled=new Set(),wireErrors=[];
  let client,waiting=null,failedQuery=null;
  const failCall=call=>call.emit('error',Object.assign(Error('synthetic unavailable'),{code:grpc.status.UNAVAILABLE}));
  function handler(method,call){
    const r=call.request;
    const query=method==='runQuery';
    const col=query?r.structuredQuery?.from?.[0]?.collectionId:r.documents?.[0]?.split('/').at(-2);
    calls.push(col);call.on('cancelled',()=>cancelled.add(col));
    try{
      assert.ok(colOrder.includes(col));assert.equal(calls.filter(c=>c===col).length,1);
      if(col==='authAccessReadModels')assert.equal(r.readTime,undefined);
      else assert.deepEqual(r.readTime,time);
      if(query){
        assert.equal(r.parent,parent);assert.deepEqual(r.structuredQuery,{
          select:{fields:FIELD_MASKS[col].map(fieldPath=>({fieldPath}))},from:[{collectionId:col}],
          where:{fieldFilter:{field:{fieldPath:'personId'},op:'EQUAL',value:{stringValue:actor.personId}}},
          limit:{value:51}});
      }else{
        assert.equal(r.database,db);assert.deepEqual(r.documents,[parent+'/'+col+'/'+idFor(col)]);
        assert.deepEqual(r.mask.fieldPaths,FIELD_MASKS[col]);
      }
    }catch{wireErrors.push(col);failCall(call);return;}
    if(!query){
      if(scenario==='missing_projection'&&col==='authAccessReadModels'||
         scenario==='missing_legacy'&&col==='schoolUsers'){
        call.write({missing:parent+'/'+col+'/'+idFor(col),readTime:time});call.end();return;
      }
      const d=doc(col,idFor(col));
      if(scenario==='extra_field'&&col==='authAccessReadModels')d.fields.privateField=str('synthetic-secret');
      if(scenario==='foreign_point'&&col==='people')d.name=parent+'/people/synthetic-foreign';
      if(scenario==='wrong_type'&&col==='people')d.fields.personId={booleanValue:true};
      call.write({found:d,readTime:scenario==='snapshot_mismatch'&&col==='people'?{...time,nanos:124000000}:time});
      call.end();return;
    }
    if(scenario==='sibling_failure'){
      if(col==='roleAssignments')failedQuery=call;else waiting=call;
      if(waiting&&failedQuery)setImmediate(()=>failCall(failedQuery));
      return;
    }
    if(scenario==='empty_query'){call.write({readTime:time});call.end();return;}
    const d=doc(col,'synthetic-row');
    if(scenario==='foreign_query'&&col==='roleAssignments')d.fields.personId=str('synthetic-foreign');
    if(scenario==='overflow'&&col==='roleAssignments'){
      for(let i=0;i<51;i++)call.write({document:doc(col,'synthetic-row-'+i),readTime:time});
      call.end();return;
    }
    call.write({document:d,readTime:time});
    if(scenario==='duplicate'&&col==='roleAssignments')call.write({document:d,readTime:time});
    if(scenario==='partial_error'&&col==='roleAssignments'){setImmediate(()=>failCall(call));return;}
    call.end();
  }
  for(const [key,definition] of Object.entries(service)){
    const method=definition.path.endsWith('/BatchGetDocuments')?'batchGetDocuments':
      definition.path.endsWith('/RunQuery')?'runQuery':null;
    if(method)server.addService({[key]:definition},{[key]:call=>handler(method,call)});
  }
  try{
    const port=await new Promise((resolve,reject)=>server.bindAsync('127.0.0.1:0',
      grpc.ServerCredentials.createInsecure(),(err,p)=>err?reject(Error('loopback bind failed')):resolve(p)));
    const authClient=new OAuth2Client({universeDomain:'googleapis.com'});
    authClient.setCredentials({access_token:'synthetic-not-a-real-token'});
    const auth=new GoogleAuth({authClient,projectId:'tsos-synthetic-transport',universeDomain:'googleapis.com'});
    client=new FirestoreClient({servicePath:'127.0.0.1',port,fallback:false,
      projectId:'tsos-synthetic-transport',auth,universeDomain:'googleapis.com',
      sslCreds:grpc.credentials.createInsecure(),gaxServerStreamingRetries:false,
      'grpc.enable_retries':0,'grpc.max_receive_message_length':65536});
    const start=performance.now(),clock=()=>Math.floor(performance.now()-start)+100;
    const plan={scope:'synthetic-only',actors:[actor],startMs:100,endMs:300100,maxAttempts:7,maxSlots:107};
    const result=await exerciseSyntheticTransport(plan,{clock,open:ticket=>client[ticket.request.method](ticket.request.body,
      {timeout:ticket.timeoutMs,retry:null,retryRequestOptions:{retries:0,noResponseRetries:0,shouldRetryFn:()=>false}})});
    await sleep(150);
    assert.deepEqual(wireErrors,[]);
    assert.equal(new Set(calls).size,calls.length);
    assert.equal(result.counts.inFlight,0);
    const ok=['success','empty_query','missing_legacy'].includes(scenario);
    if(ok){
      assert.equal(result.status,'SYNTHETIC_TRANSPORT_COMPLETE');assert.equal(result.counts.completedActors,1);
      assert.equal(result.dispatched,7);assert.equal(calls.length,7);assert.equal(result.counts.reservedSlots,107);
      assert.equal(result.returned,scenario==='empty_query'?5:scenario==='missing_legacy'?6:7);
    }else{
      assert.equal(result.status,'STOPPED');assert.equal(result.returned,0);assert.equal(result.counts.completedActors,0);
      assert.ok(!calls.includes('users')&&!calls.includes('schoolUsers'));
      if(['extra_field','missing_projection'].includes(scenario))assert.equal(calls.length,1);
      if(['foreign_point','wrong_type','snapshot_mismatch'].includes(scenario))assert.equal(calls.length,3);
      if(scenario==='sibling_failure'){
        assert.equal(calls.length,5);assert.ok(cancelled.has('organisationMemberships'));
        assert.equal(result.cancelled,1);assert.equal(result.counts.reservedSlots,105);
        assert.equal(result.counts.unknown,2);
      }
    }
  }finally{server.forceShutdown();if(client)await client.close();}
}
for(const scenario of ['success','empty_query','missing_legacy','missing_projection','extra_field','foreign_point',
  'wrong_type','snapshot_mismatch','foreign_query','overflow','duplicate','partial_error','sibling_failure'])
  test('controller loopback '+scenario,{timeout:15000},()=>run(scenario));
