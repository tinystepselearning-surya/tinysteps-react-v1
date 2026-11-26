// B02-R1C capability probe: actual locked SDK against a synthetic loopback
// gRPC server only. Not the production transport controller or authorization.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {setTimeout as sleep} from 'node:timers/promises';
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
const db='projects/tsos-synthetic-transport/databases/(default)';
const parent=db+'/documents';
const uid='synthetic-transport';
const person='synthetic-person';
const readTime={seconds:'1700000000',nanos:123000000};
const pointName=parent+'/authAccessReadModels/'+uid;
const queryName=parent+'/roleAssignments/synthetic-role';
const pointMask=[...FIELD_MASKS.authAccessReadModels];
const queryMask=[...FIELD_MASKS.roleAssignments];
const specifications={
  batchGetDocuments:{
    path:'/google.firestore.v1.Firestore/BatchGetDocuments',
    request:()=>({database:db,documents:[pointName],mask:{fieldPaths:pointMask},readTime}),
    check:r=>{
      assert.equal(r.database,db);assert.deepEqual(r.documents,[pointName]);
      assert.deepEqual(r.mask?.fieldPaths,pointMask);assert.deepEqual(r.readTime,readTime);
      assert.deepEqual(Object.keys(r).sort(),['database','documents','mask','readTime']);
    },
    row:()=>({found:{name:pointName,fields:{firebaseUid:{stringValue:uid}}},readTime})
  },
  runQuery:{
    path:'/google.firestore.v1.Firestore/RunQuery',
    request:()=>({parent,readTime,structuredQuery:{
      select:{fields:queryMask.map(fieldPath=>({fieldPath}))},
      from:[{collectionId:'roleAssignments'}],
      where:{fieldFilter:{field:{fieldPath:'personId'},op:'EQUAL',value:{stringValue:person}}},
      limit:{value:51}
    }}),
    check:r=>{
      assert.equal(r.parent,parent);assert.deepEqual(r.readTime,readTime);
      const q=r.structuredQuery;
      assert.deepEqual(q.select.fields,queryMask.map(fieldPath=>({fieldPath})));
      assert.deepEqual(q.from,[{collectionId:'roleAssignments'}]);
      assert.deepEqual(q.where,{fieldFilter:{field:{fieldPath:'personId'},op:'EQUAL',value:{stringValue:person}}});
      assert.equal(q.limit?.value,51);
      assert.deepEqual(Object.keys(q).sort(),['from','limit','select','where']);
      assert.deepEqual(Object.keys(r).sort(),['parent','readTime','structuredQuery']);
    },
    row:()=>({document:{name:queryName,fields:{personId:{stringValue:person}}},readTime})
  }
};
const scenarios=['success','unavailable','partial_unavailable','cancel_waiting','cancel_partial','deadline'];
const timeout=1200;
const backoffSettings={initialRetryDelayMillis:100,retryDelayMultiplier:1,maxRetryDelayMillis:100,
  initialRpcTimeoutMillis:timeout,rpcTimeoutMultiplier:1,maxRpcTimeoutMillis:timeout,
  totalTimeoutMillis:timeout,maxRetries:0};
