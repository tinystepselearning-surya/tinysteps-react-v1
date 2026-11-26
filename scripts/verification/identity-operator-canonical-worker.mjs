// R2.2D offline worker, derived from pinned R1C loopback fixture (not a live operator).
// This file is a fixed child, never accepts an endpoint or arbitrary executable.
import {createSyntheticRequestLane} from './identity-transport-request-lane.mjs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync,copyFileSync,lstatSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {exerciseSyntheticTransport} from './identity-transport-orchestration.mjs';
import {FIELD_MASKS} from './identity-verification-safety-core.mjs';

// Validate the sanitized process before loading third-party SDK modules.
// Node's isolated test worker adds NODE_TEST_CONTEXT. macOS may inject
// __CF_USER_TEXT_ENCODING even after env -i. Remove only the latter;
// preserve the runner marker and reject all other unexpected variables.
assert.equal(process.env.TSOS_OFFLINE_LOOPBACK,'1','use documented isolated command');
const allowedEnv=new Set(['PATH','HOME','TMPDIR','TSOS_OFFLINE_LOOPBACK','TZ']);
assert.equal(process.env.HOME,join(process.cwd(),'home'));
assert.equal(process.env.TMPDIR,join(process.cwd(),'tmp'));
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

const root=resolve(functionsDir,'..');
const pins=Object.freeze({
  "functions/package-lock.json": "9acb6ce6fd6881f3606853ca534939ff79649fe4",
  "functions/package.json": "89329df4b5efe0ffd707383079baeaf4cf54869c",
  "functions/src/schoolOS/identity/authAccessAuthorization.ts": "812429177c5dd9c7fcad6616e4a7d05bac20aeb5",
  "functions/src/schoolOS/identity/authAccessReadModel.ts": "461dbab181c6d77b21fc75f5871ce6244dc840ab",
  "functions/src/schoolOS/identity/contracts.ts": "be340ac4cb6be06effa1d09e1510a1e75f08c70a",
  "functions/src/schoolOS/identity/idStrategy.ts": "02037d2dd897cd06f5dc67e32d20b70824ea1527",
  "functions/tsconfig.json": "2ba14d7818a2cc95f3f0fa8b50340f77b2817f08",
  "scripts/milestone3-bounded-principal-audit.mjs": "683b79a6221eb9b420e7f7692a5982c7bef75ef5",
  "scripts/verification/identity-verification-safety-core.mjs": "1d47dae1c4f84cc6be7eae493243c17c5cba2d77"
});
const digest=bytes=>createHash("sha1").update("blob "+bytes.length+"\0").update(bytes).digest("hex");

const readJson=path=>JSON.parse(readFileSync(path,"utf8"));
function verifyInputs(){
  assert.equal(process.version,"v22.22.1");
  for(const [p,sha] of Object.entries(pins)){
    const file=join(root,p);assert.ok(lstatSync(file).isFile(),"pinned file missing or unsafe");
    assert.equal(digest(readFileSync(file)),sha,"pinned source drift: "+p);
  }
  const lock=readJson(join(functionsDir,"package-lock.json"));
  for(const [name,version] of [["typescript","5.9.3"],["firebase-admin","13.7.0"]]){
    assert.equal(lock.packages["node_modules/"+name].version,version);
    assert.equal(readJson(join(functionsDir,"node_modules",name,"package.json")).version,version,"install locked dependencies first");
  }
}

