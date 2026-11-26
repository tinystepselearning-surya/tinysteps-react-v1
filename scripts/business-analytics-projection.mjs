// Pure offline projection builder. Inputs must be normalized and independently reconciled.
// No Firebase imports, credentials, network requests or writes.
const METRICS = [
  'leadEnquiries','newOpportunities','repeatEnquiries',
  'billedPaise','receivedPaise','outstandingPaise',
  'openingRetainedStudents','newAdmissions','reactivations','newEnrollments',
  'courseCompletions','courseDiscontinuations','completedStudentExits',
  'discontinuedStudentExits','otherStudentExits','studentExits',
  'closingRetainedStudents','closingActiveStudents','closingActiveEnrollments',
];
const STOCK = new Set(['outstandingPaise','openingRetainedStudents','closingRetainedStudents','closingActiveStudents','closingActiveEnrollments']);
const isCount = n => Number.isSafeInteger(n) && n >= 0;
const assert = (ok, why) => { if (!ok) throw new Error(why); };
const sum = (a,b) => { const n = a+b; assert(Number.isSafeInteger(n), 'Unsafe aggregate integer'); return n; };
export function buildBusinessAnalytics({year, updatedAt, contributions, coverage, roster, rosterVerified = false}) {
  assert(typeof year === 'string' && /^\d{4}$/.test(year), 'Invalid year');
  assert(typeof updatedAt === 'string' && Number.isFinite(Date.parse(updatedAt)), 'Invalid timestamp');
  assert(Array.isArray(contributions) && Array.isArray(coverage) && Array.isArray(roster), 'Invalid inputs');
  const validMonth = k => typeof k === 'string' && new RegExp('^'+year+'-(0[1-9]|1[0-2])$').test(k);
  const keys = new Set(), totals = new Map(), seen = new Map(), stockSeen = new Set();
  for (const c of coverage) {
    assert(validMonth(c.monthKey) && METRICS.includes(c.metric), 'Invalid coverage');
    // Missing coverage never becomes zero. Each entry is an external certification claim.
    assert(c.verified === true, 'Coverage must be explicitly verified');
    keys.add(c.monthKey + ':' + c.metric);
  }
  for (const f of contributions) {
    assert(validMonth(f.monthKey) && METRICS.includes(f.metric) && typeof f.eventId === 'string' && f.eventId.length > 0 && Number.isSafeInteger(f.value), 'Invalid contribution');
    const key = f.monthKey + ':' + f.metric;
    const identity = JSON.stringify([f.metric, f.eventId]);
    const serialized = JSON.stringify([f.monthKey, f.value]);
    if (seen.has(identity)) { assert(seen.get(identity) === serialized, 'Conflicting duplicate contribution'); continue; }
    seen.set(identity, serialized);
    if (STOCK.has(f.metric)) {
      assert(!stockSeen.has(key) && isCount(f.value), 'Stock metric requires one nonnegative snapshot');
      stockSeen.add(key);
    }
    totals.set(key, sum(totals.get(key) || 0, f.value));
  }
  const months = Array.from({length:12},(_,i)=>{
    const monthKey = year+'-'+String(i+1).padStart(2,'0');
    const metrics = Object.fromEntries(METRICS.map(metric=>{
      const key = monthKey+':'+metric;
      if (!keys.has(key) || (STOCK.has(metric) && !stockSeen.has(key))) return [metric,null];
      const value = totals.get(key) || 0;
      assert(isCount(value),'Negative or unsafe metric: '+key);
      return [metric,value];
    }));
    const m = metrics;
    if ([m.openingRetainedStudents,m.newAdmissions,m.reactivations,m.studentExits,m.closingRetainedStudents].every(n=>n!==null)) {
      assert(m.openingRetainedStudents+m.newAdmissions+m.reactivations-m.studentExits===m.closingRetainedStudents,'Student movement does not reconcile: '+monthKey);
    }
    if ([m.completedStudentExits,m.discontinuedStudentExits,m.otherStudentExits,m.studentExits].every(n=>n!==null)) {
      assert(m.completedStudentExits+m.discontinuedStudentExits+m.otherStudentExits===m.studentExits,'Exit reasons do not reconcile: '+monthKey);
    }
    return {monthKey,metrics};
  });
  for (let i=1;i<months.length;i++) {
    const previous=months[i-1].metrics.closingRetainedStudents, next=months[i].metrics.openingRetainedStudents;
    if (previous!==null && next!==null) assert(previous===next,'Opening/closing continuity failed: '+months[i].monthKey);
  }
  const active = new Set(), paused = new Set(), enrollments = new Map();
  for (const r of roster) {
    assert(typeof r.enrollmentId==='string' && r.enrollmentId && typeof r.childId==='string' && r.childId && ['active','paused'].includes(r.state),'Invalid normalized roster entry');
    const v = JSON.stringify([r.childId,r.state]);
    if (enrollments.has(r.enrollmentId)) { assert(enrollments.get(r.enrollmentId)===v,'Conflicting enrollment roster'); continue; }
    enrollments.set(r.enrollmentId,v);
    if(r.state==='active') active.add(r.childId); else paused.add(r.childId);
  }
  const base = {schemaVersion:1,metricDefinitionVersion:1,updatedAt,verificationStatus:'verified'};
  const current = {...base,
    activeStudents:rosterVerified?active.size:null,
    activeEnrollments:rosterVerified?[...enrollments.values()].filter(v=>JSON.parse(v)[1]==='active').length:null,
    pausedStudents:rosterVerified?[...paused].filter(id=>!active.has(id)).length:null,
    retainedStudents:rosterVerified?new Set([...active,...paused]).size:null,
  };
  return {annual:{...base,year,months},current,monthly:months.map(m=>({...base,...m}))};
}
