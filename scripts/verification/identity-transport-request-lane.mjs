// B02-R1C synthetic-only request and accounting state machine.
// No SDK, network, credentials, runtime authorization or production operator.
// Tickets reserve slots before a later transport adapter may dispatch.
// Response decoding, actual cancellation/drain and canonical parity are later gates.
import {FIELD_MASKS} from './identity-verification-safety-core.mjs';

const database='projects/tsos-synthetic-transport/databases/(default)';
const parent=database+'/documents';
const order=Object.freeze(['authAccessReadModels','authIdentities','people',
  'roleAssignments','organisationMemberships','users','schoolUsers']);
const queries=new Set(['roleAssignments','organisationMemberships']);
const own=(o,k)=>Object.hasOwn(o,k);
const shape=(o,keys)=>o!==null&&typeof o==='object'&&
  [Object.prototype,null].includes(Object.getPrototypeOf(o))&&
  Reflect.ownKeys(o).length===keys.length&&keys.every(k=>{
    const d=Object.getOwnPropertyDescriptor(o,k);return d?.enumerable&&own(d,'value');
  });
const synthetic=v=>typeof v==='string'&&/^synthetic-[a-z0-9][a-z0-9-]{0,79}$/.test(v);
const auth=v=>typeof v==='string'&&/^auth_[a-f0-9]{32}$/.test(v);
const int=v=>Number.isSafeInteger(v)&&v>=0;
const roles=['admin','founder','schoolAdmin','teacher','parent','learningPartner'];
const actorKeys=['uid','personId','authIdentityId','role','organisationId','legacySchoolId'];
const actorOk=a=>shape(a,actorKeys)&&synthetic(a.uid)&&synthetic(a.personId)&&auth(a.authIdentityId)&&
  roles.includes(a.role)&&(a.role==='schoolAdmin'?synthetic(a.organisationId)&&synthetic(a.legacySchoolId):
    a.organisationId===null&&a.legacySchoolId===null);
const freeze=o=>{if(o&&typeof o==='object'){for(const v of Object.values(o))freeze(v);Object.freeze(o);}return o;};
const readTimeOk=t=>shape(t,['seconds','nanos'])&&typeof t.seconds==='string'&&
  /^(0|[1-9][0-9]{0,11})$/.test(t.seconds)&&Number(t.seconds)<=253402300799&&int(t.nanos)&&
  t.nanos<1000000000&&t.nanos%1000===0;
