#!/usr/bin/env node

import { createRequire } from 'node:module';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import {
  buildProgressEnrollmentAudit,
  enrollmentBelongsToKid,
  enrollmentCourseMatches,
  normalizeId,
  resolveStudentProgressPath,
} from './lib/teacher-progress-enrollment-audit.mjs';

const APPLY_CONFIRMATION = 'APPLY_GLOBAL_PROGRESS_ENROLLMENT_MIGRATION';
const DEFAULT_PROGRESS_LIMIT = 5000;
const DEFAULT_ENROLLMENT_LIMIT = 2000;
const MAX_PROGRESS_LIMIT = 50000;
const MAX_ENROLLMENT_LIMIT = 20000;
const require = createRequire(import.meta.url);

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
  return {
    project: readArg(args, '--project'),
    progressLimit: boundedInteger(readArg(args, '--progress-limit'), DEFAULT_PROGRESS_LIMIT, MAX_PROGRESS_LIMIT),
    enrollmentLimit: boundedInteger(readArg(args, '--enrollment-limit'), DEFAULT_ENROLLMENT_LIMIT, MAX_ENROLLMENT_LIMIT),
    apply: args.includes('--apply'),
    confirm: readArg(args, '--confirm'),
  };
}

function normalizeCourseId(value) {
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
}

function curriculumTopicSets(data) {
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
}

async function loadInputs(db, options) {
  const [progressSnap, enrollmentSnap, curriculumSnap] = await Promise.all([
    db.collectionGroup('progress').limit(options.progressLimit + 1).get(),
    db.collection('enrollments').limit(options.enrollmentLimit + 1).get(),
    db.collection('config').doc('curriculumTopics').get(),
  ]);

  if (progressSnap.size > options.progressLimit) {
    throw new Error(`Progress scan exceeded --progress-limit ${options.progressLimit}; refusing a partial migration.`);
  }
  if (enrollmentSnap.size > options.enrollmentLimit) {
    throw new Error(`Enrollment scan exceeded --enrollment-limit ${options.enrollmentLimit}; refusing a partial migration.`);
  }
  if (!curriculumSnap.exists) {
    throw new Error('config/curriculumTopics is missing; refusing migration.');
  }

  const progressRows = progressSnap.docs
    .filter((doc) => Boolean(resolveStudentProgressPath(doc.ref.path)))
    .map((doc) => ({
      path: doc.ref.path,
      data: doc.data() || {},
      ref: doc.ref,
      snapshot: doc,
    }));
  const enrollments = enrollmentSnap.docs.map((doc) => ({ id: doc.id, data: doc.data() || {} }));

  return {
    progressRows,
    rawProgressCount: progressSnap.size,
    enrollments,
    curriculumData: curriculumSnap.data() || {},
  };
}

function planMigration(inputs) {
  const audit = buildProgressEnrollmentAudit({
    progressDocs: inputs.progressRows.map(({ path, data }) => ({ path, data })),
    enrollments: inputs.enrollments,
  });
  const enrollmentById = new Map(inputs.enrollments.map((entry) => [entry.id, entry]));
  const topicSets = curriculumTopicSets(inputs.curriculumData);
  const safe = [];
  const blockedUnique = [];

  for (const row of audit.rows) {
    if (row.kind !== 'migratable_unique' || !row.targetEnrollmentId) continue;
    const enrollment = enrollmentById.get(row.targetEnrollmentId);
    const teacherId = normalizeId(enrollment?.data?.teacherId);
    const courseId = normalizeCourseId(row.courseId);
    const topicSet = topicSets.get(courseId);
    const canonicalDocumentId = Boolean(topicSet?.has(row.topicId));
    const courseDefinitionPresent = Boolean(topicSet?.size);

    if (!enrollment || !teacherId || !courseDefinitionPresent || !canonicalDocumentId) {
      blockedUnique.push({
        row,
        reason: !enrollment
          ? 'target_enrollment_missing'
          : !teacherId
            ? 'target_enrollment_missing_teacher'
            : !courseDefinitionPresent
              ? 'curriculum_definition_missing'
              : 'noncanonical_topic_document_id',
      });
      continue;
    }
    safe.push({ row, enrollment });
  }

  const pairKeys = new Set(safe.map(({ row }) => `${row.kidId}::${normalizeCourseId(row.courseId)}`));
  return { audit, safe, blockedUnique, pairKeys, topicSets };
}