const callOptions=()=>({timeout,retry:{retryCodes:[],backoffSettings:{...backoffSettings},shouldRetryFn:()=>false}});
async function probe(method,scenario){
  const spec=specifications[method];
  const server=new grpc.Server();
  const state={attempts:0,cancelled:0,wireInvalid:false,deadlineInvalid:false};
  let client,stream,watchdog,trigger,seenResolve;
  const seen=new Promise(resolve=>{seenResolve=resolve;});
  const entry=Object.entries(service).find(([,v])=>v.path===spec.path);
  assert.ok(entry,'missing expected service method');
  const [key,definition]=entry;
  server.addService({[key]:definition},{[key]:call=>{
    state.attempts++;
    call.on('cancelled',()=>{state.cancelled++;});
    try{spec.check(call.request);}catch{state.wireInvalid=true;}
    const remaining=Number(call.getDeadline())-Date.now();
    if(!Number.isFinite(remaining)||remaining<0||remaining>timeout+150)state.deadlineInvalid=true;
    seenResolve();
    if(scenario==='success'){call.write(spec.row());call.end();}
    if(scenario==='unavailable'||scenario==='partial_unavailable'){
      if(scenario==='partial_unavailable')call.write(spec.row());
      setImmediate(()=>call.emit('error',Object.assign(new Error('synthetic unavailable'),{
        code:grpc.status.UNAVAILABLE,details:'synthetic unavailable'})));
    }
    if(scenario==='cancel_partial')call.write(spec.row());
    // cancellation/deadline cases deliberately leave server stream open
  }});
  try{
    const port=await new Promise((resolve,reject)=>server.bindAsync('127.0.0.1:0',
      grpc.ServerCredentials.createInsecure(),(err,p)=>err?reject(Error('loopback bind failed')):resolve(p)));
    const authClient=new OAuth2Client({universeDomain:'googleapis.com'});
    authClient.setCredentials({access_token:'synthetic-not-a-real-token'});
    const auth=new GoogleAuth({authClient,projectId:'tsos-synthetic-transport',universeDomain:'googleapis.com'});
    client=new FirestoreClient({servicePath:'127.0.0.1',port,fallback:false,
      projectId:'tsos-synthetic-transport',auth,universeDomain:'googleapis.com',
      sslCreds:grpc.credentials.createInsecure(),gaxServerStreamingRetries:true,
      'grpc.enable_retries':0,'grpc.max_receive_message_length':65536});
    const started=performance.now();
    stream=client[method](spec.request(),callOptions());
    const result=await new Promise(resolve=>{
      let frames=0,done=false;
      const finish=(kind,code)=>{if(done)return;done=true;resolve({kind,code,frames,elapsed:performance.now()-started});};
      stream.on('error',e=>finish('error',e?.code));
      stream.on('end',()=>finish('end',null));
      stream.on('data',()=>{
        frames++;
        if(scenario==='cancel_partial'&&frames===1){
          try{stream.cancel();}catch{finish('cancel_throw',null);}
        }
      });
      if(scenario==='cancel_waiting')seen.then(()=>{
        if(done)return;
        trigger=setTimeout(()=>{try{stream.cancel();}catch{finish('cancel_throw',null);}},25);
      });
      watchdog=setTimeout(()=>finish('watchdog',null),timeout+1600);
    });
    // Watch through the configured RPC deadline for delayed retries or late events.
    await sleep(Math.max(100,timeout+150-result.elapsed));
    assert.equal(state.attempts,1,'observed RPC attempts');
    assert.equal(state.wireInvalid,false,'wire descriptor mismatch');
    assert.equal(state.deadlineInvalid,false,'server deadline absent or outside bound');
    if(scenario==='success'){
      assert.equal(result.kind,'end');assert.equal(result.frames,1);
    }else{
      assert.equal(result.kind,'error','expected transport terminal error');
      const expected=scenario==='deadline'?grpc.status.DEADLINE_EXCEEDED:
        scenario.startsWith('cancel')?grpc.status.CANCELLED:grpc.status.UNAVAILABLE;
      assert.equal(result.code,expected,'unexpected terminal status');
      assert.equal(result.frames,scenario.includes('partial')?1:0,'unexpected partial frames');
      if(scenario==='deadline'||scenario.startsWith('cancel')){
        assert.ok(state.cancelled>=1,'no cancellation observed by server');
        assert.ok(result.elapsed<=timeout+500,'deadline/cancel terminal too late');
        if(scenario.startsWith('cancel'))assert.ok(result.elapsed<timeout,'cancel did not beat RPC deadline');
      }
    }
  }finally{
    clearTimeout(watchdog);clearTimeout(trigger);
    // No raw SDK messages/metadata printed; synthetic server only.
    if(stream){try{stream.cancel();}catch{} stream.destroy();}
    server.forceShutdown();
    if(client)await client.close();
  }
}
for(const method of Object.keys(specifications))
  for(const scenario of scenarios)
    test('loopback '+method+' '+scenario,{timeout:12000},()=>probe(method,scenario));
