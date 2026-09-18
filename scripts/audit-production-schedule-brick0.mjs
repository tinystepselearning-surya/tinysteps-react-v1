import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const TIME_ZONE = 'Asia/Kolkata';
const HORIZON_DAYS = 14;
const IST_OFFSET_MINUTES = 330;
const DAY_MS = 86_400_000;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MATERIALIZATION_VERSION = 1;
const EXCEPTION_TOKENS = ['ad_hoc', 'adhoc', 'makeup', 'reschedule', 'manual_one_off', 'approved_request', 'one_off', 'replacement'];
const LEGACY_MANUAL_SOURCES = new Set(['admin_manual_adhoc', 'admin_manual_one_off', 'manual_one_off', 'manual_adhoc', 'manual_ad_hoc']);
const SCHEDULER_STATUSES = new Set(['', 'active', 'trial', 'enrolled', 'current', 'ongoing', 'pending_teacher', 'pending_payment', 'pending_lp']);

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

export const PROJECT = arg('--project') || process.env.FIREBASE_PROJECT_ID || 'tinysteps-react-v1';
export const DATABASE = arg('--database') || process.env.FIRESTORE_DATABASE_ID || '(default)';
export const TODAY = arg('--date') || currentIndiaYmd();
export const API_ROOT = `/v1/projects/${PROJECT}/databases/${encodeURIComponent(DATABASE)}/documents`;
const OUT_DIR = path.resolve(process.cwd(), 'artifacts', 'scheduling-audit');

function text(value) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}
function record(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : null; }
function list(value) { return Array.isArray(value) ? [...new Set(value.map(text).filter(Boolean))] : []; }
function ids(entity, plural, singles) { return [...new Set([...list(entity?.[plural]), ...singles.map((key) => text(entity?.[key]))].filter(Boolean))]; }
function kidIds(entity) { return ids(entity, 'kidIds', ['kidId', 'studentId', 'childId']); }
function teacherIds(entity) { return ids(entity, 'teacherIds', ['teacherId', 'assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id']); }
function archived(entity) { return Boolean(entity?.archivedAt || entity?.archived === true || entity?.isArchived === true); }
function rawStatus(entity) { return text(entity?.status).toLowerCase(); }

export function normalizeOperationalStatus(value) {
  const raw = text(value).toLowerCase();
  if (!raw) return 'active';
  if (raw === 'pending_teacher') return 'trial';
  if (raw === 'pending_payment' || raw === 'pending_lp' || raw === 'pending_lp_assignment') return 'active';
  if (raw === 'enrolled' || raw === 'current' || raw === 'ongoing') return 'active';
  if (raw === 'canceled') return 'cancelled';
  return raw;
}
export function auditActive(enrollment) { return !archived(enrollment) && new Set(['active', 'trial']).has(normalizeOperationalStatus(enrollment?.status)); }
export function schedulerActive(enrollment) { return !archived(enrollment) && SCHEDULER_STATUSES.has(rawStatus(enrollment)); }

export function currentIndiaYmd(now = new Date()) { return indiaYmd(now); }
export function indiaYmd(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60_000);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
}
function parseYmd(value) {
  const raw = text(value);
  if (!YMD_RE.test(raw)) return null;
  const [year, month, day] = raw.split('-').map(Number);
  const utcMs = Date.UTC(year, month - 1, day);
  const parsed = new Date(utcMs);
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day ? utcMs : null;
}
function ymd(utcMs) { return new Date(utcMs).toISOString().slice(0, 10); }
function addDays(value, days) {
  const utcMs = parseYmd(value);
  if (utcMs === null) throw new Error(`Invalid YMD: ${value}`);
  return ymd(utcMs + Math.trunc(days) * DAY_MS);
}
function normalizeTime(value) { const raw = text(value); return HHMM_RE.test(raw) ? raw : ''; }
function normalizeDuration(value, fallback = null) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.max(10, Math.min(180, Math.floor(parsed)));
}

