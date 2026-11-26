// Fixed receipt recovery local transaction probe. No application imports, production SDK
// initialization, real identity, document deletion, query or caller-supplied targets.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
// Focused transport-status correction awaiting independent review; do not execute.
throw Error('R5D_STATUS_CORRECTION_REVIEW_HOLD');
const project='demo-tsos-r5d-transaction',host='127.0.0.1',port=8792;
const database='projects/'+project+'/databases/(default)',parent=database+'/documents/';
assert.equal(process.env.TSOS_R5D_EMULATOR_ONLY,'1');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,host+':'+port);
assert.equal(process.env.GCLOUD_PROJECT,project);
assert.equal(process.version,'v22.22.1');
const allowed=new Set(['PATH','HOME','TMPDIR','TZ','TSOS_R5D_EMULATOR_ONLY','TSOS_R5D_PHASE','FIRESTORE_EMULATOR_HOST','GCLOUD_PROJECT']);
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
const options=()=>({timeout:5000,retry:null,retryRequestOptions:{retries:0,noResponseRetries:0,shouldRetryFn:()=>false}});
const hash=x=>createHash('sha256').update(JSON.stringify(x),'utf8').digest('hex');
const phase=process.env.TSOS_R5D_PHASE;
assert.ok(phase==='prepare'||phase==='recover','FIXED_PHASE_REQUIRED');
const tenant='fixture-tenant-a',actor='fixture-person-a',action='finance.post',at=1500;
const semantic=q=>hash(['TSOS:R5:COMMAND:1',q.tenant,q.actor,q.organisationId,q.action,q.targetId,q.expectedRevision,q.amountMinor,q.currency]);
const key=q=>hash(['TSOS:R5:RECEIPT:1',q.tenant,q.actor,q.action,q.operationId]);
const approval=q=>hash(['TSOS:R5D:APPROVAL:1',key(q),semantic(q),1,4,at]);
function cohort(id,changed=false){
  const command=Object.freeze({tenant,actor,organisationId:'fixture-org-a',action,targetId:id,operationId:id+'-operation',expectedRevision:7,amountMinor:12345,currency:'INR'});
  const recovery=changed?Object.freeze({...command,amountMinor:12346}):command;
  return Object.freeze({command,recovery,changed,authority:parent+'tsosR5DFixtureAuthority/'+id,target:parent+'tsosR5DFixtureTargets/'+id,receipt:parent+'tsosR5DFixtureReceipts/'+key(command)});
}
const cohorts=[cohort('fixture-r5d01'),cohort('fixture-r5d02'),cohort('fixture-r5d03'),cohort('fixture-r5d04',true)];
const names=new Set(cohorts.flatMap(c=>[c.authority,c.target,c.receipt]));
assert.equal(names.size,12);
const authorityFields=(c,revoked=false)=>({tenant,actor,organisationId:c.command.organisationId,action,targetId:c.command.targetId,active:!revoked,receiptEligible:!revoked,generation:revoked?2:1,epoch:4,phase:'successor',observedAt:at,start:1000,end:2000,approvalHash:approval(c.command),...(c.changed?{alternateApprovalHash:approval(c.recovery)}:{})});
const targetFields=(c,settled=false)=>({tenant,organisationId:c.command.organisationId,targetId:c.command.targetId,revision:settled?8:7,outstandingMinor:settled?0:12345,currency:'INR',state:settled?'settled':'open'});
const receiptFields=q=>({key:key(q),semanticHash:semantic(q),committedRevision:8});
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


