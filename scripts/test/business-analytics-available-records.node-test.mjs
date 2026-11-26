import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAvailableBusinessTrends} from '../business-analytics-available-records.mjs';
const base={year:'2026',updatedAt:'2026-11-26T10:00:00Z',leads:[],inquiries:[],billingCharges:[],enrollments:[]};
const row=(id,data)=>({id,data});
const m=(r,index)=>r.annual.months[index-1].metrics;
test('counts repeat inquiries, uses historical lead dates and avoids counting the same source submission twice',()=>{
 const r=buildAvailableBusinessTrends({...base,leads:[row('a',{receivedAt:'2026-10-01'}),row('old',{createdAt:'2026-10-02'}),row('unknown',{})],inquiries:[row('a',{sourceLeadId:'a',receivedAt:'2026-10-01'}),row('b',{sourceLeadId:'b',receivedAt:'2026-10-01'}),row('c',{sourceLeadId:'c',receivedAt:'2026-10-31T18:30:00Z'})]});
 assert.equal(m(r,10).leadEnquiries,3);
 assert.equal(m(r,11).leadEnquiries,1);
 assert.equal(r.issues.undatedEnquiries,1);
 assert.equal(m(r,12).leadEnquiries,null);
});
test('sums billed charges only by service month, includes old date field and excludes void charges',()=>{
 const r=buildAvailableBusinessTrends({...base,billingCharges:[row('a',{monthKey:'2026-10',amount:400,paidAt:'2026-11-01'}),row('b',{date:'2026-10-22',amount:'375.50'}),row('c',{monthKey:'2026-10',amount:900,status:'void'}),row('d',{monthKey:'2026-11',amount:500}),row('e',{amount:400})]});
 assert.equal(m(r,10).billedPaise,77550);
 assert.equal(m(r,11).billedPaise,50000);
 assert.equal(r.issues.undatedCharges,1);
});
test('counts first admission and final dated exit, not course progression or extra course; current totals use distinct children',()=>{
 const r=buildAvailableBusinessTrends({...base,enrollments:[
 row('a1',{kidId:'a',status:'completed',enrollmentDate:'2026-09-01',completedAt:'2026-10-10'}),
 row('a2',{studentId:'a',status:'active',createdAt:'2026-10-10'}),
 row('a3',{kidIds:['a'],status:'active',createdAt:'2026-10-20'}),
 row('b1',{kidId:'b',status:'discontinued',createdAt:'2026-10-02',endedAt:'2026-10-30'}),
 row('c1',{kidId:'c',status:'completed',createdAt:'2026-10-02'}),
 row('d1',{kidId:'d',status:'paused',createdAt:'2026-11-02'}),
 ]});
 assert.equal(m(r,9).newAdmissions,1);
 assert.equal(m(r,10).newAdmissions,2);
 assert.equal(m(r,10).newEnrollments,4);
 assert.equal(m(r,10).studentExits,1);
 assert.equal(m(r,10).discontinuedStudentExits,1);
 assert.equal(r.current.activeStudents,1);
 assert.equal(r.current.activeEnrollments,2);
 assert.equal(r.current.pausedStudents,1);
 assert.equal(r.issues.undatedCourseEnds,1);
 assert.equal(r.issues.ambiguousStudentExits,1);
});

test('dated mirror wins regardless of input order; distinct submissions still count',()=>{
 const events=[
  row('a1',{sourceLeadId:'a',receivedAt:'2026-08-12'}),
  row('a2',{sourceLeadId:'a'}),
  row('b1',{sourceLeadId:'b'}),
  row('b2',{sourceLeadId:'b',receivedAt:'2026-09-01'}),
  row('c1',{sourceLeadId:'c'}),
  row('d1',{sourceLeadId:'d'}),
  row('e1',{sourceLeadId:'e',receivedAt:'2026-10-31T18:30:00Z'}),
  row('e2',{sourceLeadId:'e',receivedAt:'2026-10-30'}),
  row('f1',{sourceLeadId:'f',receivedAt:'2026-08-12'}),
 ];
 const input={...base,leads:[row('c',{createdAt:'2026-10-02'}),row('a',{createdAt:'2026-09-01'})],inquiries:events};
 const r=buildAvailableBusinessTrends(input);
 assert.deepEqual(r,buildAvailableBusinessTrends({...input,inquiries:[...events].reverse()}));
 assert.equal(m(r,8).leadEnquiries,2);
 assert.equal(m(r,9).leadEnquiries,1);
 assert.equal(m(r,10).leadEnquiries,2);
 assert.equal(m(r,11).leadEnquiries,0);
 assert.equal(r.issues.datedInquiryMirrorResolutions,3);
 assert.equal(r.issues.conflictingInquiryDates,1);
 assert.equal(r.issues.undatedEnquiries,1);
});
test('uses earliest recorded admission including corrected history and reports the caveat',()=>{
 const r=buildAvailableBusinessTrends({...base,enrollments:[
  row('a1',{kidId:'a',status:'completed',createdAt:'2026-08-01',completedAt:'2026-09-01',correctedToEnrollmentId:'a2'}),
  row('a2',{kidId:'a',status:'active',createdAt:'2026-09-01'}),
  row('b1',{kidId:'b',status:'active',createdAt:'2026-08-01'}),
 ]});
 assert.equal(m(r,8).newAdmissions,2);
 assert.equal(m(r,8).newEnrollments,1);
 assert.equal(m(r,9).newEnrollments,1);
 assert.equal(r.issues.correctionBasedAdmissions,1);
 assert.equal(r.current.activeStudents,2);
});
