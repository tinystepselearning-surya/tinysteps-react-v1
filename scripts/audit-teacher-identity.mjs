#!/usr/bin/env node

import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const ACTIVE_ENROLLMENT_STATUSES = [
  'active',
  'trial',
  'paused',
  'enrolled',
  'current',
  'ongoing',
  'pending_teacher',
  'pending_payment',
];

const CLOSED_SESSION_STATUSES = new Set([
  'cancelled',
  'canceled',
  'completed',
  'present',
  'attendance_marked',
  'billable_completed',
]);

const normalize = (value) => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const normalizeStatus = (value) => normalize(value).toLowerCase() || 'unknown';

const normalizeList = (value) => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map(normalize).filter(Boolean)));
};

const legacyRefs = (row) => Array.from(new Set([
  ...normalizeList(row.teacherIds),
  normalize(row.assignedTeacherId),
  normalize(row.primaryTeacherId),
  normalize(row.teacherUid),
  normalize(row.teacher_id),
].filter(Boolean)));

const resolveTeacherId = (row) => (
  normalize(row.teacherId)
  || normalize(row.assignedTeacherId)
  || normalize(row.primaryTeacherId)
  || normalize(row.teacherUid)
  || normalize(row.teacher_id)
  || normalizeList(row.teacherIds)[0]
  || ''
);

const hasScheduleConfig = (row) => (
  Boolean(row?.schedule) &&
  typeof row.schedule === 'object' &&
  !Array.isArray(row.schedule) &&
  Object.keys(row.schedule).length > 0
);

const auditRow = (id, row) => {
  const canonical = normalize(row.teacherId);
  const aliases = legacyRefs(row);
  const mismatchedFields = [];

  if (canonical) {
    const ids = normalizeList(row.teacherIds);
    if (ids.length > 0 && (ids.length !== 1 || ids[0] !== canonical)) {
      mismatchedFields.push('teacherIds');
    }
    ['assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id'].forEach((field) => {
      const value = normalize(row[field]);
      if (value && value !== canonical) mismatchedFields.push(field);
    });
  }

  return {
    id,
    enrollmentId: normalize(row.enrollmentId) || null,
    status: normalizeStatus(row.status),
    hasScheduleConfig: hasScheduleConfig(row),
    canonicalTeacherId: canonical || null,
    resolvedTeacherId: resolveTeacherId(row) || null,
    legacyRefs: aliases,
    missingCanonicalTeacherId: !canonical,
    missingCanonicalWithoutLegacyRefs: !canonical && aliases.length === 0,
    legacyOnly: !canonical && aliases.length > 0,
    mismatchedFields,
  };
};

const parseArgs = (args) => {
  const readValue = (flag) => {
    const index = args.indexOf(flag);
    return index >= 0 ? String(args[index + 1] || '').trim() : '';
  };
  const project = readValue('--project');
  const rawLimit = Number(readValue('--limit') || 250);
  const limit = Math.max(1, Math.min(500, Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 250));
  const startDate = readValue('--start-date') || new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const summaryOnly = args.includes('--summary-only');
  return { project, limit, startDate, summaryOnly };
};

const countByStatus = (rows) => rows.reduce((acc, row) => {
  acc[row.status] = (acc[row.status] || 0) + 1;
  return acc;
}, {});

const summarize = (rows) => {
  const missingCanonicalRows = rows.filter((row) => row.missingCanonicalTeacherId);
  const missingWithoutLegacyRows = rows.filter((row) => row.missingCanonicalWithoutLegacyRefs);
  const legacyOnlyRows = rows.filter((row) => row.legacyOnly);
  const mismatchedRows = rows.filter((row) => row.mismatchedFields.length > 0);
  return {
    scanned: rows.length,
    missingCanonicalTeacherId: missingCanonicalRows.length,
    missingCanonicalWithoutLegacyRefs: missingWithoutLegacyRows.length,
    legacyOnly: legacyOnlyRows.length,
    mismatchedAliases: mismatchedRows.length,
    cleanCanonical: rows.filter((row) => (
      !row.missingCanonicalTeacherId && row.mismatchedFields.length === 0
    )).length,
    statusCounts: countByStatus(rows),
    missingCanonicalByStatus: countByStatus(missingCanonicalRows),
    missingWithoutLegacyRefsByStatus: countByStatus(missingWithoutLegacyRows),
    legacyOnlyByStatus: countByStatus(legacyOnlyRows),
    mismatchedAliasesByStatus: countByStatus(mismatchedRows),
  };
};

