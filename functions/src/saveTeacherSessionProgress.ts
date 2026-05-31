import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const ATTENDANCE_OPEN_DELAY_MS = 30 * 60 * 1000;
const ATTENDANCE_CLOSE_WINDOW_MS = 24 * 60 * 60 * 1000;
const CALLABLE_CORS_ORIGINS: Array<string | RegExp> = [
  'http://localhost:5173',
  /https:\/\/([a-z0-9-]+\.)?tinysteps\.com$/,
  /https:\/\/([a-z0-9-]+\.)?tinysteps\.in$/,
  'https://tinysteps-react-v1.web.app',
  'https://tinysteps-react-v1.firebaseapp.com',
];

type AttendanceStatus = 'present' | 'absent' | 'late' | 'reschedule_requested';
type AdminAttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'reschedule_requested'
  | 'rescheduled'
  | 'cancelled'
  | 'no_show';

interface TopicUpdateInput {
  topicId?: unknown;
  mastery?: unknown;
  teacherRemark?: unknown;
  topicName?: unknown;
}

interface AttendanceEntryInput {
  status?: unknown;
  notes?: unknown;
  mastery?: unknown;
  topics?: unknown;
  topicUpdates?: unknown;
}

interface SaveTeacherSessionProgressRequest {
  sessionId?: unknown;
  attendance?: unknown;
  sessionNotes?: unknown;
  meta?: {
    courseId?: unknown;
    courseLabel?: unknown;
    attendanceOnly?: unknown;
  };
}

interface AdminAttendanceCorrectionRequest {
  sessionId?: unknown;
  kidId?: unknown;
  newStatus?: unknown;
  reason?: unknown;
}

function normalizeRole(value: unknown): string {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'learningpartner') return 'learning-partner';
  return raw;
}

function normalizeAttendanceStatus(value: unknown): AttendanceStatus | null {
  const raw = String(value || '').trim().toLowerCase();
  if (
    raw === 'present' ||
    raw === 'absent' ||
    raw === 'late' ||
    raw === 'reschedule_requested'
  ) {
    return raw;
  }
  return null;
}

function normalizeAdminAttendanceStatus(value: unknown): AdminAttendanceStatus | null {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (raw === 'present') return 'present';
  if (raw === 'absent') return 'absent';
  if (raw === 'late') return 'late';
  if (raw === 'reschedule_requested' || raw === 'reschedule-requested') return 'reschedule_requested';
  if (raw === 'rescheduled' || raw === 'reschedule') return 'rescheduled';
  if (raw === 'cancelled' || raw === 'canceled') return 'cancelled';
  if (raw === 'no_show' || raw === 'noshow' || raw === 'no-show') return 'no_show';
  return null;
}

function resolveAdminAttendanceStatus(entry: unknown): AdminAttendanceStatus | null {
  if (typeof entry === 'string') return normalizeAdminAttendanceStatus(entry);
  if (entry && typeof entry === 'object' && typeof (entry as { status?: unknown }).status === 'string') {
    return normalizeAdminAttendanceStatus((entry as { status: string }).status);
  }
  return null;
}

function sanitizeText(value: unknown, maxLen = 500): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function toDateMaybe(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'object' && value !== null) {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybeTimestamp.toDate === 'function') {
      const dt = maybeTimestamp.toDate();
      if (dt instanceof Date && !Number.isNaN(dt.getTime())) return dt;
    }
    if (typeof maybeTimestamp.seconds === 'number') {
      const dt = new Date(maybeTimestamp.seconds * 1000);
      if (!Number.isNaN(dt.getTime())) return dt;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const dt = new Date(value);
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return null;
}

function normalizeTimeForIstParse(value: unknown): string | null {
  const raw = sanitizeText(value, 16);
  if (!raw) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(raw);
  if (!match) return null;
  const seconds = match[3] || '00';
  return `${match[1]}:${match[2]}:${seconds}`;
}

function getSessionStartMillis(session: Record<string, unknown>): number | null {
  const fromStartAt = toDateMaybe(session.startAt);
  if (fromStartAt) return fromStartAt.getTime();

  const dateYmd = sanitizeText(session.date, 16);
  const startTime = normalizeTimeForIstParse(session.startTime);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd) || !startTime) return null;
  const parsed = Date.parse(`${dateYmd}T${startTime}+05:30`);
  return Number.isNaN(parsed) ? null : parsed;
}

function getAttendanceAllowedAtMillis(session: Record<string, unknown>): number | null {
  const startMs = getSessionStartMillis(session);
  if (startMs === null) return null;
  return startMs + ATTENDANCE_OPEN_DELAY_MS;
}

