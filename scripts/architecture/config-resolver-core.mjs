// B01-B.2: synthetic-only configuration resolution. No storage or policy execution.
import {validateSyntheticRecord} from "./typed-schema-core.mjs";
const own=(x,k)=>Object.hasOwn(x,k);
const obj=x=>x!==null&&typeof x==="object"&&[Object.prototype,null].includes(Object.getPrototypeOf(x))&&Reflect.ownKeys(x).every(k=>typeof k==="string"&&Object.getOwnPropertyDescriptor(x,k).enumerable&&own(Object.getOwnPropertyDescriptor(x,k),"value"));
const arr=x=>Array.isArray(x)&&x.length<=1000&&Reflect.ownKeys(x).length===x.length+1&&Array.from({length:x.length},(_,i)=>Object.getOwnPropertyDescriptor(x,String(i))).every(d=>d&&d.enumerable&&own(d,"value"));
const shape=(x,keys)=>obj(x)&&Object.keys(x).length===keys.length&&keys.every(k=>own(x,k));
const scopes=["platform","tenant","organisation","campus","programme"];
const paths=["platform","platform/tenant","platform/tenant/organisation","platform/tenant/organisation/campus","platform/tenant/organisation/programme","platform/tenant/organisation/campus/programme"];
const id=x=>typeof x==="string"&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(x);
const key=x=>typeof x==="string"&&/^[A-Za-z][A-Za-z0-9]{0,79}$/.test(x)&&!["constructor","prototype"].includes(x);
const rev=x=>Number.isSafeInteger(x)&&x>0;
const types=new Set(["string","string-or-null","boolean","number","integer","enum","date-only","string-array","iana-time-zone"]);
const lineage=x=>arr(x)&&x.length<=5&&x.every(n=>shape(n,["scope","id"])&&scopes.includes(n.scope)&&id(n.id))&&paths.includes(x.map(n=>n.scope).join("/"))&&x[0].id==="platform";
const prefix=(a,b)=>a.length<=b.length&&a.every((n,i)=>n.scope===b[i].scope&&n.id===b[i].id);
const copy=v=>Array.isArray(v)?Object.freeze([...v]):v;
const frozenLineage=x=>Object.freeze(x.map(n=>Object.freeze({scope:n.scope,id:n.id})));
const typed=(field,value)=>validateSyntheticRecord({scope:"synthetic-only",version:1,fields:[field]},{[field.name]:value},1).valid;
export function resolveSyntheticConfig(contract,context,layers){
  const errors=[];
  const fail=(code,field=null)=>errors.push({code,field});
  const result=(settings=null)=>Object.freeze({valid:errors.length===0,scope:"synthetic-only",executableReady:false,settings:errors.length?null:settings,errors:Object.freeze(errors.sort((a,b)=>a.code<b.code?-1:a.code>b.code?1:(a.field??"")<(b.field??"")?-1:(a.field??"")>(b.field??"")?1:0).map(e=>Object.freeze(e)))});
  if(!shape(contract,["scope","version","settings"])||contract.scope!=="synthetic-only"||!rev(contract.version)||!arr(contract.settings)||!contract.settings.length){fail("CONTRACT_SHAPE");return result();}
  if(!lineage(context)){fail("CONTEXT_LINEAGE");return result();}
  if(!arr(layers)||layers.length>5){fail("LAYERS_SHAPE");return result();}
  const defs=new Map(),resolved=new Map();
  for(const d of contract.settings){
    if(!obj(d)||Object.keys(d).some(k=>!["field","allowedScopes","default"].includes(k))||!own(d,"field")||!own(d,"allowedScopes")||!obj(d.field)||!key(d.field.name)||!types.has(d.field.type)||!arr(d.allowedScopes)||!d.allowedScopes.length||!d.allowedScopes.every(s=>scopes.includes(s))||new Set(d.allowedScopes).size!==d.allowedScopes.length){fail("SETTING_CONTRACT");continue;}
    const field=d.field,name=field.name;
    if(defs.has(name)){fail("DUPLICATE_SETTING",name);continue;}
    const check=validateSyntheticRecord({scope:"synthetic-only",version:1,fields:[field]}, {},1);
    if(check.errors.some(e=>e.code!=="REQUIRED_FIELD")){fail("SETTING_CONTRACT",name);continue;}
    defs.set(name,d);
    if(own(d,"default")){
      if(!typed(field,d.default)){fail("INVALID_DEFAULT",name);continue;}
      resolved.set(name,Object.freeze({state:"resolved",value:copy(d.default),provenance:Object.freeze({kind:"default",schemaVersion:contract.version})}));
    }
  }
  if(errors.length)return result();
  const seen=new Set(),ordered=[];
  for(const layer of layers){
    if(!shape(layer,["lineage","schemaVersion","revision","values"])||!lineage(layer.lineage)||!rev(layer.revision)||!obj(layer.values)){fail("LAYER_SHAPE");continue;}
    if(!prefix(layer.lineage,context)){fail("FOREIGN_LINEAGE");continue;}
    if(layer.schemaVersion!==contract.version){fail("VERSION_MISMATCH");continue;}
    const depth=layer.lineage.length;
    if(seen.has(depth)){fail("DUPLICATE_SCOPE");continue;}
    seen.add(depth);ordered.push(layer);
    const scope=layer.lineage[depth-1].scope;
    for(const [name,value] of Object.entries(layer.values)){
      const d=defs.get(name);
      if(!d){fail("UNKNOWN_SETTING");continue;}
      if(!d.allowedScopes.includes(scope)){fail("SCOPE_NOT_ALLOWED",name);continue;}
      if(!typed(d.field,value)){fail("INVALID_VALUE",name);continue;}
    }
  }
  if(errors.length)return result();
  ordered.sort((a,b)=>a.lineage.length-b.lineage.length);
  for(const layer of ordered)for(const [name,value] of Object.entries(layer.values)){
    resolved.set(name,Object.freeze({state:"resolved",value:copy(value),provenance:Object.freeze({kind:"override",schemaVersion:layer.schemaVersion,revision:layer.revision,lineage:frozenLineage(layer.lineage)})}));
  }
  for(const [name,d] of defs)if(!resolved.has(name)){
    if(d.field.required)fail("MISSING_REQUIRED",name);
    else resolved.set(name,Object.freeze({state:"missing",provenance:null}));
  }
  return result(Object.freeze(Object.fromEntries([...resolved].sort(([a],[b])=>a<b?-1:a>b?1:0))));
}
