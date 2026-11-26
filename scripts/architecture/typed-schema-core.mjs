// B01-B.1: isolated synthetic JSON record validation, not a runtime registry compiler.
const types=new Set(["string","id","reference","boolean","number","integer","enum","date-only","string-array","iana-time-zone","string-or-null"]);
const held=new Set(["legacy-value-unvalidated","structured","timestamp"]);
const own=(x,k)=>Object.hasOwn(x,k);
const plain=x=>x!==null&&typeof x==="object"&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const text=x=>typeof x==="string"&&x.trim().length>0;
const fieldName=x=>typeof x==="string"&&/^[A-Za-z][A-Za-z0-9]*$/.test(x)&&!["constructor","prototype"].includes(x);
const dataObject=x=>plain(x)&&Reflect.ownKeys(x).every(k=>typeof k==="string"&&Object.getOwnPropertyDescriptor(x,k).enumerable&&own(Object.getOwnPropertyDescriptor(x,k),"value"));
const dataArray=x=>Array.isArray(x)&&Reflect.ownKeys(x).length===x.length+1&&Array.from({length:x.length},(_,i)=>Object.getOwnPropertyDescriptor(x,String(i))).every(d=>d&&d.enumerable&&own(d,"value"));
function dateOnly(x){
  if(typeof x!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(x))return false;
  const [y,m,d]=x.split("-").map(Number);
  const leap=y%4===0&&(y%100!==0||y%400===0);
  return y>=1&&m>=1&&m<=12&&d>=1&&d<=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][m-1];
}
function zone(x){
  if(typeof x!=="string"||!(/^[A-Za-z][A-Za-z0-9_+.-]*(?:\/[A-Za-z0-9_+.-]+)+$/.test(x)||x==="UTC"))return false;
  try{new Intl.DateTimeFormat("en",{timeZone:x});return true;}catch{return false;}
}
function matches(f,v){
  if(v===null)return f.nullable;
  switch(f.type){
    case "string":case "string-or-null":return typeof v==="string";
    case "id":case "reference":return text(v);
    case "boolean":return typeof v==="boolean";
    case "number":return typeof v==="number"&&Number.isFinite(v);
    case "integer":return Number.isSafeInteger(v);
    case "enum":return typeof v==="string"&&f.values.includes(v);
    case "date-only":return dateOnly(v);
    case "string-array":return dataArray(v)&&v.every(x=>typeof x==="string");
    case "iana-time-zone":return zone(v);
    default:return false;
  }
}
export function validateSyntheticRecord(schema,record,version){
  const errors=[];
  const fail=(code,field=null)=>errors.push({code,field});
  const result=()=>({valid:errors.length===0,scope:"synthetic-shape-only",executableReady:false,errors:errors.sort((a,b)=>a.code<b.code?-1:a.code>b.code?1:(a.field??"")<(b.field??"")?-1:(a.field??"")>(b.field??"")?1:0)});
  if(!dataObject(schema)||schema.scope!=="synthetic-only"||!Number.isSafeInteger(schema.version)||schema.version<1||!dataArray(schema.fields)||!schema.fields.length||Object.keys(schema).some(k=>!["scope","version","fields"].includes(k))){
    fail("SCHEMA_SHAPE");return result();
  }
  const fields=new Map();
  for(const f of schema.fields){
    if(!dataObject(f)||!fieldName(f.name)||typeof f.type!=="string"||typeof f.required!=="boolean"||typeof f.nullable!=="boolean"||Object.keys(f).some(k=>!["name","type","required","nullable","values","target"].includes(k))){
      fail("FIELD_SHAPE");continue;
    }
    if(fields.has(f.name))fail("DUPLICATE_FIELD",f.name);
    fields.set(f.name,f);
    if(held.has(f.type)){fail("HELD_TYPE",f.name);continue;}
    if(!types.has(f.type)){fail("UNKNOWN_TYPE",f.name);continue;}
    if(f.type==="string-or-null"&&!f.nullable)fail("FIELD_NULLABILITY",f.name);
    if(f.type==="enum"){
      if(!dataArray(f.values)||!f.values.length||!f.values.every(text)||new Set(f.values).size!==f.values.length)fail("ENUM_CONTRACT",f.name);
    }else if(own(f,"values"))fail("UNEXPECTED_ENUM",f.name);
    if(f.type==="reference"){
      if(typeof f.target!=="string"||!(/^[A-Z]{3}$/.test(f.target)))fail("REFERENCE_CONTRACT",f.name);
    }else if(own(f,"target"))fail("UNEXPECTED_REFERENCE",f.name);
  }
  if(errors.length)return result();
  if(version!==schema.version)fail("VERSION_MISMATCH");
  if(!dataObject(record)){fail("RECORD_SHAPE");return result();}
  for(const name of Object.keys(record))if(!fields.has(name))fail("UNKNOWN_FIELD",name);
  for(const [name,f] of fields){
    if(!own(record,name)){if(f.required)fail("REQUIRED_FIELD",name);continue;}
    if(!matches(f,record[name]))fail(record[name]===null?"NULL_NOT_ALLOWED":"VALUE_TYPE",name);
  }
  return result();
}
