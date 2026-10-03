#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'tinysteps-react-v1';
const REPORT_PATH = 'reports/identity-reference-exception-drilldown.json';
const TODAY = new Date().toISOString().slice(0, 10);

const text = (value) => (typeof value === 'string' ? value.trim() : '');
const list = (...values) => {
  const out = [];
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    const v = text(value);
    if (v) out.push(v);
  };
  values.forEach(visit);
  return [...new Set(out)];
};
const token = (value) => createHash('sha256').update(String(value || '')).digest('hex').slice(0, 12);
const normalizeRole = (value) => text(value).toLowerCase().replace(/[\s_-]+/g, '');
const dateBucket = (date) => !date ? 'missing' : date < TODAY ? 'past' : date === TODAY ? 'today' : 'future';

function timestampIso(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000).toISOString();
  return null;
}

function row(doc) {
  return { id: doc.id, path: doc.ref.path, data: doc.data() || {} };
}

async function read(db, collectionName, fields) {
  const ref = fields?.length ? db.collection(collectionName).select(...fields) : db.collection(collectionName);
  const snap = await ref.get();
  return snap.docs.map(row);
}

function byId(rows) {
  return new Map(rows.map((entry) => [entry.id, entry]));
}

function learnerRefs(data) {
  return list(data.kidId, data.studentId, data.childId, data.kidIds);
}

function teacherRefs(data) {
  return list(data.teacherId, data.teacherIds);
}

function sessionLearnerRefs(data) {
  return list(data.kidId, data.studentId, data.childId, data.kidIds, data.studentIds, data.childIds, data.childrenIds);
}

function sessionTeacherRefs(data) {
  return list(data.teacherId, data.teacherIds, data.assignedTeacherId, data.primaryTeacherId, data.teacherUid, data.teacher_id);
}

function isActiveLike(value) {
  return ['active', 'trial', 'paused', 'pending_teacher', 'pending_payment', 'enrolled', 'current', 'ongoing'].includes(
    text(value).toLowerCase(),
  );
}

async function sessionsForEnrollment(db, enrollmentId) {
  const snap = await db
    .collection('classSessions')
    .where('enrollmentId', '==', enrollmentId)
    .select(
      'date',
      'status',
      'teacherId',
      'teacherIds',
      'assignedTeacherId',
      'primaryTeacherId',
      'teacherUid',
      'teacher_id',
      'kidId',
      'kidIds',
      'studentId',
      'studentIds',
      'childId',
      'childIds',
      'childrenIds',
    )
    .get();
  return snap.docs.map(row);
}

function summarizeSessions(rows, kidIds, teacherIds) {
  const buckets = { past: 0, today: 0, future: 0, missing: 0 };
  let canonicalTeacherResolvedFuture = 0;
  let canonicalTeacherMissingFuture = 0;
  let learnerResolvedFuture = 0;
  let learnerMissingFuture = 0;
  const futureTeacherTokens = new Set();
  const futureLearnerTokens = new Set();

  for (const entry of rows) {
    const date = text(entry.data.date);
    const bucket = dateBucket(date);
    buckets[bucket] += 1;
    if (bucket !== 'today' && bucket !== 'future') continue;

    const canonicalTeacherId = text(entry.data.teacherId);
    if (canonicalTeacherId) {
      futureTeacherTokens.add(token(canonicalTeacherId));
      if (teacherIds.has(canonicalTeacherId)) canonicalTeacherResolvedFuture += 1;
      else canonicalTeacherMissingFuture += 1;
    }

    const refs = sessionLearnerRefs(entry.data);
    refs.forEach((id) => futureLearnerTokens.add(token(id)));
    if (refs.some((id) => kidIds.has(id))) learnerResolvedFuture += 1;
    else if (refs.length) learnerMissingFuture += 1;
  }

  return {
    total: rows.length,
    byDate: buckets,
    futureOrToday: buckets.today + buckets.future,
    canonicalTeacherResolvedFuture,
    canonicalTeacherMissingFuture,
    learnerResolvedFuture,
    learnerMissingFuture,
    futureTeacherTokens: [...futureTeacherTokens].sort(),
    futureLearnerTokens: [...futureLearnerTokens].sort(),
  };
}

