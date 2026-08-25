#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import {
  applicationDefault,
  deleteApp as deleteAdminApp,
  getApps as getAdminApps,
  initializeApp as initializeAdminApp,
} from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore, Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from 'firebase/app';
import { deleteUser, getAuth as getClientAuth, signInWithCustomToken } from 'firebase/auth';
import {
  doc as clientDoc,
  getFirestore as getClientFirestore,
  runTransaction as runClientTransaction,
} from 'firebase/firestore';

const PUBLIC_FIREBASE_API_KEY = 'AIzaSyBZ5h2M3hataZjWM7480e76QAiFmEVK37Y';
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

const SAFE_SESSION_STATUS = 'scheduled';

const normalize = (value) => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const normalizeList = (value) => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map(normalize).filter(Boolean)));
};

const normalizeStatus = (value) => normalize(value).toLowerCase();

const aliasesMatchCanonical = (row, canonical) => {
  const ids = normalizeList(row.teacherIds);
  if (ids.length > 0 && (ids.length !== 1 || ids[0] !== canonical)) return false;
  for (const field of ['assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id']) {
    const value = normalize(row[field]);
    if (value && value !== canonical) return false;
  }
  return true;
};

const canonicalAliasPatch = (teacherId) => ({
  teacherIds: [teacherId],
  assignedTeacherId: teacherId,
  primaryTeacherId: teacherId,
  teacherUid: teacherId,
  teacher_id: teacherId,
});

const readArg = (args, flag, fallback = '') => {
  const index = args.indexOf(flag);
  return index >= 0 ? String(args[index + 1] ?? '').trim() : fallback;
};

const parseCount = (raw, flag) => {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) throw new Error(`${flag} must be a non-negative integer`);
  return value;
};

const parseArgs = (args) => {
  const project = readArg(args, '--project');
  const rawLimit = Number(readArg(args, '--limit', '250'));
  const limit = Math.max(1, Math.min(500, Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 250));
  const startDate = readArg(args, '--start-date') || new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const expectedEnrollments = parseCount(
    readArg(args, '--expected-enrollments', '-1'),
    '--expected-enrollments',
  );
  const expectedSessions = parseCount(
    readArg(args, '--expected-sessions', '-1'),
    '--expected-sessions',
  );
  const apply = args.includes('--apply');
  return { project, limit, startDate, expectedEnrollments, expectedSessions, apply };
};

const loadOperationalScope = async (db, startDate, limit) => {
  const sessionQueryLimit = Math.max(1, Math.floor(limit / 2));
  const startAtBoundary = AdminTimestamp.fromDate(new Date(`${startDate}T00:00:00+05:30`));
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

  const sessionDocs = new Map();
  sessionsByDateSnap.docs.forEach((doc) => sessionDocs.set(doc.id, doc));
  sessionsByStartAtSnap.docs.forEach((doc) => sessionDocs.set(doc.id, doc));

  return {
    enrollments: enrollmentSnap.docs,
    classSessions: Array.from(sessionDocs.values()).slice(0, limit),
  };
};

const findTargets = ({ enrollments, classSessions }) => {
  const enrollmentTargets = enrollments.filter((doc) => {
    const row = doc.data() || {};
    const canonical = normalize(row.teacherId);
    return Boolean(canonical) && !aliasesMatchCanonical(row, canonical);
  });

  const unsafeSessionMismatches = [];
  const sessionTargets = [];
  classSessions.forEach((doc) => {
    const row = doc.data() || {};
    const canonical = normalize(row.teacherId);
    if (!canonical || aliasesMatchCanonical(row, canonical)) return;
    const status = normalizeStatus(row.status);
    if (status !== SAFE_SESSION_STATUS) {
      unsafeSessionMismatches.push({ id: doc.id, status });
      return;
    }
    sessionTargets.push(doc);
  });

  return { enrollmentTargets, sessionTargets, unsafeSessionMismatches };
};