const prepareCap=Object.freeze({calls:24,reads:12,begins:4,terminals:3,attemptedWrites:15,seeds:4,revocations:1,relayCalls:2,relayForwards:1,successfulWrites:15});
const recoverCap=Object.freeze({calls:30,reads:22,begins:4,terminals:4,attemptedWrites:0,seeds:0,revocations:0,relayCalls:0,relayForwards:0,successfulWrites:0});
test('R5-D fixed receipt recovery phase '+phase,{timeout:150000},async t=>{
  const cap=phase==='prepare'?prepareCap:recoverCap;
  const counts=Object.fromEntries(Object.keys(cap).map(k=>[k,0]));
  const backend=client();
  function inc(k,n=1){assert.ok(counts[k]+n<=cap[k],'LOCAL_BUDGET_EXCEEDED '+k);counts[k]+=n;}
  function reserve(writes=0){inc('attemptedWrites',writes);inc('calls');}
  async function read(name,expected,tx){inc('reads');reserve();return point(backend,name,expected,tx);}
  async function begin(){
    inc('begins');reserve();
    const [r]=await backend.beginTransaction({database,options:{readWrite:{}}},options());
    assert.ok(r.transaction&&r.transaction.length>0);return r.transaction;
  }
  async function rollback(tx){inc('terminals');reserve();await backend.rollback({database,transaction:tx},options());}
  async function commit(writes,tx,kind){
    assert.equal(phase,'prepare');
    assert.ok(writes.length>0&&writes.length<=2&&writes.every(w=>w.update&&names.has(w.update.name)&&w.currentDocument&&!w.delete&&(w.currentDocument.exists===false||w.currentDocument.updateTime&&w.updateMask)));
    if(kind==='seed'){inc('seeds');assert.ok(!tx&&writes.length===2&&writes.every(w=>w.currentDocument.exists===false));}
    else if(kind==='revoke'){inc('revocations');assert.ok(!tx&&writes.length===1&&writes[0].currentDocument.updateTime);}
    else{assert.equal(kind,'transaction');inc('terminals');assert.ok(tx&&writes.length===2);}
    reserve(writes.length);
    const [r]=await backend.commit({database,writes,...(tx?{transaction:tx}:{})},options());
    assert.equal(r.writeResults.length,writes.length);inc('successfulWrites',writes.length);
  }
  async function seed(c){await commit([write(c.authority,authorityFields(c),{exists:false}),write(c.target,targetFields(c),{exists:false})],null,'seed');}
  function allowed(a,c,q){
    assert.ok(a.fields);
    if(JSON.stringify(a.fields)===JSON.stringify(authorityFields(c,true)))return false;
    assert.deepEqual(a.fields,authorityFields(c));
    assert.ok(q===c.command||q===c.recovery);
    return q.tenant===a.fields.tenant&&q.actor===a.fields.actor&&q.organisationId===a.fields.organisationId&&q.targetId===a.fields.targetId&&q.action===a.fields.action&&a.fields.active&&a.fields.receiptEligible&&
      (approval(q)===a.fields.approvalHash||c.changed&&approval(q)===a.fields.alternateApprovalHash);
  }
  async function prepare(c){
    const tx=await begin(),a=await read(c.authority,authorityFields(c),tx);
    assert.ok(allowed(a,c,c.command));
    const target=await read(c.target,targetFields(c),tx);
    assert.deepEqual(target.fields,targetFields(c));
    assert.equal((await read(c.receipt,receiptFields(c.command),tx)).fields,null);
    return {tx,a,writes:[write(c.target,targetFields(c,true),{updateTime:timestamp(target.document)}),write(c.receipt,receiptFields(c.command),{exists:false})]};
  }
  // A single-method, one-shot fault service. Raw caller bytes are never forwarded.
  // The upstream request is the closed-over, locally validated fixture write set.
  // Cut the downstream RPC by shutting the service before any response is sent.
  async function loseResponse(prepared,forward){
    let requests=0,handlerError=null,clientError=null,handlerDone,shutdownRequested=false,handlerCompleted=false;
    const finished=new Promise(resolve=>{handlerDone=resolve;});
    const server=new grpc.Server({'grpc.max_receive_message_length':65536});
    const descriptor={commit:{path:'/google.firestore.v1.Firestore/Commit',requestStream:false,responseStream:false,requestDeserialize:b=>b,responseSerialize:()=>Buffer.alloc(0),requestSerialize:b=>b,responseDeserialize:b=>b,originalName:'commit'}};
    server.addService(descriptor,{commit:(_call,_cb)=>{
      requests++;
      if(requests!==1){handlerError=Error('RELAY_REPEAT');server.forceShutdown();handlerDone();return;}
      // Never use downstream payload, metadata, destination or caller credentials.
      void (async()=>{
        try{inc('relayCalls');if(forward){inc('relayForwards');await commit(prepared.writes,prepared.tx,'transaction');}}
        catch(err){handlerError=err;}
        finally{
          shutdownRequested=true;
          try{server.forceShutdown();handlerCompleted=true;}catch(err){handlerError=handlerError??err;}
          finally{handlerDone();}
        }
      })();
    }});
    let downstream;
    try{
      const relayPort=await new Promise((resolve,reject)=>server.bindAsync(host+':0',grpc.ServerCredentials.createInsecure(),(err,p)=>err?reject(err):resolve(p)));
      assert.ok(relayPort!==port&&relayPort>0);
      downstream=client(relayPort);
      try{await downstream.commit({database,writes:prepared.writes,transaction:prepared.tx},options());}
      catch(err){clientError=err;}
      // A caller-visible error is not evidence that the backend did not commit.
      // grpc-js 1.14.1 forceShutdown destroys sessions with NGHTTP2_CANCEL;
      // subchannel-call maps it to CANCELLED / Call cancelled, or UNAVAILABLE /
      // Connection dropped. Match only these documented fault-specific pairs.
      assert.ok(clientError,'UNEXPECTED_DOWNSTREAM_SUCCESS');
      assert.equal(requests,1,'EXPECTED_ONE_FAULT_HANDLER');
      await finished;
      if(handlerError)throw handlerError;
      assert.equal(requests,1,'EXPECTED_ONE_FAULT_HANDLER');
      assert.ok(shutdownRequested&&handlerCompleted,'EXPECTED_COMPLETED_INJECTED_SHUTDOWN');
      const cancelled=clientError.code===grpc.status.CANCELLED&&clientError.details==='Call cancelled';
      const unavailable=clientError.code===grpc.status.UNAVAILABLE&&clientError.details==='Connection dropped';
      assert.ok(cancelled||unavailable,'UNEXPECTED_DOWNSTREAM_FAULT_STATUS '+String(clientError.code));
      t.diagnostic('R5-D_FAULT_OBSERVED status='+ (cancelled?'CANCELLED':'UNAVAILABLE')+' handler=completed forward='+Number(forward));
      return {kind:'indeterminate'};
    }finally{server.forceShutdown();if(downstream)await downstream.close();}
  }
  async function recover(c,q){
    assert.equal(phase,'recover');
    const tx=await begin();
    const a=await read(c.authority,authorityFields(c),tx);
    if(!allowed(a,c,q)){await rollback(tx);return {kind:'denied'};}
    assert.equal(key(q),key(c.command)); // exact fixed receipt locator
    const receipt=await read(c.receipt,receiptFields(q),tx);
    const target=await read(c.target,targetFields(c),tx);
    assert.ok(target.fields);
    let result;
    if(!receipt.fields){
      assert.deepEqual(target.fields,targetFields(c));
      result={kind:'indeterminate'}; // absence does not authorize another commit
    }else if(receipt.fields.semanticHash!==semantic(q)){
      assert.deepEqual(receipt.fields,receiptFields(c.command));
      assert.deepEqual(target.fields,targetFields(c,true));
      result={kind:'conflict'};
    }else{
      assert.deepEqual(receipt.fields,receiptFields(q));assert.deepEqual(target.fields,targetFields(c,true));
      result={kind:'committed',committedRevision:receipt.fields.committedRevision};
    }
    await rollback(tx);return result;
  }
  async function verify(c,settled,revoked=false){
    assert.deepEqual((await read(c.authority,authorityFields(c))).fields,authorityFields(c,revoked));
    assert.deepEqual((await read(c.target,targetFields(c))).fields,targetFields(c,settled));
    assert.deepEqual((await read(c.receipt,receiptFields(c.command))).fields,settled?receiptFields(c.command):null);
  }
  try{
    const [d1,d2,d3,d4]=cohorts;
    if(phase==='prepare'){
      await seed(d1);assert.deepEqual(await loseResponse(await prepare(d1),true),{kind:'indeterminate'});
      await seed(d2);assert.deepEqual(await loseResponse(await prepare(d2),false),{kind:'indeterminate'});
      // No rollback of either unknown outcome and no mutation replay. D02's
      // unused transaction may remain open until the disposable backend expires.
      await seed(d3);const third=await prepare(d3);await commit(third.writes,third.tx,'transaction');
      await commit([write(d3.authority,authorityFields(d3,true),{updateTime:timestamp(third.a.document)})],null,'revoke');
      await seed(d4);const fourth=await prepare(d4);await commit(fourth.writes,fourth.tx,'transaction');
    }else{
      // Fresh OS process: no retained prior client, transaction handle or response.
      assert.deepEqual(await recover(d1,d1.recovery),{kind:'committed',committedRevision:8});
      assert.deepEqual(await recover(d2,d2.recovery),{kind:'indeterminate'});
      assert.deepEqual(await recover(d3,d3.recovery),{kind:'denied'});
      assert.deepEqual(await recover(d4,d4.recovery),{kind:'conflict'});
      await verify(d1,true);await verify(d2,false);await verify(d3,true,true);await verify(d4,true);
    }
    assert.deepEqual(counts,cap);
    t.diagnostic('R5-D_'+phase.toUpperCase()+'_PASS '+Object.entries(counts).map(([k,v])=>k+'='+v).join(' ')+' deleteCalls=0 productionOperations=0');
  }finally{await backend.close();}
});
