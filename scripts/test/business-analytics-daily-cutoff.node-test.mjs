import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyBusinessCutoff,requireDailyReadWindow} from '../business-analytics-daily-cutoff.mjs';
import {buildAvailableBusinessTrends} from '../business-analytics-available-records.mjs';
import {refreshBusinessTrends} from '../business-analytics-refresh.mjs';
import {runBusinessRefreshJob} from '../business-analytics-job-config.mjs';

test('IST month/year/leap-day rollover and bounded midnight read window',()=>{
 assert.deepEqual(dailyBusinessCutoff(new Date('2026-11-30T18:45:00Z')),{throughDate:'2026-11-30',sourceReadTime:'2026-11-30T18:29:59.999Z'});
 assert.equal(dailyBusinessCutoff(new Date('2026-12-31T18:45:00Z')).throughDate,'2026-12-31');
 assert.equal(dailyBusinessCutoff(new Date('2028-02-29T18:45:00Z')).throughDate,'2028-02-29');
 const late=new Date('2026-11-30T19:30:00Z');
 assert.throws(()=>requireDailyReadWindow(late,dailyBusinessCutoff(late)),/window closed/);
});
test('excludes subsequent dated activity even in the same month',()=>{
 const row=(id,data)=>({id,data});
 const result=buildAvailableBusinessTrends({year:'2026',updatedAt:'2026-11-25T18:29:59.999Z',
 leads:[row('old',{receivedAt:'2026-11-25'}),row('today',{receivedAt:'2026-11-26'})],inquiries:[],
 billingCharges:[row('old',{monthKey:'2026-11',date:'2026-11-25',amount:400}),row('today',{monthKey:'2026-11',date:'2026-11-26',amount:400})],
 enrollments:[row('old',{kidId:'a',status:'active',createdAt:'2026-11-25'}),row('today',{kidId:'b',status:'active',createdAt:'2026-11-26'})]});
 const m=result.annual.months[10].metrics;
 assert.equal(m.leadEnquiries,1);assert.equal(m.billedPaise,40000);assert.equal(m.newAdmissions,1);assert.equal(result.current.activeStudents,1);
});
test('daily refresh requires actual cutoff snapshot and supports new year with no activity',async()=>{
 const cutoff=dailyBusinessCutoff(new Date('2026-12-31T18:45:00Z'));
 const source={readSnapshot:(fn,opts)=>{assert.equal(opts.sourceReadTime,cutoff.sourceReadTime);return fn({page:async()=>({rows:[],readTime:cutoff.sourceReadTime})});}};
 const r=await refreshBusinessTrends({source,years:['2026','2027'],maxDocuments:10,cutoff});
 assert.equal(r.throughDate,'2026-12-31');
 assert.equal(r.documents[1].data.months[0].metrics.leadEnquiries,null);
 assert.equal(r.documents[2].data.throughDate,cutoff.throughDate);
 const bad={readSnapshot:fn=>fn({page:async()=>({rows:[],readTime:'2026-12-31T18:45:00.000Z'})})};
 await assert.rejects(refreshBusinessTrends({source:bad,years:['2026'],maxDocuments:10,cutoff}),/cutoff snapshot unavailable/);
});
test('already published date skips inventory and source collection',async()=>{
 const project='tinysteps-react-v1';
 const env={MONTHLY_TRENDS_ENABLED:'true',MONTHLY_TRENDS_PROJECT:project,MONTHLY_TRENDS_MODE:'apply',MONTHLY_TRENDS_READ_APPROVED:project,MONTHLY_TRENDS_WRITE_APPROVED:project,MONTHLY_TRENDS_FIRST_YEAR:'2026',MONTHLY_TRENDS_MAX_DOCUMENTS:'1000'};
 let scans=0;
 const r=await runBusinessRefreshJob({env,now:new Date('2026-11-26T10:00:00Z'),openStore:async()=>({store:{publishedThrough:async()=>'2026-11-25',inventory:async()=>{scans++;}},close:async()=>{}}),refresh:async()=>{scans++;},log:()=>{}});
 assert.equal(r.outcome,'already-published');assert.equal(scans,0);
});