const verifyCanonicalTeachers = async (db, targets) => {
  const ids = Array.from(new Set(targets.map((doc) => normalize((doc.data() || {}).teacherId)).filter(Boolean)));
  const refs = ids.map((id) => db.collection('users').doc(id));
  const snaps = refs.length > 0 ? await db.getAll(...refs) : [];
  snaps.forEach((snap, index) => {
    if (!snap.exists) throw new Error(`Canonical teacher user is missing for target teacher index ${index}`);
    const data = snap.data() || {};
    const role = normalizeStatus(data.role).replace(/[-_\s]/g, '');
    const roles = normalizeList(data.roles).map((value) => value.toLowerCase().replace(/[-_\s]/g, ''));
    if (role !== 'teacher' && !roles.includes('teacher')) {
      throw new Error(`Canonical teacher user does not have teacher role for target teacher index ${index}`);
    }
  });
};

const ensureExpectedTargets = (targets, expectedEnrollments, expectedSessions) => {
  if (targets.unsafeSessionMismatches.length > 0) {
    throw new Error(`Refusing repair: found ${targets.unsafeSessionMismatches.length} mismatched non-scheduled session(s)`);
  }
  if (targets.enrollmentTargets.length !== expectedEnrollments) {
    throw new Error(`Refusing repair: expected ${expectedEnrollments} enrollment mismatch(es), found ${targets.enrollmentTargets.length}`);
  }
  if (targets.sessionTargets.length !== expectedSessions) {
    throw new Error(`Refusing repair: expected ${expectedSessions} scheduled-session mismatch(es), found ${targets.sessionTargets.length}`);
  }
};

const toRepairDescriptors = (targets) => [
  ...targets.enrollmentTargets.map((doc) => ({ kind: 'enrollment', collection: 'enrollments', id: doc.id })),
  ...targets.sessionTargets.map((doc) => ({ kind: 'session', collection: 'classSessions', id: doc.id })),
];

const assertTransactionRowStillSafe = (target, row, startDate) => {
  const canonical = normalize(row.teacherId);
  if (!canonical) throw new Error('Repair target lost canonical teacherId before transaction commit');
  if (aliasesMatchCanonical(row, canonical)) {
    throw new Error('Repair target changed before transaction commit; refusing stale write');
  }

  if (target.kind === 'enrollment') {
    if (!ACTIVE_ENROLLMENT_STATUSES.includes(normalizeStatus(row.status))) {
      throw new Error('Enrollment left operational status before transaction commit');
    }
    return canonical;
  }

  if (normalizeStatus(row.status) !== SAFE_SESSION_STATUS) {
    throw new Error('Session left scheduled status before transaction commit');
  }
  const date = normalize(row.date);
  const startAt = row.startAt?.toDate?.();
  const futureByDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= startDate;
  const futureByStartAt = startAt instanceof Date && startAt >= new Date(`${startDate}T00:00:00+05:30`);
  if (!futureByDate && !futureByStartAt) {
    throw new Error('Session left current/future operational window before transaction commit');
  }
  return canonical;
};

const runRulesAuthenticatedRepairTransaction = async (project, targets, startDate) => {
  const adminAuth = getAdminAuth();
  const maintenanceUid = `b3-alias-repair-${Date.now()}-${randomUUID().replace(/-/g, '').slice(0, 10)}`;
  const customToken = await adminAuth.createCustomToken(maintenanceUid, {
    role: 'admin',
    tinyStepsMaintenance: 'teacher-identity-b3',
  });

  const clientApp = initializeClientApp({
    apiKey: PUBLIC_FIREBASE_API_KEY,
    authDomain: `${project}.firebaseapp.com`,
    projectId: project,
  }, `teacher-identity-b3-${Date.now()}`);
  const clientAuth = getClientAuth(clientApp);
  let clientUser = null;

  try {
    const credential = await signInWithCustomToken(clientAuth, customToken);
    clientUser = credential.user;
    const clientDb = getClientFirestore(clientApp);
    const descriptors = toRepairDescriptors(targets);

    await runClientTransaction(clientDb, async (tx) => {
      const refs = descriptors.map((target) => clientDoc(clientDb, target.collection, target.id));
      const snapshots = await Promise.all(refs.map((ref) => tx.get(ref)));
      const canonicals = snapshots.map((snap, index) => {
        if (!snap.exists()) throw new Error('Repair target disappeared before transaction commit');
        return assertTransactionRowStillSafe(descriptors[index], snap.data() || {}, startDate);
      });

      refs.forEach((ref, index) => {
        tx.update(ref, canonicalAliasPatch(canonicals[index]));
      });
    });
  } finally {
    if (clientUser) {
      try {
        await deleteUser(clientUser);
      } catch (clientDeleteError) {
        try {
          await adminAuth.deleteUser(maintenanceUid);
        } catch (adminDeleteError) {
          throw new Error(
            `Repair authentication cleanup failed: client=${clientDeleteError instanceof Error ? clientDeleteError.message : String(clientDeleteError)}; admin=${adminDeleteError instanceof Error ? adminDeleteError.message : String(adminDeleteError)}`,
          );
        }
      }
    }
    await deleteClientApp(clientApp);
  }
};

