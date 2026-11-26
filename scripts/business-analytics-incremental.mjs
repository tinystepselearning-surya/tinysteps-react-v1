// Pure bounded incremental planner. This module is not a deployed trigger or writer.
// Revision is a monotonic source/contributor revision, NOT an event delivery timestamp.
const FLOW = new Set(['leadEnquiries','newOpportunities','repeatEnquiries','billedPaise','receivedPaise','newAdmissions','reactivations','newEnrollments','courseCompletions','courseDiscontinuations','completedStudentExits','discontinuedStudentExits','otherStudentExits','studentExits']);
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const validMonth = v => typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
const int = v => Number.isSafeInteger(v);
const MAX_FACTS = 64;
function normalize(record) {
  assert(record && typeof record.contributorId === 'string' && record.contributorId.length > 0 && record.contributorId.length <= 256, 'Invalid contributor');
  assert(int(record.revision) && record.revision >= 0, 'Invalid source revision');
  assert(Array.isArray(record.facts) && record.facts.length <= MAX_FACTS, 'Unbounded contributor');
  const map = new Map();
  for (const f of record.facts) {
    assert(validMonth(f.monthKey) && FLOW.has(f.metric) && int(f.value), 'Invalid flow fact');
    const key = f.monthKey + ':' + f.metric;
    assert(!map.has(key), 'Duplicate fact key');
    if (f.value !== 0) map.set(key, f.value);
  }
  return { contributorId: record.contributorId, revision: record.revision,
    facts: [...map].sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>({monthKey:key.slice(0,7),metric:key.slice(8),value})) };
}
export function planContributionChange(previous, incoming) {
  const next = normalize(incoming);
  const old = previous == null ? null : normalize(previous);
  assert(!old || old.contributorId === next.contributorId, 'Contributor mismatch');
  if (old && next.revision < old.revision) return { outcome:'stale', ledger:null, deltas:[] };
  if (old && next.revision === old.revision) {
    assert(JSON.stringify(old.facts) === JSON.stringify(next.facts), 'Conflicting same-revision contribution');
    return { outcome:'duplicate', ledger:null, deltas:[] };
  }
  const map = new Map();
  for (const [facts, sign] of [[old?.facts || [], -1], [next.facts, 1]]) {
    for (const f of facts) {
      const key = f.monthKey+':'+f.metric;
      const value = (map.get(key)||0)+sign*f.value;
      assert(int(value), 'Unsafe delta');
      map.set(key,value);
    }
  }
  const deltas = [...map].filter(([,v])=>v!==0).sort(([a],[b])=>a.localeCompare(b))
    .map(([key,value])=>({monthKey:key.slice(0,7),metric:key.slice(8),value}));
  return { outcome:'apply', ledger:next, deltas };
}
// Internal totals must be initialized by a certified baseline before use.
// Missing coverage does not create a zero; stock snapshots are not incremented here.
export function applyContributionDeltas(months, deltas) {
  const next = new Map();
  for (const d of deltas) {
    assert(validMonth(d.monthKey) && FLOW.has(d.metric) && int(d.value), 'Invalid delta');
    const base = next.get(d.monthKey) || months.get(d.monthKey);
    assert(base && base.coverage?.[d.metric] === true && int(base.metrics?.[d.metric]), 'Uncertified baseline: '+d.monthKey+':'+d.metric);
    const value = base.metrics[d.metric]+d.value;
    assert(int(value) && value >= 0, 'Invalid resulting aggregate');
    next.set(d.monthKey,{...base,metrics:{...base.metrics,[d.metric]:value}});
  }
  for (const [monthKey, row] of next) {
    const m=row.metrics;
    const keys=['completedStudentExits','discontinuedStudentExits','otherStudentExits','studentExits'];
    if(keys.every(k=>row.coverage?.[k]===true)) {
      assert(keys.every(k=>int(m[k])) && m.completedStudentExits+m.discontinuedStudentExits+m.otherStudentExits===m.studentExits,'Exit breakdown mismatch: '+monthKey);
    }
  }
  return next;
}
// Source adapters use explicit business month keys and paise after source reconciliation.
// This is a normalized input boundary, not an assertion about legacy Firestore coverage.
export function receiptContribution({id,revision,receiptMonthKey,netReceivedPaise}) {
  assert(typeof id==='string' && id && validMonth(receiptMonthKey) && int(netReceivedPaise),'Invalid normalized receipt');
  return normalize({contributorId:'receipt:'+id,revision,facts:[{monthKey:receiptMonthKey,metric:'receivedPaise',value:netReceivedPaise}]});
}
export function billedContribution({id,revision,serviceMonthKey,netBilledPaise}) {
  assert(typeof id==='string' && id && validMonth(serviceMonthKey) && int(netBilledPaise),'Invalid normalized billing contribution');
  return normalize({contributorId:'bill:'+id,revision,facts:[{monthKey:serviceMonthKey,metric:'billedPaise',value:netBilledPaise}]});
}
export function inquiryContribution({id,revision,monthKey,classification}) {
  assert(typeof id==='string' && id && validMonth(monthKey) && ['new','repeat','excluded'].includes(classification),'Invalid normalized inquiry');
  const facts=classification==='excluded'?[]:[{monthKey,metric:'leadEnquiries',value:1},{monthKey,metric:classification==='new'?'newOpportunities':'repeatEnquiries',value:1}];
  return normalize({contributorId:'inquiry:'+id,revision,facts});
}
// One resolved, atomic child-level lifecycle operation. No inference from transient enrollment writes.
export function childMovementContribution({id,revision,monthKey,retainedBefore,retainedAfter,everAdmittedBefore,exitReason,courseCounts}) {
  assert(typeof id==='string' && id && validMonth(monthKey) && typeof retainedBefore==='boolean' && typeof retainedAfter==='boolean' && typeof everAdmittedBefore==='boolean','Invalid normalized lifecycle operation');
  assert(!retainedBefore || everAdmittedBefore,'Inconsistent admission history');
  assert(courseCounts && ['newEnrollments','courseCompletions','courseDiscontinuations'].every(k=>int(courseCounts[k]) && courseCounts[k]>=0),'Invalid course counts');
  const facts=Object.entries(courseCounts).map(([metric,value])=>({monthKey,metric,value}));
  if (!retainedBefore && retainedAfter) facts.push({monthKey,metric:everAdmittedBefore?'reactivations':'newAdmissions',value:1});
  if (retainedBefore && !retainedAfter) {
    assert(['completed','discontinued','other'].includes(exitReason),'Missing final exit reason');
    facts.push({monthKey,metric:'studentExits',value:1},{monthKey,metric:exitReason+'StudentExits',value:1});
  }
  return normalize({contributorId:'child-operation:'+id,revision,facts});
}
