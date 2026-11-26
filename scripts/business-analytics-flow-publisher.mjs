import {createHash} from 'node:crypto';
import {planContributionChange,applyContributionDeltas} from './business-analytics-incremental.mjs';

const ROOT='adminStats/businessAnalyticsV1';
const SAFE=new Set(['leadEnquiries','newOpportunities','repeatEnquiries','billedPaise','receivedPaise']);
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const monthPath=k=>ROOT+'/businessAnalyticsMonths/'+k;
const yearPath=k=>ROOT+'/businessAnalyticsYears/'+k;
export const ledgerPath=id=>ROOT+'/businessAnalyticsContributors/'+createHash('sha256').update(id).digest('hex');
const controlPath=ROOT+'/businessAnalyticsControl/active';
// Explicit dependency injection: store.runTransaction(fn), tx.get(path), tx.set(path,plainObject).
// No Firebase initialization, export, scheduler or credentials. A future authorized adapter
// must implement atomic transaction retries and enforce a versioned baseline/ledger handoff.
export async function publishCertifiedFlowChange(store,incoming,{generation,updatedAt}) {
  assert(typeof generation==='string' && generation.length>0,'Generation required');
  assert(typeof updatedAt==='string' && Number.isFinite(Date.parse(updatedAt)),'Valid updatedAt required');
  assert(typeof incoming?.contributorId==='string' && incoming.contributorId.length>0,'Contributor required');
  return store.runTransaction(async tx=>{
    const control=await tx.get(controlPath);
    assert(control?.generation===generation && control?.state==='ready' && control?.ledgerSeeded===true,'Certified ledger baseline required');
    const path=ledgerPath(incoming.contributorId);
    const stored=await tx.get(path);
    assert(!stored || stored.generation===generation,'Contributor generation mismatch');
    const plan=planContributionChange(stored?.record??null,incoming);
    if(plan.outcome!=='apply') return {outcome:plan.outcome,monthWrites:0,yearWrites:0};
    assert(plan.ledger.facts.every(f=>SAFE.has(f.metric)) && (stored?.record?.facts||[]).every(f=>SAFE.has(f.metric)),'Lifecycle movement requires a stock-consistent publisher');
    const monthKeys=[...new Set(plan.deltas.map(d=>d.monthKey))];
    const years=[...new Set(monthKeys.map(k=>k.slice(0,4)))];
    assert(monthKeys.length<=2 && years.length<=2,'Flow change exceeds bounded publication scope');
    const months=new Map(), annual=new Map();
    for(const key of monthKeys) {
      const row=await tx.get(monthPath(key));
      assert(row?.generation===generation && row?.monthKey===key && row?.verificationStatus==='verified' && row?.schemaVersion===1 && row?.metricDefinitionVersion===1,'Uncertified monthly baseline');
      months.set(key,row);
    }
    for(const year of years) {
      const row=await tx.get(yearPath(year));
      assert(row?.generation===generation && row?.year===year && row?.verificationStatus==='verified' && row?.schemaVersion===1 && row?.metricDefinitionVersion===1 && Array.isArray(row.months) && row.months.length<=12,'Uncertified yearly baseline');
      assert(new Set(row.months.map(m=>m.monthKey)).size===row.months.length,'Duplicate yearly month');
      annual.set(year,row);
    }
    const changes=applyContributionDeltas(months,plan.deltas);
    // Validate yearly mirror and all reads before any writes (Firestore transaction requirement).
    for(const [key,monthly] of changes) {
      const year=key.slice(0,4), row=annual.get(year);
      const index=row.months.findIndex(m=>m.monthKey===key);
      assert(index>=0,'Missing yearly month mirror');
      const mirror=row.months[index], baseline=months.get(key);
      assert(mirror.metrics && baseline.metrics && [...new Set([...Object.keys(mirror.metrics),...Object.keys(baseline.metrics)])].every(metric=>(mirror.metrics[metric]??null)===(baseline.metrics[metric]??null)),'Year/month projection drift');
      assert(typeof row.updatedAt==='string' && Number.isFinite(Date.parse(row.updatedAt)),'Invalid yearly baseline timestamp');
      const stamp=Date.parse(updatedAt)>=Date.parse(row.updatedAt)?updatedAt:row.updatedAt;
      annual.set(year,{...row,updatedAt:stamp,months:row.months.map((m,i)=>i===index?{...m,metrics:monthly.metrics}:m)});
    }
    for(const [key,row] of changes) {
      assert(typeof row.updatedAt==='string' && Number.isFinite(Date.parse(row.updatedAt)),'Invalid monthly baseline timestamp');
      const stamp=Date.parse(updatedAt)>=Date.parse(row.updatedAt)?updatedAt:row.updatedAt;
      tx.set(monthPath(key),{...row,updatedAt:stamp});
    }
    for(const [key,row] of annual) tx.set(yearPath(key),row);
    tx.set(path,{generation,record:plan.ledger});
    return {outcome:'apply',monthWrites:changes.size,yearWrites:annual.size};
  });
}
