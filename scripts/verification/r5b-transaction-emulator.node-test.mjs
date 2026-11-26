// Fixed adverse-condition local transaction probe. No application imports, production SDK
// initialization, real identity, document deletion, query or caller-supplied targets.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const project='demo-tsos-r5b-transaction',host='127.0.0.1',port=8790;
const database='projects/'+project+'/databases/(default)',parent=database+'/documents/';
assert.equal(process.env.TSOS_R5B_EMULATOR_ONLY,'1');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,host+':'+port);
assert.equal(process.env.GCLOUD_PROJECT,project);
assert.equal(process.version,'v22.22.1');
const allowed=new Set(['PATH','HOME','TMPDIR','TZ','TSOS_R5B_EMULATOR_ONLY','FIRESTORE_EMULATOR_HOST','GCLOUD_PROJECT']);
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
const semantic=q=>hash(['TSOS:R5:COMMAND:1',q.tenant,q.actor,q.organisationId,q.action,q.targetId,q.expectedRevision,q.amountMinor,q.currency]);
const key=q=>hash(['TSOS:R5:RECEIPT:1',q.tenant,q.actor,q.action,q.operationId]);
const approval=q=>hash(['TSOS:R5B:APPROVAL:1',key(q),semantic(q),1,4,at]);
function cohort(id){
  const command=Object.freeze({tenant,actor,organisationId:'fixture-org-a',action,targetId:id,operationId:id+'-operation',expectedRevision:7,amountMinor:12345,currency:'INR'});
  const alternate=Object.freeze({...command,operationId:id+'-alternate'});
  const receipt=q=>parent+'tsosR5BFixtureReceipts/'+key(q);
  return Object.freeze({command,alternate,authority:parent+'tsosR5BFixtureAuthority/'+id,target:parent+'tsosR5BFixtureTargets/'+id,receipt:receipt(command),alternateReceipt:id==='fixture-b01'?receipt(alternate):null});
}
const cohorts=['fixture-b01','fixture-b02','fixture-b03','fixture-b04','fixture-b05','fixture-b06'].map(cohort);
const names=new Set(cohorts.flatMap(c=>[c.authority,c.target,c.receipt,...(c.alternateReceipt?[c.alternateReceipt]:[])]));
const authorityFields=c=>({tenant,actor,organisationId:c.command.organisationId,action,targetId:c.command.targetId,active:true,receiptEligible:true,generation:1,epoch:4,phase:'successor',observedAt:at,start:1000,end:2000,approvalHash:approval(c.command),...(c.alternateReceipt?{alternateApprovalHash:approval(c.alternate)}:{})});
const targetFields=(c,state='open')=>({tenant,organisationId:c.command.organisationId,targetId:c.command.targetId,revision:state==='open'?7:8,outstandingMinor:state==='settled'?0:12345,currency:'INR',state:state==='changed'?'open':state});
const receiptFields=q=>({key:key(q),semanticHash:semantic(q),committedRevision:8});
const collisionFields=c=>({...receiptFields(c.command),semanticHash:hash(['fixture-existing-conflict'])});
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
      stream=client.batchGetDocuments({database,documents:[name],...(transaction?{transaction}:{})},options());
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

