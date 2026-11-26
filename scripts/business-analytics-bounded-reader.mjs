// Bounded read-only source collection, shared by dry-run and refresh. No credentials or app init.
// One snapshot, field masks (no names, phone numbers, notes or payment data), no per-child queries.
const FIELDS={
 leads:['receivedAt','requestedAt','createdAt','firstInquiryAt'],
 inquiries:['sourceLeadId','receivedAt','requestedAt','originalCreatedAt','createdAt'],
 billingCharges:['monthKey','serviceDate','date','classDate','amount','status','archived','isArchived','isVoided'],
 enrollments:['kidId','studentId','kidIds','status','archived','isArchived','archivedAt','enrollmentDate','createdAt','activatedAt','enrollmentStartDate','classesStartDateYmd','classesStartDate','startDate','completedAt','endedAt','discontinuedAt','expiredAt','cancelledAt','canceledAt','correctedToEnrollmentId','supersededByEnrollmentId','transitionType'],
};
export const SOURCE_FIELDS=Object.freeze(Object.fromEntries(Object.entries(FIELDS).map(([k,v])=>[k,Object.freeze(v)])));
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const positive=(v,max)=>Number.isSafeInteger(v)&&v>0&&v<=max;
// store.readSnapshot(fn) passes a reader with page(kind,{after,limit,fields}).
// Each page reports a stable readTime ISO timestamp and full source document paths.
export async function collectBusinessSources(store,{maxDocuments,pageSize=250,maxPages=400}={}){
 assert(positive(maxDocuments,100000)&&positive(pageSize,500)&&positive(maxPages,1000),'Explicit bounded source budget required');
 return store.readSnapshot(async reader=>{
  const rows={leads:[],inquiries:[],billingCharges:[],enrollments:[]};
  const counts={leads:0,inquiries:0,billingCharges:0,enrollments:0};
  let readTime=null,documents=0,pages=0,unrelatedInquiryRows=0;
  for(const kind of Object.keys(rows)){
   let after=null;
   const seen=new Set();
   for(;;){
    assert(pages<maxPages,'Source page budget exhausted');
    const remaining=maxDocuments-documents;
    // One lookahead is allowed to prove exhaustion. It is never retained or published.
    const limit=Math.min(pageSize,remaining+1);
    const page=await reader.page(kind,{after,limit,fields:SOURCE_FIELDS[kind]});
    pages++;
    assert(page&&Array.isArray(page.rows)&&page.rows.length<=limit&&typeof page.readTime==='string'&&Number.isFinite(Date.parse(page.readTime)),'Invalid source page');
    if(readTime===null)readTime=page.readTime;
    assert(page.readTime===readTime,'Source snapshot changed during collection');
    documents+=page.rows.length;
    counts[kind]+=page.rows.length;
    assert(documents<=maxDocuments,'Source document budget exceeded; no partial report');
    for(const row of page.rows){
     assert(row&&typeof row.path==='string'&&row.data&&typeof row.data==='object'&&!seen.has(row.path),'Invalid or repeated source path');
     seen.add(row.path);
     const parts=row.path.split('/');
     if(kind==='inquiries'){
      if(parts.length!==4||parts[0]!=='leads'||parts[2]!=='inquiries'){unrelatedInquiryRows++;continue;}
      rows[kind].push({id:row.path,data:{...row.data,sourceLeadId:row.data.sourceLeadId||parts[3]}});
     }else{
      assert(parts.length===2&&parts[0]===kind&&parts[1],'Unexpected source collection');
      rows[kind].push({id:parts[1],data:row.data});
     }
    }
    if(page.rows.length<limit)break;
    const next=page.rows.at(-1)?.path;
    assert(next&&next!==after,'Source cursor did not advance');
    after=next;
   }
  }
  return {rows,readTime,counts,documents,pages,unrelatedInquiryRows};
 });
}
