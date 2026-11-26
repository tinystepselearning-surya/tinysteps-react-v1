// B02-R3.4 standalone review simulation, never a live authorization decision.
// All evidence and the independent fence are synthetic fixtures supplied by a test harness.
type Row=Record<string,unknown>;
type Scope=Readonly<{tenantId:string;organisationId:string;campusId:string|null}>;
// The versioned role/action/scope catalogue is the only source of candidate role matches.
import { inspectCandidateCapability } from './capability-catalogue-review-prototype.ts';
type ActionPolicy=Readonly<{kind:string;purpose:string;fields:readonly string[]}>;
function actionPolicy(kind:string,purpose:string,fields:string[]):ActionPolicy{
  return Object.freeze({kind,purpose,fields:Object.freeze(fields)});
}
// Synthetic resource and field policy; no role grants here. Missing action metadata denies.
const actionPolicies=Object.freeze({
  'attendance.markOnlineSession':actionPolicy('onlineParticipant','attendance',['attendanceDecision']),
  'learner.readTeachingView':actionPolicy('learnerTeachingView','teaching',['learnerDisplayName','lessonProgressSummary']),
  'attendance.markSchoolDaily':actionPolicy('schoolRegisterParticipant','attendance',['attendanceDecision']),
  'learner.readGuardianView':actionPolicy('learnerGuardianView','guardianProgress',['learnerDisplayName','publishedProgressSummary']),
  'finance.readApprovedView':actionPolicy('financeSummary','financeReporting',['billedSummary','paymentSummary']),
  'partner.readSchool':actionPolicy('partnerSchoolSummary','partnerReporting',['schoolSummary'])
});
type Denial='MALFORMED'|'STALE_OR_REVOKED'|'INACTIVE'|'OWNER_MISMATCH'|'SUBJECT_MISMATCH'|'NOT_EFFECTIVE'|'NO_POLICY'|'RELATIONSHIP_MISMATCH'|'FIELD_OR_PURPOSE';
type Outcome=Readonly<{simulation:'synthetic-only';productionAuthorization:false;result:'would-allow'}>|Readonly<{simulation:'synthetic-only';productionAuthorization:false;result:'would-deny';reason:Denial}>;
class Denied extends Error{readonly reason:Denial;constructor(reason:Denial){super(reason);this.reason=reason;}}
function need(x:unknown,reason:Denial):asserts x{if(!x)throw new Denied(reason);}
function row(v:unknown,fields:readonly string[]):Row{
  need(v!==null&&typeof v==='object'&&!Array.isArray(v),'MALFORMED');
  const proto=Object.getPrototypeOf(v);need(proto===Object.prototype||proto===null,'MALFORMED');
  const keys=Reflect.ownKeys(v);need(keys.length===fields.length,'MALFORMED');
  const out:Row=Object.create(null);
  for(const k of keys){need(typeof k==='string'&&fields.includes(k),'MALFORMED');const d=Object.getOwnPropertyDescriptor(v,k);need(d&&d.enumerable&&Object.hasOwn(d,'value'),'MALFORMED');out[k]=d.value;}
  return out;
}
function id(v:unknown):string{need(typeof v==='string'&&v.trim()===v&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(v),'MALFORMED');return v;}
function time(v:unknown):number{need(typeof v==='number'&&Number.isSafeInteger(v)&&v>=-62135596800000&&v<=253402300799999,'MALFORMED');return v;}
function revision(v:unknown):number{need(typeof v==='number'&&Number.isSafeInteger(v)&&v>0,'MALFORMED');return v;}
function scope(v:unknown):Scope{
  const s=row(v,['tenantId','organisationId','campusId']);
  return {tenantId:id(s.tenantId),organisationId:id(s.organisationId),campusId:s.campusId===null?null:id(s.campusId)};
}
function sameScope(a:Scope,b:Scope):boolean{return a.tenantId===b.tenantId&&a.organisationId===b.organisationId&&a.campusId===b.campusId;}
function fresh(x:Row,fence:number):void{need(revision(x.revision)===fence,'STALE_OR_REVOKED');}
function active(x:Row):void{need(x.status==='active','INACTIVE');}
function current(x:Row,at:number):void{
  active(x);
  const start=time(x.start),end=time(x.end); // finite interval only; no implied open end
  need(end>start,'MALFORMED');need(start<=at&&at<end,'NOT_EFFECTIVE');
}
function fieldList(v:unknown):string[]{
  need(Array.isArray(v)&&v.length>0&&v.length<=8,'MALFORMED');
  need(Reflect.ownKeys(v).length===v.length+1,'MALFORMED');
  const out:string[]=[];
  for(let i=0;i<v.length;i++){const d=Object.getOwnPropertyDescriptor(v,String(i));need(d&&d.enumerable&&Object.hasOwn(d,'value')&&typeof d.value==='string'&&d.value.length<=64,'MALFORMED');out.push(d.value);}
  need(new Set(out).size===out.length,'MALFORMED');return out;
}
const common=['status','revision'];
const windowFields=[...common,'start','end'];
// Pure simulation only: the second/third arguments are separate test-harness inputs,
// NOT credentials, trusted production evidence, or a transaction fence implementation.
export function simulateContextualDecision(request:unknown,evidence:unknown,independentFence:unknown):Outcome{
  try{
    const f=row(independentFence,['at','revision']);
    const at=time(f.at),rev=revision(f.revision);
    const q=row(request,['action','resourceId','scope','purpose','fields']);
    const requestedScope=scope(q.scope),resourceId=id(q.resourceId),fields=fieldList(q.fields);
    need(typeof q.action==='string'&&typeof q.purpose==='string','MALFORMED');
    const e=row(evidence,['observedAt','principal','tenant','organisation','campus','tenantMembership','organisationMembership','grant','resource','relationship']);
    // Same-tick and same-generation synthetic evidence, deliberately no cache TTL.
    need(time(e.observedAt)===at,'STALE_OR_REVOKED');
    const p=row(e.principal,['personId','personStatus','authStatus','revision']);
    const person=id(p.personId);fresh(p,rev);need(p.personStatus==='active'&&p.authStatus==='active','INACTIVE');
    const t=row(e.tenant,['tenantId',...common]);fresh(t,rev);active(t);
    const o=row(e.organisation,['organisationId','tenantId',...common]);fresh(o,rev);active(o);
    need(id(t.tenantId)===requestedScope.tenantId&&id(o.tenantId)===requestedScope.tenantId&&id(o.organisationId)===requestedScope.organisationId,'OWNER_MISMATCH');
    if(requestedScope.campusId===null){need(e.campus===null,'OWNER_MISMATCH');}
    else{
      const c=row(e.campus,['campusId','organisationId','tenantId',...common]);fresh(c,rev);active(c);
      need(id(c.campusId)===requestedScope.campusId&&id(c.organisationId)===requestedScope.organisationId&&id(c.tenantId)===requestedScope.tenantId,'OWNER_MISMATCH');
    }
    const tm=row(e.tenantMembership,['personId','tenantId',...windowFields]);fresh(tm,rev);current(tm,at);
    const om=row(e.organisationMembership,['personId','organisationId',...windowFields]);fresh(om,rev);current(om,at);
    need(id(tm.personId)===person&&id(om.personId)===person,'SUBJECT_MISMATCH');
    need(id(tm.tenantId)===requestedScope.tenantId&&id(om.organisationId)===requestedScope.organisationId,'OWNER_MISMATCH');
    const g=row(e.grant,['personId','scope','roleKey','policyVersion',...windowFields]);fresh(g,rev);current(g,at);
    need(id(g.personId)===person,'SUBJECT_MISMATCH');need(sameScope(scope(g.scope),requestedScope),'OWNER_MISMATCH');
    need(g.policyVersion===1,'NO_POLICY');
    const scopeType=requestedScope.campusId===null?'organisation':'campus';
    const match=inspectCandidateCapability({policyVersion:g.policyVersion,roleKey:g.roleKey,capability:q.action,scope:scopeType});
    need(match.kind==='candidate-policy-match'&&Object.hasOwn(actionPolicies,q.action),'NO_POLICY');
    const rule=actionPolicies[q.action as keyof typeof actionPolicies];
    const resource=row(e.resource,['resourceId','scope','kind',...common]);fresh(resource,rev);active(resource);
    need(id(resource.resourceId)===resourceId&&sameScope(scope(resource.scope),requestedScope),'OWNER_MISMATCH');
    need(resource.kind===rule.kind,'RELATIONSHIP_MISMATCH');
    const rel=row(e.relationship,['personId','resourceId','scope','kind','purpose','action',...windowFields]);fresh(rel,rev);current(rel,at);
    need(id(rel.personId)===person,'SUBJECT_MISMATCH');
    need(id(rel.resourceId)===resourceId&&sameScope(scope(rel.scope),requestedScope),'OWNER_MISMATCH');
    need(rel.kind===match.rule.relationship&&rel.action===q.action,'RELATIONSHIP_MISMATCH');
    need(q.purpose===rule.purpose&&rel.purpose===rule.purpose&&fields.every(x=>rule.fields.includes(x)),'FIELD_OR_PURPOSE');
    return Object.freeze({simulation:'synthetic-only',productionAuthorization:false,result:'would-allow'});
  }catch(e){return Object.freeze({simulation:'synthetic-only',productionAuthorization:false,result:'would-deny',reason:e instanceof Denied?e.reason:'MALFORMED'});}
}
