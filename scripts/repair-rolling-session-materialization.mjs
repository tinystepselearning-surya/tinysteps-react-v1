import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  materializeRollingEnrollmentWindowInternal,
  ROLLING_SCHEDULE_HORIZON_DAYS,
} = require('../functions/lib/scheduling/rollingScheduleMaterializer.js');

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'tinysteps-react-v1';
const APPLY = process.argv.includes('--apply');
const ANCHOR_YMD = process.env.REPAIR_ANCHOR_YMD || '';
const MAX_ENROLLMENTS = Number(process.env.REPAIR_MAX_ENROLLMENTS || 250);
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
const IST_OFFSET_MINUTES = 330;

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
const toIndiaYmd = (date = new Date()) => {
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const isOperational = (enrollment) => {
  if (enrollment.archivedAt || enrollment.archived === true || enrollment.isArchived === true) return false;
  return ACTIVE_STATUS_ALIASES.has(text(enrollment.status).toLowerCase());
};
const hasUsableSchedule = (enrollment) => {
  const schedule = isRecord(enrollment.schedule) ? enrollment.schedule : {};
  if (Array.isArray(schedule.weeklySlots) && schedule.weeklySlots.length) return true;
  return Array.isArray(schedule.weekdays) && schedule.weekdays.length > 0 && Boolean(text(schedule.timeHHmm));
};
const resolveCanonicalTeacher = (enrollment) => {
  const canonical = text(enrollment.teacherId);
  if (canonical) return canonical;
  const refs = new Set();
  for (const value of Array.isArray(enrollment.teacherIds) ? enrollment.teacherIds : []) {
    const id = text(value); if (id) refs.add(id);
  }
  for (const key of ['assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id']) {
    const id = text(enrollment[key]); if (id) refs.add(id);
  }
  return refs.size === 1 ? [...refs][0] : '';
};

const anchorYmd = ANCHOR_YMD || toIndiaYmd();
const snap = await db.collection('enrollments').get();
const operational = snap.docs
  .map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
  .filter(isOperational);

if (operational.length > MAX_ENROLLMENTS) {
  throw new Error(`Safety stop: ${operational.length} operational enrollments exceeds cap ${MAX_ENROLLMENTS}`);
}

const summary = {
  projectId: PROJECT_ID,
  mode: APPLY ? 'APPLY' : 'DRY_RUN',
  anchorYmd,
  horizonDays: ROLLING_SCHEDULE_HORIZON_DAYS,
  operationalEnrollments: operational.length,
  eligibleEnrollments: 0,
  skippedInvalidSchedule: [],
  skippedMissingTeacher: [],
  processed: 0,
  failed: [],
  expectedOccurrences: 0,
  existingSessionsPreserved: 0,
  missingSessionsWouldCreate: 0,
  sessionsCreated: 0,
  raceAlreadyExists: 0,
  metadataUpdates: 0,
  results: [],
};

for (const enrollment of operational) {
  if (!hasUsableSchedule(enrollment)) {
    summary.skippedInvalidSchedule.push(enrollment.id);
    continue;
  }
  if (!resolveCanonicalTeacher(enrollment)) {
    summary.skippedMissingTeacher.push(enrollment.id);
    continue;
  }
  summary.eligibleEnrollments += 1;

  try {
    const result = await materializeRollingEnrollmentWindowInternal(db, {
      enrollmentId: enrollment.id,
      anchorYmd,
      actorId: 'system:rolling_schedule_one_time_repair_20260912',
      dryRun: !APPLY,
    });
    summary.processed += 1;
    summary.expectedOccurrences += result.expectedCount;
    summary.existingSessionsPreserved += result.existingCount;
    summary.missingSessionsWouldCreate += result.wouldCreateCount;
    summary.sessionsCreated += result.createdCount;
    summary.raceAlreadyExists += result.raceAlreadyExistsCount;
    if (result.metadataUpdated) summary.metadataUpdates += 1;
    summary.results.push({
      enrollmentId: enrollment.id,
      expected: result.expectedCount,
      existing: result.existingCount,
      wouldCreate: result.wouldCreateCount,
      created: result.createdCount,
      metadataUpdated: result.metadataUpdated,
      materializedThroughYmd: result.materialization?.materializedThroughYmd || null,
      nextOccurrenceYmd: result.materialization?.nextOccurrenceYmd || null,
      nextMaterializationDueYmd: result.materialization?.nextMaterializationDueYmd || null,
    });
  } catch (error) {
    summary.failed.push({
      enrollmentId: enrollment.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

summary.results.sort((a, b) => b.wouldCreate - a.wouldCreate || a.enrollmentId.localeCompare(b.enrollmentId));
console.log('ROLLING_REPAIR_JSON_START');
console.log(JSON.stringify(summary, null, 2));
console.log('ROLLING_REPAIR_JSON_END');

if (summary.failed.length > 0) {
  console.error(`Repair completed with ${summary.failed.length} failed enrollment(s).`);
  process.exitCode = 2;
}
