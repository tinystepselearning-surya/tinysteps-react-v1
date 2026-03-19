import * as admin from 'firebase-admin';
import { createHash } from 'crypto';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;
const DEMO_COMPLETION_PAYOUT_AMOUNT = 100;
const DEMO_ENROLLMENT_BONUS_AMOUNT = 100;
const DEMO_UNIQUE_KEYS_COLLECTION = 'demoSessionUniqueKeys';
const VALID_DEMO_OUTCOMES = new Set([
  'completed',
  'parent_no_show',
  'teacher_no_show',
  'reschedule_requested',
  'not_interested',
  'follow_up_needed',
]);
const VALID_CHILD_LEVELS = new Set([
  'below_grade_level',
  'near_grade_level',
  'at_grade_level',
  'above_grade_level',
]);
const VALID_READING_LEVELS = new Set([
  'non_reader',
  'beginner_reader',
  'developing_reader',
  'fluent_reader',
]);
const VALID_PHONICS_AWARENESS = new Set(['needs_support', 'basic', 'good', 'strong']);
const VALID_GRAMMAR_EVALUATION = new Set(['needs_support', 'basic', 'good', 'strong']);
const VALID_SPEAKING_CONFIDENCE = new Set(['very_low', 'low', 'medium', 'high']);
const VALID_ATTENTION_SPAN = new Set(['short', 'moderate', 'good', 'strong']);
const VALID_PARENT_EXPECTATIONS = new Set([
  'school_support',
  'phonics_improvement',
  'grammar_improvement',
  'reading_improvement',
  'speaking_confidence',
  'exam_preparation',
  'mixed_goals',
]);
const VALID_NEXT_STEPS = new Set([
  'start_trial_classes',
  'start_weekly_program',
  'one_to_one_plan',
  'group_batch_plan',
  'reassess_later',
]);

type DemoStatus = 'open' | 'assigned' | 'completed' | 'cancelled';
type DemoTrack = 'phonics' | 'grammar' | 'speaking';
const MAX_HISTORY_ENTRIES = 40;

interface DemoHistoryEntry {
  action: string;
  actorId?: string | null;
  actorName?: string | null;
  atMs: number;
  note?: string | null;
}

interface CallerProfile {
  uid: string;
  role: string;
  displayName: string;
  isAdmin: boolean;
  isTeacher: boolean;
  eligibleTracks: DemoTrack[];
}

const normalizeRole = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  const role = value.trim().toLowerCase();
  if (role === 'learningpartner') return 'learning-partner';
  return role;
};

const cleanRequiredText = (value: unknown, fieldName: string, maxLength = 500): string => {
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', `${fieldName} is required`);
  }
  const cleaned = value.trim();
  if (!cleaned) {
    throw new HttpsError('invalid-argument', `${fieldName} is required`);
  }
  if (cleaned.length > maxLength) {
    throw new HttpsError('invalid-argument', `${fieldName} is too long`);
  }
  return cleaned;
};

const cleanOptionalText = (value: unknown, maxLength = 2000): string | null => {
  if (value == null) return null;
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', 'Invalid text field');
  }
  const cleaned = value.trim();
  if (!cleaned) return null;
  if (cleaned.length > maxLength) {
    throw new HttpsError('invalid-argument', 'Text field is too long');
  }
  return cleaned;
};

const DATE_INPUT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const formatDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayDateInput = (): string => formatDateInput(new Date());

const cleanOptionalDateInput = (value: unknown, fieldName: string): string | null => {
  if (value == null) return null;
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', `${fieldName} is invalid`);
  }
  const cleaned = value.trim();
  if (!cleaned) return null;
  if (!DATE_INPUT_REGEX.test(cleaned)) {
    throw new HttpsError('invalid-argument', `${fieldName} must be in YYYY-MM-DD format`);
  }

  const [yearText, monthText, dayText] = cleaned.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    throw new HttpsError('invalid-argument', `${fieldName} is not a valid date`);
  }
  return cleaned;
};

const cleanOptionalEnum = (value: unknown, fieldName: string, allowedValues: Set<string>): string | null => {
  if (value == null) return null;
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', `${fieldName} is invalid`);
  }
  const cleaned = value.trim();
  if (!cleaned) return null;
  if (!allowedValues.has(cleaned)) {
    throw new HttpsError('invalid-argument', `${fieldName} is invalid`);
  }
  return cleaned;
};

const cleanOptionalAge = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new HttpsError('invalid-argument', 'childAge must be a valid number');
  }
  if (value < 0 || value > 25) {
    throw new HttpsError('invalid-argument', 'childAge is out of valid range');
  }
  return Math.round(value);
};

const pickOptionalText = (value: unknown, maxLength = 2000): string | null => {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  if (!cleaned) return null;
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === 'object' && value !== null && typeof (value as any).toDate === 'function') {
    const date = (value as any).toDate();
    return date instanceof Date && !isNaN(date.getTime()) ? date : null;
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
};

const monthKeyFromTimestampIST = (value: unknown): string => {
  const baseDate = toDate(value) || new Date();
  const istMs = baseDate.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const normalizeStatusValue = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
};

const toFiniteNumber = (value: unknown): number => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value)
      : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeTextForKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizePhoneForKey = (value: string): string => value.replace(/[^\d]/g, '');

const buildDemoDedupeKey = (childName: string, parentPhone: string): string => {
  const normalizedChild = normalizeTextForKey(childName);
  const normalizedPhone = normalizePhoneForKey(parentPhone);
  if (!normalizedChild || !normalizedPhone) {
    throw new HttpsError('invalid-argument', 'Child name and parent phone are required');
  }

  return createHash('sha256')
    .update(`${normalizedChild}|${normalizedPhone}`)
    .digest('hex');
};

const teacherEarningsMonthlyRef = (
  db: FirebaseFirestore.Firestore,
  teacherId: string,
  monthKey: string,
) => db.collection('teachers').doc(teacherId).collection('earnings').doc(monthKey);

