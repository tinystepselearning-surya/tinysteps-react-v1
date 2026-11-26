// Fixed concurrent synthetic transaction probe. No application imports, production SDK
// initialization, real identity, document deletion, query or caller-supplied targets.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
// Independent review and prerequisite R5-B PASS required; do not bypass.
throw Error('R5C_EXECUTION_REVIEW_HOLD');
const project='demo-tsos-r5c-transaction',host='127.0.0.1',port=8791;
const database='projects/'+project+'/databases/(default)',parent=database+'/documents/';
assert.equal(process.env.TSOS_R5C_EMULATOR_ONLY,'1');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,host+':'+port);
assert.equal(process.env.GCLOUD_PROJECT,project);
assert.equal(process.version,'v22.22.1');
const allowed=new Set(['PATH','HOME','TMPDIR','TZ','TSOS_R5C_EMULATOR_ONLY','FIRESTORE_EMULATOR_HOST','GCLOUD_PROJECT']);
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
const approval=q=>hash(['TSOS:R5C:APPROVAL:1',key(q),semantic(q),1,4,at]);
function cohort(id,distinct=false){
  const command=Object.freeze({tenant,actor,organisationId:'fixture-org-a',action,targetId:id,operationId:id+'-operation',expectedRevision:7,amountMinor:12345,currency:'INR'});
  const alternate=distinct?Object.freeze({...command,operationId:id+'-alternate'}):command;
  const receipt=q=>parent+'tsosR5CFixtureReceipts/'+key(q);
  return Object.freeze({command,alternate,distinct,authority:parent+'tsosR5CFixtureAuthority/'+id,target:parent+'tsosR5CFixtureTargets/'+id,receipt:receipt(command),alternateReceipt:receipt(alternate)});
}
const cohorts=[cohort('fixture-r5c01'),cohort('fixture-r5c02',true),cohort('fixture-r5c03'),cohort('fixture-r5c04')];
const names=new Set(cohorts.flatMap(c=>[c.authority,c.target,c.receipt,c.alternateReceipt]));
assert.equal(names.size,13);
const authorityFields=(c,revoked=false)=>({tenant,actor,organisationId:c.command.organisationId,action,targetId:c.command.targetId,active:!revoked,receiptEligible:!revoked,generation:revoked?2:1,epoch:4,phase:'successor',observedAt:at,start:1000,end:2000,approvalHash:approval(c.command),...(c.distinct?{alternateApprovalHash:approval(c.alternate)}:{})});
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
    const finish=(err,value)=>{if(done)return;done=true;clearTimeout(timer);err?reject(err instanceof Error?err:Error(err)):resolve(value);};
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
      stream.on('error',err=>finish(Object.assign(Error('POINT_RPC_FAILED'),{code:err?.code})));
      stream.on('end',()=>frame?finish(null,frame):finish('MISSING_POINT_RESPONSE'));
      stream.on('close',()=>finish('POINT_STREAM_CLOSED'));
      timer=setTimeout(()=>fail('POINT_TIMEOUT'),5000);
    }catch{fail('POINT_OPEN_FAILED');}
  });
}


