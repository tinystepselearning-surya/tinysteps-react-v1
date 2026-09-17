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
const PROJECT = arg('--project') || process.env.FIREBASE_PROJECT_ID || 'tinysteps-react-v1';
const DATABASE = arg('--database') || process.env.FIRESTORE_DATABASE_ID || '(default)';
const TODAY = arg('--date') || indiaYmd(new Date());
const API_ROOT = `/v1/projects/${PROJECT}/databases/${encodeURIComponent(DATABASE)}/documents`;
const OUT_DIR = path.resolve(process.cwd(), 'artifacts', 'scheduling-audit');
const OPERATIONAL = new Set(['', 'active', 'trial', 'enrolled', 'current', 'ongoing', 'pending_teacher', 'pending_payment', 'pending_lp', 'pending_lp_assignment']);
const SCHEDULER = new Set(['', 'active', 'trial', 'enrolled', 'current', 'ongoing', 'pending_teacher', 'pending_payment', 'pending_lp']);

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}
function text(v) { return typeof v === 'string' ? v.trim() : Number.isFinite(v) ? String(v) : ''; }
function list(v) { return Array.isArray(v) ? [...new Set(v.map(text).filter(Boolean))] : []; }
function record(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : null; }
function indiaYmd(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
function parseYmd(v) {
  const raw = text(v);
  if (!YMD_RE.test(raw)) return null;
  const [y, m, d] = raw.split('-').map(Number);
  const ms = Date.UTC(y, m - 1, d);
  const dt = new Date(ms);
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? ms : null;
}
function ymd(ms) { return new Date(ms).toISOString().slice(0, 10); }
function addDays(value, days) { const ms = parseYmd(value); if (ms === null) throw new Error(`Invalid YMD: ${value}`); return ymd(ms + days * DAY_MS); }
function archived(e) { return Boolean(e.archivedAt || e.archived === true || e.isArchived === true); }
function status(e) { return text(e.status).toLowerCase(); }
function active(e) { return !archived(e) && OPERATIONAL.has(status(e)); }
function schedulerActive(e) { return !archived(e) && SCHEDULER.has(status(e)); }
function ids(e, plural, singles) { return [...new Set([...list(e[plural]), ...singles.map((k) => text(e[k]))].filter(Boolean))]; }
function kidIds(e) { return ids(e, 'kidIds', ['kidId', 'studentId', 'childId']); }
function teacherIds(e) { return ids(e, 'teacherIds', ['teacherId', 'assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id']); }
function parentIds(e) { return ids(e, 'parentIds', ['parentId']); }
function startDate(e) { return [e.classesStartDateYmd, e.classesStartDate, e.startDateYmd, e.startDate].map((v) => typeof v === 'string' && YMD_RE.test(v) ? v : v ? indiaYmd(new Date(v)) : null).find(Boolean) || TODAY; }
function billing(e) {
  for (const key of ['ratePerSession', 'feePerSession', 'feePerClass', 'parentRate', 'parentClassRate', 'classFee', 'feeAmount']) {
    const n = Number(e[key]); if (Number.isFinite(n) && n > 0) return {field: key, value: n};
  }
  return null;
}
function slots(e) {
  const s = record(e.schedule); if (!s) return [];
  if (text(s.timezone) && text(s.timezone) !== TIME_ZONE) throw new Error(`Unsupported timezone ${text(s.timezone)}`);
  const out = [];
  if (Array.isArray(s.weeklySlots) && s.weeklySlots.length) {
    for (const raw of s.weeklySlots) {
      const x = record(raw) || {}; const weekday = Number(x.weekday); const time = text(x.time); const duration = Math.floor(Number(x.durationMinutes ?? x.durationMins));
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 || !HHMM_RE.test(time) || !Number.isFinite(duration) || duration <= 0) throw new Error('Invalid weekly slot');
      out.push({weekday, time, duration});
    }
  } else {
    const time = text(s.timeHHmm); const duration = Math.floor(Number(s.durationMins ?? 35));
    if (!HHMM_RE.test(time) || !Number.isFinite(duration) || duration <= 0) return [];
    for (const raw of Array.isArray(s.weekdays) ? s.weekdays : []) { const weekday = Number(raw); if (Number.isInteger(weekday) && weekday >= 0 && weekday <= 6) out.push({weekday, time, duration}); }
  }
  return out.sort((a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time));
}
function expected(e) {
  const schedule = slots(e); const from = Math.max(parseYmd(TODAY), parseYmd(startDate(e)) ?? parseYmd(TODAY)); const to = parseYmd(addDays(TODAY, HORIZON_DAYS)); const out = [];
  for (let ms = from; ms <= to; ms += DAY_MS) {
    const date = ymd(ms); const weekday = new Date(ms).getUTCDay();
    for (const s of schedule.filter((x) => x.weekday === weekday)) out.push({date, time: s.time, duration: s.duration, sessionId: `${e.id}_${date.replaceAll('-', '')}_${s.time.replace(':', '')}`});
  }
  return out;
}
function sessionDate(s) { return YMD_RE.test(text(s.date)) ? text(s.date) : s.startAt ? indiaYmd(new Date(s.startAt)) : ''; }
function sessionTime(s) {
  if (HHMM_RE.test(text(s.startTime))) return text(s.startTime);
  if (!s.startAt) return '';
  const d = new Date(new Date(s.startAt).getTime() + IST_OFFSET_MINUTES * 60_000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
function sessionDuration(s) { const n = Number(s.durationMinutes ?? s.durationMins); return Number.isFinite(n) && n > 0 ? Math.floor(n) : null; }
function visibleToParent(s, e) {
  const parentId = text(e.parentId); const kids = kidIds(e); const sessionKids = ids(s, 'kidIds', ['kidId', 'studentId', 'childId']);
  return Boolean(parentId && text(s.parentId) === parentId && kids.length && sessionKids.some((id) => kids.includes(id)));
}
function materialization(e, exp) {
  const m = record(e.scheduleMaterialization); if (!m) return {state: 'MISSING', discoverable: false, reasons: ['scheduleMaterialization missing']};
  const reasons = []; const revision = Math.max(1, Math.floor(Number(record(e.schedule)?.revision) || 1)); const through = text(m.materializedThroughYmd); const next = text(m.nextOccurrenceYmd); const due = text(m.nextMaterializationDueYmd);
  if (Number(m.schemaVersion) !== 1) reasons.push('schemaVersion != 1');
  if (Number(m.horizonDays) !== HORIZON_DAYS) reasons.push(`horizonDays != ${HORIZON_DAYS}`);
  if (Number(m.scheduleRevision) !== revision) reasons.push(`scheduleRevision ${m.scheduleRevision ?? 'missing'} != ${revision}`);
  if (!YMD_RE.test(through)) reasons.push('materializedThroughYmd invalid/missing');
  if (Boolean(next) !== Boolean(due)) reasons.push('next/due pointers not paired');
  if (next && due && YMD_RE.test(next) && YMD_RE.test(due) && addDays(due, HORIZON_DAYS) !== next) reasons.push('due pointer is not 14 days before next occurrence');
  const lastExpected = exp.at(-1)?.date || null; if (lastExpected && (!through || through < lastExpected)) reasons.push(`materializedThroughYmd does not cover ${lastExpected}`);
  return {state: reasons.length ? 'INCORRECT' : 'OK', discoverable: Boolean(due && YMD_RE.test(due) && due <= TODAY), reasons};
}

function accessToken() {
  const env = text(process.env.FIREBASE_TOKEN || process.env.GOOGLE_OAUTH_ACCESS_TOKEN); if (env) return env;
  const file = path.join(process.env.HOME || '', '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(file)) throw new Error('Firebase CLI credentials unavailable. Run firebase login.');
  const token = text(JSON.parse(fs.readFileSync(file, 'utf8'))?.tokens?.access_token); if (!token) throw new Error('Firebase CLI access token unavailable. Run firebase login again.'); return token;
}
export function assertReadOnlyRequest(method, host, requestPath) {
  const verb = String(method).toUpperCase(); const allowed = host === 'firestore.googleapis.com' && ((verb === 'GET' && requestPath.startsWith(`${API_ROOT}/`)) || (verb === 'POST' && [':runQuery', ':batchGet'].some((suffix) => requestPath === `${API_ROOT}${suffix}`)));
  if (!allowed || [':commit', ':batchWrite', ':write', ':delete'].some((x) => requestPath.includes(x))) throw new Error(`Brick 0 read-only guard rejected ${verb} ${host}${requestPath}`);
}
function request(method, requestPath, body) {
  assertReadOnlyRequest(method, 'firestore.googleapis.com', requestPath); const payload = body === undefined ? null : JSON.stringify(body); const token = accessToken();
  return new Promise((resolve, reject) => { const req = https.request({method, hostname: 'firestore.googleapis.com', path: requestPath, headers: {Authorization: `Bearer ${token}`, ...(payload ? {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload)} : {})}}, (res) => { let data = ''; res.on('data', (c) => { data += c; }); res.on('end', () => { if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error(`${method} ${requestPath} -> ${res.statusCode}: ${data.slice(0, 800)}`)); try { resolve(data ? JSON.parse(data) : {}); } catch (error) { reject(error); } }); }); req.on('error', reject); if (payload) req.write(payload); req.end(); });
}
function decode(v) { if (!v || typeof v !== 'object') return null; if ('nullValue' in v) return null; if ('booleanValue' in v) return v.booleanValue; if ('integerValue' in v) return Number(v.integerValue); if ('doubleValue' in v) return Number(v.doubleValue); if ('timestampValue' in v) return v.timestampValue; if ('stringValue' in v) return v.stringValue; if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode); if ('mapValue' in v) return decodeFields(v.mapValue.fields || {}); return null; }
function decodeFields(fields) { return Object.fromEntries(Object.entries(fields || {}).map(([k, v]) => [k, decode(v)])); }
function decodeDoc(doc) { return {id: String(doc.name || '').split('/').pop(), ...decodeFields(doc.fields || {}), __createTime: doc.createTime || null, __updateTime: doc.updateTime || null}; }
async function listCollection(name) { const out = []; let pageToken = ''; do { const qs = new URLSearchParams({pageSize: '1000'}); if (pageToken) qs.set('pageToken', pageToken); const data = await request('GET', `${API_ROOT}/${name}?${qs}`); out.push(...(data.documents || []).map(decodeDoc)); pageToken = data.nextPageToken || ''; } while (pageToken); return out; }
async function runQuery(structuredQuery) { const rows = await request('POST', `${API_ROOT}:runQuery`, {structuredQuery}); return rows.filter((r) => r.document).map((r) => decodeDoc(r.document)); }
async function batchGet(collection, idsToGet) { const result = new Map(); const unique = [...new Set(idsToGet.filter(Boolean))]; for (let i = 0; i < unique.length; i += 100) { const documents = unique.slice(i, i + 100).map((id) => `projects/${PROJECT}/databases/${DATABASE}/documents/${collection}/${id}`); const rows = await request('POST', `${API_ROOT}:batchGet`, {documents}); for (const row of rows) if (row.found) { const doc = decodeDoc(row.found); result.set(doc.id, doc); } } return result; }

