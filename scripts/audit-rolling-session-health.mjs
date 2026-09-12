import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'tinysteps-react-v1';
const ANCHOR_YMD = process.env.AUDIT_ANCHOR_YMD || '';
const HORIZON_DAYS = 14;
const IST_OFFSET_MINUTES = 330;
const ACTIVE_STATUS_ALIASES = new Set([
  '',
  'active',
  'trial',
  'enrolled',
  'current',
  'ongoing',
  'pending_teacher',
  'pending_payment',
  'pending_lp',
]);
const TERMINAL_SESSION_STATUSES = new Set(['cancelled', 'canceled']);

if (!getApps().length) {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
}

const db = getFirestore();

const text = (value) => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const pad2 = (value) => String(value).padStart(2, '0');
const ymdFromUtcMs = (ms) => {
  const date = new Date(ms);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
};
const parseYmd = (ymd) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || '').trim());
  if (!match) return null;
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const date = new Date(ms);
  if (
    date.getUTCFullYear() !== Number(match[1]) ||
    date.getUTCMonth() + 1 !== Number(match[2]) ||
    date.getUTCDate() !== Number(match[3])
  ) return null;
  return { ms, year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
};
const addDays = (ymd, days) => {
  const parsed = parseYmd(ymd);
  if (!parsed) throw new Error(`Invalid YYYY-MM-DD: ${ymd}`);
  return ymdFromUtcMs(parsed.ms + Math.trunc(days) * 86400000);
};
const indiaYmd = (date = new Date()) => {
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60000);
  return ymdFromUtcMs(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
};
const dateLikeToIndiaYmd = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && parseYmd(value)) return value;
  let date = null;
  if (value instanceof Date) date = value;
  else if (typeof value === 'number' || typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  } else if (isRecord(value)) {
    if (typeof value.toDate === 'function') {
      try { date = value.toDate(); } catch { date = null; }
    }
    if (!date) {
      const seconds = Number(value.seconds ?? value._seconds);
      if (Number.isFinite(seconds)) date = new Date(seconds * 1000);
    }
  }
  if (!date || Number.isNaN(date.getTime())) return null;
  return indiaYmd(date);
};

const resolveClassesStartYmd = (enrollment) => (
  dateLikeToIndiaYmd(enrollment.classesStartDateYmd) ||
  dateLikeToIndiaYmd(enrollment.classesStartDate) ||
  dateLikeToIndiaYmd(enrollment.startDateYmd) ||
  dateLikeToIndiaYmd(enrollment.startDate) ||
  null
);

const normalizeSlots = (enrollment) => {
  const schedule = isRecord(enrollment.schedule) ? enrollment.schedule : {};
  const slots = [];
  if (Array.isArray(schedule.weeklySlots) && schedule.weeklySlots.length) {
    for (const slot of schedule.weeklySlots) {
      const weekday = Number(slot?.weekday);
      const time = text(slot?.time);
      const durationMinutes = Number(slot?.durationMinutes ?? slot?.durationMins ?? 35);
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) continue;
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) continue;
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) continue;
      slots.push({ weekday, time, durationMinutes: Math.floor(durationMinutes), source: 'weeklySlots' });
    }
    return slots;
  }
  if (Array.isArray(schedule.weekdays) && schedule.weekdays.length) {
    const time = text(schedule.timeHHmm);
    const durationMinutes = Number(schedule.durationMins ?? 35);
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(time) && Number.isFinite(durationMinutes) && durationMinutes > 0) {
      for (const raw of schedule.weekdays) {
        const weekday = Number(raw);
        if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) continue;
        slots.push({ weekday, time, durationMinutes: Math.floor(durationMinutes), source: 'legacySchedule' });
      }
    }
  }
  return slots;
};

const resolveCanonicalTeacher = (enrollment) => {
  const canonical = text(enrollment.teacherId);
  if (canonical) return { teacherId: canonical, source: 'canonical' };
  const legacy = new Set();
  for (const value of Array.isArray(enrollment.teacherIds) ? enrollment.teacherIds : []) {
    const id = text(value); if (id) legacy.add(id);
  }
  for (const key of ['assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id']) {
    const id = text(enrollment[key]); if (id) legacy.add(id);
  }
  if (legacy.size === 1) return { teacherId: [...legacy][0], source: 'legacy' };
  if (legacy.size > 1) return { teacherId: null, source: 'ambiguous_legacy' };
  return { teacherId: null, source: 'missing' };
};

