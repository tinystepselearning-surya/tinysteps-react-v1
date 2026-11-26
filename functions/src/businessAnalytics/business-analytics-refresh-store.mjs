// Admin SDK bridge for the bounded refresh. No credentials, scheduler or app initialization.
// Caller must establish authorization/project and supply an explicitly selected Firestore instance.
import {FieldPath,Timestamp} from 'firebase-admin/firestore';
const ROOT='adminStats/businessAnalyticsV1';
const allowed=new Set(['leads','inquiries','billingCharges','enrollments']);
const assert=(ok,message)=>{if(!ok)throw Error(message);};
// Preserve previously captured exact month-end stock, never replace it with a
// retrospective estimate. Only trust verified, same-contract month-end rows.
export function preserveObservedEnrollmentClosings(next,previous){
 if(!Array.isArray(next?.months)||!Array.isArray(previous?.months)||previous.year!==next.year||previous.schemaVersion!==1||previous.metricDefinitionVersion!==1||previous.verificationStatus!=='verified'||previous.coverageMode!=='available_records')return next;
 const known=new Map(previous.months.filter(row=>{
  const m=row.monthKey,v=row.metrics?.activeEnrollmentsAtClose;
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(m)||row.activeEnrollmentBasis!=='observed_month_end'||!Number.isSafeInteger(v)||v<0)return false;
  const cutoff=new Date(Date.UTC(Number(m.slice(0,4)),Number(m.slice(5,7)),1)-19800000-1).toISOString();
  return row.activeEnrollmentObservedAt===cutoff;
 }).map(row=>[row.monthKey,row]));
 return {...next,months:next.months.map(row=>{
  const old=known.get(row.monthKey);
  if(!old||row.activeEnrollmentBasis==='observed_month_end'||row.activeEnrollmentBasis==='observed_snapshot')return row;
  return {...row,metrics:{...row.metrics,activeEnrollmentsAtClose:old.metrics.activeEnrollmentsAtClose},activeEnrollmentBasis:'observed_month_end',activeEnrollmentObservedAt:old.activeEnrollmentObservedAt};
 })};
}
export function createBusinessRefreshStore(db){
 assert(db&&typeof db.runTransaction==='function','Firestore instance required');
 return {
  // Metadata-style aggregate count preflight; no source documents or IDs returned.
  // Counts are advisory (not snapshot-consistent); the hard collector budget remains mandatory.
  inventory:async()=>{
   const entries=await Promise.all([...allowed].map(async kind=>{
    const query=kind==='inquiries'?db.collectionGroup('inquiries'):db.collection(kind);
    const result=await query.count().get();
    const count=result.data().count;
    assert(Number.isSafeInteger(count)&&count>=0,'Invalid source count');
    return [kind,count];
   }));
   const counts=Object.fromEntries(entries);
   const total=entries.reduce((sum,[,count])=>sum+count,0);
   assert(Number.isSafeInteger(total),'Unsafe source count');
   return {counts,total,aggregateQueries:entries.length};
  },
  publishedThrough:async()=>{const snap=await db.doc(ROOT+'/businessAnalyticsControl/refresh').get();return snap.data()?.throughDate??null;},
  readSnapshot:(fn,{sourceReadTime}={})=>db.runTransaction(tx=>fn({
   async page(kind,{after,limit,fields}){
    assert(allowed.has(kind)&&Number.isSafeInteger(limit)&&limit>0&&limit<=500,'Invalid source query');
    let query=kind==='inquiries'?db.collectionGroup('inquiries'):db.collection(kind);
    query=query.orderBy(FieldPath.documentId()).select(...fields).limit(limit);
    if(after)query=query.startAfter(kind==='inquiries'?db.doc(after):after.split('/').at(-1));
    const snapshot=await tx.get(query);
    return {readTime:snapshot.readTime.toDate().toISOString(),rows:snapshot.docs.map(doc=>({path:doc.ref.path,data:doc.data()}))};
   },
  }),{readOnly:true,...(sourceReadTime?{readTime:Timestamp.fromDate(new Date(sourceReadTime))}:{})}),
  publish:async({documents,readTime,throughDate})=>{
   assert(Array.isArray(documents)&&documents.length>=2&&documents.length<=16&&typeof readTime==='string'&&Number.isFinite(Date.parse(readTime)),'Invalid publication');
   const valid=new RegExp('^'+ROOT+'/(businessAnalyticsYears/\\d{4}|businessAnalyticsSnapshots/current)$');
   assert(new Set(documents.map(d=>d.path)).size===documents.length&&documents.every(d=>valid.test(d.path)&&d.data?.updatedAt===readTime&&d.data?.coverageMode==='available_records'),'Invalid aggregate documents');
   assert(documents.filter(d=>d.path.endsWith('/current')).length===1,'Current snapshot required');
   if(throughDate)assert(/^\d{4}-\d{2}-\d{2}$/.test(throughDate)&&documents.every(d=>d.data.throughDate===throughDate&&d.data.refreshMode==='daily_closed_day'),'Invalid closed-day publication');
   // Prevent an older full refresh overwriting newer projections. Never overwrite source data.
   return db.runTransaction(async tx=>{
    const control=db.doc(ROOT+'/businessAnalyticsControl/refresh');
    const existing=await tx.get(control);
    const last=existing.data()?.sourceReadTime;
    if(throughDate&&existing.data()?.throughDate>=throughDate)return 'stale-or-replayed';
    if(last&&Date.parse(last)>=Date.parse(readTime))return 'stale-or-replayed';
    // At most one extra aggregate read per reporting year; no new operational reads.
    const annuals=documents.filter(d=>d.path.includes('/businessAnalyticsYears/'));
    const prior=await Promise.all(annuals.map(d=>tx.get(db.doc(d.path))));
    const saved=new Map(annuals.map((d,i)=>[d.path,prior[i].data()]));
    for(const d of documents)tx.set(db.doc(d.path),saved.has(d.path)?preserveObservedEnrollmentClosings(d.data,saved.get(d.path)):d.data);
    tx.set(control,{sourceReadTime:readTime,...(throughDate?{throughDate}:{}),coverageMode:'available_records',years:documents.filter(d=>!d.path.endsWith('/current')).map(d=>d.path.split('/').at(-1))},{merge:true});
    return 'published';
   });
  },
 };
}
