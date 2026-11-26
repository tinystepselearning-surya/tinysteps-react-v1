// Source-record adapters. No Firebase client initialization, scans, trigger exports or writes.
// Only the inspected canonical source shapes are supported; unsupported rows require review.
import {billedContribution,receiptContribution,planContributionChange} from './business-analytics-incremental.mjs';

const requireValue=(ok,reason)=>{if(!ok)throw new Error(reason);};
const validId=x=>typeof x==='string' && x.length>0 && x.length<=160 && !x.includes('/');
const month=x=>typeof x==='string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(x);
function millis(value) {
  if(value instanceof Date) return value.getTime();
  if(value && typeof value.toMillis==='function') return value.toMillis();
  if(value && Number.isSafeInteger(value.seconds) && Number.isInteger(value.nanoseconds) && value.nanoseconds>=0 && value.nanoseconds<1e9) return value.seconds*1000+Math.floor(value.nanoseconds/1e6);
  if(typeof value==='string' && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return Date.parse(value);
  return NaN;
}
const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'});
export function istDateKey(value) {
  const ms=millis(value);
  requireValue(Number.isFinite(ms),'Missing or ambiguous source timestamp');
  const parts=Object.fromEntries(formatter.formatToParts(new Date(ms)).map(p=>[p.type,p.value]));
  return parts.year+'-'+parts.month+'-'+parts.day;
}
// Firestore commit/update time is microsecond precision. Reject unrepresentable revisions;
// do not round timestamps or use a trigger delivery timestamp as the contributor revision.
export function sourceUpdateRevision(timestamp) {
  const s=timestamp?.seconds,n=timestamp?.nanoseconds;
  requireValue(Number.isSafeInteger(s) && s>=0 && Number.isInteger(n) && n>=0 && n<1e9 && n%1000===0,'Source revision must have exact microsecond precision');
  const v=s*1e6+n/1000;
  requireValue(Number.isSafeInteger(v),'Unsafe source revision');
  return v;
}
export function rupeesToPaise(value) {
  requireValue(typeof value==='number' && Number.isFinite(value) && value>=0,'Invalid INR amount');
  const raw=value*100,paise=Math.round(raw);
  requireValue(Number.isSafeInteger(paise) && Math.abs(raw-paise)<1e-6,'Amount is not exact to paise');
  return paise;
}
// Current canonical wallet receipt path only. Refund/legacy/void/archival needs a separately
// reconciled adapter; do not convert these to zero or use payment allocation as cash received.
export function adaptCanonicalReceipt({id,data,updateTime}) {
  requireValue(validId(id) && data && data.sourceSystem==='admin_receive_parent_payment' && data.sourceFunction==='adminReceiveParentPayment','Unsupported receipt source');
  requireValue(data.status==='completed' && data.currency==='INR' && data.archived!==true && data.isArchived!==true && !data.reversalOfTransactionId && !data.refundedAt && !data.voidedAt && !data.refundAmount && !data.refundedAmount && !data.reversedAt && !data.deletedAt,'Unsupported receipt lifecycle');
  requireValue(validId(data.parentId) && validId(data.walletTransactionId) && typeof data.idempotencyKey==='string' && data.idempotencyKey.trim().length>0,'Missing receipt identity');
  const paidDate=istDateKey(data.paidAt);
  requireValue(month(data.receiptMonthKey) && data.receiptMonthKey===paidDate.slice(0,7) && data.paidDateKey===paidDate && data.monthKey===data.receiptMonthKey && data.date===paidDate,'Receipt period disagreement');
  const paise=rupeesToPaise(data.amount);
  requireValue(paise>0,'Nonpositive receipt');
  requireValue(rupeesToPaise(data.walletCreditedAmount)===paise,'Receipt/wallet amount disagreement');
  return receiptContribution({id,revision:sourceUpdateRevision(updateTime),receiptMonthKey:data.receiptMonthKey,netReceivedPaise:paise});
}
// Use existing canonical billing_v2 parent-month projection; do not rescan charges.
// Only billed is emitted now. Outstanding is a separately reconciled as-of stock.
export function adaptParentBillingMonth({parentId,monthKey,data,updateTime}) {
  requireValue(validId(parentId) && month(monthKey) && data && data.parentId===parentId && data.monthKey===monthKey,'Billing projection path mismatch');
  requireValue(data.schemaVersion===2 && data.modelType==='billing_v2' && data.allocationAware===true && data.computedFrom==='billingCharges + charge settlement metadata','Unsupported billing projection');
  const billed=rupeesToPaise(data.billedAmount),settled=rupeesToPaise(data.settledAmount),due=rupeesToPaise(data.dueAmount);
  requireValue(billed===settled+due,'Billing/settlement does not reconcile');
  requireValue(Number.isSafeInteger(data.billedClassCount) && data.billedClassCount>=0 && typeof data.billingCompositionFingerprint==='string' && data.billingCompositionFingerprint.length>0,'Missing billing composition evidence');
  requireValue(rupeesToPaise(data.totals?.billedAmount)===billed && rupeesToPaise(data.totals?.settledAmount)===settled && rupeesToPaise(data.totals?.dueAmount)===due,'Nested billing totals disagree');
  return billedContribution({id:JSON.stringify([parentId,monthKey]),revision:sourceUpdateRevision(updateTime),serviceMonthKey:monthKey,netBilledPaise:billed});
}
// Website-only canonical identity cohort. Caller must certify full history and supply
// a durable monotonic cohort revision (not max event updateTime; deletes/rekeys may regress).
// Stable contributor per hashed identity allows reclassification/replay after late history.
// A non-website source must have its own coverage and normalization adapter.
export function adaptWebsiteInquiryCohort({canonicalId,canonical,events,revision,historyComplete,duplicatePolicy}) {
  requireValue(validId(canonicalId) && canonical?.source==='website' && canonical.dedupeCanonicalLeadId===canonicalId && /^[0-9a-f]{64}$/i.test(canonical.dedupeIdentityKey||'') && !canonical.dedupeConflict,'Unresolved website identity');
  requireValue(historyComplete===true && Array.isArray(events) && events.length>0 && events.length<=500 && Number.isSafeInteger(canonical.inquiryCount) && canonical.inquiryCount===events.length,'Incomplete or unbounded website history');
  requireValue(['one_per_ist_day','all_submissions'].includes(duplicatePolicy),'Explicit inquiry counting policy required');
  const ids=new Set();
  const rows=events.map(({id,data})=>{
    requireValue(validId(id) && !ids.has(id) && data?.sourceLeadId===id && data.source==='website','Ambiguous inquiry identity');
    ids.add(id);
    const timestamp=data.receivedAt??data.requestedAt??data.originalCreatedAt;
    const ms=millis(timestamp),day=istDateKey(timestamp);
    return {id,ms,day};
  }).sort((a,b)=>a.ms-b.ms||a.id.localeCompare(b.id));
  requireValue(millis(canonical.firstInquiryAt)===rows[0].ms,'Canonical earliest inquiry does not match history');
  const days=new Set(),facts=new Map();
  let first=true;
  for(const row of rows){
    if(duplicatePolicy==='one_per_ist_day' && days.has(row.day))continue;
    days.add(row.day);
    const monthKey=row.day.slice(0,7);
    for(const metric of ['leadEnquiries',first?'newOpportunities':'repeatEnquiries']){
      const key=monthKey+':'+metric;
      facts.set(key,(facts.get(key)||0)+1);
    }
    first=false;
  }
  // Normalize and enforce the existing 64-fact bound. Very long history needs chunked
  // certified recovery, never silently truncate it.
  const record={contributorId:'website-cohort:'+canonical.dedupeIdentityKey.toLowerCase(),revision,facts:[...facts].map(([key,value])=>({monthKey:key.slice(0,7),metric:key.slice(8),value}))};
  return planContributionChange(null,record).ledger;
}