const normalizeTrack = (value: string): DemoTrack | null => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes('phonics') || normalized.includes('reading')) return 'phonics';
  if (normalized.includes('grammar') || normalized.includes('writing')) return 'grammar';
  if (
    normalized.includes('speaking') ||
    normalized.includes('communication') ||
    normalized.includes('public speaking')
  ) {
    return 'speaking';
  }
  return null;
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') return [value];
  return [];
};

const normalizeHistory = (value: unknown): DemoHistoryEntry[] => {
  if (!Array.isArray(value)) return [];

  const history = value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      action: typeof item.action === 'string' ? item.action : '',
      actorId: typeof item.actorId === 'string' ? item.actorId : null,
      actorName: typeof item.actorName === 'string' ? item.actorName : null,
      atMs: typeof item.atMs === 'number' ? item.atMs : 0,
      note: typeof item.note === 'string' ? item.note : null,
    }))
    .filter((item) => item.action && item.atMs > 0);

  return history.slice(-MAX_HISTORY_ENTRIES);
};

const appendHistoryEntry = (
  existing: unknown,
  entry: DemoHistoryEntry,
): DemoHistoryEntry[] => [...normalizeHistory(existing).slice(-(MAX_HISTORY_ENTRIES - 1)), entry];

const makeHistoryEntry = (
  action: string,
  caller: CallerProfile,
  note?: string | null,
): DemoHistoryEntry => ({
  action,
  actorId: caller.uid,
  actorName: caller.displayName,
  atMs: Date.now(),
  note: note || null,
});

const assertAuth = (auth: { uid?: string } | null | undefined): string => {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in required');
  }
  return auth.uid;
};

async function getCallerProfile(auth: any): Promise<CallerProfile> {
  const uid = assertAuth(auth);
  const db = admin.firestore();
  const userSnap = await db.collection('users').doc(uid).get();

  if (!userSnap.exists) {
    throw new HttpsError('permission-denied', 'User profile not found');
  }

  const userData = userSnap.data() || {};
  const role = normalizeRole(userData.role) || normalizeRole(auth?.token?.role);

  if (!role) {
    throw new HttpsError('permission-denied', 'User role not found');
  }

  const displayName =
    pickOptionalText(userData.name, 120) ||
    pickOptionalText(userData.displayName, 120) ||
    pickOptionalText(auth?.token?.name, 120) ||
    pickOptionalText(auth?.token?.email, 120) ||
    'Teacher';

  const rawTrackValues = [
    ...toStringArray(userData.specialization),
    ...toStringArray(userData.specializations),
    ...toStringArray(userData.subjects),
  ];
  const eligibleTracks = Array.from(
    new Set(
      rawTrackValues
        .map((value) => normalizeTrack(value))
        .filter((value): value is DemoTrack => Boolean(value)),
    ),
  );

  return {
    uid,
    role,
    displayName,
    isAdmin: role === 'admin',
    isTeacher: role === 'teacher',
    eligibleTracks,
  };
}

interface DemoEarningWriteInput {
  demoId: string;
  teacherId: string;
  teacherName: string;
  amount: number;
  monthKey: string;
  earningId: string;
  earningSource: string;
  courseInterested: unknown;
  parentName: unknown;
  childName: unknown;
  rollupCountField: 'demoCompletedCount' | 'demoEnrollmentBonusCount';
}

