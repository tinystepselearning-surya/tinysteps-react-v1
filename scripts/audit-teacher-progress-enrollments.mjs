#!/usr/bin/env node

import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  buildProgressEnrollmentAudit,
} from './lib/teacher-progress-enrollment-audit.mjs';

const APPLY_CONFIRMATION = 'APPLY_UNAMBIGUOUS_PROGRESS_ENROLLMENT_BACKFILL';

function readArg(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? String(args[index + 1] || '').trim() : '';
}

function boundedInteger(value, fallback, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(max, Math.max(1, Math.floor(parsed)));
}

function parseArgs(args) {
  const project = readArg(args, '--project');
  const progressLimit = boundedInteger(readArg(args, '--progress-limit'), 2000, 5000);
  const enrollmentLimit = boundedInteger(readArg(args, '--enrollment-limit'), 1000, 2000);
  const kidId = readArg(args, '--kid-id');
  const summaryOnly = args.includes('--summary-only');
  const apply = args.includes('--apply');
  const confirm = readArg(args, '--confirm');
  return { project, progressLimit, enrollmentLimit, kidId, summaryOnly, apply, confirm };
}

function problemRow(row) {
  return {
    kind: row.kind,
    path: row.path,
    kidId: row.kidId,
    topicId: row.topicId,
    courseId: row.courseId,
    enrollmentId: row.enrollmentId,
    candidateEnrollmentIds: row.candidateEnrollmentIds,
    ...(row.targetEnrollmentId ? { targetEnrollmentId: row.targetEnrollmentId } : {}),
  };
}

async function loadProgressDocs(db, options) {
  if (options.kidId) {
    const snap = await db.collection('students').doc(options.kidId)
      .collection('progress').limit(options.progressLimit).get();
    return {
      rawScanned: snap.size,
      rows: snap.docs.map((doc) => ({ path: doc.ref.path, data: doc.data() || {}, ref: doc.ref })),
    };
  }

  const snap = await db.collectionGroup('progress').limit(options.progressLimit).get();
  const rows = snap.docs
    .filter((doc) => doc.ref.path.startsWith('students/'))
    .map((doc) => ({ path: doc.ref.path, data: doc.data() || {}, ref: doc.ref }));
  return { rawScanned: snap.size, rows };
}

async function loadEnrollments(db, limit) {
  const snap = await db.collection('enrollments').limit(limit).get();
  return snap.docs.map((doc) => ({ id: doc.id, data: doc.data() || {} }));
}

async function applyUniqueBackfill(db, audit, progressRows) {
  const byPath = new Map(progressRows.map((row) => [row.path, row]));
  const candidates = audit.rows.filter((row) => row.kind === 'migratable_unique');
  let updated = 0;
  let skippedAfterRecheck = 0;

  for (const candidate of candidates) {
    const source = byPath.get(candidate.path);
    if (!source?.ref || !candidate.targetEnrollmentId) {
      skippedAfterRecheck += 1;
      continue;
    }

    await db.runTransaction(async (tx) => {
      const current = await tx.get(source.ref);
      if (!current.exists) {
        skippedAfterRecheck += 1;
        return;
      }
      const currentEnrollmentId = String(current.data()?.enrollmentId || '').trim();
      const currentCourseId = String(current.data()?.courseId || '').trim();
      if (currentEnrollmentId || currentCourseId !== candidate.courseId) {
        skippedAfterRecheck += 1;
        return;
      }

      const enrollmentRef = db.collection('enrollments').doc(candidate.targetEnrollmentId);
      const enrollmentSnap = await tx.get(enrollmentRef);
      if (!enrollmentSnap.exists) {
        skippedAfterRecheck += 1;
        return;
      }
      const enrollment = enrollmentSnap.data() || {};
      const canonicalKidId = String(enrollment.kidId || '').trim();
      const legacyKidIds = [
        String(enrollment.studentId || '').trim(),
        String(enrollment.childId || '').trim(),
        ...(Array.isArray(enrollment.kidIds) ? enrollment.kidIds.map((value) => String(value || '').trim()) : []),
      ].filter(Boolean);
      const childMatches = canonicalKidId
        ? canonicalKidId === candidate.kidId
        : legacyKidIds.includes(candidate.kidId);
      const courseMatches = String(enrollment.courseId || '').trim() === candidate.courseId;
      if (!childMatches || !courseMatches) {
        skippedAfterRecheck += 1;
        return;
      }

      // Intentionally update only authorization identity. Do not touch updatedAt,
      // mastery, lesson status, completion metadata, or parent-facing projection fields.
      tx.update(source.ref, {
        enrollmentId: candidate.targetEnrollmentId,
      });
      updated += 1;
    });
  }

  return { candidates: candidates.length, updated, skippedAfterRecheck };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.project) {
    console.error(
      'Usage: node scripts/audit-teacher-progress-enrollments.mjs --project <project-id> '
      + '[--progress-limit 2000] [--enrollment-limit 1000] [--kid-id <id>] [--summary-only] '
      + `[--apply --confirm ${APPLY_CONFIRMATION}]`,
    );
    process.exitCode = 64;
    return;
  }
  if (options.apply && options.confirm !== APPLY_CONFIRMATION) {
    console.error(`--apply requires --confirm ${APPLY_CONFIRMATION}`);
    process.exitCode = 64;
    return;
  }

  if (!getApps().length) {
    initializeApp({ credential: applicationDefault(), projectId: options.project });
  }
  const db = getFirestore();

  const [progress, enrollments] = await Promise.all([
    loadProgressDocs(db, options),
    loadEnrollments(db, options.enrollmentLimit),
  ]);
  const audit = buildProgressEnrollmentAudit({
    progressDocs: progress.rows.map(({ path, data }) => ({ path, data })),
    enrollments,
  });

  const result = {
    mode: options.apply ? 'APPLY_UNAMBIGUOUS_ONLY' : 'READ_ONLY_DRY_RUN',
    project: options.project,
    bounds: {
      progressLimit: options.progressLimit,
      enrollmentLimit: options.enrollmentLimit,
      kidId: options.kidId || null,
    },
    scanned: {
      rawProgressCollectionGroupDocuments: progress.rawScanned,
      studentProgressDocumentsExamined: progress.rows.length,
      enrollmentsExamined: enrollments.length,
    },
    summary: audit.summary,
    ...(!options.summaryOnly ? {
      findings: audit.rows
        .filter((row) => row.kind !== 'already_correct' && row.kind !== 'ignored_non_student_progress')
        .slice(0, 100)
        .map(problemRow),
    } : {}),
  };

  if (options.apply) {
    result.applyResult = await applyUniqueBackfill(db, audit, progress.rows);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(`Teacher progress enrollment audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
