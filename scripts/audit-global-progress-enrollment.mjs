import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import {
  buildProgressEnrollmentAudit,
  normalizeId,
  resolveStudentProgressPath,
} from './lib/teacher-progress-enrollment-audit.mjs';

const PROJECT_ID = String(process.env.FIREBASE_PROJECT_ID || '').trim();
const OUTPUT_PATH = String(process.env.GLOBAL_PROGRESS_AUDIT_OUTPUT || '').trim();
const MAX_PROGRESS_DOCS = 50000;
const MAX_ENROLLMENTS = 20000;

if (!PROJECT_ID) {
  throw new Error('FIREBASE_PROJECT_ID is required.');
}

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore();

const hashId = (value) => crypto
  .createHash('sha256')
  .update(String(value || ''))
  .digest('hex')
  .slice(0, 12);

const normalizeCourseId = (value) => {
  const raw = normalizeId(value).toLowerCase();
  const aliases = {
    'phonics-foundation': 'phonics-foundations',
    foundational: 'phonics-foundations',
    foundation: 'phonics-foundations',
    'phonics-early': 'early-phonics',
    early: 'early-phonics',
    'phonics-advanced': 'advanced-phonics',
    advanced: 'advanced-phonics',
    'grammar-essentials': 'basic-grammar',
    'grammar-mastery': 'advanced-grammar',
    'intermediate-grammar': 'basic-grammar',
    'public-speaking-foundations': 'basic-public-speaking',
    'public-speaking-excellence': 'advanced-public-speaking',
    'intermediate-public-speaking': 'basic-public-speaking',
  };
  return aliases[raw] || raw;
};

const curriculumTopicSets = (data) => {
  const sets = new Map();
  const topics = Array.isArray(data?.topics) ? data.topics : [];
  for (const topic of topics) {
    if (!topic || typeof topic !== 'object') continue;
    const courseId = normalizeCourseId(topic.courseId ?? topic.course);
    const topicId = normalizeId(topic.id ?? topic.topicId);
    if (!courseId || !topicId) continue;
    const set = sets.get(courseId) || new Set();
    set.add(topicId);
    sets.set(courseId, set);
  }
  return sets;
};

const enrollmentStatusBucket = (value) => {
  const status = normalizeId(value).toLowerCase();
  if (['active', 'trial', 'paused', 'enrolled', 'current', 'ongoing', ''].includes(status)) {
    return 'operational_like';
  }
  return 'historical_like';
};

const [enrollmentSnap, progressGroupSnap, curriculumSnap] = await Promise.all([
  db.collection('enrollments').limit(MAX_ENROLLMENTS + 1).get(),
  db.collectionGroup('progress').limit(MAX_PROGRESS_DOCS + 1).get(),
  db.collection('config').doc('curriculumTopics').get(),
]);

if (enrollmentSnap.size > MAX_ENROLLMENTS) {
  throw new Error(`Enrollment audit cap exceeded: ${enrollmentSnap.size} > ${MAX_ENROLLMENTS}`);
}
if (progressGroupSnap.size > MAX_PROGRESS_DOCS) {
  throw new Error(`Progress audit cap exceeded: ${progressGroupSnap.size} > ${MAX_PROGRESS_DOCS}`);
}

const enrollments = enrollmentSnap.docs.map((doc) => ({
  id: doc.id,
  data: doc.data() || {},
}));
const enrollmentById = new Map(enrollments.map((entry) => [entry.id, entry]));

const progressDocs = progressGroupSnap.docs
  .map((doc) => ({ path: doc.ref.path, data: doc.data() || {} }))
  .filter((entry) => Boolean(resolveStudentProgressPath(entry.path)));

const audit = buildProgressEnrollmentAudit({ progressDocs, enrollments });
const topicSets = curriculumTopicSets(curriculumSnap.exists ? curriculumSnap.data() : undefined);

const counters = {
  metadataOnlySafe: 0,
  uniqueNeedsTopicMigration: 0,
  uniqueMissingTeacherId: 0,
  uniqueMissingCurriculumDefinition: 0,
  alreadyCorrectCanonicalTopic: 0,
  alreadyCorrectNeedsTopicMigration: 0,
  legacyWithUpdatedBy: 0,
  legacyMissingUpdatedBy: 0,
  legacyWithSource: 0,
  legacyMissingSource: 0,
  operationalLikeUniqueTargets: 0,
  historicalLikeUniqueTargets: 0,
};

const affectedKids = new Set();
const safeKids = new Set();
const exceptionKids = new Set();
const affectedTeachers = new Set();
const teacherStats = new Map();
const courseStats = new Map();
const exceptionFingerprints = [];

const bump = (record, key, amount = 1) => {
  record[key] = (record[key] || 0) + amount;
};

const progressByPath = new Map(progressDocs.map((entry) => [entry.path, entry]));

