import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
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
const VALID_SPEAKING_CONFIDENCE = new Set(['very_low', 'low', 'medium', 'high']);
const VALID_ATTENTION_SPAN = new Set(['short', 'moderate', 'good', 'strong']);
const VALID_PARENT_EXPECTATIONS = new Set([
  'school_support',
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

const pickOptionalText = (value: unknown, maxLength = 2000): string | null => {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  if (!cleaned) return null;
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
};

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
        throw new HttpsError('failed-precondition', 'Only assigned demos can be completed');
      }

      if (!caller.isAdmin && demo.assignedTeacherId !== caller.uid) {
        throw new HttpsError('permission-denied', 'Only assigned teacher can complete this demo');
      }

      tx.update(demoRef, {
        status: 'completed',
        outcome,
        teacherRemarks,
        teacherRecommendation,
        childLevelObserved,
        readingLevel,
        phonicsAwareness,
        speakingConfidence,
        attentionSpan,
        parentExpectation,
        recommendedNextStep,
        history: appendHistoryEntry(
          demo.history,
          makeHistoryEntry('completed', caller, `Outcome: ${outcome}`),
        ),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: caller.uid,
      });
    });

    return {
      ok: true,
      demoId,
      status: 'completed',
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

    await db.runTransaction(async (tx) => {
      const demoSnap = await tx.get(demoRef);
      if (!demoSnap.exists) {
        throw new HttpsError('not-found', 'Demo session not found');
      }

      tx.delete(demoRef);
      tx.delete(privateRef);
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
        speakingConfidence: null,
        attentionSpan: null,
        parentExpectation: null,
        recommendedNextStep: null,
        completedAt: null,
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
