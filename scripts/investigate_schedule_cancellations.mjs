import fs from 'fs';
import https from 'https';

const PROJECT_ID = 'tinysteps-react-v1';
const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/${DATABASE_ROOT}`;
const STUDENT_NAME = 'Amay Dewan Mahajan';
const FROM_DATE = '2026-06-01';
const FUTURE_FROM_DATE = '2026-07-09';

function readToken() {
  const envToken = normalizeText(process.env.GOOGLE_OAUTH_ACCESS_TOKEN);
  if (envToken) return envToken;
  const cfgPath = `${process.env.HOME}/.config/configstore/firebase-tools.json`;
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const token = cfg?.tokens?.access_token;
  if (!token) throw new Error('No firebase-tools access token found');
  return token;
}

function requestJson(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const status = res.statusCode || 0;
        if (status < 200 || status >= 300) {
          reject(new Error(`HTTP ${status} ${url}: ${data.slice(0, 1000)}`));
          return;
        }
        resolve(data.trim() ? JSON.parse(data) : null);
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function firestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  return { stringValue: String(value) };
}

function parseValue(value) {
  if (!value || typeof value !== 'object') return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('mapValue' in value) return parseFields(value.mapValue.fields || {});
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(parseValue);
  return null;
}

function parseFields(fields) {
  const out = {};
  Object.entries(fields || {}).forEach(([key, value]) => {
    out[key] = parseValue(value);
  });
  return out;
}

function parseDoc(doc) {
  if (!doc?.name) return null;
  const parts = doc.name.split('/');
  return {
    id: parts[parts.length - 1],
    ...parseFields(doc.fields || {}),
  };
}

function normalizeText(value) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function normalizeStatus(value) {
  const raw = normalizeText(value).toLowerCase();
  return raw === 'canceled' ? 'cancelled' : raw;
}

function toDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function fieldFilter(field, op, value) {
  return {
    fieldFilter: {
      field: { fieldPath: field },
      op,
      value: firestoreValue(value),
    },
  };
}

function andFilter(filters) {
  return { compositeFilter: { op: 'AND', filters } };
}

function orFilter(filters) {
  return { compositeFilter: { op: 'OR', filters } };
}

async function runStructuredQuery(collectionId, where, options = {}) {
  const token = readToken();
  const body = JSON.stringify({
    structuredQuery: {
      from: [{ collectionId }],
      ...(where ? { where } : {}),
      ...(options.limit ? { limit: options.limit } : {}),
      ...(options.orderBy ? { orderBy: options.orderBy } : {}),
    },
  });
  const rows = await requestJson(`${FIRESTORE_BASE}/documents:runQuery`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);
  return (rows || []).map((row) => parseDoc(row.document)).filter(Boolean);
}

async function getDoc(path) {
  const token = readToken();
  const row = await requestJson(`${FIRESTORE_BASE}/documents/${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseDoc(row);
}

function resolveSlots(enrollment) {
  const schedule = enrollment?.schedule || {};
  const weeklySlots = Array.isArray(schedule.weeklySlots) ? schedule.weeklySlots : [];
  const direct = weeklySlots
    .map((slot) => ({
      weekday: Number(slot.weekday),
      time: normalizeTimeHHmm(slot.time),
      durationMinutes: Number(slot.durationMinutes ?? slot.durationMins ?? 35),
    }))
    .filter((slot) => Number.isInteger(slot.weekday) && slot.weekday >= 0 && slot.weekday <= 6 && slot.time);
  if (direct.length) return direct;
  const weekdays = Array.isArray(schedule.weekdays) ? schedule.weekdays.map(Number) : [];
  const time = normalizeTimeHHmm(schedule.timeHHmm);
  const durationMinutes = Number(schedule.durationMins ?? 35);
  return weekdays
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6 && time)
    .map((weekday) => ({ weekday, time, durationMinutes }));
}

function normalizeTimeHHmm(value) {
  const raw = normalizeText(value);
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(raw)) return raw;
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (!match) return '';
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return '';
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function teacherIdsFromEnrollment(enrollment) {
  return Array.from(new Set([
    ...(Array.isArray(enrollment?.teacherIds) ? enrollment.teacherIds : []),
    enrollment?.teacherId,
    enrollment?.assignedTeacherId,
    enrollment?.primaryTeacherId,
    enrollment?.teacherUid,
    enrollment?.teacher_id,
  ].map(normalizeText).filter(Boolean)));
}

