import {reviewRow,isReviewId,isReviewInteger,REVIEW_MIN_TIME,REVIEW_MAX_TIME} from './offline-review-validation.ts';
// Unified OFFLINE synthetic framework. Not an application authorization API.
// All source rows and fences are stipulated test-harness fixtures, not trusted live facts.
import {inspectInstitutionalFixture} from './institutional-context-contracts.ts';
import {parseTenantMembership,parseOrganisationMembership,candidateTenantMembershipKey,candidateOrganisationMembershipKey} from './membership-contract-review-prototype.ts';
import {simulateContextualDecision} from './contextual-decision-review-simulation.ts';
import {simulateAuthorityRoute} from './authority-lane-review-prototype.ts';
import {reviewExtendedCapability} from './extended-capability-review.ts';

type Row=Record<string,unknown>;
type Reason='INVALID'|'ROUTE_STOP'|'INSTITUTION'|'MEMBERSHIP'|'ACTOR'|'STALE'|'CONTEXT';
type Result=Readonly<{scope:'unified-offline-review';productionAuthorization:false;result:'synthetic-v2-match'|'legacy-retained';alternateLaneAttempt:false}>|
  Readonly<{scope:'unified-offline-review';productionAuthorization:false;result:'would-deny';reason:Reason;alternateLaneAttempt:false}>;
