import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBusinessAnalytics} from '../business-analytics-projection.mjs';

const monthKey='2026-10';
const fact=(metric,value,eventId=metric)=>({metric,value,eventId,monthKey});
const coverage=(...metrics)=>metrics.map(metric=>({metric,monthKey,verified:true}));
const input={year:'2026',updatedAt:'2026-11-26T09:00:00Z',contributions:[],coverage:[],roster:[],rosterVerified:false};
const october=result=>result.annual.months[9].metrics;

test('unknown coverage is null; certified empty flow is zero',()=>{
 const r=buildBusinessAnalytics({...input,coverage:coverage('newAdmissions','openingRetainedStudents')});
 assert.equal(october(r).newAdmissions,0);
 assert.equal(october(r).studentExits,null);
 assert.equal(october(r).openingRetainedStudents,null);
 assert.equal(r.current.activeStudents,null);
});
test('deduplicates events and counts unique active children and separate enrollments',()=>{
 const f=fact('leadEnquiries',1,'inquiry-1');
 const r=buildBusinessAnalytics({...input,coverage:coverage('leadEnquiries'),contributions:[f,f,fact('leadEnquiries',1,'inquiry-2')],rosterVerified:true,roster:[
  {childId:'a',enrollmentId:'1',state:'active'},
  {childId:'a',enrollmentId:'2',state:'active'},
  {childId:'a',enrollmentId:'3',state:'paused'},
  {childId:'b',enrollmentId:'4',state:'paused'},
 ]});
 assert.equal(october(r).leadEnquiries,2);
 assert.equal(r.current.activeStudents,1);
 assert.equal(r.current.activeEnrollments,2);
 assert.equal(r.current.pausedStudents,1);
 assert.equal(r.current.retainedStudents,2);
});
test('rejects conflicting events and unreconciled student movement',()=>{
 assert.throws(()=>buildBusinessAnalytics({...input,contributions:[fact('leadEnquiries',1),fact('leadEnquiries',2)]}),/Conflicting/);
 const metrics=['openingRetainedStudents','newAdmissions','reactivations','studentExits','closingRetainedStudents'];
 assert.throws(()=>buildBusinessAnalytics({...input,coverage:coverage(...metrics),contributions:metrics.map((m,i)=>fact(m,[10,3,1,2,99][i]))}),/does not reconcile/);
});
test('separates finance periods and sums signed corrections in integer paise',()=>{
 const r=buildBusinessAnalytics({...input,coverage:coverage('billedPaise','receivedPaise'),contributions:[fact('billedPaise',64000000),fact('billedPaise',-10000,'correction'),fact('receivedPaise',61000000)]});
 assert.equal(october(r).billedPaise,63990000);
 assert.equal(october(r).receivedPaise,61000000);
});
