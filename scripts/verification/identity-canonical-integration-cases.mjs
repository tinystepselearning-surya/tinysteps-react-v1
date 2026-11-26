// Independently specified synthetic fixtures; real compiled canonical functions.
export async function canonicalIntegrationCases({verify,sampler,ids,canonical,authorization}){
  const out=[],roles=["admin","founder","teacher","parent","learningPartner","schoolAdmin"];
  function make(selected){
    const actors=selected.map((role,i)=>({uid:"synthetic-uid-"+i,personId:"synthetic-person-"+i,authIdentityId:ids.buildAuthIdentityId("firebase","synthetic-uid-"+i),role,organisationId:role==="schoolAdmin"?"synthetic-org-"+i:null,legacySchoolId:role==="schoolAdmin"?"synthetic-school-"+i:null}));
    const fixtures=actors.map(a=>{
      const school=a.role==="schoolAdmin";
      return {
        authAccessReadModels:{schemaVersion:1,authority:"canonical-derived",firebaseUid:a.uid,personId:a.personId,sourceAuthIdentityId:a.authIdentityId,personStatus:"active",authStatus:"active",accessActive:true,globalRoles:school?[]:[a.role],schoolAdminOrganisationIds:school?[a.organisationId]:[],updatedAt:950,privateNote:"synthetic-private-value"},
        authIdentities:{authIdentityId:a.authIdentityId,personId:a.personId,provider:"firebase",providerSubject:a.uid,status:"active"},
        people:{personId:a.personId,status:"active",privateNote:"synthetic-private-value"},
        roleAssignments:[{roleAssignmentId:ids.buildRoleAssignmentId({personId:a.personId,role:a.role,scopeType:school?"organisation":"global",scopeId:a.organisationId}),personId:a.personId,role:a.role,scopeType:school?"organisation":"global",scopeId:a.organisationId,status:"active"}],
        organisationMemberships:school?[{organisationMembershipId:ids.buildOrganisationMembershipId({organisationId:a.organisationId,personId:a.personId,role:a.role}),organisationId:a.organisationId,personId:a.personId,role:a.role,status:"active"}]:[],
        users:{role:a.role,status:"active"},schoolUsers:school?{status:"active",role:"schoolAdmin",schoolIds:[a.legacySchoolId]}:null
      };
    });
    return {plan:{scope:"synthetic-only",actors,startMs:1000,endMs:2000,maxAgeMs:100,maxAttempts:actors.length*7,maxSlots:actors.length*107},fixtures};
  }
  async function check(name,fn){try{if(!await fn())throw Error("assertion failed");out.push({name,pass:true});}catch(e){out.push({name,pass:false,error:String(e.message)});}}
  const run=async(mutate=()=>{},selected=["parent","teacher"],wrap=x=>x)=>{const x=make(selected);mutate(x);return verify({...x,sampler:wrap(sampler),clock:()=>1000});};
  const bad=async(name,mutate,code,attempts,selected)=>check(name,async()=>{const x=await run(mutate,selected);return !x.valid&&!x.executableReady&&x.completedActors===0&&x.code===code&&(attempts===undefined||x.counts.attempts===attempts);});
  await check("canonical auth ID golden vector",()=>ids.buildAuthIdentityId("firebase","synthetic-uid-0")==="auth_38f97af052f2318e054b7e7a8d3cc16f");
  await check("separate person and login ID",()=>{const x=make(["parent"]);return x.plan.actors[0].uid!==x.plan.actors[0].personId&&x.fixtures[0].authIdentities.personId===x.plan.actors[0].personId;});
  for(const role of roles)await check("actual sampler accepts controlled "+role,async()=>{const x=await run(()=>{},[role]);return x.valid&&!x.executableReady&&x.completedActors===1&&x.counts.attempts===7&&x.counts.reservedSlots===107&&x.counts.returned===(role==="schoolAdmin"?7:5);});
  await check("six roles bounded cohort",async()=>{const x=await run(()=>{},roles);return x.valid&&x.completedActors===6&&x.counts.attempts===42&&x.counts.reservedSlots===642&&x.counts.returned===32;});
  await check("actual global authorization helper",()=>{const f=make(["teacher"]).fixtures[0].authAccessReadModels,p=authorization.parseCurrentAuthAccessPrincipal({documentId:f.firebaseUid,data:f});return authorization.principalHasGlobalRole(p,"teacher")&&!authorization.principalHasGlobalRole(p,"admin")&&!authorization.principalHasSchoolAdminAccess(p,"synthetic-org-other");});
  await check("actual school helper denies other organisation",()=>{const f=make(["schoolAdmin"]).fixtures[0].authAccessReadModels,p=authorization.parseCurrentAuthAccessPrincipal({documentId:f.firebaseUid,data:f});return authorization.principalHasSchoolAdminAccess(p,f.schoolAdminOrganisationIds[0])&&!authorization.principalHasSchoolAdminAccess(p,"synthetic-other-org")&&!authorization.principalHasGlobalRole(p,"admin");});
  await check("actual inactive principal denies grant",()=>{const f=make(["teacher"]).fixtures[0].authAccessReadModels,p=authorization.parseCurrentAuthAccessPrincipal({documentId:f.firebaseUid,data:{...f,personStatus:"suspended",accessActive:false}});return !authorization.principalHasGlobalRole(p,"teacher");});
  await bad("wrong derived auth ID denied before auth read",x=>{const a=x.plan.actors[0],f=x.fixtures[0];a.authIdentityId="auth_"+"f".repeat(32);f.authAccessReadModels.sourceAuthIdentityId=a.authIdentityId;f.authIdentities.authIdentityId=a.authIdentityId;},"PATH_NOT_APPROVED",1);
  await bad("wrong projection authority",x=>x.fixtures[0].authAccessReadModels.authority="synthetic","SAMPLER_REVIEW_REQUIRED",7);
  await bad("wrong projection schema",x=>x.fixtures[0].authAccessReadModels.schemaVersion=2,"SAMPLER_REVIEW_REQUIRED",7);
  await bad("invalid auth provider",x=>x.fixtures[0].authIdentities.provider="other","SAMPLER_REVIEW_REQUIRED",2);
  await bad("invalid person status",x=>x.fixtures[0].people.status="unknown","SAMPLER_REVIEW_REQUIRED",3);
  await bad("disabled auth source",x=>x.fixtures[0].authIdentities.status="disabled","SAMPLER_REVIEW_REQUIRED",7);
  await bad("suspended person source",x=>x.fixtures[0].people.status="suspended","SAMPLER_REVIEW_REQUIRED",7);
  await bad("inactive canonical role",x=>x.fixtures[0].roleAssignments[0].status="inactive","SAMPLER_REVIEW_REQUIRED",7);
  await bad("missing canonical role",x=>x.fixtures[0].roleAssignments=[],"SAMPLER_REVIEW_REQUIRED",7);
  await bad("extra active canonical role",x=>{const a=x.plan.actors[0];x.fixtures[0].roleAssignments.push({roleAssignmentId:ids.buildRoleAssignmentId({personId:a.personId,role:"admin",scopeType:"global"}),personId:a.personId,role:"admin",scopeType:"global",scopeId:null,status:"active"});},"SAMPLER_REVIEW_REQUIRED",7);
  await bad("unknown role rejected",x=>x.fixtures[0].roleAssignments[0].role="unknown","SAMPLER_REVIEW_REQUIRED",5);
  await bad("invalid scope rejected",x=>x.fixtures[0].roleAssignments[0].scopeType="tenant","SAMPLER_REVIEW_REQUIRED",5);
  await bad("missing school membership",x=>x.fixtures[0].organisationMemberships=[],"SAMPLER_REVIEW_REQUIRED",7,["schoolAdmin","parent"]);
  await bad("inactive school membership",x=>x.fixtures[0].organisationMemberships[0].status="inactive","SAMPLER_REVIEW_REQUIRED",7,["schoolAdmin","parent"]);
  await bad("school role scope mismatch",x=>x.fixtures[0].roleAssignments[0].scopeId="synthetic-other-org","SAMPLER_REVIEW_REQUIRED",7,["schoolAdmin","parent"]);
  await bad("school membership other organisation",x=>x.fixtures[0].organisationMemberships[0].organisationId="synthetic-other-org","SAMPLER_REVIEW_REQUIRED",7,["schoolAdmin","parent"]);
  await bad("legacy school mismatch",x=>x.fixtures[0].schoolUsers.schoolIds=["synthetic-other-school"],"SAMPLER_REVIEW_REQUIRED",7,["schoolAdmin","parent"]);
  await bad("legacy superuser discrepancy",x=>x.fixtures[0].users.superUser=true,"SAMPLER_REVIEW_REQUIRED",7);
  await bad("stale projection stops before source reads",x=>x.fixtures[0].authAccessReadModels.updatedAt=899,"PROJECTION_FRESHNESS",1);
  await bad("foreign canonical query row",x=>x.fixtures[0].roleAssignments[0].personId=x.plan.actors[1].personId,"RESPONSE_SCOPE",4);
  await bad("first parallel query overflow",x=>x.fixtures[0].roleAssignments=Array.from({length:51},()=>x.fixtures[0].roleAssignments[0]),"QUERY_OVERFLOW",4);
  await bad("second parallel query overflow",x=>x.fixtures[0].organisationMemberships=Array.from({length:51},()=>({personId:x.plan.actors[0].personId})),"QUERY_OVERFLOW",5);
  await check("first actor completes before second revocation",async()=>{const x=await run(f=>f.fixtures[1].authIdentities.status="disabled");return !x.valid&&x.completedActors===1&&x.counts.attempts===14&&x.code==="SAMPLER_REVIEW_REQUIRED";});
  await check("actual loader receives projected fields only",async()=>{let saw=false;const x=await run(()=>{},["parent"],original=>async args=>{const db=args.db;const wrapped={collection(col){const ref=db.collection(col);if(col!=="people")return ref;return {doc(key){const d=ref.doc(key);return {async get(){const snap=await d.get();saw=Object.keys(snap.data()).sort().join(",")==="personId,status";return snap;}};}};}};return original({...args,db:wrapped});});return x.valid&&saw&&!JSON.stringify(x).includes("synthetic-private-value");});
  await check("actual builder rejects mismatched ID",()=>{try{canonical.buildAuthAccessReadModel({firebaseUid:"synthetic-uid-0",person:{personId:"synthetic-person-0",status:"active"},authIdentity:{authIdentityId:"auth_"+"0".repeat(32),personId:"synthetic-person-0",provider:"firebase",providerSubject:"synthetic-uid-0",status:"active"},roleAssignments:[],organisationMemberships:[]});return false;}catch(e){return e.message==="auth_identity_id_mismatch";}});
  return out;
}