for (const row of audit.rows) {
  if (row.kind === 'ignored_non_student_progress') continue;
  const progress = progressByPath.get(row.path);
  const data = progress?.data || {};
  const normalizedCourse = normalizeCourseId(row.courseId);
  const courseRecord = courseStats.get(normalizedCourse || 'missing-course') || {};
  bump(courseRecord, 'total');
  bump(courseRecord, row.kind);
  courseStats.set(normalizedCourse || 'missing-course', courseRecord);

  if (row.kind !== 'already_correct') {
    affectedKids.add(row.kidId);
    if (normalizeId(data.updatedBy)) counters.legacyWithUpdatedBy += 1;
    else counters.legacyMissingUpdatedBy += 1;
    if (normalizeId(data.source)) counters.legacyWithSource += 1;
    else counters.legacyMissingSource += 1;
  }

  const targetEnrollmentId = row.kind === 'already_correct'
    ? row.enrollmentId
    : row.kind === 'migratable_unique'
      ? row.targetEnrollmentId
      : null;
  const targetEnrollment = targetEnrollmentId ? enrollmentById.get(targetEnrollmentId) : null;
  const targetTeacherId = normalizeId(targetEnrollment?.data?.teacherId);

  if (targetTeacherId) {
    affectedTeachers.add(targetTeacherId);
    const teacherKey = hashId(targetTeacherId);
    const teacherRecord = teacherStats.get(teacherKey) || {
      legacyUnique: 0,
      alreadyCorrect: 0,
      needsTopicMigration: 0,
      safeMetadataOnly: 0,
      exceptions: 0,
    };
    if (row.kind === 'migratable_unique') teacherRecord.legacyUnique += 1;
    if (row.kind === 'already_correct') teacherRecord.alreadyCorrect += 1;
    teacherStats.set(teacherKey, teacherRecord);
  }

  const curriculumSet = topicSets.get(normalizedCourse);
  const docTopicId = row.topicId;
  const canonicalDocId = Boolean(curriculumSet?.has(docTopicId));

  if (row.kind === 'migratable_unique') {
    if (targetEnrollment) {
      const bucket = enrollmentStatusBucket(targetEnrollment.data?.status);
      if (bucket === 'operational_like') counters.operationalLikeUniqueTargets += 1;
      else counters.historicalLikeUniqueTargets += 1;
    }

    if (!targetTeacherId) {
      counters.uniqueMissingTeacherId += 1;
      exceptionKids.add(row.kidId);
    } else if (!curriculumSet || curriculumSet.size === 0) {
      counters.uniqueMissingCurriculumDefinition += 1;
      exceptionKids.add(row.kidId);
    } else if (!canonicalDocId) {
      counters.uniqueNeedsTopicMigration += 1;
      exceptionKids.add(row.kidId);
      const teacherKey = hashId(targetTeacherId);
      const teacherRecord = teacherStats.get(teacherKey);
      if (teacherRecord) teacherRecord.needsTopicMigration += 1;
    } else {
      counters.metadataOnlySafe += 1;
      safeKids.add(row.kidId);
      const teacherKey = hashId(targetTeacherId);
      const teacherRecord = teacherStats.get(teacherKey);
      if (teacherRecord) teacherRecord.safeMetadataOnly += 1;
    }
  } else if (row.kind === 'already_correct') {
    if (canonicalDocId) counters.alreadyCorrectCanonicalTopic += 1;
    else {
      counters.alreadyCorrectNeedsTopicMigration += 1;
      exceptionKids.add(row.kidId);
    }
  } else {
    exceptionKids.add(row.kidId);
    const candidateTeachers = new Set(
      (row.candidateEnrollmentIds || [])
        .map((id) => normalizeId(enrollmentById.get(id)?.data?.teacherId))
        .filter(Boolean),
    );
    for (const teacherId of candidateTeachers) {
      affectedTeachers.add(teacherId);
      const teacherKey = hashId(teacherId);
      const teacherRecord = teacherStats.get(teacherKey) || {
        legacyUnique: 0,
        alreadyCorrect: 0,
        needsTopicMigration: 0,
        safeMetadataOnly: 0,
        exceptions: 0,
      };
      teacherRecord.exceptions += 1;
      teacherStats.set(teacherKey, teacherRecord);
    }
  }

  if (
    row.kind === 'ambiguous'
    || row.kind === 'unmapped'
    || row.kind === 'missing_course_id'
    || row.kind.startsWith('conflicting_')
    || (row.kind === 'migratable_unique' && (!targetTeacherId || !curriculumSet || !canonicalDocId))
  ) {
    if (exceptionFingerprints.length < 250) {
      exceptionFingerprints.push({
        fingerprint: hashId(row.path),
        kind: row.kind,
        courseId: normalizedCourse || null,
        candidateCount: row.candidateEnrollmentIds?.length || 0,
        canonicalDocumentId: canonicalDocId,
        hasTargetTeacher: Boolean(targetTeacherId),
        curriculumDefinitionPresent: Boolean(curriculumSet?.size),
      });
    }
  }
}

const teacherBreakdown = Array.from(teacherStats.entries())
  .map(([teacherFingerprint, stats]) => ({ teacherFingerprint, ...stats }))
  .sort((a, b) => (
    (b.legacyUnique + b.exceptions + b.needsTopicMigration)
    - (a.legacyUnique + a.exceptions + a.needsTopicMigration)
  ));

const courseBreakdown = Object.fromEntries(
  Array.from(courseStats.entries()).sort(([a], [b]) => a.localeCompare(b)),
);

const result = {
  mode: 'READ_ONLY_DRY_RUN',
  projectId: PROJECT_ID,
  generatedAt: new Date().toISOString(),
  caps: {
    maxEnrollments: MAX_ENROLLMENTS,
    maxProgressDocuments: MAX_PROGRESS_DOCS,
  },
  sourceCounts: {
    enrollments: enrollments.length,
    collectionGroupProgressDocuments: progressGroupSnap.size,
    studentProgressDocuments: progressDocs.length,
    curriculumCourses: topicSets.size,
  },
  enrollmentAudit: audit.summary,
  migrationReadiness: counters,
  entityImpact: {
    affectedStudents: affectedKids.size,
    studentsWithMetadataOnlySafeRows: safeKids.size,
    studentsWithExceptionsOrTopicMigration: exceptionKids.size,
    affectedTeachers: affectedTeachers.size,
  },
  courseBreakdown,
  teacherBreakdown,
  exceptionSample: exceptionFingerprints,
  writeOperationsPerformed: 0,
};

console.log(JSON.stringify(result, null, 2));

if (OUTPUT_PATH) {
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}