const verifyPostRepair = async (db, originalTargets, startDate, limit) => {
  const refs = [
    ...originalTargets.enrollmentTargets.map((doc) => doc.ref),
    ...originalTargets.sessionTargets.map((doc) => doc.ref),
  ];
  const snapshots = refs.length > 0 ? await db.getAll(...refs) : [];
  snapshots.forEach((snap) => {
    if (!snap.exists) throw new Error('Post-repair verification target is missing');
    const row = snap.data() || {};
    const canonical = normalize(row.teacherId);
    if (!canonical || !aliasesMatchCanonical(row, canonical)) {
      throw new Error('Post-repair verification found a target with inconsistent aliases');
    }
  });

  const scope = await loadOperationalScope(db, startDate, limit);
  const remaining = findTargets(scope);
  if (remaining.enrollmentTargets.length !== 0 || remaining.sessionTargets.length !== 0 || remaining.unsafeSessionMismatches.length !== 0) {
    throw new Error(
      `Post-repair operational audit still has mismatches: enrollments=${remaining.enrollmentTargets.length}, scheduledSessions=${remaining.sessionTargets.length}, unsafeSessions=${remaining.unsafeSessionMismatches.length}`,
    );
  }
};

const main = async () => {
  const {
    project,
    limit,
    startDate,
    expectedEnrollments,
    expectedSessions,
    apply,
  } = parseArgs(process.argv.slice(2));

  if (!project) throw new Error('--project is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw new Error('--start-date must use YYYY-MM-DD');
  }

  if (!getAdminApps().length) {
    initializeAdminApp({ credential: applicationDefault(), projectId: project });
  }
  const db = getAdminFirestore();
  const scope = await loadOperationalScope(db, startDate, limit);
  const targets = findTargets(scope);
  ensureExpectedTargets(targets, expectedEnrollments, expectedSessions);
  await verifyCanonicalTeachers(db, [
    ...targets.enrollmentTargets,
    ...targets.sessionTargets,
  ]);

  console.log(JSON.stringify({
    mode: apply ? 'APPLY' : 'DRY_RUN',
    project,
    startDate,
    scanned: {
      enrollments: scope.enrollments.length,
      classSessions: scope.classSessions.length,
    },
    repairTargets: {
      enrollments: targets.enrollmentTargets.length,
      scheduledSessions: targets.sessionTargets.length,
    },
    safety: {
      canonicalTeacherUsersVerified: true,
      nonScheduledSessionMismatches: targets.unsafeSessionMismatches.length,
      canonicalTeacherIdWillNotChange: true,
      noAttendanceBillingSchedulingFieldsWillChange: true,
      writeAuthorization: 'firebase-security-rules-admin-token',
      permanentIamExpansionRequired: false,
    },
  }, null, 2));

  if (!apply) return;

  await runRulesAuthenticatedRepairTransaction(project, targets, startDate);
  await verifyPostRepair(db, targets, startDate, limit);

  console.log(JSON.stringify({
    mode: 'APPLY_COMPLETE',
    repaired: {
      enrollments: targets.enrollmentTargets.length,
      scheduledSessions: targets.sessionTargets.length,
    },
    postRepairOperationalAliasMismatches: 0,
    temporaryAuthUserDeleted: true,
  }, null, 2));

  for (const app of getAdminApps()) {
    await deleteAdminApp(app);
  }
};

main().catch((error) => {
  console.error(`Teacher identity alias repair failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
