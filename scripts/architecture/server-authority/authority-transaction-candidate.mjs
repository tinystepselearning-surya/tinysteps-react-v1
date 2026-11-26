// Dormant candidate only. No Firestore client construction, credentials or callable registration.
// The host is a trusted, private server composition dependency, never request data.
// A real single-attempt Firestore transaction port and verified auth integration are
// still required. Until then, do not adopt the candidate schema or expose this service.
import {createRequire} from 'node:module';
import {buildAuthIdentityId} from '../../../functions/src/schoolOS/identity/idStrategy.ts';
import {ACTION,validId,validName,exactData,parseCampusRequest,recordKey,campusIdentity} from './campus-contract-candidate.mjs';
import {timestampParts,compareTimestamps,intervalContains,verifyDecisionTimes} from './timestamp-boundary-candidate.mjs';
const require=createRequire(new URL('../../../functions/package.json',import.meta.url));
const {Timestamp,FieldValue}=require('firebase-admin/firestore');
const AUDIT=['schemaVersion','createdAt','updatedAt','createdBy','updatedBy'];
const specs=Object.freeze({
 TEN:['tsosV2Tenants',['tenantId','name','status']],
 OTB:['tsosV2OrganisationTenantBindings',['organisationId','tenantId','status','revision']],
 TMB:['tsosV2TenantMemberships',['tenantMembershipId','tenantId','personId','status','effectiveStartAt','effectiveEndAt']],
 MEM:['tsosV2OrganisationMemberships',['organisationMembershipId','organisationId','personId','role','status','isPrimary','effectiveStartAt','effectiveEndAt','tenantId']],
 VGR:['tsosV2AuthorityGrants',['grantId','tenantId','organisationId','personId','roleKey','action','status','effectiveStartAt','effectiveEndAt','revision']],
 AFN:['tsosV2AuthorityFences',['tenantId','generation']],
 AOR:['tsosV2ActionRoutes',['tenantId','action','lane','epoch']],
 CAM:['tsosV2Campuses',['campusId','tenantId','organisationId','name','timeZone','status','revision']],
 OCR:['tsosV2OperationReceipts',['receiptKey','tenantId','actorPersonId','action','semanticHash','campusId','committedRevision']]
});
const goodInt=n=>Number.isSafeInteger(n)&&n>0;
const boundedCounter=n=>goodInt(n)&&n<Number.MAX_SAFE_INTEGER;
const digest=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const status=s=>Object.freeze({status:s});
class Rejected extends Error {}
const check=ok=>{if(!ok)throw new Rejected('DENIED')};
function fields(value,expected){
 if(value===null||typeof value!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw new Rejected('DENIED');
 const result={};for(const name of expected){const d=Object.getOwnPropertyDescriptor(value,name);check(d?.enumerable&&Object.hasOwn(d,'value'));result[name]=d.value}
 return result;
}
function v2(code,value){
 const r=exactData(value,[...specs[code][1],...AUDIT]);check(r&&r.schemaVersion===1&&validId(r.createdBy)&&validId(r.updatedBy));
 timestampParts(r.createdAt);timestampParts(r.updatedAt);check(compareTimestamps(r.createdAt,r.updatedAt)<=0);
 return r;
}
function binding(code,parts){return specs[code][0]+'/'+recordKey(code,parts)}
function pointReader(tx,cap){
 let count=0;
 return async path=>{check(++count<=cap);return await tx.get(path)};
}
function scope(r,tenant,org,person){check(r.tenantId===tenant&&(org===undefined||r.organisationId===org)&&(person===undefined||r.personId===person))}
function interval(r,at){check(intervalContains(r.effectiveStartAt,r.effectiveEndAt,at));return {start:r.effectiveStartAt,end:r.effectiveEndAt}}
function grant(r,key,tenant,org,person){
 scope(r,tenant,org,person);check(r.grantId===key&&r.roleKey==='campusCreator'&&r.action===ACTION&&goodInt(r.revision)&&['active','revoked'].includes(r.status));
 timestampParts(r.effectiveStartAt);if(r.effectiveEndAt!==null)check(compareTimestamps(r.effectiveStartAt,r.effectiveEndAt)<0);
}
function stamp(actor){const t=FieldValue.serverTimestamp();return {schemaVersion:1,createdAt:t,updatedAt:t,createdBy:actor,updatedBy:actor}}
function committed(campusId){return Object.freeze({status:'committed',campusId,revision:1})}
async function evidence(read,auth,p,at){
 const uid=auth.uid;check(validId(uid));
 const authKey=buildAuthIdentityId('firebase',uid);
 const a=fields(await read('authIdentities/'+authKey),['schemaVersion','authIdentityId','personId','provider','providerSubject','status']);
 check(a.schemaVersion===1&&a.authIdentityId===authKey&&a.provider==='firebase'&&a.providerSubject===uid&&a.status==='active'&&validId(a.personId));
 const actor=a.personId,t=p.tenantId,o=p.organisationId;
 const person=fields(await read('people/'+actor),['schemaVersion','personId','status']);
 check(person.schemaVersion===1&&person.personId===actor&&person.status==='active');
 const tenant=v2('TEN',await read(binding('TEN',[t])));scope(tenant,t);check(tenant.status==='active'&&typeof tenant.name==='string'&&tenant.name.isWellFormed()&&tenant.name.trim().length>0);
 const org=fields(await read('organisations/'+o),['schemaVersion','organisationId','type','status']);
 check(org.schemaVersion===1&&org.organisationId===o&&org.status==='active'&&['school','company'].includes(org.type));
 const owner=v2('OTB',await read(binding('OTB',[o])));scope(owner,t,o);check(owner.status==='active'&&goodInt(owner.revision));
 const tm=v2('TMB',await read(binding('TMB',[t,actor])));scope(tm,t,undefined,actor);check(tm.tenantMembershipId===recordKey('TMB',[t,actor])&&tm.status==='active');const i1=interval(tm,at);
 const om=v2('MEM',await read(binding('MEM',[t,o,actor,'member'])));scope(om,t,o,actor);check(om.organisationMembershipId===recordKey('MEM',[t,o,actor,'member'])&&om.status==='active'&&om.role==='member'&&typeof om.isPrimary==='boolean');const i2=interval(om,at);
 const g=v2('VGR',await read(binding('VGR',[t,o,actor,ACTION])));grant(g,recordKey('VGR',[t,o,actor,ACTION]),t,o,actor);check(g.status==='active');const i3=interval(g,at);
 const f=v2('AFN',await read(binding('AFN',[t])));scope(f,t);check(goodInt(f.generation));
 const route=v2('AOR',await read(binding('AOR',[t,ACTION])));scope(route,t);check(route.action===ACTION&&route.lane==='successor'&&goodInt(route.epoch));
 check(auth.expectedGeneration===null||auth.expectedGeneration===f.generation);
 check(auth.expectedEpoch===null||auth.expectedEpoch===route.epoch);
 return {actor,intervals:[i1,i2,i3]};
}
function receiptState(raw,p,actor,identity){
 if(raw===null)return null;
 const r=v2('OCR',raw);scope(r,p.tenantId);
 check(r.receiptKey===identity.receiptKey&&r.actorPersonId===actor&&r.action===ACTION&&digest(r.semanticHash)&&validId(r.campusId)&&r.committedRevision===1);
 return r;
}
function matchingCampus(raw,p,identity){
 if(raw===null)return false;
 const r=v2('CAM',raw);scope(r,p.tenantId,p.organisationId);
 return r.campusId===identity.campusId&&r.name===p.name&&validName(r.name)&&r.timeZone===p.timeZone&&r.status==='active'&&r.revision===1;
}
// One trusted port callback, one transaction attempt. get returns a stored plain object
// or null; create/update synchronously stage transaction writes, not independent RPCs.
// The future concrete adapter must enforce create preconditions and transaction read
// preconditions, maxAttempts=1, read/write bounds, and commit acknowledgment.
export function createAuthorityTransactionCandidate(host){
 const {runOnce,resolveVerifiedAuth,resolveProvisioner}=host;
 check([runOnce,resolveVerifiedAuth,resolveProvisioner].every(fn=>typeof fn==='function'));
 const dispatchLimitNs=5_000_000_000n; // fixed candidate dispatch bound; not commit-time guarantee
 async function command(mode,context,raw){
  let staged=false,attempts=0;
  try{
   const p=parseCampusRequest(raw);check(p);
   const a=exactData(await resolveVerifiedAuth(context),['uid','expectedGeneration','expectedEpoch']);
   check(a&&validId(a.uid)&&(a.expectedGeneration===null||goodInt(a.expectedGeneration))&&(a.expectedEpoch===null||goodInt(a.expectedEpoch)));
   const started=process.hrtime.bigint();
   return await runOnce(async tx=>{
    check(++attempts===1);const first=Timestamp.now(),read=pointReader(tx,12);
    const e=await evidence(read,a,p,first),id=campusIdentity(p,e.actor);
    const receiptPath=specs.OCR[0]+'/'+id.receiptKey,campusPath=specs.CAM[0]+'/'+id.campusId;
    const stillAuthorized=()=>check(verifyDecisionTimes({first,second:Timestamp.now(),elapsedNs:process.hrtime.bigint()-started,dispatchLimitNs,intervals:e.intervals}));
    const rr=await read(receiptPath);let receipt;
    try{receipt=receiptState(rr,p,e.actor,id)}catch{stillAuthorized();return status('integrity-denied')}
    if(receipt&&receipt.semanticHash!==id.semanticHash){stillAuthorized();return status('conflict')}
    if(receipt&&receipt.campusId!==id.campusId){stillAuthorized();return status('integrity-denied')}
    const target=await read(campusPath);
    let consistent=true;
    if(receipt){try{consistent=matchingCampus(target,p,id)}catch{consistent=false}}
    else if(target!==null)consistent=false;
    stillAuthorized();
    if(!consistent)return status('integrity-denied');
    if(receipt)return committed(id.campusId);
    if(mode==='recover')return status('indeterminate');
    const audit=stamp(e.actor);staged=true;
    tx.create(campusPath,{...audit,campusId:id.campusId,tenantId:p.tenantId,organisationId:p.organisationId,name:p.name,timeZone:p.timeZone,status:'active',revision:1});
    tx.create(receiptPath,{...audit,receiptKey:id.receiptKey,tenantId:p.tenantId,actorPersonId:e.actor,action:ACTION,semanticHash:id.semanticHash,campusId:id.campusId,committedRevision:1});
    return committed(id.campusId);
   });
  }catch{return status(staged?'indeterminate':'denied')}
 }
 async function revoke(context,raw){
  let staged=false,attempts=0;
  try{
   const p=exactData(raw,['tenantId','organisationId','personId','expectedGrantRevision','expectedGeneration']);
   check(p&&[p.tenantId,p.organisationId,p.personId].every(validId)&&boundedCounter(p.expectedGrantRevision)&&boundedCounter(p.expectedGeneration));
   const a=exactData(await resolveProvisioner(context),['actorId','tenantId','organisationId','personId']);
   check(a&&validId(a.actorId)&&a.tenantId===p.tenantId&&a.organisationId===p.organisationId&&a.personId===p.personId);
   const started=process.hrtime.bigint();
   return await runOnce(async tx=>{
    check(++attempts===1);const first=Timestamp.now(),read=pointReader(tx,2),parts=[p.tenantId,p.organisationId,p.personId,ACTION];
    const gp=binding('VGR',parts),fp=binding('AFN',[p.tenantId]);
    const g=v2('VGR',await read(gp));grant(g,recordKey('VGR',parts),p.tenantId,p.organisationId,p.personId);
    check(g.status==='active'&&g.revision===p.expectedGrantRevision);
    const f=v2('AFN',await read(fp));scope(f,p.tenantId);check(f.generation===p.expectedGeneration);
    const second=Timestamp.now();check(compareTimestamps(first,second)<=0&&process.hrtime.bigint()-started<dispatchLimitNs);
    const audit={updatedBy:a.actorId,updatedAt:FieldValue.serverTimestamp()};staged=true;
    tx.update(gp,{...audit,status:'revoked',revision:g.revision+1});
    tx.update(fp,{...audit,generation:f.generation+1});
    return status('revoked');
   });
  }catch{return status(staged?'indeterminate':'denied')}
 }
 return Object.freeze({execute:(context,request)=>command('execute',context,request),recover:(context,request)=>command('recover',context,request),revoke});
}
