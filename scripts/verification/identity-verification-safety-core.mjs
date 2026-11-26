// B02-R1A: synthetic fixtures only; no network, SDK or live transport.
const own=(x,k)=>Object.hasOwn(x,k);
const plain=x=>x!==null&&typeof x==="object"&&[Object.prototype,null].includes(Object.getPrototypeOf(x))&&Reflect.ownKeys(x).every(k=>typeof k==="string"&&Object.getOwnPropertyDescriptor(x,k).enumerable&&own(Object.getOwnPropertyDescriptor(x,k),"value"));
const arr=x=>Array.isArray(x)&&Object.getPrototypeOf(x)===Array.prototype&&x.length<=1000&&Reflect.ownKeys(x).length===x.length+1&&Array.from({length:x.length},(_,i)=>Object.getOwnPropertyDescriptor(x,String(i))).every(d=>d&&d.enumerable&&own(d,"value"));
const shape=(x,keys)=>plain(x)&&Object.keys(x).length===keys.length&&keys.every(k=>own(x,k));
const syn=x=>typeof x==="string"&&/^synthetic-[a-z0-9][a-z0-9-]{0,79}$/.test(x);
const auth=x=>typeof x==="string"&&/^auth_[a-f0-9]{32}$/.test(x);
const time=x=>Number.isSafeInteger(x)&&x>=0;
const roles=["admin","founder","schoolAdmin","teacher","parent","learningPartner"];
export const FIELD_MASKS=Object.freeze(Object.fromEntries(Object.entries({
  authAccessReadModels:["schemaVersion","authority","firebaseUid","personId","sourceAuthIdentityId","personStatus","authStatus","accessActive","globalRoles","schoolAdminOrganisationIds","updatedAt"],
  authIdentities:["authIdentityId","personId","provider","providerSubject","status"],
  people:["personId","status"],
  roleAssignments:["roleAssignmentId","personId","role","scopeType","scopeId","status"],
  organisationMemberships:["organisationMembershipId","organisationId","personId","role","status"],
  users:["role","roles","superUser","status"],
  schoolUsers:["status","role","schoolIds"]
}).map(([k,v])=>[k,Object.freeze(v)])));
const collections=Object.keys(FIELD_MASKS),queries=["roleAssignments","organisationMemberships"],points=collections.filter(x=>!queries.includes(x));
const scalar=v=>v===null||typeof v==="string"&&v.length<=500||typeof v==="boolean"||Number.isSafeInteger(v);
const copy=v=>Array.isArray(v)?Object.freeze([...v]):v;
const clean=()=>({attempts:0,reservedSlots:0,returned:0});
function project(row,col){
  if(!plain(row))throw Error("FIXTURE_SHAPE");
  const out={};
  for(const k of FIELD_MASKS[col])if(own(row,k)){
    const v=row[k];if(!(scalar(v)||arr(v)&&v.every(scalar)))throw Error("FIELD_SHAPE");
    out[k]=copy(v);
  }
  return Object.freeze(out);
}
function actorValid(a){
  return shape(a,["uid","personId","authIdentityId","role","organisationId","legacySchoolId"])&&syn(a.uid)&&syn(a.personId)&&auth(a.authIdentityId)&&roles.includes(a.role)&&(a.role==="schoolAdmin"?syn(a.organisationId)&&syn(a.legacySchoolId):a.organisationId===null&&a.legacySchoolId===null);
}
const keyFor=(a,col)=>col==="authIdentities"?a.authIdentityId:col==="people"?a.personId:a.uid;
const exactList=(a,b)=>arr(a)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
export async function verifySyntheticActors({plan,fixtures,sampler,clock}={}){
  const counts=clean();let completed=0,planned=0,previousTime=-1,blocking=null;
  const stop=code=>{if(blocking===null)blocking=code;throw Error("GUARD_STOP");};
  const result=code=>Object.freeze({valid:code===null,executableReady:false,scope:"synthetic-only",verdict:code===null?"SYNTHETIC_SAMPLE_MATCH":"STOPPED",code,counts:Object.freeze({...counts}),completedActors:completed,plannedActors:planned,consistency:"non_atomic_fixture_only"});
  if(!shape(plan,["scope","actors","startMs","endMs","maxAgeMs","maxAttempts","maxSlots"])||plan.scope!=="synthetic-only"||!arr(plan.actors)||plan.actors.length<1||plan.actors.length>10||!plan.actors.every(actorValid)||!time(plan.startMs)||!time(plan.endMs)||plan.endMs<=plan.startMs||plan.endMs-plan.startMs>600000||!time(plan.maxAgeMs)||plan.maxAgeMs===0||plan.maxAttempts!==plan.actors.length*7||plan.maxSlots!==plan.actors.length*107||typeof sampler!=="function"||typeof clock!=="function")return result("PLAN_SHAPE");
  planned=plan.actors.length;
  for(const k of ["uid","personId","authIdentityId"])if(new Set(plan.actors.map(a=>a[k])).size!==planned)return result("DUPLICATE_ACTOR");
  if(!arr(fixtures)||fixtures.length!==planned||!fixtures.every(f=>shape(f,collections)))return result("FIXTURE_INVENTORY");
  const actors=plan.actors.map(a=>Object.freeze({...a})),config=Object.freeze({startMs:plan.startMs,endMs:plan.endMs,maxAgeMs:plan.maxAgeMs,maxAttempts:plan.maxAttempts,maxSlots:plan.maxSlots});
  let rows;
  try{rows=fixtures.map(f=>Object.freeze(Object.fromEntries(collections.map(col=>{
    const v=f[col];if(queries.includes(col)){if(!arr(v))throw Error("FIXTURE_SHAPE");return [col,Object.freeze(v.map(x=>project(x,col)))];}
    return [col,v===null?null:project(v,col)];
  }))));}catch{return result("FIXTURE_FIELDS");}
  function now(){
    if(blocking)stop(blocking);
    let n;try{n=clock();}catch{stop("CLOCK_INVALID");}
    if(!time(n)||n<previousTime)stop("CLOCK_INVALID");
    previousTime=n;if(n<config.startMs||n>=config.endMs)stop("WINDOW_CLOSED");return n;
  }
  try{now();}catch{return result(blocking??"CLOCK_INVALID");}
  for(let i=0;i<actors.length;i++){
    const a=actors[i],f=rows[i],seen=new Set(),local=clean();let projectionAge=null,closed=false;
    function active(){if(closed)throw Error("ACTOR_CLOSED");const n=now();if(projectionAge!==null&&n-projectionAge>config.maxAgeMs)stop("PROJECTION_FRESHNESS");return n;}
    async function dispatch(col){
      const n=active(),isQuery=queries.includes(col),cost=isQuery?51:1;
      if(seen.has(col))stop("REPEATED_READ");
      if(col!=="authAccessReadModels"&&!seen.has("authAccessReadModels"))stop("PROJECTION_FIRST");
      if(col==="people"&&!seen.has("authIdentities")||isQuery&&!seen.has("people")||["users","schoolUsers"].includes(col)&&!queries.every(q=>seen.has(q)))stop("READ_ORDER");
      if(local.attempts>=7||counts.attempts+1>config.maxAttempts||local.reservedSlots+cost>107||counts.reservedSlots+cost>config.maxSlots)stop("BUDGET");
      seen.add(col);local.attempts++;counts.attempts++;local.reservedSlots+=cost;counts.reservedSlots+=cost;
      const v=f[col];
      if(isQuery){
        if(v.length>51)stop("RESPONSE_BOUND");
        local.returned+=v.length;counts.returned+=v.length;
        if(v.length>50)stop("QUERY_OVERFLOW");
        if(v.some(x=>x.personId!==a.personId))stop("RESPONSE_SCOPE");
        active();return Object.freeze({size:v.length,docs:Object.freeze(v.map(x=>Object.freeze({data:()=>x})))});
      }
      if(v!==null){local.returned++;counts.returned++;}
      if(col==="authAccessReadModels"){
        if(v===null)stop("PROJECTION_MISSING");
        if(v.firebaseUid!==a.uid||v.personId!==a.personId||v.sourceAuthIdentityId!==a.authIdentityId)stop("RESPONSE_SCOPE");
        const t=v.updatedAt;if(!time(t)||t>n||n-t>config.maxAgeMs)stop("PROJECTION_FRESHNESS");
        projectionAge=t;if(v.accessActive!==true||v.personStatus!=="active"||v.authStatus!=="active")stop("PROJECTION_INACTIVE");
        if(!exactList(v.globalRoles,a.role==="schoolAdmin"?[]:[a.role])||!exactList(v.schoolAdminOrganisationIds,a.role==="schoolAdmin"?[a.organisationId]:[]))stop("PROJECTION_ROLE_SCOPE");
      }
      if(col==="authIdentities"&&(v===null||v.authIdentityId!==a.authIdentityId||v.personId!==a.personId||v.providerSubject!==a.uid))stop("RESPONSE_SCOPE");
      if(col==="people"&&(v===null||v.personId!==a.personId))stop("RESPONSE_SCOPE");
      active();
      const data=col==="authAccessReadModels"&&v!==null?Object.freeze({...v,updatedAt:Object.freeze({toMillis:()=>projectionAge})}):v;
      return Object.freeze({exists:v!==null,data:()=>data});
    }
    const db=Object.freeze({collection(col){
      active();
      if(points.includes(col))return Object.freeze({doc(key){active();if(key!==keyFor(a,col))stop("PATH_NOT_APPROVED");return Object.freeze({get:()=>dispatch(col)});}});
      if(queries.includes(col))return Object.freeze({where(field,op,value){active();if(field!=="personId"||op!=="=="||value!==a.personId)stop("QUERY_NOT_APPROVED");return Object.freeze({limit(n){active();if(n!==51)stop("QUERY_LIMIT");return Object.freeze({get:()=>dispatch(col)});}});}});
      stop("COLLECTION_NOT_APPROVED");
    }});
    try{
      const n=now(),report=await sampler({db,actors:[{uid:a.uid,role:a.role,organisationId:a.organisationId,legacySchoolId:a.legacySchoolId}],nowMs:n,maxAgeMs:config.maxAgeMs});
      const end=now();
      if(!plain(report)||!arr(report.results)||report.results.length!==1||report.evidenceKind!=="operator_sample_not_browser_authorization"||report.milestoneComplete!==false||report.measuredProductionBilledReads!==null)stop("REPORT_SHAPE");
      if(projectionAge===null||end-projectionAge>config.maxAgeMs)stop("PROJECTION_FRESHNESS");
      const x=report.results[0];
      if(!plain(x)||x.actor!==1||x.role!==a.role||!arr(x.issues)||x.issues.length||x.status!=="SAMPLED_FIELDS_MATCH"||x.projectionAge!=="within_review_threshold")stop("SAMPLER_REVIEW_REQUIRED");
      if(seen.size!==7||local.attempts!==7||x.sdkGetAttempts!==local.attempts||x.sdkGetCompleted!==local.attempts||x.documentsReturned!==local.returned)stop("INCOMPLETE_SAMPLE");
      completed++;
    }catch{return result(blocking??"SAMPLER_FAILURE");}
    finally{closed=true;}
  }
  return result(null);
}