const stamp=t=>Object.freeze({seconds:t.seconds,nanos:t.nanos});
const sameTime=(a,b)=>a.seconds===b.seconds&&a.nanos===b.nanos;
const planKeys=['scope','actors','startMs','endMs','maxAttempts','maxSlots'];
function validPlan(p){
  if(!shape(p,planKeys)||p.scope!=='synthetic-only'||!Array.isArray(p.actors)||
    Object.getPrototypeOf(p.actors)!==Array.prototype||p.actors.length<1||p.actors.length>10||
    Reflect.ownKeys(p.actors).length!==p.actors.length+1||
    !int(p.startMs)||!int(p.endMs)||p.endMs<=p.startMs||p.endMs-p.startMs>300000||
    p.maxAttempts!==p.actors.length*7||p.maxSlots!==p.actors.length*107)return false;
  for(let i=0;i<p.actors.length;i++){
    const d=Object.getOwnPropertyDescriptor(p.actors,String(i));
    if(!d?.enumerable||!own(d,'value')||!actorOk(d.value))return false;
  }
  return ['uid','personId','authIdentityId'].every(k=>new Set(p.actors.map(a=>a[k])).size===p.actors.length);
}
function request(actor,col,readTime){
  let body,method;
  if(queries.has(col)){
    method='runQuery';
    body={parent,structuredQuery:{select:{fields:FIELD_MASKS[col].map(fieldPath=>({fieldPath}))},
      from:[{collectionId:col}],where:{fieldFilter:{field:{fieldPath:'personId'},op:'EQUAL',
        value:{stringValue:actor.personId}}},limit:{value:51}}};
  }else{
    method='batchGetDocuments';
    const id=col==='authIdentities'?actor.authIdentityId:col==='people'?actor.personId:actor.uid;
    body={database,documents:[parent+'/'+col+'/'+id],mask:{fieldPaths:[...FIELD_MASKS[col]]}};
  }
  if(readTime)body.readTime={...readTime};
  return freeze({method,body});
}
export function createSyntheticRequestLane(plan,clock){
  if(!validPlan(plan)||typeof clock!=='function')throw Error('PLAN_INVALID');
  const actors=plan.actors.map(a=>Object.freeze({...a}));
  const config={start:plan.startMs,end:plan.endMs,maxAttempts:plan.maxAttempts,maxSlots:plan.maxSlots};
  let previous=-1,blocker=null,index=0,actorStart=null,readTime=null;
  let reserved=0,slots=0,completed=0,failed=0,unknown=0;
  const active=new Map(),seen=new Set(),done=new Set();
  const stop=code=>{blocker??=code;};
  function time(){
    if(blocker)throw Error('LANE_STOPPED');
    let n;try{n=clock();}catch{stop('CLOCK_INVALID');throw Error('LANE_STOPPED');}
    if(!int(n)||n<previous){stop('CLOCK_INVALID');throw Error('LANE_STOPPED');}
    previous=n;
    if(n<config.start||n>=config.end||(actorStart!==null&&n-actorStart>=30000)){
      stop('WINDOW_CLOSED');throw Error('LANE_STOPPED');
    }
    return n;
  }
  function reject(code){stop(code);throw Error('LANE_STOPPED');}
  function reserve(actorIndex,col){
    if(index===actors.length)throw Error('LANE_COMPLETE');
    const n=time();
    if(actorIndex!==index||!order.includes(col)||seen.has(col))reject('REQUEST_DENIED');
    const allowed=col==='authAccessReadModels'?seen.size===0:
      col==='authIdentities'?done.has('authAccessReadModels'):
      col==='people'?done.has('authIdentities'):
      queries.has(col)?done.has('people'):
      col==='users'?done.has('roleAssignments')&&done.has('organisationMemberships'):
      done.has('users');
    if(!allowed||active.size>=(queries.has(col)?2:1))reject('REQUEST_ORDER');
    if(col!=='authAccessReadModels'&&!readTime)reject('SNAPSHOT_REQUIRED');
    const cost=queries.has(col)?51:1;
    if(reserved+1>config.maxAttempts||slots+cost>config.maxSlots)reject('BUDGET');
    actorStart??=n;
    const remaining=Math.min(5000,config.end-n,30000-(n-actorStart));
    const ticket=freeze({sequence:reserved+1,actor:index,collection:col,slots:cost,
      timeoutMs:remaining,request:request(actors[index],col,readTime)});
    seen.add(col);reserved++;slots+=cost;active.set(ticket,{col,deadline:n+remaining});
    return ticket;
  }
  // Adapter must report actual terminal outcome. This is accounting only;
  // never infer cancellation, billing or backend completion from this API.
  function settle(ticket,outcome,timestamp=null){
    const entry=active.get(ticket);
    if(!entry)reject('UNKNOWN_TICKET');
    if(!['completed','failed','unknown'].includes(outcome))reject('OUTCOME_INVALID');
    if(!blocker){
      try{const n=time();if(n>=entry.deadline)stop('RPC_DEADLINE');}catch{}
    }
    active.delete(ticket);
    if(outcome==='failed'){failed++;stop('TRANSPORT_FAILURE');return;}
    if(outcome==='unknown'){unknown++;stop('TRANSPORT_UNKNOWN');return;}
    completed++;
    if(blocker)return; // late completion accounted for, never accepted
    if(!readTimeOk(timestamp)||(readTime&&!sameTime(readTime,timestamp))){
      stop('SNAPSHOT_INVALID');return;
    }
    readTime??=stamp(timestamp);
    done.add(entry.col);
    if(done.size===7&&active.size===0){
      index++;seen.clear();done.clear();actorStart=null;readTime=null;
    }
  }
  function abort(){stop('OPERATOR_ABORT');}
  function report(){return freeze({scope:'synthetic-only',executableReady:false,
    status:blocker?(active.size?'STOP_DRAIN_REQUIRED':'STOPPED'):index===actors.length?'DESCRIPTORS_COMPLETE':'PENDING',
    code:blocker,completedActors:index,plannedActors:actors.length,reservedAttempts:reserved,reservedSlots:slots,
    completed,failed,unknown,inFlight:active.size});}
  return Object.freeze({reserve,settle,abort,report});
}