function chooseEnrollmentLearnerDisposition(enrollment, summary, kidIds) {
  const missingRefs = learnerRefs(enrollment.data).filter((id) => !kidIds.has(id));
  if (!missingRefs.length) return 'resolved';
  if (!isActiveLike(enrollment.data.status)) return 'historical_exception';
  if (summary.futureOrToday > 0 && summary.learnerMissingFuture > 0) return 'current_blocker_future_sessions_reference_missing_learner';
  if (summary.futureOrToday > 0 && summary.learnerResolvedFuture > 0) return 'stale_enrollment_learner_alias_superseded_by_valid_future_session';
  return 'stale_active_enrollment_candidate_no_future_sessions';
}

function chooseEnrollmentTeacherDisposition(enrollment, summary, teacherIds, kidTeacherResolved) {
  const teacherId = text(enrollment.data.teacherId);
  if (!teacherId || teacherIds.has(teacherId)) return 'resolved';
  if (!isActiveLike(enrollment.data.status)) return 'historical_exception';
  if (summary.futureOrToday > 0 && summary.canonicalTeacherMissingFuture > 0) return 'current_blocker_future_sessions_reference_missing_teacher';
  if (summary.futureOrToday > 0 && summary.canonicalTeacherResolvedFuture > 0) return 'stale_enrollment_teacher_superseded_by_valid_future_session';
  if (kidTeacherResolved) return 'stale_enrollment_teacher_kid_has_valid_current_teacher';
  return 'stale_active_enrollment_candidate_no_future_sessions';
}

function demoDisposition(demo, teacherIds) {
  const assigned = text(demo.data.assignedTeacherId);
  const completedBy = text(demo.data.completedByTeacherId);
  const assignedMissing = assigned && !teacherIds.has(assigned);
  const completedMissing = completedBy && !teacherIds.has(completedBy);
  const status = text(demo.data.status).toLowerCase();
  const confirmedDate = text(demo.data.teacherConfirmedDate);

  if (assignedMissing && status === 'assigned' && confirmedDate && confirmedDate >= TODAY) {
    return 'current_blocker_assigned_future_demo_missing_teacher';
  }
  if (assignedMissing && status === 'assigned') {
    return 'stale_assigned_demo_missing_teacher_review';
  }
  if (completedMissing && status === 'completed') {
    return 'historical_completed_demo_attribution_exception';
  }
  if (assignedMissing || completedMissing) return 'legacy_demo_teacher_reference_exception';
  return 'resolved';
}

