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

const normalize = (value) => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

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
    canonicalTeacherId: canonical || null,
    resolvedTeacherId: resolveTeacherId(row) || null,
    legacyRefs: aliases,
    missingCanonicalTeacherId: !canonical,
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
  return { project, limit, startDate };
};

const summarize = (rows) => ({
  scanned: rows.length,
  missingCanonicalTeacherId: rows.filter((row) => row.missingCanonicalTeacherId).length,
  legacyOnly: rows.filter((row) => row.legacyOnly).length,
  mismatchedAliases: rows.filter((row) => row.mismatchedFields.length > 0).length,
  cleanCanonical: rows.filter((row) => (
    !row.missingCanonicalTeacherId && row.mismatchedFields.length === 0
  )).length,
});

const main = async () => {
  const { project, limit, startDate } = parseArgs(process.argv.slice(2));
  if (!project) {
    console.error('Usage: node scripts/audit-teacher-identity.mjs --project <project-id> [--limit 250] [--start-date YYYY-MM-DD]');
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

  const result = {
    mode: 'READ_ONLY',
    project,
    startDate,
    limitPerCollection: limit,
    collections: {
      enrollments: {
        summary: summarize(enrollments),
        problems: enrollments.filter((row) => row.missingCanonicalTeacherId || row.mismatchedFields.length > 0),
      },
      classSessions: {
        summary: summarize(classSessions),
        problems: classSessions.filter((row) => row.missingCanonicalTeacherId || row.mismatchedFields.length > 0),
      },
    },
  };

  console.log(JSON.stringify(result, null, 2));
};

main().catch((error) => {
  console.error(`Teacher identity audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
