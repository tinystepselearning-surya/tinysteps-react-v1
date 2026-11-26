import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveBusinessRefreshJob,runBusinessRefreshJob} from '../business-analytics-job-config.mjs';
const project='tinysteps-react-v1',now=new Date('2026-12-31T18:30:00Z');
const env={MONTHLY_TRENDS_ENABLED:'true',MONTHLY_TRENDS_PROJECT:project,MONTHLY_TRENDS_MODE:'dry-run',MONTHLY_TRENDS_READ_APPROVED:project,MONTHLY_TRENDS_MAX_DOCUMENTS:'10000',MONTHLY_TRENDS_FIRST_YEAR:'2025'};
test('disabled runtime makes no source connection',async()=>{
 let opened=0;
 const out=await runBusinessRefreshJob({env:{},now,openStore:async()=>{opened++;},refresh:async()=>{},log:()=>{}});
 assert.equal(out.outcome,'disabled');
 assert.equal(opened,0);
});
test('configuration requires explicit budgets and separates read and write approval',()=>{
 const c=resolveBusinessRefreshJob(env,now);
 assert.deepEqual(c.years,['2025','2026','2027']);
 assert.equal(c.apply,false);
 for(const patch of [{MONTHLY_TRENDS_PROJECT:'wrong'},{MONTHLY_TRENDS_READ_APPROVED:''},{MONTHLY_TRENDS_MAX_DOCUMENTS:''},{MONTHLY_TRENDS_MAX_DOCUMENTS:'100001'},{FIRESTORE_EMULATOR_HOST:'127.0.0.1:8085'},{MONTHLY_TRENDS_MODE:'apply'}]){
  assert.throws(()=>resolveBusinessRefreshJob({...env,...patch},now));
 }
 assert.equal(resolveBusinessRefreshJob({...env,MONTHLY_TRENDS_MODE:'apply',MONTHLY_TRENDS_WRITE_APPROVED:project},now).apply,true);
});
test('private runner only logs operational summary and closes connection even on failure',async()=>{
 const logs=[];let closed=0,opened=0;
 const openStore=async p=>{assert.equal(p,project);opened++;return {store:{inventory:async()=>({total:123,aggregateQueries:4})},close:async()=>{closed++;}};};
 const refresh=async args=>{assert.equal(args.apply,false);assert.deepEqual(args.years,['2025','2026','2027']);return {outcome:'dry-run',sourceDocuments:123,sourcePages:4,projectionWrites:4,years:args.years,documents:[{data:{billedPaise:640000,childId:'private'}}]};};
 const r=await runBusinessRefreshJob({env,now,openStore,refresh,log:x=>logs.push(x)});
 assert.equal(r.sourceDocuments,123);assert.equal(opened,1);assert.equal(closed,1);
 assert.ok(!JSON.stringify(logs).includes('640000'));assert.ok(!JSON.stringify(logs).includes('private'));
 await assert.rejects(runBusinessRefreshJob({env,now,openStore,refresh:async()=>{throw Error('fixture failure');},log:()=>{}}),/fixture failure/);
 assert.equal(closed,2);
});

test('oversized source inventory stops before full document scan',async()=>{
 let refreshes=0,closed=0;
 const logs=[];
 await assert.rejects(runBusinessRefreshJob({env,now,openStore:async()=>({store:{inventory:async()=>({total:10001,aggregateQueries:4})},close:async()=>{closed++;}}),refresh:async()=>{refreshes++;},log:x=>logs.push(x)}),/exceeds approved/);
 assert.equal(refreshes,0);assert.equal(closed,1);assert.equal(logs[0].outcome,'budget-exceeded');
});
