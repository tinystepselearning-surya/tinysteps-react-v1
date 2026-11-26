// B01-B.4: synthetic additive-only compatibility and lossless copy. No migration.
import {validateSyntheticRecord} from "./typed-schema-core.mjs";
const own=(x,k)=>Object.hasOwn(x,k);
const obj=x=>x!==null&&typeof x==="object"&&[Object.prototype,null].includes(Object.getPrototypeOf(x))&&Reflect.ownKeys(x).every(k=>typeof k==="string"&&Object.getOwnPropertyDescriptor(x,k).enumerable&&own(Object.getOwnPropertyDescriptor(x,k),"value"));
const arr=x=>Array.isArray(x)&&x.length<=1000&&Reflect.ownKeys(x).length===x.length+1&&Array.from({length:x.length},(_,i)=>Object.getOwnPropertyDescriptor(x,String(i))).every(d=>d&&d.enumerable&&own(d,"value"));
const shape=(x,keys)=>obj(x)&&Object.keys(x).length===keys.length&&keys.every(k=>own(x,k));
const id=x=>typeof x==="string"&&/^synthetic-[a-z0-9][a-z0-9-]{0,69}$/.test(x);
const text=x=>typeof x==="string"&&x.trim().length>0&&x.length<=500;
const rev=x=>Number.isSafeInteger(x)&&x>0;
const compare=(a,b)=>a<b?-1:a>b?1:0;
const canonical=x=>Array.isArray(x)?x.map(canonical):obj(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const schema=s=>({scope:"synthetic-only",version:s.version,fields:s.fields.map(f=>f.contract)});
function inspect(s){
  if(!shape(s,["scope","recordId","owner","definition","version","fields"])||s.scope!=="synthetic-only"||!id(s.recordId)||!id(s.owner)||!text(s.definition)||!rev(s.version)||!arr(s.fields)||!s.fields.length)return "SCHEMA_SHAPE";
  if(!s.fields.every(f=>shape(f,["fieldId","definition","contract"])&&id(f.fieldId)&&text(f.definition)&&obj(f.contract)))return "FIELD_SHAPE";
  if(new Set(s.fields.map(f=>f.fieldId)).size!==s.fields.length)return "DUPLICATE_FIELD_ID";
  // Contract validation via the accepted typed engine; required absence is expected for an empty witness.
  if(validateSyntheticRecord(schema(s),{},s.version).errors.some(e=>e.code!=="REQUIRED_FIELD"))return "FIELD_CONTRACT";
  return null;
}
export function projectSyntheticEvolution(previous,next,plan,source){
  const errors=[];
  const fail=code=>errors.push(code);
  const result=(projection=null,lineage=null)=>Object.freeze({valid:!errors.length,scope:"synthetic-only",executableReady:false,projection:errors.length?null:projection,lineage:errors.length?null:lineage,errors:Object.freeze([...new Set(errors)].sort())});
  for(const s of [previous,next]){const e=inspect(s);if(e)fail(e);}
  if(errors.length)return result();
  if(previous.recordId!==next.recordId||previous.owner!==next.owner||previous.definition!==next.definition)fail("RECORD_IDENTITY_CHANGED");
  if(next.version!==previous.version+1)fail("VERSION_SEQUENCE");
  const before=new Map(previous.fields.map(f=>[f.fieldId,f])),after=new Map(next.fields.map(f=>[f.fieldId,f])),oldNames=new Map(previous.fields.map(f=>[f.contract.name,f.fieldId]));
  for(const [fieldId,f] of before){
    const n=after.get(fieldId);
    if(!n){fail("FIELD_REMOVED");continue;}
    if(f.definition!==n.definition)fail("FIELD_MEANING_CHANGED");
    if(!same(f.contract,n.contract))fail("FIELD_CONTRACT_CHANGED");
  }
  for(const [fieldId,f] of after)if(!before.has(fieldId)){
    if(oldNames.has(f.contract.name))fail("FIELD_ID_REASSIGNED");
    if(f.contract.required)fail("REQUIRED_FIELD_ADDED");
  }
  if(!shape(plan,["scope","recordId","fromVersion","toVersion","steps"])||plan.scope!=="synthetic-only"||plan.recordId!==previous.recordId||plan.fromVersion!==previous.version||plan.toVersion!==next.version||!arr(plan.steps)){fail("PLAN_SHAPE");return result();}
  const seen=new Set();
  for(const step of plan.steps){
    if(!shape(step,["fieldId","operation"])||!id(step.fieldId)||!after.has(step.fieldId)){fail("PLAN_ENTRY");continue;}
    if(seen.has(step.fieldId)){fail("DUPLICATE_PLAN_ENTRY");continue;}
    seen.add(step.fieldId);
    if(step.operation!==(before.has(step.fieldId)?"copy":"omit"))fail("PLAN_OPERATION");
  }
  if(seen.size!==after.size)fail("INCOMPLETE_PLAN");
  if(!shape(source,["scope","recordId","version","values"])||source.scope!=="synthetic-only"||source.recordId!==previous.recordId||source.version!==previous.version||!obj(source.values)){fail("SOURCE_SHAPE");return result();}
  if(!validateSyntheticRecord(schema(previous),source.values,source.version).valid)fail("SOURCE_INVALID");
  if(errors.length)return result();
  const values=Object.freeze(Object.fromEntries([...before.values()].sort((a,b)=>compare(a.contract.name,b.contract.name)).filter(f=>own(source.values,f.contract.name)).map(f=>{const v=source.values[f.contract.name];return [f.contract.name,Array.isArray(v)?Object.freeze([...v]):v];})));
  if(!validateSyntheticRecord(schema(next),values,next.version).valid){fail("TARGET_INVALID");return result();}
  const lineage=Object.freeze({recordId:previous.recordId,owner:previous.owner,fromVersion:previous.version,toVersion:next.version,fields:Object.freeze([...after].sort(([a],[b])=>compare(a,b)).map(([fieldId,f])=>Object.freeze({fieldId,name:f.contract.name,operation:before.has(fieldId)?"copy":"omit",present:own(values,f.contract.name)})))});
  return result(Object.freeze({scope:"synthetic-only",recordId:next.recordId,version:next.version,values}),lineage);
}