function teacherIdsFromSession(session) {
  return Array.from(new Set([
    ...(Array.isArray(session?.teacherIds) ? session.teacherIds : []),
    session?.teacherId,
    session?.assignedTeacherId,
    session?.primaryTeacherId,
    session?.teacherUid,
    session?.teacher_id,
  ].map(normalizeText).filter(Boolean)));
}

function sessionWeekday(session) {
  const ymd = normalizeText(session.date);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  }
  const dt = toDate(session.startAt);
  if (!dt) return null;
  const shifted = new Date(dt.getTime() + 330 * 60 * 1000);
  return shifted.getUTCDay();
}

function sessionDuration(session) {
  const raw = Number(session.durationMinutes ?? session.durationMins);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : null;
}

function sessionStartMs(session) {
  const startAt = toDate(session.startAt);
  if (startAt) return startAt.getTime();
  const date = normalizeText(session.date);
  const startTime = normalizeTimeHHmm(session.startTime) || '00:00';
  const parsed = Date.parse(`${date}T${startTime}:00+05:30`);
  return Number.isNaN(parsed) ? null : parsed;
}

function hasAttendanceMarked(session) {
  const attendance = session.attendance;
  if (!attendance || attendance === null) return false;
  if (typeof attendance !== 'object') return true;
  if (Array.isArray(attendance)) return attendance.length > 0;
  return Object.keys(attendance).length > 0;
}

function hasFinanceOrLockMarkers(session) {
  if (session.revenueAccrued === true) return true;
  if (Number(session.accruedAmount || 0) > 0) return true;
  if (normalizeText(session.accruedMonthKey)) return true;
  if (session.creditsProcessed === true || session.creditsProcessing === true) return true;
  if (session.locked === true || session.isLocked === true) return true;
  for (const field of ['lockedAt', 'consumedAt', 'settledAt', 'paidAt', 'billedAt', 'invoicedAt']) {
    if (session[field]) return true;
  }
  for (const field of ['billingStatus', 'paymentStatus', 'earningStatus']) {
    if (['paid', 'settled', 'consumed', 'locked'].includes(normalizeStatus(session[field]))) return true;
  }
  return false;
}

function isScheduleExceptionSession(session) {
  if (session.isAdHoc === true || session.isMakeup === true) return true;
  if (session.makeupCreditId || session.makeupForSessionId) return true;
  const adHocType = normalizeText(session.adHocType).toLowerCase();
  if (adHocType.includes('one_off') || adHocType.includes('adhoc') || adHocType.includes('ad_hoc')) return true;
  const source = normalizeText(session.source).toLowerCase();
  return ['ad_hoc', 'adhoc', 'makeup', 'reschedule', 'manual_one_off', 'approved_request', 'one_off']
    .some((token) => source.includes(token));
}

function matchesRecurringSchedule(session, enrollment) {
  if (!enrollment) return false;
  if (normalizeText(session.enrollmentId) !== normalizeText(enrollment.id)) return false;
  const enrollmentTeacherIds = teacherIdsFromEnrollment(enrollment);
  const sessionTeacherIds = teacherIdsFromSession(session);
  if (enrollmentTeacherIds.length && (!sessionTeacherIds.length || !sessionTeacherIds.some((id) => enrollmentTeacherIds.includes(id)))) {
    return false;
  }
  const slots = resolveSlots(enrollment);
  const weekday = sessionWeekday(session);
  const time = normalizeTimeHHmm(session.startTime);
  const duration = sessionDuration(session);
  return slots.some((slot) =>
    slot.weekday === weekday &&
    slot.time === time &&
    (duration === null || Math.floor(slot.durationMinutes) === duration));
}

function activeLikeEnrollment(enrollment) {
  return ['active', 'trial', 'paused', 'enrolled', 'current', 'ongoing'].includes(normalizeStatus(enrollment?.status));
}