async function createDemoTeacherEarningIfMissing(input: DemoEarningWriteInput): Promise<boolean> {
  const db = admin.firestore();
  const earningRef = db.collection('teacherEarnings').doc(input.earningId);
  const rollupRef = teacherEarningsMonthlyRef(db, input.teacherId, input.monthKey);
  const courseInterested = pickOptionalText(input.courseInterested, 120);
  const parentName = pickOptionalText(input.parentName, 120);
  const childName = pickOptionalText(input.childName, 120);

  return db.runTransaction(async (tx) => {
    const earningSnap = await tx.get(earningRef);
    if (earningSnap.exists) return false;

    tx.set(earningRef, {
      demoId: input.demoId,
      teacherId: input.teacherId,
      teacherName: input.teacherName,
      amount: input.amount,
      currency: 'INR',
      status: 'unpaid',
      monthKey: input.monthKey,
      source: input.earningSource,
      courseId: courseInterested || null,
      enrollmentId: null,
      kidId: null,
      parentName: parentName || null,
      childName: childName || null,
      earnedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    tx.set(
      rollupRef,
      {
        month: input.monthKey,
        totalEarnings: admin.firestore.FieldValue.increment(input.amount),
        pendingEarnings: admin.firestore.FieldValue.increment(input.amount),
        demoEarnings: admin.firestore.FieldValue.increment(input.amount),
        [input.rollupCountField]: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return true;
  });
}

export const onDemoSessionEarningsWrite = onDocumentWritten(
  {
    document: 'demoSessions/{demoId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (!change || !change.after.exists) return;

    const demoId = String(event.params.demoId || '').trim();
    if (!demoId) return;
    const before = change.before.exists ? change.before.data() || {} : {};
    const after = change.after.data() || {};

    const beforeStatus = normalizeStatusValue(before.status);
    const afterStatus = normalizeStatusValue(after.status);
    const beforeConversion = normalizeStatusValue(before.conversionStatus);
    const afterConversion = normalizeStatusValue(after.conversionStatus);

    const shouldCreditCompletion = beforeStatus !== 'completed' && afterStatus === 'completed';
    const shouldCreditEnrollment = beforeConversion !== 'enrolled' && afterConversion === 'enrolled';
    if (!shouldCreditCompletion && !shouldCreditEnrollment) return;

    const teacherId = pickOptionalText(after.assignedTeacherId, 120);
    const teacherName = pickOptionalText(after.assignedTeacherName, 120) || 'Teacher';

    if (!teacherId) {
      logger.warn('Skipping demo payout: assigned teacher missing', {
        demoId,
        shouldCreditCompletion,
        shouldCreditEnrollment,
      });
      return;
    }

    if (shouldCreditCompletion) {
      const completionMonthKey = monthKeyFromTimestampIST(
        after.completedAt || after.lastUpdatedAt || new Date(),
      );
      const completionEarningId = `demo_${demoId}_completion`;
      const createdCompletionEarning = await createDemoTeacherEarningIfMissing({
        demoId,
        teacherId,
        teacherName,
        amount: DEMO_COMPLETION_PAYOUT_AMOUNT,
        monthKey: completionMonthKey,
        earningId: completionEarningId,
        earningSource: 'demo_completed',
        courseInterested: after.courseInterested,
        parentName: after.parentName,
        childName: after.childName,
        rollupCountField: 'demoCompletedCount',
      });

      if (createdCompletionEarning) {
        logger.info('Demo completion earning credited', {
          demoId,
          teacherId,
          earningId: completionEarningId,
          amount: DEMO_COMPLETION_PAYOUT_AMOUNT,
          monthKey: completionMonthKey,
        });
      }
    }

    if (shouldCreditEnrollment) {
      const enrollmentMonthKey = monthKeyFromTimestampIST(after.lastUpdatedAt || new Date());
      const enrollmentEarningId = `demo_${demoId}_enrollment_bonus`;
      const createdEnrollmentEarning = await createDemoTeacherEarningIfMissing({
        demoId,
        teacherId,
        teacherName,
        amount: DEMO_ENROLLMENT_BONUS_AMOUNT,
        monthKey: enrollmentMonthKey,
        earningId: enrollmentEarningId,
        earningSource: 'demo_enrolled_bonus',
        courseInterested: after.courseInterested,
        parentName: after.parentName,
        childName: after.childName,
        rollupCountField: 'demoEnrollmentBonusCount',
      });

      if (createdEnrollmentEarning) {
        logger.info('Demo enrollment bonus credited', {
          demoId,
          teacherId,
          earningId: enrollmentEarningId,
          amount: DEMO_ENROLLMENT_BONUS_AMOUNT,
          monthKey: enrollmentMonthKey,
        });
      }
    }
  },
);

interface AdminUpsertDemoSessionRequest {
  demoId?: string;
  parentName: string;
  parentPhone: string;
  childName: string;
  childGrade: string;
  childAge?: number | null;
  courseInterested: string;
  source?: string | null;
  demoMode?: string | null;
  preferredDateTimeText: string;
  requestReceivedDate?: string | null;
  timezone?: string | null;
  adminNotes?: string | null;
}

interface AdminUpsertDemoSessionResponse {
  ok: boolean;
  demoId: string;
  status: DemoStatus;
}

const uniqueKeyRef = (db: FirebaseFirestore.Firestore, dedupeKey: string) =>
  db.collection(DEMO_UNIQUE_KEYS_COLLECTION).doc(dedupeKey);

const assertDemoUniqueAvailability = (
  uniqueSnap: FirebaseFirestore.DocumentSnapshot,
  dedupeKey: string,
  requestedDemoId?: string,
) => {
  if (!uniqueSnap.exists) return;
  const currentDemoId = pickOptionalText(uniqueSnap.data()?.demoId, 120);
  if (currentDemoId && requestedDemoId && currentDemoId === requestedDemoId) return;

  throw new HttpsError(
    'already-exists',
    currentDemoId
      ? `A demo for this child and parent phone already exists (ID: ${currentDemoId}).`
      : 'A demo for this child and parent phone already exists.',
    { dedupeKey, demoId: currentDemoId || null },
  );
};

export const adminCreateDemoSession = onCall<AdminUpsertDemoSessionRequest>(
  { region: REGION },
  async (request): Promise<AdminUpsertDemoSessionResponse> => {
    const caller = await getCallerProfile(request.auth);
    if (!caller.isAdmin) {
      throw new HttpsError('permission-denied', 'Only admin can create demo sessions');
    }

    const parentName = cleanRequiredText(request.data?.parentName, 'parentName', 120);
    const parentPhone = cleanRequiredText(request.data?.parentPhone, 'parentPhone', 60);
    const childName = cleanRequiredText(request.data?.childName, 'childName', 120);
    const childGrade = cleanRequiredText(request.data?.childGrade, 'childGrade', 60);
    const childAge = cleanOptionalAge(request.data?.childAge);
    const courseInterested = cleanRequiredText(request.data?.courseInterested, 'courseInterested', 120);
    const source = cleanOptionalText(request.data?.source, 120);
    const demoMode = cleanOptionalText(request.data?.demoMode, 120);
    const preferredDateTimeText = cleanRequiredText(
      request.data?.preferredDateTimeText,
      'preferredDateTimeText',
      500,
    );
    const requestReceivedDate =
      cleanOptionalDateInput(request.data?.requestReceivedDate, 'requestReceivedDate') ||
      todayDateInput();
    const timezone = cleanOptionalText(request.data?.timezone, 120);
    const adminNotes = cleanOptionalText(request.data?.adminNotes, 2000);
    const dedupeKey = buildDemoDedupeKey(childName, parentPhone);

    const db = admin.firestore();
    const demoRef = db.collection('demoSessions').doc();
    const privateRef = db.collection('demoSessionsPrivate').doc(demoRef.id);
    const dedupeRef = uniqueKeyRef(db, dedupeKey);

    await db.runTransaction(async (tx) => {
      const dedupeSnap = await tx.get(dedupeRef);
      assertDemoUniqueAvailability(dedupeSnap, dedupeKey);

      tx.set(demoRef, {
        parentName,
        childName,
        childGrade,
        childAge,
        courseInterested,
        source,
        demoMode,
        preferredDateTimeText,
        requestReceivedDate,
        timezone,
        adminNotes,
        dedupeKey,
        status: 'open',
        assignedTeacherId: null,
        assignedTeacherName: null,
        assignedAt: null,
        teacherConfirmedDate: null,
        teacherConfirmedTime: null,
        teacherPreDemoNote: null,
        outcome: null,
        teacherRemarks: null,
        teacherRecommendation: null,
        childLevelObserved: null,
        readingLevel: null,
        phonicsAwareness: null,
        grammarEvaluation: null,
        speakingConfidence: null,
        attentionSpan: null,
        parentExpectation: null,
        recommendedNextStep: null,
        releasedAt: null,
        reopenedAt: null,
        rescheduledFromDemoId: null,
        rescheduledToDemoId: null,
        history: [makeHistoryEntry('created', caller, 'Demo request created by admin')],
        conversionStatus: null,
        recommendedCourse: null,
        recommendedClassType: null,
        recommendedFrequency: null,
        feeDiscussed: null,
        followUpDate: null,
        followUpCallStatus: null,
        followUpCallCompletedAt: null,
        admissionNotConfirmedReason: null,
        completedAt: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: caller.uid,
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: caller.uid,
      });

      tx.set(privateRef, {
        parentPhone,
        parentPhoneKey: normalizePhoneForKey(parentPhone),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: caller.uid,
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: caller.uid,
      });

      tx.set(dedupeRef, {
        demoId: demoRef.id,
        dedupeKey,
        childNameKey: normalizeTextForKey(childName),
        parentPhoneKey: normalizePhoneForKey(parentPhone),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: caller.uid,
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: caller.uid,
      });
    });

    return {
      ok: true,
      demoId: demoRef.id,
      status: 'open',
    };
  },
);

export const adminUpdateDemoSessionDetails = onCall<AdminUpsertDemoSessionRequest>(
  { region: REGION },
  async (request): Promise<AdminUpsertDemoSessionResponse> => {
    const caller = await getCallerProfile(request.auth);
    if (!caller.isAdmin) {
      throw new HttpsError('permission-denied', 'Only admin can edit demo sessions');
    }

    const demoId = cleanRequiredText(request.data?.demoId, 'demoId', 120);
    const parentName = cleanRequiredText(request.data?.parentName, 'parentName', 120);
    const parentPhone = cleanRequiredText(request.data?.parentPhone, 'parentPhone', 60);
    const childName = cleanRequiredText(request.data?.childName, 'childName', 120);
    const childGrade = cleanRequiredText(request.data?.childGrade, 'childGrade', 60);
    const childAge = cleanOptionalAge(request.data?.childAge);
    const courseInterested = cleanRequiredText(request.data?.courseInterested, 'courseInterested', 120);
    const source = cleanOptionalText(request.data?.source, 120);
    const demoMode = cleanOptionalText(request.data?.demoMode, 120);
    const preferredDateTimeText = cleanRequiredText(
      request.data?.preferredDateTimeText,
      'preferredDateTimeText',
      500,
    );
    const requestReceivedDate = cleanOptionalDateInput(
      request.data?.requestReceivedDate,
      'requestReceivedDate',
    );
    const timezone = cleanOptionalText(request.data?.timezone, 120);
    const adminNotes = cleanOptionalText(request.data?.adminNotes, 2000);
    const newDedupeKey = buildDemoDedupeKey(childName, parentPhone);

    const db = admin.firestore();
    const demoRef = db.collection('demoSessions').doc(demoId);
    const privateRef = db.collection('demoSessionsPrivate').doc(demoId);
    let currentStatus: DemoStatus = 'open';

    await db.runTransaction(async (tx) => {
      const [demoSnap, privateSnap] = await Promise.all([tx.get(demoRef), tx.get(privateRef)]);
      if (!demoSnap.exists) {
        throw new HttpsError('not-found', 'Demo session not found');
      }

      const demo = demoSnap.data() as {
        status?: DemoStatus;
        childName?: string | null;
        dedupeKey?: string | null;
        history?: unknown;
      };
      currentStatus = demo.status || 'open';

      const existingPhone = pickOptionalText(privateSnap.data()?.parentPhone, 60);
      const existingChild = pickOptionalText(demo.childName, 120);
      let previousDedupeKey = pickOptionalText(demo.dedupeKey, 128);
      if (!previousDedupeKey && existingPhone && existingChild) {
        previousDedupeKey = buildDemoDedupeKey(existingChild, existingPhone);
      }

      const nextDedupeRef = uniqueKeyRef(db, newDedupeKey);
      const nextDedupeSnap = await tx.get(nextDedupeRef);
      assertDemoUniqueAvailability(nextDedupeSnap, newDedupeKey, demoId);

      tx.update(demoRef, {
        parentName,
        childName,
        childGrade,
        childAge,
        courseInterested,
        source,
        demoMode,
        preferredDateTimeText,
        requestReceivedDate,
        timezone,
        adminNotes,
        dedupeKey: newDedupeKey,
        history: appendHistoryEntry(
          demo.history,
          makeHistoryEntry('admin_details_updated', caller, 'Admin updated demo details'),
        ),
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: caller.uid,
      });

      tx.set(
        privateRef,
        {
          parentPhone,
          parentPhoneKey: normalizePhoneForKey(parentPhone),
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdatedBy: caller.uid,
        },
        { merge: true },
      );

      const dedupePayload: Record<string, unknown> = {
        demoId,
        dedupeKey: newDedupeKey,
        childNameKey: normalizeTextForKey(childName),
        parentPhoneKey: normalizePhoneForKey(parentPhone),
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: caller.uid,
      };
      if (!nextDedupeSnap.exists) {
        dedupePayload.createdAt = admin.firestore.FieldValue.serverTimestamp();
        dedupePayload.createdBy = caller.uid;
      }
      tx.set(nextDedupeRef, dedupePayload, { merge: true });

      if (previousDedupeKey && previousDedupeKey !== newDedupeKey) {
        const previousDedupeRef = uniqueKeyRef(db, previousDedupeKey);
        const previousDedupeSnap = await tx.get(previousDedupeRef);
        const previousMappedDemoId = pickOptionalText(previousDedupeSnap.data()?.demoId, 120);
        if (previousMappedDemoId === demoId) {
          tx.delete(previousDedupeRef);
        }
      }
    });

    return {
      ok: true,
      demoId,
      status: currentStatus,
    };
  },
);

interface ClaimDemoSessionRequest {
  demoId: string;
  teacherConfirmedDate: string;
  teacherConfirmedTime: string;
  teacherPreDemoNote?: string;
}

interface DemoSessionCallableResponse {
  ok: boolean;
  demoId: string;
  status: DemoStatus;
  rescheduledDemoId?: string;
}

export const claimDemoSession = onCall<ClaimDemoSessionRequest>(
  { region: REGION },
  async (request): Promise<DemoSessionCallableResponse> => {
    const caller = await getCallerProfile(request.auth);
    if (!caller.isTeacher) {
      throw new HttpsError('permission-denied', 'Only teachers can claim demos');
    }

    const demoId = cleanRequiredText(request.data?.demoId, 'demoId', 120);
    const teacherConfirmedDate = cleanRequiredText(
      request.data?.teacherConfirmedDate,
      'teacherConfirmedDate',
      50,
    );
    const teacherConfirmedTime = cleanRequiredText(
      request.data?.teacherConfirmedTime,
      'teacherConfirmedTime',
      50,
    );
    const teacherPreDemoNote = cleanOptionalText(request.data?.teacherPreDemoNote, 2000);

    const db = admin.firestore();
    const demoRef = db.collection('demoSessions').doc(demoId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(demoRef);
      if (!snap.exists) {
        throw new HttpsError('not-found', 'Demo session not found');
      }

      const demo = snap.data() as {
        status?: string;
        history?: unknown;
        courseInterested?: string | null;
      };
      if (demo.status !== 'open') {
        throw new HttpsError('failed-precondition', 'Demo is no longer available');
      }

      const demoTrack = normalizeTrack(demo.courseInterested || '');
      if (
        caller.eligibleTracks.length > 0 &&
        demoTrack &&
        !caller.eligibleTracks.includes(demoTrack)
      ) {
        throw new HttpsError(
          'permission-denied',
          `This demo is for ${demoTrack}. It is outside your eligible tracks.`,
        );
      }

      tx.update(demoRef, {
        status: 'assigned',
        assignedTeacherId: caller.uid,
        assignedTeacherName: caller.displayName,
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        teacherConfirmedDate,
        teacherConfirmedTime,
        teacherPreDemoNote,
        history: appendHistoryEntry(
          demo.history,
          makeHistoryEntry(
            'claimed',
            caller,
            `Confirmed for ${teacherConfirmedDate} ${teacherConfirmedTime}`,
          ),
        ),
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: caller.uid,
      });
    });

    return {
      ok: true,
      demoId,
      status: 'assigned',
    };
  },
);

interface UpdateDemoSessionScheduleRequest {
  demoId: string;
  teacherConfirmedDate: string;
  teacherConfirmedTime: string;
  teacherPreDemoNote?: string;
}

export const updateDemoSessionSchedule = onCall<UpdateDemoSessionScheduleRequest>(
  { region: REGION },
  async (request): Promise<DemoSessionCallableResponse> => {
    const caller = await getCallerProfile(request.auth);
    if (!caller.isTeacher && !caller.isAdmin) {
      throw new HttpsError('permission-denied', 'Only assigned teacher or admin can update timing');
    }

    const demoId = cleanRequiredText(request.data?.demoId, 'demoId', 120);
    const teacherConfirmedDate = cleanRequiredText(
      request.data?.teacherConfirmedDate,
      'teacherConfirmedDate',
      50,
    );
    const teacherConfirmedTime = cleanRequiredText(
      request.data?.teacherConfirmedTime,
      'teacherConfirmedTime',
      50,
    );
    const teacherPreDemoNote = cleanOptionalText(request.data?.teacherPreDemoNote, 2000);

    const db = admin.firestore();
    const demoRef = db.collection('demoSessions').doc(demoId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(demoRef);
      if (!snap.exists) {
        throw new HttpsError('not-found', 'Demo session not found');
      }

      const demo = snap.data() as {
        status?: string;
        assignedTeacherId?: string | null;
        history?: unknown;
      };

      if (demo.status !== 'assigned') {
        throw new HttpsError('failed-precondition', 'Only assigned demos can be updated');
      }

      if (!caller.isAdmin && demo.assignedTeacherId !== caller.uid) {
        throw new HttpsError('permission-denied', 'Only assigned teacher can update this demo');
      }

      tx.update(demoRef, {
        teacherConfirmedDate,
        teacherConfirmedTime,
        teacherPreDemoNote,
        history: appendHistoryEntry(
          demo.history,
          makeHistoryEntry(
            'schedule_updated',
            caller,
            `Updated to ${teacherConfirmedDate} ${teacherConfirmedTime}`,
          ),
        ),
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: caller.uid,
      });
    });

    return {
      ok: true,
      demoId,
      status: 'assigned',
    };
  },
);

interface CompleteDemoSessionRequest {
  demoId: string;
  outcome: string;
  teacherRemarks: string;
  teacherRecommendation?: string;
  childLevelObserved?: string;
  readingLevel?: string;
  phonicsAwareness?: string;
  grammarEvaluation?: string;
  speakingConfidence?: string;
  attentionSpan?: string;
  parentExpectation?: string;
  recommendedNextStep?: string;
}

export const completeDemoSession = onCall<CompleteDemoSessionRequest>(
  { region: REGION },
  async (request): Promise<DemoSessionCallableResponse> => {
    const caller = await getCallerProfile(request.auth);
    if (!caller.isTeacher && !caller.isAdmin) {
      throw new HttpsError('permission-denied', 'Only assigned teacher or admin can complete demo');
    }

    const demoId = cleanRequiredText(request.data?.demoId, 'demoId', 120);
    const outcome = cleanRequiredText(request.data?.outcome, 'outcome', 80);
    const teacherRemarks = cleanRequiredText(request.data?.teacherRemarks, 'teacherRemarks', 4000);
    const teacherRecommendation = cleanOptionalText(request.data?.teacherRecommendation, 2000);
    const childLevelObserved = cleanOptionalEnum(
      request.data?.childLevelObserved,
      'childLevelObserved',
      VALID_CHILD_LEVELS,
    );
    const readingLevel = cleanOptionalEnum(
      request.data?.readingLevel,
      'readingLevel',
      VALID_READING_LEVELS,
    );
    const phonicsAwareness = cleanOptionalEnum(
      request.data?.phonicsAwareness,
      'phonicsAwareness',
      VALID_PHONICS_AWARENESS,
    );
    const grammarEvaluation = cleanOptionalEnum(
      request.data?.grammarEvaluation,
      'grammarEvaluation',
      VALID_GRAMMAR_EVALUATION,
    );
    const speakingConfidence = cleanOptionalEnum(
      request.data?.speakingConfidence,
      'speakingConfidence',
      VALID_SPEAKING_CONFIDENCE,
    );
    const attentionSpan = cleanOptionalEnum(
      request.data?.attentionSpan,
      'attentionSpan',
      VALID_ATTENTION_SPAN,
    );
    const parentExpectation = cleanOptionalEnum(
      request.data?.parentExpectation,
      'parentExpectation',
      VALID_PARENT_EXPECTATIONS,
    );
    const recommendedNextStep = cleanOptionalEnum(
      request.data?.recommendedNextStep,
      'recommendedNextStep',
      VALID_NEXT_STEPS,
    );

    if (!VALID_DEMO_OUTCOMES.has(outcome)) {
      throw new HttpsError('invalid-argument', 'Invalid demo outcome');
    }

    const db = admin.firestore();
    const demoRef = db.collection('demoSessions').doc(demoId);
    const privateRef = db.collection('demoSessionsPrivate').doc(demoId);
    let rescheduledDemoId: string | null = null;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(demoRef);
      if (!snap.exists) {
        throw new HttpsError('not-found', 'Demo session not found');
      }

      const demo = snap.data() as {
        status?: string;
        assignedTeacherId?: string | null;
        history?: unknown;
        parentName?: string | null;
        childName?: string | null;
        dedupeKey?: string | null;
        childGrade?: string | null;
        childAge?: number | null;
        courseInterested?: string | null;
        source?: string | null;
        demoMode?: string | null;
        preferredDateTimeText?: string | null;
        timezone?: string | null;
        adminNotes?: string | null;
        rescheduledFromDemoId?: string | null;
      };

      if (demo.status !== 'assigned') {
        throw new HttpsError('failed-precondition', 'Only assigned demos can be completed');
      }

      if (!caller.isAdmin && demo.assignedTeacherId !== caller.uid) {
        throw new HttpsError('permission-denied', 'Only assigned teacher can complete this demo');
      }

      const baseHistory = appendHistoryEntry(
        demo.history,
        makeHistoryEntry('completed', caller, `Outcome: ${outcome}`),
      );

      const updatePayload: Record<string, unknown> = {
        status: 'completed',
        outcome,
        teacherRemarks,
        teacherRecommendation,
        childLevelObserved,
        readingLevel,
        phonicsAwareness,
        grammarEvaluation,
        speakingConfidence,
        attentionSpan,
        parentExpectation,
        recommendedNextStep,
        history: baseHistory,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: caller.uid,
      };

      if (outcome === 'reschedule_requested') {
        const followUpDemoRef = db.collection('demoSessions').doc();
        const followUpPrivateRef = db.collection('demoSessionsPrivate').doc(followUpDemoRef.id);
        const privateSnap = await tx.get(privateRef);
        const privateData = privateSnap.data() as { parentPhone?: string } | undefined;
        const parentPhone = pickOptionalText(privateData?.parentPhone, 60);
        const childNameForKey = pickOptionalText(demo.childName, 120) || 'child';
        let followUpDedupeKey = pickOptionalText(demo.dedupeKey, 128);
        if (!followUpDedupeKey && parentPhone) {
          try {
            followUpDedupeKey = buildDemoDedupeKey(childNameForKey, parentPhone);
          } catch (error) {
            logger.warn('Failed to derive dedupe key for rescheduled demo', {
              demoId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        const followUpPreferredSlot =
          pickOptionalText(demo.preferredDateTimeText, 500) || 'Reschedule requested by parent';
        const followUpNote = `Auto-created from reschedule of demo ${demoId}.`;
        const carryAdminNotes = pickOptionalText(demo.adminNotes, 2000);
        const combinedAdminNotes = carryAdminNotes
          ? `${carryAdminNotes}\n${followUpNote}`
          : followUpNote;

        tx.set(followUpDemoRef, {
          parentName: pickOptionalText(demo.parentName, 120) || 'Parent',
          childName: pickOptionalText(demo.childName, 120) || 'Child',
          childGrade: pickOptionalText(demo.childGrade, 60) || 'N/A',
          childAge: typeof demo.childAge === 'number' ? demo.childAge : null,
          courseInterested: pickOptionalText(demo.courseInterested, 120) || 'General',
          source: pickOptionalText(demo.source, 120),
          demoMode: pickOptionalText(demo.demoMode, 120),
          preferredDateTimeText: followUpPreferredSlot,
          requestReceivedDate: todayDateInput(),
          timezone: pickOptionalText(demo.timezone, 120),
          adminNotes: combinedAdminNotes,
          dedupeKey: followUpDedupeKey || null,
          status: 'open',
          assignedTeacherId: null,
          assignedTeacherName: null,
          assignedAt: null,
          teacherConfirmedDate: null,
          teacherConfirmedTime: null,
          teacherPreDemoNote: null,
          outcome: null,
          teacherRemarks: null,
          teacherRecommendation: null,
          childLevelObserved: null,
          readingLevel: null,
          phonicsAwareness: null,
          grammarEvaluation: null,
          speakingConfidence: null,
          attentionSpan: null,
          parentExpectation: null,
          recommendedNextStep: null,
          releasedAt: null,
          reopenedAt: null,
          rescheduledFromDemoId: demoId,
          rescheduledToDemoId: null,
          history: [
            makeHistoryEntry('created', caller, `Follow-up demo created from reschedule of ${demoId}`),
          ],
          conversionStatus: null,
          recommendedCourse: null,
          recommendedClassType: null,
          recommendedFrequency: null,
          feeDiscussed: null,
          followUpDate: null,
          followUpCallStatus: null,
          followUpCallCompletedAt: null,
          admissionNotConfirmedReason: null,
          completedAt: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: caller.uid,
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdatedBy: caller.uid,
        });

        if (parentPhone) {
          tx.set(followUpPrivateRef, {
            parentPhone,
            parentPhoneKey: normalizePhoneForKey(parentPhone),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: caller.uid,
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastUpdatedBy: caller.uid,
          });
        }

        if (followUpDedupeKey) {
          const followUpDedupeRef = uniqueKeyRef(db, followUpDedupeKey);
          tx.set(
            followUpDedupeRef,
            {
              demoId: followUpDemoRef.id,
              dedupeKey: followUpDedupeKey,
              childNameKey: normalizeTextForKey(childNameForKey),
              parentPhoneKey: parentPhone ? normalizePhoneForKey(parentPhone) : null,
              lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
              lastUpdatedBy: caller.uid,
            },
            { merge: true },
          );
        }

        updatePayload.rescheduledToDemoId = followUpDemoRef.id;
        updatePayload.history = appendHistoryEntry(
          baseHistory,
          makeHistoryEntry(
            'reschedule_created',
            caller,
            `Created follow-up demo ${followUpDemoRef.id}`,
          ),
        );
        rescheduledDemoId = followUpDemoRef.id;
      } else {
        updatePayload.rescheduledToDemoId = null;
      }

      tx.update(demoRef, updatePayload);
    });

    return {
      ok: true,
      demoId,
      status: 'completed',
      rescheduledDemoId: rescheduledDemoId || undefined,
    };
  },
);

interface ReassignDemoSessionRequest {
  demoId: string;
  assignedTeacherId: string;
  assignedTeacherName?: string;
}

async function resolveTeacherProfile(
  db: FirebaseFirestore.Firestore,
  assignedTeacherId: string,
  assignedTeacherName?: string,
) {
  const teacherRef = db.collection('users').doc(assignedTeacherId);
  const teacherSnap = await teacherRef.get();
  if (!teacherSnap.exists) {
    throw new HttpsError('not-found', 'Teacher not found');
  }

  const teacherData = teacherSnap.data() || {};
  const teacherRole = normalizeRole(teacherData.role);
  if (teacherRole !== 'teacher') {
    throw new HttpsError('invalid-argument', 'assignedTeacherId must belong to a teacher');
  }

  const fallbackName =
    pickOptionalText(teacherData.name, 120) ||
    pickOptionalText(teacherData.displayName, 120) ||
    pickOptionalText(teacherData.email, 120) ||
    'Teacher';

  return pickOptionalText(assignedTeacherName, 120) || fallbackName;
}

export const reassignDemoSession = onCall<ReassignDemoSessionRequest>(
  { region: REGION },
  async (request): Promise<DemoSessionCallableResponse> => {
    const caller = await getCallerProfile(request.auth);
    if (!caller.isAdmin) {
      throw new HttpsError('permission-denied', 'Only admin can reassign demos');
    }

    const demoId = cleanRequiredText(request.data?.demoId, 'demoId', 120);
    const assignedTeacherId = cleanRequiredText(
      request.data?.assignedTeacherId,
      'assignedTeacherId',
      120,
    );

    const db = admin.firestore();
    const nextTeacherName = await resolveTeacherProfile(
      db,
      assignedTeacherId,
      request.data?.assignedTeacherName,
    );
    const demoRef = db.collection('demoSessions').doc(demoId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(demoRef);
      if (!snap.exists) {
        throw new HttpsError('not-found', 'Demo session not found');
      }

      const demo = snap.data() as { status?: string; history?: unknown };
      if (demo.status !== 'assigned') {
        throw new HttpsError('failed-precondition', 'Only assigned demos can be reassigned');
      }

      tx.update(demoRef, {
        assignedTeacherId,
        assignedTeacherName: nextTeacherName,
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        history: appendHistoryEntry(
          demo.history,
          makeHistoryEntry('reassigned', caller, `Reassigned to ${nextTeacherName}`),
        ),
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: caller.uid,
      });
    });

    return {
      ok: true,
      demoId,
      status: 'assigned',
    };
  },
);

interface CancelDemoSessionRequest {
  demoId: string;
}

export const cancelDemoSession = onCall<CancelDemoSessionRequest>(
  { region: REGION },
  async (request): Promise<DemoSessionCallableResponse> => {
    const caller = await getCallerProfile(request.auth);
    if (!caller.isAdmin) {
      throw new HttpsError('permission-denied', 'Only admin can cancel demos');
    }

    const demoId = cleanRequiredText(request.data?.demoId, 'demoId', 120);
    const db = admin.firestore();
    const demoRef = db.collection('demoSessions').doc(demoId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(demoRef);
      if (!snap.exists) {
        throw new HttpsError('not-found', 'Demo session not found');
      }

      const demo = snap.data() as { history?: unknown };

      tx.update(demoRef, {
        status: 'cancelled',
        history: appendHistoryEntry(demo.history, makeHistoryEntry('cancelled', caller, 'Demo cancelled')),
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: caller.uid,
      });
    });

    return {
      ok: true,
      demoId,
      status: 'cancelled',
    };
  },
);

interface ReleaseDemoSessionRequest {
  demoId: string;
}

export const releaseDemoSession = onCall<ReleaseDemoSessionRequest>(
  { region: REGION },
  async (request): Promise<DemoSessionCallableResponse> => {
    const caller = await getCallerProfile(request.auth);
    if (!caller.isAdmin) {
      throw new HttpsError('permission-denied', 'Only admin can release demos');
    }

    const demoId = cleanRequiredText(request.data?.demoId, 'demoId', 120);
    const db = admin.firestore();
    const demoRef = db.collection('demoSessions').doc(demoId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(demoRef);
      if (!snap.exists) {
        throw new HttpsError('not-found', 'Demo session not found');
      }

      const demo = snap.data() as { status?: string; history?: unknown };
      if (demo.status !== 'assigned') {
        throw new HttpsError('failed-precondition', 'Only assigned demos can be released');
      }

      tx.update(demoRef, {
        status: 'open',
        assignedTeacherId: null,
        assignedTeacherName: null,
        assignedAt: null,
        teacherConfirmedDate: null,
        teacherConfirmedTime: null,
        teacherPreDemoNote: null,
        releasedAt: admin.firestore.FieldValue.serverTimestamp(),
        history: appendHistoryEntry(
          demo.history,
          makeHistoryEntry('released', caller, 'Released back to open pool'),
        ),
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: caller.uid,
      });
    });

    return {
      ok: true,
      demoId,
      status: 'open',
    };
  },
);

interface DeleteDemoSessionRequest {
  demoId: string;
}

export const deleteDemoSession = onCall<DeleteDemoSessionRequest>(
  { region: REGION },
  async (request): Promise<{ ok: boolean; demoId: string }> => {
    const caller = await getCallerProfile(request.auth);
    if (!caller.isAdmin) {
      throw new HttpsError('permission-denied', 'Only admin can delete demos');
    }

    const demoId = cleanRequiredText(request.data?.demoId, 'demoId', 120);
    const db = admin.firestore();
    const demoRef = db.collection('demoSessions').doc(demoId);
    const privateRef = db.collection('demoSessionsPrivate').doc(demoId);
    const earningsQuery = db.collection('teacherEarnings').where('demoId', '==', demoId);

    const deletedEarningsCount = await db.runTransaction(async (tx) => {
      const demoSnap = await tx.get(demoRef);
      if (!demoSnap.exists) {
        throw new HttpsError('not-found', 'Demo session not found');
      }

      let deletedCount = 0;
      const demoData = demoSnap.data() as { dedupeKey?: string | null };
      const dedupeKey = pickOptionalText(demoData.dedupeKey, 128);

      const earningsSnap = await tx.get(earningsQuery);
      for (const earningDoc of earningsSnap.docs) {
        const earning = earningDoc.data() || {};
        const teacherId = pickOptionalText(earning.teacherId, 120);
        const amount = Math.max(toFiniteNumber(earning.amount), 0);
        const monthKey =
          pickOptionalText(earning.monthKey, 20) ||
          monthKeyFromTimestampIST(earning.earnedAt || earning.createdAt || new Date());
        const source = normalizeStatusValue(earning.source);
        const status = normalizeStatusValue(earning.status);
        const paidAmountRaw = Math.max(toFiniteNumber(earning.paidAmount), 0);
        const paidAmount =
          paidAmountRaw > 0
            ? Math.min(amount, paidAmountRaw)
            : status === 'paid'
            ? amount
            : 0;
        const pendingAmount = Math.max(amount - paidAmount, 0);

        if (teacherId && amount > 0) {
          const rollupRef = teacherEarningsMonthlyRef(db, teacherId, monthKey);
          const rollupPatch: Record<string, any> = {
            month: monthKey,
            totalEarnings: admin.firestore.FieldValue.increment(-amount),
            demoEarnings: admin.firestore.FieldValue.increment(-amount),
            pendingEarnings: admin.firestore.FieldValue.increment(-pendingAmount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          if (source === 'demo_completed') {
            rollupPatch.demoCompletedCount = admin.firestore.FieldValue.increment(-1);
          }
          if (source === 'demo_enrolled_bonus') {
            rollupPatch.demoEnrollmentBonusCount = admin.firestore.FieldValue.increment(-1);
          }

          tx.set(rollupRef, rollupPatch, { merge: true });
        }

        tx.delete(earningDoc.ref);
        deletedCount += 1;
      }

      tx.delete(demoRef);
      tx.delete(privateRef);

      if (dedupeKey) {
        const dedupeRef = uniqueKeyRef(db, dedupeKey);
        const dedupeSnap = await tx.get(dedupeRef);
        const mappedDemoId = pickOptionalText(dedupeSnap.data()?.demoId, 120);
        if (mappedDemoId === demoId) {
          tx.delete(dedupeRef);
        }
      }

      return deletedCount;
    });

    logger.info('Demo session permanently deleted with linked earnings cleanup', {
      demoId,
      deletedEarningsCount,
      deletedBy: caller.uid,
    });

    return {
      ok: true,
      demoId,
    };
  },
);

interface ReopenDemoSessionRequest {
  demoId: string;
}

export const reopenDemoSession = onCall<ReopenDemoSessionRequest>(
  { region: REGION },
  async (request): Promise<DemoSessionCallableResponse> => {
    const caller = await getCallerProfile(request.auth);
    if (!caller.isAdmin) {
      throw new HttpsError('permission-denied', 'Only admin can reopen demos');
    }

    const demoId = cleanRequiredText(request.data?.demoId, 'demoId', 120);
    const db = admin.firestore();
    const demoRef = db.collection('demoSessions').doc(demoId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(demoRef);
      if (!snap.exists) {
        throw new HttpsError('not-found', 'Demo session not found');
      }

      const demo = snap.data() as { status?: string; history?: unknown };
      if (demo.status !== 'completed' && demo.status !== 'cancelled') {
        throw new HttpsError(
          'failed-precondition',
          'Only completed or cancelled demos can be reopened',
        );
      }

      tx.update(demoRef, {
        status: 'open',
        assignedTeacherId: null,
        assignedTeacherName: null,
        assignedAt: null,
        teacherConfirmedDate: null,
        teacherConfirmedTime: null,
        teacherPreDemoNote: null,
        outcome: null,
        teacherRemarks: null,
        teacherRecommendation: null,
        childLevelObserved: null,
        readingLevel: null,
        phonicsAwareness: null,
        grammarEvaluation: null,
        speakingConfidence: null,
        attentionSpan: null,
        parentExpectation: null,
        recommendedNextStep: null,
        conversionStatus: null,
        recommendedCourse: null,
        recommendedClassType: null,
        recommendedFrequency: null,
        feeDiscussed: null,
        followUpDate: null,
        followUpCallStatus: null,
        followUpCallCompletedAt: null,
        admissionNotConfirmedReason: null,
        completedAt: null,
        rescheduledToDemoId: null,
        reopenedAt: admin.firestore.FieldValue.serverTimestamp(),
        history: appendHistoryEntry(demo.history, makeHistoryEntry('reopened', caller, 'Demo reopened')),
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: caller.uid,
      });
    });

    return {
      ok: true,
      demoId,
      status: 'open',
    };
  },
);
