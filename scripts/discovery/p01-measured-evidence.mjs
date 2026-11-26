import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

import { auditAcademicEnrollmentSnapshot } from '../audit-academic-enrollment.mjs';
import { auditIdentitySnapshot } from '../audit-identity-references.mjs';
import { createBoundedReconciliationCollector } from './bounded-reconciliation-collector.mjs';

const projectId = 'demo-tsos-p01-evidence';
const address = '127.0.0.1:8787';
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, address);
assert.equal(process.env.GCLOUD_PROJECT, projectId);
const { FieldPath, Firestore } = await import('@google-cloud/firestore');
const target = { mode: 'emulator', projectId, host: '127.0.0.1', port: 8787 };
const connect = () => new Firestore({ projectId, host: address, ssl: false });

const root = 'p01Evidence/' + randomUUID();
const source = root + '-source';
const restored = root + '-restored';
const damaged = root + '-negative';
const row = (id, data) => ({ id, data });
const attendance = row('official-1', { sessionId: 'session-1', status: 'present', sourceRevision: 1 });
const fixtures = {
  users: [
    row('parent-1', { uid: 'parent-1', userId: 'parent-1', role: 'parent', childIds: ['kid-1'] }),
    row('teacher-1', { uid: 'teacher-1', userId: 'teacher-1', role: 'teacher' }),
  ],
  parents: [row('parent-1', { userId: 'parent-1' })],
  teachers: [row('teacher-1', { userId: 'teacher-1' })],
  kids: [row('kid-1', { parentId: 'parent-1', parentIds: ['parent-1'], primaryParentId: 'parent-1',
    teacherId: 'teacher-1', teacherIds: ['teacher-1'] })],
  courses: [row('course-1', { name: 'Fixture Phonics', area: 'Phonics', level: 1, status: 'active', durationMinutes: 35 })],
  enrollments: [row('enrollment-1', { enrollmentId: 'enrollment-1', kidId: 'kid-1', studentId: 'kid-1',
    kidIds: ['kid-1'], parentId: 'parent-1', parentIds: ['parent-1'], teacherId: 'teacher-1',
    teacherIds: ['teacher-1'], courseId: 'course-1', status: 'active', ratePerSession: 400, currency: 'INR',
    creditsTotal: 8, creditsUsed: 1, creditsRemaining: 7, schedule: {
      schemaVersion: 1, deliveryMode: 'rolling', weeklySlots: [{ weekday: 1, time: '16:00', durationMinutes: 35 }],
    } })],
  operationalEnrollmentKeys: [row('kid-1__course-1', { enrollmentId: 'enrollment-1', kidId: 'kid-1', courseId: 'course-1' })],
  classSessions: [row('session-1', { enrollmentId: 'enrollment-1', kidId: 'kid-1', kidIds: ['kid-1'],
    parentId: 'parent-1', teacherId: 'teacher-1', courseId: 'course-1', date: '2099-01-01', startTime: '16:00',
    status: 'scheduled', source: 'rolling_schedule', feeAmount: 400, currency: 'INR' })],
  attendance: [attendance],
  charges: [row('charge-1', { sessionId: 'session-1', parentId: 'parent-1', serviceKey: 'session-1-kid-1', amountMinor: 40000 })],
  walletEvents: [
    row('credit-1', { parentId: 'parent-1', signedMinor: 50000 }),
    row('debit-1', { parentId: 'parent-1', signedMinor: -40000 }),
  ],
  wallets: [row('parent-1', { balanceMinor: 10000 })],
  schools: [row('school-a', { active: true }), row('school-b', { active: true })],
  schoolYears: [row('year-a', { schoolId: 'school-a', active: true })],
  schoolSections: [row('section-a', { schoolId: 'school-a', yearId: 'year-a', gradeId: 'grade-a' })],
  schoolGrades: [row('grade-a', { schoolId: 'school-a', yearId: 'year-a' })],
};

const domainKeys = {
  identity: ['users', 'parents', 'teachers', 'kids'],
  enrollment: ['courses', 'enrollments', 'operationalEnrollmentKeys'],
  scheduling: ['classSessions'],
  attendance: ['attendance'],
  finance: ['charges', 'walletEvents', 'wallets'],
  school: ['schools', 'schoolYears', 'schoolGrades', 'schoolSections'],
};
const plans = Object.entries(fixtures).map(([id, rows]) => ({
  id, kind: 'set', fields: [...new Set(rows.flatMap(item => Object.keys(item.data)))], where: [], cap: 4,
}));
const metrics = ['identityIssues', 'academicIssues', 'duplicateOccurrences', 'attendanceLinkIssues',
  'financeIssues', 'schoolScopeIssues'];
