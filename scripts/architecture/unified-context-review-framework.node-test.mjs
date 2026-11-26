import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewUnifiedContext as review} from './unified-context-review-framework.ts';
import {candidateTenantMembershipKey,candidateOrganisationMembershipKey} from './membership-contract-review-prototype.ts';

const cases=[
 ['onlineInstructor','attendance.markOnlineSession',false,'fixture.onlineAttendance','onlineParticipant','assignedOnlineSession','attendance',['attendanceDecision']],
 ['onlineInstructor','learner.readTeachingView',false,'fixture.onlineTeachingView','learnerTeachingView','activeTeachingAssignment','teaching',['learnerDisplayName']],
 ['campusInstructor','learner.readTeachingView',true,'fixture.campusTeachingView','learnerTeachingView','activeTeachingAssignment','teaching',['lessonProgressSummary']],
 ['schoolAttendanceOperator','attendance.markSchoolDaily',true,'fixture.physicalAttendance','schoolRegisterParticipant','assignedSchoolRegister','attendance',['attendanceDecision']],
 ['guardianViewer','learner.readGuardianView',false,'fixture.guardianView','learnerGuardianView','verifiedGuardianPurposeAndRestrictions','guardianProgress',['publishedProgressSummary']],
 ['financeViewer','finance.readApprovedView',false,'fixture.financeView','financeSummary','approvedFinanceScope','financeReporting',['paymentSummary']],
 ['partnerSchoolViewer','partner.readSchool',false,'fixture.partnerRead','partnerSchoolSummary','verifiedPartnerSchoolReader','partnerReporting',['schoolSummary']],
 ['partnerSchoolOperator','partner.readSchool',false,'fixture.partnerRead','partnerSchoolSummary','verifiedPartnerSchoolReader','partnerReporting',['schoolSummary']]
];
function fixture(i=0){
 const [roleKey,action,physical,operation,kind,relationship,purpose,fields]=cases[i];
 const tenantId='fixture-tenant-a',organisationId='fixture-org-a',personId='fixture-person-a',resourceId='fixture-resource-a',campusId=physical?'fixture-campus-a':null;
 const scope={tenantId,organisationId,campusId},revision=3,at=1500;
 const source=(documentId,record)=>({documentId,record,revision});
 const member={personId,status:'active',effectiveStartAt:1000,effectiveEndAt:2000};
 const tmId=candidateTenantMembershipKey(tenantId,personId).value;
 const omId=candidateOrganisationMembershipKey(organisationId,personId,'member').value;
 const active={status:'active',revision},window={...active,start:1000,end:2000};
 return {
  request:{action,resourceId,scope:{...scope},purpose,fields:[...fields]},
  evidence:{observedAt:at,principal:{personId,personStatus:'active',authStatus:'active',revision},
   institutional:{tenant:source(tenantId,{tenantId,name:'Fixture tenant',status:'active'}),
    organisation:source(organisationId,{organisationId,tenantId,type:'school',name:'Fixture school',status:'active'}),
    ...(physical?{campus:source(campusId,{campusId,tenantId,organisationId,name:'Fixture campus',timeZone:'Asia/Kolkata',status:'active'})}:{})},
   tenantMembership:source(tmId,{tenantMembershipId:tmId,tenantId,...member}),
   organisationMembership:source(omId,{organisationMembershipId:omId,organisationId,role:'member',isPrimary:false,...member}),
   grant:{personId,scope:{...scope},roleKey,policyVersion:1,...window},
   resource:{resourceId,scope:{...scope},kind,...active},
   relationship:{personId,resourceId,scope:{...scope},kind:relationship,purpose,action,...window}},
  route:{operation,epoch:4,phase:'successor',decisionLane:'v2',writerLane:'v2',handoff:'synthetic-complete'},
  fence:{personId,at,revision,operation,epoch:4}
 };
}
const run=x=>review(x.request,x.evidence,x.route,x.fence);
const positive=(x,result='synthetic-v2-match')=>assert.deepEqual(run(x),{scope:'unified-offline-review',productionAuthorization:false,result,alternateLaneAttempt:false});
const deny=(x,reason)=>{const result=run(x);assert.equal(result.result,'would-deny');assert.equal(result.productionAuthorization,false);assert.equal(result.alternateLaneAttempt,false);if(reason)assert.equal(result.reason,reason);};
for(let i=0;i<cases.length;i++)test('unified synthetic '+cases[i][0]+' '+cases[i][1],()=>positive(fixture(i)));
test('legacy or shadow selection never returns a v2 match or v1 access decision',()=>{for(const phase of ['legacy','shadow']){const x=fixture();Object.assign(x.route,{phase,decisionLane:'v1',writerLane:'v1',handoff:'none'});x.evidence=null;positive(x,'legacy-retained');}});
test('new physical action cannot fall back to legacy',()=>{const x=fixture(3);Object.assign(x.route,{phase:'legacy',decisionLane:'v1',writerLane:'v1',handoff:'none'});deny(x,'ROUTE_STOP');});
test('disabled, stale epoch and split authority denied',()=>{const x=fixture();Object.assign(x.route,{phase:'disabled',decisionLane:null,writerLane:null});deny(x,'ROUTE_STOP');const y=fixture();y.fence.epoch++;deny(y,'ROUTE_STOP');const z=fixture();z.route.writerLane='v1';deny(z,'ROUTE_STOP');});
test('operation derived from action and campus, never caller chosen',()=>{const x=fixture();x.request.operation='fixture.partnerRead';deny(x,'INVALID');const y=fixture();y.fence.operation='fixture.partnerRead';deny(y,'ROUTE_STOP');});
test('institution document key and owner mismatch denied',()=>{const x=fixture();x.evidence.institutional.tenant.documentId='fixture-tenant-b';deny(x,'INSTITUTION');const y=fixture(2);y.evidence.institutional.campus.record.organisationId='fixture-org-b';deny(y,'INSTITUTION');});
test('exact requested institutional scope, no artificial campus',()=>{const x=fixture();x.request.scope.organisationId='fixture-org-b';deny(x,'INSTITUTION');const y=fixture();y.evidence.institutional.campus=null;deny(y,'INVALID');const z=fixture(2);delete z.evidence.institutional.campus;deny(z,'INSTITUTION');});
test('membership binds person tenant and organisation',()=>{for(const [name,key] of [['tenantMembership','tenantId'],['organisationMembership','organisationId'],['organisationMembership','personId']]){const x=fixture();x.evidence[name].record[key]='fixture-other';deny(x,'MEMBERSHIP');}});
test('new membership document must use exact prospective key',()=>{const x=fixture();x.evidence.tenantMembership.documentId=x.evidence.tenantMembership.record.tenantMembershipId='fixture-other-key';deny(x,'MEMBERSHIP');});
test('membership classifications and primary flag do not grant capability',()=>{const x=fixture();const m=x.evidence.organisationMembership;const k=candidateOrganisationMembershipKey(m.record.organisationId,m.record.personId,'schoolAdmin').value;m.record.role='schoolAdmin';m.record.isPrimary=true;m.record.organisationMembershipId=m.documentId=k;x.evidence.grant.roleKey='schoolAdmin';deny(x,'CONTEXT');});
test('membership null or absent endpoints held, expired and inactive denied',()=>{const x=fixture();x.evidence.tenantMembership.record.effectiveEndAt=null;deny(x,'MEMBERSHIP');const y=fixture();delete y.evidence.organisationMembership.record.effectiveStartAt;deny(y,'MEMBERSHIP');const z=fixture();z.evidence.tenantMembership.record.effectiveEndAt=1500;deny(z,'CONTEXT');const w=fixture();w.evidence.organisationMembership.record.status='inactive';deny(w,'CONTEXT');});
test('active identity must match independently supplied synthetic actor',()=>{const x=fixture();x.fence.personId='fixture-person-b';deny(x,'ACTOR');const y=fixture();y.evidence.principal.authStatus='disabled';deny(y,'CONTEXT');});
test('all institutional and membership source wrappers enforce revision',()=>{for(const name of ['tenant','organisation','campus']){const x=fixture(2);x.evidence.institutional[name].revision--;deny(x,'STALE');}for(const name of ['tenantMembership','organisationMembership']){const x=fixture();x.evidence[name].revision--;deny(x,'STALE');}});
test('changed fence and revoked grant reject new evaluation without fallback',()=>{const x=fixture();positive(x);x.fence.revision++;deny(x,'STALE');const y=fixture();y.evidence.grant.status='inactive';deny(y,'CONTEXT');});
test('resource and guardian relationship exact, no sibling or payer shortcut',()=>{const x=fixture(4);x.request.resourceId='fixture-sibling';deny(x,'CONTEXT');const y=fixture(4);y.evidence.relationship.kind='payer';deny(y,'CONTEXT');});
test('shared catalogue denies wrong role, version and restricted fields',()=>{const x=fixture(5);x.evidence.grant.roleKey='onlineInstructor';deny(x,'CONTEXT');const y=fixture();y.evidence.grant.policyVersion=2;deny(y,'CONTEXT');const z=fixture(1);z.request.fields.push('healthNotes');deny(z,'CONTEXT');});
test('seven unimplemented pairs remain held, not default permitted',()=>{for(const action of ['institution.create','campus.create','institution.manageRoster','finance.post','partner.manageAssignedSchool','platform.supportScoped']){const x=fixture();x.request.action=action;deny(x,'CONTEXT');}const x=fixture(2);x.request.action='institution.manageRoster';deny(x,'CONTEXT');});
test('reusable allow observation, unexpected fields and accessor rejected',()=>{const x=fixture();x.evidence.observation={outcome:'synthetic-allow'};deny(x,'INVALID');const y=fixture();let invoked=false;Object.defineProperty(y.request,'action',{enumerable:true,get(){invoked=true;return 'attendance.markOnlineSession';}});deny(y,'INVALID');assert.equal(invoked,false);});
test('immutable result contains no transferable actor or resource payload',()=>{const x=fixture();const original=structuredClone(x);const result=run(x);assert.deepEqual(x,original);assert.ok(Object.isFrozen(result));assert.deepEqual(Object.keys(result).sort(),['alternateLaneAttempt','productionAuthorization','result','scope']);});
