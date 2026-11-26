// B01-B.3: synthetic rule evaluation only; no policy execution or persistence.
import {validateSyntheticRecord} from "./typed-schema-core.mjs";
const own=(x,k)=>Object.hasOwn(x,k);
const obj=x=>x!==null&&typeof x==="object"&&[Object.prototype,null].includes(Object.getPrototypeOf(x))&&Reflect.ownKeys(x).every(k=>typeof k==="string"&&Object.getOwnPropertyDescriptor(x,k).enumerable&&own(Object.getOwnPropertyDescriptor(x,k),"value"));
const arr=x=>Array.isArray(x)&&x.length<=1000&&Reflect.ownKeys(x).length===x.length+1&&Array.from({length:x.length},(_,i)=>Object.getOwnPropertyDescriptor(x,String(i))).every(d=>d&&d.enumerable&&own(d,"value"));
const shape=(x,keys)=>obj(x)&&Object.keys(x).length===keys.length&&keys.every(k=>own(x,k));
const id=x=>typeof x==="string"&&/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(x)&&!["constructor","prototype"].includes(x);
const rev=x=>Number.isSafeInteger(x)&&x>0;
const types=new Set(["string","boolean","number","integer","enum","date-only","string-or-null"]);
const fieldValid=f=>obj(f)&&id(f.name)&&types.has(f.type)&&!validateSyntheticRecord({scope:"synthetic-only",version:1,fields:[f]}, {},1).errors.some(e=>e.code!=="REQUIRED_FIELD");
const typed=(field,value)=>validateSyntheticRecord({scope:"synthetic-only",version:1,fields:[field]},{[field.name]:value},1).valid;
const dateField={name:"day",type:"date-only",required:true,nullable:false};
const day=x=>typed(dateField,x);
const compare=(a,b)=>a<b?-1:a>b?1:0;
export function evaluateSyntheticRules(contract,ruleSet,event){
  const errors=[];
  const fail=code=>errors.push(code);
  const result=decision=>Object.freeze({valid:errors.length===0,scope:"synthetic-only",executableReady:false,decision:errors.length?null:decision,errors:Object.freeze([...new Set(errors)].sort())});
  if(!shape(contract,["scope","version","dateBasis","inputs","outcome"])||contract.scope!=="synthetic-only"||!rev(contract.version)||!["serviceDate","decisionDate"].includes(contract.dateBasis)||!arr(contract.inputs)||!contract.inputs.length||!contract.inputs.every(fieldValid)||!fieldValid(contract.outcome)||contract.outcome.required!==true){fail("CONTRACT_SHAPE");return result(null);}
  const fields=new Map(contract.inputs.map(f=>[f.name,f]));
  if(fields.size!==contract.inputs.length){fail("DUPLICATE_INPUT");return result(null);}
  if(!shape(ruleSet,["scope","contractVersion","revision","rules"])||ruleSet.scope!=="synthetic-only"||!rev(ruleSet.revision)||!arr(ruleSet.rules)||!ruleSet.rules.length){fail("RULE_SET_SHAPE");return result(null);}
  if(ruleSet.contractVersion!==contract.version){fail("CONTRACT_VERSION");return result(null);}
  if(!shape(event,["dateBasis","date","inputs"])||event.dateBasis!==contract.dateBasis||!day(event.date)||!obj(event.inputs)){fail("EVENT_SHAPE");return result(null);}
  if(!validateSyntheticRecord({scope:"synthetic-only",version:1,fields:contract.inputs},event.inputs,1).valid){fail("EVENT_INPUTS");return result(null);}
  const identities=new Set(),byId=new Map(),eligible=[];
  for(const rule of ruleSet.rules){
    if(!shape(rule,["id","version","start","end","priority","conditions","outcome"])||!id(rule.id)||!rev(rule.version)||!day(rule.start)||(rule.end!==null&&(!day(rule.end)||rule.end<=rule.start))||!Number.isSafeInteger(rule.priority)||!arr(rule.conditions)){fail("RULE_SHAPE");continue;}
    const identity=rule.id+":"+rule.version;
    if(identities.has(identity)){fail("DUPLICATE_RULE_VERSION");continue;}
    identities.add(identity);
    if(!byId.has(rule.id))byId.set(rule.id,[]);
    byId.get(rule.id).push(rule);
    if(!typed(contract.outcome,rule.outcome)){fail("OUTCOME_TYPE");continue;}
    const seen=new Set();
    let match=true;
    for(const condition of rule.conditions){
      if(!shape(condition,["field","equals"])||typeof condition.field!=="string"||!fields.has(condition.field)){fail("CONDITION_SHAPE");match=false;continue;}
      if(seen.has(condition.field)){fail("DUPLICATE_CONDITION");match=false;continue;}
      seen.add(condition.field);
      if(!typed(fields.get(condition.field),condition.equals)){fail("CONDITION_TYPE");match=false;continue;}
      if(!own(event.inputs,condition.field)||event.inputs[condition.field]!==condition.equals)match=false;
    }
    if(match&&event.date>=rule.start&&(rule.end===null||event.date<rule.end))eligible.push(rule);
  }
  for(const versions of byId.values()){
    const sorted=[...versions].sort((a,b)=>compare(a.start,b.start));
    for(let i=1;i<sorted.length;i++){
      const previous=sorted[i-1],next=sorted[i];
      if(previous.end===null||next.start<previous.end)fail("OVERLAPPING_RULE_VERSIONS");
    }
  }
  if(errors.length)return result(null);
  if(!eligible.length){fail("NO_MATCH");return result(null);}
  const priority=Math.max(...eligible.map(r=>r.priority));
  const winners=eligible.filter(r=>r.priority===priority);
  if(winners.length!==1){fail("AMBIGUOUS_PRIORITY");return result(null);}
  const winner=winners[0];
  return result(Object.freeze({value:winner.outcome,provenance:Object.freeze({ruleId:winner.id,ruleVersion:winner.version,ruleSetRevision:ruleSet.revision,contractVersion:contract.version,dateBasis:contract.dateBasis,date:event.date,priority:winner.priority,effectiveStart:winner.start,effectiveEnd:winner.end})}));
}
