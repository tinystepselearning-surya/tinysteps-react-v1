import test from 'node:test';
import assert from 'node:assert/strict';
import {planContributionChange,applyContributionDeltas,receiptContribution,billedContribution,inquiryContribution,childMovementContribution} from '../business-analytics-incremental.mjs';
import {publishCertifiedFlowChange} from '../business-analytics-flow-publisher.mjs';

import {prepareFlowBaseline} from '../business-analytics-flow-baseline.mjs';

const root='adminStats/businessAnalyticsV1';
const paid=(revision,receiptMonthKey='2026-10',netReceivedPaise=50000)=>receiptContribution({id:'p1',revision,receiptMonthKey,netReceivedPaise});
test('correction moves receipt between periods, stale and duplicate events are harmless',()=>{
 const before=paid(1), after=paid(2,'2026-11',40000);
 const change=planContributionChange(before,after);
 assert.deepEqual(change.deltas,[{monthKey:'2026-10',metric:'receivedPaise',value:-50000},{monthKey:'2026-11',metric:'receivedPaise',value:40000}]);
 assert.equal(planContributionChange(after,before).outcome,'stale');
 assert.equal(planContributionChange(after,after).outcome,'duplicate');
 assert.throws(()=>planContributionChange(after,paid(2,'2026-11',100)),/Conflicting/);
 assert.equal(planContributionChange(after,{...after,revision:3,facts:[]}).deltas[0].value,-40000);
});
test('lead reclassification changes counts without double-counting enquiry',()=>{
 const lead=classification=>inquiryContribution({id:'one',revision:classification==='new'?1:2,monthKey:'2026-10',classification});
 assert.deepEqual(planContributionChange(lead('new'),lead('repeat')).deltas.map(x=>[x.metric,x.value]),[['newOpportunities',-1],['repeatEnquiries',1]]);
});
test('final child movement differs from course progression, additional courses and returning child',()=>{
 const base={id:'x',revision:1,monthKey:'2026-10',retainedBefore:true,retainedAfter:true,everAdmittedBefore:true,courseCounts:{newEnrollments:1,courseCompletions:1,courseDiscontinuations:0}};
 assert.deepEqual(childMovementContribution(base).facts.map(f=>f.metric),['courseCompletions','newEnrollments']);
 assert.ok(childMovementContribution({...base,retainedAfter:false,exitReason:'completed'}).facts.some(f=>f.metric==='completedStudentExits'));
 assert.ok(childMovementContribution({...base,retainedBefore:false}).facts.some(f=>f.metric==='reactivations'));
 assert.ok(childMovementContribution({...base,retainedBefore:false,everAdmittedBefore:false}).facts.some(f=>f.metric==='newAdmissions'));
});
test('missing baseline and negative aggregate fail closed',()=>{
 const d=planContributionChange(null,paid(1)).deltas;
 assert.throws(()=>applyContributionDeltas(new Map(),d),/Uncertified/);
 assert.throws(()=>applyContributionDeltas(new Map([['2026-10',{coverage:{receivedPaise:true},metrics:{receivedPaise:1}}]]),[{...d[0],value:-2}]),/Invalid resulting/);
});
const stamp='2026-11-26T10:00:00Z',generation='fixture1';
function fixture(){
 const envelope={generation,schemaVersion:1,metricDefinitionVersion:1,verificationStatus:'verified',updatedAt:stamp};
 const month=k=>({...envelope,monthKey:k,coverage:{receivedPaise:true,billedPaise:true},metrics:{receivedPaise:0,billedPaise:0}});
 const october=month('2026-10'),november=month('2026-11');
 const docs=new Map([[root+'/businessAnalyticsControl/active',{generation,state:'ready',ledgerSeeded:true}],
 [root+'/businessAnalyticsMonths/2026-10',october],[root+'/businessAnalyticsMonths/2026-11',november],
 [root+'/businessAnalyticsYears/2026',{...envelope,year:'2026',months:[october,november].map(m=>({monthKey:m.monthKey,metrics:m.metrics}))}]]);
 const counts={reads:0,writes:0};
 const store={async runTransaction(fn){const writes=new Map();const result=await fn({async get(path){assert.equal(writes.size,0,'all reads before writes');counts.reads++;return docs.get(path);},set(path,value){writes.set(path,value);}});for(const [path,value] of writes){docs.set(path,value);counts.writes++;}return result;}};
 return {store,docs,counts};
}
test('atomic publisher is bounded, duplicate is read-only, year and month mirror move together',async()=>{
 const {store,docs,counts}=fixture(), opts={generation,updatedAt:stamp};
 await publishCertifiedFlowChange(store,paid(1),opts);
 assert.deepEqual(counts,{reads:4,writes:3});
 await publishCertifiedFlowChange(store,paid(1),opts);
 assert.deepEqual(counts,{reads:6,writes:3});
 await publishCertifiedFlowChange(store,paid(2,'2026-11',40000),opts);
 assert.deepEqual(counts,{reads:11,writes:7});
 const annual=docs.get(root+'/businessAnalyticsYears/2026');
 assert.deepEqual(annual.months.map(m=>m.metrics.receivedPaise),[0,40000]);
 await publishCertifiedFlowChange(store,billedContribution({id:'b',revision:1,serviceMonthKey:'2026-10',netBilledPaise:100000}),opts);
 assert.equal(docs.get(root+'/businessAnalyticsMonths/2026-10').metrics.billedPaise,100000);
});
test('drift or missing generation aborts without writes',async()=>{
 const {store,docs,counts}=fixture(),opts={generation,updatedAt:stamp};
 const path=root+'/businessAnalyticsYears/2026';
 const row=docs.get(path); docs.set(path,{...row,months:row.months.map(m=>({...m,metrics:{...m.metrics,receivedPaise:1}}))});
 await assert.rejects(publishCertifiedFlowChange(store,paid(1),opts),/drift/);
 assert.equal(counts.writes,0);
 await assert.rejects(publishCertifiedFlowChange(store,paid(1),{...opts,generation:'wrong'}),/baseline/);
 assert.equal(counts.writes,0);
});

test('baseline seed must reconcile certified totals against complete contributor ledger',()=>{
 const annual={year:'2026',schemaVersion:1,metricDefinitionVersion:1,verificationStatus:'verified',updatedAt:stamp,
 months:Array.from({length:12},(_,i)=>({monthKey:'2026-'+String(i+1).padStart(2,'0'),metrics:{leadEnquiries:null,newOpportunities:null,repeatEnquiries:null,billedPaise:null,receivedPaise:i===9?50000:null}}))};
 const input={generation,sourceWatermark:'fixture-watermark',annuals:[annual],contributors:[paid(1)]};
 const seed=prepareFlowBaseline(input);
 assert.deepEqual(seed.counts,{years:1,months:12,contributors:1,documents:14});
 assert.equal(seed.verificationRequired,true);
 assert.equal(seed.documents.some(d=>d.path.endsWith('/control/active')||d.path.endsWith('/businessAnalyticsControl/active')),false);
 assert.throws(()=>prepareFlowBaseline({...input,contributors:[]}),/Seed contribution mismatch/);
 assert.throws(()=>prepareFlowBaseline({...input,contributors:[paid(1),paid(1)]}),/Duplicate seed contributor/);
});