async function compileSampler(){
  verifyInputs();
  const ts=req("typescript");assert.equal(ts.version,"5.9.3");
  const stage=process.cwd();
  assert.ok(stage.startsWith(join(functionsDir,'.tsos-r2d-'))&&dirname(stage)===functionsDir&&lstatSync(stage).isDirectory());
  try{
    const lib=join(stage,"functions","lib"),scripts=join(stage,"scripts");
    mkdirSync(scripts,{recursive:true});
    const config=readJson(join(functionsDir,"tsconfig.json"));
    const converted=ts.convertCompilerOptionsFromJson(config.compilerOptions,functionsDir);
    assert.equal(converted.errors.length,0,"invalid compiler configuration");
    const sourceNames=Object.keys(pins).filter(p=>p.endsWith(".ts")).map(p=>join(root,p));
    const options={...converted.options,rootDir:join(functionsDir,"src"),outDir:lib,sourceMap:false,noEmitOnError:true,typeRoots:[join(functionsDir,"node_modules","@types")]};
    const program=ts.createProgram({rootNames:sourceNames,options});
    const diagnostics=ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length,0,"canonical compiler diagnostics: "+diagnostics.map(d=>d.code).join(","));
    const emitted=program.emit();assert.equal(emitted.emitSkipped,false,"canonical compilation skipped");
    assert.equal(emitted.diagnostics.length,0,"canonical emit diagnostics");
    const canonicalRequire=createRequire(join(lib,"schoolOS","identity","authAccessReadModel.js"));
    const ids=canonicalRequire("./idStrategy.js"),canonical=canonicalRequire("./authAccessReadModel.js"),authorization=canonicalRequire("./authAccessAuthorization.js");
    const samplerPath=join(scripts,"milestone3-bounded-principal-audit.mjs");
    copyFileSync(join(root,"scripts","milestone3-bounded-principal-audit.mjs"),samplerPath);
    const {auditApprovedPrincipals}=await import(pathToFileURL(samplerPath).href);

    return {stage,ids,auditApprovedPrincipals};
  }catch{throw Error('WORKLOAD_COMPILE_FAILED');} // parent owns cleanup after confirmed close
}
let ids,auditApprovedPrincipals;
const db='projects/tsos-synthetic-transport/databases/(default)',parent=db+'/documents';
let time;
const qcols=['roleAssignments','organisationMemberships'];
const cols=['authAccessReadModels','authIdentities','people',...qcols,'users','schoolUsers'];
function fixture(a){
  const {uid,personId,role}=a,school=role==='schoolAdmin';
  return {a,rows:{
    authAccessReadModels:{schemaVersion:1,authority:'canonical-derived',firebaseUid:uid,personId,
      sourceAuthIdentityId:a.authIdentityId,personStatus:'active',authStatus:'active',accessActive:true,
      globalRoles:school?[]:[role],schoolAdminOrganisationIds:school?[a.organisationId]:[],updatedAt:time},
    authIdentities:{authIdentityId:a.authIdentityId,personId,provider:'firebase',providerSubject:uid,status:'active'},
    people:{personId,status:'active'},
    roleAssignments:[{roleAssignmentId:ids.buildRoleAssignmentId({personId,role,scopeType:school?'organisation':'global',scopeId:a.organisationId}),
      personId,role,scopeType:school?'organisation':'global',scopeId:a.organisationId,status:'active'}],
    organisationMemberships:school?[{organisationMembershipId:ids.buildOrganisationMembershipId({organisationId:a.organisationId,personId,role}),
      organisationId:a.organisationId,personId,role,status:'active'}]:[],
    users:{role,status:'active'},schoolUsers:school?{role,status:'active',schoolIds:[a.legacySchoolId]}:null
  }};
}
function value(x){
  if(x===null)return {nullValue:0};
  if(typeof x==='string')return {stringValue:x};
  if(typeof x==='boolean')return {booleanValue:x};
  if(typeof x==='number')return {integerValue:String(x)};
  if(Array.isArray(x))return {arrayValue:{values:x.map(value)}};
  return {timestampValue:x};
}
function pointId(a,col){return col==='authIdentities'?a.authIdentityId:col==='people'?a.personId:a.uid;}
function document(col,id,row){
  return {name:parent+'/'+col+'/'+id,fields:Object.fromEntries(Object.entries(row).map(([k,v])=>[k,value(v)]))};
}
async function run(plan,maxAgeMs,deadlineMs){
  const now=Date.now();time={seconds:String(Math.floor(now/1000)),nanos:(now%1000)*1000000};
  const fixtures=plan.actors.map(fixture);
  const actors=fixtures.map(f=>f.a),calls=[],wireErrors=[],cancelled=[];
  const server=new grpc.Server();let client;
  function handler(method,call){
    const r=call.request,query=method==='runQuery';
    const col=query?r.structuredQuery?.from?.[0]?.collectionId:r.documents?.[0]?.split('/').at(-2);
    try{
      assert.ok(cols.includes(col));
      const f=fixtures.find(f=>query?f.a.personId===r.structuredQuery.where.fieldFilter.value.stringValue:
        r.documents[0]===parent+'/'+col+'/'+pointId(f.a,col));
      assert.ok(f);const idx=fixtures.indexOf(f);
      assert.ok(!calls.some(c=>c.idx===idx&&c.col===col));
      calls.push({idx,col});call.on('cancelled',()=>cancelled.push({idx,col}));
      if(col==='authAccessReadModels')assert.equal(r.readTime,undefined);else assert.deepEqual(r.readTime,time);
      if(query){
        assert.equal(r.parent,parent);assert.deepEqual(r.structuredQuery,{
          select:{fields:FIELD_MASKS[col].map(fieldPath=>({fieldPath}))},from:[{collectionId:col}],
          where:{fieldFilter:{field:{fieldPath:'personId'},op:'EQUAL',value:{stringValue:f.a.personId}}},limit:{value:51}});
        const rows=f.rows[col];
        if(!rows.length)call.write({readTime:time});
        for(const row of rows)call.write({document:document(col,row[col==='roleAssignments'?'roleAssignmentId':'organisationMembershipId'],row),readTime:time});
      }else{
        assert.equal(r.database,db);assert.deepEqual(r.mask.fieldPaths,FIELD_MASKS[col]);
        const row=f.rows[col],id=pointId(f.a,col);
        call.write(row===null?{missing:parent+'/'+col+'/'+id,readTime:time}:{found:document(col,id,row),readTime:time});
      }
      call.end();
    }catch{wireErrors.push('WIRE_INVALID');call.emit('error',Object.assign(Error('synthetic wire mismatch'),{code:grpc.status.INVALID_ARGUMENT}));}
  }
  for(const [key,definition] of Object.entries(service)){
    const method=definition.path.endsWith('/BatchGetDocuments')?'batchGetDocuments':definition.path.endsWith('/RunQuery')?'runQuery':null;
    if(method)server.addService({[key]:definition},{[key]:call=>handler(method,call)});
  }
  try{
    const port=await new Promise((resolve,reject)=>server.bindAsync('127.0.0.1:0',grpc.ServerCredentials.createInsecure(),(err,p)=>err?reject(Error('loopback bind failed')):resolve(p)));
    const authClient=new OAuth2Client({universeDomain:'googleapis.com'});
    authClient.setCredentials({access_token:'synthetic-not-a-real-token'});
    const auth=new GoogleAuth({authClient,projectId:'tsos-synthetic-transport',universeDomain:'googleapis.com'});
    client=new FirestoreClient({servicePath:'127.0.0.1',port,fallback:false,projectId:'tsos-synthetic-transport',auth,
      universeDomain:'googleapis.com',sslCreds:grpc.credentials.createInsecure(),gaxServerStreamingRetries:false,
      'grpc.enable_retries':0,'grpc.max_receive_message_length':65536});
    const clock=Date.now;
    assert.ok(clock()<deadlineMs);
    const result=await exerciseSyntheticTransport({...plan,endMs:deadlineMs},{clock,
      canonical:{sampler:auditApprovedPrincipals,buildAuthIdentityId:ids.buildAuthIdentityId,nowMs:Date.now,maxAgeMs},
      open:t=>client[t.request.method](t.request.body,{timeout:t.timeoutMs,retry:null,retryRequestOptions:{retries:0,noResponseRetries:0,shouldRetryFn:()=>false}})});
    assert.deepEqual(wireErrors,[]);assert.equal(result.counts.inFlight,0);
    assert.equal(calls.length,result.dispatched);
    assert.ok(!JSON.stringify(result).includes('synthetic-uid'));
    assert.equal(result.status,'SYNTHETIC_TRANSPORT_COMPLETE');
    assert.equal(result.canonicalCompleted,actors.length);assert.equal(calls.length,plan.maxAttempts);
    assert.equal(result.counts.reservedSlots,plan.maxSlots);
    assert.equal(result.returned,actors.reduce((n,a)=>n+(a.role==='schoolAdmin'?7:5),0));
    assert.ok(Date.now()<deadlineMs);
    return {scope:'synthetic-only',status:'CANONICAL_FIXTURE_COMPLETE',actors:actors.length,attempts:calls.length,slots:result.counts.reservedSlots,returned:result.returned};
  }finally{server.forceShutdown();if(client)await client.close();}
}

