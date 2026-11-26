// Database-free transport test. A loopback mock rejects every request; no Firestore
// emulator, data store, document writes, credential lookup or production target.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
assert.equal(process.version,'v22.22.1');
const allowed=new Set(['PATH','HOME','TMPDIR','TZ','__CF_USER_TEXT_ENCODING']);
for(const key of Object.keys(process.env))assert.ok(allowed.has(key),'UNEXPECTED_ENVIRONMENT');
assert.ok(process.env.HOME&&process.env.TMPDIR,'ISOLATED_TEMP_HOME_REQUIRED');
const functionsDir=fileURLToPath(new URL('../../functions/',import.meta.url));
const installed=realpathSync(join(functionsDir,'node_modules'))+sep;
const req=createRequire(join(functionsDir,'package.json'));
const lock=readFileSync(join(functionsDir,'package-lock.json'));
assert.equal(createHash('sha1').update('blob '+lock.length+'\0').update(lock).digest('hex'),'9acb6ce6fd6881f3606853ca534939ff79649fe4');
function info(resolver,name,version){
  const entry=realpathSync(resolver.resolve(name));
  assert.ok(entry.startsWith(installed),'DEPENDENCY_OUTSIDE_WORKTREE');
  let dir=dirname(entry);
  for(;;){
    assert.ok((dir+sep).startsWith(installed),'DEPENDENCY_OUTSIDE_WORKTREE');
    let p;try{p=JSON.parse(readFileSync(join(dir,'package.json'),'utf8'));}catch{}
    if(p?.name===name){assert.equal(p.version,version);console.log('PINNED '+name+' '+version);return createRequire(join(dir,'package.json'));}
    const up=dirname(dir);assert.notEqual(up,dir);dir=up;
  }
}
const sdk=info(req,'@google-cloud/firestore','7.11.6'),gax=info(sdk,'google-gax','4.6.1');
info(req,'firebase-admin','13.7.0');info(gax,'@grpc/grpc-js','1.14.1');
info(gax,'google-auth-library','9.15.1');info(gax,'retry-request','7.0.2');
const grpc=gax('@grpc/grpc-js'),{GoogleAuth,OAuth2Client}=gax('google-auth-library'),{v1:{FirestoreClient}}=req('@google-cloud/firestore');
const host='127.0.0.1',project='demo-tsos-r5-retry-mock',database='projects/'+project+'/databases/(default)';
const methods=['beginTransaction','batchGetDocuments','commit','rollback'];
const counts=Object.fromEntries(methods.map(name=>[name,0]));
const descriptors={},handlers={};
const unavailable=()=>Object.assign(Error('fixture unavailable'),{code:grpc.status.UNAVAILABLE,details:'fixture unavailable'});
for(const name of methods){
  const streaming=name==='batchGetDocuments';
  descriptors[name]={path:'/google.firestore.v1.Firestore/'+name[0].toUpperCase()+name.slice(1),
    requestStream:false,responseStream:streaming,requestDeserialize:b=>b,responseSerialize:()=>Buffer.alloc(0),
    requestSerialize:b=>b,responseDeserialize:b=>b,originalName:name};
  if(streaming)handlers[name]=call=>{counts[name]++;call.emit('error',unavailable());};
  else handlers[name]=(_call,cb)=>{counts[name]++;cb(unavailable());};
}
const server=new grpc.Server();server.addService(descriptors,handlers);
let client;
const watchdog=setTimeout(()=>{console.error('R5A_MOCK_WATCHDOG_EXPIRED');process.exit(1);},45000);
const options=()=>({timeout:5000,retry:null,retryRequestOptions:{retries:0,noResponseRetries:0,shouldRetryFn:()=>false}});
const isUnavailable=err=>err?.code===grpc.status.UNAVAILABLE;
try{
  const port=await new Promise((resolve,reject)=>server.bindAsync(host+':0',grpc.ServerCredentials.createInsecure(),(err,p)=>err?reject(err):resolve(p)));
  assert.ok(Number.isInteger(port)&&port>0&&port!==8789);
  const authClient=new OAuth2Client({universeDomain:'googleapis.com'});authClient.setCredentials({access_token:'owner'});
  client=new FirestoreClient({servicePath:host,port,projectId:project,fallback:false,
    auth:new GoogleAuth({authClient,projectId:project,universeDomain:'googleapis.com'}),universeDomain:'googleapis.com',
    sslCreds:grpc.credentials.createInsecure(),gaxServerStreamingRetries:false,'grpc.enable_retries':0,'grpc.max_receive_message_length':65536});
  await assert.rejects(client.beginTransaction({database,options:{readWrite:{}}},options()),isUnavailable);
  await assert.rejects(new Promise((resolve,reject)=>{
    const stream=client.batchGetDocuments({database,documents:[database+'/documents/mock/only']},options());
    stream.once('error',reject);stream.once('end',resolve);stream.once('data',()=>reject(Error('UNEXPECTED_MOCK_DATA')));
  }),isUnavailable);
  await assert.rejects(client.commit({database,writes:[]},options()),isUnavailable);
  await assert.rejects(client.rollback({database,transaction:Buffer.from('mock')},options()),isUnavailable);
  await delay(1000);
  assert.deepEqual(counts,{beginTransaction:1,batchGetDocuments:1,commit:1,rollback:1});
  await client.close();client=undefined;
  server.forceShutdown();
  console.log('R5A_MOCK_RETRY_PASS begin=1 batchGet=1 commit=1 rollback=1 databaseOperations=0');
}finally{
  try{server.forceShutdown();if(client)await client.close();}
  finally{clearTimeout(watchdog);}
}