async function applySafeBackfill(db, inputs, plan) {
  const progressByPath = new Map(inputs.progressRows.map((row) => [row.path, row]));
  const updated = [];
  let skippedAfterRecheck = 0;

  for (const candidate of plan.safe) {
    const { row } = candidate;
    const source = progressByPath.get(row.path);
    if (!source?.ref || !row.targetEnrollmentId) {
      skippedAfterRecheck += 1;
      continue;
    }

    let didUpdate = false;
    await db.runTransaction(async (tx) => {
      const [currentProgress, currentEnrollment] = await Promise.all([
        tx.get(source.ref),
        tx.get(db.collection('enrollments').doc(row.targetEnrollmentId)),
      ]);
      if (!currentProgress.exists || !currentEnrollment.exists) return;

      const progressData = currentProgress.data() || {};
      const enrollmentData = currentEnrollment.data() || {};
      const currentEnrollmentId = normalizeId(progressData.enrollmentId);
      const currentCourseId = normalizeId(progressData.courseId);
      const teacherId = normalizeId(enrollmentData.teacherId);
      const topicSet = plan.topicSets.get(normalizeCourseId(currentCourseId));

      if (
        currentEnrollmentId
        || currentCourseId !== row.courseId
        || !teacherId
        || !enrollmentBelongsToKid(enrollmentData, row.kidId)
        || !enrollmentCourseMatches(enrollmentData, row.courseId)
        || !topicSet?.has(row.topicId)
      ) {
        return;
      }

      // Deliberately preserve the historical educational record exactly as-is.
      // Do not touch updatedAt, ratings, mastery, remarks, lesson status, or attribution.
      tx.update(source.ref, { enrollmentId: row.targetEnrollmentId });
      didUpdate = true;
    });

    if (didUpdate) updated.push(candidate);
    else skippedAfterRecheck += 1;
  }

  return { updated, skippedAfterRecheck };
}

