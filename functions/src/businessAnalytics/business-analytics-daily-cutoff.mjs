// Daily reporting boundary: midnight IST, exclusive. Use the last millisecond of yesterday.
import {istDateKey} from './business-analytics-source-adapters.mjs';
export function dailyBusinessCutoff(now=new Date()){
 const today=istDateKey(now);
 const midnight=Date.parse(today+'T00:00:00+05:30');
 const sourceReadTime=new Date(midnight-1).toISOString();
 return {throughDate:istDateKey(sourceReadTime),sourceReadTime};
}
export function requireDailyReadWindow(now,cutoff){
 const age=now.getTime()-Date.parse(cutoff.sourceReadTime);
 // Ordinary Firestore point-in-time reads are limited to one hour. Leave 10 minutes
 // for the bounded transaction and do not assume PITR is enabled.
 if(!Number.isFinite(age)||age<0||age>=50*60*1000)throw Error('Daily cutoff read window closed; retain previous published snapshot');
}
