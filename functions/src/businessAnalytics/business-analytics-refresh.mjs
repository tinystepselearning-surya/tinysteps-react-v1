// Refresh orchestration: read once, prepare all selected year summaries, atomically publish.
// Store dependency is explicit. No production credentials or scheduler are initialized here.
import {collectBusinessSources} from './business-analytics-bounded-reader.mjs';
import {buildAvailableBusinessTrends} from './business-analytics-available-records.mjs';
import {istDateKey} from './business-analytics-source-adapters.mjs';
const ROOT='adminStats/businessAnalyticsV1';
const assert=(ok,message)=>{if(!ok)throw Error(message);};
export async function refreshBusinessTrends({source,publisher,years,maxDocuments,pageSize,maxPages,apply=false,cutoff}){
 assert(Array.isArray(years)&&years.length>0&&years.length<=15&&new Set(years).size===years.length&&years.every(y=>typeof y==='string'&&/^\d{4}$/.test(y)),'Select 1–15 distinct reporting years');
 const result=await collectBusinessSources(source,{maxDocuments,pageSize,maxPages,sourceReadTime:cutoff?.sourceReadTime});
 const currentYear=cutoff?istDateKey(new Date(Date.parse(result.readTime)+1)).slice(0,4):istDateKey(result.readTime).slice(0,4);
 if(cutoff)assert(cutoff.throughDate===istDateKey(result.readTime)&&cutoff.sourceReadTime===result.readTime,'Daily snapshot cutoff mismatch');
 assert(years.every(y=>y<=currentYear),'Future reporting years are not supported');
 const reports=years.map(year=>buildAvailableBusinessTrends({year,updatedAt:result.readTime,...result.rows}));
 const decorate=data=>{
  if(!cutoff)return data;
  const day=cutoff.throughDate,month=day.slice(0,7);
  const lastDay=new Date(Date.UTC(Number(day.slice(0,4)),Number(day.slice(5,7)),0)).getUTCDate();
  const months=data.months?.map(row=>row.monthKey===month&&Number(day.slice(8,10))===lastDay&&row.activeEnrollmentBasis==='observed_snapshot'
   ? {...row,activeEnrollmentBasis:'observed_month_end'}:row);
  return {...data,...(months?{months}:{}),throughDate:day,refreshMode:'daily_closed_day'};
 };
 const documents=reports.map(r=>({path:ROOT+'/businessAnalyticsYears/'+r.annual.year,data:decorate(r.annual)}));
 documents.push({path:ROOT+'/businessAnalyticsSnapshots/current',data:decorate(reports[0].current)});
 // Only aggregate results leave this boundary. Never return source IDs or data.
 const summary={readTime:result.readTime,throughDate:cutoff?.throughDate,sourceDocuments:result.documents,sourcePages:result.pages,sourceCounts:result.counts,unrelatedInquiryRows:result.unrelatedInquiryRows,projectionWrites:documents.length,years:[...years],issues:reports[0].issues};
 if(!apply)return {...summary,outcome:'dry-run',documents};
 assert(publisher&&typeof publisher.publish==='function','Explicit publisher required');
 const outcome=await publisher.publish({documents,readTime:result.readTime,throughDate:cutoff?.throughDate});
 return {...summary,outcome};
}
