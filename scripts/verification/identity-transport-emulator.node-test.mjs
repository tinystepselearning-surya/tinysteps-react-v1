// Focused backend compatibility probe; never a production operator.
// Uses the accepted decoded-response collector without modifying its source.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {FIELD_MASKS} from './identity-verification-safety-core.mjs';
import {createResponseCollector} from './identity-transport-response.mjs';

const project='demo-tsos-identity-transport',host='127.0.0.1',port=8788;
const address=host+':'+port,database='projects/'+project+'/databases/(default)',parent=database+'/documents';
assert.equal(process.env.TSOS_IDENTITY_EMULATOR_ONLY,'1','isolated emulator command required');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,address,'unexpected endpoint');
assert.equal(process.env.GCLOUD_PROJECT,project,'unexpected project');
const allowed=new Set(['PATH','HOME','TMPDIR','TZ','TSOS_IDENTITY_EMULATOR_ONLY','FIRESTORE_EMULATOR_HOST','GCLOUD_PROJECT']);
for(const key of Object.keys(process.env)){
  if(allowed.has(key)||key==='NODE_TEST_CONTEXT'&&process.env[key]==='child-v8')continue;
  if(key==='__CF_USER_TEXT_ENCODING'&&process.platform==='darwin'){delete process.env[key];continue;}
  throw Error('unexpected environment key: '+key);
}
assert.equal(process.version,'v22.22.1');
const functionsDir=fileURLToPath(new URL('../../functions/',import.meta.url)),req=createRequire(join(functionsDir,'package.json'));
const digest=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
assert.equal(digest(readFileSync(join(functionsDir,'package-lock.json'))),'9acb6ce6fd6881f3606853ca534939ff79649fe4','lock drift');
for(const [file,sha] of [
  ['identity-transport-response.mjs','0ed3e942dfcc50a0a1c72f4f6be93eaef7975613'],
  ['identity-verification-safety-core.mjs','1d47dae1c4f84cc6be7eae493243c17c5cba2d77']
])assert.equal(digest(readFileSync(new URL('./'+file,import.meta.url))),sha,'accepted source drift');
function info(resolver,name,version){
  let dir=dirname(resolver.resolve(name));
  for(;;){
    let p;try{p=JSON.parse(readFileSync(join(dir,'package.json'),'utf8'));}catch{}
    if(p?.name===name){assert.equal(p.version,version);return {dir,req:createRequire(join(dir,'package.json'))};}
    const up=dirname(dir);assert.notEqual(up,dir,'package not found');dir=up;
  }
}
const sdk=info(req,'@google-cloud/firestore','7.11.6'),gax=info(sdk.req,'google-gax','4.6.1');
info(req,'firebase-admin','13.7.0');
info(gax.req,'@grpc/grpc-js','1.14.1');
info(gax.req,'google-auth-library','9.15.1');
info(gax.req,'retry-request','7.0.2');
const grpc=gax.req('@grpc/grpc-js');
const {GoogleAuth,OAuth2Client}=gax.req('google-auth-library');
const {v1:{FirestoreClient}}=req('@google-cloud/firestore');
const options=()=>({timeout:5000,retry:null,retryRequestOptions:{retries:0,noResponseRetries:0,shouldRetryFn:()=>false}});
const uid='synthetic-uid-emulator',personId='synthetic-person-emulator',roleId='synthetic-role-emulator';
const point=(collection,id,readTime)=>({collection,request:{method:'batchGetDocuments',body:{
  database,documents:[parent+'/'+collection+'/'+id],mask:{fieldPaths:[...FIELD_MASKS[collection]]},...(readTime?{readTime}:{})}}});
const query=(collection,readTime)=>({collection,request:{method:'runQuery',body:{
  parent,structuredQuery:{select:{fields:FIELD_MASKS[collection].map(fieldPath=>({fieldPath}))},
  from:[{collectionId:collection}],where:{fieldFilter:{field:{fieldPath:'personId'},op:'EQUAL',value:{stringValue:personId}}},limit:{value:51}},
  ...(readTime?{readTime}:{})}}});