// Internal pipe only: parent has consumed the signed approval. Direct invocation
// is still synthetic-only; this is not a privileged or hostile-host boundary.
try{
  let chunks=[],size=0;
  for await(const chunk of process.stdin){size+=chunk.length;assert.ok(size<=32768);chunks.push(chunk);}
  const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));chunks=[];
  assert.deepEqual(Object.keys(input).sort(),['approval','deadlineMs']);
  const {approval,deadlineMs}=input,{plan,maxAgeMs}=approval;
  assert.deepEqual(Object.keys(approval).sort(),['executableReady','maxAgeMs','plan','scope']);
  assert.equal(approval.scope,'synthetic-only');assert.equal(approval.executableReady,false);
  createSyntheticRequestLane(plan,Date.now);
  assert.ok(Number.isSafeInteger(maxAgeMs)&&maxAgeMs>=1&&maxAgeMs<=300000);
  assert.ok(Number.isSafeInteger(deadlineMs)&&Date.now()>=plan.startMs&&Date.now()<deadlineMs&&deadlineMs<=plan.endMs);
  ({ids,auditApprovedPrincipals}=await compileSampler());
  assert.ok(Date.now()<deadlineMs);
  assert.ok(plan.actors.every(a=>ids.buildAuthIdentityId('firebase',a.uid)===a.authIdentityId));
  const result=await run(plan,maxAgeMs,deadlineMs);
  process.stdout.write(JSON.stringify(result)+'\n');
}catch{process.stdout.write('{"scope":"synthetic-only","status":"WORKLOAD_STOPPED"}\n');process.exitCode=1;}
