import test from 'node:test';
import assert from 'node:assert/strict';
import {fixtureCommandFingerprint as fingerprint} from './extended-capability-review.ts';
import {candidateTenantMembershipKey,candidateOrganisationMembershipKey} from './membership-contract-review-prototype.ts';
import {createOfflineEvidenceProvider as create} from './offline-evidence-provider.ts';
import {copyReviewFixture,reviewRow} from './offline-review-validation.ts';
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

function seed(x=fixture(4)){return {request:x.request,evidence:x.evidence,route:x.route,fence:x.fence};}
function model(x=fixture(4)){const p=create(seed(x));assert.ok(p);return p;}
function evaluate(p,x){return p.consumer.evaluate(x.request,x.fence.personId);}
function match(p,x,effect){assert.deepEqual(evaluate(p,x),{kind:'synthetic-match',effect,productionAuthorization:false,mutationPermitted:false,dataReturned:false});}
function next(x,{revision=x.fence.revision+1,at=x.fence.at,epoch=x.fence.epoch}={}){
 const y=structuredClone(x);y.fence.revision=revision;y.fence.at=at;y.fence.epoch=epoch;y.route.epoch=epoch;y.evidence.observedAt=at;
 for(const v of Object.values(y.evidence))if(v&&typeof v==='object'&&Object.hasOwn(v,'revision'))v.revision=revision;
 for(const v of Object.values(y.evidence.institutional))v.revision=revision;
 y.evidence.approval.fingerprint=fingerprint(y.request,y.fence);return y;
}
test('operator and consumer separate; command match never permits mutation',()=>{const x=fixture(4),p=model(x);match(p,x,'mutation-intent-only');assert.deepEqual(Object.keys(p.consumer),['evaluate']);assert.deepEqual(Object.keys(p.operator),['publish','observeFence','withdraw']);});
test('support case is read-preview only and returns no data',()=>{const x=fixture(6),p=model(x);match(p,x,'read-preview');});
test('exact request binding rejects changed payload, operation, and target',()=>{const x=fixture(4),p=model(x);for(const k of ['operationId','targetId']){const y=structuredClone(x);y.request[k]='fixture-other';assert.equal(evaluate(p,y).reason,'MISMATCH');}x.request.payload.amountMinor++;assert.equal(evaluate(p,x).reason,'MISMATCH');});
test('consumer cannot supply actor alias or override operator clock',()=>{const x=fixture(4),p=model(x);assert.equal(p.consumer.evaluate(x.request,'fixture-other').reason,'MISMATCH');assert.equal(p.consumer.evaluate.length,2);assert.equal(p.operator.observeFence({...x.fence,at:1501}),false);for(const at of [1499,1500,1501])assert.equal(p.consumer.evaluate(x.request,x.fence.personId,at).reason,'UNAVAILABLE');});
test('private immutable snapshot detached from supplied evidence',()=>{const x=fixture(4),p=model(x);x.evidence.grant.status='inactive';match(p,x,'mutation-intent-only');});
test('strictly increasing generation and current tick update accepted',()=>{const x=fixture(4),p=model(x),y=next(x,{at:1501});assert.equal(p.operator.publish(seed(y)),true);match(p,y,'mutation-intent-only');assert.equal(p.operator.observeFence(y.fence),true);});
test('same or lower revision and backwards time rejected',()=>{const x=fixture(4),p=model(x);assert.equal(p.operator.publish(seed(x)),false);assert.equal(p.operator.publish(seed(next(x,{revision:2}))),false);assert.equal(p.operator.publish(seed(next(x,{at:1499}))),false);assert.equal(evaluate(p,x).reason,'UNAVAILABLE');});
test('route epoch rollback closes; increased epoch accepted on a separate valid instance',()=>{const x=fixture(4),p=model(x);assert.equal(p.operator.publish(seed(next(x,{epoch:3}))),false);assert.equal(evaluate(p,x).reason,'UNAVAILABLE');const q=model(x),y=next(x,{epoch:5});assert.equal(q.operator.publish(seed(y)),true);match(q,y,'mutation-intent-only');});
test('publication with revoked grant or stale nested source closes the previous positive',()=>{const x=fixture(4),p=model(x),y=next(x);y.evidence.grant.status='inactive';assert.equal(p.operator.publish(seed(y)),false);assert.equal(evaluate(p,x).reason,'UNAVAILABLE');const q=model(x),z=next(x);z.evidence.tenantMembership.revision--;assert.equal(q.operator.publish(seed(z)),false);assert.equal(evaluate(q,x).reason,'UNAVAILABLE');});
test('operator cannot switch target or operation within provider instance',()=>{const x=fixture(4),p=model(x),y=next(x);y.request.operationId='fixture-other';y.evidence.approval.fingerprint=fingerprint(y.request,y.fence);assert.equal(p.operator.publish(seed(y)),false);assert.equal(p.operator.publish(seed(next(fixture(6)))),false);});
test('withdraw requires higher revision and prevents all future matches and refresh',()=>{const x=fixture(4),p=model(x);assert.equal(p.operator.withdraw(3),false);assert.equal(p.operator.withdraw(4),true);assert.equal(evaluate(p,x).reason,'UNAVAILABLE');assert.equal(p.operator.publish(seed(next(x,{revision:5}))),false);});
test('legacy routing cannot seed successor provider',()=>{const x=fixture(4);Object.assign(x.route,{phase:'legacy',decisionLane:'v1',writerLane:'v1',handoff:'none'});assert.equal(create(seed(x)),null);});
test('canonical exact request supports property reordering',()=>{const x=fixture(4),p=model(x);x.request.payload={currency:'INR',amountMinor:12345,chargeId:'fixture-target-a',ledgerId:'fixture-ledger-a'};match(p,x,'mutation-intent-only');});
test('malformed proxy or getter evidence rejected without invocation',()=>{let invoked=false;const x=fixture(4);Object.defineProperty(x.evidence,'principal',{enumerable:true,get(){invoked=true;return {};}});assert.equal(create(seed(x)),null);assert.equal(invoked,false);const prox=new Proxy({},{getPrototypeOf(){invoked=true;return null;}});assert.equal(reviewRow(prox,[]),null);assert.equal(create(prox),null);assert.equal(invoked,false);});
test('bounded copy accepts dense arrays but rejects sparse arrays and aliases',()=>{const v=copyReviewFixture({fields:['a','b']});assert.ok(Object.isFrozen(v.fields));assert.throws(()=>copyReviewFixture({fields:Array(2)}));const a={id:'a'};assert.throws(()=>copyReviewFixture({x:a,y:a}));});
test('bad seed operation type rejected safely',()=>{const x=fixture(4);x.fence.operation=7;assert.equal(create(seed(x)),null);});