function getAttendanceWindowCloseMillis(session: Record<string, unknown>): number | null {
  const startMs = getSessionStartMillis(session);
  if (startMs === null) return null;
  return startMs + ATTENDANCE_CLOSE_WINDOW_MS;
}

function canCallerOverrideAttendanceTime(role: string): boolean {
  return role === 'admin';
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function normalizeTopicUpdates(value: unknown): Array<{
  topicId: string;
  mastery?: string;
  teacherRemark?: string;
  topicName?: string;
}> {
  if (!Array.isArray(value)) return [];
  const updates: Array<{
    topicId: string;
    mastery?: string;
    teacherRemark?: string;
    topicName?: string;
  }> = [];
  for (const rawUpdate of value as TopicUpdateInput[]) {
    const topicId = sanitizeText(rawUpdate?.topicId, 200);
    if (!topicId) continue;
    const mastery = sanitizeText(rawUpdate?.mastery, 80);
    const teacherRemark = sanitizeText(rawUpdate?.teacherRemark, 400);
    const topicName = sanitizeText(rawUpdate?.topicName, 200);
    updates.push({
      topicId,
      ...(mastery ? { mastery } : {}),
      ...(teacherRemark ? { teacherRemark } : {}),
      ...(topicName ? { topicName } : {}),
    });
  }
  return updates;
}

function toAttendanceEntry(entry: unknown): { status: AttendanceStatus | null; notes: string; mastery: string; topics: string[]; topicUpdates: Array<{ topicId: string; mastery?: string; teacherRemark?: string; topicName?: string }> } {
  if (typeof entry === 'string') {
    return {
      status: normalizeAttendanceStatus(entry),
      notes: '',
      mastery: '',
      topics: [],
      topicUpdates: [],
    };
  }
  if (!entry || typeof entry !== 'object') {
    return {
      status: null,
      notes: '',
      mastery: '',
      topics: [],
      topicUpdates: [],
    };
  }
  const obj = entry as AttendanceEntryInput;
  return {
    status: normalizeAttendanceStatus(obj.status),
    notes: sanitizeText(obj.notes, 400),
    mastery: sanitizeText(obj.mastery, 80),
    topics: normalizeStringArray(obj.topics),
    topicUpdates: normalizeTopicUpdates(obj.topicUpdates),
  };
}

function resolveDurationMins(session: Record<string, unknown>): number {
  const raw = Number(session.durationMins) || Number(session.durationMinutes) || 35;
  if (!Number.isFinite(raw) || raw <= 0) return 35;
  return Math.max(10, Math.min(180, Math.round(raw)));
}

function normalizeCourseId(value: unknown): string {
  const raw = sanitizeText(value, 120).toLowerCase();
  if (!raw) return '';
  const aliases: Record<string, string> = {
    'phonics-foundation': 'phonics-foundations',
    'phonics-foundations': 'phonics-foundations',
    foundational: 'phonics-foundations',
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
  return aliases[raw] || sanitizeText(value, 120);
}

function hasPresentOrLateAttendance(attendance: Record<string, unknown>): boolean {
  return Object.values(attendance).some((entry) => {
    const normalized = toAttendanceEntry(entry).status;
    return normalized === 'present' || normalized === 'late';
  });
}

function hasRescheduleAttendance(attendance: Record<string, unknown>): boolean {
  return Object.values(attendance).some(
    (entry) => toAttendanceEntry(entry).status === 'reschedule_requested'
  );
}

async function resolveCallerRole(auth: { uid?: string; token?: Record<string, unknown> }): Promise<string> {
  const tokenRole = normalizeRole(auth?.token?.role);
  if (tokenRole) return tokenRole;
  const uid = String(auth?.uid || '').trim();
  if (!uid) return '';
  const userSnap = await admin.firestore().collection('users').doc(uid).get();
  return normalizeRole(userSnap.data()?.role);
}

function assertCanSaveSession(
  uid: string,
  role: string,
  session: Record<string, unknown>
): void {
  if (role === 'admin') return;
  const sessionTeacherId = String(session.teacherId || '').trim();
  if (role === 'teacher' && sessionTeacherId && sessionTeacherId === uid) return;
  throw new HttpsError('permission-denied', 'Not allowed to update this session.');
}

const ACTIVE_ENROLLMENT_STATUSES = [
  'trial',
  'active',
  'paused',
  'pending_teacher',
  'pending_payment',
  'enrolled',
  'current',
  'ongoing',
] as const;

function normalizeFinancialStatus(value: unknown): string {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'canceled') return 'cancelled';
  return raw;
}

function normalizeMoney(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function isSettledFinancialStatus(status: string): boolean {
  return status === 'paid' || status === 'settled';
}

function resolveMonthKeyFromSession(session: Record<string, unknown>): string | null {
  const base =
    toDateMaybe(session.startAt) ||
    toDateMaybe(session.endAt) ||
    toDateMaybe(session.date);
  if (!base) return null;
  const istMs = base.getTime() + 330 * 60 * 1000;
  const istDate = new Date(istMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function resolveSessionKidId(session: Record<string, unknown>, preferredKidId?: string): string | null {
  const direct = String(preferredKidId || '').trim();
  if (direct) return direct;
  const fromKidId = String(session.kidId || session.studentId || '').trim();
  if (fromKidId) return fromKidId;
  if (Array.isArray(session.kidIds)) {
    const first = session.kidIds.map((id) => String(id || '').trim()).find(Boolean);
    if (first) return first;
  }
  return null;
}

function resolveFeeAmount(session: Record<string, unknown>, enrollment: Record<string, unknown>): number {
  return normalizeMoney(
    session.feeAmount ??
      session.feePerClass ??
      enrollment.ratePerSession ??
      enrollment.feePerClass ??
      enrollment.feePerSession ??
      0
  );
}

function resolveTeacherPay(enrollment: Record<string, unknown>): number {
  return normalizeMoney(
    enrollment.teacherPayPerSession ??
      enrollment.teacherRatePerSession ??
      enrollment.teacherPay ??
      0
  );
}

async function resolveEnrollmentIdForSession(
  db: admin.firestore.Firestore,
  session: Record<string, unknown>,
  preferredKidId?: string | null
): Promise<string | null> {
  const existing = String(session.enrollmentId || '').trim();
  if (existing) return existing;

  const kidId = resolveSessionKidId(session, String(preferredKidId || '').trim() || undefined);
  const courseId = String(session.courseId || '').trim();
  if (!kidId || !courseId) return null;

  const runStatusQueries: Array<() => Promise<admin.firestore.QuerySnapshot>> = [
    () =>
      db
        .collection('enrollments')
        .where('kidId', '==', kidId)
        .where('courseId', '==', courseId)
        .where('status', 'in', Array.from(ACTIVE_ENROLLMENT_STATUSES))
        .limit(1)
        .get(),
    () =>
      db
        .collection('enrollments')
        .where('studentId', '==', kidId)
        .where('courseId', '==', courseId)
        .where('status', 'in', Array.from(ACTIVE_ENROLLMENT_STATUSES))
        .limit(1)
        .get(),
    () =>
      db
        .collection('enrollments')
        .where('kidIds', 'array-contains', kidId)
        .where('courseId', '==', courseId)
        .where('status', 'in', Array.from(ACTIVE_ENROLLMENT_STATUSES))
        .limit(1)
        .get(),
  ];

  for (const runQuery of runStatusQueries) {
    try {
      const snap = await runQuery();
      if (!snap.empty) return snap.docs[0].id;
    } catch {
      break;
    }
  }

  const runFallbackQueries: Array<() => Promise<admin.firestore.QuerySnapshot>> = [
    () =>
      db
        .collection('enrollments')
        .where('kidId', '==', kidId)
        .where('courseId', '==', courseId)
        .limit(1)
        .get(),
    () =>
      db
        .collection('enrollments')
        .where('studentId', '==', kidId)
        .where('courseId', '==', courseId)
        .limit(1)
        .get(),
    () =>
      db
        .collection('enrollments')
        .where('kidIds', 'array-contains', kidId)
        .where('courseId', '==', courseId)
        .limit(1)
        .get(),
  ];

  for (const runQuery of runFallbackQueries) {
    const snap = await runQuery();
    if (!snap.empty) return snap.docs[0].id;
  }

  return null;
}

function resolveChargePaidAmount(data: Record<string, unknown>, amount: number): number {
  const paidAmount = normalizeMoney(data.paidAmount);
  if (paidAmount > 0) return Math.min(paidAmount, Math.max(amount, 0));
  const status = normalizeFinancialStatus(data.status);
  if (isSettledFinancialStatus(status)) {
    return Math.max(amount, 0);
  }
  return 0;
}

function resolveTeacherEarningPaidAmount(data: Record<string, unknown>, amount: number): number {
  const paidAmount = normalizeMoney(data.paidAmount);
  if (paidAmount > 0) return Math.min(paidAmount, Math.max(amount, 0));
  const status = normalizeFinancialStatus(data.status);
  if (isSettledFinancialStatus(status)) {
    return Math.max(amount, 0);
  }
  return 0;
}

type AttendanceCorrectionFinanceAction =
  | 'mark_billable'
  | 'mark_non_billable'
  | 'no_finance_change';

type AttendanceCorrectionFinanceResult = {
  action: AttendanceCorrectionFinanceAction;
  chargeChanged: boolean;
  earningChanged: boolean;
};

async function reconcileAttendanceCorrectionFinance(args: {
  db: admin.firestore.Firestore;
  batch: admin.firestore.WriteBatch;
  sessionId: string;
  session: Record<string, unknown>;
  kidId: string;
  previousStatus: AdminAttendanceStatus | null;
  newStatus: AdminAttendanceStatus;
  correctedByUid: string;
  attendanceCorrectionId: string;
  reason: string;
}): Promise<AttendanceCorrectionFinanceResult> {
  const {
    db,
    batch,
    sessionId,
    session,
    kidId,
    previousStatus,
    newStatus,
    correctedByUid,
    attendanceCorrectionId,
    reason,
  } = args;

  const wasBillable = previousStatus === 'present';
  const isBillableNow = newStatus === 'present';
  const chargeRef = db.collection('billingCharges').doc(sessionId);
  const earningRef = db.collection('teacherEarnings').doc(sessionId);
  const [chargeSnap, earningSnap] = await Promise.all([chargeRef.get(), earningRef.get()]);

  const metadata: Record<string, unknown> = {
    attendanceCorrectionId,
    reconciledAt: admin.firestore.FieldValue.serverTimestamp(),
    reconciledByUid: correctedByUid,
    reconciliationSource: 'admin-attendance-correction',
    previousAttendanceStatus: previousStatus || 'not_marked',
    newAttendanceStatus: newStatus,
    correctionReason: reason,
  };

  if (!wasBillable && !isBillableNow) {
    return { action: 'no_finance_change', chargeChanged: false, earningChanged: false };
  }

  if (isBillableNow) {
    const enrollmentId = await resolveEnrollmentIdForSession(db, session, kidId);
    if (!enrollmentId) {
      throw new HttpsError('failed-precondition', 'Unable to resolve enrollment for finance reconciliation.');
    }

    const enrollmentSnap = await db.collection('enrollments').doc(enrollmentId).get();
    if (!enrollmentSnap.exists) {
      throw new HttpsError('failed-precondition', 'Enrollment not found for finance reconciliation.');
    }
    const enrollment = (enrollmentSnap.data() || {}) as Record<string, unknown>;

    const monthKey = resolveMonthKeyFromSession(session);
    if (!monthKey) {
      throw new HttpsError('failed-precondition', 'Unable to determine session month for finance reconciliation.');
    }

    const sessionTeacherId = String(session.teacherId || '').trim();
    const teacherId = sessionTeacherId || String(enrollment.teacherId || '').trim() || null;
    const parentId = String(session.parentId || '').trim() || String(enrollment.parentId || '').trim() || null;
    const courseId = String(session.courseId || '').trim() || String(enrollment.courseId || '').trim() || null;
    const currency = String(session.currency || enrollment.currency || 'INR');
    const billableKidId = resolveSessionKidId(session, kidId);
    const amount = resolveFeeAmount(session, enrollment);
    const teacherAmount = resolveTeacherPay(enrollment);

    const existingChargeData = (chargeSnap.data() || {}) as Record<string, unknown>;
    const chargeStatus = normalizeFinancialStatus(existingChargeData.status);
    const nextChargeStatus = !chargeSnap.exists || chargeStatus === 'void' ? 'open' : chargeStatus || 'open';

    const existingEarningData = (earningSnap.data() || {}) as Record<string, unknown>;
    const earningStatus = normalizeFinancialStatus(existingEarningData.status);
    const nextEarningStatus = !earningSnap.exists || earningStatus === 'void' ? 'unpaid' : earningStatus || 'unpaid';

    const chargePayload: Record<string, unknown> = {
      sessionId,
      enrollmentId,
      kidId: billableKidId,
      parentId,
      teacherId,
      courseId,
      amount,
      currency,
      status: nextChargeStatus,
      source: 'session_present_completed',
      monthKey,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...metadata,
      voidedAt: admin.firestore.FieldValue.delete(),
      voidReason: admin.firestore.FieldValue.delete(),
      correctedBy: admin.firestore.FieldValue.delete(),
      correctedAt: admin.firestore.FieldValue.delete(),
    };
    if (!chargeSnap.exists) {
      chargePayload.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    const earningPayload: Record<string, unknown> = {
      sessionId,
      enrollmentId,
      kidId: billableKidId,
      teacherId,
      parentId,
      courseId,
      amount: teacherAmount,
      currency,
      status: nextEarningStatus,
      source: 'session_present_completed',
      monthKey,
      earnedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...metadata,
      voidedAt: admin.firestore.FieldValue.delete(),
      voidReason: admin.firestore.FieldValue.delete(),
      correctedBy: admin.firestore.FieldValue.delete(),
      correctedAt: admin.firestore.FieldValue.delete(),
    };
    if (!earningSnap.exists) {
      earningPayload.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    batch.set(chargeRef, chargePayload, { merge: true });
    batch.set(earningRef, earningPayload, { merge: true });
    return { action: 'mark_billable', chargeChanged: true, earningChanged: true };
  }

  const chargeData = (chargeSnap.data() || {}) as Record<string, unknown>;
  const chargeStatus = normalizeFinancialStatus(chargeData.status);
  const chargeAmount = Math.max(normalizeMoney(chargeData.amount ?? session.accruedAmount), 0);
  const chargePaidAmount = resolveChargePaidAmount(chargeData, chargeAmount);
  if (chargeSnap.exists && chargeStatus !== 'void' && chargePaidAmount > 0) {
    throw new HttpsError(
      'failed-precondition',
      'This charge already has payment applied. Reverse payment allocation first.'
    );
  }

  const earningData = (earningSnap.data() || {}) as Record<string, unknown>;
  const earningStatus = normalizeFinancialStatus(earningData.status);
  const earningAmount = Math.max(normalizeMoney(earningData.amount), 0);
  const earningPaidAmount = resolveTeacherEarningPaidAmount(earningData, earningAmount);
  if (earningSnap.exists && earningStatus !== 'void' && earningPaidAmount > 0) {
    throw new HttpsError(
      'failed-precondition',
      'This teacher earning is already paid. Reverse payout allocation first.'
    );
  }

  let chargeChanged = false;
  if (chargeSnap.exists && chargeStatus !== 'void') {
    batch.set(
      chargeRef,
      {
        status: 'void',
        voidedAt: admin.firestore.FieldValue.serverTimestamp(),
        voidReason: reason,
        correctedBy: correctedByUid,
        correctedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...metadata,
      },
      { merge: true },
    );
    chargeChanged = true;
  }

  let earningChanged = false;
  if (earningSnap.exists && earningStatus !== 'void') {
    batch.set(
      earningRef,
      {
        status: 'void',
        voidedAt: admin.firestore.FieldValue.serverTimestamp(),
        voidReason: reason,
        correctedBy: correctedByUid,
        correctedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...metadata,
      },
      { merge: true },
    );
    earningChanged = true;
  }

  return { action: 'mark_non_billable', chargeChanged, earningChanged };
}

export const saveTeacherSessionProgress = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 90,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.');
    }
    const uid = request.auth.uid;
    const role = await resolveCallerRole(request.auth);
    if (!role) {
      throw new HttpsError('permission-denied', 'Unable to resolve caller role.');
    }

    const payload = (request.data || {}) as SaveTeacherSessionProgressRequest;
    const sessionId = sanitizeText(payload.sessionId, 160);
    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'sessionId is required.');
    }
    if (!payload.attendance || typeof payload.attendance !== 'object' || Array.isArray(payload.attendance)) {
      throw new HttpsError('invalid-argument', 'attendance map is required.');
    }

    const db = admin.firestore();
    const sessionRef = db.collection('classSessions').doc(sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Session not found.');
    }
    const session = (sessionSnap.data() || {}) as Record<string, unknown>;
    assertCanSaveSession(uid, role, session);

    const attendanceAllowedAtMs = getAttendanceAllowedAtMillis(session);
    const attendanceWindowCloseMs = getAttendanceWindowCloseMillis(session);
    if (
      role === 'teacher' &&
      !canCallerOverrideAttendanceTime(role)
    ) {
      if (attendanceAllowedAtMs === null || attendanceWindowCloseMs === null) {
        throw new HttpsError(
          'failed-precondition',
          'Attendance time could not be verified. Please contact admin.',
        );
      }
      if (Date.now() < attendanceAllowedAtMs) {
        throw new HttpsError(
          'failed-precondition',
          'Attendance can be marked 30 minutes after class start.',
        );
      }
      if (Date.now() > attendanceWindowCloseMs) {
        throw new HttpsError(
          'failed-precondition',
          'Attendance window has closed. Please contact admin to update this attendance.',
        );
      }
    }

    const attendanceOnly = payload.meta?.attendanceOnly === true;
    const incomingAttendance = payload.attendance as Record<string, unknown>;
    const nextAttendance: Record<string, Record<string, unknown>> = {};
    const sessionKidIds = Array.isArray(session.kidIds)
      ? (session.kidIds as unknown[]).map((kidId) => String(kidId || '').trim()).filter(Boolean)
      : [];
    const allowedAttendanceKidIds = new Set<string>(sessionKidIds);
    const enforceKidMembership = allowedAttendanceKidIds.size > 0;

    if (attendanceOnly) {
      const existingAttendanceRaw = session.attendance;
      const existingAttendance =
        existingAttendanceRaw && typeof existingAttendanceRaw === 'object' && !Array.isArray(existingAttendanceRaw)
          ? (existingAttendanceRaw as Record<string, unknown>)
          : {};

      for (const [kidId, rawEntry] of Object.entries(existingAttendance)) {
        const normalizedKidId = String(kidId || '').trim();
        if (
          enforceKidMembership &&
          (!normalizedKidId || !allowedAttendanceKidIds.has(normalizedKidId))
        ) {
          continue;
        }
        const entry = toAttendanceEntry(rawEntry);
        if (!entry.status) continue;
        nextAttendance[normalizedKidId] = {
          status: entry.status,
          ...(entry.notes ? { notes: entry.notes } : {}),
          ...(entry.mastery ? { mastery: entry.mastery } : {}),
          ...(entry.topics.length ? { topics: entry.topics } : {}),
          ...(entry.topicUpdates.length ? { topicUpdates: entry.topicUpdates } : {}),
        };
      }

      for (const [kidId, rawEntry] of Object.entries(incomingAttendance)) {
        const normalizedKidId = String(kidId || '').trim();
        if (!normalizedKidId) {
          throw new HttpsError('invalid-argument', 'Invalid attendance kidId');
        }
        if (enforceKidMembership && !allowedAttendanceKidIds.has(normalizedKidId)) {
          throw new HttpsError(
            'invalid-argument',
            `Attendance kid ${normalizedKidId} is not assigned to this session.`,
          );
        }
        const entry = toAttendanceEntry(rawEntry);
        if (!entry.status) {
          throw new HttpsError('invalid-argument', `Invalid attendance status for kid ${normalizedKidId}`);
        }
        const previous =
          nextAttendance[normalizedKidId] && typeof nextAttendance[normalizedKidId] === 'object'
            ? nextAttendance[normalizedKidId]
            : {};
        nextAttendance[normalizedKidId] = {
          ...previous,
          status: entry.status,
          notes: entry.notes || String(previous.notes || ''),
        };
      }
    } else {
      for (const [kidId, rawEntry] of Object.entries(incomingAttendance)) {
        const normalizedKidId = String(kidId || '').trim();
        if (!normalizedKidId) {
          throw new HttpsError('invalid-argument', 'Invalid attendance kidId');
        }
        if (enforceKidMembership && !allowedAttendanceKidIds.has(normalizedKidId)) {
          throw new HttpsError(
            'invalid-argument',
            `Attendance kid ${normalizedKidId} is not assigned to this session.`,
          );
        }
        const entry = toAttendanceEntry(rawEntry);
        if (!entry.status) {
          throw new HttpsError('invalid-argument', `Invalid attendance status for kid ${kidId}`);
        }
        nextAttendance[normalizedKidId] = {
          status: entry.status,
          ...(entry.notes ? { notes: entry.notes } : {}),
          ...(entry.mastery ? { mastery: entry.mastery } : {}),
          ...(entry.topics.length ? { topics: entry.topics } : {}),
          ...(entry.topicUpdates.length ? { topicUpdates: entry.topicUpdates } : {}),
        };
      }
    }

    const sessionNotes = sanitizeText(payload.sessionNotes, 2000);
    const presentOrLate = hasPresentOrLateAttendance(nextAttendance);
    const hasReschedule = hasRescheduleAttendance(nextAttendance);
    const shouldRequestReschedule = hasReschedule && !presentOrLate;

    const batch = db.batch();
    const sessionUpdate: Record<string, unknown> = {
      attendance: nextAttendance,
      notes: sessionNotes,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: uid,
    };
    if (shouldRequestReschedule) {
      sessionUpdate.status = 'reschedule_requested';
    }
    batch.set(sessionRef, sessionUpdate, { merge: true });

    const rescheduleCreditIds: string[] = [];
    if (hasReschedule) {
      for (const [kidId, rawEntry] of Object.entries(nextAttendance)) {
        const entry = toAttendanceEntry(rawEntry);
        if (entry.status !== 'reschedule_requested') continue;
        const creditId = `${sessionId}_${kidId}`;
        const creditRef = db.collection('rescheduleCredits').doc(creditId);
        const existingSnap = await creditRef.get();
        const statusRaw = String(existingSnap.data()?.status || '').trim().toLowerCase();
        const existingStatus =
          statusRaw === 'open' || statusRaw === 'scheduled' || statusRaw === 'consumed' || statusRaw === 'cancelled'
            ? statusRaw
            : '';

        const sharedPayload: Record<string, unknown> = {
          creditId,
          sourceSessionId: sessionId,
          sourceEnrollmentId: session.enrollmentId || null,
          sourceSessionDate: session.date || null,
          sourceStartAt: session.startAt || null,
          sourceEndAt: session.endAt || null,
          sourceStartTime: session.startTime || null,
          sourceEndTime: session.endTime || null,
          teacherId: session.teacherId || null,
          kidId,
          parentId: session.parentId || null,
          parentIds: Array.isArray(session.parentIds) ? session.parentIds : [],
          courseId: session.courseId || null,
          currency: session.currency || 'INR',
          feeAmount:
            Number.isFinite(Number(session.feeAmount)) ? Number(session.feeAmount) :
            Number.isFinite(Number(session.feePerClass)) ? Number(session.feePerClass) :
            0,
          durationMins: resolveDurationMins(session),
          sourceStatus: 'reschedule_requested',
          reason: entry.notes || sessionNotes || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: uid,
        };

        if (!existingSnap.exists) {
          batch.set(
            creditRef,
            {
              ...sharedPayload,
              status: 'open',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              createdBy: uid,
              openedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        } else {
          batch.set(
            creditRef,
            {
              ...sharedPayload,
              ...(existingStatus === 'cancelled'
                ? { status: 'open', reopenedAt: admin.firestore.FieldValue.serverTimestamp() }
                : {}),
            },
            { merge: true }
          );
        }
        rescheduleCreditIds.push(creditId);
      }
    }

    const makeupCreditId = sanitizeText(session.makeupCreditId, 160);
    if (makeupCreditId && presentOrLate) {
      const creditRef = db.collection('rescheduleCredits').doc(makeupCreditId);
      batch.set(
        creditRef,
        {
          status: 'consumed',
          consumedSessionId: sessionId,
          consumedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: uid,
        },
        { merge: true }
      );
    }

    let curriculumWriteCount = 0;
    let progressWriteCount = 0;
    if (!attendanceOnly) {
      const resolvedCourseId = normalizeCourseId(payload.meta?.courseId || session.courseId);
      const resolvedCourseLabel = sanitizeText(payload.meta?.courseLabel || session.courseLabel || session.courseName, 160);

      for (const [kidId, rawEntry] of Object.entries(nextAttendance)) {
        const entry = toAttendanceEntry(rawEntry);
        if (entry.status !== 'present' && entry.status !== 'late') continue;

        const updatesByTopic = new Map<string, { mastery?: string; teacherRemark?: string; topicName?: string }>();
        for (const update of entry.topicUpdates) {
          if (!update.topicId) continue;
          updatesByTopic.set(update.topicId, update);
        }
        const topicIds = updatesByTopic.size > 0
          ? Array.from(updatesByTopic.keys())
          : entry.topics;

        for (const topicId of topicIds) {
          const update = updatesByTopic.get(topicId);
          const masteryRaw = sanitizeText(update?.mastery || entry.mastery, 80);
          const masteryNormalized = masteryRaw.toLowerCase();
          const topicName = sanitizeText(update?.topicName || topicId, 200) || topicId;
          const teacherRemark = sanitizeText(update?.teacherRemark || entry.notes, 400);

          const isCompleted = masteryNormalized === 'proficient' || masteryNormalized === 'mastered';
          const curriculumRef = db.collection('students').doc(kidId).collection('curriculum').doc(topicId);
          const curriculumPayload: Record<string, unknown> = {
            status: isCompleted ? 'completed' : 'in_progress',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: uid,
            source: 'attendance',
            lastSessionId: sessionId,
            topicName,
          };
          if (resolvedCourseId) curriculumPayload.courseId = resolvedCourseId;
          if (resolvedCourseLabel) {
            curriculumPayload.courseLabel = resolvedCourseLabel;
            curriculumPayload.courseName = resolvedCourseLabel;
          }
          batch.set(curriculumRef, curriculumPayload, { merge: true });
          curriculumWriteCount += 1;

          const progressRef = db.collection('students').doc(kidId).collection('progress').doc(topicId);
          const progressPayload: Record<string, unknown> = {
            lastEvidence: 'session',
            lastSessionId: sessionId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: uid,
            source: 'attendance',
            topicName,
            topicId,
          };
          if (masteryRaw) progressPayload.mastery = masteryRaw;
          if (teacherRemark) progressPayload.teacherRemark = teacherRemark;
          if (resolvedCourseId) progressPayload.courseId = resolvedCourseId;
          if (resolvedCourseLabel) {
            progressPayload.courseLabel = resolvedCourseLabel;
            progressPayload.courseName = resolvedCourseLabel;
          }
          batch.set(progressRef, progressPayload, { merge: true });
          progressWriteCount += 1;
        }
      }
    }

    await batch.commit();

    logger.info('saveTeacherSessionProgress: session updated', {
      sessionId,
      actorUid: uid,
      role,
      attendanceOnly,
      presentOrLate,
      hasReschedule,
      attendanceKidsCount: Object.keys(nextAttendance).length,
      curriculumWriteCount,
      progressWriteCount,
      rescheduleCreditsOpened: rescheduleCreditIds.length,
      consumedMakeupCreditId: makeupCreditId || null,
    });

    return {
      ok: true,
      sessionId,
      hasPresentOrLate: presentOrLate,
      hasReschedule,
      attendanceOnly,
      appliedStatus: shouldRequestReschedule ? 'reschedule_requested' : null,
      attendanceKidsCount: Object.keys(nextAttendance).length,
      curriculumWriteCount,
      progressWriteCount,
      rescheduleCreditsOpened: rescheduleCreditIds.length,
      rescheduleCreditIds,
      consumedMakeupCreditId: makeupCreditId || null,
    };
  }
);

export const adminAttendanceCorrection = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 90,
    cors: CALLABLE_CORS_ORIGINS,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.');
    }

    const uid = request.auth.uid;
    const role = await resolveCallerRole(request.auth);
    if (role !== 'admin') {
      throw new HttpsError('permission-denied', 'Admin access required.');
    }

    const payload = (request.data || {}) as AdminAttendanceCorrectionRequest;
    const sessionId = sanitizeText(payload.sessionId, 160);
    const kidId = sanitizeText(payload.kidId, 160);
    const reason = sanitizeText(payload.reason, 2000);
    const newStatus = normalizeAdminAttendanceStatus(payload.newStatus);

    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'sessionId is required.');
    }
    if (!kidId) {
      throw new HttpsError('invalid-argument', 'kidId is required.');
    }
    if (!newStatus) {
      throw new HttpsError('invalid-argument', 'newStatus is required.');
    }
    if (!reason) {
      throw new HttpsError('invalid-argument', 'reason is required.');
    }

    const db = admin.firestore();
    const sessionRef = db.collection('classSessions').doc(sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Session not found.');
    }

    const session = (sessionSnap.data() || {}) as Record<string, unknown>;
    const sessionKidIds = Array.isArray(session.kidIds)
      ? (session.kidIds as unknown[]).map((id) => String(id || '').trim()).filter(Boolean)
      : [];
    if (sessionKidIds.length > 0 && !sessionKidIds.includes(kidId)) {
      throw new HttpsError('invalid-argument', 'Selected student is not assigned to this session.');
    }

    const attendanceRaw =
      session.attendance && typeof session.attendance === 'object' && !Array.isArray(session.attendance)
        ? (session.attendance as Record<string, unknown>)
        : {};
    const previousRawEntry = attendanceRaw[kidId];
    const previousStatus = resolveAdminAttendanceStatus(previousRawEntry);
    const previousEntryObject =
      previousRawEntry && typeof previousRawEntry === 'object' && !Array.isArray(previousRawEntry)
        ? { ...(previousRawEntry as Record<string, unknown>) }
        : {};

    const nextAttendance: Record<string, unknown> = {
      ...attendanceRaw,
      [kidId]: {
        ...previousEntryObject,
        status: newStatus,
      },
    };

    const userSnap = await db.collection('users').doc(uid).get();
    const userData = (userSnap.data() || {}) as Record<string, unknown>;
    const tokenEmail = sanitizeText(request.auth?.token?.email, 320);
    const correctedByName =
      sanitizeText(userData.fullName, 320) ||
      sanitizeText(userData.name, 320) ||
      sanitizeText(userData.displayName, 320) ||
      tokenEmail ||
      uid;
    const correctedByEmail = sanitizeText(userData.email, 320) || tokenEmail || null;

    const batch = db.batch();
    const auditRef = sessionRef.collection('attendanceCorrections').doc();
    const financeReconciliation = await reconcileAttendanceCorrectionFinance({
      db,
      batch,
      sessionId,
      session: {
        ...session,
        attendance: nextAttendance,
      },
      kidId,
      previousStatus,
      newStatus,
      correctedByUid: uid,
      attendanceCorrectionId: auditRef.id,
      reason,
    });

    batch.set(
      sessionRef,
      {
        attendance: nextAttendance,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: uid,
      },
      { merge: true },
    );

    batch.set(auditRef, {
      source: 'admin-attendance-correction',
      sessionId,
      kidId,
      previousStatus,
      newStatus,
      reason,
      correctedBy: uid,
      correctedByUid: uid,
      correctedByName,
      correctedByEmail,
      correctedAt: admin.firestore.FieldValue.serverTimestamp(),
      financeReconciliation,
    });

    await batch.commit();

    logger.info('adminAttendanceCorrection: applied', {
      sessionId,
      kidId,
      previousStatus,
      newStatus,
      correctedByUid: uid,
      correctionId: auditRef.id,
    });

    return {
      ok: true,
      sessionId,
      kidId,
      previousStatus,
      newStatus,
      correctionId: auditRef.id,
    };
  },
);