const isOperationalEnrollment = (enrollment) => {
  if (enrollment.archivedAt || enrollment.archived === true || enrollment.isArchived === true) return false;
  const status = text(enrollment.status).toLowerCase();
  return ACTIVE_STATUS_ALIASES.has(status);
};

const enrollmentKidId = (enrollment) => text(enrollment.kidId || enrollment.childId || enrollment.studentId);
const enrollmentParentId = (enrollment) => {
  const direct = text(enrollment.parentId || enrollment.primaryParentId);
  if (direct) return direct;
  const arr = Array.isArray(enrollment.parentIds) ? enrollment.parentIds.map(text).filter(Boolean) : [];
  return arr.length === 1 ? arr[0] : '';
};

const deterministicSessionId = (enrollmentId, date, time) => `${enrollmentId}_${date.replace(/-/g, '')}_${time.replace(':', '')}`;

const enumerateExpected = (enrollmentId, enrollment, anchorYmd, horizonEndYmd) => {
  const slots = normalizeSlots(enrollment);
  if (!slots.length) return [];
  const classesStartYmd = resolveClassesStartYmd(enrollment);
  const from = parseYmd(anchorYmd);
  const to = parseYmd(horizonEndYmd);
  if (!from || !to) return [];
  const startMs = classesStartYmd && parseYmd(classesStartYmd)
    ? Math.max(from.ms, parseYmd(classesStartYmd).ms)
    : from.ms;
  const byDay = new Map();
  for (const slot of slots) {
    const list = byDay.get(slot.weekday) || [];
    list.push(slot);
    byDay.set(slot.weekday, list);
  }
  const out = [];
  for (let ms = startMs; ms <= to.ms; ms += 86400000) {
    const weekday = new Date(ms).getUTCDay();
    const date = ymdFromUtcMs(ms);
    for (const slot of byDay.get(weekday) || []) {
      out.push({
        enrollmentId,
        date,
        weekday,
        time: slot.time,
        durationMinutes: slot.durationMinutes,
        sessionId: deterministicSessionId(enrollmentId, date, slot.time),
      });
    }
  }
  return out;
};

const chunk = (items, size) => {
  const result = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
};

const anchorYmd = ANCHOR_YMD || indiaYmd();
const horizonEndYmd = addDays(anchorYmd, HORIZON_DAYS);

console.log(`READ_ONLY_AUDIT project=${PROJECT_ID} anchor=${anchorYmd} horizonEnd=${horizonEndYmd}`);

const enrollmentSnap = await db.collection('enrollments').get();
const operational = enrollmentSnap.docs
  .map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
  .filter(isOperationalEnrollment);

const statusCounts = {};
for (const enrollment of operational) {
  const status = text(enrollment.status).toLowerCase() || '<blank>';
  statusCounts[status] = (statusCounts[status] || 0) + 1;
}

const expected = [];
const enrollmentsWithValidSchedule = [];
const enrollmentMeta = new Map();
const weekdayScheduledEnrollmentCounts = Array(7).fill(0);
const weekdaySlotCounts = Array(7).fill(0);

for (const enrollment of operational) {
  const slots = normalizeSlots(enrollment);
  const teacher = resolveCanonicalTeacher(enrollment);
  const parentId = enrollmentParentId(enrollment);
  const kidId = enrollmentKidId(enrollment);
  const materialization = isRecord(enrollment.scheduleMaterialization) ? enrollment.scheduleMaterialization : null;
  const expectedRows = enumerateExpected(enrollment.id, enrollment, anchorYmd, horizonEndYmd);
  const uniqueWeekdays = new Set(slots.map((slot) => slot.weekday));
  uniqueWeekdays.forEach((weekday) => { weekdayScheduledEnrollmentCounts[weekday] += 1; });
  slots.forEach((slot) => { weekdaySlotCounts[slot.weekday] += 1; });
  if (slots.length) enrollmentsWithValidSchedule.push(enrollment.id);
  expected.push(...expectedRows);
  enrollmentMeta.set(enrollment.id, {
    slots,
    teacher,
    parentId,
    kidId,
    materialization,
    expectedRows,
  });
}

