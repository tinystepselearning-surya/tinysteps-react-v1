// Private runtime configuration for a bounded periodic analytics refresh.
// No Firebase imports or credential resolution here. Disabled by default.
import {dailyBusinessCutoff,requireDailyReadWindow} from './business-analytics-daily-cutoff.mjs';
const PROJECT='tinysteps-react-v1';
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const integer=(raw,name,min,max)=>{
 assert(typeof raw==='string'&&/^\d+$/.test(raw),name+' must be explicitly configured');
 const n=Number(raw);
 assert(Number.isSafeInteger(n)&&n>=min&&n<=max,name+' outside allowed range');
 return n;
};
export function resolveBusinessRefreshJob(env,now=new Date()){
 if(env.MONTHLY_TRENDS_ENABLED!=='true')return {enabled:false};
 assert(env.MONTHLY_TRENDS_PROJECT===PROJECT,'Explicit production project required');
 assert(!env.FIRESTORE_EMULATOR_HOST,'Private production job cannot target emulator');
 const mode=env.MONTHLY_TRENDS_MODE;
 assert(mode==='dry-run'||mode==='apply','Explicit refresh mode required');
 assert(env.MONTHLY_TRENDS_READ_APPROVED===PROJECT,'Approved bounded source scope required');
 if(mode==='apply')assert(env.MONTHLY_TRENDS_WRITE_APPROVED===PROJECT,'Approved aggregate publication required');
 const maxDocuments=integer(env.MONTHLY_TRENDS_MAX_DOCUMENTS,'Document budget',1,100000);
 const pageSize=integer(env.MONTHLY_TRENDS_PAGE_SIZE||'250','Page size',1,500);
 const maxPages=integer(env.MONTHLY_TRENDS_MAX_PAGES||'400','Page budget',1,1000);
 const currentYear=Number(new Intl.DateTimeFormat('en-CA',{year:'numeric',timeZone:'Asia/Kolkata'}).format(now));
 const firstYear=integer(env.MONTHLY_TRENDS_FIRST_YEAR,'First reporting year',currentYear-14,currentYear);
 return {enabled:true,project:PROJECT,mode,apply:mode==='apply',maxDocuments,pageSize,maxPages,years:Array.from({length:currentYear-firstYear+1},(_,i)=>String(firstYear+i))};
}
export async function runBusinessRefreshJob({env,now,openStore,refresh,log}){
 const config=resolveBusinessRefreshJob(env,now);
 if(!config.enabled){log({outcome:'disabled'});return {outcome:'disabled'};}
 const cutoff=dailyBusinessCutoff(now);
 const opened=await openStore(config.project);
 try{
  if(config.apply){
   assert(typeof opened.store.publishedThrough==='function','Published cutoff check required');
   if((await opened.store.publishedThrough())>=cutoff.throughDate){const result={outcome:'already-published',throughDate:cutoff.throughDate};log(result);return result;}
  }
  requireDailyReadWindow(now,cutoff);
  assert(typeof opened.store.inventory==='function','Source inventory required');
  const inventory=await opened.store.inventory();
  assert(Number.isSafeInteger(inventory.total)&&inventory.total>=0,'Invalid source inventory');
  if(inventory.total>config.maxDocuments){
   log({outcome:'budget-exceeded',estimatedSourceDocuments:inventory.total,maxDocuments:config.maxDocuments});
   throw Error('Source inventory exceeds approved document budget');
  }
  const result=await refresh({source:opened.store,publisher:opened.store,years:config.years,maxDocuments:config.maxDocuments,pageSize:config.pageSize,maxPages:config.maxPages,apply:config.apply,cutoff});
  // Do not log annual/monthly totals, source document IDs, names, or raw records.
  const summary={outcome:result.outcome,throughDate:cutoff.throughDate,readTime:result.readTime,sourceDocuments:result.sourceDocuments,sourcePages:result.sourcePages,projectionWrites:result.projectionWrites,inventoryAggregateQueries:inventory.aggregateQueries,years:result.years};
  log(summary);
  return summary;
 }finally{await opened.close();}
}
