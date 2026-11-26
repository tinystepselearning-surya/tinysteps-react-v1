// Count-only inventory for the actual Admin Analytics V3 query shapes.
 // No document fetches, credentials, application initialization, or mutations.
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const validMonth=month=>typeof month==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(month);
const ymd=d=>d.toISOString().slice(0,10);
function istDay(now){
 assert(now instanceof Date&&Number.isFinite(now.getTime()),'Valid clock required');
 return ymd(new Date(now.getTime()+19800000));
}
export function analyticsInventoryPlan(month,now=new Date()){
 assert(validMonth(month),'Explicit YYYY-MM reporting month required');
 const today=istDay(now),currentMonth=today.slice(0,7);
 assert(month<=currentMonth,'Select current or past month for observed baseline');
 const start=month+'-01';
 const end=month+'-'+String(new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).getUTCDate()).padStart(2,'0');
 const attributionEnd=month===currentMonth?today:end;
 const simple=(id,collection,group=false,filters=[])=>({id,collection,group,filters});
 const monthFilter=[['monthKey','==',month]];
 const sourceQueries=[
  simple('leads','leads'),simple('demos','demoSessions'),
  simple('users','users'),simple('enrollments','enrollments'),simple('courses','courses'),
  simple('charges','billingCharges',false,monthFilter),simple('teacherEarnings','teacherEarnings',false,monthFilter),
  simple('sessions','classSessions',false,[['date','>=',start],['date','<=',end]]),
  simple('parentMonthModels','months',true,monthFilter),simple('teacherMonthRollups','earnings',true,monthFilter),
  ...['receivedAt','requestedAt','createdAt'].map(field=>simple('attribution_'+field,'leads',false,[
    [field,'>=',new Date(start+'T00:00:00.000+05:30')],
    [field,'<=',new Date(attributionEnd+'T23:59:59.999+05:30')],
  ])),
 ];
 return {month,today,start,end,attributionEnd,sourceQueries};
}
const safeCount=n=>Number.isSafeInteger(n)&&n>=0;
const rawReadFloor=n=>Math.max(1,n);
export function summarizeAnalyticsInventory(plan,counts){
 for(const {id} of plan.sourceQueries)assert(safeCount(counts[id]),'Missing or invalid count: '+id);
 const n=id=>rawReadFloor(counts[id]);
 const growth=n('leads')+n('demos');
 const delivery=n('charges')+n('sessions')+n('enrollments')+n('courses');
 const teachers=n('teacherEarnings')+n('users');
 const acquisition=n('attribution_receivedAt')+n('attribution_requestedAt')+n('attribution_createdAt');
 // The Finance readiness marker costs one read. Certification is not tested here.
 // Use both branches of the existing loader; an unsuccessful rollup attempt
 // followed by raw fallback may cost both. The canonical finance aggregate is
 // separate and not priced from result cardinality alone.
 const finance={
  uncertified:delivery+1+n('teacherEarnings'),
  certified:delivery+1+n('teacherMonthRollups'),
  unsafeRollupFallback:delivery+1+n('teacherMonthRollups')+n('teacherEarnings'),
 };
 return {
  reportingMonth:plan.month,observedThroughDay:plan.attributionEnd,
  counts:Object.fromEntries(plan.sourceQueries.map(({id})=>[id,counts[id]])),
  aggregateQueries:plan.sourceQueries.length,
  uncachedDocumentQueryReadFloors:{overview:growth,growth,acquisition,finance,delivery,teachers,monthlyTrends:2},
  separateAggregationQueries:{overview:1,finance:1},
  notes:[
   'Count-only query results are matched documents, not observed billed reads or index entries scanned.',
   'Floors include minimum one read per document query; cached, repeated listener, reconnect, index-entry and rule-dependent reads are not measured.',
   'Acquisition queries can overlap; count each query separately for current read cost. Browser deduplication occurs after retrieval.',
   'Parent months and teacher earnings collection groups mirror existing queries and may contain unrelated rows; certification and query scope require separate verification.',
   'Finance floor excludes canonical sum aggregation index charges; teacher rollup readiness and fallback are scenarios, not measured usage.',
   'Independent uncached openings only. Shared in-page cache can reduce cross-tab queries; do not add these floors as an observed session total.',
   'No nightly expansion approved by this inventory alone. Compare actual daily opens and marginal batch costs before enabling capture.',
  ],
 };
}
export async function runCountOnlyInventory(plan,runCount){
 assert(typeof runCount==='function','Count adapter required');
 const counts={};
 // Sequential execution: fixed 13 aggregate requests, no retries or document scans.
 for(const q of plan.sourceQueries){
  const n=await runCount(q);
  assert(safeCount(n),'Invalid count: '+q.id);
  counts[q.id]=n;
 }
 return summarizeAnalyticsInventory(plan,counts);
}