const sessionById = new Map();
for (const ids of chunk([...new Set(expected.map((row) => row.sessionId))], 150)) {
  const refs = ids.map((id) => db.collection('classSessions').doc(id));
  const snaps = await db.getAll(...refs);
  for (const snap of snaps) if (snap.exists) sessionById.set(snap.id, snap.data() || {});
}

const actualByDate = new Map();
for (let offset = 0; offset <= HORIZON_DAYS; offset += 1) {
  const date = addDays(anchorYmd, offset);
  const snap = await db.collection('classSessions').where('date', '==', date).get();
  actualByDate.set(date, snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) })));
}

const anomalies = {
  invalidOrMissingSchedule: 0,
  missingCanonicalTeacher: 0,
  ambiguousLegacyTeacher: 0,
  missingParentIdentity: 0,
  missingKidIdentity: 0,
  missingMaterializationState: 0,
  staleMaterializedThrough: 0,
  missingDuePointerDespiteFutureRecurrence: 0,
  scheduleRevisionMismatch: 0,
  zeroExpectedOccurrences: 0,
  zeroMaterializedSessions: 0,
  missingExpectedSessionDocs: 0,
  parentIdentityMismatchOnExpectedSession: 0,
  kidIdentityMismatchOnExpectedSession: 0,
  terminalExpectedSessionDocs: 0,
};

const missingByWeekday = Array(7).fill(0);
const expectedByWeekday = Array(7).fill(0);
const presentByWeekday = Array(7).fill(0);
const operationalEnrollmentsWithMissingExpected = new Set();
const operationalEnrollmentsWithZeroMaterialized = new Set();
const operationalEnrollmentsWithExpectedSunday = new Set();
const operationalEnrollmentsWithMissingSunday = new Set();
const operationalEnrollmentsWithoutMaterialization = new Set();
const operationalEnrollmentsStaleMaterialization = new Set();

for (const enrollment of operational) {
  const meta = enrollmentMeta.get(enrollment.id);
  if (!meta.slots.length) anomalies.invalidOrMissingSchedule += 1;
  if (!meta.teacher.teacherId) {
    anomalies.missingCanonicalTeacher += 1;
    if (meta.teacher.source === 'ambiguous_legacy') anomalies.ambiguousLegacyTeacher += 1;
  }
  if (!meta.parentId) anomalies.missingParentIdentity += 1;
  if (!meta.kidId) anomalies.missingKidIdentity += 1;
  if (!meta.expectedRows.length) anomalies.zeroExpectedOccurrences += 1;

  if (!meta.materialization) {
    anomalies.missingMaterializationState += 1;
    operationalEnrollmentsWithoutMaterialization.add(enrollment.id);
  } else {
    const through = text(meta.materialization.materializedThroughYmd);
    if (!through || through < horizonEndYmd) {
      anomalies.staleMaterializedThrough += 1;
      operationalEnrollmentsStaleMaterialization.add(enrollment.id);
    }
    const scheduleRevision = Number(isRecord(enrollment.schedule) ? enrollment.schedule.revision : 1) || 1;
    const materializedRevision = Number(meta.materialization.scheduleRevision || 0);
    if (materializedRevision && materializedRevision !== scheduleRevision) anomalies.scheduleRevisionMismatch += 1;
    if (meta.expectedRows.length && !text(meta.materialization.nextMaterializationDueYmd) && through && through < '9999-12-31') {
      const lastExpected = meta.expectedRows[meta.expectedRows.length - 1];
      if (lastExpected && lastExpected.date <= horizonEndYmd) anomalies.missingDuePointerDespiteFutureRecurrence += 1;
    }
  }

  let materializedCount = 0;
  for (const row of meta.expectedRows) {
    expectedByWeekday[row.weekday] += 1;
    if (row.weekday === 0) operationalEnrollmentsWithExpectedSunday.add(enrollment.id);
    const session = sessionById.get(row.sessionId);
    if (!session) {
      anomalies.missingExpectedSessionDocs += 1;
      missingByWeekday[row.weekday] += 1;
      operationalEnrollmentsWithMissingExpected.add(enrollment.id);
      if (row.weekday === 0) operationalEnrollmentsWithMissingSunday.add(enrollment.id);
      continue;
    }
    materializedCount += 1;
    presentByWeekday[row.weekday] += 1;
    const expectedParent = meta.parentId;
    const expectedKid = meta.kidId;
    const sessionParent = text(session.parentId || session.primaryParentId);
    const sessionKid = text(session.kidId || session.childId || session.studentId);
    const sessionKidIds = Array.isArray(session.kidIds) ? session.kidIds.map(text).filter(Boolean) : [];
    if (expectedParent && sessionParent && sessionParent !== expectedParent) anomalies.parentIdentityMismatchOnExpectedSession += 1;
    if (expectedKid && sessionKid !== expectedKid && !sessionKidIds.includes(expectedKid)) anomalies.kidIdentityMismatchOnExpectedSession += 1;
    if (TERMINAL_SESSION_STATUSES.has(text(session.status).toLowerCase())) anomalies.terminalExpectedSessionDocs += 1;
  }
  if (meta.expectedRows.length > 0 && materializedCount === 0) {
    anomalies.zeroMaterializedSessions += 1;
    operationalEnrollmentsWithZeroMaterialized.add(enrollment.id);
  }
}