export async function runBrick0Audit() {
  if (!YMD_RE.test(TODAY)) throw new Error(`Invalid audit date ${TODAY}`);
  const horizonEnd = addDays(TODAY, HORIZON_DAYS); const enrollments = await listCollection('enrollments'); const activeEnrollments = enrollments.filter(active); const plans = []; const deterministicIds = [];
  for (const e of activeEnrollments) { try { const exp = expected(e); plans.push({e, exp, scheduleError: null}); deterministicIds.push(...exp.map((x) => x.sessionId)); } catch (error) { plans.push({e, exp: [], scheduleError: error instanceof Error ? error.message : String(error)}); } }
  const [deterministic, datedSessions] = await Promise.all([batchGet('classSessions', deterministicIds), runQuery({from: [{collectionId: 'classSessions'}], where: {compositeFilter: {op: 'AND', filters: [{fieldFilter: {field: {fieldPath: 'date'}, op: 'GREATER_THAN_OR_EQUAL', value: {stringValue: TODAY}}}, {fieldFilter: {field: {fieldPath: 'date'}, op: 'LESS_THAN_OR_EQUAL', value: {stringValue: horizonEnd}}}]}}, orderBy: [{field: {fieldPath: 'date'}, direction: 'ASCENDING'}]})]);
  const sessionsByEnrollment = new Map(); for (const s of datedSessions) { const id = text(s.enrollmentId); if (!id) continue; if (!sessionsByEnrollment.has(id)) sessionsByEnrollment.set(id, []); sessionsByEnrollment.get(id).push(s); }
  const rows = [];
  for (const {e, exp, scheduleError} of plans) {
    const invalid = []; if (!schedulerActive(e)) invalid.push(`status ${status(e) || '(blank)'} excluded by scheduler`); if (scheduleError || !exp.length && !slots(e).length) invalid.push(`invalid/missing schedule${scheduleError ? `: ${scheduleError}` : ''}`); if (!kidIds(e).length) invalid.push('student identity missing'); if (!teacherIds(e).length) invalid.push('teacher identity missing'); if (!parentIds(e).length) invalid.push('parent identity missing'); if (!billing(e)) invalid.push('positive billing rate missing');
    const actual = sessionsByEnrollment.get(e.id) || []; let healthy = 0; let missing = 0; let hidden = 0; let missingToday = 0;
    const details = exp.map((x) => { const s = deterministic.get(x.sessionId) || actual.find((a) => sessionDate(a) === x.date && sessionTime(a) === x.time && sessionDuration(a) === x.duration); if (!s) { missing += 1; if (x.date === TODAY) missingToday += 1; return {...x, classification: 'MISSING'}; } const visible = visibleToParent(s, e); if (!visible) hidden += 1; else healthy += 1; return {...x, sessionId: s.id, classification: visible ? 'HEALTHY' : 'HIDDEN_FROM_PARENT', createdAt: s.__createTime, updatedAt: s.__updateTime}; });
    const mat = materialization(e, exp); const rootCause = []; if (mat.state === 'MISSING') rootCause.push('legacy/unmigrated: scheduleMaterialization missing'); else if (mat.state === 'INCORRECT') rootCause.push(...mat.reasons); if (missing) rootCause.push('recurrence coverage gap'); if (hidden) rootCause.push('parent ownership/identity mismatch'); rootCause.push(...invalid);
    rows.push({student: text(e.studentName || e.kidName || e.childName) || kidIds(e)[0] || 'UNKNOWN', enrollmentId: e.id, status: status(e) || '(blank)', schedule: slots(e).map((s) => `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][s.weekday]} ${s.time}/${s.duration}m`).join(', ') || '(invalid/missing)', expected: exp.length, healthy, missing, hidden, missingToday, zeroUpcoming: healthy === 0, materialization: mat, invalid, rootCause: [...new Set(rootCause)], details});
  }
  const statusBreakdown = Object.fromEntries([...new Set(enrollments.map(status))].sort().map((s) => [s || '(blank)', enrollments.filter((e) => status(e) === s).length]));
  const totals = {auditDateYmd: TODAY, horizonEndYmd: horizonEnd, operationalActiveEnrollments: activeEnrollments.length, schedulerEligibleActiveEnrollments: activeEnrollments.filter(schedulerActive).length, expectedSessions: rows.reduce((n, r) => n + r.expected, 0), healthySessions: rows.reduce((n, r) => n + r.healthy, 0), missingSessions: rows.reduce((n, r) => n + r.missing, 0), sessionsMissingToday: rows.reduce((n, r) => n + r.missingToday, 0), sessionsHiddenFromParents: rows.reduce((n, r) => n + r.hidden, 0), studentsWithZeroUpcoming: rows.filter((r) => r.zeroUpcoming).length, affectedEnrollments: rows.filter((r) => r.missing || r.hidden || r.invalid.length || r.materialization.state !== 'OK').length, enrollmentsMissingMaterialization: rows.filter((r) => r.materialization.state === 'MISSING').length, materializationMissingOrIncorrect: rows.filter((r) => r.materialization.state !== 'OK').length, enrollmentsSkippedInvalid: rows.filter((r) => r.invalid.length).length, enrollmentsInvisibleToEdgeReplenisher: rows.filter((r) => r.materialization.state !== 'OK' && !r.materialization.discoverable).length};
  const generatedAt = new Date().toISOString(); const report = {auditContract: {brick: 0, mode: 'READ_ONLY', firestoreMutationAllowed: false, project: PROJECT, database: DATABASE, timeZone: TIME_ZONE, horizonDays: HORIZON_DAYS}, generatedAt, statusBreakdown, totals, enrollments: rows};
  const explicitOut = arg('--out'); const file = explicitOut ? path.resolve(process.cwd(), explicitOut) : path.join(OUT_DIR, `brick0-${TODAY}-${generatedAt.replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z')}.json`); fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`); const latest = path.join(path.dirname(file), 'brick0-latest.json'); if (path.resolve(latest) !== path.resolve(file)) fs.writeFileSync(latest, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({brick: 0, mode: 'READ_ONLY', outputPath: file, latestPath: latest, totals, exceptions: rows.filter((r) => r.missing || r.hidden || r.invalid.length || r.materialization.state !== 'OK').map(({student, enrollmentId, status: st, schedule, expected: ex, healthy: ok, missing: miss, hidden: hide, missingToday: today, zeroUpcoming, materialization: mat, invalid, rootCause}) => ({student, enrollmentId, status: st, schedule, expected: ex, healthy: ok, missing: miss, hidden: hide, missingToday: today, zeroUpcoming, materialization: mat.state, invalid, rootCause}))}, null, 2));
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) runBrick0Audit().catch((error) => { console.error(`[brick0] ${error instanceof Error ? error.stack || error.message : String(error)}`); process.exitCode = 1; });
