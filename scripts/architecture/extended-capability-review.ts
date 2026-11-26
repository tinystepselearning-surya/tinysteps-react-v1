// Synthetic command/case review extension. No mutation, SDK, or live authorization.
import {createHash} from 'node:crypto';
import {parseTenantContract,parseOrganisationContract,parseCampusContract,inspectInstitutionalFixture} from './institutional-context-contracts.ts';
import {parseTenantMembership,parseOrganisationMembership,candidateTenantMembershipKey,candidateOrganisationMembershipKey} from './membership-contract-review-prototype.ts';
import {inspectCandidateCapability} from './capability-catalogue-review-prototype.ts';
import {simulateAuthorityRoute} from './authority-lane-review-prototype.ts';
type Row=Record<string,unknown>;
type Scope=Readonly<{kind:'tenant'|'organisation'|'campus';tenantId:string;organisationId:string|null;campusId:string|null}>;
type Reason='INVALID'|'SCOPE'|'STALE'|'ROUTE'|'ACTOR'|'MEMBERSHIP'|'POLICY'|'TARGET'|'DOMAIN'|'APPROVAL';
class Rejected extends Error{readonly reason:Reason;constructor(reason:Reason){super(reason);this.reason=reason;}}
function need(v:unknown,reason:Reason):asserts v{if(!v)throw new Rejected(reason);}
function row(v:unknown,keys:readonly string[],optional:readonly string[]=[]):Row{
  need(v!==null&&typeof v==='object'&&!Array.isArray(v),'INVALID');
  const p=Object.getPrototypeOf(v);need(p===Object.prototype||p===null,'INVALID');
  const own=Reflect.ownKeys(v);need(own.length<=keys.length+optional.length,'INVALID');
  const out:Row=Object.create(null);
  for(const k of own){need(typeof k==='string'&&(keys.includes(k)||optional.includes(k)),'INVALID');const d=Object.getOwnPropertyDescriptor(v,k);need(d&&d.enumerable&&Object.hasOwn(d,'value'),'INVALID');out[k]=d.value;}
  for(const k of keys)need(Object.hasOwn(out,k),'INVALID');return out;
}
function id(v:unknown):string{need(typeof v==='string'&&v.trim()===v&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(v),'INVALID');return v;}
function int(v:unknown,min:number,max=Number.MAX_SAFE_INTEGER):number{need(typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max,'INVALID');return v;}
function time(v:unknown):number{return int(v,-62135596800000,253402300799999);}
function scope(v:unknown):Scope{
  const s=row(v,['kind','tenantId'],['organisationId','campusId']);
  const tenantId=id(s.tenantId);
  if(s.kind==='tenant'){need(!Object.hasOwn(s,'organisationId')&&!Object.hasOwn(s,'campusId'),'SCOPE');return {kind:'tenant',tenantId,organisationId:null,campusId:null};}
  const organisationId=id(s.organisationId);
  if(s.kind==='organisation'){need(!Object.hasOwn(s,'campusId'),'SCOPE');return {kind:'organisation',tenantId,organisationId,campusId:null};}
  need(s.kind==='campus','SCOPE');return {kind:'campus',tenantId,organisationId,campusId:id(s.campusId)};
}
function same(a:Scope,b:Scope):boolean{return a.kind===b.kind&&a.tenantId===b.tenantId&&a.organisationId===b.organisationId&&a.campusId===b.campusId;}
function fresh(x:Row,rev:number):void{need(int(x.revision,1)===rev,'STALE');}
function window(x:Row,at:number):void{const start=time(x.start),end=time(x.end);need(x.status==='active'&&end>start&&start<=at&&at<end,'DOMAIN');}
function source(v:unknown,rev:number){const x=row(v,['documentId','record','revision']);fresh(x,rev);return {documentId:id(x.documentId),record:x.record};}
function finite(m:{status:string;effectiveStartAt?:number|null;effectiveEndAt?:number|null},at:number):boolean{
  return m.status==='active'&&typeof m.effectiveStartAt==='number'&&typeof m.effectiveEndAt==='number'&&m.effectiveStartAt<=at&&at<m.effectiveEndAt;
}
type Command=Readonly<{action:string;scope:Scope;targetId:string;operationId:string;expectedTargetRevision:number;payload:Readonly<Row>;operation:string;targetKind:string;creation:boolean;purpose:string}>;
function command(v:unknown):Command{
  const q=row(v,['action','scope','targetId','operationId','expectedTargetRevision','payload']);
  need(typeof q.action==='string','INVALID');
  const s=scope(q.scope),targetId=id(q.targetId),operationId=id(q.operationId),expectedTargetRevision=int(q.expectedTargetRevision,0);
  let payload:Row,operation:string,targetKind:string,purpose:string,creation=false;
  switch(q.action){
    case 'institution.create':{
      need(s.kind==='tenant','SCOPE');creation=true;operation='fixture.institutionCreate';targetKind='organisation';purpose='institutionProvisioning';
      const p=row(q.payload,['name','type']);
      const x=parseOrganisationContract(targetId,{organisationId:targetId,tenantId:s.tenantId,name:p.name,type:p.type,status:'active'});need(x.ok,'INVALID');
      payload={name:x.record.name,type:x.record.type};break;
    }
    case 'campus.create':{
      need(s.kind==='organisation','SCOPE');creation=true;operation='fixture.campusCreate';targetKind='campus';purpose='campusProvisioning';
      const p=row(q.payload,['name','timeZone']);
      const x=parseCampusContract(targetId,{campusId:targetId,tenantId:s.tenantId,organisationId:s.organisationId,name:p.name,timeZone:p.timeZone,status:'active'});need(x.ok,'INVALID');
      payload={name:x.record.name,timeZone:x.record.timeZone};break;
    }
    case 'institution.manageRoster':{
      need(s.kind==='organisation'||s.kind==='campus','SCOPE');operation=s.kind==='campus'?'fixture.campusRoster':'fixture.organisationRoster';targetKind='placement';purpose='rosterManagement';
      const p=row(q.payload,['learnerId','placementId','change']);need(id(p.placementId)===targetId&&p.change==='endPlacement','INVALID');
      payload={learnerId:id(p.learnerId),placementId:targetId,change:'endPlacement'};break;
    }
    case 'finance.post':{
      need(s.kind==='organisation','SCOPE');operation='fixture.financePost';targetKind='charge';purpose='financePosting';
      const p=row(q.payload,['ledgerId','chargeId','amountMinor','currency']);need(id(p.chargeId)===targetId&&p.currency==='INR','INVALID');
      payload={ledgerId:id(p.ledgerId),chargeId:targetId,amountMinor:int(p.amountMinor,1),currency:'INR'};break;
    }
    case 'partner.manageAssignedSchool':{
      need(s.kind==='organisation','SCOPE');operation='fixture.partnerManage';targetKind='partnerSchool';purpose='partnerManagement';
      const p=row(q.payload,['schoolId','change']);need(id(p.schoolId)===targetId&&p.change==='requestReview','INVALID');
      payload={schoolId:targetId,change:'requestReview'};break;
    }
    case 'platform.supportScoped':{
      need(s.kind==='tenant','SCOPE');operation='fixture.scopedSupport';targetKind='supportCase';purpose='supportCaseReview';
      const p=row(q.payload,['caseId','field']);need(id(p.caseId)===targetId&&p.field==='caseStatus','INVALID');
      payload={caseId:targetId,field:'caseStatus'};break;
    }
    default:throw new Rejected('POLICY');
  }
  need(creation?expectedTargetRevision===0:expectedTargetRevision>0,'TARGET');
  return Object.freeze({action:q.action,scope:Object.freeze(s),targetId,operationId,expectedTargetRevision,payload:Object.freeze(payload),operation,targetKind,creation,purpose});
}
// Exact canonical synthetic request fingerprint, NOT a signature or transferable proof.
// Canonical property order is fixed by command(); scope and payload contain only scalars.
function digest(q:Command,actor:string,rev:number,epoch:number,at:number):string{
  return createHash('sha256').update(JSON.stringify(['TSOS:OFFLINE:COMMAND:1',actor,rev,epoch,at,q]),'utf8').digest('hex');
}
export function fixtureCommandFingerprint(request:unknown,fence:unknown):string|null{
  try{const q=command(request),f=row(fence,['personId','at','revision','operation','epoch']);need(f.operation===q.operation,'ROUTE');return digest(q,id(f.personId),int(f.revision,1),int(f.epoch,1),time(f.at));}catch{return null;}
}
type Result=Readonly<{scope:'extended-offline-review';productionAuthorization:false;mutationPerformed:false;alternateLaneAttempt:false;result:'synthetic-v2-match'|'legacy-retained'}>|Readonly<{scope:'extended-offline-review';productionAuthorization:false;mutationPerformed:false;alternateLaneAttempt:false;result:'would-deny';reason:Reason}>;
function yes(result:'synthetic-v2-match'|'legacy-retained'):Result{return Object.freeze({scope:'extended-offline-review',productionAuthorization:false,mutationPerformed:false,alternateLaneAttempt:false,result});}
function no(reason:Reason):Result{return Object.freeze({scope:'extended-offline-review',productionAuthorization:false,mutationPerformed:false,alternateLaneAttempt:false,result:'would-deny',reason});}
export function reviewExtendedCapability(request:unknown,evidence:unknown,routePolicy:unknown,fence:unknown):Result{
  try{
    const q=command(request),s=q.scope;
    const f=row(fence,['personId','at','revision','operation','epoch']);
    const actor=id(f.personId),at=time(f.at),rev=int(f.revision,1),epoch=int(f.epoch,1);
    need(f.operation===q.operation,'ROUTE');
    const route=simulateAuthorityRoute({operation:q.operation},routePolicy,{operation:q.operation,epoch});
    need(route.kind==='route','ROUTE');if(route.lane==='v1')return yes('legacy-retained');
    const e=row(evidence,['observedAt','principal','institutional','tenantMembership','grant','target','approval','domain'],['organisationMembership']);
    need(time(e.observedAt)===at,'STALE');
    const p=row(e.principal,['personId','personStatus','authStatus','revision']);fresh(p,rev);need(id(p.personId)===actor&&p.personStatus==='active'&&p.authStatus==='active','ACTOR');
    const institutional=row(e.institutional,['tenant'],['organisation','campus']);
    const t=source(institutional.tenant,rev),tenant=parseTenantContract(t.documentId,t.record);
    need(tenant.ok&&tenant.record.tenantId===s.tenantId&&tenant.record.status==='active','SCOPE');
    if(s.kind==='tenant'){
      need(!Object.hasOwn(institutional,'organisation')&&!Object.hasOwn(institutional,'campus')&&!Object.hasOwn(e,'organisationMembership'),'SCOPE');
    }else{
      const o=source(institutional.organisation,rev),c=s.kind==='campus'?source(institutional.campus,rev):null;
      need(c!==null||!Object.hasOwn(institutional,'campus'),'SCOPE');
      const ctx=inspectInstitutionalFixture({tenant:t,organisation:o,...(c?{campus:c}:{})});
      need(ctx.ok&&ctx.record.organisation.organisationId===s.organisationId&&ctx.record.organisation.status==='active'&&(ctx.record.campus?.campusId??null)===s.campusId&&(!ctx.record.campus||ctx.record.campus.status==='active'),'SCOPE');
      const om=source(e.organisationMembership,rev),m=parseOrganisationMembership(om.documentId,om.record);
      need(m.ok&&m.value.personId===actor&&m.value.organisationId===s.organisationId&&finite(m.value,at),'MEMBERSHIP');
      const key=candidateOrganisationMembershipKey(s.organisationId,actor,m.value.role);need(key.ok&&key.value===om.documentId,'MEMBERSHIP');
    }
    const tm=source(e.tenantMembership,rev),m=parseTenantMembership(tm.documentId,tm.record);
    need(m.ok&&m.value.personId===actor&&m.value.tenantId===s.tenantId&&finite(m.value,at),'MEMBERSHIP');
    const tk=candidateTenantMembershipKey(s.tenantId,actor);need(tk.ok&&tk.value===tm.documentId,'MEMBERSHIP');
    const g=row(e.grant,['personId','scope','roleKey','policyVersion','status','start','end','revision']);fresh(g,rev);window(g,at);
    need(id(g.personId)===actor&&same(scope(g.scope),s),'ACTOR');
    const match=inspectCandidateCapability({policyVersion:g.policyVersion,roleKey:g.roleKey,capability:q.action,scope:s.kind});need(match.kind==='candidate-policy-match','POLICY');
    const target=row(e.target,['targetId','scope','kind','state','targetRevision','revision']);fresh(target,rev);
    need(id(target.targetId)===q.targetId&&same(scope(target.scope),s)&&target.kind===q.targetKind&&target.state===(q.creation?'absent':'present')&&int(target.targetRevision,0)===q.expectedTargetRevision,'TARGET');
    const a=row(e.approval,['personId','requirement','purpose','fingerprint','status','start','end','revision']);fresh(a,rev);window(a,at);
    need(id(a.personId)===actor&&a.requirement===match.rule.relationship&&a.purpose===q.purpose&&a.fingerprint===digest(q,actor,rev,epoch,at),'APPROVAL');
    const domain=row(e.domain,['targetId','scope','revision','record']);fresh(domain,rev);
    need(id(domain.targetId)===q.targetId&&same(scope(domain.scope),s),'DOMAIN');
    switch(q.action){
      case 'institution.create':case 'campus.create':{
        const d=row(domain.record,['parentId','provisioningState']);
        need(id(d.parentId)===(s.kind==='tenant'?s.tenantId:s.organisationId)&&d.provisioningState==='reservedForRequest','DOMAIN');break;
      }
      case 'institution.manageRoster':{
        const d=row(domain.record,['placementId','learnerId','placementStatus','schoolKind']);
        need(id(d.placementId)===q.targetId&&id(d.learnerId)===q.payload.learnerId&&d.placementStatus==='active'&&d.schoolKind==='owned','DOMAIN');break;
      }
      case 'finance.post':{
        const d=row(domain.record,['ledgerId','chargeId','outstandingMinor','currency','ledgerStatus','chargeStatus']);
        need(id(d.ledgerId)===q.payload.ledgerId&&id(d.chargeId)===q.targetId&&d.currency==='INR'&&d.ledgerStatus==='open'&&d.chargeStatus==='unsettled'&&int(d.outstandingMinor,1)===q.payload.amountMinor,'DOMAIN');break;
      }
      case 'partner.manageAssignedSchool':{
        const d=row(domain.record,['schoolId','customerTenantId','providerTenantId','assignedPersonId','partnershipStatus','assignmentStatus','start','end']);
        const start=time(d.start),end=time(d.end);
        need(id(d.schoolId)===q.targetId&&id(d.customerTenantId)===s.tenantId&&id(d.providerTenantId)!==s.tenantId&&id(d.assignedPersonId)===actor&&d.partnershipStatus==='active'&&d.assignmentStatus==='active'&&start<=at&&at<end,'DOMAIN');break;
      }
      case 'platform.supportScoped':{
        const d=row(domain.record,['caseId','tenantId','assignedPersonId','caseStatus','start','end','allowedField']);
        const start=time(d.start),end=time(d.end);
        need(id(d.caseId)===q.targetId&&id(d.tenantId)===s.tenantId&&id(d.assignedPersonId)===actor&&d.caseStatus==='open'&&start<=at&&at<end&&d.allowedField==='caseStatus','DOMAIN');break;
      }
      default:throw new Rejected('POLICY');
    }
    return yes('synthetic-v2-match');
  }catch(e){return no(e instanceof Rejected?e.reason:'INVALID');}
}
