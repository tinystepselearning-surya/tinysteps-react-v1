import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import callFunction from '../lib/callFunctions';
import type {
  DemoAttentionSpan,
  DemoChildLevelObserved,
  DemoClassType,
  DemoConversionStatus,
  CreateDemoSessionInput,
  DemoOutcome,
  DemoParentExpectation,
  DemoPhonicsAwareness,
  DemoReadingLevel,
  DemoRecommendedNextStep,
  DemoSession,
  DemoSessionStatus,
  DemoSpeakingConfidence,
} from '../types/models';

const DEMO_SESSIONS_COLLECTION = 'demoSessions';
const DEMO_SESSIONS_PRIVATE_COLLECTION = 'demoSessionsPrivate';

const timestampToMillis = (value: any): number => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
};

const sortByCreatedAtDesc = (a: DemoSession, b: DemoSession) =>
  timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt);

const toDemoSession = (id: string, data: Record<string, unknown>): DemoSession => ({
  id,
  ...(data as Omit<DemoSession, 'id'>),
});

export async function createDemoSession(input: CreateDemoSessionInput, createdBy: string): Promise<string> {
  const parentName = input.parentName.trim();
  const parentPhone = input.parentPhone.trim();
  const childName = input.childName.trim();
  const childGrade = input.childGrade.trim();
  const courseInterested = input.courseInterested.trim();
  const source = input.source?.trim() || null;
  const demoMode = input.demoMode?.trim() || null;
  const preferredDateTimeText = input.preferredDateTimeText.trim();

  if (!parentName || !parentPhone || !childName || !childGrade || !courseInterested || !preferredDateTimeText) {
    throw new Error('Please fill all required fields.');
  }

  const demoRef = doc(collection(db, DEMO_SESSIONS_COLLECTION));
  const privateRef = doc(db, DEMO_SESSIONS_PRIVATE_COLLECTION, demoRef.id);
  const batch = writeBatch(db);

  console.debug('[DemoSessions:create] preparing batch', {
    demoId: demoRef.id,
    createdBy,
    hasSource: !!source,
    hasDemoMode: !!demoMode,
  });

  batch.set(demoRef, {
    parentName,
    childName,
    childGrade,
    childAge: typeof input.childAge === 'number' ? input.childAge : null,
    courseInterested,
    source,
    demoMode,
    preferredDateTimeText,
    timezone: input.timezone?.trim() || null,
    adminNotes: input.adminNotes?.trim() || null,
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
    releasedAt: null,
    reopenedAt: null,
    rescheduledFromDemoId: null,
    rescheduledToDemoId: null,
    history: [
      {
        action: 'created',
        actorId: createdBy,
        actorName: null,
        atMs: Date.now(),
        note: 'Demo request created by admin',
      },
    ],
    conversionStatus: null,
    recommendedCourse: null,
    recommendedClassType: null,
    recommendedFrequency: null,
    feeDiscussed: null,
    followUpDate: null,
    completedAt: null,
    createdAt: serverTimestamp(),
    createdBy,
    lastUpdatedAt: serverTimestamp(),
    lastUpdatedBy: createdBy,
  });

  batch.set(privateRef, {
    parentPhone,
    createdAt: serverTimestamp(),
    createdBy,
    lastUpdatedAt: serverTimestamp(),
    lastUpdatedBy: createdBy,
  });

  try {
    console.debug('[DemoSessions:create] committing batch', {
      demoPath: `${DEMO_SESSIONS_COLLECTION}/${demoRef.id}`,
      privatePath: `${DEMO_SESSIONS_PRIVATE_COLLECTION}/${demoRef.id}`,
    });
    await batch.commit();
  } catch (error: any) {
    console.error('[DemoSessions:create] batch commit failed', {
      code: error?.code,
      message: error?.message,
    });
    throw error;
  }
  return demoRef.id;
}

export function listenAllDemoSessions(
  onData: (sessions: DemoSession[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, DEMO_SESSIONS_COLLECTION),
    (snapshot) => {
      const sessions = snapshot.docs
        .map((snap) => toDemoSession(snap.id, snap.data()))
        .sort(sortByCreatedAtDesc);
      onData(sessions);
    },
    (error) => onError?.(error as Error),
  );
}

export function listenOpenDemoSessions(
  onData: (sessions: DemoSession[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, DEMO_SESSIONS_COLLECTION), where('status', '==', 'open')),
    (snapshot) => {
      const sessions = snapshot.docs
        .map((snap) => toDemoSession(snap.id, snap.data()))
        .sort(sortByCreatedAtDesc);
      onData(sessions);
    },
    (error) => onError?.(error as Error),
  );
}

export function listenTeacherDemoSessions(
  teacherId: string,
  onData: (sessions: DemoSession[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, DEMO_SESSIONS_COLLECTION), where('assignedTeacherId', '==', teacherId)),
    (snapshot) => {
      const sessions = snapshot.docs
        .map((snap) => toDemoSession(snap.id, snap.data()))
        .sort(sortByCreatedAtDesc);
      onData(sessions);
    },
    (error) => onError?.(error as Error),
  );
}

