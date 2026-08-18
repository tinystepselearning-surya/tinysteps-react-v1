import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { normalizeSessionStatus } from './helpers/status';
import { classifyInvoiceCharges } from './helpers/serviceDate';
import { buildParentMonthlyBillingReadModel } from './parentMonthlyBillingReadModel';

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

function parentNameSortFromUser(
  parentId: string,
  data: Record<string, unknown> | null
): string {
  return (
    String(data?.displayName || data?.name || data?.email || parentId)
      .trim()
      .toLocaleLowerCase('en') || parentId.toLocaleLowerCase('en')
  );
}

function monthDateRangeFromKey(monthKey: string): { startYmd: string; endYmd: string } | null {
  const parts = String(monthKey || '').split('-');
  if (parts.length !== 2) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  const startYmd = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endYmd = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startYmd, endYmd };
}

function normalizeParentId(value: unknown): string {
  return String(value || '').trim();
}

function resolveMonthKey(data: Record<string, unknown> | null | undefined): string | null {
  if (!data) return null;
  const receiptMonthKey = String(data.receiptMonthKey || '').trim();
  if (/^\d{4}-\d{2}$/.test(receiptMonthKey)) return receiptMonthKey;
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

export function collectParentMonthlyBillingTargets(
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null
): ParentMonthTarget[] {
  const targets = new Map<string, ParentMonthTarget>();
  const addTarget = (target: ParentMonthTarget | null) => {
    if (!target) return;
    targets.set(`${target.parentId}__${target.monthKey}`, target);
  };
  const addAllocationTargets = (record: Record<string, unknown> | null) => {
    const parentId = normalizeParentId(record?.parentId);
    if (!parentId) return;
    const allocations = Array.isArray(record?.allocations) ? record.allocations : [];
    allocations.forEach((raw) => {
      if (!raw || typeof raw !== 'object') return;
      const row = raw as Record<string, unknown>;
      const monthKey =
        String(row.monthKey || row.chargeMonthKey || '').trim();
      if (!/^\d{4}-\d{2}$/.test(monthKey)) return;
      addTarget({ parentId, monthKey });
    });
  };

  addTarget(toTarget(beforeData));
  addTarget(toTarget(afterData));
  addAllocationTargets(beforeData);
  addAllocationTargets(afterData);
  return Array.from(targets.values());
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
  const monthRange = monthDateRangeFromKey(monthKey);
  const sessionsQuery = db.collection('classSessions').where('parentId', '==', parentId);
  let sessionsSnap;
  try {
    sessionsSnap = monthRange
      ? await sessionsQuery
          .where('date', '>=', monthRange.startYmd)
          .where('date', '<=', monthRange.endYmd)
          .get()
      : await sessionsQuery.get();
  } catch (err) {
    logger.warn('Bounded parent month attendance query failed, falling back to parent scan', {
      parentId,
      monthKey,
      error: err instanceof Error ? err.message : String(err || ''),
    });
    sessionsSnap = await sessionsQuery.get();
  }
  if (monthRange && sessionsSnap.empty) {
    sessionsSnap = await sessionsQuery.get();
  }

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
        refreshedAt: FieldValue.serverTimestamp(),
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

export async function recomputeParentMonthBillingReadModel(
  db: admin.firestore.Firestore,
  parentId: string,
  monthKey: string
): Promise<void> {
  const [chargesSnap, walletSnap, parentSnap] = await Promise.all([
    db.collection('billingCharges')
      .where('parentId', '==', parentId)
      .where('monthKey', '==', monthKey)
      .get(),
    db.collection('parentWallets').doc(parentId).get(),
    db.collection('users').doc(parentId).get(),
  ]);
  const chargeRows: Array<Record<string, unknown> & { id: string }> = chargesSnap.docs.filter((docSnap) => {
    const data = (docSnap.data() || {}) as Record<string, unknown>;
    return data.archived !== true;
  }).map((docSnap) => ({ id: docSnap.id, ...((docSnap.data() || {}) as Record<string, unknown>) }));
  const sessionIds = Array.from(new Set(chargeRows.map((charge) => String(charge.sessionId || '').trim()).filter(Boolean)));
  const sessionsById: Record<string, Record<string, unknown> | null> = {};
  if (sessionIds.length > 0) {
    const sessionSnaps = await db.getAll(...sessionIds.map((sessionId) => db.collection('classSessions').doc(sessionId)));
    sessionSnaps.forEach((sessionSnap) => {
      sessionsById[sessionSnap.id] = sessionSnap.exists
        ? ((sessionSnap.data() || {}) as Record<string, unknown>)
        : null;
    });
  }
  const integritySafeCharges = classifyInvoiceCharges({ charges: chargeRows, sessionsById, selectedMonth: monthKey })
    .filter((row) => row.integrity === 'VALID' && row.serviceMonthKey === monthKey)
    .map((row) => row.charge);
  const walletBalance = normalizeAmount((walletSnap.data() || {}).currentBalance);
  const parentData = (parentSnap.data() || {}) as Record<string, unknown>;
  const parentNameSort = parentNameSortFromUser(parentId, parentData);
  const billingModel = buildParentMonthlyBillingReadModel({
    parentId,
    monthKey,
    walletBalance,
    charges: integritySafeCharges,
  });

  const docRef = db
    .collection('parentMonthlyReadModels')
    .doc(parentId)
    .collection('months')
    .doc(monthKey);

  await docRef.set(
    {
      parentId,
      parentNameSort,
      monthKey,
      schemaVersion: billingModel.schemaVersion,
      modelType: billingModel.modelType,
      allocationAware: billingModel.allocationAware,
      computedFrom: billingModel.computedFrom,
      refreshedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      generatedAtMs: billingModel.generatedAtMs,
      billedAmount: billingModel.billedAmount,
      billedClassCount: billingModel.billedClassCount,
      settledAmount: billingModel.settledAmount,
      appliedAmount: billingModel.appliedAmount,
      outstandingAmount: billingModel.outstandingAmount,
      dueAmount: billingModel.dueAmount,
      status: billingModel.status,
      lastSettlementAtMs: billingModel.lastSettlementAtMs,
      lastPaymentAtMs: billingModel.lastPaymentAtMs,
      lastPaymentId: billingModel.lastPaymentId,
      allocationRefs: billingModel.allocationRefs,
      chargeIds: billingModel.chargeIds,
      totals: billingModel.totals,
      byKid: billingModel.byKid,
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
        refreshedAt: FieldValue.serverTimestamp(),
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
  const targets = collectParentMonthlyBillingTargets(beforeData, afterData);
  if (targets.length === 0) return;

  const db = admin.firestore();
  for (const target of targets) {
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

export const onParentUserReadModelWrite = onDocumentWritten(
  {
    document: 'users/{parentId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    const parentId = String(event.params.parentId || '').trim();
    if (!change || !parentId || !change.after.exists) return;

    const beforeData = change.before.exists
      ? (change.before.data() as Record<string, unknown>)
      : null;
    const afterData = change.after.data() as Record<string, unknown>;
    const roles = Array.isArray(afterData.roles)
      ? afterData.roles.map((role) => String(role || '').trim().toLowerCase())
      : [];
    const isParent =
      roles.includes('parent') ||
      String(afterData.role || '').trim().toLowerCase() === 'parent';
    if (!isParent) return;
    const beforeName = parentNameSortFromUser(parentId, beforeData);
    const afterName = parentNameSortFromUser(parentId, afterData);
    if (change.before.exists && beforeName === afterName) return;

    const db = admin.firestore();
    const monthsSnap = await db
      .collection('parentMonthlyReadModels')
      .doc(parentId)
      .collection('months')
      .get();
    for (let offset = 0; offset < monthsSnap.docs.length; offset += 450) {
      const batch = db.batch();
      monthsSnap.docs.slice(offset, offset + 450).forEach((monthDoc) => {
        batch.set(
          monthDoc.ref,
          { parentNameSort: afterName, updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
      });
      await batch.commit();
    }
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
