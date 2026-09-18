import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  API_ROOT,
  TODAY,
  assertReadOnlyRequest,
  auditActive,
  classifyExpectedOccurrence,
  currentIndiaYmd,
  exceptionSession,
  identityMatches,
  indiaYmd,
  normalizeScheduleSlots,
  parentVisibility,
  scheduleMatches,
  schedulerActive,
  sessionDate,
  sessionDuration,
  sessionTime,
} from './audit-production-schedule-brick0.mjs';

const enrollment = {
  id: 'enr1',
  status: 'active',
  parentId: 'parent1',
  kidId: 'kid1',
  teacherId: 'teacher1',
  courseId: 'course1',
  schedule: {
    timezone: 'Asia/Kolkata',
    revision: 2,
    weeklySlots: [{weekday: 5, time: '10:00', durationMinutes: 35}],
  },
};
const kids = new Map([['kid1', {id: 'kid1', parentIds: ['parent1']}]]);
const healthySession = {
  id: 'enr1_20260918_1000',
  enrollmentId: 'enr1',
  status: 'scheduled',
  parentId: 'parent1',
  kidId: 'kid1',
  kidIds: ['kid1'],
  teacherId: 'teacher1',
  courseId: 'course1',
  date: '2026-09-18',
  startTime: '10:00',
  durationMinutes: 35,
  scheduleRevision: 2,
};
const occurrence = {
  date: '2026-09-18',
  startTime: '10:00',
  durationMinutes: 35,
  sessionId: 'enr1_20260918_1000',
};

test('Brick 0 permits only Firestore read RPCs', () => {
  assert.doesNotThrow(() => assertReadOnlyRequest('GET', 'firestore.googleapis.com', `${API_ROOT}/enrollments?pageSize=1000`));
  assert.doesNotThrow(() => assertReadOnlyRequest('POST', 'firestore.googleapis.com', `${API_ROOT}:runQuery`));
  assert.doesNotThrow(() => assertReadOnlyRequest('POST', 'firestore.googleapis.com', `${API_ROOT}:batchGet`));
});

test('Brick 0 rejects mutation RPCs, mutation verbs, and non-Firestore hosts', () => {
  assert.throws(() => assertReadOnlyRequest('POST', 'firestore.googleapis.com', `${API_ROOT}:commit`), /read-only guard rejected/);
  assert.throws(() => assertReadOnlyRequest('POST', 'firestore.googleapis.com', `${API_ROOT}:batchWrite`), /read-only guard rejected/);
  assert.throws(() => assertReadOnlyRequest('PATCH', 'firestore.googleapis.com', `${API_ROOT}/enrollments/example`), /read-only guard rejected/);
  assert.throws(() => assertReadOnlyRequest('DELETE', 'firestore.googleapis.com', `${API_ROOT}/enrollments/example`), /read-only guard rejected/);
  assert.throws(() => assertReadOnlyRequest('GET', 'example.com', '/anything'), /read-only guard rejected/);
});

test('India date handling is correct across the UTC day boundary', () => {
  assert.equal(currentIndiaYmd(new Date('2026-09-17T19:20:00Z')), '2026-09-18');
  assert.equal(indiaYmd('2026-09-18T22:30:00Z'), '2026-09-19');
  assert.equal(sessionDate({startAt: '2026-09-18T22:30:00Z'}), '2026-09-19');
  assert.match(TODAY, /^\d{4}-\d{2}-\d{2}$/);
});

test('audit exposes the pending_lp_assignment scheduler contract mismatch', () => {
  const pending = {status: 'pending_lp_assignment'};
  assert.equal(auditActive(pending), true);
  assert.equal(schedulerActive(pending), false);
});

test('canonical identity and schedule matching require exact enrollment fields', () => {
  assert.equal(identityMatches(healthySession, enrollment), true);
  assert.equal(scheduleMatches(healthySession, enrollment), true);
  assert.equal(identityMatches({...healthySession, teacherId: 'wrong-teacher'}, enrollment), false);
  assert.equal(scheduleMatches({...healthySession, startTime: '10:05'}, enrollment), false);
});

test('parent visibility reproduces ownership and canonical schedule checks', () => {
  assert.deepEqual(parentVisibility(healthySession, enrollment, kids), {visible: true, reasons: []});
  const mismatch = parentVisibility({...healthySession, parentId: 'wrong-parent'}, enrollment, kids);
  assert.equal(mismatch.visible, false);
  assert.match(mismatch.reasons.join(' | '), /session parentId mismatch\/missing/);
});

