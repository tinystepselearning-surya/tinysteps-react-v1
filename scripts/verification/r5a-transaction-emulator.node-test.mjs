// Fixed three-cohort local transaction probe. No application imports, production SDK
// initialization, real identity, document deletion, query or caller-supplied targets.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const project='demo-tsos-r5-transaction',host='127.0.0.1',port=8789;
const database='projects/'+project+'/databases/(default)',parent=database+'/documents/';
assert.equal(process.env.TSOS_R5_EMULATOR_ONLY,'1');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,host+':'+port);
assert.equal(process.env.GCLOUD_PROJECT,project);
assert.equal(process.version,'v22.22.1');
const allowed=new Set(['PATH','HOME','TMPDIR','TZ','TSOS_R5_EMULATOR_ONLY','FIRESTORE_EMULATOR_HOST','GCLOUD_PROJECT']);
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
function client(){
  const authClient=new OAuth2Client({universeDomain:'googleapis.com'});authClient.setCredentials({access_token:'owner'});
  return new FirestoreClient({servicePath:host,port,projectId:project,fallback:false,
    auth:new GoogleAuth({authClient,projectId:project,universeDomain:'googleapis.com'}),universeDomain:'googleapis.com',
    sslCreds:grpc.credentials.createInsecure(),gaxServerStreamingRetries:false,'grpc.enable_retries':0,'grpc.max_receive_message_length':65536});
}
const options=()=>({timeout:5000,retry:null,retryRequestOptions:{retries:0,noResponseRetries:0,shouldRetryFn:()=>false}});
const hash=x=>createHash('sha256').update(JSON.stringify(x),'utf8').digest('hex');
const tenant='fixture-tenant-a',actor='fixture-person-a',action='finance.post',at=1500;
function cohort(id){
  const operationId=id+'-operation',targetId=id,organisationId='fixture-org-a';
  const key=hash(['TSOS:R5:RECEIPT:1',tenant,actor,action,operationId]);
  const command=Object.freeze({tenant,actor,organisationId,action,operationId,targetId,expectedRevision:7,amountMinor:12345,currency:'INR'});
  return Object.freeze({command,key,authority:parent+'tsosR5FixtureAuthority/'+id,target:parent+'tsosR5FixtureTargets/'+id,receipt:parent+'tsosR5FixtureReceipts/'+key});
}
const cohorts=['fixture-c01','fixture-c02','fixture-c03'].map(cohort);
const names=new Set(cohorts.flatMap(c=>[c.authority,c.target,c.receipt]));
const semantic=q=>hash(['TSOS:R5:COMMAND:1',q.tenant,q.actor,q.organisationId,q.action,q.operationId,q.targetId,q.expectedRevision,q.amountMinor,q.currency]);
const approval=(q,generation,epoch)=>hash(['TSOS:R5:APPROVAL:1',semantic(q),generation,epoch,at]);
const authorityFields=(c,revoked=false)=>({tenant,actor,organisationId:c.command.organisationId,action,targetId:c.command.targetId,active:!revoked,receiptEligible:!revoked,generation:revoked?2:1,epoch:4,phase:'successor',observedAt:at,start:1000,end:2000,approvalHash:approval(c.command,revoked?2:1,4)});
const targetFields=(c,settled=false)=>({tenant,organisationId:c.command.organisationId,targetId:c.command.targetId,revision:settled?8:7,outstandingMinor:settled?0:12345,currency:'INR',state:settled?'settled':'open'});
const receiptFields=c=>({key:c.key,semanticHash:semantic(c.command),committedRevision:8});
const encode=v=>typeof v==='string'?{stringValue:v}:typeof v==='boolean'?{booleanValue:v}:{integerValue:String(v)};
function decode(doc,expected){
  assert.ok(doc&&doc.fields);assert.deepEqual(Object.keys(doc.fields).sort(),Object.keys(expected).sort());
  return Object.fromEntries(Object.entries(expected).map(([k,v])=>{
    const field=doc.fields[k],tag=typeof v==='string'?'stringValue':typeof v==='boolean'?'booleanValue':'integerValue';
    assert.ok(field&&Object.hasOwn(field,tag));
    const value=field[tag];
    if(tag==='integerValue'){assert.ok(typeof value==='string'||typeof value==='number');assert.match(String(value),/^-?(0|[1-9]\d*)$/);assert.ok(Number.isSafeInteger(Number(value)));return [k,Number(value)];}
    assert.equal(typeof value,typeof v);return [k,value];
  }));
}
function write(name,fields,currentDocument){
  assert.ok(names.has(name));
  return {update:{name,fields:Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,encode(v)]))},currentDocument,...(currentDocument.updateTime?{updateMask:{fieldPaths:Object.keys(fields)}}:{})};
}
function timestamp(doc){
  const t=doc.updateTime;assert.ok(t&&typeof t==='object'&&Object.hasOwn(t,'seconds'));return t;
}
function point(client,name,expected,transaction){
  assert.ok(names.has(name));
  return new Promise((resolve,reject)=>{
    let stream,timer,done=false,frame;
    const finish=(err,value)=>{if(done)return;done=true;clearTimeout(timer);err?reject(Error(err)):resolve(value);};
    const fail=code=>{finish(code);try{stream?.cancel();}catch{}};
    try{
      stream=client.batchGetDocuments({database,documents:[name],mask:{fieldPaths:Object.keys(expected)},...(transaction?{transaction}:{})},options());
      stream.on('data',row=>{
        if(done)return;
        try{
          assert.equal(frame,undefined);
          const found=row.found,missing=row.missing;
          assert.ok((found&&found.name===name&&!missing)||(!found&&missing===name));
          frame=found?{document:found,fields:decode(found,expected)}:{document:null,fields:null};
        }catch{fail('UNEXPECTED_POINT_RESPONSE');}
      });
      stream.on('error',()=>finish('POINT_RPC_FAILED'));
      stream.on('end',()=>frame?finish(null,frame):finish('MISSING_POINT_RESPONSE'));
      stream.on('close',()=>finish('POINT_STREAM_CLOSED'));
      timer=setTimeout(()=>fail('POINT_TIMEOUT'),5000);
    }catch{fail('POINT_OPEN_FAILED');}
  });
}
test('R5-A three fixed local cohorts: atomic receipt, replay, changed request, revoked actor',{timeout:150000},async t=>{
  let calls=0,writeEntries=0,successfulWrites=0,begins=0,reads=0,terminals=0,seeds=0,revocations=0,verified=0;
  let sdkClient=client();
  function reserve(writes=0){
    assert.ok(calls<43&&writeEntries+writes<=19,'LOCAL_BUDGET_EXCEEDED');calls++;writeEntries+=writes;
  }
  async function commit(writes,transaction,kind){
    assert.ok(writes.length>0&&writes.length<=2&&writes.every(w=>w.update&&names.has(w.update.name)&&w.currentDocument&&!w.delete&&(w.currentDocument.exists===false||w.currentDocument.updateTime&&w.updateMask)));
    if(kind==='seed'){assert.ok(++seeds<=3&&writes.every(w=>w.currentDocument.exists===false));}
    else if(kind==='revoke'){assert.ok(++revocations<=1&&writes.length===1&&writes[0].currentDocument.updateTime);}
    else {assert.ok(++terminals<=6&&transaction&&writes.length===2);}
    reserve(writes.length);
    const [result]=await sdkClient.commit({database,writes,...(transaction?{transaction}:{})},options());
    assert.equal(result.writeResults.length,writes.length);successfulWrites+=writes.length;
  }
  async function read(name,expected,transaction){
    assert.ok(++reads<=27);reserve();return point(sdkClient,name,expected,transaction);
  }
  async function begin(){
    assert.ok(++begins<=6);reserve();
    const [result]=await sdkClient.beginTransaction({database,options:{readWrite:{}}},options());
    assert.ok(result.transaction&&result.transaction.length>0);return result.transaction;
  }
  async function rollback(transaction){
    assert.ok(++terminals<=6);reserve();await sdkClient.rollback({database,transaction},options());
  }
  async function attempt(c,q){
    const tx=await begin();
    // Three exact reads in one transaction. On unexpected RPC/validation failure
    // stop entire probe, no blind retry/extra terminal RPC; disposable backend exits.
    const a=await read(c.authority,authorityFields(c),tx);
    const target=await read(c.target,targetFields(c),tx);
    const receipt=await read(c.receipt,receiptFields(c),tx);
    const active=a.fields&&JSON.stringify(a.fields)===JSON.stringify(authorityFields(c));
    const revoked=a.fields&&JSON.stringify(a.fields)===JSON.stringify(authorityFields(c,true));
    assert.ok(active||revoked,'UNEXPECTED_AUTHORITY');
    assert.ok(target.fields,'MISSING_TARGET');
    assert.ok(JSON.stringify(target.fields)===JSON.stringify(targetFields(c))||JSON.stringify(target.fields)===JSON.stringify(targetFields(c,true)),'UNEXPECTED_TARGET');
    assert.ok(!receipt.fields||JSON.stringify(receipt.fields)===JSON.stringify(receiptFields(c)),'UNEXPECTED_RECEIPT');
    // The fixture operator supplies q. Current authority is read from the backend,
    // not copied from a prior successful decision. No result data on denial.
    if(!active){await rollback(tx);return {kind:'denied'};}
    if(semantic(q)!==semantic(c.command)||a.fields.approvalHash!==approval(q,a.fields.generation,a.fields.epoch)){
      await rollback(tx);return {kind:'conflict'};
    }
    if(receipt.fields){
      assert.deepEqual(target.fields,targetFields(c,true));assert.equal(a.fields.receiptEligible,true);
      await rollback(tx);return {kind:'replay',committedRevision:receipt.fields.committedRevision};
    }
    assert.deepEqual(target.fields,targetFields(c));
    await commit([write(c.target,targetFields(c,true),{updateTime:timestamp(target.document)}),write(c.receipt,receiptFields(c),{exists:false})],tx,'transaction');
    return {kind:'committed',committedRevision:8,authorityTimestamp:timestamp(a.document)};
  }
  try{
    for(const [i,c] of cohorts.entries()){
      await commit([write(c.authority,authorityFields(c),{exists:false}),write(c.target,targetFields(c),{exists:false})],null,'seed');
      const first=await attempt(c,c.command);assert.equal(first.kind,'committed');assert.equal(first.committedRevision,8);
      if(i===0){await sdkClient.close();sdkClient=client();assert.deepEqual(await attempt(c,c.command),{kind:'replay',committedRevision:8});}
      if(i===1)assert.deepEqual(await attempt(c,{...c.command,amountMinor:12346}),{kind:'conflict'});
      if(i===2){
        await commit([write(c.authority,authorityFields(c,true),{updateTime:first.authorityTimestamp})],null,'revoke');
        assert.deepEqual(await attempt(c,c.command),{kind:'denied'});
      }
      assert.deepEqual((await read(c.authority,authorityFields(c))).fields,authorityFields(c,i===2));
      assert.deepEqual((await read(c.target,targetFields(c))).fields,targetFields(c,true));
      assert.deepEqual((await read(c.receipt,receiptFields(c))).fields,receiptFields(c));
      verified++;
    }
    assert.deepEqual({calls,writeEntries,successfulWrites,begins,reads,terminals,seeds,revocations,verified},{calls:43,writeEntries:13,successfulWrites:13,begins:6,reads:27,terminals:6,seeds:3,revocations:1,verified:3});
    t.diagnostic('R5-A_LOCAL_PASS cohorts=3 transactions=6 logicalRPCs=43 pointReads=27 successfulWrites=13 deleteCalls=0 productionOperations=0');
  }finally{await sdkClient.close();}
});
