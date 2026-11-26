import {planContributionChange} from './business-analytics-incremental.mjs';
import {ledgerPath} from './business-analytics-flow-publisher.mjs';

const ROOT='adminStats/businessAnalyticsV1';
const FLOW=['leadEnquiries','newOpportunities','repeatEnquiries','billedPaise','receivedPaise'];
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
// Offline only: construct a complete seed manifest for a declared set of years.
// Inputs must come from a separately certified, complete source snapshot at a consistent watermark.
// Never publishes or activates control; the operator must verify all staged docs before handoff.
export function prepareFlowBaseline({generation,sourceWatermark,annuals,contributors}) {
  assert(typeof generation==='string' && generation.length>0 && typeof sourceWatermark==='string' && sourceWatermark.length>0,'Generation and source watermark required');
  assert(Array.isArray(annuals) && annuals.length>0 && Array.isArray(contributors),'Missing seed inputs');
  const years=new Set(), rows=new Map(), documents=[];
  for(const annual of annuals){
    assert(annual?.schemaVersion===1 && annual?.metricDefinitionVersion===1 && annual?.verificationStatus==='verified' && /^\d{4}$/.test(annual.year) && !years.has(annual.year) && typeof annual.updatedAt==='string' && Number.isFinite(Date.parse(annual.updatedAt)) && Array.isArray(annual.months) && annual.months.length===12,'Invalid or duplicate annual baseline');
    years.add(annual.year);
    for(const month of annual.months){
      assert(typeof month.monthKey==='string' && new RegExp('^'+annual.year+'-(0[1-9]|1[0-2])$').test(month.monthKey) && !rows.has(month.monthKey) && month.metrics && typeof month.metrics==='object','Invalid or duplicate month');
      const coverage={};
      for(const metric of FLOW){
        const value=month.metrics[metric];
        assert(value===null || (Number.isSafeInteger(value) && value>=0),'Flow metric must be certified value or null');
        coverage[metric]=value!==null;
      }
      rows.set(month.monthKey,{...month,coverage,schemaVersion:1,metricDefinitionVersion:1,verificationStatus:'verified',updatedAt:annual.updatedAt,generation});
    }
    documents.push({path:ROOT+'/businessAnalyticsYears/'+annual.year,data:{...annual,generation}});
  }
  const totals=new Map(), identities=new Set();
  for(const source of contributors){
    const {ledger}=planContributionChange(null,source);
    const path=ledgerPath(ledger.contributorId);
    assert(!identities.has(path),'Duplicate seed contributor');
    identities.add(path);
    for(const f of ledger.facts){
      assert(FLOW.includes(f.metric) && rows.has(f.monthKey),'Fact outside certified flow seed scope');
      const key=f.monthKey+':'+f.metric;
      const value=(totals.get(key)||0)+f.value;
      assert(Number.isSafeInteger(value),'Unsafe seed total');
      totals.set(key,value);
    }
    documents.push({path,data:{generation,record:ledger}});
  }
  for(const [monthKey,row] of rows){
    for(const metric of FLOW){
      const actual=totals.get(monthKey+':'+metric)||0;
      if(row.coverage[metric]) assert(row.metrics[metric]===actual,'Seed contribution mismatch: '+monthKey+':'+metric);
    }
    documents.push({path:ROOT+'/businessAnalyticsMonths/'+monthKey,data:row});
  }
  return {generation,sourceWatermark,documents,
    verificationRequired:true,
    activationCandidate:{path:ROOT+'/businessAnalyticsControl/active',data:{generation,sourceWatermark,state:'ready',ledgerSeeded:true}},
    counts:{years:years.size,months:rows.size,contributors:identities.size,documents:documents.length}};
}
