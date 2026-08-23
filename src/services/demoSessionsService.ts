import {
  collection,
  documentId,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import callFunction from '../lib/callFunctions';
import type {
  DemoAttentionSpan,
  DemoChildLevelObserved,
  DemoClassType,
  DemoConversionStatus,
  DemoFollowUpCallStatus,
  CreateDemoSessionInput,
  DemoOutcome,
  DemoGrammarEvaluation,
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
const FIRESTORE_IN_QUERY_CHUNK_SIZE = 30;

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

const chunkUniqueIds = (values: string[], size = FIRESTORE_IN_QUERY_CHUNK_SIZE): string[][] => {
  const unique = Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
  const chunks: string[][] = [];
  for (let index = 0; index < unique.length; index += size) {
    chunks.push(unique.slice(index, index + size));
  }
  return chunks;
};

export interface DemoPhoneConflictCheckResult {
  ok: boolean;
  normalizedPhone: string;
  hasConflicts: boolean;
  counts: {
    demoRequests: number;
    leads: number;
    parentProfiles: number;
    enrollments: number;
  };
  samples: {
    demoIds: string[];
    leadIds: string[];
    parentIds: string[];
    enrollmentIds: string[];
  };
}

export async function checkDemoPhoneConflicts(parentPhone: string): Promise<DemoPhoneConflictCheckResult> {
  const cleanedPhone = parentPhone.trim();
  if (!cleanedPhone) {
    throw new Error('Parent phone is required.');
  }
  return callFunction<DemoPhoneConflictCheckResult, { parentPhone: string }>(
    'adminCheckDemoPhoneConflicts',
    { parentPhone: cleanedPhone },
  );
}

export async function createDemoSession(
  input: CreateDemoSessionInput & { leadId?: string | null },
  createdBy: string,
): Promise<string> {
  const parentName = input.parentName.trim();
  const parentPhone = input.parentPhone.trim();
  const childName = input.childName.trim();
  const childGrade = input.childGrade.trim();
  const leadType = input.leadType === 'Group Class' ? 'Group Class' : '1:1';
  const courseInterested = input.courseInterested.trim();
  const source = input.source?.trim() || null;
  const demoMode = input.demoMode?.trim() || null;
  const preferredDateTimeText = input.preferredDateTimeText.trim();
  const requestReceivedDate = input.requestReceivedDate?.trim() || null;

  if (!parentName || !parentPhone || !childName || !childGrade || !courseInterested || !preferredDateTimeText) {
    throw new Error('Please fill all required fields.');
  }

  void createdBy;
  const result = await callFunction<
    DemoSessionCallableResponse & { demoId: string },
    CreateDemoSessionInput & { leadId?: string | null }
  >(
    'adminCreateDemoSession',
    {
      parentName,
      parentPhone,
      forceCreate: input.forceCreate === true,
      childName,
      childGrade,
      leadType,
      childAge: typeof input.childAge === 'number' ? input.childAge : null,
      courseInterested,
      source,
      demoMode,
      preferredDateTimeText,
      requestReceivedDate,
      timezone: input.timezone?.trim() || null,
      adminNotes: input.adminNotes?.trim() || null,
      leadId: input.leadId?.trim() || null,
    },
  );
  return result.demoId;
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

/**
 * Realtime listener for only the demo documents currently needed by an operational UI.
 * The simple Leads & Enquiries workspace uses this instead of listening to the complete
 * historical demoSessions collection.
 */
export function listenDemoSessionsByIds(
  demoIds: string[],
  onData: (sessions: DemoSession[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const chunks = chunkUniqueIds(demoIds);
  if (chunks.length === 0) {
    onData([]);
    return () => {};
  }

  const rowsByChunk = new Map<number, DemoSession[]>();
  const readyChunks = new Set<number>();
  const publish = () => {
    if (readyChunks.size < chunks.length) return;
    const merged = new Map<string, DemoSession>();
    rowsByChunk.forEach((rows) => rows.forEach((row) => merged.set(row.id, row)));
    onData(Array.from(merged.values()).sort(sortByCreatedAtDesc));
  };

  const stops = chunks.map((ids, chunkIndex) =>
    onSnapshot(
      query(
        collection(db, DEMO_SESSIONS_COLLECTION),
        where(documentId(), 'in', ids),
      ),
      (snapshot) => {
        rowsByChunk.set(
          chunkIndex,
          snapshot.docs.map((snap) => toDemoSession(snap.id, snap.data())),
        );
        readyChunks.add(chunkIndex);
        publish();
      },
      (error) => {
        rowsByChunk.set(chunkIndex, []);
        readyChunks.add(chunkIndex);
        onError?.(error as Error);
        publish();
      },
    ),
  );

  return () => stops.forEach((stop) => stop());
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

/**
 * Private demo details are intentionally scoped to visible/current demo IDs. This keeps
 * phone identity recovery available for legacy edge cases without subscribing admins to
 * every historical private demo document.
 */
export function listenDemoSessionPrivatePhonesByIds(
  demoIds: string[],
  onData: (phoneMap: Record<string, string>) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const chunks = chunkUniqueIds(demoIds);
  if (chunks.length === 0) {
    onData({});
    return () => {};
  }

  const phoneMapsByChunk = new Map<number, Record<string, string>>();
  const readyChunks = new Set<number>();
  const publish = () => {
    if (readyChunks.size < chunks.length) return;
    const merged: Record<string, string> = {};
    phoneMapsByChunk.forEach((phoneMap) => Object.assign(merged, phoneMap));
    onData(merged);
  };

  const stops = chunks.map((ids, chunkIndex) =>
    onSnapshot(
      query(
        collection(db, DEMO_SESSIONS_PRIVATE_COLLECTION),
        where(documentId(), 'in', ids),
      ),
      (snapshot) => {
        const phoneMap: Record<string, string> = {};
        snapshot.docs.forEach((snap) => {
          const data = snap.data() as { parentPhone?: string };
          if (typeof data.parentPhone === 'string') phoneMap[snap.id] = data.parentPhone;
        });
        phoneMapsByChunk.set(chunkIndex, phoneMap);
        readyChunks.add(chunkIndex);
        publish();
      },
      (error) => {
        phoneMapsByChunk.set(chunkIndex, {});
        readyChunks.add(chunkIndex);
        onError?.(error as Error);
        publish();
      },
    ),
  );

  return () => stops.forEach((stop) => stop());
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
  grammarEvaluation?: DemoGrammarEvaluation;
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
  followUpCallStatus?: DemoFollowUpCallStatus | null;
  followUpCallCompletedAt?: string | null;
  admissionNotConfirmedReason?: string | null;
  idempotencyKey?: string;
}

interface UpdateDemoSessionAdminDetailsPayload {
  demoId: string;
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

export async function updateDemoSessionAdminDetails(
  payload: UpdateDemoSessionAdminDetailsPayload,
): Promise<DemoSessionCallableResponse> {
  return callFunction<DemoSessionCallableResponse, UpdateDemoSessionAdminDetailsPayload>(
    'adminUpdateDemoSessionDetails',
    payload,
  );
}

export async function updateDemoConversion(payload: UpdateDemoConversionPayload): Promise<void> {
  const idempotencyKey =
    payload.idempotencyKey ||
    `conversion_${payload.demoId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await callFunction<DemoSessionCallableResponse, UpdateDemoConversionPayload>(
    'adminUpdateDemoConversion',
    {
      ...payload,
      idempotencyKey,
    },
  );
}