function summarizeSession(session) {
  return {
    sessionId: session.id,
    date: session.date || null,
    startTime: session.startTime || null,
    status: session.status || null,
    source: session.source || null,
    cancelledReason:
      session.cancelledReason ||
      session.cancelReason ||
      session.cancellationReason ||
      session.canceledReason ||
      null,
    repairBatchId: session.repairBatchId || null,
    restoredFromCancelled: session.restoredFromCancelled === true,
    restoreReason: session.restoreReason || null,
    updatedAt: session.updatedAt || null,
    updatedBy: session.updatedBy || null,
    createdAt: session.createdAt || null,
    createdBy: session.createdBy || null,
    attendance: session.attendance ?? null,
    markers: {
      revenueAccrued: session.revenueAccrued === true,
      accruedAmount: Number(session.accruedAmount || 0),
      accruedMonthKey: session.accruedMonthKey || null,
      creditsProcessed: session.creditsProcessed === true,
      creditsProcessing: session.creditsProcessing === true,
      locked: session.locked === true || session.isLocked === true,
      lockedAt: session.lockedAt || null,
      consumedAt: session.consumedAt || null,
      settledAt: session.settledAt || null,
      paidAt: session.paidAt || null,
      billedAt: session.billedAt || null,
      invoicedAt: session.invoicedAt || null,
      billingStatus: session.billingStatus || null,
      paymentStatus: session.paymentStatus || null,
      earningStatus: session.earningStatus || null,
    },
  };
}

async function findStudentEnrollment() {
  const nameMatches = await runStructuredQuery('enrollments', orFilter([
    fieldFilter('studentName', 'EQUAL', STUDENT_NAME),
    fieldFilter('kidName', 'EQUAL', STUDENT_NAME),
    fieldFilter('childName', 'EQUAL', STUDENT_NAME),
  ]), { limit: 50 });

  const kids = await runStructuredQuery('kids', orFilter([
    fieldFilter('studentName', 'EQUAL', STUDENT_NAME),
    fieldFilter('fullName', 'EQUAL', STUDENT_NAME),
    fieldFilter('displayName', 'EQUAL', STUDENT_NAME),
    fieldFilter('name', 'EQUAL', STUDENT_NAME),
  ]), { limit: 20 });

  const enrollments = new Map(nameMatches.map((row) => [row.id, row]));
  for (const kid of kids) {
    const related = await runStructuredQuery('enrollments', orFilter([
      fieldFilter('kidId', 'EQUAL', kid.id),
      fieldFilter('studentId', 'EQUAL', kid.id),
      fieldFilter('childId', 'EQUAL', kid.id),
    ]), { limit: 50 });
    related.forEach((row) => enrollments.set(row.id, row));
  }

  const rows = Array.from(enrollments.values());
  return rows.find((row) =>
    activeLikeEnrollment(row) &&
    normalizeText(row.courseName || row.courseTitle || row.courseLabel).toLowerCase().includes('basic grammar')
  ) || rows[0] || null;
}

async function queryAuditLogsBySessionIds(sessionIds) {
  const unique = Array.from(new Set(sessionIds.filter(Boolean)));
  const out = [];
  for (let i = 0; i < unique.length; i += 10) {
    const chunk = unique.slice(i, i + 10);
    const rows = await runStructuredQuery('auditLogs', {
      fieldFilter: {
        field: { fieldPath: 'sessionId' },
        op: 'IN',
        value: { arrayValue: { values: chunk.map((id) => ({ stringValue: id })) } },
      },
    }, { limit: 1000 });
    out.push(...rows);
  }
  return out;
}

function relevantAuditLog(log) {
  const haystack = JSON.stringify(log).toLowerCase();
  return [
    'schedule_repair',
    'cancel_duplicate',
    'cancel_stale',
    'cancel_excess',
    'enrollment_future_session_schedule_repair',
    'pause',
    'resume',
    'enrollmentschedule',
    'generation',
  ].some((token) => haystack.includes(token));
}