const actualDateCounts = {};
const actualOperationalCandidateCounts = {};
for (const [date, rows] of actualByDate.entries()) {
  actualDateCounts[date] = rows.length;
  actualOperationalCandidateCounts[date] = rows.filter((row) => {
    const status = text(row.status).toLowerCase();
    return !TERMINAL_SESSION_STATUSES.has(status);
  }).length;
}

const expectedDateCounts = {};
const missingDateCounts = {};
for (let offset = 0; offset <= HORIZON_DAYS; offset += 1) {
  const date = addDays(anchorYmd, offset);
  expectedDateCounts[date] = 0;
  missingDateCounts[date] = 0;
}
for (const row of expected) {
  expectedDateCounts[row.date] = (expectedDateCounts[row.date] || 0) + 1;
  if (!sessionById.has(row.sessionId)) missingDateCounts[row.date] = (missingDateCounts[row.date] || 0) + 1;
}

const sundayDates = Object.keys(expectedDateCounts).filter((date) => new Date(`${date}T00:00:00Z`).getUTCDay() === 0);
const sundayExpected = sundayDates.reduce((sum, date) => sum + (expectedDateCounts[date] || 0), 0);
const sundayActual = sundayDates.reduce((sum, date) => sum + (actualOperationalCandidateCounts[date] || 0), 0);
const sundayMissingDeterministic = sundayDates.reduce((sum, date) => sum + (missingDateCounts[date] || 0), 0);

const aggregate = {
  anchorYmd,
  horizonEndYmd,
  operationalEnrollments: operational.length,
  statusCounts,
  enrollmentsWithValidSchedule: enrollmentsWithValidSchedule.length,
  expectedRecurringOccurrences: expected.length,
  expectedSessionDocsPresent: expected.length - anomalies.missingExpectedSessionDocs,
  expectedSessionDocsMissing: anomalies.missingExpectedSessionDocs,
  operationalEnrollmentsWithAnyMissingExpectedSession: operationalEnrollmentsWithMissingExpected.size,
  operationalEnrollmentsWithZeroMaterializedExpectedSessions: operationalEnrollmentsWithZeroMaterialized.size,
  operationalEnrollmentsWithoutMaterializationState: operationalEnrollmentsWithoutMaterialization.size,
  operationalEnrollmentsWithStaleMaterialization: operationalEnrollmentsStaleMaterialization.size,
  sundayDates,
  sundayExpected,
  sundayActualOperationalCandidates: sundayActual,
  sundayMissingDeterministic,
  operationalEnrollmentsWithSundaySlots: operationalEnrollmentsWithExpectedSunday.size,
  operationalEnrollmentsWithMissingSundaySessions: operationalEnrollmentsWithMissingSunday.size,
  weekdayScheduledEnrollmentCounts,
  weekdaySlotCounts,
  expectedByWeekday,
  presentByWeekday,
  missingByWeekday,
  anomalies,
  expectedDateCounts,
  actualOperationalCandidateCounts,
  missingDateCounts,
};

console.log('ROLLING_SESSION_HEALTH_JSON_START');
console.log(JSON.stringify(aggregate, null, 2));
console.log('ROLLING_SESSION_HEALTH_JSON_END');
console.log('READ_ONLY_AUDIT_COMPLETE');
