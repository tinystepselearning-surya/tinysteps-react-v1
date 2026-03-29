import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { normalizeFinancialStatus, normalizeSessionStatus } from './helpers/status';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof (value as any)?.toDate === 'function') {
    const parsed = (value as any).toDate();
    return parsed instanceof Date && !isNaN(parsed.getTime()) ? parsed : null;
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function monthKeyFromDateIST(value: unknown): string | null {
  const base = toDate(value);
  if (!base) return null;
  const istMs = base.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function normalizeParentId(value: unknown): string {
  return String(value || '').trim();
}

function resolveMonthKey(data: Record<string, unknown> | null | undefined): string | null {
  if (!data) return null;
  const rawMonth = String(data.monthKey || '').trim();
  if (/^\d{4}-\d{2}$/.test(rawMonth)) return rawMonth;
  return monthKeyFromDateIST(
    data.paidAt || data.createdAt || data.updatedAt || data.date || null
  );
}

type ParentMonthTarget = { parentId: string; monthKey: string };

function toTarget(data: Record<string, unknown> | null | undefined): ParentMonthTarget | null {
  const parentId = normalizeParentId(data?.parentId);
  const monthKey = resolveMonthKey(data);
  if (!parentId || !monthKey) return null;
  return { parentId, monthKey };
}

function sanitizeKidId(value: unknown): string {
  const id = String(value || '').trim();
  return id || '_unassigned';
}

function normalizeAmount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeAttendanceStatus(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function normalizeCourseId(value: unknown): string {
  return String(value || '').trim();
}

function normalizeMastery(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function hasProgressSignal(progress: Record<string, unknown>): boolean {
  return Boolean(
    normalizeMastery(progress.mastery) ||
      String(progress.teacherRemark || '').trim() ||
      String(progress.lastSessionId || '').trim() ||
      String(progress.source || '').trim() ||
      progress.updatedAt ||
      progress.createdAt,
  );
}

function isCompletedProgress(progress: Record<string, unknown>): boolean {
  const mastery = normalizeMastery(progress.mastery);
  if (mastery === 'mastered' || mastery === 'proficient') return true;
  const status = normalizeSessionStatus(progress.status);
  return status === 'completed';
}

function collectParentIds(record: Record<string, unknown> | null | undefined): string[] {
  const parentIds = new Set<string>();
  if (!record) return [];
  const push = (value: unknown) => {
    const normalized = normalizeParentId(value);
    if (normalized) parentIds.add(normalized);
  };
  push(record.parentId);
  push(record.primaryParentId);
  if (Array.isArray(record.parentIds)) {
    record.parentIds.forEach((value) => push(value));
  }
  return Array.from(parentIds);
}

function resolveSessionKidIds(session: Record<string, unknown>): string[] {
  const ids = new Set<string>();
  const directKidId = String(session.kidId || session.studentId || '').trim();
  if (directKidId) ids.add(directKidId);
  if (Array.isArray(session.kidIds)) {
    session.kidIds.forEach((raw) => {
      const normalized = String(raw || '').trim();
      if (normalized) ids.add(normalized);
    });
  }
  if (ids.size === 0) ids.add('_unassigned');
  return Array.from(ids);
}

function resolveKidAttendanceStatus(session: Record<string, unknown>, kidId: string): string {
  const attendanceRaw = session.attendance;
  if (!attendanceRaw || typeof attendanceRaw !== 'object') return '';
  const attendanceMap = attendanceRaw as Record<string, unknown>;
  const entry = attendanceMap[kidId];
  if (!entry) return '';
  if (typeof entry === 'string') return normalizeAttendanceStatus(entry);
  if (typeof entry === 'object' && entry !== null) {
    return normalizeAttendanceStatus((entry as Record<string, unknown>).status);
  }
  return '';
}

async function recomputeParentMonthAttendanceReadModel(
  db: admin.firestore.Firestore,
  parentId: string,
  monthKey: string
): Promise<void> {
  const sessionsSnap = await db
    .collection('classSessions')
    .where('parentId', '==', parentId)
    .get();

  const nowMs = Date.now();
  const totals = {
    total: 0,
    completed: 0,
    in_progress: 0,
    scheduled: 0,
    cancelled: 0,
    no_show: 0,
    reschedule_requested: 0,
    other: 0,
    upcoming: 0,
    present: 0,
    late: 0,
    absent: 0,
  };

  const byKid = new Map<string, Record<string, number | string>>();

  const getKidBucket = (kidId: string): Record<string, number | string> => {
    const key = sanitizeKidId(kidId);
    const existing = byKid.get(key);
    if (existing) return existing;
    const next: Record<string, number | string> = {
      kidId: key,
      total: 0,
      completed: 0,
      in_progress: 0,
      scheduled: 0,
      cancelled: 0,
      no_show: 0,
      reschedule_requested: 0,
      other: 0,
      upcoming: 0,
      present: 0,
      late: 0,
      absent: 0,
      attendanceMarked: 0,
      attendancePct: 0,
    };
    byKid.set(key, next);
    return next;
  };

  sessionsSnap.docs.forEach((docSnap) => {
    const session = (docSnap.data() || {}) as Record<string, unknown>;
    if (resolveMonthKey(session) !== monthKey) return;

    const status = normalizeSessionStatus(session.status);
    const startMs = toDate(session.startAt || session.date || session.updatedAt || session.createdAt)?.getTime() || 0;
    const kidIds = resolveSessionKidIds(session);

    kidIds.forEach((kidId) => {
      const bucket = getKidBucket(kidId);
      const increment = (field: keyof typeof totals) => {
        totals[field] += 1;
        bucket[field] = Number(bucket[field] || 0) + 1;
      };

      increment('total');
      if (status in totals) {
        increment(status as keyof typeof totals);
      } else {
        increment('other');
      }

      if ((status === 'scheduled' || status === 'in_progress') && startMs > 0 && startMs >= nowMs) {
        increment('upcoming');
      }

      if (status !== 'completed') return;
      const attendanceStatus = resolveKidAttendanceStatus(session, kidId);
      if (attendanceStatus === 'present') increment('present');
      else if (attendanceStatus === 'late') increment('late');
      else if (attendanceStatus === 'absent' || attendanceStatus === 'no_show') increment('absent');

      if (attendanceStatus === 'present' || attendanceStatus === 'late' || attendanceStatus === 'absent' || attendanceStatus === 'no_show') {
        bucket.attendanceMarked = Number(bucket.attendanceMarked || 0) + 1;
      }
    });
  });

  const byKidObject: Record<string, Record<string, number | string>> = {};
  for (const [kidId, bucket] of byKid.entries()) {
    const attendanceMarked = Number(bucket.attendanceMarked || 0);
    const presentLike = Number(bucket.present || 0) + Number(bucket.late || 0);
    const attendancePct = attendanceMarked > 0 ? Math.round((presentLike / attendanceMarked) * 100) : 0;
    byKidObject[kidId] = {
      ...bucket,
      attendancePct,
    };
  }

  const totalsAttendanceMarked = totals.present + totals.late + totals.absent;
  const totalsAttendancePct =
    totalsAttendanceMarked > 0 ? Math.round(((totals.present + totals.late) / totalsAttendanceMarked) * 100) : 0;

  const docRef = db
    .collection('parentMonthlyReadModels')
    .doc(parentId)
    .collection('months')
    .doc(monthKey);

  await docRef.set(
    {
      parentId,
      monthKey,
      attendance: {
        schemaVersion: 1,
        modelType: 'attendance_v1',
        refreshedAt: admin.firestore.FieldValue.serverTimestamp(),
        generatedAtMs: Date.now(),
        totals: {
          ...totals,
          attendanceMarked: totalsAttendanceMarked,
          attendancePct: totalsAttendancePct,
        },
        byKid: byKidObject,
      },
    },
    { merge: true }
  );
}

function resolveChargePaidAmount(charge: Record<string, unknown>, amount: number): number {
  const paidRaw = normalizeAmount(charge.paidAmount);
  if (paidRaw > 0) return Math.min(Math.max(paidRaw, 0), Math.max(amount, 0));
  const status = normalizeFinancialStatus(charge.status);
  if (status === 'paid') return Math.max(amount, 0);
  return 0;
}

async function recomputeParentMonthBillingReadModel(
  db: admin.firestore.Firestore,
  parentId: string,
  monthKey: string
): Promise<void> {
  const [chargesSnap, paymentsSnap] = await Promise.all([
    db.collection('billingCharges')
      .where('parentId', '==', parentId)
      .where('monthKey', '==', monthKey)
      .get(),
    db.collection('payments')
      .where('parentId', '==', parentId)
      .where('monthKey', '==', monthKey)
      .get(),
  ]);

  const totals = {
    chargesCount: 0,
    billedAmount: 0,
    paidAmountFromCharges: 0,
    dueAmount: 0,
    paymentsCount: 0,
    paymentsTotal: 0,
    paymentsApplied: 0,
    paymentsUnapplied: 0,
  };

  const byKid = new Map<string, {
    kidId: string;
    chargesCount: number;
    billedAmount: number;
    paidAmountFromCharges: number;
    dueAmount: number;
    paymentsCount: number;
    paymentsTotal: number;
    paymentsApplied: number;
    paymentsUnapplied: number;
    lastPaymentAtMs: number | null;
  }>();

  const getKidBucket = (kidId: string) => {
    const key = sanitizeKidId(kidId);
    let bucket = byKid.get(key);
    if (!bucket) {
      bucket = {
        kidId: key,
        chargesCount: 0,
        billedAmount: 0,
        paidAmountFromCharges: 0,
        dueAmount: 0,
        paymentsCount: 0,
        paymentsTotal: 0,
        paymentsApplied: 0,
        paymentsUnapplied: 0,
        lastPaymentAtMs: null,
      };
      byKid.set(key, bucket);
    }
    return bucket;
  };

  chargesSnap.docs.forEach((docSnap) => {
    const charge = (docSnap.data() || {}) as Record<string, unknown>;
    const status = normalizeFinancialStatus(charge.status);
    if (status === 'void') return;
    const amount = Math.max(normalizeAmount(charge.amount), 0);
    if (amount <= 0) return;
    const paidAmount = resolveChargePaidAmount(charge, amount);
    const dueAmount = Math.max(amount - paidAmount, 0);
    const kidId = sanitizeKidId(charge.kidId);
    const bucket = getKidBucket(kidId);

    totals.chargesCount += 1;
    totals.billedAmount += amount;
    totals.paidAmountFromCharges += paidAmount;
    totals.dueAmount += dueAmount;

    bucket.chargesCount += 1;
    bucket.billedAmount += amount;
    bucket.paidAmountFromCharges += paidAmount;
    bucket.dueAmount += dueAmount;
  });

  paymentsSnap.docs.forEach((docSnap) => {
    const payment = (docSnap.data() || {}) as Record<string, unknown>;
    const amount = normalizeAmount(payment.amount);
    const appliedRaw = normalizeAmount(payment.appliedAmount);
    const unappliedRaw = normalizeAmount(payment.unappliedAmount);
    const applied =
      Number.isFinite(Number(payment.appliedAmount)) ? appliedRaw : amount - unappliedRaw;
    const unapplied =
      Number.isFinite(Number(payment.unappliedAmount)) ? unappliedRaw : amount - applied;
    const paidAtMs = toDate(payment.paidAt || payment.createdAt)?.getTime() || null;
    const kidId = sanitizeKidId(payment.kidId);
    const bucket = getKidBucket(kidId);

    totals.paymentsCount += 1;
    totals.paymentsTotal += amount;
    totals.paymentsApplied += applied;
    totals.paymentsUnapplied += unapplied;

    bucket.paymentsCount += 1;
    bucket.paymentsTotal += amount;
    bucket.paymentsApplied += applied;
    bucket.paymentsUnapplied += unapplied;
    if (paidAtMs && (!bucket.lastPaymentAtMs || paidAtMs > bucket.lastPaymentAtMs)) {
      bucket.lastPaymentAtMs = paidAtMs;
    }
  });

  const byKidObject: Record<string, Record<string, unknown>> = {};
  for (const [kidId, bucket] of byKid.entries()) {
    byKidObject[kidId] = {
      ...bucket,
      // Keep client payload compact but deterministic.
      billedAmount: Math.round(bucket.billedAmount),
      paidAmountFromCharges: Math.round(bucket.paidAmountFromCharges),
      dueAmount: Math.round(bucket.dueAmount),
      paymentsTotal: Math.round(bucket.paymentsTotal),
      paymentsApplied: Math.round(bucket.paymentsApplied),
      paymentsUnapplied: Math.round(bucket.paymentsUnapplied),
    };
  }

  const docRef = db
    .collection('parentMonthlyReadModels')
    .doc(parentId)
    .collection('months')
    .doc(monthKey);

  await docRef.set(
    {
      parentId,
      monthKey,
      schemaVersion: 1,
      modelType: 'billing_v1',
      refreshedAt: admin.firestore.FieldValue.serverTimestamp(),
      generatedAtMs: Date.now(),
      totals: {
        chargesCount: totals.chargesCount,
        billedAmount: Math.round(totals.billedAmount),
        paidAmountFromCharges: Math.round(totals.paidAmountFromCharges),
        dueAmount: Math.round(totals.dueAmount),
        paymentsCount: totals.paymentsCount,
        paymentsTotal: Math.round(totals.paymentsTotal),
        paymentsApplied: Math.round(totals.paymentsApplied),
        paymentsUnapplied: Math.round(totals.paymentsUnapplied),
      },
      byKid: byKidObject,
    },
    { merge: true }
  );
}

async function resolveProgressProjectionTarget(
  db: admin.firestore.Firestore,
  studentRefId: string,
): Promise<{ kidId: string; parentIds: string[] } | null> {
  const fallbackKidId = sanitizeKidId(studentRefId);
  const directKidSnap = await db.collection('kids').doc(studentRefId).get();
  if (directKidSnap.exists) {
    const directKidData = (directKidSnap.data() || {}) as Record<string, unknown>;
    const parentIds = collectParentIds(directKidData);
    if (parentIds.length > 0) {
      return { kidId: fallbackKidId, parentIds };
    }
  }

  const studentSnap = await db.collection('students').doc(studentRefId).get();
  const studentData = studentSnap.exists ? ((studentSnap.data() || {}) as Record<string, unknown>) : null;
  const canonicalKidId = sanitizeKidId(studentData?.kidId || studentRefId);
  const fromStudent = collectParentIds(studentData);
  if (fromStudent.length > 0) {
    return { kidId: canonicalKidId, parentIds: fromStudent };
  }

  if (canonicalKidId !== fallbackKidId) {
    const canonicalKidSnap = await db.collection('kids').doc(canonicalKidId).get();
    if (canonicalKidSnap.exists) {
      const canonicalKidData = (canonicalKidSnap.data() || {}) as Record<string, unknown>;
      const parentIds = collectParentIds(canonicalKidData);
      if (parentIds.length > 0) {
        return { kidId: canonicalKidId, parentIds };
      }
    }
  }

  return null;
}

async function recomputeParentMonthProgressReadModelForKid(
  db: admin.firestore.Firestore,
  parentId: string,
  monthKey: string,
  studentRefId: string,
  projectionKidId: string,
): Promise<void> {
  const [progressSnap, topicsSnap] = await Promise.all([
    db.collection('students').doc(studentRefId).collection('progress').get(),
    db.collection('config').doc('curriculumTopics').get(),
  ]);

  const topicCourseById = new Map<string, string>();
  const totalTopicsByCourse = new Map<string, number>();
  if (topicsSnap.exists) {
    const topicData = (topicsSnap.data() || {}) as Record<string, unknown>;
    const topics = Array.isArray(topicData.topics) ? topicData.topics : [];
    topics.forEach((rawTopic) => {
      if (!rawTopic || typeof rawTopic !== 'object') return;
      const topic = rawTopic as Record<string, unknown>;
      const topicId = String(topic.id || '').trim();
      const courseId = normalizeCourseId(topic.courseId || topic.course);
      if (!topicId || !courseId) return;
      topicCourseById.set(topicId, courseId);
      totalTopicsByCourse.set(courseId, (totalTopicsByCourse.get(courseId) || 0) + 1);
    });
  }

  const byCourse = new Map<
    string,
    { courseId: string; totalTopics: number; completedTopics: number; inProgressTopics: number; lastUpdatedAtMs: number | null }
  >();
  const seenTopicsByCourse = new Map<string, Set<string>>();

  const getCourseBucket = (courseId: string) => {
    let bucket = byCourse.get(courseId);
    if (!bucket) {
      bucket = {
        courseId,
        totalTopics: totalTopicsByCourse.get(courseId) || 0,
        completedTopics: 0,
        inProgressTopics: 0,
        lastUpdatedAtMs: null,
      };
      byCourse.set(courseId, bucket);
    }
    return bucket;
  };

  progressSnap.docs.forEach((docSnap) => {
    const progress = (docSnap.data() || {}) as Record<string, unknown>;
    const topicId = String(progress.topicId || docSnap.id || '').trim();
    const courseId = normalizeCourseId(progress.courseId || topicCourseById.get(topicId));
    if (!courseId) return;

    const bucket = getCourseBucket(courseId);
    const seen = seenTopicsByCourse.get(courseId) || new Set<string>();
    const stableTopicId = topicId || docSnap.id;
    if (stableTopicId) seen.add(stableTopicId);
    seenTopicsByCourse.set(courseId, seen);

    const completed = isCompletedProgress(progress);
    const inProgress = !completed && hasProgressSignal(progress);
    if (completed) bucket.completedTopics += 1;
    if (inProgress) bucket.inProgressTopics += 1;

    const updatedAtMs =
      toDate(progress.updatedAt || progress.createdAt || progress.lastUpdatedAt || null)?.getTime() || null;
    if (updatedAtMs && (!bucket.lastUpdatedAtMs || updatedAtMs > bucket.lastUpdatedAtMs)) {
      bucket.lastUpdatedAtMs = updatedAtMs;
    }
  });

  totalTopicsByCourse.forEach((total, courseId) => {
    const bucket = getCourseBucket(courseId);
    bucket.totalTopics = Math.max(bucket.totalTopics, total);
  });
  seenTopicsByCourse.forEach((topicIds, courseId) => {
    const bucket = getCourseBucket(courseId);
    bucket.totalTopics = Math.max(bucket.totalTopics, topicIds.size);
  });

  const byCourseObject: Record<string, Record<string, unknown>> = {};
  let totalsCompleted = 0;
  let totalsInProgress = 0;
  let totalsTopics = 0;
  let latestUpdatedAtMs: number | null = null;

  Array.from(byCourse.values())
    .sort((a, b) => a.courseId.localeCompare(b.courseId))
    .forEach((bucket) => {
      const totalTopics = Math.max(bucket.totalTopics, bucket.completedTopics, bucket.inProgressTopics, 0);
      const completedTopics = Math.min(Math.max(bucket.completedTopics, 0), totalTopics);
      const inProgressTopics = Math.max(Math.min(bucket.inProgressTopics, totalTopics - completedTopics), 0);
      const overallPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      byCourseObject[bucket.courseId] = {
        courseId: bucket.courseId,
        totalTopics,
        completedTopics,
        inProgressTopics,
        overallPct,
        lastUpdatedAtMs: bucket.lastUpdatedAtMs || null,
      };

      totalsTopics += totalTopics;
      totalsCompleted += completedTopics;
      totalsInProgress += inProgressTopics;
      if (bucket.lastUpdatedAtMs && (!latestUpdatedAtMs || bucket.lastUpdatedAtMs > latestUpdatedAtMs)) {
        latestUpdatedAtMs = bucket.lastUpdatedAtMs;
      }
    });

  const totalsOverallPct = totalsTopics > 0 ? Math.round((totalsCompleted / totalsTopics) * 100) : 0;
  const docRef = db.collection('parentMonthlyReadModels').doc(parentId).collection('months').doc(monthKey);
  await docRef.set(
    {
      parentId,
      monthKey,
      progress: {
        schemaVersion: 1,
        modelType: 'progress_v1',
        refreshedAt: admin.firestore.FieldValue.serverTimestamp(),
        generatedAtMs: Date.now(),
        byKid: {
          [projectionKidId]: {
            kidId: projectionKidId,
            byCourse: byCourseObject,
            totals: {
              totalTopics: totalsTopics,
              completedTopics: totalsCompleted,
              inProgressTopics: totalsInProgress,
              overallPct: totalsOverallPct,
            },
            lastUpdatedAtMs: latestUpdatedAtMs,
          },
        },
      },
    },
    { merge: true },
  );
}

async function handleParentMonthProjectionUpdate(
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
  source: string
): Promise<void> {
  const targets = new Map<string, ParentMonthTarget>();
  const beforeTarget = toTarget(beforeData);
  const afterTarget = toTarget(afterData);
  if (beforeTarget) {
    targets.set(`${beforeTarget.parentId}__${beforeTarget.monthKey}`, beforeTarget);
  }
  if (afterTarget) {
    targets.set(`${afterTarget.parentId}__${afterTarget.monthKey}`, afterTarget);
  }
  if (targets.size === 0) return;

  const db = admin.firestore();
  for (const target of targets.values()) {
    await recomputeParentMonthBillingReadModel(db, target.parentId, target.monthKey);
    logger.debug('Refreshed parent monthly billing read model', {
      source,
      parentId: target.parentId,
      monthKey: target.monthKey,
    });
  }
}

async function handleParentMonthAttendanceProjectionUpdate(
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
  source: string
): Promise<void> {
  const targets = new Map<string, ParentMonthTarget>();
  const beforeTarget = toTarget(beforeData);
  const afterTarget = toTarget(afterData);
  if (beforeTarget) {
    targets.set(`${beforeTarget.parentId}__${beforeTarget.monthKey}`, beforeTarget);
  }
  if (afterTarget) {
    targets.set(`${afterTarget.parentId}__${afterTarget.monthKey}`, afterTarget);
  }
  if (targets.size === 0) return;

  const db = admin.firestore();
  for (const target of targets.values()) {
    await recomputeParentMonthAttendanceReadModel(db, target.parentId, target.monthKey);
    logger.debug('Refreshed parent monthly attendance read model', {
      source,
      parentId: target.parentId,
      monthKey: target.monthKey,
    });
  }
}

export const onBillingChargeReadModelWrite = onDocumentWritten(
  {
    document: 'billingCharges/{chargeId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (!change) return;
    const beforeData = change.before.exists ? (change.before.data() as Record<string, unknown>) : null;
    const afterData = change.after.exists ? (change.after.data() as Record<string, unknown>) : null;
    await handleParentMonthProjectionUpdate(beforeData, afterData, 'billingCharges');
  }
);

export const onPaymentReadModelWrite = onDocumentWritten(
  {
    document: 'payments/{paymentId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (!change) return;
    const beforeData = change.before.exists ? (change.before.data() as Record<string, unknown>) : null;
    const afterData = change.after.exists ? (change.after.data() as Record<string, unknown>) : null;
    await handleParentMonthProjectionUpdate(beforeData, afterData, 'payments');
  }
);

export const onClassSessionReadModelWrite = onDocumentWritten(
  {
    document: 'classSessions/{sessionId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (!change) return;
    const beforeData = change.before.exists ? (change.before.data() as Record<string, unknown>) : null;
    const afterData = change.after.exists ? (change.after.data() as Record<string, unknown>) : null;
    await handleParentMonthAttendanceProjectionUpdate(beforeData, afterData, 'classSessions');
  }
);

export const onStudentProgressReadModelWrite = onDocumentWritten(
  {
    document: 'students/{studentRefId}/progress/{topicId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (!change) return;

    const studentRefId = String(event.params.studentRefId || '').trim();
    if (!studentRefId) return;

    const beforeData = change.before.exists ? (change.before.data() as Record<string, unknown>) : null;
    const afterData = change.after.exists ? (change.after.data() as Record<string, unknown>) : null;
    const monthKey =
      resolveMonthKey(afterData) ||
      resolveMonthKey(beforeData) ||
      monthKeyFromDateIST(new Date());
    if (!monthKey) return;

    const db = admin.firestore();
    const projectionTarget = await resolveProgressProjectionTarget(db, studentRefId);
    if (!projectionTarget || projectionTarget.parentIds.length === 0) {
      logger.warn('Skipped parent progress read model refresh: parent linkage unresolved', {
        studentRefId,
        monthKey,
      });
      return;
    }

    for (const parentId of projectionTarget.parentIds) {
      await recomputeParentMonthProgressReadModelForKid(
        db,
        parentId,
        monthKey,
        studentRefId,
        projectionTarget.kidId,
      );
      logger.debug('Refreshed parent monthly progress read model', {
        studentRefId,
        projectionKidId: projectionTarget.kidId,
        parentId,
        monthKey,
      });
    }
  },
);