export function normalizeScheduleSlots(scheduleLike) {
  const schedule = record(scheduleLike);
  if (!schedule) return [];
  const timezone = text(schedule.timezone) || TIME_ZONE;
  if (timezone !== TIME_ZONE) throw new Error(`Unsupported rolling schedule timezone: ${timezone}`);
  const slots = [];
  const seen = new Set();
  if (Array.isArray(schedule.weeklySlots) && schedule.weeklySlots.length > 0) {
    for (const raw of schedule.weeklySlots) {
      const slot = record(raw) || {};
      const weekday = Number(slot.weekday);
      const time = normalizeTime(slot.time);
      const durationMinutes = normalizeDuration(slot.durationMinutes ?? slot.durationMins);
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) throw new Error('Schedule weekday must be an integer from 0 to 6');
      if (!time) throw new Error('Schedule time must be HH:MM in 24-hour time');
      if (durationMinutes === null) throw new Error('Schedule duration must be a positive number');
      const identity = `${weekday}|${time}`;
      if (seen.has(identity)) throw new Error('Conflicting weekly slots share the same weekday and start time');
      seen.add(identity);
      slots.push({weekday, time, durationMinutes});
    }
  } else if (Array.isArray(schedule.weekdays) && schedule.weekdays.length > 0) {
    const time = normalizeTime(schedule.timeHHmm);
    const durationMinutes = normalizeDuration(schedule.durationMins, 35);
    if (!time) throw new Error('Schedule time must be HH:MM in 24-hour time');
    if (durationMinutes === null) throw new Error('Schedule duration must be a positive number');
    for (const rawWeekday of schedule.weekdays) {
      const weekday = Number(rawWeekday);
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) throw new Error('Schedule weekday must be an integer from 0 to 6');
      const identity = `${weekday}|${time}`;
      if (seen.has(identity)) continue;
      seen.add(identity);
      slots.push({weekday, time, durationMinutes});
    }
  }
  return slots.sort((a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time, undefined, {numeric: true}) || a.durationMinutes - b.durationMinutes);
}

function dateLikeToIndiaYmd(value) {
  if (typeof value === 'string' && parseYmd(value) !== null) return value;
  if (record(value)) {
    const seconds = Number(value.seconds ?? value._seconds);
    if (Number.isFinite(seconds)) return indiaYmd(seconds * 1000);
  }
  return value ? indiaYmd(value) : '';
}
function classesStartDate(enrollment) {
  for (const key of ['classesStartDateYmd', 'classesStartDate', 'startDateYmd', 'startDate']) {
    const date = dateLikeToIndiaYmd(enrollment?.[key]);
    if (date) return date;
  }
  return null;
}
function scheduleRevision(enrollment) {
  const parsed = Number(record(enrollment?.schedule)?.revision);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
}
function rollingSessionId(enrollmentId, date, startTime) { return `${text(enrollmentId)}_${date.replaceAll('-', '')}_${startTime.replace(':', '')}`; }
function enumerateExpected(enrollment, fromYmd, toYmd) {
  const fromMs = parseYmd(fromYmd);
  const toMs = parseYmd(toYmd);
  if (fromMs === null || toMs === null || toMs < fromMs) throw new Error('Invalid occurrence range');
  const slots = normalizeScheduleSlots(enrollment?.schedule);
  if (!slots.length) throw new Error('Enrollment has no recurring schedule configured');
  const start = classesStartDate(enrollment);
  const effectiveFrom = start && parseYmd(start) !== null ? Math.max(fromMs, parseYmd(start)) : fromMs;
  const out = [];
  for (let utcMs = effectiveFrom; utcMs <= toMs; utcMs += DAY_MS) {
    const date = ymd(utcMs);
    const weekday = new Date(utcMs).getUTCDay();
    for (const slot of slots.filter((candidate) => candidate.weekday === weekday)) {
      out.push({date, startTime: slot.time, durationMinutes: slot.durationMinutes, sessionId: rollingSessionId(enrollment.id, date, slot.time)});
    }
  }
  return out;
}
export function expectedOccurrences(enrollment, todayYmd = TODAY) { return enumerateExpected(enrollment, todayYmd, addDays(todayYmd, HORIZON_DAYS)); }

export function sessionDate(session) {
  const direct = text(session?.date);
  if (parseYmd(direct) !== null) return direct;
  return session?.startAt ? indiaYmd(session.startAt) : '';
}
export function sessionTime(session) {
  const direct = normalizeTime(session?.startTime);
  if (direct) return direct;
  if (!session?.startAt) return '';
  const date = new Date(session.startAt);
  if (Number.isNaN(date.getTime())) return '';
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60_000);
  return `${String(shifted.getUTCHours()).padStart(2, '0')}:${String(shifted.getUTCMinutes()).padStart(2, '0')}`;
}
export function sessionDuration(session) {
  const direct = normalizeDuration(session?.durationMinutes ?? session?.durationMins);
  if (direct !== null) return direct;
  const start = normalizeTime(session?.startTime);
  const end = normalizeTime(session?.endTime);
  if (!start || !end) return null;
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  let duration = endHour * 60 + endMinute - startHour * 60 - startMinute;
  if (duration <= 0) duration += 24 * 60;
  return normalizeDuration(duration);
}

