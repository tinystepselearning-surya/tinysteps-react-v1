import test from 'node:test';
import assert from 'node:assert/strict';
import {collectBusinessSources,SOURCE_FIELDS} from '../business-analytics-bounded-reader.mjs';
import {refreshBusinessTrends} from '../business-analytics-refresh.mjs';
const stamp='2026-11-26T10:00:00.000Z';
const row=(path,data)=>({path,data});
const sourceRows={leads:[row('leads/l1',{receivedAt:'2026-10-01'})],inquiries:[row('leads/l1/inquiries/l1',{sourceLeadId:'l1',receivedAt:'2026-10-01'}),row('leads/l1/inquiries/l2',{receivedAt:'2026-10-02'}),row('other/x/inquiries/ignore',{createdAt:'2026-10-01'})],billingCharges:[row('billingCharges/b1',{monthKey:'2026-10',amount:640})],enrollments:[row('enrollments/e1',{kidId:'kid',status:'active',createdAt:'2026-10-02'})]};
function store(rows=sourceRows,stampFor=()=>stamp){
 const calls=[];
 return {calls,readSnapshot:fn=>fn({async page(kind,{after,limit,fields}){calls.push({kind,after,limit,fields});const all=rows[kind]||[];const start=after?all.findIndex(r=>r.path===after)+1:0;return {readTime:stampFor(calls.length),rows:all.slice(start,start+limit)};}})};
}
test('bounded pagination collects one snapshot and filters unrelated inquiries',async()=>{
 const s=store();const result=await collectBusinessSources(s,{maxDocuments:20,pageSize:2});
 assert.equal(result.documents,6);
 assert.equal(result.unrelatedInquiryRows,1);
 assert.equal(result.rows.inquiries.length,2);
 assert.equal(result.rows.inquiries[1].data.sourceLeadId,'l2');
 assert.ok(s.calls.every(c=>c.fields===SOURCE_FIELDS[c.kind]&&!c.fields.includes('phone')));
});
test('budget or inconsistent snapshot aborts instead of publishing partial totals',async()=>{
 let writes=0;const publisher={publish:async()=>{writes++;}};
 await assert.rejects(refreshBusinessTrends({source:store(),publisher,years:['2026'],maxDocuments:3,pageSize:2,apply:true}),/budget/i);
 await assert.rejects(collectBusinessSources(store(sourceRows,n=>n===1?stamp:'2026-11-26T10:00:01.000Z'),{maxDocuments:20,pageSize:2}),/snapshot changed/);
 await assert.rejects(collectBusinessSources(store(),{maxDocuments:20,pageSize:1,maxPages:2}),/page budget/);
 assert.equal(writes,0);
});
test('dry run returns aggregates only; apply publishes once for selected years and current',async()=>{
 const s=store();let publication;
 const publisher={publish:async x=>{publication=x;return 'published';}};
 const params={source:s,publisher,years:['2025','2026'],maxDocuments:20,pageSize:2};
 const dry=await refreshBusinessTrends(params);
 assert.equal(dry.outcome,'dry-run');
 assert.equal(publication,undefined);
 assert.equal(dry.projectionWrites,3);
 const annual=dry.documents.find(d=>d.path.endsWith('/2026')).data;
 assert.equal(annual.months[9].metrics.leadEnquiries,2);
 assert.equal(annual.months[9].metrics.billedPaise,64000);
 assert.equal(annual.months[9].metrics.newAdmissions,1);
 assert.equal(dry.documents.find(d=>d.path.endsWith('/current')).data.activeStudents,1);
 assert.ok(!JSON.stringify(dry).includes('leads/l1'));
 const applied=await refreshBusinessTrends({...params,apply:true});
 assert.equal(applied.outcome,'published');
 assert.equal(publication.documents.length,3);
});