test('R5-B six fixed adverse local cohorts',{timeout:150000},async t=>{
  const cap=Object.freeze({calls:65,reads:42,begins:8,terminals:8,attemptedWrites:20,seeds:6,injections:1});
  const counts={calls:0,reads:0,begins:0,terminals:0,attemptedWrites:0,seeds:0,injections:0,successfulWrites:0,verified:0};
  let sdkClient=client();
  function inc(k,n=1){assert.ok(counts[k]+n<=cap[k],'LOCAL_BUDGET_EXCEEDED '+k);counts[k]+=n;}
  function reserve(writes=0){inc('attemptedWrites',writes);inc('calls');}
  async function read(name,expected,tx){inc('reads');reserve();return point(sdkClient,name,expected,tx);}
  async function begin(){inc('begins');reserve();const [result]=await sdkClient.beginTransaction({database,options:{readWrite:{}}},options());assert.ok(result.transaction&&result.transaction.length>0);return result.transaction;}
  async function rollback(tx){inc('terminals');reserve();await sdkClient.rollback({database,transaction:tx},options());}
  async function commit(writes,tx,kind){
    assert.ok(writes.length>0&&writes.length<=3&&writes.every(w=>w.update&&names.has(w.update.name)&&w.currentDocument&&!w.delete&&(w.currentDocument.exists===false||w.currentDocument.updateTime&&w.updateMask)));
    if(kind==='seed'){inc('seeds');assert.ok(!tx&&writes.every(w=>w.currentDocument.exists===false));}
    else if(kind==='inject'){inc('injections');assert.ok(!tx&&writes.length===1&&writes[0].currentDocument.updateTime);}
    else{inc('terminals');assert.ok(tx&&writes.length===2);}
    reserve(writes.length);
    const [result]=await sdkClient.commit({database,writes,...(tx?{transaction:tx}:{})},options());
    assert.equal(result.writeResults.length,writes.length);counts.successfulWrites+=writes.length;
  }
  async function seed(c,collision=false){
    await commit([write(c.authority,authorityFields(c),{exists:false}),write(c.target,targetFields(c),{exists:false}),...(collision?[write(c.receipt,collisionFields(c),{exists:false})]:[])],null,'seed');
  }
  function allowed(a,c,q){
    assert.deepEqual(a.fields,authorityFields(c));
    return q.tenant===a.fields.tenant&&q.actor===a.fields.actor&&q.organisationId===a.fields.organisationId&&q.targetId===a.fields.targetId&&q.action===a.fields.action&&a.fields.active&&a.fields.receiptEligible&&
      (approval(q)===a.fields.approvalHash||c.alternateReceipt&&approval(q)===a.fields.alternateApprovalHash);
  }
  function settledWrites(c,q,target,receipt){
    return [write(c.target,targetFields(c,'settled'),{updateTime:timestamp(target.document)}),write(receipt,receiptFields(q),{exists:false})];
  }
  async function attempt(c,q,{abort=false,suppressAcknowledgment=false}={}){
    const tx=await begin();
    const a=await read(c.authority,authorityFields(c),tx);
    if(!allowed(a,c,q)){await rollback(tx);return {kind:'denied'};}
    const receiptName=key(q)===key(c.command)?c.receipt:c.alternateReceipt;
    assert.ok(receiptName&&names.has(receiptName));
    const target=await read(c.target,targetFields(c),tx);
    const receipt=await read(receiptName,receiptFields(q),tx);
    assert.ok(target.fields);
    if(receipt.fields){
      assert.deepEqual(receipt.fields,receiptFields(q));assert.deepEqual(target.fields,targetFields(c,'settled'));
      await rollback(tx);return {kind:'replay',committedRevision:8};
    }
    if(target.fields.state!=='open'||target.fields.revision!==q.expectedRevision){
      assert.ok(JSON.stringify(target.fields)===JSON.stringify(targetFields(c,'settled'))||JSON.stringify(target.fields)===JSON.stringify(targetFields(c,'changed')));
      await rollback(tx);return {kind:'target-conflict'};
    }
    assert.deepEqual(target.fields,targetFields(c));
    if(abort){await rollback(tx);return {kind:'rolled-back'};}
    await commit(settledWrites(c,q,target,receiptName),tx,'transaction');
    // Deliberately suppress a KNOWN successful acknowledgment at the fixture boundary.
    // Not an injected network failure; never replay a mutation to reconcile.
    if(suppressAcknowledgment)return {kind:'simulated-indeterminate'};
    return {kind:'committed',committedRevision:8};
  }
  async function verify(c,state,receiptExpected,alternate=false,before=null){
    assert.deepEqual((await read(c.authority,authorityFields(c))).fields,authorityFields(c));
    const target=await read(c.target,targetFields(c,state));
    const receipt=await read(c.receipt,receiptFields(c.command));
    assert.deepEqual(target.fields,targetFields(c,state));assert.deepEqual(receipt.fields,receiptExpected);
    if(alternate)assert.equal((await read(c.alternateReceipt,receiptFields(c.alternate))).fields,null);
    if(before){assert.deepEqual(timestamp(target.document),before.target);assert.deepEqual(timestamp(receipt.document),before.receipt);}
    counts.verified++;
  }
  try{
    // B01: independently approved second operation ID cannot settle an already settled target.
    const [b1,b2,b3,b4,b5,b6]=cohorts;
    await seed(b1);
    assert.deepEqual(await attempt(b1,b1.command),{kind:'committed',committedRevision:8});
    assert.deepEqual(await attempt(b1,b1.alternate),{kind:'target-conflict'});
    await verify(b1,'settled',receiptFields(b1.command),true);
    // B02: exact target updateTime injection before transaction creates a newer target revision.
    await seed(b2);
    const original=await read(b2.target,targetFields(b2));assert.deepEqual(original.fields,targetFields(b2));
    await commit([write(b2.target,targetFields(b2,'changed'),{updateTime:timestamp(original.document)})],null,'inject');
    assert.deepEqual(await attempt(b2,b2.command),{kind:'target-conflict'});
    await verify(b2,'changed',null);
    // B03: wrong-tenant command denied before target/receipt reads; owner fixture stays unchanged.
    await seed(b3);
    const wrong=Object.freeze({...b3.command,tenant:'fixture-tenant-b'});
    assert.deepEqual(await attempt(b3,wrong),{kind:'denied'});
    await verify(b3,'open',null);
    // B04: explicitly injected backend write-precondition failure, not a normal application path.
    // Read all three points, then issue an intentionally conflicting create-only receipt.
    await seed(b4,true);
    const tx=await begin();
    const auth=await read(b4.authority,authorityFields(b4),tx);
    assert.ok(allowed(auth,b4,b4.command));
    const target=await read(b4.target,targetFields(b4),tx),receipt=await read(b4.receipt,collisionFields(b4),tx);
    assert.deepEqual(target.fields,targetFields(b4));assert.deepEqual(receipt.fields,collisionFields(b4));
    await assert.rejects(commit(settledWrites(b4,b4.command,target,b4.receipt),tx,'transaction'),err=>err?.code===grpc.status.ALREADY_EXISTS||err?.code===grpc.status.FAILED_PRECONDITION);
    await verify(b4,'open',collisionFields(b4),false,{target:timestamp(target.document),receipt:timestamp(receipt.document)});
    // B05: known commit response hidden by harness, new SDK client, authorized receipt reconciliation.
    await seed(b5);
    assert.deepEqual(await attempt(b5,b5.command,{suppressAcknowledgment:true}),{kind:'simulated-indeterminate'});
    await sdkClient.close();sdkClient=client();
    // The fresh attempt has a strict reconciliation-only branch: no mutation if receipt absent.
    const reconcile=await begin();
    const current=await read(b5.authority,authorityFields(b5),reconcile);
    assert.ok(allowed(current,b5,b5.command));
    assert.deepEqual((await read(b5.target,targetFields(b5,'settled'),reconcile)).fields,targetFields(b5,'settled'));
    assert.deepEqual((await read(b5.receipt,receiptFields(b5.command),reconcile)).fields,receiptFields(b5.command));
    await rollback(reconcile);
    await verify(b5,'settled',receiptFields(b5.command));
    // B06: explicit rollback after valid reads; no commit dispatched.
    await seed(b6);
    assert.deepEqual(await attempt(b6,b6.command,{abort:true}),{kind:'rolled-back'});
    await verify(b6,'open',null);
    assert.deepEqual(counts,{...cap,successfulWrites:18,verified:6});
    t.diagnostic('R5-B_LOCAL_PASS cohorts=6 transactions=8 logicalRPCs=65 pointReads=42 attemptedWrites=20 successfulWrites=18 deleteCalls=0 productionOperations=0');
  }finally{await sdkClient.close();}
});
