import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewExtendedCapability as review,fixtureCommandFingerprint as fingerprint} from './extended-capability-review.ts';
import {reviewUnifiedOperation} from './unified-context-review-framework.ts';
import {candidateTenantMembershipKey,candidateOrganisationMembershipKey} from './membership-contract-review-prototype.ts';

const cases=[
 ['institutionCreator','institution.create','tenant','fixture.institutionCreate','organisation','approvedInstitutionOperator','institutionProvisioning'],
 ['campusCreator','campus.create','organisation','fixture.campusCreate','campus','approvedCampusOperator','campusProvisioning'],
 ['ownedSchoolRosterOperator','institution.manageRoster','organisation','fixture.organisationRoster','placement','activePlacement','rosterManagement'],
 ['ownedSchoolRosterOperator','institution.manageRoster','campus','fixture.campusRoster','placement','activePlacement','rosterManagement'],
 ['financePoster','finance.post','organisation','fixture.financePost','charge','approvedFinanceCommandAndLedger','financePosting'],
 ['partnerSchoolOperator','partner.manageAssignedSchool','organisation','fixture.partnerManage','partnerSchool','verifiedAssignedPartnerSchool','partnerManagement'],
 ['scopedSupportOperator','platform.supportScoped','tenant','fixture.scopedSupport','supportCase','approvedTimeBoundSupportCase','supportCaseReview']
];
function fixture(i=0){
 const [roleKey,action,kind,operation,targetKind,requirement,purpose]=cases[i];
 const tenantId='fixture-tenant-a',organisationId='fixture-org-a',campusId='fixture-campus-a',personId='fixture-person-a',targetId='fixture-target-a',revision=3,at=1500;
 const scope={kind,tenantId,...(kind!=='tenant'?{organisationId}:{}),...(kind==='campus'?{campusId}:{})};
 const create=i<2,source=(documentId,record)=>({documentId,record,revision});
 const membership={personId,status:'active',effectiveStartAt:1000,effectiveEndAt:2000};
 const tmId=candidateTenantMembershipKey(tenantId,personId).value,omId=candidateOrganisationMembershipKey(organisationId,personId,'member').value;
 const window={status:'active',start:1000,end:2000,revision};
 const payloads=[
  {name:'Fixture school',type:'school'},
  {name:'Fixture campus',timeZone:'Asia/Kolkata'},
  {learnerId:'fixture-learner-a',placementId:targetId,change:'endPlacement'},
  {learnerId:'fixture-learner-a',placementId:targetId,change:'endPlacement'},
  {ledgerId:'fixture-ledger-a',chargeId:targetId,amountMinor:12345,currency:'INR'},
  {schoolId:targetId,providerTenantId:'fixture-tenant-b',change:'requestReview'},
  {caseId:targetId,field:'caseStatus'}
 ];
 const domains=[
  {parentId:tenantId,provisioningState:'reservedForRequest',reservedOperationId:'fixture-operation-a'},
  {parentId:organisationId,provisioningState:'reservedForRequest',reservedOperationId:'fixture-operation-a'},
  {placementId:targetId,learnerId:'fixture-learner-a',placementStatus:'active',schoolKind:'owned'},
  {placementId:targetId,learnerId:'fixture-learner-a',placementStatus:'active',schoolKind:'owned'},
  {ledgerId:'fixture-ledger-a',chargeId:targetId,outstandingMinor:12345,currency:'INR',ledgerStatus:'open',chargeStatus:'unsettled'},
  {schoolId:targetId,customerTenantId:tenantId,providerTenantId:'fixture-tenant-b',assignedPersonId:personId,partnershipStatus:'active',assignmentStatus:'active',start:1000,end:2000},
  {caseId:targetId,tenantId,assignedPersonId:personId,caseStatus:'open',start:1000,end:2000,allowedField:'caseStatus'}
 ];
 const request={action,scope:{...scope},targetId,operationId:'fixture-operation-a',expectedTargetRevision:create?0:7,payload:payloads[i]};
 const fence={personId,at,revision,operation,epoch:4};
 return {request,fence,route:{operation,epoch:4,phase:'successor',decisionLane:'v2',writerLane:'v2',handoff:'synthetic-complete'},
 evidence:{observedAt:at,principal:{personId,personStatus:'active',authStatus:'active',revision},
  institutional:{tenant:source(tenantId,{tenantId,name:'Fixture tenant',status:'active'}),
   ...(kind!=='tenant'?{organisation:source(organisationId,{organisationId,tenantId,type:'school',name:'Fixture school',status:'active'})}:{}),
   ...(kind==='campus'?{campus:source(campusId,{campusId,organisationId,tenantId,name:'Fixture campus',timeZone:'Asia/Kolkata',status:'active'})}:{})},
  tenantMembership:source(tmId,{tenantMembershipId:tmId,tenantId,...membership}),
  ...(kind!=='tenant'?{organisationMembership:source(omId,{organisationMembershipId:omId,organisationId,role:'member',isPrimary:false,...membership})}:{}),
  grant:{personId,scope:{...scope},roleKey,policyVersion:1,...window},
  target:{targetId,scope:{...scope},kind:targetKind,state:create?'absent':'present',targetRevision:create?0:7,revision},
  approval:{personId,requirement,purpose,fingerprint:fingerprint(request,fence),...window},
  domain:{targetId,scope:{...scope},revision,record:domains[i]}
 }};
}
const run=x=>review(x.request,x.evidence,x.route,x.fence);
const yes=(x,result='synthetic-v2-match')=>assert.deepEqual(run(x),{scope:'extended-offline-review',productionAuthorization:false,mutationPerformed:false,alternateLaneAttempt:false,result});
const no=(x,reason)=>{const y=run(x);assert.equal(y.result,'would-deny');assert.equal(y.productionAuthorization,false);assert.equal(y.mutationPerformed,false);assert.equal(y.alternateLaneAttempt,false);if(reason)assert.equal(y.reason,reason);};
for(let i=0;i<cases.length;i++)test('extended positive '+cases[i][0]+' '+cases[i][2],()=>yes(fixture(i)));
test('tenant-only context rejects fake organisation, campus or membership',()=>{const x=fixture();x.request.scope.organisationId='fixture-org-a';no(x,'SCOPE');const y=fixture(6);y.evidence.institutional.organisation=fixture(1).evidence.institutional.organisation;no(y,'SCOPE');const z=fixture();z.evidence.organisationMembership=fixture(1).evidence.organisationMembership;no(z,'SCOPE');});
test('creation requires exact absent target and expected zero revision',()=>{for(const i of [0,1]){const x=fixture(i);x.evidence.target.state='present';no(x,'TARGET');const y=fixture(i);y.request.expectedTargetRevision=1;no(y,'TARGET');}});
test('creation parent reservation and prospective record validation',()=>{const x=fixture(0);x.evidence.domain.record.parentId='fixture-other';no(x,'DOMAIN');const y=fixture(1);y.request.payload.timeZone='invalid';no(y,'INVALID');const z=fixture();z.request.payload.type='other-unknown';no(z,'INVALID');});
test('wrong owner or missing campus record denied',()=>{const x=fixture(3);x.evidence.institutional.campus.record.organisationId='fixture-other';no(x,'SCOPE');const y=fixture(3);delete y.evidence.institutional.campus;no(y,'INVALID');});
test('wrong actor or grant scope never permits',()=>{const x=fixture(4);x.fence.personId='fixture-other';no(x,'ACTOR');const y=fixture(3);y.evidence.grant.scope.campusId='fixture-other';no(y,'ACTOR');});
test('inactive or noncurrent membership denied',()=>{const x=fixture(6);x.evidence.tenantMembership.record.effectiveEndAt=1500;no(x,'MEMBERSHIP');const y=fixture(4);y.evidence.organisationMembership.record.status='inactive';no(y,'MEMBERSHIP');});
test('membership keys must match prospective exact tuple',()=>{const x=fixture();x.evidence.tenantMembership.record.tenantMembershipId=x.evidence.tenantMembership.documentId='fixture-other';no(x,'MEMBERSHIP');});
test('stale source revisions and route epoch deny',()=>{for(const key of ['principal','grant','target','approval','domain','tenantMembership']){const x=fixture(4);x.evidence[key].revision--;no(x,'STALE');}const x=fixture(1);x.fence.epoch++;no(x,'ROUTE');});
test('wrong role or policy version denied by shared catalogue',()=>{const x=fixture(4);x.evidence.grant.roleKey='financeViewer';no(x,'POLICY');const y=fixture();y.evidence.grant.policyVersion=2;no(y,'POLICY');});
test('approval binds exact action, actor, request payload, target and epoch',()=>{const x=fixture(4);x.request.payload.amountMinor++;no(x,'APPROVAL');const y=fixture(4);y.request.operationId='fixture-new-operation';no(y,'APPROVAL');const z=fixture();z.request.payload.name='Another school';no(z,'APPROVAL');const w=fixture();w.fence.epoch++;w.route.epoch++;no(w,'APPROVAL');});
test('approval requirement and purpose must match the catalogue',()=>{const x=fixture(4);x.evidence.approval.requirement='approvedFinanceScope';no(x,'APPROVAL');const y=fixture(4);y.evidence.approval.purpose='other';no(y,'APPROVAL');});
test('target revision conflict cannot be treated as permission',()=>{const x=fixture(4);x.evidence.target.targetRevision++;no(x,'TARGET');});
test('roster requires exact active owned placement for that learner',()=>{for(const i of [2,3]){const x=fixture(i);x.evidence.domain.record.learnerId='fixture-other';no(x,'DOMAIN');const y=fixture(i);y.evidence.domain.record.schoolKind='partner';no(y,'DOMAIN');const z=fixture(i);z.evidence.domain.record.placementStatus='ended';no(z,'DOMAIN');}});
test('finance requires exact current open ledger and unsettled charge',()=>{for(const [key,value] of [['outstandingMinor',12344],['currency','USD'],['ledgerStatus','closed'],['chargeStatus','settled'],['ledgerId','fixture-other']]){const x=fixture(4);x.evidence.domain.record[key]=value;no(x,'DOMAIN');}});
test('finance amount must be positive safe minor units, currency exact',()=>{for(const amount of [0,-1,1.2,Infinity,Number.MAX_SAFE_INTEGER+1]){const x=fixture(4);x.request.payload.amountMinor=amount;no(x,'INVALID');}const x=fixture(4);x.request.payload.currency='USD';no(x,'INVALID');});
test('partner exact customer/provider assignment and current interval',()=>{for(const [key,value] of [['customerTenantId','fixture-other'],['providerTenantId','fixture-tenant-a'],['providerTenantId','fixture-tenant-c'],['assignedPersonId','fixture-other'],['partnershipStatus','ended'],['assignmentStatus','inactive'],['end',1500]]){const x=fixture(5);x.evidence.domain.record[key]=value;no(x,'DOMAIN');}});
test('support restricted to exact open case, tenant, operator, time and one field',()=>{for(const [key,value] of [['tenantId','fixture-other'],['assignedPersonId','fixture-other'],['caseStatus','closed'],['end',1500],['allowedField','childData']]){const x=fixture(6);x.evidence.domain.record[key]=value;no(x,'DOMAIN');}const x=fixture(6);x.request.payload.field='childData';no(x,'INVALID');});
test('no legacy fallback on failed successor; legacy marker is not a decision',()=>{const x=fixture(4);x.evidence=null;no(x,'INVALID');const y=fixture(4);Object.assign(y.route,{phase:'legacy',decisionLane:'v1',writerLane:'v1',handoff:'none'});yes(y,'legacy-retained');const z=fixture(0);Object.assign(z.route,{phase:'legacy',decisionLane:'v1',writerLane:'v1',handoff:'none'});no(z,'ROUTE');});
test('no injected actor, outcome or extra payload fields; accessor not invoked',()=>{const x=fixture();x.request.actor='fixture-person-a';no(x,'INVALID');const y=fixture(4);y.evidence.allow=true;no(y,'INVALID');const z=fixture();let called=false;Object.defineProperty(z.request.payload,'name',{enumerable:true,get(){called=true;return 'Fixture';}});no(z,'INVALID');assert.equal(called,false);});
test('canonical request fingerprint independent of property ordering, binds content',()=>{const x=fixture(4);const a=fingerprint(x.request,x.fence);assert.match(a,/^[a-f0-9]{64}$/);x.request.payload={currency:'INR',amountMinor:12345,chargeId:'fixture-target-a',ledgerId:'fixture-ledger-a'};assert.equal(fingerprint(x.request,x.fence),a);x.request.payload.amountMinor++;assert.notEqual(fingerprint(x.request,x.fence),a);});
test('immutable result and no mutations or reusable authorization output',()=>{const x=fixture(4),copy=structuredClone(x),y=run(x);assert.deepEqual(x,copy);assert.ok(Object.isFrozen(y));assert.deepEqual(Object.keys(y).sort(),['alternateLaneAttempt','mutationPerformed','productionAuthorization','result','scope']);});

test('reservation is bound to exact operation ID',()=>{const x=fixture();x.evidence.domain.record.reservedOperationId='fixture-other';no(x,'DOMAIN');});
test('unified entry dispatches all seven command and case shapes',()=>{for(let i=0;i<cases.length;i++){const x=fixture(i);assert.deepEqual(reviewUnifiedOperation(x.request,x.evidence,x.route,x.fence),run(x));}});
test('wrong envelope cannot bypass command-specific evidence',()=>{const x=fixture(4);delete x.request.payload;assert.equal(reviewUnifiedOperation(x.request,x.evidence,x.route,x.fence).result,'would-deny');});