const summarizeMissingEnrollmentEvidence = (enrollments, classSessions) => {
  const missing = enrollments.filter((row) => row.missingCanonicalTeacherId);
  let withScheduleConfig = 0;
  let withOpenFutureSessions = 0;
  let withSingleCanonicalFutureTeacher = 0;
  let withMultipleCanonicalFutureTeachers = 0;
  let withNoCanonicalFutureTeacher = 0;
  let withoutOpenFutureSessions = 0;

  missing.forEach((enrollment) => {
    if (enrollment.hasScheduleConfig) withScheduleConfig += 1;
    const openFutureSessions = classSessions.filter((session) => (
      session.enrollmentId === enrollment.id &&
      !CLOSED_SESSION_STATUSES.has(session.status)
    ));
    if (openFutureSessions.length === 0) {
      withoutOpenFutureSessions += 1;
      return;
    }

    withOpenFutureSessions += 1;
    const futureTeacherIds = Array.from(new Set(
      openFutureSessions.map((session) => session.canonicalTeacherId).filter(Boolean),
    ));
    if (futureTeacherIds.length === 1) withSingleCanonicalFutureTeacher += 1;
    else if (futureTeacherIds.length > 1) withMultipleCanonicalFutureTeachers += 1;
    else withNoCanonicalFutureTeacher += 1;
  });

  return {
    missingCanonicalEnrollments: missing.length,
    withScheduleConfig,
    withOpenFutureSessions,
    withSingleCanonicalFutureTeacher,
    withMultipleCanonicalFutureTeachers,
    withNoCanonicalFutureTeacher,
    withoutOpenFutureSessions,
  };
};

const main = async () => {
  const { project, limit, startDate, summaryOnly } = parseArgs(process.argv.slice(2));
  if (!project) {
    console.error('Usage: node scripts/audit-teacher-identity.mjs --project <project-id> [--limit 250] [--start-date YYYY-MM-DD] [--summary-only]');
    process.exitCode = 64;
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw new Error('--start-date must use YYYY-MM-DD');
  }

  if (!getApps().length) {
    initializeApp({ credential: applicationDefault(), projectId: project });
  }
  const db = getFirestore();
  const sessionQueryLimit = Math.max(1, Math.floor(limit / 2));
  const startAtBoundary = Timestamp.fromDate(new Date(`${startDate}T00:00:00+05:30`));

  const [enrollmentSnap, sessionsByDateSnap, sessionsByStartAtSnap] = await Promise.all([
    db.collection('enrollments')
      .where('status', 'in', ACTIVE_ENROLLMENT_STATUSES)
      .limit(limit)
      .get(),
    db.collection('classSessions')
      .where('date', '>=', startDate)
      .orderBy('date', 'asc')
      .limit(sessionQueryLimit)
      .get(),
    db.collection('classSessions')
      .where('startAt', '>=', startAtBoundary)
      .orderBy('startAt', 'asc')
      .limit(sessionQueryLimit)
      .get(),
  ]);

  const enrollments = enrollmentSnap.docs.map((doc) => auditRow(doc.id, doc.data() || {}));
  const sessionDocs = new Map();
  sessionsByDateSnap.docs.forEach((doc) => sessionDocs.set(doc.id, doc));
  sessionsByStartAtSnap.docs.forEach((doc) => sessionDocs.set(doc.id, doc));
  const classSessions = Array.from(sessionDocs.values())
    .slice(0, limit)
    .map((doc) => auditRow(doc.id, doc.data() || {}));

  const enrollmentSummary = summarize(enrollments);
  const sessionSummary = summarize(classSessions);
  const missingEnrollmentEvidence = summarizeMissingEnrollmentEvidence(enrollments, classSessions);
  const result = {
    mode: 'READ_ONLY',
    project,
    startDate,
    limitPerCollection: limit,
    collections: {
      enrollments: {
        summary: enrollmentSummary,
        missingCanonicalEvidence: missingEnrollmentEvidence,
        ...(!summaryOnly ? {
          problems: enrollments.filter((row) => row.missingCanonicalTeacherId || row.mismatchedFields.length > 0),
        } : {}),
      },
      classSessions: {
        summary: sessionSummary,
        ...(!summaryOnly ? {
          problems: classSessions.filter((row) => row.missingCanonicalTeacherId || row.mismatchedFields.length > 0),
        } : {}),
      },
    },
  };

  console.log(JSON.stringify(result, null, 2));
};

main().catch((error) => {
  console.error(`Teacher identity audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