async function systemicScan() {
  const [cancelled, canceled] = await Promise.all([
    runStructuredQuery('classSessions', fieldFilter('status', 'EQUAL', 'cancelled'), { limit: 5000 }),
    runStructuredQuery('classSessions', fieldFilter('status', 'EQUAL', 'canceled'), { limit: 5000 }),
  ]);

  const sessions = [...cancelled, ...canceled].filter((session) => normalizeText(session.date) >= FUTURE_FROM_DATE);
  const enrollmentIds = Array.from(new Set(sessions.map((row) => normalizeText(row.enrollmentId)).filter(Boolean)));
  const enrollmentMap = new Map();
  for (const enrollmentId of enrollmentIds) {
    try {
      const enrollment = await getDoc(`enrollments/${enrollmentId}`);
      if (enrollment) enrollmentMap.set(enrollmentId, enrollment);
    } catch (error) {
      enrollmentMap.set(enrollmentId, { id: enrollmentId, fetchError: String(error) });
    }
  }

  const impactedSessions = sessions.filter((session) => {
    const enrollment = enrollmentMap.get(normalizeText(session.enrollmentId));
    if (!activeLikeEnrollment(enrollment)) return false;
    if (sessionStartMs(session) === null || sessionStartMs(session) <= Date.now()) return false;
    if (!matchesRecurringSchedule(session, enrollment)) return false;
    if (isScheduleExceptionSession(session)) return false;
    if (hasAttendanceMarked(session)) return false;
    if (hasFinanceOrLockMarkers(session)) return false;
    const hint = [
      normalizeText(session.source).toLowerCase(),
      normalizeText(session.cancelledReason || session.cancelReason || session.cancellationReason || session.canceledReason).toLowerCase(),
      normalizeText(session.updatedBy).toLowerCase(),
    ].join(' ');
    return ['schedule_repair', 'enrollmentschedule', 'repair', 'system'].some((token) => hint.includes(token));
  });

  const grouped = new Map();
  impactedSessions.forEach((session) => {
    const enrollmentId = normalizeText(session.enrollmentId);
    const enrollment = enrollmentMap.get(enrollmentId);
    if (!grouped.has(enrollmentId)) {
      grouped.set(enrollmentId, {
        enrollmentId,
        studentName: enrollment?.studentName || enrollment?.kidName || enrollment?.childName || session.studentName || session.kidName || null,
        teacherName: enrollment?.teacherName || session.teacherName || null,
        courseName: enrollment?.courseName || enrollment?.courseTitle || enrollment?.courseLabel || session.courseName || null,
        sessions: [],
      });
    }
    grouped.get(enrollmentId).sessions.push({
      sessionId: session.id,
      date: session.date || null,
      startTime: session.startTime || null,
      status: session.status || null,
      source: session.source || null,
      cancelledReason: session.cancelledReason || session.cancelReason || session.cancellationReason || session.canceledReason || null,
      updatedAt: session.updatedAt || null,
      updatedBy: session.updatedBy || null,
    });
  });

  return {
    scannedFutureCancelledSessions: sessions.length,
    impactedSessions: impactedSessions.length,
    impactedEnrollments: grouped.size,
    impacted: Array.from(grouped.values()).sort((a, b) => String(a.studentName || '').localeCompare(String(b.studentName || ''))),
  };
}

async function main() {
  const enrollmentSeed = await findStudentEnrollment();
  if (!enrollmentSeed) {
    throw new Error(`No enrollment found for ${STUDENT_NAME}`);
  }

  const enrollment = await getDoc(`enrollments/${enrollmentSeed.id}`);
  const sessions = (await runStructuredQuery('classSessions', fieldFilter('enrollmentId', 'EQUAL', enrollment.id), { limit: 1000 }))
    .filter((row) => normalizeText(row.date) >= FROM_DATE)
    .sort((a, b) => `${normalizeText(a.date)}|${normalizeTimeHHmm(a.startTime)}`.localeCompare(`${normalizeText(b.date)}|${normalizeTimeHHmm(b.startTime)}`));

  const auditByEnrollment = await runStructuredQuery('auditLogs', fieldFilter('enrollmentId', 'EQUAL', enrollment.id), { limit: 2000 });
  const auditBySession = await queryAuditLogsBySessionIds(sessions.map((row) => row.id));
  const auditLogs = Array.from(new Map([...auditByEnrollment, ...auditBySession].map((row) => [row.id, row])).values())
    .filter(relevantAuditLog)
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));

  const futureCancelledRecurringSessions = sessions
    .filter((session) => normalizeStatus(session.status) === 'cancelled')
    .filter((session) => sessionStartMs(session) !== null && sessionStartMs(session) > Date.now())
    .filter((session) => matchesRecurringSchedule(session, enrollment))
    .map(summarizeSession);

  const report = {
    generatedAt: new Date().toISOString(),
    studentName: STUDENT_NAME,
    activeEnrollment: enrollment,
    futureCancelledRecurringSessions,
    sessionTimeline: sessions.map((session) => ({
      sessionId: session.id,
      date: session.date || null,
      startTime: session.startTime || null,
      status: session.status || null,
      source: session.source || null,
      cancelledReason: session.cancelledReason || session.cancelReason || session.cancellationReason || session.canceledReason || null,
      repairBatchId: session.repairBatchId || null,
      restoredFromCancelled: session.restoredFromCancelled === true,
      restoreReason: session.restoreReason || null,
      updatedAt: session.updatedAt || null,
      updatedBy: session.updatedBy || null,
      createdAt: session.createdAt || null,
      createdBy: session.createdBy || null,
    })),
    auditLogs,
    systemic: await systemicScan(),
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    error: String(error),
    stack: error?.stack || null,
  }, null, 2));
  process.exit(1);
});
