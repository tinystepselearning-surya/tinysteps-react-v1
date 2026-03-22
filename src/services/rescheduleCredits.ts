import { WriteBatch, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { TeacherSession } from '../types/Teacher';

export type AttendanceEntryLike =
  | string
  | {
      status?: string;
      notes?: string;
      [key: string]: any;
    }
  | null
  | undefined;

export type AttendanceMapLike = Record<string, AttendanceEntryLike>;

export type RescheduleCreditStatus = 'open' | 'scheduled' | 'consumed' | 'cancelled';

type SessionLike = Partial<TeacherSession> & Record<string, any>;

const toStatus = (entry: AttendanceEntryLike): string => {
  if (!entry) return '';
  if (typeof entry === 'string') return entry.trim().toLowerCase();
  if (typeof entry?.status === 'string') return entry.status.trim().toLowerCase();
  return '';
};

const toNote = (entry: AttendanceEntryLike): string => {
  if (!entry || typeof entry === 'string') return '';
  if (typeof entry?.notes === 'string') return entry.notes.trim();
  return '';
};

export const hasPresentOrLateAttendance = (attendance: AttendanceMapLike): boolean =>
  Object.values(attendance).some((entry) => {
    const status = toStatus(entry);
    return status === 'present' || status === 'late';
  });

export const hasRescheduleAttendance = (attendance: AttendanceMapLike): boolean =>
  Object.values(attendance).some((entry) => toStatus(entry) === 'reschedule_requested');

export const getKidIdsByAttendanceStatus = (
  attendance: AttendanceMapLike,
  status: string,
): string[] => {
  const normalized = String(status || '').trim().toLowerCase();
  return Object.entries(attendance)
    .filter(([, entry]) => toStatus(entry) === normalized)
    .map(([kidId]) => kidId)
    .filter(Boolean);
};

export const buildRescheduleCreditId = (sessionId: string, kidId: string): string =>
  `${sessionId}_${kidId}`;

const resolveDurationMins = (session: SessionLike): number => {
  const raw =
    Number(session.durationMins) ||
    Number(session.durationMinutes) ||
    35;
  if (!Number.isFinite(raw) || raw <= 0) return 35;
  return Math.max(10, Math.min(180, Math.round(raw)));
};

export async function queueRescheduleCreditsForAttendance(args: {
  batch: WriteBatch;
  session: SessionLike;
  attendance: AttendanceMapLike;
  actorUid?: string | null;
  sessionNotes?: string;
}): Promise<string[]> {
  const { batch, session, attendance, actorUid, sessionNotes } = args;
  const creditIds: string[] = [];
  const kidIds = getKidIdsByAttendanceStatus(attendance, 'reschedule_requested');

  for (const kidId of kidIds) {
    const creditId = buildRescheduleCreditId(String(session.id || ''), kidId);
    const creditRef = doc(db, 'rescheduleCredits', creditId);
    const existingSnap = await getDoc(creditRef);
    const statusRaw = String(existingSnap.data()?.status || '').trim().toLowerCase();
    const existingStatus = (['open', 'scheduled', 'consumed', 'cancelled'].includes(statusRaw)
      ? statusRaw
      : '') as RescheduleCreditStatus | '';

    const attendanceEntry = attendance[kidId];
    const reasonNote = toNote(attendanceEntry) || String(sessionNotes || '').trim();
    const sharedPayload: Record<string, any> = {
      creditId,
      sourceSessionId: session.id || null,
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
      feeAmount: Number.isFinite(Number(session.feeAmount))
        ? Number(session.feeAmount)
        : (Number.isFinite(Number(session.feePerClass)) ? Number(session.feePerClass) : 0),
      durationMins: resolveDurationMins(session),
      sourceStatus: 'reschedule_requested',
      reason: reasonNote || null,
      updatedAt: serverTimestamp(),
      updatedBy: actorUid || null,
    };

    if (!existingSnap.exists()) {
      batch.set(
        creditRef,
        {
          ...sharedPayload,
          status: 'open',
          createdAt: serverTimestamp(),
          createdBy: actorUid || null,
          openedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      batch.set(
        creditRef,
        {
          ...sharedPayload,
          ...(existingStatus === 'cancelled'
            ? { status: 'open', reopenedAt: serverTimestamp() }
            : {}),
        },
        { merge: true },
      );
    }

    creditIds.push(creditId);
  }

  return creditIds;
}

export function queueCreditScheduled(args: {
  batch: WriteBatch;
  creditId: string;
  replacementSessionId: string;
  replacementDate?: string;
  replacementStartAt?: any;
  actorUid?: string | null;
}) {
  const { batch, creditId, replacementSessionId, replacementDate, replacementStartAt, actorUid } = args;
  const creditRef = doc(db, 'rescheduleCredits', creditId);
  batch.set(
    creditRef,
    {
      status: 'scheduled',
      replacementSessionId,
      replacementDate: replacementDate || null,
      replacementStartAt: replacementStartAt || null,
      scheduledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: actorUid || null,
    },
    { merge: true },
  );
}

export function queueCreditConsumed(args: {
  batch: WriteBatch;
  creditId: string;
  consumedSessionId: string;
  actorUid?: string | null;
}) {
  const { batch, creditId, consumedSessionId, actorUid } = args;
  const creditRef = doc(db, 'rescheduleCredits', creditId);
  batch.set(
    creditRef,
    {
      status: 'consumed',
      consumedSessionId,
      consumedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: actorUid || null,
    },
    { merge: true },
  );
}
