// Dormant, emulator-only transaction port. No public server endpoint or ambient credentials.
// Only the fixed synthetic worker can supply the private client and path inventory.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {timestampParts} from './timestamp-boundary-candidate.mjs';
const require=createRequire(new URL('../../../functions/package.json',import.meta.url));
const {Timestamp,FieldValue}=require('firebase-admin/firestore');
export const PROJECT='demo-tsos-gate-b-authority';
export const HOST='127.0.0.1';
export const PORT=8793;
const database='projects/'+PROJECT+'/databases/(default)',parent=database+'/documents/';
const opts=()=>({timeout:5000,retry:null,retryRequestOptions:{retries:0,noResponseRetries:0,shouldRetryFn:()=>false}});
const positive=n=>Number.isSafeInteger(n)&&n>0;
function time(t){
 assert.ok(t&&typeof t==='object'&&Object.hasOwn(t,'seconds')&&Object.hasOwn(t,'nanos'));
 assert.match(String(t.seconds),/^-?(0|[1-9]\d*)$/);
 const s=Number(t.seconds);assert.ok(Number.isSafeInteger(s)&&Number.isInteger(t.nanos));
 const v=new Timestamp(s,t.nanos);timestampParts(v);return v;
}
export function wireNanos(t){const v=time(t);return BigInt(v.seconds)*1000000000n+BigInt(v.nanoseconds)}
function encode(v){
 if(v===null)return {nullValue:'NULL_VALUE'};
 if(typeof v==='string')return {stringValue:v};
 if(typeof v==='boolean')return {booleanValue:v};
 if(Number.isSafeInteger(v))return {integerValue:String(v)};
 const t=timestampParts(v);return {timestampValue:{seconds:String(t.seconds),nanos:t.nanoseconds}};
}
function decode(v){
 assert.ok(v&&typeof v==='object');
 const tags=Object.keys(v).filter(k=>k!=='valueType');
 assert.equal(tags.length,1,'INVALID_WIRE_VALUE');
 const k=tags[0],x=v[k];if(Object.hasOwn(v,'valueType'))assert.equal(v.valueType,k);
 switch(k){
  case 'stringValue':assert.equal(typeof x,'string');return x;
  case 'booleanValue':assert.equal(typeof x,'boolean');return x;
  case 'integerValue':assert.match(String(x),/^-?(0|[1-9]\d*)$/);assert.ok(Number.isSafeInteger(Number(x)));return Number(x);
  case 'nullValue':assert.ok(x===0||x==='NULL_VALUE');return null;
  case 'timestampValue':return time(x);
  default:throw Error('UNSUPPORTED_WIRE_VALUE');
 }
}
function documentFields(doc){assert.ok(doc?.fields);return Object.fromEntries(Object.entries(doc.fields).map(([k,v])=>[k,decode(v)]))}
function point(client,name,transaction){
 return new Promise((resolve,reject)=>{
  let stream,timer,done=false,frame;
  const finish=(err,value)=>{if(done)return;done=true;clearTimeout(timer);err?reject(err instanceof Error?err:Error(err)):resolve(value)};
  const fail=code=>{finish(code);try{stream?.cancel()}catch{}};
  try{
   stream=client.batchGetDocuments({database,documents:[name],...(transaction?{transaction}:{})},opts());
   stream.on('data',row=>{
    if(done)return;
    try{
     assert.equal(frame,undefined);
     const found=row.found,missing=row.missing;
     assert.ok((found&&found.name===name&&!missing)||(!found&&missing===name));
     if(found)wireNanos(found.updateTime);
     frame=found?{data:documentFields(found),updateTime:found.updateTime}:{data:null,updateTime:null};
    }catch{fail('UNEXPECTED_POINT_RESPONSE')}
   });
   stream.on('error',e=>finish(Object.assign(Error('POINT_RPC_FAILED'),{code:e?.code})));
   stream.on('end',()=>frame?finish(null,frame):finish('MISSING_POINT_RESPONSE'));
   stream.on('close',()=>finish('POINT_STREAM_CLOSED'));
   timer=setTimeout(()=>fail('POINT_TIMEOUT'),5000);
  }catch{fail('POINT_OPEN_FAILED')}
 });
}
function write(name,data,prior){
 assert.ok(data&&Object.getPrototypeOf(data)===Object.prototype);
 const fields={},updateTransforms=[];
 for(const [key,value] of Object.entries(data)){
  assert.match(key,/^[A-Za-z][A-Za-z0-9]*$/);
  if(value instanceof FieldValue){
   assert.ok(['createdAt','updatedAt'].includes(key)&&value.isEqual(FieldValue.serverTimestamp()),'INVALID_TRANSFORM');
   updateTransforms.push({fieldPath:key,setToServerValue:'REQUEST_TIME'});
  }else fields[key]=encode(value);
 }
 return {update:{name,fields},currentDocument:prior?{updateTime:prior}:{exists:false},...(prior?{updateMask:{fieldPaths:Object.keys(fields)}}:{}),...(updateTransforms.length?{updateTransforms}:{})};
}
export function createEmulatorPort({client,allowedPaths,budget,ledger,seenTransactions}){
 assert.equal(process.env.TSOS_GATE_B_EMULATOR_ONLY,'1');
 assert.equal(process.env.GCLOUD_PROJECT,PROJECT);
 assert.equal(process.env.FIRESTORE_EMULATOR_HOST,HOST+':'+PORT);
 assert.ok(allowedPaths instanceof Set&&allowedPaths.size>0&&allowedPaths.size<=40);
 const allowed=new Set(allowedPaths);
 function name(path){assert.ok(allowed.has(path)&&path.split('/').length===2,'FIXTURE_PATH_REQUIRED');return parent+path}
 function inc(k,n=1){assert.ok(Number.isSafeInteger(budget[k])&&ledger[k]+n<=budget[k],'FIXTURE_BUDGET_'+k);ledger[k]+=n}
 function rpc(){inc('calls')}
 async function read(path,tx){const n=name(path);inc('reads');rpc();return point(client,n,tx)}
 async function commit(writes,tx){
  assert.ok(writes.length>0&&writes.length<=20);
  inc('attemptedWrites',writes.length);rpc();
  const [r]=await client.commit({database,writes,...(tx?{transaction:tx}:{})},opts());
  assert.equal(r.writeResults.length,writes.length);const ns=wireNanos(r.commitTime);
  inc('successfulWrites',writes.length);return ns;
 }
 async function rollback(tx){inc('terminals');rpc();await client.rollback({database,transaction:tx},opts())}
 async function runOnce(fn,beforeReads){
  inc('begins');rpc();
  const [r]=await client.beginTransaction({database,options:{readWrite:{}}},opts());
  assert.ok(r.transaction?.length>0);const tx=r.transaction,id=Buffer.from(tx).toString('hex');
  assert.ok(!seenTransactions.has(id),'REUSED_TRANSACTION');seenTransactions.add(id);
  const reads=new Map(),writes=[],stagedPaths=new Set();let active=true,terminal=false;
  const stage=(kind,path,data)=>{
   assert.ok(active&&reads.has(path)&&!stagedPaths.has(path)&&writes.length<2);
   const prior=reads.get(path);
   if(kind==='create'){
    assert.ok(prior.data===null&&/^(tsosV2Campuses|tsosV2OperationReceipts)\//.test(path));
   }else{
    assert.ok(prior.data!==null&&/^(tsosV2AuthorityGrants|tsosV2AuthorityFences)\//.test(path));
    const keys=Object.keys(data).sort();
    if(path.startsWith('tsosV2AuthorityGrants/')){
     assert.deepEqual(keys,['revision','status','updatedAt','updatedBy']);assert.equal(prior.data.status,'active');assert.equal(data.status,'revoked');assert.ok(positive(data.revision)&&data.revision===prior.data.revision+1);
    }else{assert.deepEqual(keys,['generation','updatedAt','updatedBy']);assert.ok(positive(data.generation)&&data.generation===prior.data.generation+1)}
   }
   stagedPaths.add(path);writes.push({kind,path,wire:write(name(path),data,prior.updateTime)});
  };
  try{
   if(beforeReads)await beforeReads(); // private fixture barrier, before any transaction reads
   const value=await fn(Object.freeze({get:async path=>{
    assert.ok(active&&writes.length===0&&!reads.has(path)&&reads.size<12);
    const row=await read(path,tx);reads.set(path,row);return row.data;
   },create:(p,d)=>stage('create',p,d),update:(p,d)=>stage('update',p,d)}));
   active=false;
   if(!writes.length){terminal=true;await rollback(tx);return value}
   assert.equal(writes.length,2);
   assert.ok(writes.every(w=>w.kind===writes[0].kind));
   const roots=writes.map(w=>w.path.split('/')[0]).sort();
   assert.deepEqual(roots,writes[0].kind==='create'?['tsosV2Campuses','tsosV2OperationReceipts']:['tsosV2AuthorityFences','tsosV2AuthorityGrants']);
   assert.equal(value.status,writes[0].kind==='create'?'committed':'revoked');
   inc('terminals');terminal=true;
   const time=await commit(writes.map(w=>w.wire),tx);
   ledger.commits.push({kind:writes[0].kind,paths:writes.map(w=>w.path),time});
   return value;
  }catch(e){
   active=false;
   // Never replay or roll back a dispatched commit with unknown outcome.
   if(!terminal){try{await rollback(tx)}catch(rollbackError){ledger.errors.push({phase:'rollback',code:rollbackError?.code??null});throw rollbackError}}
   if(terminal||e?.constructor?.name!=='Rejected'||e.message!=='DENIED')ledger.errors.push({phase:terminal?'terminal':'callback',code:e?.code??null});
   throw e;
  }
 }
 // Fixed fixture seeds and final observations are not consumer methods.
 return Object.freeze({runOnce,seed:async entries=>{
  assert.equal(entries.length,20);assert.equal(new Set(entries.map(([p])=>p)).size,20);
  assert.ok(entries.every(([p])=>!/^tsosV2(Campuses|OperationReceipts)\//.test(p)));
  inc('seeds');return commit(entries.map(([p,d])=>write(name(p),d,null)),null);
 },observe:async path=>(await read(path)).data});
}
