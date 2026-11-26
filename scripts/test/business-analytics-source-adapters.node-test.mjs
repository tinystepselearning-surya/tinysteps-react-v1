import test from 'node:test';
import assert from 'node:assert/strict';
import {istDateKey,sourceUpdateRevision,rupeesToPaise,adaptCanonicalReceipt,adaptParentBillingMonth,adaptWebsiteInquiryCohort,adaptCanonicalChildRoster} from '../business-analytics-source-adapters.mjs';
import {planContributionChange} from '../business-analytics-incremental.mjs';

const updateTime={seconds:1795687200,nanoseconds:123456000};
test('source time uses IST and preserves exact update revision, not millisecond truncation',()=>{
 assert.equal(istDateKey('2026-10-31T18:29:59.999Z'),'2026-10-31');
 assert.equal(istDateKey('2026-10-31T18:30:00.000Z'),'2026-11-01');
 assert.equal(sourceUpdateRevision(updateTime),1795687200123456);
 assert.equal(sourceUpdateRevision({...updateTime,nanoseconds:123457000})-sourceUpdateRevision(updateTime),1);
 assert.throws(()=>sourceUpdateRevision({...updateTime,nanoseconds:123456001}),/precision/);
 assert.throws(()=>istDateKey('2026-10-31'),/ambiguous/);
 assert.equal(rupeesToPaise(400.15),40015);
 assert.throws(()=>rupeesToPaise(400.151),/paise/);
});
const receipt={id:'payment-1',updateTime,data:{sourceSystem:'admin_receive_parent_payment',sourceFunction:'adminReceiveParentPayment',status:'completed',currency:'INR',parentId:'parent-1',walletTransactionId:'wallet-1',idempotencyKey:'receipt-1',paidAt:'2026-10-31T18:30:00Z',paidDateKey:'2026-11-01',receiptMonthKey:'2026-11',monthKey:'2026-11',date:'2026-11-01',amount:1200.5,walletCreditedAmount:1200.5,allocatedAmount:300,advanceAmount:900.5}};
test('canonical receipt counts entire receipt once, not allocation or billed month',()=>{
 const r=adaptCanonicalReceipt(receipt);
 assert.deepEqual(r.facts,[{monthKey:'2026-11',metric:'receivedPaise',value:120050}]);
 assert.equal(r.revision,sourceUpdateRevision(updateTime));
 for(const patch of [{receiptMonthKey:'2026-10'},{status:'refunded'},{sourceSystem:'legacy'},{walletCreditedAmount:300},{refundedAmount:100},{isArchived:true}]){
  assert.throws(()=>adaptCanonicalReceipt({...receipt,data:{...receipt.data,...patch}}));
 }
});
const billing={parentId:'parent-1',monthKey:'2026-10',updateTime,data:{parentId:'parent-1',monthKey:'2026-10',schemaVersion:2,modelType:'billing_v2',allocationAware:true,computedFrom:'billingCharges + charge settlement metadata',billedAmount:1400,settledAmount:1000,dueAmount:400,billedClassCount:4,billingCompositionFingerprint:'fixture',totals:{billedAmount:1400,settledAmount:1000,dueAmount:400}}};
test('billing adapter uses canonical service-month model and rejects incompatible totals',()=>{
 const r=adaptParentBillingMonth(billing);
 assert.deepEqual(r.facts,[{monthKey:'2026-10',metric:'billedPaise',value:140000}]);
 assert.throws(()=>adaptParentBillingMonth({...billing,data:{...billing.data,dueAmount:401}}),/reconcile/);
 assert.throws(()=>adaptParentBillingMonth({...billing,data:{...billing.data,schemaVersion:1}}),/Unsupported/);
 assert.throws(()=>adaptParentBillingMonth({...billing,data:{...billing.data,totals:{...billing.data.totals,billedAmount:1500}}}),/Nested/);
});
const inquiry=(id,receivedAt)=>({id,data:{sourceLeadId:id,source:'website',receivedAt}});
const events=[inquiry('a','2026-10-31T18:29:00Z'),inquiry('b','2026-10-31T17:00:00Z'),inquiry('c','2026-10-31T18:30:00Z')];
const cohort={canonicalId:'a',canonical:{source:'website',dedupeCanonicalLeadId:'a',dedupeIdentityKey:'a'.repeat(64),inquiryCount:3,firstInquiryAt:'2026-10-31T17:00:00Z'},events,revision:1,historyComplete:true,duplicatePolicy:'one_per_ist_day'};
test('website cohort groups same IST day only under explicit policy; cross-month repeats remain',()=>{
 const r=adaptWebsiteInquiryCohort(cohort);
 assert.deepEqual(r.facts,[{monthKey:'2026-10',metric:'leadEnquiries',value:1},{monthKey:'2026-10',metric:'newOpportunities',value:1},{monthKey:'2026-11',metric:'leadEnquiries',value:1},{monthKey:'2026-11',metric:'repeatEnquiries',value:1}]);
 const all=adaptWebsiteInquiryCohort({...cohort,revision:2,duplicatePolicy:'all_submissions'});
 assert.deepEqual(planContributionChange(r,all).deltas,[{monthKey:'2026-10',metric:'leadEnquiries',value:1},{monthKey:'2026-10',metric:'repeatEnquiries',value:1}]);
});
test('website cohort refuses incomplete or conflicting source evidence',()=>{
 for(const patch of [{historyComplete:false},{events:events.slice(1)},{duplicatePolicy:undefined},{canonical:{...cohort.canonical,dedupeConflict:'collision'}},{canonical:{...cohort.canonical,firstInquiryAt:'2026-11-01T00:00:00Z'}}]){
  assert.throws(()=>adaptWebsiteInquiryCohort({...cohort,...patch}));
 }
 assert.throws(()=>adaptWebsiteInquiryCohort({...cohort,events:[events[0],events[0],events[2]]}),/Ambiguous/);
});

const enrollment=(id,courseId,status)=>({id,data:{enrollmentId:id,kidId:'kid-1',studentId:'kid-1',kidIds:['kid-1'],courseId,status}});
test('canonical roster keeps active and paused separately and ignores completed courses',()=>{
 const input={childId:'kid-1',coverageComplete:true,transitionsResolved:true,enrollments:[enrollment('1','phonics','completed'),enrollment('2','grammar','active'),enrollment('3','speaking','paused')]};
 assert.deepEqual(adaptCanonicalChildRoster(input),[{childId:'kid-1',enrollmentId:'2',state:'active'},{childId:'kid-1',enrollmentId:'3',state:'paused'}]);
 assert.throws(()=>adaptCanonicalChildRoster({...input,transitionsResolved:false}),/Incomplete/);
 assert.throws(()=>adaptCanonicalChildRoster({...input,enrollments:[...input.enrollments,enrollment('4','grammar','paused')]}),/Duplicate operational/);
 assert.throws(()=>adaptCanonicalChildRoster({...input,enrollments:[enrollment('5','grammar','pending_payment')]}),/Unresolved/);
 assert.throws(()=>adaptCanonicalChildRoster({...input,enrollments:[{...input.enrollments[1],data:{...input.enrollments[1].data,studentId:'another'}}]}),/Ambiguous/);
});