function loadProjectionHelpers() {
  try {
    return require('../functions/lib/childCourseProgressProjectionV3.js');
  } catch (error) {
    throw new Error(
      'Compiled V3 projection helpers are required before --apply. Run `npm --prefix functions run build` first. '
      + `Original error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function forceRebuildTouchedProjections(db, inputs, updatedCandidates) {
  if (updatedCandidates.length === 0) return { rebuilt: 0, pairs: [] };
  const {
    buildSummaryFromDocs,
    curriculumTopicsForCourse,
    docsForCourse,
  } = loadProjectionHelpers();

  const pairMap = new Map();
  for (const { row } of updatedCandidates) {
    const courseId = normalizeCourseId(row.courseId);
    pairMap.set(`${row.kidId}::${courseId}`, { kidId: row.kidId, courseId });
  }

  const rebuilt = [];
  for (const pair of pairMap.values()) {
    const childDocs = inputs.progressRows
      .filter((entry) => resolveStudentProgressPath(entry.path)?.kidId === pair.kidId)
      .map((entry) => entry.snapshot);
    const topics = curriculumTopicsForCourse(inputs.curriculumData, pair.courseId);
    if (topics.length === 0) {
      throw new Error(`Cannot rebuild ${pair.courseId}: curriculum definition missing.`);
    }
    const topicIds = new Set(topics.map((topic) => topic.id));
    const relevantDocs = docsForCourse(childDocs, pair.courseId, topicIds);
    const summary = buildSummaryFromDocs(
      pair.kidId,
      pair.courseId,
      relevantDocs,
      inputs.curriculumData,
    );
    await db.collection('students').doc(pair.kidId)
      .collection('courseProgress').doc(pair.courseId)
      .set(summary, { merge: false });
    rebuilt.push({
      kidId: pair.kidId,
      courseId: pair.courseId,
      completedTopics: summary.completedTopics,
      totalTopics: summary.totalTopics,
    });
  }

  return { rebuilt: rebuilt.length, pairs: rebuilt };
}

async function verifyAppliedState(db, updatedCandidates, rebuiltPairs) {
  const progressRefs = updatedCandidates.map(({ row }) => db.doc(row.path));
  const progressSnaps = progressRefs.length ? await db.getAll(...progressRefs) : [];
  let enrollmentBackfillsVerified = 0;
  for (let index = 0; index < progressSnaps.length; index += 1) {
    const snap = progressSnaps[index];
    const expected = updatedCandidates[index].row.targetEnrollmentId;
    if (snap.exists && normalizeId(snap.data()?.enrollmentId) === expected) {
      enrollmentBackfillsVerified += 1;
    }
  }

  const projectionRefs = rebuiltPairs.map((pair) => (
    db.collection('students').doc(pair.kidId).collection('courseProgress').doc(pair.courseId)
  ));
  const projectionSnaps = projectionRefs.length ? await db.getAll(...projectionRefs) : [];
  let projectionsVerified = 0;
  for (let index = 0; index < projectionSnaps.length; index += 1) {
    const snap = projectionSnaps[index];
    const expected = rebuiltPairs[index];
    const data = snap.data() || {};
    if (
      snap.exists
      && Number(data.schemaVersion) === 3
      && data.modelType === 'child_course_progress_v3'
      && data.completionAuthority === 'teacher_progress_save'
      && Number(data.completedTopics) === expected.completedTopics
      && Number(data.totalTopics) === expected.totalTopics
    ) {
      projectionsVerified += 1;
    }
  }

  return {
    enrollmentBackfillsExpected: updatedCandidates.length,
    enrollmentBackfillsVerified,
    projectionsExpected: rebuiltPairs.length,
    projectionsVerified,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.project) {
    console.error(
      'Usage: node scripts/migrate-global-progress-enrollments.mjs --project <project-id> '
      + '[--progress-limit 5000] [--enrollment-limit 2000] '
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
  const inputs = await loadInputs(db, options);
  const plan = planMigration(inputs);

  const result = {
    mode: options.apply ? 'APPLY_SAFE_GLOBAL_BACKFILL' : 'READ_ONLY_DRY_RUN',
    project: options.project,
    scanned: {
      rawProgressCollectionGroupDocuments: inputs.rawProgressCount,
      studentProgressDocuments: inputs.progressRows.length,
      enrollments: inputs.enrollments.length,
    },
    enrollmentAudit: plan.audit.summary,
    plan: {
      safeBackfillDocuments: plan.safe.length,
      blockedUniqueDocuments: plan.blockedUnique.length,
      affectedKidCoursePairs: plan.pairKeys.size,
      ambiguousDocuments: plan.audit.summary.ambiguous,
      unmappedDocuments: plan.audit.summary.unmapped,
      alreadyCorrectDocuments: plan.audit.summary.alreadyCorrect,
    },
    writeOperationsPerformed: 0,
  };

  if (options.apply) {
    const applyResult = await applySafeBackfill(db, inputs, plan);
    const rebuildResult = await forceRebuildTouchedProjections(db, inputs, applyResult.updated);
    const verification = await verifyAppliedState(db, applyResult.updated, rebuildResult.pairs);
    result.apply = {
      candidates: plan.safe.length,
      updated: applyResult.updated.length,
      skippedAfterRecheck: applyResult.skippedAfterRecheck,
      projectionsRebuilt: rebuildResult.rebuilt,
      verification,
    };
    result.writeOperationsPerformed = applyResult.updated.length + rebuildResult.rebuilt;

    if (
      verification.enrollmentBackfillsVerified !== verification.enrollmentBackfillsExpected
      || verification.projectionsVerified !== verification.projectionsExpected
    ) {
      throw new Error(`Post-migration verification failed: ${JSON.stringify(verification)}`);
    }
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(`Global progress enrollment migration failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