class Reject extends Error{readonly reason:Reason;constructor(reason:Reason){super(reason);this.reason=reason;}}
function need(x:unknown,reason:Reason):asserts x{if(!x)throw new Reject(reason);}
function row(v:unknown,required:readonly string[],optional:readonly string[]=[]):Row{
  const x=reviewRow(v,required,optional);need(x,'INVALID');return x;
}
function id(v:unknown):string{need(isReviewId(v),'INVALID');return v;}
function revision(v:unknown):number{need(isReviewInteger(v,1),'INVALID');return v;}
function instant(v:unknown):number{need(isReviewInteger(v,REVIEW_MIN_TIME,REVIEW_MAX_TIME),'INVALID');return v;}
function source(v:unknown,rev:number):{documentId:string;record:unknown;revision:number}{
  const x=row(v,['documentId','record','revision']);
  need(revision(x.revision)===rev,'STALE');
  return {documentId:id(x.documentId),record:x.record,revision:rev};
}
function operation(action:unknown,campus:unknown):string{
  switch(action){
    case 'attendance.markOnlineSession':need(campus===null,'CONTEXT');return 'fixture.onlineAttendance';
    case 'attendance.markSchoolDaily':need(campus!==null,'CONTEXT');return 'fixture.physicalAttendance';
    case 'learner.readTeachingView':return campus===null?'fixture.onlineTeachingView':'fixture.campusTeachingView';
    case 'learner.readGuardianView':need(campus===null,'CONTEXT');return 'fixture.guardianView';
    case 'finance.readApprovedView':need(campus===null,'CONTEXT');return 'fixture.financeView';
    case 'partner.readSchool':need(campus===null,'CONTEXT');return 'fixture.partnerRead';
    default:throw new Reject('CONTEXT'); // seven unimplemented pairs remain denied
  }
}
function positive(result:'synthetic-v2-match'|'legacy-retained'):Result{
  return Object.freeze({scope:'unified-offline-review',productionAuthorization:false,result,alternateLaneAttempt:false});
}
function negative(reason:Reason):Result{
  return Object.freeze({scope:'unified-offline-review',productionAuthorization:false,result:'would-deny',reason,alternateLaneAttempt:false});
}
// No previously returned observation is accepted; the selected V2 path is recomputed
// synchronously from this exact request and fixture evidence. No V1 authorization is attempted.
export function reviewUnifiedContext(request:unknown,evidence:unknown,routePolicy:unknown,fence:unknown):Result{
  try{
    const q=row(request,['action','resourceId','scope','purpose','fields']);
    const s=row(q.scope,['tenantId','organisationId','campusId']);
    const tenantId=id(s.tenantId),organisationId=id(s.organisationId),campusId=s.campusId===null?null:id(s.campusId);
    id(q.resourceId);
    const op=operation(q.action,campusId);
    const f=row(fence,['personId','at','revision','operation','epoch']);
    const actor=id(f.personId),rev=revision(f.revision),at=instant(f.at),epoch=revision(f.epoch);
    need(f.operation===op,'ROUTE_STOP');
    const selected=simulateAuthorityRoute({operation:op},routePolicy,{operation:op,epoch});
    need(selected.kind==='route','ROUTE_STOP');
    // A legacy/shadow route is a routing result only, never an allow decision.
    if(selected.lane==='v1')return positive('legacy-retained');

    const e=row(evidence,['observedAt','principal','institutional','tenantMembership','organisationMembership','grant','resource','relationship']);
    need(instant(e.observedAt)===at,'STALE');
    const p=row(e.principal,['personId','personStatus','authStatus','revision']);
    need(id(p.personId)===actor,'ACTOR');
    need(revision(p.revision)===rev,'STALE');
    const institutional=row(e.institutional,['tenant','organisation'],['campus']);
    const t=source(institutional.tenant,rev),o=source(institutional.organisation,rev);
    const c=Object.hasOwn(institutional,'campus')?source(institutional.campus,rev):null;
    // Preserve the R3.1 contract: absent campus is online; explicit null is invalid source input.
    const asFixture=(x:{documentId:string;record:unknown})=>({documentId:x.documentId,record:x.record});
    const ctx=inspectInstitutionalFixture({tenant:asFixture(t),organisation:asFixture(o),...(c?{campus:asFixture(c)}:{})});
    need(ctx.ok,'INSTITUTION');
    const {tenant,organisation,campus}=ctx.record;
    need(tenant.tenantId===tenantId&&organisation.organisationId===organisationId&&(campus?.campusId??null)===campusId,'INSTITUTION');

    const tmSource=source(e.tenantMembership,rev),omSource=source(e.organisationMembership,rev);
    const tm=parseTenantMembership(tmSource.documentId,tmSource.record),om=parseOrganisationMembership(omSource.documentId,omSource.record);
    need(tm.ok&&om.ok,'MEMBERSHIP');
    const a=tm.value,b=om.value;
    need(a.personId===actor&&b.personId===actor&&a.tenantId===tenantId&&b.organisationId===organisationId,'MEMBERSHIP');
    // New prospective synthetic membership facts only; never rekey or infer a legacy alias.
    const tk=candidateTenantMembershipKey(tenantId,actor),mk=candidateOrganisationMembershipKey(organisationId,actor,b.role);
    need(tk.ok&&mk.ok&&tk.value===tmSource.documentId&&mk.value===omSource.documentId,'MEMBERSHIP');
    // Finite intervals only for now; missing or open-ended dates remain held.
    need(typeof a.effectiveStartAt==='number'&&typeof a.effectiveEndAt==='number'&&typeof b.effectiveStartAt==='number'&&typeof b.effectiveEndAt==='number','MEMBERSHIP');
    // No membership role or isPrimary flag is interpreted as an authorization capability.
    const decision=simulateContextualDecision(q,{
      observedAt:at,principal:p,
      tenant:{tenantId:tenant.tenantId,status:tenant.status,revision:rev},
      organisation:{organisationId:organisation.organisationId,tenantId:organisation.tenantId,status:organisation.status,revision:rev},
      campus:campus?{campusId:campus.campusId,organisationId:campus.organisationId,tenantId:campus.tenantId,status:campus.status,revision:rev}:null,
      tenantMembership:{personId:a.personId,tenantId:a.tenantId,status:a.status,start:a.effectiveStartAt,end:a.effectiveEndAt,revision:rev},
      organisationMembership:{personId:b.personId,organisationId:b.organisationId,status:b.status,start:b.effectiveStartAt,end:b.effectiveEndAt,revision:rev},
      grant:e.grant,resource:e.resource,relationship:e.relationship
    },{at,revision:rev});
    return decision.result==='would-allow'?positive('synthetic-v2-match'):negative('CONTEXT');
  }catch(e){return negative(e instanceof Reject?e.reason:'INVALID');}
}

// One offline entry point; exact per-envelope parsers reject mixed/unknown shapes.
// The original contextual-only entry remains for regression compatibility.
export function reviewUnifiedOperation(request:unknown,evidence:unknown,routePolicy:unknown,fence:unknown):Result|ReturnType<typeof reviewExtendedCapability>{
  try{
    const q=row(request,['action'],['scope','resourceId','purpose','fields','targetId','operationId','expectedTargetRevision','payload']);
    if(Object.hasOwn(q,'payload'))return reviewExtendedCapability(q,evidence,routePolicy,fence);
    return reviewUnifiedContext(q,evidence,routePolicy,fence);
  }catch{return negative('INVALID');}
}
