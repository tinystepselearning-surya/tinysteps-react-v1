import test from 'node:test';
import assert from 'node:assert/strict';
import {fixtureCommandFingerprint as fingerprint} from './extended-capability-review.ts';
import {candidateTenantMembershipKey,candidateOrganisationMembershipKey} from './membership-contract-review-prototype.ts';
import {createFinanceTransactionExperiment as create} from './offline-finance-transaction-experiment.ts';
import {reviewRow,isReviewId,isReviewInteger,REVIEW_MIN_TIME,REVIEW_MAX_TIME} from './offline-review-validation.ts';
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

function experiment(x=fixture(4)){
 const model=create({evidence:x.evidence,route:x.route,fence:x.fence});assert.ok(model);return {x,model};
}
function prepare(model,request){const p=model.prepare(request);assert.equal(p.kind,'prepared');assert.equal(p.productionAuthorization,false);return p.ticket;}
function deny(result,reason){assert.equal(result.kind,'denied');assert.equal(result.reason,reason);assert.equal(result.productionMutation,false);}
test('shared row preserves required optional null and exact own fields',()=>{const x=Object.assign(Object.create(null),{a:1,b:null});assert.deepEqual({...reviewRow(x,['a'],['b'])},{a:1,b:null});assert.equal(reviewRow({a:1,c:2},['a'],['b']),null);assert.equal(reviewRow({},['a']),null);});
test('shared row rejects inherited, hidden, symbol and getter properties',()=>{let called=false;const x={get a(){called=true;return 1;}};assert.equal(reviewRow(x,['a']),null);assert.equal(called,false);assert.equal(reviewRow(Object.create({a:1}),['a']),null);assert.equal(reviewRow(Object.defineProperty({},'a',{value:1}),['a']),null);assert.equal(reviewRow({a:1,[Symbol()]:2},['a']),null);});
test('shared id and integer boundaries without normalization',()=>{for(const v of ['',' a','a/b','a'.repeat(129),null])assert.equal(isReviewId(v),false);assert.equal(isReviewId('a'.repeat(128)),true);assert.equal(isReviewInteger(REVIEW_MIN_TIME,REVIEW_MIN_TIME,REVIEW_MAX_TIME),true);assert.equal(isReviewInteger(REVIEW_MAX_TIME+1,REVIEW_MIN_TIME,REVIEW_MAX_TIME),false);assert.equal(isReviewInteger(1.1,0),false);});
test('single synthetic commit replaces receipt and revision together',()=>{const {x,model}=experiment();const ticket=prepare(model,x.request);assert.deepEqual(model.inspect(),{fixtureCommitCount:0,fixtureTargetRevision:7,closed:false});assert.deepEqual(model.commit(ticket),{kind:'simulated-commit',productionAuthorization:false,productionMutation:false,fixtureCommitCount:1,fixtureTargetRevision:8});assert.deepEqual(model.inspect(),{fixtureCommitCount:1,fixtureTargetRevision:8,closed:false});});
test('consumed ticket and repeated prepare cannot duplicate commit',()=>{const {x,model}=experiment();const t=prepare(model,x.request);model.commit(t);deny(model.commit(t),'REPLAY');deny(model.prepare(x.request),'REPLAY');assert.equal(model.inspect().fixtureCommitCount,1);});
test('two competing prepares produce only one simulated commit',()=>{const {x,model}=experiment();const a=prepare(model,x.request),b=prepare(model,x.request);model.commit(a);deny(model.commit(b),'STALE');assert.equal(model.inspect().fixtureCommitCount,1);});
test('revocation between prepare and commit invalidates both tickets',()=>{const {x,model}=experiment();const a=prepare(model,x.request),b=prepare(model,x.request);assert.equal(model.invalidate('revoke'),true);deny(model.commit(a),'STALE');deny(model.commit(b),'STALE');deny(model.prepare(x.request),'STALE');assert.equal(model.inspect().fixtureCommitCount,0);});
test('target conflict leaves no receipt and changes fixture revision',()=>{const {x,model}=experiment();const t=prepare(model,x.request);assert.equal(model.invalidate('target-changed'),true);deny(model.commit(t),'STALE');assert.deepEqual(model.inspect(),{fixtureCommitCount:0,fixtureTargetRevision:8,closed:true});});
test('route change or unavailable evidence fails closed without fallback',()=>{for(const event of ['route-changed','evidence-unavailable']){const {x,model}=experiment();const t=prepare(model,x.request);model.invalidate(event);deny(model.commit(t),'STALE');assert.equal(model.inspect().fixtureCommitCount,0);}});
test('clock monotonicity and same-tick invalidation',()=>{const {x,model}=experiment();const t=prepare(model,x.request);assert.equal(model.advanceClock(1499),false);assert.equal(model.advanceClock(1500),false);assert.equal(model.advanceClock(1501),true);deny(model.commit(t),'STALE');assert.equal(model.advanceClock(2000),false);});
test('forged or foreign-instance ticket never executes',()=>{const a=experiment(),b=experiment();const t=prepare(a.model,a.x.request);deny(b.model.commit(t),'REPLAY');deny(a.model.commit({kind:'synthetic-ticket'}),'REPLAY');assert.equal(a.model.inspect().fixtureCommitCount,0);});
test('copied seed and request cannot be changed after preparation',()=>{const {x,model}=experiment();const t=prepare(model,x.request);x.evidence.grant.status='inactive';x.request.payload.amountMinor++;assert.equal(model.commit(t).kind,'simulated-commit');});
test('current seed must authorize exact command before prepare',()=>{const x=fixture(4);x.evidence.grant.status='inactive';const {model}=experiment(x);deny(model.prepare(x.request),'DENIED');assert.equal(model.inspect().fixtureCommitCount,0);});
test('altered approval-bound amount and operation ID cannot prepare',()=>{const {x,model}=experiment();x.request.payload.amountMinor++;deny(model.prepare(x.request),'DENIED');const b=experiment();b.x.request.operationId='fixture-other';deny(b.model.prepare(b.x.request),'DENIED');});
test('legacy route never creates a synthetic finance ticket',()=>{const x=fixture(4);Object.assign(x.route,{phase:'legacy',decisionLane:'v1',writerLane:'v1',handoff:'none'});const {model}=experiment(x);deny(model.prepare(x.request),'DENIED');});
test('other command envelopes and target revision rejected',()=>{const {x,model}=experiment();deny(model.prepare(fixture(6).request),'INVALID');x.request.expectedTargetRevision++;deny(model.prepare(x.request),'INVALID');});
test('ticket issuance bounded over lifetime',()=>{const {x,model}=experiment();const tickets=[];for(let i=0;i<32;i++)tickets.push(prepare(model,x.request));deny(model.prepare(x.request),'BOUND');assert.equal(model.commit(tickets[0]).kind,'simulated-commit');});
test('fixture copy rejects accessors, proxy, aliases and cycles without calling getter',()=>{const {x,model}=experiment();let called=false;Object.defineProperty(x.request.payload,'amountMinor',{enumerable:true,get(){called=true;return 12345;}});deny(model.prepare(x.request),'INVALID');assert.equal(called,false);deny(model.prepare(new Proxy({},{})),'INVALID');const y=fixture(4);y.evidence.target.scope=y.evidence.grant.scope;assert.equal(create({evidence:y.evidence,route:y.route,fence:y.fence}),null);const z=fixture(4);z.evidence.domain.record.self=z.evidence.domain.record;assert.equal(create({evidence:z.evidence,route:z.route,fence:z.fence}),null);});
test('unsafe target overflow, wrong seed kind and unsupported controls denied',()=>{const x=fixture(4);x.evidence.target.targetRevision=Number.MAX_SAFE_INTEGER;assert.equal(create({evidence:x.evidence,route:x.route,fence:x.fence}),null);const y=fixture(6);assert.equal(create({evidence:y.evidence,route:y.route,fence:y.fence}),null);const {model}=experiment();assert.equal(model.invalidate('reopen'),false);assert.equal(model.inspect().closed,false);});
test('revocation after simulated commit preserves receipt count but no further permission',()=>{const {x,model}=experiment();model.commit(prepare(model,x.request));model.invalidate('revoke');deny(model.prepare(x.request),'STALE');assert.deepEqual(model.inspect(),{fixtureCommitCount:1,fixtureTargetRevision:8,closed:true});});
