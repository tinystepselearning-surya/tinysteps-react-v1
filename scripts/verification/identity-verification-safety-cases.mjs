import {verifySyntheticActors,FIELD_MASKS} from "./identity-verification-safety-core.mjs";
// Test dependencies only; not the actual canonical loader/parser.
export function samplerFromSource(source,dependencies){
  const start=source.indexOf("const roles =");if(start<0)throw Error("sampler source shape");
  return new Function("loadCanonicalAuthAccessInput","buildAuthAccessReadModel","parseCurrentAuthAccessPrincipal",source.slice(start).replace("export async function auditApprovedPrincipals","async function auditApprovedPrincipals")+"\nreturn auditApprovedPrincipals;")(...dependencies);
}
const make=(n=2)=>{
  const actors=Array.from({length:n},(_,i)=>({uid:"synthetic-uid-"+i,personId:"synthetic-person-"+i,authIdentityId:"auth_"+String(i+1).padStart(32,"0"),role:"parent",organisationId:null,legacySchoolId:null}));
  const fixtures=actors.map(a=>({
    authAccessReadModels:{schemaVersion:1,authority:"synthetic",firebaseUid:a.uid,personId:a.personId,sourceAuthIdentityId:a.authIdentityId,personStatus:"active",authStatus:"active",accessActive:true,globalRoles:[a.role],schoolAdminOrganisationIds:[],updatedAt:950,privateNote:"synthetic-private-value"},
    authIdentities:{authIdentityId:a.authIdentityId,personId:a.personId,provider:"firebase",providerSubject:a.uid,status:"active"},
    people:{personId:a.personId,status:"active",privateNote:"synthetic-private-value"},
    roleAssignments:[{roleAssignmentId:"synthetic-role",personId:a.personId,role:a.role,scopeType:"global",scopeId:null,status:"active"}],
    organisationMemberships:[],users:{role:a.role,status:"active"},schoolUsers:null
  }));
  return {plan:{scope:"synthetic-only",actors,startMs:1000,endMs:2000,maxAgeMs:100,maxAttempts:n*7,maxSlots:n*107},fixtures};
};
function dependencies(actors){
  return [async({db,firebaseUid})=>{
    const a=actors.find(x=>x.uid===firebaseUid);
    const auth=(await db.collection("authIdentities").doc(a.authIdentityId).get()).data();
    const person=(await db.collection("people").doc(auth.personId).get()).data();
    const [roles,members]=await Promise.all(["roleAssignments","organisationMemberships"].map(c=>db.collection(c).where("personId","==",person.personId).limit(51).get()));
    return {input:{firebaseUid,person,auth,roles:roles.docs.map(x=>x.data()),members:members.docs.map(x=>x.data())}};
  },x=>({firebaseUid:x.firebaseUid,personId:x.person.personId,personStatus:x.person.status,authStatus:x.auth.status,accessActive:x.person.status==="active"&&x.auth.status==="active",sourceAuthIdentityId:x.auth.authIdentityId,globalRoles:x.roles.filter(r=>r.scopeType==="global"&&r.status==="active").map(r=>r.role),schoolAdminOrganisationIds:x.members.filter(m=>m.role==="schoolAdmin"&&m.status==="active"&&x.roles.some(r=>r.role==="schoolAdmin"&&r.status==="active"&&r.scopeId===m.organisationId)).map(m=>m.organisationId)}),({data})=>data];
}
function school(x){
  const a=x.plan.actors[0],f=x.fixtures[0];a.role="schoolAdmin";a.organisationId="synthetic-org";a.legacySchoolId="synthetic-school";
  f.authAccessReadModels.globalRoles=[];f.authAccessReadModels.schoolAdminOrganisationIds=[a.organisationId];
  Object.assign(f.roleAssignments[0],{role:a.role,scopeType:"organisation",scopeId:a.organisationId});
  f.organisationMemberships=[{organisationMembershipId:"synthetic-member",personId:a.personId,organisationId:a.organisationId,role:a.role,status:"active"}];
  f.users.role=a.role;f.schoolUsers={status:"active",role:a.role,schoolIds:[a.legacySchoolId]};
}
export async function safetyCases(source){
  const out=[];
  async function check(name,fn){try{if(!await fn())throw Error("assertion failed");out.push({name,pass:true});}catch(e){out.push({name,pass:false,error:String(e.message)});}}
  const run=async(mutate=()=>{},wrap=x=>x,clock=()=>1000,n=2)=>{
    const input=make(n);mutate(input);
    return verifySyntheticActors({...input,sampler:wrap(samplerFromSource(source,dependencies(input.plan.actors))),clock});
  };
  const bad=async(name,mutate,code,attempts)=>check(name,async()=>{const x=await run(mutate);return !x.valid&&!x.executableReady&&x.code===code&&(attempts===undefined||x.counts.attempts===attempts);});
  await check("original sampler with stand-in canonical dependencies",async()=>{const x=await run();return x.valid&&!x.executableReady&&x.completedActors===2&&x.counts.attempts===14&&x.counts.reservedSlots===214&&x.counts.returned===10;});
  await check("private fixture fields not exposed",async()=>{let clean=false;const x=await run(()=>{},s=>async args=>{const db=args.db;const wrapped={collection(c){const ref=db.collection(c);if(c!=="people")return ref;return {doc(k){const d=ref.doc(k);return {async get(){const snap=await d.get();clean=!Object.hasOwn(snap.data(),"privateNote");return snap;}};}};}};return s({...args,db:wrapped});});return x.valid&&clean&&!JSON.stringify(x).includes("synthetic-private-value");});
  await check("approved school context",async()=>{const x=await run(school);return x.valid&&x.completedActors===2;});
  await bad("production scope refused",x=>x.plan.scope="production","PLAN_SHAPE",0);
  await bad("non synthetic actor refused",x=>x.plan.actors[0].uid="real-user","PLAN_SHAPE",0);
  await bad("duplicate uid refused",x=>x.plan.actors[1].uid=x.plan.actors[0].uid,"DUPLICATE_ACTOR",0);
  await bad("duplicate person refused",x=>x.plan.actors[1].personId=x.plan.actors[0].personId,"DUPLICATE_ACTOR",0);
  await bad("duplicate auth identity refused",x=>x.plan.actors[1].authIdentityId=x.plan.actors[0].authIdentityId,"DUPLICATE_ACTOR",0);
  await bad("wrong attempt budget refused",x=>x.plan.maxAttempts++,"PLAN_SHAPE",0);
  await bad("wrong slot budget refused",x=>x.plan.maxSlots++,"PLAN_SHAPE",0);
  await bad("long window refused",x=>x.plan.endMs=601001,"PLAN_SHAPE",0);
  await bad("zero age threshold refused",x=>x.plan.maxAgeMs=0,"PLAN_SHAPE",0);
  await bad("missing fixture collection",x=>delete x.fixtures[1].people,"FIXTURE_INVENTORY",0);
  await bad("unexpected fixture collection",x=>x.fixtures[1].privateProfiles={},"FIXTURE_INVENTORY",0);
  await bad("invalid allowed field type",x=>x.fixtures[1].people.status={},"FIXTURE_FIELDS",0);
  await bad("missing projection",x=>x.fixtures[0].authAccessReadModels=null,"PROJECTION_MISSING",1);
  await bad("stale projection stops before sources",x=>x.fixtures[0].authAccessReadModels.updatedAt=899,"PROJECTION_FRESHNESS",1);
  await bad("future projection stops",x=>x.fixtures[0].authAccessReadModels.updatedAt=1001,"PROJECTION_FRESHNESS",1);
  await bad("missing timestamp stops",x=>delete x.fixtures[0].authAccessReadModels.updatedAt,"PROJECTION_FRESHNESS",1);
  await bad("inactive projection stops",x=>x.fixtures[0].authAccessReadModels.accessActive=false,"PROJECTION_INACTIVE",1);
  await bad("unexpected additional global role",x=>x.fixtures[0].authAccessReadModels.globalRoles.push("admin"),"PROJECTION_ROLE_SCOPE",1);
  await bad("unexpected school scope",x=>{school(x);x.fixtures[0].authAccessReadModels.schoolAdminOrganisationIds.push("synthetic-other-org");},"PROJECTION_ROLE_SCOPE",1);
  await bad("wrong legacy school scope",x=>{school(x);x.fixtures[0].schoolUsers.schoolIds=["synthetic-other-school"];},"SAMPLER_REVIEW_REQUIRED",7);
  await bad("foreign projection identity",x=>x.fixtures[0].authAccessReadModels.personId=x.plan.actors[1].personId,"RESPONSE_SCOPE",1);
  await bad("foreign auth subject",x=>x.fixtures[0].authIdentities.providerSubject=x.plan.actors[1].uid,"RESPONSE_SCOPE",2);
  await bad("foreign person response",x=>x.fixtures[0].people.personId=x.plan.actors[1].personId,"RESPONSE_SCOPE",3);
  await bad("foreign query row",x=>x.fixtures[0].roleAssignments[0].personId=x.plan.actors[1].personId,"RESPONSE_SCOPE");
  await bad("query sentinel overflow",x=>x.fixtures[0].roleAssignments=Array.from({length:51},()=>x.fixtures[0].roleAssignments[0]),"QUERY_OVERFLOW");
  await bad("query excessive response",x=>x.fixtures[0].roleAssignments=Array.from({length:52},()=>x.fixtures[0].roleAssignments[0]),"RESPONSE_BOUND");
  await bad("sampler drift stops subsequent actor",x=>x.fixtures[0].people.status="suspended","SAMPLER_REVIEW_REQUIRED",7);
  await bad("legacy role mismatch stops",x=>x.fixtures[0].users.role="teacher","SAMPLER_REVIEW_REQUIRED",7);
  await check("second actor failure retains first count",async()=>{const x=await run(z=>z.fixtures[1].authAccessReadModels.updatedAt=0);return x.completedActors===1&&x.counts.attempts===8&&x.code==="PROJECTION_FRESHNESS";});
  await check("unapproved collection denied before reads",async()=>{const x=await run(()=>{},()=>async({db})=>db.collection("privateProfiles"));return x.code==="COLLECTION_NOT_APPROVED"&&x.counts.attempts===0;});
  await check("unapproved uid denied",async()=>{const x=await run(()=>{},()=>async({db})=>db.collection("users").doc("synthetic-other").get());return x.code==="PATH_NOT_APPROVED"&&x.counts.attempts===0;});
  await check("unapproved query predicate denied",async()=>{const x=await run(()=>{},()=>async({db})=>db.collection("roleAssignments").where("role","==","parent").limit(51).get());return x.code==="QUERY_NOT_APPROVED"&&x.counts.attempts===0;});
  await check("unapproved query limit denied",async()=>{const x=await run(()=>{},()=>async({db})=>db.collection("roleAssignments").where("personId","==","synthetic-person-0").limit(50).get());return x.code==="QUERY_LIMIT"&&x.counts.attempts===0;});
  await check("projection must be first",async()=>{const x=await run(()=>{},()=>async({db})=>db.collection("users").doc("synthetic-uid-0").get());return x.code==="PROJECTION_FIRST"&&x.counts.attempts===0;});
  await check("repeat read denied",async()=>{const x=await run(()=>{},()=>async({db})=>{const d=db.collection("authAccessReadModels").doc("synthetic-uid-0");await d.get();await d.get();});return x.code==="REPEATED_READ"&&x.counts.attempts===1;});
  await check("write methods absent",async()=>{const x=await run(()=>{},s=>async args=>{if("set" in args.db.collection("users").doc(args.actors[0].uid))throw Error("write");return s(args);});return x.valid;});
  await check("closed window no reads",async()=>{const x=await run(()=>{},x=>x,()=>2000);return x.code==="WINDOW_CLOSED"&&x.counts.attempts===0;});
  await check("clock regression fails",async()=>{let n=1000;const x=await run(()=>{},x=>x,()=>n--);return x.code==="CLOCK_INVALID";});
  await check("deadline during actor stops later reads",async()=>{let count=0;const x=await run(()=>{},x=>x,()=>++count<8?1000:2000);return x.code==="WINDOW_CLOSED"&&x.counts.attempts<7;});
  await check("age expires during actor",async()=>{let count=0;const x=await run(()=>{},x=>x,()=>++count<8?1000:1051);return x.code==="PROJECTION_FRESHNESS"&&x.counts.attempts<7;});
  await check("sampler failure redacted",async()=>{const x=await run(()=>{},()=>async()=>{throw Error("synthetic-private-value");});return x.code==="SAMPLER_FAILURE"&&!JSON.stringify(x).includes("synthetic-private-value");});
  await check("malformed report refused",async()=>{const x=await run(()=>{},()=>async()=>({results:[]}));return x.code==="REPORT_SHAPE";});
  await check("incomplete count refused",async()=>{const x=await run(()=>{},s=>async a=>{const report=await s(a);report.results[0].documentsReturned++;return report;});return x.code==="INCOMPLETE_SAMPLE";});
  await check("expired actor facade refuses further reads",async()=>{let db;const x=await run(()=>{},s=>async a=>{db=a.db;return s(a);});try{db.collection("users");return false;}catch{return x.valid;}});
  await check("immutable masks and results",async()=>{const x=await run();return Object.isFrozen(x)&&Object.isFrozen(x.counts)&&Object.isFrozen(FIELD_MASKS)&&Object.isFrozen(FIELD_MASKS.users);});
  await check("10 actor cap exact",async()=>{const x=await run(()=>{},s=>s,()=>1000,10);return x.valid&&x.counts.attempts===70&&x.counts.reservedSlots===1070;});
  await check("11 actors refused",async()=>{const x=await run(()=>{},s=>s,()=>1000,11);return x.code==="PLAN_SHAPE"&&x.counts.attempts===0;});
  return out;
}