test('known makeup/reschedule records are recognized as exceptions', () => {
  assert.equal(exceptionSession({rescheduledFromSessionId: healthySession.id}), true);
  assert.equal(exceptionSession({isMakeup: true}), true);
  assert.equal(exceptionSession({source: 'approved_request_reschedule'}), true);
});

test('slot normalization matches the rolling materializer contract', () => {
  assert.deepEqual(
    normalizeScheduleSlots({weekdays: [5, 5], timeHHmm: '10:00', durationMins: 5}),
    [{weekday: 5, time: '10:00', durationMinutes: 10}],
  );
  assert.deepEqual(
    normalizeScheduleSlots({weeklySlots: [{weekday: 5, time: '10:00', durationMinutes: 999}]}),
    [{weekday: 5, time: '10:00', durationMinutes: 180}],
  );
  assert.throws(
    () => normalizeScheduleSlots({weeklySlots: [
      {weekday: 5, time: '10:00', durationMinutes: 35},
      {weekday: 5, time: '10:00', durationMinutes: 45},
    ]}),
    /Conflicting weekly slots/,
  );
});

test('legacy startAt/endTime fallbacks use Asia/Kolkata and exact duration', () => {
  const legacy = {
    startAt: '2026-09-18T04:30:00Z',
    startTime: '10:00',
    endTime: '10:35',
  };
  assert.equal(sessionDate(legacy), '2026-09-18');
  assert.equal(sessionTime({...legacy, startTime: ''}), '10:00');
  assert.equal(sessionDuration(legacy), 35);
});

test('parent visibility requires the child ownership query to discover the child', () => {
  const unownedKids = new Map([['kid1', {id: 'kid1', parentIds: ['different-parent']}]]);
  const result = parentVisibility(healthySession, enrollment, unownedKids);
  assert.equal(result.visible, false);
  assert.match(result.reasons.join(' | '), /parentIds ownership query/);
});

test('audit source contains only guarded Firestore read request call sites', () => {
  const source = fs.readFileSync(new URL('./audit-production-schedule-brick0.mjs', import.meta.url), 'utf8');
  const calls = [...source.matchAll(/request\('([^']+)',\s*`([^`]+)`/g)]
    .map((match) => `${match[1]} ${match[2]}`)
    .sort();
  assert.deepEqual(calls, [
    'GET ${API_ROOT}/${name}?${query}',
    'POST ${API_ROOT}:batchGet',
    'POST ${API_ROOT}:runQuery',
  ].sort());
  assert.doesNotMatch(source, /firebase-admin|runTransaction|\.collection\(|writeBatch|bulkWriter/);
});

test('stale revision remains distinct from parent ownership visibility', () => {
  const stale = {...healthySession, scheduleRevision: 1};
  const result = classifyExpectedOccurrence({occurrence, session: stale, enrollment, kids});
  assert.equal(result.classification, 'STALE SCHEDULE REVISION');
  assert.equal(parentVisibility(stale, enrollment, kids).visible, true);
});

test('occurrence classifier distinguishes healthy, missing, cancelled, hidden, identity, time, revision and reschedule states', () => {
  const classify = (session, replacement = null) => classifyExpectedOccurrence({
    occurrence,
    session,
    replacement,
    enrollment,
    kids,
  }).classification;

  assert.equal(classify(healthySession), 'HEALTHY');
  assert.equal(classify(null), 'MISSING SESSION');
  assert.equal(classify({...healthySession, status: 'cancelled'}), 'CANCELLED/PAUSED');
  assert.equal(classify({...healthySession, parentId: 'wrong-parent'}), 'SESSION EXISTS BUT PARENT WOULD NOT SEE IT');
  assert.equal(classify({...healthySession, teacherId: 'wrong-teacher'}), 'WRONG STUDENT/PARENT/TEACHER/ENROLLMENT IDENTITY');
  assert.equal(classify({...healthySession, startTime: '10:05'}), 'WRONG DATE/TIME/DURATION');
  assert.equal(classify({...healthySession, scheduleRevision: 1}), 'STALE SCHEDULE REVISION');

  const replacement = {
    ...healthySession,
    id: 'replacement1',
    date: '2026-09-19',
    startTime: '11:00',
    rescheduledFromSessionId: healthySession.id,
    source: 'reschedule',
  };
  assert.equal(classify({...healthySession, status: 'cancelled'}, replacement), 'VALID RESCHEDULE/MAKEUP/EXCEPTION');
});