function nanos(t){
  assert.ok(t&&Object.hasOwn(t,'seconds')&&Object.hasOwn(t,'nanos'));
  assert.match(String(t.seconds),/^-?\d+$/);
  assert.ok(Number.isInteger(t.nanos)&&t.nanos>=0&&t.nanos<1000000000);
  return BigInt(String(t.seconds))*1000000000n+BigInt(t.nanos);
}
function isAborted(err){return err?.code===grpc.status.ABORTED;}
test('R5-C four bounded overlapping transaction cohorts',{timeout:150000},async t=>{
  const cap=Object.freeze({calls:53,reads:33,begins:7,terminals:7,attemptedWrites:22,seeds:4,revocations:2});
  const counts={calls:0,reads:0,begins:0,terminals:0,attemptedWrites:0,seeds:0,revocations:0,successfulWrites:0,verified:0};
  const clients=[client(),client(),client()];
  const [left,right,operator]=clients;
  const txs=new Set();
  function inc(k,n=1){assert.ok(counts[k]+n<=cap[k],'LOCAL_BUDGET_EXCEEDED '+k);counts[k]+=n;}
  function reserve(writes=0){inc('attemptedWrites',writes);inc('calls');}
  async function read(s,name,expected,tx){inc('reads');reserve();return point(s,name,expected,tx);}
  async function begin(s){
    inc('begins');reserve();
    const [result]=await s.beginTransaction({database,options:{readWrite:{}}},options());
    assert.ok(result.transaction&&result.transaction.length>0);
    const id=Buffer.from(result.transaction).toString('hex');
    assert.ok(!txs.has(id),'TRANSACTION_ID_REUSED');txs.add(id);
    return result.transaction;
  }
  async function rollback(s,tx){inc('terminals');reserve();await s.rollback({database,transaction:tx},options());}
  async function commit(s,writes,tx,kind){
    assert.ok(writes.length>0&&writes.length<=2&&writes.every(w=>w.update&&names.has(w.update.name)&&w.currentDocument&&!w.delete&&(w.currentDocument.exists===false||w.currentDocument.updateTime&&w.updateMask)));
    if(kind==='seed'){inc('seeds');assert.ok(!tx&&writes.length===2&&writes.every(w=>w.currentDocument.exists===false));}
    else if(kind==='revoke'){inc('revocations');assert.ok(!tx&&writes.length===1&&writes[0].currentDocument.updateTime);}
    else{assert.equal(kind,'transaction');inc('terminals');assert.ok(tx&&writes.length===2);}
    reserve(writes.length);
    const [result]=await s.commit({database,writes,...(tx?{transaction:tx}:{})},options());
    assert.equal(result.writeResults.length,writes.length);counts.successfulWrites+=writes.length;
    return nanos(result.commitTime);
  }
  async function seed(c){await commit(operator,[write(c.authority,authorityFields(c),{exists:false}),write(c.target,targetFields(c),{exists:false})],null,'seed');}
  async function revoke(c,a){assert.deepEqual(a.fields,authorityFields(c));return commit(operator,[write(c.authority,authorityFields(c,true),{updateTime:timestamp(a.document)})],null,'revoke');}
  function allowed(a,c,q){
    assert.ok(a.fields);
    if(JSON.stringify(a.fields)===JSON.stringify(authorityFields(c,true)))return false;
    assert.deepEqual(a.fields,authorityFields(c));
    return q.tenant===a.fields.tenant&&q.actor===a.fields.actor&&q.organisationId===a.fields.organisationId&&q.targetId===a.fields.targetId&&q.action===a.fields.action&&a.fields.active&&a.fields.receiptEligible&&
      (approval(q)===a.fields.approvalHash||c.distinct&&approval(q)===a.fields.alternateApprovalHash);
  }
  function receiptName(c,q){assert.ok(q===c.command||q===c.alternate);return q===c.command?c.receipt:c.alternateReceipt;}
  function settledWrites(c,q,target){return [write(c.target,targetFields(c,true),{updateTime:timestamp(target.document)}),write(receiptName(c,q),receiptFields(q),{exists:false})];}
  async function prepare(s,c,q,tx){
    const a=await read(s,c.authority,authorityFields(c),tx);
    if(!allowed(a,c,q))return {kind:'denied'};
    const target=await read(s,c.target,targetFields(c),tx);
    const receipt=await read(s,receiptName(c,q),receiptFields(q),tx);
    assert.ok(target.fields);
    if(receipt.fields){
      assert.deepEqual(receipt.fields,receiptFields(q));assert.deepEqual(target.fields,targetFields(c,true));
      return {kind:'replay'};
    }
    if(target.fields.state==='settled'){assert.deepEqual(target.fields,targetFields(c,true));return {kind:'target-conflict'};}
    assert.deepEqual(target.fields,targetFields(c));
    return {kind:'prepared',a,target};
  }
  async function attempt(s,c,q,tx){
    try{
      const prepared=await prepare(s,c,q,tx);
      if(prepared.kind!=='prepared'){await rollback(s,tx);return {kind:prepared.kind};}
      return {kind:'committed',time:await commit(s,settledWrites(c,q,prepared.target),tx,'transaction')};
    }catch(err){if(isAborted(err))return {kind:'aborted'};throw err;}
  }
  async function all(promises){
    const results=await Promise.allSettled(promises);
    const failures=results.filter(r=>r.status==='rejected');
    if(failures.length)throw new AggregateError(failures.map(r=>r.reason),'R5C_UNEXPECTED_PEER_FAILURE');
    return results.map(r=>r.value);
  }
  async function verify(c,{winner=null,revoked=false,unchangedTargetTime=null}={}){
    assert.deepEqual((await read(operator,c.authority,authorityFields(c,revoked))).fields,authorityFields(c,revoked));
    const target=await read(operator,c.target,targetFields(c,!!winner));
    assert.deepEqual(target.fields,targetFields(c,!!winner));
    if(unchangedTargetTime)assert.deepEqual(timestamp(target.document),unchangedTargetTime);
    assert.deepEqual((await read(operator,c.receipt,receiptFields(c.command))).fields,winner===c.command?receiptFields(c.command):null);
    if(c.distinct)assert.deepEqual((await read(operator,c.alternateReceipt,receiptFields(c.alternate))).fields,winner===c.alternate?receiptFields(c.alternate):null);
    counts.verified++;
  }
  async function race(c){
    await seed(c);
    // Both backend transactions are open before either contender starts reading.
    // No barrier after acquiring locks; both attempts progress independently.
    const [one,two]=await all([begin(left),begin(right)]);
    const outcomes=await all([attempt(left,c,c.command,one),attempt(right,c,c.alternate,two)]);
    const winners=outcomes.map((r,i)=>r.kind==='committed'?i:-1).filter(i=>i!==-1);
    assert.equal(winners.length,1,'EXACTLY_ONE_ACKNOWLEDGED_COMMIT_REQUIRED');
    const winner=winners[0],loser=outcomes[1-winner].kind;
    assert.ok(loser==='aborted'||loser===(c.distinct?'target-conflict':'replay'),'UNEXPECTED_LOSER');
    await verify(c,{winner:winner===0?c.command:c.alternate});
    t.diagnostic((c.distinct?'C02 distinct-key':'C01 same-key')+' race PASS; loser='+loser);
  }
  try{
    const [c1,c2,c3,c4]=cohorts;
    await race(c1);await race(c2);
    // C03: revoke is acknowledged AFTER transaction begin but BEFORE first authority read.
    await seed(c3);
    const a3=await read(operator,c3.authority,authorityFields(c3));
    const tx3=await begin(left);
    await revoke(c3,a3);
    const r3=await attempt(left,c3,c3.command,tx3);
    assert.ok(r3.kind==='denied'||r3.kind==='aborted','STALE_COMMAND_AFTER_CONFIRMED_REVOCATION');
    await verify(c3,{revoked:true});
    t.diagnostic('C03 revoke-before-authority-read PASS; outcome='+r3.kind);
    // C04: positive transaction read set exists before revocation request. Dispatch
    // revocation and command commit without waiting for one while holding the other.
    await seed(c4);
    const tx4=await begin(left),prepared=await prepare(left,c4,c4.command,tx4);
    assert.equal(prepared.kind,'prepared');
    const commandCommit=async()=>{
      try{return {kind:'committed',time:await commit(left,settledWrites(c4,c4.command,prepared.target),tx4,'transaction')};}
      catch(err){if(isAborted(err))return {kind:'aborted'};throw err;}
    };
    const [revokeTime,r4]=await all([revoke(c4,prepared.a),commandCommit()]);
    assert.ok(r4.kind==='aborted'||r4.kind==='committed');
    if(r4.kind==='committed')assert.ok(r4.time<revokeTime,'STALE_OR_UNORDERED_COMMIT_AFTER_REVOCATION');
    // A later fresh transaction must deny, including if an earlier receipt exists.
    const later=await begin(right);
    assert.deepEqual(await attempt(right,c4,c4.command,later),{kind:'denied'});
    await verify(c4,{winner:r4.kind==='committed'?c4.command:null,revoked:true,unchangedTargetTime:r4.kind==='aborted'?timestamp(prepared.target.document):null});
    t.diagnostic('C04 overlapping revoke PASS; order='+ (r4.kind==='committed'?'settlement-before-revoke':'command-aborted'));
    assert.equal(counts.verified,4);assert.equal(counts.seeds,4);assert.equal(counts.revocations,2);assert.equal(counts.begins,7);
    assert.equal(counts.successfulWrites,r4.kind==='committed'?16:14);
    assert.equal(counts.calls,counts.reads+counts.begins+counts.terminals+counts.seeds+counts.revocations);
    t.diagnostic('R5-C_LOCAL_PASS cohorts=4 begins='+counts.begins+' logicalRPCs='+counts.calls+' pointReads='+counts.reads+' attemptedWrites='+counts.attemptedWrites+' successfulWrites='+counts.successfulWrites+' deleteCalls=0 productionOperations=0');
  }finally{const results=await Promise.allSettled(clients.map(s=>s.close()));assert.ok(results.every(r=>r.status==='fulfilled'),'SDK_CLOSE_FAILED');}
});