function manualState(session) {
  const state = text(session?.manualSessionState).toLowerCase();
  if (state === 'canceled') return 'cancelled';
  return ['approved', 'cancelled', 'withdrawn', 'completed'].includes(state) ? state : null;
}
function manualSession(session) {
  if (manualState(session) || session?.isAdHoc === true) return true;
  const type = text(session?.adHocType).toLowerCase();
  if (type.includes('one_off') || type.includes('adhoc') || type.includes('ad_hoc')) return true;
  return LEGACY_MANUAL_SOURCES.has(text(session?.source).toLowerCase());
}
function canonicalManualIdentity(session) { return Boolean(text(session?.enrollmentId) && text(session?.courseId) && kidIds(session).length && teacherIds(session).length); }
function operationalManualSession(session) {
  if (!manualSession(session)) return false;
  const status = text(session?.status).toLowerCase();
  if (['cancelled', 'canceled', 'paused', 'completed'].includes(status)) return false;
  const state = manualState(session);
  if (state) return state === 'approved';
  return LEGACY_MANUAL_SOURCES.has(text(session?.source).toLowerCase()) && canonicalManualIdentity(session) && Boolean(session?.createdAt) && Boolean(text(session?.createdBy));
}
export function exceptionSession(session) {
  if (!session) return false;
  if (session.isAdHoc === true || session.isMakeup === true) return true;
  const type = text(session.adHocType).toLowerCase();
  if (type.includes('one_off') || type.includes('adhoc') || type.includes('ad_hoc')) return true;
  if (session.makeupCreditId || session.makeupForSessionId || session.rescheduledFromSessionId || session.replacementSessionId) return true;
  return [session.source, session.sessionType, session.createdByFlow].map((value) => text(value).toLowerCase()).filter(Boolean).some((signal) => EXCEPTION_TOKENS.some((token) => signal.includes(token)));
}

export function identityMatches(session, enrollment) {
  if (!session || !enrollment) return false;
  const sessionEnrollmentId = text(session.enrollmentId);
  if (!sessionEnrollmentId || (text(enrollment.id) && sessionEnrollmentId !== text(enrollment.id))) return false;
  const enrollmentCourseId = text(enrollment.courseId);
  const sessionCourseId = text(session.courseId);
  if (enrollmentCourseId && sessionCourseId !== enrollmentCourseId) return false;
  const enrollmentTeachers = teacherIds(enrollment);
  const sessionTeachers = teacherIds(session);
  if (enrollmentTeachers.length && (!sessionTeachers.length || !sessionTeachers.some((id) => enrollmentTeachers.includes(id)))) return false;
  const enrollmentKids = kidIds(enrollment);
  const sessionKids = kidIds(session);
  return Boolean(enrollmentKids.length && sessionKids.length && sessionKids.every((id) => enrollmentKids.includes(id)));
}

export function scheduleMatches(session, enrollment) {
  if (!identityMatches(session, enrollment)) return false;
  if (exceptionSession(session)) return !manualSession(session) || operationalManualSession(session);
  let slots;
  try { slots = normalizeScheduleSlots(enrollment?.schedule); } catch { return false; }
  const date = sessionDate(session);
  const dateMs = parseYmd(date);
  const time = sessionTime(session);
  const duration = sessionDuration(session);
  if (dateMs === null || !time || duration === null) return false;
  const weekday = new Date(dateMs).getUTCDay();
  return slots.some((slot) => slot.weekday === weekday && slot.time === time && slot.durationMinutes === duration);
}

export function parentVisibility(session, enrollment, kids = new Map()) {
  const reasons = [];
  const parentId = text(enrollment?.parentId);
  if (!parentId) reasons.push('enrollment parentId missing');
  if (!parentId || text(session?.parentId) !== parentId) reasons.push('session parentId mismatch/missing');
  const enrollmentKids = kidIds(enrollment);
  const sessionKids = kidIds(session);
  const sharedKids = sessionKids.filter((id) => enrollmentKids.includes(id));
  if (!enrollmentKids.length) reasons.push('enrollment child identity missing');
  if (!sessionKids.length || !sharedKids.length) reasons.push('session child identity mismatch/missing');
  if (parentId && enrollmentKids.length && kids instanceof Map) {
    const owned = enrollmentKids.some((id) => list(kids.get(id)?.parentIds).includes(parentId));
    if (!owned) reasons.push('child is not discoverable by parentIds ownership query');
  }
  return {visible: reasons.length === 0, reasons};
}

function validExceptionSession(session, enrollment, kids) {
  if (!exceptionSession(session)) return false;
  if (manualSession(session) && !operationalManualSession(session)) return false;
  if (['cancelled', 'canceled', 'paused', 'withdrawn'].includes(text(session?.status).toLowerCase())) return false;
  return identityMatches(session, enrollment) && parentVisibility(session, enrollment, kids).visible;
}

