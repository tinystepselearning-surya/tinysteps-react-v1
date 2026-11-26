// One frozen source scan, then publish at 01:00 IST. No source writes or live fallback.
import {dailyBusinessCutoff,requireDailyReadWindow} from './business-analytics-daily-cutoff.mjs';
import {refreshBusinessTrends} from './business-analytics-refresh.mjs';
import {createBusinessRefreshStore} from './business-analytics-refresh-store.mjs';
import {istDateKey} from './business-analytics-source-adapters.mjs';
const ROOT='adminStats/businessAnalyticsV1';
const CONTROL=ROOT+'/businessAnalyticsControl/refresh';
const STAGE=ROOT+'/businessAnalyticsControl/staged';
export const DAILY_BUDGET=Object.freeze({maxDocuments:10000,pageSize:500,maxPages:25});
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const reportingYears=now=>{
 const year=Number(istDateKey(now).slice(0,4)),first=Math.max(2026,year-14);
 assert(year>=first,'Invalid reporting year');
 return Array.from({length:year-first+1},(_,i)=>String(first+i));
};
function scheduledCutoff(now,scheduleTime,hour,minute){
 const scheduled=new Date(scheduleTime);
 assert(Number.isFinite(now.getTime())&&Number.isFinite(scheduled.getTime()),'Invalid scheduled time');
 assert(istDateKey(now)===istDateKey(scheduled),'Expired schedule delivery');
 const time=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(scheduled);
 assert(time===String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0'),'Unexpected schedule');
 assert(now>=scheduled,'Early schedule delivery');
 return dailyBusinessCutoff(scheduled);
}
function verifyStage(stage,cutoff,years){
 assert(stage?.throughDate===cutoff.throughDate&&stage.readTime===cutoff.sourceReadTime,'Missing or mismatched staged cutoff');
 assert(JSON.stringify(stage.years)===JSON.stringify(years),'Staged years mismatch');
 assert(Array.isArray(stage.documents)&&stage.documents.length===years.length+1,'Invalid staged document count');
 const paths=new Set([...years.map(y=>ROOT+'/businessAnalyticsYears/'+y),ROOT+'/businessAnalyticsSnapshots/current']);
 for(const d of stage.documents){
  assert(paths.delete(d.path)&&d.data?.schemaVersion===1&&d.data?.metricDefinitionVersion===1&&d.data?.verificationStatus==='verified'&&d.data?.coverageMode==='available_records'&&d.data?.updatedAt===cutoff.sourceReadTime&&d.data?.throughDate===cutoff.throughDate&&d.data?.refreshMode==='daily_closed_day','Invalid staged aggregate');
  if(d.path.includes('/businessAnalyticsYears/'))assert(d.data.year===d.path.split('/').at(-1)&&Array.isArray(d.data.months)&&d.data.months.length===12,'Invalid staged year');
 }
 assert(paths.size===0,'Missing staged aggregate');
}
export async function captureDailyBusinessTrends({db,now=new Date(),scheduleTime,store=createBusinessRefreshStore(db),refresh=refreshBusinessTrends,budget=DAILY_BUDGET}){
 const cutoff=scheduledCutoff(now,scheduleTime,0,15),years=reportingYears(now);
 const stageRef=db.doc(STAGE),controlRef=db.doc(CONTROL);
 const [control,prior]=await Promise.all([controlRef.get(),stageRef.get()]);
 if(control.data()?.throughDate>=cutoff.throughDate)return {outcome:'already-published',throughDate:cutoff.throughDate};
 if(prior.data()?.throughDate===cutoff.throughDate){
  verifyStage(prior.data(),cutoff,years);
  return {outcome:'already-staged',throughDate:cutoff.throughDate};
 }
 requireDailyReadWindow(now,cutoff);
 const inventory=await store.inventory();
 assert(Number.isSafeInteger(inventory.total)&&inventory.total>=0&&inventory.total<=budget.maxDocuments,'Source inventory exceeds budget');
 const result=await refresh({source:store,years,...budget,cutoff,apply:false});
 assert(result.outcome==='dry-run','Expected aggregate-only dry-run');
 const stage={throughDate:cutoff.throughDate,readTime:result.readTime,years,documents:result.documents};
 verifyStage(stage,cutoff,years);
 assert(Buffer.byteLength(JSON.stringify(stage),'utf8')<500000,'Staged aggregate too large');
 const outcome=await db.runTransaction(async tx=>{
  const [c,s]=await Promise.all([tx.get(controlRef),tx.get(stageRef)]);
  if(c.data()?.throughDate>=cutoff.throughDate)return 'already-published';
  if(s.data()?.throughDate>=cutoff.throughDate)return 'already-staged';
  tx.set(stageRef,stage);
  return 'staged';
 });
 return {outcome,throughDate:cutoff.throughDate,sourceDocuments:result.sourceDocuments,sourcePages:result.sourcePages};
}
export async function publishDailyBusinessTrends({db,now=new Date(),scheduleTime,store=createBusinessRefreshStore(db)}){
 const cutoff=scheduledCutoff(now,scheduleTime,1,0),years=reportingYears(now);
 if(await store.publishedThrough()>=cutoff.throughDate)return {outcome:'already-published',throughDate:cutoff.throughDate};
 const stage=(await db.doc(STAGE).get()).data();
 verifyStage(stage,cutoff,years);
 const outcome=await store.publish({documents:stage.documents,readTime:stage.readTime,throughDate:stage.throughDate});
 return {outcome,throughDate:cutoff.throughDate};
}