async function main() {
  if (!getApps().length) {
    initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  }
  const db = getFirestore();

  const [users, parents, teachers, learningPartners, admins, kids, enrollments, demos, schools] = await Promise.all([
    read(db, 'users', ['uid', 'userId', 'role', 'roles', 'status', 'childIds']),
    read(db, 'parents', ['userId', 'status']),
    read(db, 'teachers', ['userId', 'status']),
    read(db, 'learningPartners', ['userId', 'status']),
    read(db, 'admins', ['userId', 'status']),
    read(db, 'kids', ['status', 'teacherId', 'teacherIds', 'parentId', 'parentIds', 'primaryParentId', 'lpId']),
    read(db, 'enrollments', ['status', 'kidId', 'studentId', 'childId', 'kidIds', 'parentId', 'parentIds', 'teacherId', 'teacherIds', 'lpId']),
    read(db, 'demoSessions', ['status', 'assignedTeacherId', 'completedByTeacherId', 'teacherConfirmedDate', 'assignedAt', 'completedAt', 'createdAt']),
    read(db, 'schools', ['status', 'learningPartnerId']),
  ]);

  const usersById = byId(users);
  const kidsById = byId(kids);
  const enrollmentsById = byId(enrollments);
  const userIds = new Set(users.map((x) => x.id));
  const teacherIds = new Set(teachers.map((x) => x.id));
  const kidIds = new Set(kids.map((x) => x.id));
  const parentIds = new Set(parents.map((x) => x.id));
  const lpIds = new Set(learningPartners.map((x) => x.id));
  const adminIds = new Set(admins.map((x) => x.id));

  const missingLearnerEnrollments = enrollments.filter((entry) =>
    learnerRefs(entry.data).some((id) => !kidIds.has(id)));
  const missingTeacherEnrollments = enrollments.filter((entry) => {
    const id = text(entry.data.teacherId);
    return Boolean(id && (!teacherIds.has(id) || !userIds.has(id)));
  });
  const missingTeacherKids = kids.filter((entry) => {
    const id = text(entry.data.teacherId);
    return Boolean(id && (!teacherIds.has(id) || !userIds.has(id)));
  });
  const missingTeacherDemos = demos.filter((entry) =>
    [text(entry.data.assignedTeacherId), text(entry.data.completedByTeacherId)]
      .filter(Boolean)
      .some((id) => !teacherIds.has(id) || !userIds.has(id)));
  const orphanLearningPartnerMirrors = learningPartners.filter((entry) => !userIds.has(entry.id));
  const adminUsersMissingMirror = users.filter((entry) => {
    const roles = new Set([normalizeRole(entry.data.role), ...list(entry.data.roles).map(normalizeRole)].filter(Boolean));
    return roles.has('admin') && !adminIds.has(entry.id);
  });

  const exceptionEnrollmentIds = [...new Set([
    ...missingLearnerEnrollments.map((x) => x.id),
    ...missingTeacherEnrollments.map((x) => x.id),
  ])];

  const sessionMap = new Map();
  for (const enrollmentId of exceptionEnrollmentIds) {
    sessionMap.set(enrollmentId, await sessionsForEnrollment(db, enrollmentId));
  }

  const enrollmentDrilldown = [];
  for (const enrollment of enrollments.filter((entry) => exceptionEnrollmentIds.includes(entry.id))) {
    const sessions = sessionMap.get(enrollment.id) || [];
    const sessionSummary = summarizeSessions(sessions, kidIds, teacherIds);
    const learner = learnerRefs(enrollment.data);
    const teacherId = text(enrollment.data.teacherId);
    const existingKid = learner.find((id) => kidIds.has(id));
    const kid = existingKid ? kidsById.get(existingKid) : null;
    const kidTeacherId = text(kid?.data?.teacherId);
    const kidTeacherResolved = Boolean(kidTeacherId && teacherIds.has(kidTeacherId) && userIds.has(kidTeacherId));

    enrollmentDrilldown.push({
      enrollmentToken: token(enrollment.id),
      status: text(enrollment.data.status).toLowerCase() || null,
      activeLike: isActiveLike(enrollment.data.status),
      learner: {
        refTokens: learner.map(token).sort(),
        resolvedRefs: learner.filter((id) => kidIds.has(id)).length,
        missingRefs: learner.filter((id) => !kidIds.has(id)).length,
        parentUserChildIdsContainsMissingRef: learner
          .filter((id) => !kidIds.has(id))
          .some((missingId) => {
            const parentId = text(enrollment.data.parentId);
            return list(usersById.get(parentId)?.data?.childIds).includes(missingId);
          }),
        disposition: chooseEnrollmentLearnerDisposition(enrollment, sessionSummary, kidIds),
      },
      teacher: {
        teacherToken: teacherId ? token(teacherId) : null,
        canonicalTeacherResolved: Boolean(teacherId && teacherIds.has(teacherId) && userIds.has(teacherId)),
        kidTeacherResolved,
        disposition: chooseEnrollmentTeacherDisposition(enrollment, sessionSummary, teacherIds, kidTeacherResolved),
      },
      sessions: sessionSummary,
    });
  }

  const kidDrilldown = missingTeacherKids.map((kid) => {
    const kidTeacherId = text(kid.data.teacherId);
    const relatedEnrollments = enrollments.filter((enrollment) => learnerRefs(enrollment.data).includes(kid.id));
    const activeRelated = relatedEnrollments.filter((enrollment) => isActiveLike(enrollment.data.status));
    const activeValidEnrollmentTeachers = activeRelated
      .map((enrollment) => text(enrollment.data.teacherId))
      .filter((id) => id && teacherIds.has(id) && userIds.has(id));

    return {
      kidToken: token(kid.id),
      status: text(kid.data.status).toLowerCase() || null,
      missingTeacherToken: kidTeacherId ? token(kidTeacherId) : null,
      relatedEnrollments: relatedEnrollments.length,
      activeRelatedEnrollments: activeRelated.length,
      activeRelatedEnrollmentWithValidTeacher: activeValidEnrollmentTeachers.length,
      disposition:
        activeValidEnrollmentTeachers.length > 0
          ? 'stale_kid_teacher_field_superseded_by_valid_active_enrollment'
          : activeRelated.length > 0
            ? 'current_review_active_kid_and_enrollment_teacher_unresolved'
            : 'historical_or_unassigned_kid_teacher_reference',
    };
  });

  const demoDrilldown = missingTeacherDemos.map((demo) => ({
    demoToken: token(demo.id),
    status: text(demo.data.status).toLowerCase() || null,
    confirmedDate: text(demo.data.teacherConfirmedDate) || null,
    confirmedDateBucket: dateBucket(text(demo.data.teacherConfirmedDate)),
    assignedAt: timestampIso(demo.data.assignedAt),
    completedAt: timestampIso(demo.data.completedAt),
    createdAt: timestampIso(demo.data.createdAt),
    assignedTeacherMissing: Boolean(text(demo.data.assignedTeacherId) && !teacherIds.has(text(demo.data.assignedTeacherId))),
    completedByTeacherMissing: Boolean(text(demo.data.completedByTeacherId) && !teacherIds.has(text(demo.data.completedByTeacherId))),
    disposition: demoDisposition(demo, teacherIds),
  }));

  const lpDrilldown = orphanLearningPartnerMirrors.map((lp) => {
    const refs = {
      kids: kids.filter((kid) => text(kid.data.lpId) === lp.id).length,
      enrollments: enrollments.filter((enrollment) => text(enrollment.data.lpId) === lp.id).length,
      schools: schools.filter((school) => text(school.data.learningPartnerId) === lp.id).length,
    };
    const totalRefs = refs.kids + refs.enrollments + refs.schools;
    return {
      learningPartnerToken: token(lp.id),
      status: text(lp.data.status).toLowerCase() || null,
      references: refs,
      totalReferences: totalRefs,
      disposition: totalRefs === 0 ? 'orphan_role_mirror_candidate_retire' : 'current_blocker_role_mirror_still_referenced',
    };
  });

  const adminDrilldown = adminUsersMissingMirror.map((user) => ({
    userToken: token(user.id),
    primaryRole: text(user.data.role) || null,
    roles: list(user.data.roles),
    status: text(user.data.status).toLowerCase() || null,
    adminMirrorPresent: false,
    repositoryUsageNote: 'admins mirror has no active application collection-reader usage; user/custom-claim role remains the current authorization path',
    disposition: 'role_mirror_consistency_gap_not_current_auth_blocker',
  }));

  const dispositions = {};
  const addDisposition = (value) => {
    dispositions[value] = (dispositions[value] || 0) + 1;
  };
  enrollmentDrilldown.forEach((entry) => {
    if (entry.learner.disposition !== 'resolved') addDisposition(entry.learner.disposition);
    if (entry.teacher.disposition !== 'resolved') addDisposition(entry.teacher.disposition);
  });
  kidDrilldown.forEach((entry) => addDisposition(entry.disposition));
  demoDrilldown.forEach((entry) => addDisposition(entry.disposition));
  lpDrilldown.forEach((entry) => addDisposition(entry.disposition));
  adminDrilldown.forEach((entry) => addDisposition(entry.disposition));

  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'read_only_identity_reference_exception_drilldown',
    privacy: {
      directContactFieldsRead: false,
      rawIdsInReport: false,
      tokens: 'sha256 prefixes only',
    },
    counts: {
      missingLearnerEnrollments: missingLearnerEnrollments.length,
      missingTeacherEnrollments: missingTeacherEnrollments.length,
      missingTeacherKids: missingTeacherKids.length,
      missingTeacherDemos: missingTeacherDemos.length,
      orphanLearningPartnerMirrors: orphanLearningPartnerMirrors.length,
      adminUsersMissingMirror: adminUsersMissingMirror.length,
    },
    dispositions: Object.fromEntries(Object.entries(dispositions).sort(([a], [b]) => a.localeCompare(b))),
    enrollmentDrilldown,
    kidDrilldown,
    demoDrilldown,
    learningPartnerDrilldown: lpDrilldown,
    adminDrilldown,
  };

  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log('=== Identity Exception Drilldown ===');
  console.log(JSON.stringify({ counts: report.counts, dispositions: report.dispositions }, null, 2));
  console.log('Read-only drilldown complete. No Firestore writes were performed.');
}

main().catch((error) => {
  console.error('Identity exception drilldown failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
