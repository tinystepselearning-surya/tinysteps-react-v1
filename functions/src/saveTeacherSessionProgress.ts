import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import {FieldValue} from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { resolvePresentFinanceReplayPlan } from './helpers/attendanceFinanceIdempotency';
import { isFinanciallyEarnedAttendanceStatus } from './helpers/status';
import {calendarAttendanceClaimId} from './scheduling/teacherCalendarActions';
import {
  hasAttendanceValidationAttendanceChange,
  markAttendanceValidationDirtySession,
} from './attendanceValidation/dirtySessionMarker';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const CALLABLE_CORS_ORIGINS: Array<string | RegExp> = [
  'http://localhost:5173',
  'https://tinystepslearning.com',
  'https://www.tinystepslearning.com',
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
  validationCaseId?: unknown;
  validationCaseFingerprint?: unknown;
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

function normalizeIncomingAdminAttendanceStatus(value: unknown): AdminAttendanceStatus | null {
  const normalized = normalizeAdminAttendanceStatus(value);
  return normalized === 'late' ? 'present' : normalized;
}

function resolveAdminAttendanceStatus(entry: unknown): AdminAttendanceStatus | null {
  if (typeof entry === 'string') return normalizeAdminAttendanceStatus(entry);
  if (entry && typeof entry === 'object' && typeof (entry as { status?: unknown }).status === 'string') {
    return normalizeAdminAttendanceStatus((entry as { status: string }).status);
  }
  return null;
}

type Av7CanonicalCorrectionStatus = 'present' | 'absent' | 'rescheduled';

function canonicalizeAv7AttendanceStatus(value: unknown): Av7CanonicalCorrectionStatus | null {
  const normalized = normalizeAdminAttendanceStatus(value);
  if (normalized === 'present' || normalized === 'late') return 'present';
  if (normalized === 'absent' || normalized === 'no_show') return 'absent';
  if (normalized === 'rescheduled' || normalized === 'reschedule_requested') return 'rescheduled';
  return null;
}

function expectedAv7StatusForAction(value: unknown): 'present' | 'absent' | null {
  const action = String(value || '').trim().toLowerCase();
  if (action === 'correct_to_present') return 'present';
  if (action === 'correct_to_absent') return 'absent';
  return null;
}

function sanitizeText(value: unknown, maxLen = 500): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
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

function toIncomingAttendanceEntry(entry: unknown): ReturnType<typeof toAttendanceEntry> {
  const normalized = toAttendanceEntry(entry);
  if (normalized.status === 'late') {
    return { ...normalized, status: 'present' };
  }
  return normalized;
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

async function resolveCallerRole(auth: { uid?: string; token?: Record<string, unknown> }): Promise<string> {
  const uid = String(auth?.uid || '').trim();
  if (!uid) return '';

  const userSnap = await admin.firestore().collection('users').doc(uid).get();
  if (!userSnap.exists) return '';

  const user = userSnap.data() || {};
  const status = String(user.status || '').trim().toLowerCase();
  if (status && status !== 'active') return '';

  const primaryRole = normalizeRole(user.role);
  if (primaryRole) return primaryRole;

  const roles = Array.isArray(user.roles) ? user.roles : [];
  for (const role of roles) {
    const normalized = normalizeRole(role);
    if (normalized) return normalized;
  }

  return '';
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
    previousStatus,
    newStatus,
    correctedByUid,
    attendanceCorrectionId,
    reason,
  } = args;

  const wasBillable = isFinanciallyEarnedAttendanceStatus(previousStatus);
  const isBillableNow = isFinanciallyEarnedAttendanceStatus(newStatus);
  const chargeRef = db.collection('billingCharges').doc(sessionId);
  const earningRef = db.collection('teacherEarnings').doc(sessionId);
  const [chargeSnap, earningSnap] = await Promise.all([chargeRef.get(), earningRef.get()]);

  const metadata: Record<string, unknown> = {
    attendanceCorrectionId,
    reconciledAt: FieldValue.serverTimestamp(),
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
    const existingChargeData = (chargeSnap.data() || {}) as Record<string, unknown>;
    const chargeStatus = normalizeFinancialStatus(existingChargeData.status);
    const existingEarningData = (earningSnap.data() || {}) as Record<string, unknown>;
    const earningStatus = normalizeFinancialStatus(existingEarningData.status);
    const replayPlan = resolvePresentFinanceReplayPlan({
      wasBillable,
      alreadyAccrued: session.revenueAccrued === true,
      chargeExists: chargeSnap.exists,
      chargeStatus,
      earningExists: earningSnap.exists,
      earningStatus,
    });
    if (replayPlan.conflict === 'charge_void') {
      throw new HttpsError('failed-precondition', 'Existing charge is void; financially-earned attendance replay requires financial review.');
    }
    if (replayPlan.conflict === 'earning_void') {
      throw new HttpsError('failed-precondition', 'Existing teacher earning is void; financially-earned attendance replay requires financial review.');
    }
    if (replayPlan.conflict === 'missing_charge') {
      throw new HttpsError('failed-precondition', 'Billing charge is missing while a teacher earning exists; use explicit financial reconciliation.');
    }
    if (replayPlan.conflict === 'missing_earning') {
      throw new HttpsError('failed-precondition', 'Teacher earning is missing while a billing charge exists; use explicit financial reconciliation.');
    }
    if (replayPlan.conflict === 'missing_charge_and_earning') {
      throw new HttpsError('failed-precondition', 'Financial ledger is missing for already-earned attendance; use explicit financial reconciliation.');
    }
    if (replayPlan.conflict === 'already_accrued_without_ledger') {
      throw new HttpsError('failed-precondition', 'Session is already accrued but its financial ledger is missing; use explicit financial reconciliation.');
    }
    if (replayPlan.conflict === 'preexisting_ledger_for_non_billable_attendance') {
      throw new HttpsError('failed-precondition', 'Financial ledger already exists for non-billable attendance; use explicit financial reconciliation.');
    }
    return {
      action: replayPlan.deferToRevenueAccrual ? 'mark_billable' : 'no_finance_change',
      chargeChanged: false,
      earningChanged: false,
    };
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
        voidedAt: FieldValue.serverTimestamp(),
        voidReason: reason,
        correctedBy: correctedByUid,
        correctedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
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
        voidedAt: FieldValue.serverTimestamp(),
        voidReason: reason,
        correctedBy: correctedByUid,
        correctedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
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

    // No time-based teacher gate. Keep authorization and financial safeguards.
    const attendanceOnly = payload.meta?.attendanceOnly === true;
    const incomingAttendance = payload.attendance as Record<string, unknown>;
    // Preserve historical credits/corrections. Once virtual calendar is
    // activated, do not let any new Present/Absent submission produce another
    // reschedule credit; teacher ad hoc is the only one-off workflow.
    if (Object.values(incomingAttendance).some(entry =>
          !['present','absent'].includes(String(toIncomingAttendanceEntry(entry).status||'')))) {
      throw new HttpsError('failed-precondition',
        'Only Present or Absent can be newly submitted.');
    }
    const nextAttendance: Record<string, Record<string, unknown>> = {};
    const sessionKidIds = Array.from(new Set([
      ...(Array.isArray(session.kidIds) ? session.kidIds : []),
      session.kidId, session.studentId, session.childId,
    ].map(value=>String(value||'').trim()).filter(Boolean)));
    const allowedAttendanceKidIds = new Set<string>(sessionKidIds);
    // A historical record with no child identity needs Admin repair, not an
    // unrestricted teacher write under an arbitrary child ID.
    if (!allowedAttendanceKidIds.size) {
      throw new HttpsError('failed-precondition',
        'Class is missing its student identity. Ask Admin to repair the record.');
    }
    const enforceKidMembership = true;

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
        const entry = toIncomingAttendanceEntry(rawEntry);
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
        const entry = toIncomingAttendanceEntry(rawEntry);
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

    const attendanceChangedForAvs = hasAttendanceValidationAttendanceChange(
      session.attendance,
      nextAttendance,
    );
    const sessionNotes = sanitizeText(payload.sessionNotes, 2000);
    const presentOrLate = hasPresentOrLateAttendance(nextAttendance);

    // One existing attendance map is updated in-place. Previous reschedule
    // statuses remain readable, but no new credit lookup/write is permitted.
    const previousMap = session.attendance && typeof session.attendance === 'object'
      ? session.attendance as Record<string, unknown> : {};
    const changesBillability = Object.entries(incomingAttendance).some(([kidId]) => {
      const before = toAttendanceEntry(previousMap[kidId]).status;
      const after = toAttendanceEntry(nextAttendance[kidId]).status;
      return isFinanciallyEarnedAttendanceStatus(before)
        !== isFinanciallyEarnedAttendanceStatus(after);
    });

    if (!sessionSnap.updateTime) {
      throw new HttpsError('failed-precondition','Session version unavailable; retry attendance save.');
    }
    const sessionUpdate: Record<string, unknown> = {
      attendance: nextAttendance,
      notes: sessionNotes,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    };
    const stagedWrites:Array<(tx:admin.firestore.Transaction)=>void> = [];

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
            updatedAt: FieldValue.serverTimestamp(),
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
          stagedWrites.push(tx=>tx.set(curriculumRef,curriculumPayload,{merge:true}));
          curriculumWriteCount += 1;

          const progressRef = db.collection('students').doc(kidId).collection('progress').doc(topicId);
          const progressPayload: Record<string, unknown> = {
            lastEvidence: 'session',
            lastSessionId: sessionId,
            updatedAt: FieldValue.serverTimestamp(),
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
          stagedWrites.push(tx=>tx.set(progressRef,progressPayload,{merge:true}));
          progressWriteCount += 1;
        }
      }
    }


    const sessionDayAndTime=():{day:string;time:string}=>{
      const day=String(session.date||'').trim();
      const match=/^([0-9]{1,2}):([0-9]{2})(?::[0-9]{2})?$/.exec(String(session.startTime||'').trim());
      if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(day) && match)
        return {day,time:match[1].padStart(2,'0')+':'+match[2]};
      const at=(session.startAt as {toDate?:()=>Date}|undefined)?.toDate?.();
      if(!at || !Number.isFinite(at.getTime()))
        throw new HttpsError('failed-precondition','Historical class date/time requires Admin review.');
      const shifted=new Date(at.getTime()+330*60_000).toISOString();
      return {day:shifted.slice(0,10),time:shifted.slice(11,16)};
    };
    const occurrence=sessionDayAndTime();
    const claimIds=Object.keys(incomingAttendance);
    await db.runTransaction(async tx=>{
      const latest=await tx.get(sessionRef);
      if(!latest.exists || !latest.updateTime ||
          latest.updateTime.toMillis()!==sessionSnap.updateTime!.toMillis())
        throw new HttpsError('aborted','Attendance changed. Refresh and try again.');
      const [chargeSnap,earningSnap,...claims]=await Promise.all([
        tx.get(db.collection('billingCharges').doc(sessionId)),
        tx.get(db.collection('teacherEarnings').doc(sessionId)),
        ...claimIds.map(kid=>tx.get(db.collection('calendarAttendanceClaims').doc(
          calendarAttendanceClaimId('',kid,occurrence.day,occurrence.time)))),
      ]);
      if(changesBillability){
        const isPaid=(data:Record<string,unknown>):boolean=>
          isSettledFinancialStatus(normalizeFinancialStatus(data.status))
            || normalizeMoney(data.paidAmount)>0;
        if((chargeSnap.exists&&isPaid((chargeSnap.data()||{}) as Record<string,unknown>))||
           (earningSnap.exists&&isPaid((earningSnap.data()||{}) as Record<string,unknown>)))
          throw new HttpsError('failed-precondition',
            'Attendance correction affects settled finance; contact Admin.');
      }
      if(claims.some(c=>c.exists && String(c.data()?.sessionId||'')!==sessionId))
        throw new HttpsError('failed-precondition',
          'Another canonical attendance exists for this student/date/time.');
      if(claims.some(c=>!c.exists)){
        const daySnap=await tx.get(db.collection('classSessions')
          .where('date','==',occurrence.day).limit(251));
        if(daySnap.size>250)
          throw new HttpsError('failed-precondition','Occurrence coverage exceeded; Admin review.');
        for(const docSnap of daySnap.docs){
          if(docSnap.id===sessionId)continue;
          const row=docSnap.data() as Record<string,unknown>;
          const m=/^([0-9]{1,2}):([0-9]{2})(?::[0-9]{2})?$/.exec(String(row.startTime||'').trim());
          const otherTime=m?m[1].padStart(2,'0')+':'+m[2]:'';
          const kids=[...(Array.isArray(row.kidIds)?row.kidIds:[]),
            row.kidId,row.studentId,row.childId].map(k=>String(k||'').trim());
          if(otherTime===occurrence.time&&claimIds.some(k=>kids.includes(k)))
            throw new HttpsError('failed-precondition',
              'Historical class already exists for the student/date/time; Admin review.');
        }
      }
      tx.update(sessionRef,sessionUpdate);
      for(let i=0;i<claims.length;i++){
        if(claims[i].exists)continue;
        const childId=claimIds[i];
        tx.create(db.collection('calendarAttendanceClaims').doc(
          calendarAttendanceClaimId('',childId,occurrence.day,occurrence.time)),{
          sessionId,childId,enrollmentId:String(session.enrollmentId||''),
          date:occurrence.day,startTime:occurrence.time,
          createdAt:FieldValue.serverTimestamp(),
          source:'teacher_attendance_save',
        });
      }
      stagedWrites.forEach(write=>write(tx));
    });


    if (attendanceChangedForAvs) {
      try {
        await markAttendanceValidationDirtySession(db, {
          sessionId,
          session: {
            ...session,
            attendance: nextAttendance,
          },
          reason: 'teacher_attendance_changed',
        });
      } catch (error) {
        logger.warn('saveTeacherSessionProgress: AVS dirty marker failed', {
          sessionId,
          errorName: error instanceof Error ? error.name : 'unknown',
          errorMessage: error instanceof Error ? error.message : 'unknown',
        });
      }
    }

    logger.info('saveTeacherSessionProgress: session updated', {
      sessionId,
      actorUid: uid,
      role,
      attendanceOnly,
      presentOrLate,
      hasReschedule: false,
      attendanceKidsCount: Object.keys(nextAttendance).length,
      curriculumWriteCount,
      progressWriteCount,
      rescheduleCreditsOpened: 0,
      consumedMakeupCreditId: null,
    });

    return {
      ok: true,
      sessionId,
      hasPresentOrLate: presentOrLate,
      hasReschedule: false,
      attendanceOnly,
      appliedStatus: null,
      attendanceKidsCount: Object.keys(nextAttendance).length,
      curriculumWriteCount,
      progressWriteCount,
      rescheduleCreditsOpened: 0,
      rescheduleCreditIds: [],
      consumedMakeupCreditId: null,
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
    const newStatus = normalizeIncomingAdminAttendanceStatus(payload.newStatus);
    const validationCaseId = sanitizeText(payload.validationCaseId, 240);
    const validationCaseFingerprint = sanitizeText(payload.validationCaseFingerprint, 160);
    const hasValidationCaseLink = Boolean(validationCaseId || validationCaseFingerprint);

    if (hasValidationCaseLink && (!validationCaseId || !validationCaseFingerprint)) {
      throw new HttpsError(
        'invalid-argument',
        'validationCaseId and validationCaseFingerprint must be supplied together.',
      );
    }
    if (validationCaseId && validationCaseId.includes('/')) {
      throw new HttpsError('invalid-argument', 'validationCaseId must be a Firestore document id.');
    }
    if (validationCaseFingerprint && !/^[a-f0-9]{64}$/i.test(validationCaseFingerprint)) {
      throw new HttpsError('invalid-argument', 'validationCaseFingerprint is invalid.');
    }

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
    const sessionUpdateTime = sessionSnap.updateTime;
    const sessionLifecycleStatus = String(session.status || '').trim().toLowerCase();
    if (
      hasValidationCaseLink
      && (sessionLifecycleStatus === 'cancelled' || sessionLifecycleStatus === 'canceled')
    ) {
      throw new HttpsError(
        'failed-precondition',
        'AVS-linked correction cannot be applied to a cancelled session.',
      );
    }
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

    let av7ValidationLink: {
      caseRef: admin.firestore.DocumentReference;
      resolutionRef: admin.firestore.DocumentReference;
      caseId: string;
      fingerprint: string;
      recommendedAction: 'correct_to_present' | 'correct_to_absent';
      expectedNewStatus: 'present' | 'absent';
      caseUpdateTime: admin.firestore.Timestamp;
    } | null = null;

    if (hasValidationCaseLink) {
      const caseRef = db.collection('attendanceValidationCases').doc(validationCaseId);
      const caseSnap = await caseRef.get();
      if (!caseSnap.exists) {
        throw new HttpsError('not-found', 'Attendance validation case not found.');
      }

      const validationCase = (caseSnap.data() || {}) as Record<string, unknown>;
      const caseUpdateTime = caseSnap.updateTime;
      if (!caseUpdateTime) {
        throw new HttpsError(
          'failed-precondition',
          'Attendance validation case version could not be verified.',
        );
      }
      const storedFingerprint = sanitizeText(validationCase.inputFingerprint, 160);
      if (!storedFingerprint || storedFingerprint !== validationCaseFingerprint) {
        throw new HttpsError(
          'failed-precondition',
          'Attendance validation case changed. Refresh AVS before approving a correction.',
        );
      }

      if (sanitizeText(validationCase.classSessionId, 160) !== sessionId) {
        throw new HttpsError(
          'failed-precondition',
          'Attendance validation case no longer points to this session.',
        );
      }
      if (sanitizeText(validationCase.kidId, 160) !== kidId) {
        throw new HttpsError(
          'failed-precondition',
          'Attendance validation case no longer points to this student.',
        );
      }

      const expectedNewStatus = expectedAv7StatusForAction(validationCase.recommendedAction);
      if (!expectedNewStatus) {
        throw new HttpsError(
          'failed-precondition',
          'This attendance validation case does not recommend an approvable correction.',
        );
      }
      if (canonicalizeAv7AttendanceStatus(newStatus) !== expectedNewStatus) {
        throw new HttpsError(
          'failed-precondition',
          'Requested attendance status does not match the AVS recommendation.',
        );
      }
      if (String(validationCase.validationDecision || '').trim().toLowerCase() !== expectedNewStatus) {
        throw new HttpsError(
          'failed-precondition',
          'AVS decision and recommended correction are inconsistent.',
        );
      }

      const recordedTinyStepsAttendance = canonicalizeAv7AttendanceStatus(
        validationCase.tinyStepsAttendance,
      );
      const currentTinyStepsAttendance = canonicalizeAv7AttendanceStatus(previousStatus);
      if (previousStatus !== null && currentTinyStepsAttendance === null) {
        throw new HttpsError(
          'failed-precondition',
          'AVS-linked correction cannot reinterpret a non-canonical attendance status.',
        );
      }
      if (recordedTinyStepsAttendance !== currentTinyStepsAttendance) {
        throw new HttpsError(
          'failed-precondition',
          'Attendance changed after this AVS case was produced. Refresh validation before correcting.',
        );
      }

      const resolutionStatus = String(validationCase.resolutionStatus || '').trim().toLowerCase();
      if (resolutionStatus !== 'needs_review') {
        throw new HttpsError(
          'failed-precondition',
          'This attendance validation case is no longer awaiting correction approval.',
        );
      }

      const resolutionId = `${validationCaseId}__${validationCaseFingerprint.slice(0, 48)}`;
      const resolutionRef = db.collection('attendanceValidationResolutions').doc(resolutionId);
      const resolutionSnap = await resolutionRef.get();
      if (resolutionSnap.exists) {
        throw new HttpsError(
          'already-exists',
          'This exact attendance validation case revision was already resolved.',
        );
      }

      av7ValidationLink = {
        caseRef,
        resolutionRef,
        caseId: validationCaseId,
        fingerprint: validationCaseFingerprint,
        recommendedAction: expectedNewStatus === 'present'
          ? 'correct_to_present'
          : 'correct_to_absent',
        expectedNewStatus,
        caseUpdateTime,
      };
    }

    const nextAttendance: Record<string, unknown> = {
      ...attendanceRaw,
      [kidId]: {
        ...previousEntryObject,
        status: newStatus,
      },
    };
    const attendanceChangedForAvs = hasAttendanceValidationAttendanceChange(
      attendanceRaw,
      nextAttendance,
    );

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

    const sessionUpdate = {
      attendance: nextAttendance,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    };
    if (av7ValidationLink) {
      if (!sessionUpdateTime) {
        throw new HttpsError(
          'failed-precondition',
          'Session version could not be verified for AVS correction.',
        );
      }
      batch.update(
        sessionRef,
        sessionUpdate,
        { lastUpdateTime: sessionUpdateTime },
      );
    } else {
      batch.set(sessionRef, sessionUpdate, { merge: true });
    }

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
      correctedAt: FieldValue.serverTimestamp(),
      financeReconciliation,
      ...(av7ValidationLink
        ? {
            attendanceValidationCaseId: av7ValidationLink.caseId,
            attendanceValidationInputFingerprint: av7ValidationLink.fingerprint,
          }
        : {}),
    });

    if (av7ValidationLink) {
      const resolvedAt = FieldValue.serverTimestamp();
      batch.create(av7ValidationLink.resolutionRef, {
        schemaVersion: 1,
        brick: 'AV7',
        validationCaseId: av7ValidationLink.caseId,
        inputFingerprint: av7ValidationLink.fingerprint,
        decision: 'approved_correction',
        recommendedAction: av7ValidationLink.recommendedAction,
        sessionId,
        kidId,
        previousAttendance: canonicalizeAv7AttendanceStatus(previousStatus),
        correctedAttendance: av7ValidationLink.expectedNewStatus,
        attendanceCorrectionId: auditRef.id,
        actorUid: uid,
        actorName: correctedByName,
        actorEmail: correctedByEmail,
        reason,
        resolvedAt,
      });
      batch.update(
        av7ValidationLink.caseRef,
        {
          resolutionStatus: 'resolved',
          resolutionDecision: 'approved_correction',
          resolutionId: av7ValidationLink.resolutionRef.id,
          attendanceCorrectionId: auditRef.id,
          resolvedAction: av7ValidationLink.recommendedAction,
          resolvedAt,
          resolvedByUid: uid,
          resolvedByName: correctedByName,
          resolvedByEmail: correctedByEmail,
        },
        { lastUpdateTime: av7ValidationLink.caseUpdateTime },
      );
    }

    await batch.commit();

    if (attendanceChangedForAvs) {
      try {
        await markAttendanceValidationDirtySession(db, {
          sessionId,
          session: {
            ...session,
            attendance: nextAttendance,
          },
          reason: 'admin_attendance_correction',
        });
      } catch (error) {
        logger.warn('adminAttendanceCorrection: AVS dirty marker failed', {
          sessionId,
          errorName: error instanceof Error ? error.name : 'unknown',
          errorMessage: error instanceof Error ? error.message : 'unknown',
        });
      }
    }

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
      ...(av7ValidationLink
        ? {
            validationCaseId: av7ValidationLink.caseId,
            validationResolutionId: av7ValidationLink.resolutionRef.id,
          }
        : {}),
    };
  },
);
