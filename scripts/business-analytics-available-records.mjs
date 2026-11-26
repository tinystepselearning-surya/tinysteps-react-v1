// Available-records monthly report. Pure/offline: no credentials, Firestore initialization or writes.
// Count recorded enquiries (including repeat submissions); do not perform identity deduplication.
import {istDateKey,rupeesToPaise} from './business-analytics-source-adapters.mjs';
const active=new Set(['active','enrolled','current','ongoing']);
const terminal=new Set(['completed','discontinued','expired','cancelled','canceled','archived','inactive']);
const excludedCharge=new Set(['void','cancelled','canceled','reversed','refunded']);
const str=v=>typeof v==='string'?v.trim():'';
const status=v=>str(v).toLowerCase();
const month=v=>/^\d{4}-(0[1-9]|1[0-2])$/.test(str(v))?str(v):null;
function day(v){
 if(typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v)){
  const d=new Date(v+'T00:00:00Z');
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v?v:null;
 }
 try{return istDateKey(v);}catch{return null;}
}
const date=(...values)=>values.map(day).find(Boolean)||null;
const money=v=>{try{return rupeesToPaise(typeof v==='string'&&/^\d+(\.\d{1,2})?$/.test(v.trim())?Number(v):v);}catch{return null;}};
const zero=()=>({leadEnquiries:0,billedPaise:0,newAdmissions:0,newEnrollments:0,courseCompletions:0,courseDiscontinuations:0,completedStudentExits:0,discontinuedStudentExits:0,otherStudentExits:0,studentExits:0});
const assert=(v,m)=>{if(!v)throw Error(m);};
export function buildAvailableBusinessTrends({year,updatedAt,leads,inquiries,billingCharges,enrollments}){
 assert(typeof year==='string'&&/^\d{4}$/.test(year)&&day(updatedAt),'Invalid reporting period');
 for(const rows of [leads,inquiries,billingCharges,enrollments])assert(Array.isArray(rows),'Explicit source arrays required');
 const asOf=day(updatedAt),months=Array.from({length:12},(_,i)=>({monthKey:year+'-'+String(i+1).padStart(2,'0'),metrics:zero()}));
 const byMonth=new Map(months.map(r=>[r.monthKey,r.metrics]));
 const issues={undatedEnquiries:0,undatedCharges:0,invalidChargeAmounts:0,undatedAdmissions:0,undatedCourseEnds:0,unresolvedEnrollmentIdentity:0,unresolvedEnrollmentStatus:0,ambiguousStudentExits:0};
 const add=(m,k,n=1)=>{if(!byMonth.has(m)||m>asOf.slice(0,7))return;const row=byMonth.get(m);row[k]+=n;assert(Number.isSafeInteger(row[k]),'Unsafe total');};
 const exact=(rows,scope)=>{const seen=new Set();return rows.map(r=>{assert(r&&str(r.id)&&r.data&&typeof r.data==='object','Invalid '+scope+' row');assert(!seen.has(r.id),'Repeated source row in '+scope);seen.add(r.id);return r;});};
 // Inquiry events are authoritative where present. Count each recorded source submission once
 // (not one per phone or child). A lead document without its own event supplies one fallback.
 const eventIds=new Map();
 for(const row of exact(inquiries,'inquiries')){
  const id=str(row.data.sourceLeadId)||str(row.id);
  const d=date(row.data.receivedAt,row.data.requestedAt,row.data.originalCreatedAt,row.data.createdAt);
  if(eventIds.has(id)){assert(eventIds.get(id)===d,'Conflicting copies of one source inquiry');continue;}
  eventIds.set(id,d);
  if(d)add(d.slice(0,7),'leadEnquiries');else issues.undatedEnquiries++;
 }
 for(const {id,data} of exact(leads,'leads')){
  if(eventIds.has(id))continue;
  // Canonical lead may have been retained from a different event: avoid counting its
  // fallback twice when the supplied event history already contains the same source ID.
  const d=date(data.receivedAt,data.requestedAt,data.createdAt,data.firstInquiryAt);
  if(d)add(d.slice(0,7),'leadEnquiries');else issues.undatedEnquiries++;
 }
 // Match canonical billing's exclusion of archived and void/cancelled/reversed charge records.
 // This is billed charges, not payment/refund accounting. Never read payment records here.
 for(const {data} of exact(billingCharges,'billingCharges')){
  if(data.archived===true||data.isArchived===true||excludedCharge.has(status(data.status))||data.isVoided===true)continue;
  const m=month(data.monthKey)||date(data.serviceDate,data.date,data.classDate)?.slice(0,7);
  if(!m){issues.undatedCharges++;continue;}
  const amount=money(data.amount);
  if(amount===null){issues.invalidChargeAmounts++;continue;}
  add(m,'billedPaise',amount);
 }
 // Use existing identity aliases, not names. For single-child rows conflicting aliases
 // and multi-child rows are unresolved rather than guessed.
 const children=new Map(),activeKids=new Set(),pausedKids=new Set();
 let activeEnrollments=0;
 for(const {id,data} of exact(enrollments,'enrollments')){
  const ids=[...new Set([str(data.kidId),str(data.studentId),...(Array.isArray(data.kidIds)?data.kidIds.map(str):[])].filter(Boolean))];
  if(ids.length!==1){issues.unresolvedEnrollmentIdentity++;continue;}
  const child=ids[0],s=status(data.status),isActive=active.has(s)&&data.archived!==true&&data.isArchived!==true&&!data.archivedAt;
  const isPaused=s==='paused'&&data.archived!==true&&data.isArchived!==true&&!data.archivedAt;
  const isTerminal=terminal.has(s)||data.archived===true||data.isArchived===true||Boolean(data.archivedAt);
  if(!isActive&&!isPaused&&!isTerminal){issues.unresolvedEnrollmentStatus++;continue;}
  if(isActive){activeKids.add(child);activeEnrollments++;}
  if(isPaused)pausedKids.add(child);
  const start=date(data.enrollmentDate,data.createdAt,data.activatedAt,data.enrollmentStartDate,data.classesStartDateYmd,data.classesStartDate,data.startDate);
  const end=isTerminal?date(data.completedAt,data.endedAt,data.discontinuedAt,data.expiredAt,data.cancelledAt,data.canceledAt,data.archivedAt):null;
  const correction=Boolean(data.correctedToEnrollmentId||data.supersededByEnrollmentId||data.transitionType==='correction');
  if(!start)issues.undatedAdmissions++;
  if(isTerminal&&!end)issues.undatedCourseEnds++;
  if(start&&!correction)add(start.slice(0,7),'newEnrollments');
  if(end&&!correction&&s==='completed')add(end.slice(0,7),'courseCompletions');
  if(end&&!correction&&s==='discontinued')add(end.slice(0,7),'courseDiscontinuations');
  const rows=children.get(child)||[];rows.push({id,start,end,s,isTerminal,correction});children.set(child,rows);
 }
 for(const rows of children.values()){
  const dated=rows.filter(r=>r.start).sort((a,b)=>a.start.localeCompare(b.start));
  if(dated.length&&rows.every(r=>r.start))add(dated[0].start.slice(0,7),'newAdmissions');
  // Infer exit only from a dated end where no other course is retained on that day.
  // Same-day transitions are not student exits. Missing dates prevent unsafe inference.
  if(rows.some(r=>!r.start||(r.isTerminal&&(!r.end||r.end<r.start)))){issues.ambiguousStudentExits++;continue;}
  const ends=[...new Set(rows.filter(r=>r.isTerminal&&r.end&&!r.correction).map(r=>r.end))].sort();
  for(const end of ends){
   const retained=rows.some(r=>r.start<=end&&(!r.isTerminal||r.end>end));
   if(retained)continue;
   const ended=rows.filter(r=>r.end===end&&!r.correction);
   const reason=ended.some(r=>r.s==='discontinued')?'discontinued':ended.every(r=>r.s==='completed')?'completed':'other';
   add(end.slice(0,7),'studentExits');add(end.slice(0,7),reason+'StudentExits');
  }
 }
 for(const row of months)if(row.monthKey>asOf.slice(0,7))for(const k of Object.keys(row.metrics))row.metrics[k]=null;
 const base={schemaVersion:1,metricDefinitionVersion:1,updatedAt,verificationStatus:'verified',coverageMode:'available_records',issues};
 return {annual:{...base,year,months},current:{...base,activeStudents:activeKids.size,activeEnrollments,pausedStudents:[...pausedKids].filter(k=>!activeKids.has(k)).length,retainedStudents:new Set([...activeKids,...pausedKids]).size},issues};
}
