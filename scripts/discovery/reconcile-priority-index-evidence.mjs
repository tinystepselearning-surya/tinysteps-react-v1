#!/usr/bin/env node
// P01.2 offline source/metadata reconciliation; no SDK, network, credential or write path.
// Private evidence file supplied only after separately authorized collection.
import {readFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';

const GROUPS=['classSessions','months','billingCharges','teacherEarnings'];
const SOURCE_PIN='b7e9e4d2cf029b5218294b987240992774e7f9e0';
const record=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&Object.getPrototypeOf(o)===Object.prototype;
function requireOK(condition){if(!condition)throw Error('INVALID_OR_UNSUPPORTED_EVIDENCE');}
const only=(o,keys)=>record(o)&&Object.keys(o).every(k=>keys.includes(k));
function signature(index,source){
  requireOK(only(index,source?['collectionGroup','queryScope','fields','density','apiScope']:['name','queryScope','fields','density','apiScope','state']));
  requireOK(['COLLECTION','COLLECTION_GROUP'].includes(index.queryScope));
  requireOK((!Object.hasOwn(index,'density')||index.density==='SPARSE_ALL')&&(!Object.hasOwn(index,'apiScope')||index.apiScope==='ANY_API'));
  requireOK(Array.isArray(index.fields)&&index.fields.length>=2&&index.fields.length<=100);
  const seen=new Set();
  const fields=index.fields.map((f,i)=>{
    requireOK(only(f,['fieldPath','order','arrayConfig'])&&typeof f.fieldPath==='string'&&f.fieldPath.length>0&&!seen.has(f.fieldPath));
    seen.add(f.fieldPath);
    requireOK((['ASCENDING','DESCENDING'].includes(f.order)&&!Object.hasOwn(f,'arrayConfig'))||
      (f.arrayConfig==='CONTAINS'&&!Object.hasOwn(f,'order')));
    if(f.fieldPath==='__name__')requireOK(i===index.fields.length-1&&['ASCENDING','DESCENDING'].includes(f.order));
    return f.order?[f.fieldPath,f.order]:[f.fieldPath,f.arrayConfig];
  });
  if(!seen.has('__name__')){
    // Standard Native index default follows last directional field, even
    // when an array-contains field follows it.
    const direction=fields.slice().reverse().find(f=>['ASCENDING','DESCENDING'].includes(f[1]))?.[1]??'ASCENDING';
    fields.push(['__name__',direction]);
  }else if(!source)requireOK(fields.length>=2);
  // Returned server definitions must explicitly include the terminal field.
  if(!source)requireOK(seen.has('__name__'));
  return JSON.stringify([index.queryScope,fields]);
}
function readBounded(path){
  const stat=lstatSync(path);requireOK(stat.isFile()&&stat.size<=1024*1024);
  const data=readFileSync(path);requireOK(data.length<=1024*1024);return data;
}
function loadSource(){
  const data=readBounded(fileURLToPath(new URL('../../firestore.indexes.json',import.meta.url)));
  requireOK(createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex')===SOURCE_PIN);
  return JSON.parse(data.toString('utf8'));
}
export function reconcileIndexEvidence(source,evidence){
  requireOK(record(source)&&Array.isArray(source.indexes));
  if(evidence!==undefined){
    requireOK(only(evidence,['databaseResource','databaseEdition','groups'])&&evidence.databaseEdition==='STANDARD'&&
      typeof evidence.databaseResource==='string'&&/^projects\/[A-Za-z0-9-]+\/databases\/[A-Za-z0-9_()-]+$/.test(evidence.databaseResource)&&
      only(evidence.groups,GROUPS));
  }
  const rows=GROUPS.map(group=>{
    const declarations=source.indexes.filter(i=>i.collectionGroup===group);
    const expected=new Set(declarations.map(i=>signature(i,true)));
    const base={group,declarations:declarations.length,uniqueDefinitions:expected.size,duplicateDeclarations:declarations.length-expected.size};
    if(evidence===undefined||!Object.hasOwn(evidence.groups,group))return {...base,status:'NOT_VERIFIED'};
    const page=evidence.groups[group];
    try{
      requireOK(only(page,['indexes','nextPageToken'])&&(!Object.hasOwn(page,'nextPageToken')||typeof page.nextPageToken==='string'));
      if(page.nextPageToken)return {...base,status:'INCOMPLETE_PAGE'};
      const indexes=Object.hasOwn(page,'indexes')?page.indexes:[];requireOK(Array.isArray(indexes)&&indexes.length<=500);
      const observed=new Map(),names=new Set(),prefix=evidence.databaseResource+'/collectionGroups/'+group+'/indexes/';
      for(const index of indexes){
        requireOK(record(index)&&typeof index.name==='string'&&index.name.startsWith(prefix)&&
          /^[A-Za-z0-9_-]+$/.test(index.name.slice(prefix.length))&&!names.has(index.name));
        names.add(index.name);
        requireOK(['READY','CREATING','NEEDS_REPAIR'].includes(index.state));
        const key=signature(index,false);requireOK(!observed.has(key));observed.set(key,index.state);
      }
      const missing=[...expected].filter(k=>!observed.has(k)).length;
      const notReady=[...expected].filter(k=>observed.has(k)&&observed.get(k)!=='READY').length;
      const extra=[...observed.keys()].filter(k=>!expected.has(k)).length;
      return {...base,observed:observed.size,missing,notReady,extra,status:missing||notReady||extra?'REVIEW_REQUIRED':'MATCH_READY'};
    }catch{return {...base,status:'INVALID_OR_UNSUPPORTED_EVIDENCE'};}
  });
  return {scope:'offline-metadata-comparison-only',sourceBlob:SOURCE_PIN,liveVerified:false,productionWritesPerformed:false,
    declarationCount:rows.reduce((n,r)=>n+r.declarations,0),uniqueDefinitionCount:rows.reduce((n,r)=>n+r.uniqueDefinitions,0),
    duplicateDeclarations:rows.reduce((n,r)=>n+r.duplicateDeclarations,0),
    status:rows.every(r=>r.status==='MATCH_READY')?'SUPPLIED_EVIDENCE_MATCH_READY':'NOT_ACCEPTED',rows};
}
function selfCheck(source){
  const report=reconcileIndexEvidence(source);
  assert.equal(report.declarationCount,34);assert.equal(report.uniqueDefinitionCount,32);assert.equal(report.duplicateDeclarations,2);
  const databaseResource='projects/synthetic-project/databases/(default)';
  const groups=Object.fromEntries(GROUPS.map(group=>{
    const keys=new Set(source.indexes.filter(i=>i.collectionGroup===group).map(i=>signature(i,true)));
    return [group,{indexes:[...keys].map((key,i)=>{
      const [queryScope,fields]=JSON.parse(key);
      return {name:databaseResource+'/collectionGroups/'+group+'/indexes/fixture-'+i,queryScope,state:'READY',density:'SPARSE_ALL',apiScope:'ANY_API',
        fields:fields.map(([fieldPath,mode])=>mode==='CONTAINS'?{fieldPath,arrayConfig:mode}:{fieldPath,order:mode})};
    })}];
  }));
  const evidence={databaseResource,databaseEdition:'STANDARD',groups};
  const run=mutate=>{const input=structuredClone(evidence);mutate(input);return reconcileIndexEvidence(source,input);};
  const row=(result)=>result.rows[0];
  assert.equal(run(()=>{}).status,'SUPPLIED_EVIDENCE_MATCH_READY');
  assert.equal(row(run(x=>{x.groups.classSessions.nextPageToken='fixture-page';})).status,'INCOMPLETE_PAGE');
  assert.equal(row(run(x=>{x.groups.classSessions.indexes.pop();})).missing,1);
  assert.equal(row(run(x=>{x.groups.classSessions.indexes[0].state='CREATING';})).notReady,1);
  assert.equal(row(run(x=>{x.groups.classSessions.indexes[0].name='projects/wrong/databases/(default)/collectionGroups/classSessions/indexes/fixture';})).status,'INVALID_OR_UNSUPPORTED_EVIDENCE');
  assert.equal(row(run(x=>{x.groups.classSessions.indexes.push(structuredClone(x.groups.classSessions.indexes[0]));})).status,'INVALID_OR_UNSUPPORTED_EVIDENCE');
  assert.equal(row(run(x=>{delete x.groups.classSessions;})).status,'NOT_VERIFIED');
  assert.equal(row(run(x=>{const v=structuredClone(x.groups.classSessions.indexes[0]);v.name=databaseResource+'/collectionGroups/classSessions/indexes/extra';v.fields[0].fieldPath='syntheticExtra';x.groups.classSessions.indexes.push(v);})).extra,1);
  assert.equal(row(run(x=>{x.groups.classSessions.indexes[0].density='DENSE';})).status,'INVALID_OR_UNSUPPORTED_EVIDENCE');
  return {...report,selfCheck:'PASS',liveVerified:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=process.argv.slice(2),source=loadSource();
    let result;
    if(args.length===1&&args[0]==='--source-only')result=reconcileIndexEvidence(source);
    else if(args.length===1&&args[0]==='--self-check')result=selfCheck(source);
    else if(args.length===2&&args[0]==='--evidence-file'){
      result=reconcileIndexEvidence(source,JSON.parse(readBounded(args[1]).toString('utf8')));
      if(result.status!=='SUPPLIED_EVIDENCE_MATCH_READY')process.exitCode=2;
    }else throw Error();
    console.log(JSON.stringify(result));
  }catch{console.error('OFFLINE_INDEX_RECONCILIATION_BLOCKED');process.exitCode=1;}
}
