import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../../lib/firebaseConfig';
import { getSessionEndDate, getSessionStartDate } from '../../../lib/sessionTime';
import { isSessionCanonicalForEnrollment } from '../../../lib/sessionScheduleIntegrity';
import { ParentSession } from '../../../types/Parent';

const asStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  const single = String(value || '').trim();
  return single ? [single] : [];
};

const getKidNameFromSession = (data: any, childId: string) => {
  if (data?.kidNames && typeof data.kidNames === 'object' && data.kidNames[childId]) {
    return String(data.kidNames[childId]);
  }

  if (data?.studentNames && typeof data.studentNames === 'object' && data.studentNames[childId]) {
    return String(data.studentNames[childId]);
  }

  if (data?.childNames && typeof data.childNames === 'object' && data.childNames[childId]) {
    return String(data.childNames[childId]);
  }

  return (
    data?.studentName ||
    data?.kidName ||
    data?.childName ||
    'Child'
  );
};

const fetchSessions = async (childIds: string[]): Promise<ParentSession[]> => {
  const parentUid = getAuth().currentUser?.uid;

  if (!parentUid || !childIds.length) return [];

  const childIdSet = new Set(childIds.map((id) => String(id || '').trim()).filter(Boolean));
  if (!childIdSet.size) return [];

  const rawRows: Array<{ id: string; childId: string; data: any }> = [];
  const seen = new Set<string>();

  // ✅ Rule-compatible parent-owned query.
  // Firestore rules can prove this query is allowed because parentId == request.auth.uid.
  const classQuery = query(
    collection(db, 'classSessions'),
    where('parentId', '==', parentUid),
  );

  const classSnap = await getDocs(classQuery);

  classSnap.forEach((docSnap) => {
    if (seen.has(docSnap.id)) return;

    const data = docSnap.data() as any;

    const sessionKidIds = asStringArray(data?.kidIds);
    const sessionKidId = String(data?.kidId || '').trim();

    const matchedChildId =
      sessionKidIds.find((kidId) => childIdSet.has(kidId)) ||
      (sessionKidId && childIdSet.has(sessionKidId) ? sessionKidId : '');

    if (!matchedChildId) return;

    seen.add(docSnap.id);
    rawRows.push({ id: docSnap.id, childId: matchedChildId, data });
  });

  const enrollmentMap = new Map<string, Record<string, unknown>>();

  // ✅ Rule-compatible parent-owned enrollment query.
  // Avoid documentId() "in" query because rules may not be able to prove parent ownership.
  const enrollmentSnap = await getDocs(
    query(collection(db, 'enrollments'), where('parentId', '==', parentUid)),
  );

  enrollmentSnap.docs.forEach((docSnap) => {
    enrollmentMap.set(docSnap.id, {
      id: docSnap.id,
      ...(docSnap.data() as Record<string, unknown>),
    });
  });

  const sessions: ParentSession[] = rawRows
    .filter(({ data }) => {
      const status = String(data?.status || '').trim().toLowerCase();
      if (status === 'paused') return false;

      const enrollmentId = String(data?.enrollmentId || '').trim();
      if (!enrollmentId) return false;

      const enrollment = enrollmentMap.get(enrollmentId);
      return isSessionCanonicalForEnrollment(data as Record<string, unknown>, enrollment);
    })
    .map(({ id, childId, data }) => ({
      id,
      kidId: childId,
      kidName: getKidNameFromSession(data, childId),
      courseName: data.courseName || data.courseId,
      date: typeof data?.date === 'string' ? data.date : '',
      startTime: typeof data?.startTime === 'string' ? data.startTime : '',
      endTime: typeof data?.endTime === 'string' ? data.endTime : '',
      status: data.status || 'scheduled',
      teacherName: data.teacherName,
      joinUrl: data.joinUrl,
      meetingLink: data.meetingLink,
      startAt: data.startAt,
      endAt: data.endAt,
      scheduledStartAt: data.scheduledStartAt,
      scheduledEndAt: data.scheduledEndAt,
      durationMins: data.durationMins,
      durationMinutes: data.durationMinutes,
    }));

  const nowMs = Date.now();

  return sessions
    .filter((session) => {
      const sessionEnd = getSessionEndDate(session);
      if (sessionEnd) return sessionEnd.getTime() >= nowMs;

      const sessionStart = getSessionStartDate(session);
      return sessionStart ? sessionStart.getTime() >= nowMs : false;
    })
    .sort((a, b) => {
      const aStart = getSessionStartDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bStart = getSessionStartDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aStart - bStart;
    });
};

export const useUpcomingSessions = (childIds: string[]) => {
  const safeChildIds = [...childIds].map((id) => String(id || '').trim()).filter(Boolean).sort();

  return useQuery<ParentSession[]>({
    queryKey: ['parentSessions', safeChildIds.join('-')],
    queryFn: () => fetchSessions(safeChildIds),
    enabled: safeChildIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });
};
