import test from 'node:test';
import assert from 'node:assert/strict';
import {analyticsInventoryPlan,runCountOnlyInventory,summarizeAnalyticsInventory} from '../business-analytics-workspace-inventory.mjs';
const now=new Date('2026-11-26T18:30:00Z');
test('uses current IST date, full selected-month session bounds and current-day attribution bounds',()=>{
 const p=analyticsInventoryPlan('2026-11',now);
 assert.equal(p.today,'2026-11-27');
 assert.equal(p.end,'2026-11-30');
 assert.equal(p.attributionEnd,'2026-11-27');
 assert.equal(p.sourceQueries.length,13);
 const a=p.sourceQueries.find(q=>q.id==='attribution_receivedAt');
 assert.equal(a.filters[0][2].toISOString(),'2026-10-31T18:30:00.000Z');
 assert.equal(a.filters[1][2].toISOString(),'2026-11-27T18:29:59.999Z');
 assert.deepEqual(p.sourceQueries.find(q=>q.id==='sessions').filters,[['date','>=','2026-11-01'],['date','<=','2026-11-30']]);
 assert.equal(analyticsInventoryPlan('2024-02',now).end,'2024-02-29');
 for(const bad of ['2026-12','2026-13','2026-1',''])assert.throws(()=>analyticsInventoryPlan(bad,now));
});
test('fixed count-only adapter and per-view floors preserve query overlap and finance branches',async()=>{
 const p=analyticsInventoryPlan('2026-11',now),calls=[];
 const fixture={leads:20,demos:10,users:12,enrollments:8,courses:2,charges:30,teacherEarnings:40,sessions:50,parentMonthModels:7,teacherMonthRollups:3,attribution_receivedAt:5,attribution_requestedAt:5,attribution_createdAt:5};
 const r=await runCountOnlyInventory(p,async q=>{calls.push(q.id);return fixture[q.id]});
 assert.equal(calls.length,13);
 assert.equal(new Set(calls).size,13);
 assert.deepEqual(r.uncachedDocumentQueryReadFloors,{overview:30,growth:30,acquisition:15,finance:{uncertified:131,certified:94,unsafeRollupFallback:134},delivery:90,teachers:52,monthlyTrends:2});
 assert.deepEqual(r.separateAggregationQueries,{overview:1,finance:1});
 const zeros=Object.fromEntries(p.sourceQueries.map(q=>[q.id,0]));
 assert.equal(summarizeAnalyticsInventory(p,zeros).uncachedDocumentQueryReadFloors.growth,2);
 await assert.rejects(()=>runCountOnlyInventory(p,async()=>-1),/Invalid count/);
});