test('revoked principal, membership and approval each invalidate previous match',()=>{
  for(const revoke of [y=>{y.evidence.principal.authStatus='inactive';},y=>{y.evidence.tenantMembership.record.status='inactive';},y=>{y.evidence.approval.status='inactive';}]){
    const x=fixture(4),p=model(x),y=next(x);match(p,x,'mutation-intent-only');revoke(y);
    assert.equal(p.operator.publish(seed(y)),false);assert.equal(evaluate(p,x).reason,'UNAVAILABLE');
  }
});
test('authoritative malformed evidence closes without invoking getter',()=>{
  const x=fixture(4),p=model(x),y=next(x);let invoked=false;
  Object.defineProperty(y.evidence,'principal',{enumerable:true,get(){invoked=true;return {};}});
  assert.equal(p.operator.publish(seed(y)),false);assert.equal(invoked,false);assert.equal(evaluate(p,x).reason,'UNAVAILABLE');
});
test('exact duplicate and delayed publication cannot roll back or close current match',()=>{
  const x=fixture(4),p=model(x),y=next(x);assert.equal(p.operator.publish(seed(y)),true);
  assert.equal(p.operator.publish(seed(y)),false);assert.equal(p.operator.publish(seed(x)),false);match(p,y,'mutation-intent-only');
});
test('same revision conflicting publication closes',()=>{
  const x=fixture(4),p=model(x),y=structuredClone(x);y.evidence.grant.status='inactive';
  assert.equal(p.operator.publish(seed(y)),false);assert.equal(evaluate(p,x).reason,'UNAVAILABLE');
});
test('unrelated valid binding cannot revoke current provider',()=>{
  const x=fixture(4),p=model(x),y=next(fixture(6));assert.equal(p.operator.publish(seed(y)),false);
  assert.equal(p.operator.observeFence(y.fence),false);match(p,x,'mutation-intent-only');
});
test('operator current fence must match every freshness coordinate',()=>{
  for(const patch of [{at:1501},{at:1499},{revision:4},{revision:2},{epoch:5},{epoch:3}]){
    const x=fixture(4),p=model(x);assert.equal(p.operator.observeFence(x.fence),true);
    assert.equal(p.operator.observeFence({...x.fence,...patch}),false);assert.equal(evaluate(p,x).reason,'UNAVAILABLE');
  }
});
test('unknown or malformed operator observation fails closed',()=>{
  for(const f of [null,{}, {personId:'fixture-person-a',at:'1500'}]){
    const x=fixture(4),p=model(x);assert.equal(p.operator.observeFence(f),false);assert.equal(evaluate(p,x).reason,'UNAVAILABLE');
  }
});
test('invalidated instance cannot reopen via later positive publication or matching observation',()=>{
  const x=fixture(4),p=model(x),y=next(x);y.evidence.grant.status='inactive';
  assert.equal(p.operator.publish(seed(y)),false);
  const z=next(x,{revision:5});assert.equal(p.operator.publish(seed(z)),false);assert.equal(p.operator.observeFence(z.fence),false);
  assert.equal(evaluate(p,x).reason,'UNAVAILABLE');
});