const empty = Object.fromEntries([
  'learningPartners','admins','students','nestedStudents','schoolUsers','demoSessions',
  'enrollmentCreationOperations','enrollmentCourseTransitions','schoolStructure','programmes','curriculumVersions',
  'deliveryOfferings','learningGroups','groupPlacements','teachingAssignments','schedulePlans',
].map(name => [name, []]));
const duplicateCount = values => values.length - new Set(values).size;
const byId = (rows, id) => rows.find(item => item.id === id)?.data;

function reconcile(rows) {
  const snapshot = { ...empty, ...rows };
  const sessionIds = new Set(rows.classSessions.map(item => item.id));
  const official = rows.attendance.filter(item => item.data.status === 'present');
  const billable = new Set(official.map(item => item.data.sessionId));
  return {
    identityIssues: auditIdentitySnapshot(snapshot, { sampleSize: 0 }).issues.total,
    academicIssues: auditAcademicEnrollmentSnapshot(snapshot, { sampleSize: 0 }).issues.total,
    duplicateOccurrences: duplicateCount(rows.classSessions.map(({ data }) => [data.kidId, data.date, data.startTime].join('|'))),
    attendanceLinkIssues: rows.attendance.filter(({ data }) => !sessionIds.has(data.sessionId)).length
      + duplicateCount(rows.attendance.map(item => item.data.sessionId)),
    financeIssues: duplicateCount(rows.charges.map(item => item.data.serviceKey))
      + rows.charges.filter(({ data }) => !billable.has(data.sessionId)
        || !byId(rows.parents, data.parentId) || !Number.isSafeInteger(data.amountMinor)).length
      + rows.wallets.filter(({ id, data }) => data.balanceMinor !== rows.walletEvents
        .filter(item => item.data.parentId === id).reduce((sum, item) => sum + item.data.signedMinor, 0)).length,
    schoolScopeIssues: rows.schoolSections.filter(({ data }) => {
      const grade = byId(rows.schoolGrades, data.gradeId);
      return !byId(rows.schools, data.schoolId) || byId(rows.schoolYears, data.yearId)?.schoolId !== data.schoolId
        || grade?.schoolId !== data.schoolId || grade?.yearId !== data.yearId;
    }).length,
  };
}

async function seed(db, prefix, records) {
  const batch = db.batch();
  for (const [collection, rows] of Object.entries(records)) {
    for (const { id, data } of rows) batch.create(db.doc(prefix + '/' + collection + '/' + id), data);
  }
  await batch.commit();
}

async function collect(db, prefix, observe = () => {}, counters = { attempts: 0, returned: 0 }) {
  const snapshotToken = 'fixture-read-only-transaction';
  return db.runTransaction(transaction => {
    const collector = createBoundedReconciliationCollector({
      target, timeoutMs: 6000, maxRequests: plans.length, maxDocuments: plans.length * 5,
      queries: plans.map(plan => ({ ...plan, path: prefix + '/' + plan.id })), summaryKeys: metrics,
    }, async request => {
      assert.deepEqual(request.target, target);
      assert.ok(request.snapshot === null || request.snapshot === snapshotToken);
      counters.attempts++;
      const result = await transaction.get(db.collection(request.path).select(...request.fields)
        .orderBy(FieldPath.documentId()).limit(request.limit));
      counters.returned += result.size;
      return { status: 'ok', complete: true, snapshot: snapshotToken,
        documents: result.docs.map(doc => ({ path: doc.ref.path, fields: doc.data() })) };
    });
    return collector(plans.map(query => query.id), input => {
      const rows = Object.fromEntries(Object.entries(input).map(([id, docs]) => [id,
        docs.map(({ path, fields }) => ({ path, id: path.split('/').at(-1), data: fields }))]));
      observe(Object.fromEntries(Object.entries(rows).map(([id, items]) => [id,
        items.map(({ id: rowId, data }) => row(rowId, data))])));
      return reconcile(rows);
    });
  }, { readOnly: true });
}

const zero = result => assert.deepEqual(result.summary, Object.fromEntries(metrics.map(key => [key, 0])));
const round = ms => Number(ms.toFixed(3));
function percentiles(values) {
  assert.ok(values.length);
  const sorted = [...values].sort((a, b) => a - b);
  const p = chance => round(sorted[Math.ceil(sorted.length * chance) - 1]);
  return { p50Ms: p(0.5), p95Ms: p(0.95) };
}