export function classifyExpectedOccurrence({occurrence, session, replacement = null, enrollment, kids = new Map()}) {
  if (replacement && validExceptionSession(replacement, enrollment, kids)) return {classification: 'VALID RESCHEDULE/MAKEUP/EXCEPTION', reasons: [], session: replacement};
  if (!session) return {classification: 'MISSING SESSION', reasons: ['no deterministic or legacy occurrence found'], session: null};
  const status = text(session.status).toLowerCase();
  if (status === 'cancelled' || status === 'canceled' || status === 'paused') return {classification: 'CANCELLED/PAUSED', reasons: [`session status ${status}`], session};
  const visibility = parentVisibility(session, enrollment, kids);
  if (!visibility.visible) return {classification: 'SESSION EXISTS BUT PARENT WOULD NOT SEE IT', reasons: visibility.reasons, session};
  if (!identityMatches(session, enrollment)) return {classification: 'WRONG STUDENT/PARENT/TEACHER/ENROLLMENT IDENTITY', reasons: ['session identity does not match enrollment'], session};
  if (exceptionSession(session)) {
    if (validExceptionSession(session, enrollment, kids)) return {classification: 'VALID RESCHEDULE/MAKEUP/EXCEPTION', reasons: [], session};
    return {classification: 'WRONG DATE/TIME/DURATION', reasons: ['exception is not operationally approved'], session};
  }
  if (sessionDate(session) !== occurrence.date || sessionTime(session) !== occurrence.startTime || sessionDuration(session) !== occurrence.durationMinutes || !scheduleMatches(session, enrollment)) {
    return {classification: 'WRONG DATE/TIME/DURATION', reasons: ['session occurrence does not exactly match recurring slot'], session};
  }
  const revision = scheduleRevision(enrollment);
  if (Number(session.scheduleRevision) !== revision) return {classification: 'STALE SCHEDULE REVISION', reasons: [`session revision ${session.scheduleRevision ?? 'missing'} != ${revision}`], session};
  return {classification: 'HEALTHY', reasons: [], session};
}

function positiveBilling(enrollment) {
  for (const field of ['ratePerSession', 'feePerSession', 'feePerClass', 'parentRate', 'parentClassRate', 'classFee', 'feeAmount']) {
    const value = Number(enrollment?.[field]);
    if (Number.isFinite(value) && value > 0) return {field, value};
  }
  return null;
}
function canonicalTeacher(enrollment) {
  const canonical = text(enrollment?.teacherId);
  const legacy = ids(enrollment, 'teacherIds', ['assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id']);
  if (canonical) return {teacherId: canonical, source: 'canonical', legacy};
  if (legacy.length === 1) return {teacherId: legacy[0], source: 'legacy', legacy};
  return {teacherId: null, source: legacy.length > 1 ? 'ambiguous_legacy' : 'missing', legacy};
}
function nextExpectedAfter(enrollment, afterYmd) { return enumerateExpected(enrollment, addDays(afterYmd, 1), addDays(afterYmd, 8))[0] || null; }
function materializationAudit(enrollment, expected, todayYmd) {
  const raw = record(enrollment?.scheduleMaterialization);
  if (!raw) return {state: 'MISSING', discoverable: false, needsReplenishment: true, reasons: ['scheduleMaterialization missing']};
  const reasons = [];
  const through = text(raw.materializedThroughYmd);
  const next = text(raw.nextOccurrenceYmd);
  const due = text(raw.nextMaterializationDueYmd);
  const throughValid = parseYmd(through) !== null;
  const nextValid = !next || parseYmd(next) !== null;
  const dueValid = !due || parseYmd(due) !== null;
  if (Number(raw.schemaVersion) !== MATERIALIZATION_VERSION) reasons.push(`schemaVersion ${raw.schemaVersion ?? 'missing'} != ${MATERIALIZATION_VERSION}`);
  if (Number(raw.horizonDays) !== HORIZON_DAYS) reasons.push(`horizonDays ${raw.horizonDays ?? 'missing'} != ${HORIZON_DAYS}`);
  if (Number(raw.scheduleRevision) !== scheduleRevision(enrollment)) reasons.push(`scheduleRevision ${raw.scheduleRevision ?? 'missing'} != ${scheduleRevision(enrollment)}`);
  if (!throughValid) reasons.push('materializedThroughYmd invalid/missing');
  if (!nextValid) reasons.push('nextOccurrenceYmd invalid');
  if (!dueValid) reasons.push('nextMaterializationDueYmd invalid');
  if (Boolean(next) !== Boolean(due)) reasons.push('next/due pointers not paired');
  if (!next && !due) reasons.push('next/due pointers missing for recurring schedule');
  if (throughValid && nextValid && next && next <= through) reasons.push('next occurrence is not after materializedThroughYmd');
  if (next && due && nextValid && dueValid && addDays(due, HORIZON_DAYS) !== next) reasons.push('due pointer is not 14 days before next occurrence');
  if (throughValid && next && nextValid) {
    try {
      const expectedNext = nextExpectedAfter(enrollment, through)?.date || null;
      if (expectedNext !== next) reasons.push(`nextOccurrenceYmd ${next} != ${expectedNext ?? 'none'}`);
    } catch (error) { reasons.push(`next occurrence cannot be validated: ${error instanceof Error ? error.message : String(error)}`); }
  }
  const horizonEnd = addDays(todayYmd, HORIZON_DAYS);
  const needsReplenishment = !throughValid || through < horizonEnd || !next || !due || Number(raw.scheduleRevision) !== scheduleRevision(enrollment);
  if (expected.length && (!throughValid || through < expected.at(-1).date)) reasons.push(`materializedThroughYmd does not cover ${expected.at(-1).date}`);
  const discoverable = Boolean(due && dueValid && due <= todayYmd);
  return {state: reasons.length ? 'INCORRECT' : 'OK', discoverable, needsReplenishment, reasons};
}