export function listenDemoSessionPrivatePhones(
  onData: (phoneMap: Record<string, string>) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, DEMO_SESSIONS_PRIVATE_COLLECTION),
    (snapshot) => {
      const phoneMap: Record<string, string> = {};
      snapshot.docs.forEach((snap) => {
        const data = snap.data() as { parentPhone?: string };
        if (typeof data.parentPhone === 'string') {
          phoneMap[snap.id] = data.parentPhone;
        }
      });
      onData(phoneMap);
    },
    (error) => onError?.(error as Error),
  );
}

interface ClaimDemoSessionPayload {
  demoId: string;
  teacherConfirmedDate: string;
  teacherConfirmedTime: string;
  teacherPreDemoNote?: string;
}

interface UpdateDemoSessionSchedulePayload {
  demoId: string;
  teacherConfirmedDate: string;
  teacherConfirmedTime: string;
  teacherPreDemoNote?: string;
}

interface CompleteDemoSessionPayload {
  demoId: string;
  outcome: DemoOutcome;
  teacherRemarks: string;
  teacherRecommendation?: string;
  childLevelObserved?: DemoChildLevelObserved;
  readingLevel?: DemoReadingLevel;
  phonicsAwareness?: DemoPhonicsAwareness;
  speakingConfidence?: DemoSpeakingConfidence;
  attentionSpan?: DemoAttentionSpan;
  parentExpectation?: DemoParentExpectation;
  recommendedNextStep?: DemoRecommendedNextStep;
}

interface DemoSessionCallableResponse {
  ok: boolean;
  status: DemoSessionStatus;
  rescheduledDemoId?: string;
}

export async function claimDemoSession(payload: ClaimDemoSessionPayload): Promise<DemoSessionCallableResponse> {
  return callFunction<DemoSessionCallableResponse, ClaimDemoSessionPayload>('claimDemoSession', payload);
}

export async function updateDemoSessionSchedule(
  payload: UpdateDemoSessionSchedulePayload,
): Promise<DemoSessionCallableResponse> {
  return callFunction<DemoSessionCallableResponse, UpdateDemoSessionSchedulePayload>(
    'updateDemoSessionSchedule',
    payload,
  );
}

export async function completeDemoSession(
  payload: CompleteDemoSessionPayload,
): Promise<DemoSessionCallableResponse> {
  return callFunction<DemoSessionCallableResponse, CompleteDemoSessionPayload>('completeDemoSession', payload);
}

interface ReassignDemoSessionPayload {
  demoId: string;
  assignedTeacherId: string;
  assignedTeacherName?: string;
}

interface CancelDemoSessionPayload {
  demoId: string;
}

interface ReopenDemoSessionPayload {
  demoId: string;
}

interface ReleaseDemoSessionPayload {
  demoId: string;
}

interface DeleteDemoSessionPayload {
  demoId: string;
}

interface UpdateDemoConversionPayload {
  demoId: string;
  conversionStatus?: DemoConversionStatus | null;
  recommendedCourse?: string | null;
  recommendedClassType?: DemoClassType | null;
  recommendedFrequency?: string | null;
  feeDiscussed?: string | null;
  followUpDate?: string | null;
  updatedBy: string;
}

export async function reassignDemoSession(
  payload: ReassignDemoSessionPayload,
): Promise<DemoSessionCallableResponse> {
  return callFunction<DemoSessionCallableResponse, ReassignDemoSessionPayload>(
    'reassignDemoSession',
    payload,
  );
}

export async function cancelDemoSession(
  payload: CancelDemoSessionPayload,
): Promise<DemoSessionCallableResponse> {
  return callFunction<DemoSessionCallableResponse, CancelDemoSessionPayload>('cancelDemoSession', payload);
}

export async function reopenDemoSession(
  payload: ReopenDemoSessionPayload,
): Promise<DemoSessionCallableResponse> {
  return callFunction<DemoSessionCallableResponse, ReopenDemoSessionPayload>('reopenDemoSession', payload);
}

export async function releaseDemoSession(
  payload: ReleaseDemoSessionPayload,
): Promise<DemoSessionCallableResponse> {
  return callFunction<DemoSessionCallableResponse, ReleaseDemoSessionPayload>('releaseDemoSession', payload);
}

export async function deleteDemoSession(payload: DeleteDemoSessionPayload): Promise<{ ok: boolean; demoId: string }> {
  return callFunction<{ ok: boolean; demoId: string }, DeleteDemoSessionPayload>('deleteDemoSession', payload);
}

export async function updateDemoConversion(payload: UpdateDemoConversionPayload): Promise<void> {
  const demoRef = doc(db, DEMO_SESSIONS_COLLECTION, payload.demoId);
  await updateDoc(demoRef, {
    conversionStatus: payload.conversionStatus ?? null,
    recommendedCourse: payload.recommendedCourse ?? null,
    recommendedClassType: payload.recommendedClassType ?? null,
    recommendedFrequency: payload.recommendedFrequency ?? null,
    feeDiscussed: payload.feeDiscussed ?? null,
    followUpDate: payload.followUpDate ?? null,
    history: arrayUnion({
      action: 'follow_up_updated',
      actorId: payload.updatedBy,
      actorName: null,
      atMs: Date.now(),
      note: 'Admin updated conversion follow-up',
    }),
    lastUpdatedAt: serverTimestamp(),
    lastUpdatedBy: payload.updatedBy,
  });
}