function update(collection,id,values){
  return {update:{name:parent+'/'+collection+'/'+id,fields:Object.fromEntries(Object.entries(values).map(([k,v])=>
    [k,typeof v==='boolean'?{booleanValue:v}:{stringValue:v}]))}};
}
function projection(active){return update('authAccessReadModels',uid,{firebaseUid:uid,accessActive:active,privateNote:'fixture-only-unselected'});}
function role(status){return update('roleAssignments',roleId,{roleAssignmentId:roleId,personId,role:'teacher',status,privateNote:'fixture-only-unselected'});}
function read(client,ticket){
  const collector=createResponseCollector(ticket,{retain:true});
  return new Promise((resolve,reject)=>{
    let stream,timer,drain,done=false,blocked=false;
    function finish(error,result){if(done)return;done=true;clearTimeout(timer);clearTimeout(drain);error?reject(Error(error)):resolve(result);}
    function cancel(){
      if(done||blocked)return;blocked=true;
      drain=setTimeout(()=>{try{stream?.destroy();}catch{}finish('EMULATOR_DRAIN_TIMEOUT');},2000);
      try{stream?.cancel();}catch{}
    }
    try{
      stream=client[ticket.request.method](ticket.request.body,options());
      stream.on('data',frame=>{if(done||blocked)return;try{collector.accept(frame);}catch{cancel();}});
      stream.on('error',()=>finish(blocked?'EMULATOR_RESPONSE_REJECTED':'EMULATOR_RPC_FAILED'));
      stream.on('close',()=>{if(!done)finish(blocked?'EMULATOR_RESPONSE_REJECTED':'EMULATOR_STREAM_CLOSED');});
      stream.on('end',()=>{if(done)return;if(blocked){finish('EMULATOR_RESPONSE_REJECTED');return;}
        try{finish(null,collector.finish());}catch{finish('EMULATOR_RESPONSE_REJECTED');}});
      if(!done&&!blocked)timer=setTimeout(cancel,5000);
    }catch{finish('EMULATOR_OPEN_FAILED');}
  });
}
test('identity backend: masks, pinned snapshot, empty and missing results, fresh revocation',{timeout:60000},async t=>{
  // Explicit dummy emulator-only token. No application default credentials.
  const authClient=new OAuth2Client({universeDomain:'googleapis.com'});
  authClient.setCredentials({access_token:'owner'});
  const auth=new GoogleAuth({authClient,projectId:project,universeDomain:'googleapis.com'});
  const client=new FirestoreClient({servicePath:host,port,fallback:false,projectId:project,auth,
    universeDomain:'googleapis.com',sslCreds:grpc.credentials.createInsecure(),gaxServerStreamingRetries:false,
    'grpc.enable_retries':0,'grpc.max_receive_message_length':65536});
  let reads=0,writes=0,commits=0;
  async function seed(items){assert.ok(commits<2&&writes+items.length<=5);commits++;writes+=items.length;
    await client.commit({database,writes:items},{timeout:5000,retry:null});}
  async function get(ticket){assert.ok(reads<7);reads++;return read(client,ticket);}
  const same=(a,b)=>assert.deepEqual(a,b,'server snapshot mismatch');
  const clean=(summary,keys)=>{
    assert.equal(summary.rows,1);assert.equal(summary.missing,false);
    assert.deepEqual(Object.keys(summary.decoded[0]).sort(),[...keys].sort(),'server projection mismatch');
    return summary.decoded[0];
  };
  try{
    await seed([projection(true),role('active'),update('roleAssignments','synthetic-foreign-role',{
      roleAssignmentId:'synthetic-foreign-role',personId:'synthetic-other-person',role:'teacher',status:'active',privateNote:'fixture-only-unselected'})]);
    t.diagnostic('fixture seed complete (local emulator only)');
    const anchor=await get(point('authAccessReadModels',uid));
    assert.equal(clean(anchor,['firebaseUid','accessActive']).accessActive,true);const snapshot=anchor.readTime;
    t.diagnostic('point field mask and server timestamp accepted');
    // Change synthetic current state only; historical reads must preserve the original snapshot.
    await seed([projection(false),role('inactive')]);
    const historical=await get(point('authAccessReadModels',uid,snapshot));
    same(historical.readTime,snapshot);assert.equal(clean(historical,['firebaseUid','accessActive']).accessActive,true);
    const roles=await get(query('roleAssignments',snapshot));same(roles.readTime,snapshot);
    assert.equal(clean(roles,['roleAssignmentId','personId','role','status']).status,'active');
    t.diagnostic('historical point and filtered query preserved original state');
    const empty=await get(query('organisationMemberships',snapshot));same(empty.readTime,snapshot);
    assert.equal(empty.rows,0);assert.equal(empty.decoded.length,0);
    const missing=await get(point('schoolUsers',uid,snapshot));same(missing.readTime,snapshot);
    assert.equal(missing.rows,0);assert.equal(missing.missing,true);
    t.diagnostic('empty query and missing legacy point accepted at pinned snapshot');
    const fresh=await get(point('authAccessReadModels',uid));assert.equal(clean(fresh,['firebaseUid','accessActive']).accessActive,false);
    const freshRoles=await get(query('roleAssignments',fresh.readTime));same(freshRoles.readTime,fresh.readTime);
    assert.equal(clean(freshRoles,['roleAssignmentId','personId','role','status']).status,'inactive');
    assert.equal(reads,7);assert.equal(writes,5);assert.equal(commits,2);
    t.diagnostic('fresh snapshot observes synthetic revocation; 7 logical reads, 2 local fixture commits, 5 synthetic writes; production billing not measured');
  }finally{await client.close();}
});