function accessToken() {
  const environmentToken = text(process.env.FIREBASE_TOKEN || process.env.GOOGLE_OAUTH_ACCESS_TOKEN);
  if (environmentToken) return environmentToken;
  const tokenFile = path.join(process.env.HOME || '', '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(tokenFile)) throw new Error('Firebase CLI credentials unavailable. Run firebase login.');
  const token = text(JSON.parse(fs.readFileSync(tokenFile, 'utf8'))?.tokens?.access_token);
  if (!token) throw new Error('Firebase CLI access token unavailable. Run firebase login again.');
  return token;
}
export function assertReadOnlyRequest(method, host, requestPath) {
  const verb = String(method).toUpperCase();
  const mutationMarker = /:(commit|batchWrite|write|delete)(?:\?|$)|\/documents:commit(?:\?|$)/i.test(requestPath);
  const allowed = host === 'firestore.googleapis.com' && ((verb === 'GET' && requestPath.startsWith(`${API_ROOT}/`)) || (verb === 'POST' && (requestPath === `${API_ROOT}:runQuery` || requestPath === `${API_ROOT}:batchGet`)));
  if (!allowed || mutationMarker || verb === 'PATCH' || verb === 'DELETE' || verb === 'PUT') throw new Error(`Brick 0 read-only guard rejected ${verb} ${host}${requestPath}`);
}
function request(method, requestPath, body) {
  assertReadOnlyRequest(method, 'firestore.googleapis.com', requestPath);
  const payload = body === undefined ? null : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({method, hostname: 'firestore.googleapis.com', path: requestPath, headers: {Authorization: `Bearer ${accessToken()}`, ...(payload ? {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload)} : {})}}, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error(`${method} ${requestPath} -> ${res.statusCode}: ${data.slice(0, 800)}`));
        try { resolve(data ? JSON.parse(data) : {}); } catch (error) { reject(error); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}
function decode(value) {
  if (!value || typeof value !== 'object') return null;
  if ('nullValue' in value) return null;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('stringValue' in value) return value.stringValue;
  if ('referenceValue' in value) return value.referenceValue;
  if ('geoPointValue' in value) return value.geoPointValue;
  if ('bytesValue' in value) return value.bytesValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decode);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  return null;
}
function decodeFields(fields) { return Object.fromEntries(Object.entries(fields || {}).map(([key, value]) => [key, decode(value)])); }
function decodeDoc(doc) { return {id: String(doc.name || '').split('/').pop(), ...decodeFields(doc.fields || {}), __createTime: doc.createTime || null, __updateTime: doc.updateTime || null}; }
async function listCollection(name) {
  const out = [];
  let pageToken = '';
  do {
    const query = new URLSearchParams({pageSize: '1000'});
    if (pageToken) query.set('pageToken', pageToken);
    const data = await request('GET', `${API_ROOT}/${name}?${query}`);
    out.push(...(data.documents || []).map(decodeDoc));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return out;
}
async function runQuery(structuredQuery) {
  const rows = await request('POST', `${API_ROOT}:runQuery`, {structuredQuery});
  return rows.filter((row) => row.document).map((row) => decodeDoc(row.document));
}
async function batchGet(collection, values) {
  const result = new Map();
  const unique = [...new Set(values.map(text).filter(Boolean))];
  for (let index = 0; index < unique.length; index += 100) {
    const documents = unique.slice(index, index + 100).map((id) => `projects/${PROJECT}/databases/${DATABASE}/documents/${collection}/${id}`);
    const rows = await request('POST', `${API_ROOT}:batchGet`, {documents});
    for (const row of rows) if (row.found) { const doc = decodeDoc(row.found); result.set(doc.id, doc); }
  }
  return result;
}
function mergeDocs(...groups) { const map = new Map(); for (const group of groups) for (const doc of group) map.set(doc.id, doc); return [...map.values()]; }
function dateRangeQuery(fieldPath, fromValue, toValue, valueType) {
  return {from: [{collectionId: 'classSessions'}], where: {compositeFilter: {op: 'AND', filters: [
    {fieldFilter: {field: {fieldPath}, op: 'GREATER_THAN_OR_EQUAL', value: {[valueType]: fromValue}}},
    {fieldFilter: {field: {fieldPath}, op: 'LESS_THAN_OR_EQUAL', value: {[valueType]: toValue}}},
  ]}}, orderBy: [{field: {fieldPath}, direction: 'ASCENDING'}]};
}
function indiaMidnightUtc(ymdValue) { return new Date(parseYmd(ymdValue) - IST_OFFSET_MINUTES * 60_000).toISOString(); }
function replacementFor(occurrence, session, candidates, byId, enrollment, kids) {
  const expectedIds = new Set([occurrence.sessionId, session?.id].filter(Boolean));
  const explicitReplacementId = text(session?.replacementSessionId);
  const possible = [
    ...(explicitReplacementId && byId.has(explicitReplacementId) ? [byId.get(explicitReplacementId)] : []),
    ...candidates.filter((candidate) => expectedIds.has(text(candidate.rescheduledFromSessionId)) || expectedIds.has(text(candidate.makeupForSessionId)) || expectedIds.has(text(candidate.replacementForSessionId))),
  ];
  return possible.find((candidate) => validExceptionSession(candidate, enrollment, kids)) || null;
}
function invalidEnrollmentReasons(enrollment, entityMaps, scheduleError) {
  const reasons = [];
  if (!schedulerActive(enrollment)) reasons.push(`status ${rawStatus(enrollment) || '(blank)'} excluded by rolling scheduler`);
  if (scheduleError) reasons.push(`invalid/missing schedule: ${scheduleError}`);
  const kids = kidIds(enrollment);
  const teacher = canonicalTeacher(enrollment);
  const parentId = text(enrollment.parentId);
  const courseId = text(enrollment.courseId);
  if (!kids.length) reasons.push('student identity missing'); else if (!kids.some((id) => entityMaps.kids.has(id))) reasons.push('student document missing');
  if (!teacher.teacherId) reasons.push(teacher.source === 'ambiguous_legacy' ? 'teacher identity ambiguous' : 'teacher identity missing'); else if (!entityMaps.users.has(teacher.teacherId)) reasons.push('teacher user document missing');
  if (!parentId) reasons.push('canonical parentId missing'); else if (!entityMaps.users.has(parentId)) reasons.push('parent user document missing');
  if (!courseId) reasons.push('course identity missing'); else if (!entityMaps.courses.has(courseId)) reasons.push('course document missing');
  if (!positiveBilling(enrollment)) reasons.push('positive billing rate missing');
  return reasons;
}

export async function runBrick0Audit() {
  if (parseYmd(TODAY) === null) throw new Error(`Invalid audit date ${TODAY}`);
  const horizonEnd = addDays(TODAY, HORIZON_DAYS);
  const replacementLookupEnd = addDays(TODAY, HORIZON_DAYS + 28);
  const enrollments = await listCollection('enrollments');
  const activeEnrollments = enrollments.filter(auditActive);
  const plans = activeEnrollments.map((enrollment) => {
    try { return {enrollment, expected: expectedOccurrences(enrollment), scheduleError: null}; }
    catch (error) { return {enrollment, expected: [], scheduleError: error instanceof Error ? error.message : String(error)}; }
  });
  const deterministicIds = plans.flatMap((plan) => plan.expected.map((occurrence) => occurrence.sessionId));
  const allKidIds = activeEnrollments.flatMap(kidIds);
  const allTeacherIds = activeEnrollments.map(canonicalTeacher).map((value) => value.teacherId).filter(Boolean);
  const allParentIds = activeEnrollments.map((enrollment) => text(enrollment.parentId)).filter(Boolean);
  const allCourseIds = activeEnrollments.map((enrollment) => text(enrollment.courseId)).filter(Boolean);
  const startAtFrom = indiaMidnightUtc(TODAY);
  const startAtTo = new Date(parseYmd(addDays(replacementLookupEnd, 1)) - IST_OFFSET_MINUTES * 60_000 - 1).toISOString();
  const [deterministic, dated, timestamped, kids, users, courses] = await Promise.all([
    batchGet('classSessions', deterministicIds),
    runQuery(dateRangeQuery('date', TODAY, replacementLookupEnd, 'stringValue')),
    runQuery(dateRangeQuery('startAt', startAtFrom, startAtTo, 'timestampValue')),
    batchGet('kids', allKidIds), batchGet('users', [...allTeacherIds, ...allParentIds]), batchGet('courses', allCourseIds),
  ]);
  const sessions = mergeDocs(dated, timestamped, [...deterministic.values()]);
  const sessionsByEnrollment = new Map();
  const sessionsById = new Map(sessions.map((session) => [session.id, session]));
  for (const session of sessions) {
    const enrollmentId = text(session.enrollmentId) || (session.id.includes('_') ? session.id.split('_')[0] : '');
    if (!enrollmentId) continue;
    const rows = sessionsByEnrollment.get(enrollmentId) || [];
    rows.push(session);
    sessionsByEnrollment.set(enrollmentId, rows);
  }
  const entityMaps = {kids, users, courses};
  const rows = [];
  for (const {enrollment, expected, scheduleError} of plans) {
    const candidates = sessionsByEnrollment.get(enrollment.id) || [];
    const invalid = invalidEnrollmentReasons(enrollment, entityMaps, scheduleError);
    const counts = {};
    const details = expected.map((occurrence) => {
      const deterministicSession = deterministic.get(occurrence.sessionId) || null;
      const legacySession = deterministicSession || candidates.find((candidate) => sessionDate(candidate) === occurrence.date && sessionTime(candidate) === occurrence.startTime && sessionDuration(candidate) === occurrence.durationMinutes) || null;
      const replacement = replacementFor(occurrence, legacySession, candidates, sessionsById, enrollment, kids);
      const result = classifyExpectedOccurrence({occurrence, session: legacySession, replacement, enrollment, kids});
      counts[result.classification] = (counts[result.classification] || 0) + 1;
      return {...occurrence, resolvedSessionId: result.session?.id || null, resolvedDate: result.session ? sessionDate(result.session) : null, resolvedStatus: result.session ? rawStatus(result.session) || 'scheduled' : null, lookup: deterministicSession ? 'deterministic' : legacySession ? 'legacy-date/startAt' : 'not-found', classification: result.classification, reasons: result.reasons, createdAt: result.session?.__createTime || null, updatedAt: result.session?.__updateTime || null};
    });
    const materialization = materializationAudit(enrollment, expected, TODAY);
    const missingToday = details.filter((detail) => detail.date === TODAY && detail.classification === 'MISSING SESSION').length;
    const parentVisibleUpcoming = details.filter((detail) =>
      ['HEALTHY', 'STALE SCHEDULE REVISION', 'VALID RESCHEDULE/MAKEUP/EXCEPTION'].includes(detail.classification) &&
      text(detail.resolvedDate) > TODAY &&
      ['scheduled', 'in_progress'].includes(text(detail.resolvedStatus).toLowerCase()),
    ).length;
    const rootCause = [];
    if (materialization.state === 'MISSING') rootCause.push('legacy/unmigrated: scheduleMaterialization missing');
    if (materialization.state === 'INCORRECT') rootCause.push(...materialization.reasons);
    if (counts['MISSING SESSION']) rootCause.push('recurrence coverage gap');
    if (counts['SESSION EXISTS BUT PARENT WOULD NOT SEE IT']) rootCause.push('parent ownership/visibility mismatch');
    if (counts['WRONG STUDENT/PARENT/TEACHER/ENROLLMENT IDENTITY']) rootCause.push('session identity mismatch');
    if (counts['WRONG DATE/TIME/DURATION']) rootCause.push('recurring slot mismatch');
    if (counts['STALE SCHEDULE REVISION']) rootCause.push('stale session schedule revision');
    if (counts['CANCELLED/PAUSED']) rootCause.push('cancelled or paused expected occurrence');
    rootCause.push(...invalid);
    let schedule = '(invalid/missing)';
    try { schedule = normalizeScheduleSlots(enrollment.schedule).map((slot) => `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][slot.weekday]} ${slot.time}/${slot.durationMinutes}m`).join(', ') || schedule; } catch {}
    rows.push({student: text(enrollment.studentName || enrollment.kidName || enrollment.childName) || kidIds(enrollment)[0] || 'UNKNOWN', enrollmentId: enrollment.id, status: rawStatus(enrollment) || '(blank)', normalizedOperationalStatus: normalizeOperationalStatus(enrollment.status), schedulerEligible: schedulerActive(enrollment), schedule, expected: expected.length, classifications: counts, healthy: counts.HEALTHY || 0, missing: counts['MISSING SESSION'] || 0, hidden: counts['SESSION EXISTS BUT PARENT WOULD NOT SEE IT'] || 0, missingToday, zeroUpcoming: parentVisibleUpcoming === 0, materialization, invalid, rootCause: [...new Set(rootCause)], details});
  }
  const countClass = (name) => rows.reduce((sum, row) => sum + (row.classifications[name] || 0), 0);
  const statusBreakdown = Object.fromEntries([...new Set(enrollments.map(rawStatus))].sort().map((value) => [value || '(blank)', enrollments.filter((enrollment) => rawStatus(enrollment) === value).length]));
  const statusInconsistencies = rows.filter((row) => !row.schedulerEligible);
  const totals = {
    auditDateYmd: TODAY, horizonEndYmd: horizonEnd, operationalActiveEnrollments: activeEnrollments.length,
    schedulerEligibleActiveEnrollments: rows.filter((row) => row.schedulerEligible).length,
    expectedSessions: rows.reduce((sum, row) => sum + row.expected, 0), healthySessions: countClass('HEALTHY'),
    validExceptionSessions: countClass('VALID RESCHEDULE/MAKEUP/EXCEPTION'), missingSessions: countClass('MISSING SESSION'),
    cancelledOrPausedSessions: countClass('CANCELLED/PAUSED'), sessionsHiddenFromParents: countClass('SESSION EXISTS BUT PARENT WOULD NOT SEE IT'),
    wrongIdentitySessions: countClass('WRONG STUDENT/PARENT/TEACHER/ENROLLMENT IDENTITY'), wrongScheduleSessions: countClass('WRONG DATE/TIME/DURATION'),
    staleRevisionSessions: countClass('STALE SCHEDULE REVISION'), sessionsMissingToday: rows.reduce((sum, row) => sum + row.missingToday, 0),
    studentsWithZeroUpcoming: rows.filter((row) => row.zeroUpcoming).length, affectedEnrollments: rows.filter((row) => row.rootCause.length > 0).length,
    enrollmentsMissingMaterialization: rows.filter((row) => row.materialization.state === 'MISSING').length,
    materializationMissingOrIncorrect: rows.filter((row) => row.materialization.state !== 'OK').length,
    enrollmentsInvisibleToEdgeReplenisher: rows.filter((row) => row.materialization.state !== 'OK' && !row.materialization.discoverable).length,
    enrollmentsWithInvalidScheduleTeacherOrIdentity: rows.filter((row) => row.invalid.length > 0).length, statusInconsistencies: statusInconsistencies.length,
  };
  const rootCauseBreakdown = {};
  for (const row of rows) for (const cause of row.rootCause) rootCauseBreakdown[cause] = (rootCauseBreakdown[cause] || 0) + 1;
  const generatedAt = new Date().toISOString();
  const report = {auditContract: {brick: 0, mode: 'READ_ONLY', firestoreMutationAllowed: false, project: PROJECT, database: DATABASE, timeZone: TIME_ZONE, horizonDays: HORIZON_DAYS}, generatedAt, statusBreakdown, statusInconsistencies: statusInconsistencies.map((row) => ({enrollmentId: row.enrollmentId, status: row.status, normalizedOperationalStatus: row.normalizedOperationalStatus})), rootCauseBreakdown, totals, enrollments: rows};
  const explicitOut = arg('--out');
  const outputPath = explicitOut ? path.resolve(process.cwd(), explicitOut) : path.join(OUT_DIR, `brick0-${TODAY}-${generatedAt.replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z')}.json`);
  fs.mkdirSync(path.dirname(outputPath), {recursive: true});
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  const latestPath = path.join(path.dirname(outputPath), 'brick0-latest.json');
  if (path.resolve(latestPath) !== path.resolve(outputPath)) fs.writeFileSync(latestPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({brick: 0, mode: 'READ_ONLY', outputPath, latestPath, totals, rootCauseBreakdown, exceptions: rows.filter((row) => row.rootCause.length > 0).map(({student, enrollmentId, status, schedule, expected, healthy, missing, hidden, missingToday: today, zeroUpcoming, materialization, invalid, rootCause, classifications}) => ({student, enrollmentId, status, schedule, expected, healthy, missing, hidden, missingToday: today, zeroUpcoming, materialization: materialization.state, classifications, invalid, rootCause}))}, null, 2));
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runBrick0Audit().catch((error) => { console.error(`[brick0] ${error instanceof Error ? error.stack || error.message : String(error)}`); process.exitCode = 1; });
}