async function benchmark(warm, createClient) {
  const counters = { attempts: 0, returned: 0 };
  const timings = [];
  let errors = 0;
  for (let iteration = 0; iteration < 30; iteration++) {
    const db = createClient ? connect() : warm;
    const start = performance.now();
    try {
      zero(await collect(db, source, undefined, counters));
      timings.push(performance.now() - start);
    } catch {
      errors++;
    } finally {
      if (createClient) await db.terminate();
    }
  }
  return { samples: 30, successes: timings.length, errors, errorRate: errors / 30, ...counters, ...percentiles(timings) };
}

async function freshness(db, prefix, startingRevision, repeats) {
  const projection = db.doc(prefix + '/projections/attendance');
  const official = db.doc(prefix + '/attendance/official-1');
  await projection.create({ sourceRevision: startingRevision - 1 });
  const durations = [];
  let writes = 1;
  let reads = 0;
  for (let i = 0; i < repeats; i++) {
    const revision = startingRevision + i;
    await official.update({ sourceRevision: revision });
    writes++;
    const start = performance.now();
    const stale = await projection.get();
    reads++;
    assert.equal(stale.get('sourceRevision'), revision - 1);
    const authoritative = await official.get();
    reads++;
    assert.equal(authoritative.get('sourceRevision'), revision);
    await projection.update({ sourceRevision: authoritative.get('sourceRevision') });
    writes++;
    const fresh = await projection.get();
    reads++;
    assert.equal(fresh.get('sourceRevision'), revision);
    durations.push(performance.now() - start);
  }
  return { samples: repeats, staleRejected: repeats, reads, writes, ...percentiles(durations) };
}

const digest = value => createHash('sha256').update(value).digest('hex');
const db = connect();
try {
  await seed(db, source, fixtures);
  let checkpoint;
  const integrity = await collect(db, source, rows => { checkpoint = rows; });
  zero(integrity);
  for (const [name, rows] of Object.entries(fixtures)) assert.equal(integrity.counts[name], rows.length);

  const faults = structuredClone(fixtures);
  faults.users[0].data.uid = 'wrong-uid';
  faults.enrollments[0].data.courseId = 'missing-course';
  faults.classSessions.push(row('duplicate-slot', { ...faults.classSessions[0].data }));
  faults.attendance.push(row('missing-occurrence', { sessionId: 'missing-session', status: 'present', sourceRevision: 1 }));
  faults.charges.push(row('duplicate-charge', { ...faults.charges[0].data }));
  faults.wallets[0].data.balanceMinor = 9;
  faults.schoolSections[0].data.schoolId = 'school-b';
  await seed(db, damaged, faults);
  const negative = await collect(db, damaged);
  for (const key of metrics) assert.ok(negative.summary[key] > 0, key);

  const cold = await benchmark(db, true);
  zero(await collect(db, source));
  const warm = await benchmark(db, false);
  for (const result of [cold, warm]) {
    assert.equal(result.errors, 0);
    assert.equal(result.attempts, 30 * integrity.requests);
    assert.equal(result.returned, 30 * integrity.returned);
  }
  const projection = await freshness(db, source, 1, 20);

  const archive = JSON.stringify({ simulatedCheckpointSeconds: 0, records: checkpoint });
  const checksum = digest(archive);
  const verifyArchive = value => {
    assert.equal(digest(value), checksum, 'checkpoint checksum mismatch');
    return JSON.parse(value);
  };
  assert.throws(() => verifyArchive(archive + ' '), /checkpoint checksum mismatch/);
  // Simulate a failure 60 seconds after the checkpoint, without replaying later source revisions.
  const outageSeconds = 60;
  const restoreStart = performance.now();
  const recovery = {};
  const backup = verifyArchive(archive);
  for (const [domain, keys] of Object.entries(domainKeys)) {
    const start = performance.now();
    await seed(db, restored, Object.fromEntries(keys.map(key => [key, backup.records[key]])));
    recovery[domain] = { documentsRestored: keys.reduce((total, key) => total + backup.records[key].length, 0),
      writeCommitMs: round(performance.now() - start) };
  }
  const restoredIntegrity = await collect(db, restored, rows => assert.deepEqual(rows, backup.records));
  zero(restoredIntegrity);
  const restoredProjection = await freshness(db, restored, 1, 1);
  console.log('P01_EVIDENCE ' + JSON.stringify({ integrity, negative, cold, warm, projection,
    recovery: { domains: recovery, simulatedLossWindowSeconds: outageSeconds - backup.simulatedCheckpointSeconds,
      restoreAndVerifyMs: round(performance.now() - restoreStart), corruptArchiveRejected: true,
      allRestoredRecordsMatched: true, restoredProjection },
  }));
} finally {
  await db.terminate();
}
