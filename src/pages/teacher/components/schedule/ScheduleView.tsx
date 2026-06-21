import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Input } from '@components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { useTeacherSessions } from '../../hooks/useTeacherSessions';
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';
import { AttendanceForm } from '../today-sessions/AttendanceForm';
import { TeacherSession, AttendanceStatus } from '../../../../types/Teacher';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { useAuthStore } from '../../../../store/useAuthStore';
import { INDIA_TIME_ZONE, formatSessionTimeRange } from '../../../../lib/sessionTime';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  eachDayOfInterval,
  isToday,
} from 'date-fns';

interface ScheduleViewProps {
  teacherId?: string;
}

type TopicUpdatePayload = {
  topicId: string;
  mastery?: string;
  teacherRemark?: string;
  topicName?: string;
};

type SessionBadgeTone = 'scheduled' | 'completed' | 'absent' | 'reschedule_requested';

const COURSE_LABEL_BY_ID: Record<string, string> = {
  'phonics-foundations': 'Phonics Foundations',
  'early-phonics': 'Early Phonics',
  'advanced-phonics': 'Advanced Phonics',
  'basic-grammar': 'Basic Grammar',
  'advanced-grammar': 'Advanced Grammar',
  'basic-public-speaking': 'Public Speaking (Basic)',
  'advanced-public-speaking': 'Public Speaking (Advanced)',
  foundational: 'Phonics Foundations',
  early: 'Early Phonics',
  advanced: 'Advanced Phonics',
};

const getAttendanceStatus = (entry: unknown): AttendanceStatus | null => {
  if (!entry) return null;
  if (typeof entry === 'string') {
    const normalized = entry.trim().toLowerCase();
    if (
      normalized === 'present' ||
      normalized === 'absent' ||
      normalized === 'late' ||
      normalized === 'reschedule_requested'
    ) {
      return normalized;
    }
    return null;
  }
  if (typeof entry === 'object' && typeof (entry as any).status === 'string') {
    const normalized = String((entry as any).status).trim().toLowerCase();
    if (
      normalized === 'present' ||
      normalized === 'absent' ||
      normalized === 'late' ||
      normalized === 'reschedule_requested'
    ) {
      return normalized;
    }
  }
  return null;
};

const resolveSessionBadgeTone = (session: TeacherSession): SessionBadgeTone => {
  const attendanceValues = Object.values(session.attendance || {})
    .map(getAttendanceStatus)
    .filter(Boolean) as AttendanceStatus[];
  const hasPresentOrLate = attendanceValues.some((value) => value === 'present' || value === 'late');
  const hasRescheduleRequested =
    session.status === 'reschedule_requested' ||
    attendanceValues.includes('reschedule_requested');
  if (hasPresentOrLate) return 'completed';
  if (hasRescheduleRequested) return 'reschedule_requested';

  const hasAbsent = attendanceValues.includes('absent');
  if (session.status === 'completed') {
    if (hasAbsent && !hasPresentOrLate) return 'absent';
    return 'completed';
  }
  if (hasAbsent && !hasPresentOrLate) return 'absent';
  return 'scheduled';
};

const sessionBadgeToneClass: Record<SessionBadgeTone, string> = {
  scheduled: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  absent: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
  reschedule_requested: 'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200',
};

const sessionBadgeToneLabel: Record<SessionBadgeTone, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  absent: 'Absent',
  reschedule_requested: 'Reschedule',
};

const MONTH_WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const MONTH_WEEKDAY_HEADER_TONE_CLASS = [
  'border-rose-200 bg-gradient-to-b from-rose-100 to-rose-50 text-rose-700',
  'border-orange-200 bg-gradient-to-b from-orange-100 to-orange-50 text-orange-700',
  'border-amber-200 bg-gradient-to-b from-amber-100 to-amber-50 text-amber-700',
  'border-emerald-200 bg-gradient-to-b from-emerald-100 to-emerald-50 text-emerald-700',
  'border-cyan-200 bg-gradient-to-b from-cyan-100 to-cyan-50 text-cyan-700',
  'border-sky-200 bg-gradient-to-b from-sky-100 to-sky-50 text-sky-700',
  'border-indigo-200 bg-gradient-to-b from-indigo-100 to-indigo-50 text-indigo-700',
] as const;

type RescheduleCreditRecord = {
  creditId: string;
  kidId: string;
  status: 'open' | 'scheduled' | 'consumed' | 'cancelled' | string;
  sourceSessionId: string;
  sourceSessionDate: string;
  sourceStartTime: string;
  durationMins: number;
  updatedAt?: unknown;
};

type MakeupDraft = {
  date: string;
  startTime: string;
  note: string;
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const buildDefaultMakeupDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return format(date, 'yyyy-MM-dd');
};

const toNumberOr = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const timestampToMillis = (value: unknown): number => {
  if (value && typeof value === 'object' && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return Number((value as { toMillis: () => number }).toMillis()) || 0;
  }
  if (value instanceof Date) return value.getTime();
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : 0;
};

const toCleanText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const normalizeStartTime = (value: unknown): string | null => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(raw);
  if (!match) return null;
  const seconds = match[3] || '00';
  return `${match[1]}:${match[2]}:${seconds}`;
};

const getSessionStartMillis = (session: Partial<TeacherSession> | null | undefined): number | null => {
  if (!session) return null;
  const fromStartAt = timestampToMillis((session as any).startAt);
  if (fromStartAt > 0) return fromStartAt;

  const dateYmd = typeof session.date === 'string' ? session.date.trim() : '';
  const startTime = normalizeStartTime(session.startTime);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd) || !startTime) return null;
  const parsed = Date.parse(`${dateYmd}T${startTime}+05:30`);
  return Number.isNaN(parsed) ? null : parsed;
};

const getAttendanceAllowedAtMillis = (session: Partial<TeacherSession> | null | undefined): number | null => {
  const startMs = getSessionStartMillis(session);
  if (startMs === null) return null;
  return startMs + 30 * 60 * 1000;
};

const getAttendanceWindowCloseMillis = (session: Partial<TeacherSession> | null | undefined): number | null => {
  const startMs = getSessionStartMillis(session);
  if (startMs === null) return null;
  return startMs + 24 * 60 * 60 * 1000;
};

const completeSessionViaBackend = async (
  sessionId: string,
  payload?: {
    attendance?: Record<string, { status: AttendanceStatus; notes?: string; mastery?: string; topics?: string[]; topicUpdates?: TopicUpdatePayload[] }>;
    sessionNotes?: string;
  },
) => {
  const functions = getFunctions(undefined, 'asia-south1');
  const finalizeSession = httpsCallable(functions, 'onSessionComplete');
  await finalizeSession({
    sessionId,
    ...(payload?.attendance ? { attendance: payload.attendance } : {}),
    ...(typeof payload?.sessionNotes === 'string' ? { sessionNotes: payload.sessionNotes } : {}),
  });
};

export const ScheduleView: React.FC<ScheduleViewProps> = ({ teacherId }) => {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'workweek' | 'day'>('month');
  const [selectedSession, setSelectedSession] = useState<TeacherSession | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [rescheduleCredits, setRescheduleCredits] = useState<RescheduleCreditRecord[]>([]);
  const [rescheduleCreditsLoading, setRescheduleCreditsLoading] = useState<boolean>(false);
  const [makeupDraftByCredit, setMakeupDraftByCredit] = useState<Record<string, MakeupDraft>>({});
  const [schedulingCreditId, setSchedulingCreditId] = useState<string | null>(null);
  const [isReschedulePanelExpanded, setIsReschedulePanelExpanded] = useState<boolean>(false);
  const canOverrideAttendanceTime = String((user as any)?.role || '').trim().toLowerCase() === 'admin';

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (view === 'month') {
      return { rangeStart: startOfMonth(currentDate), rangeEnd: endOfMonth(currentDate) };
    }
    if (view === 'workweek') {
      const mondayStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      return { rangeStart: mondayStart, rangeEnd: addDays(mondayStart, 4) };
    }
    if (view === 'week') {
      return { rangeStart: startOfWeek(currentDate, { weekStartsOn: 0 }), rangeEnd: endOfWeek(currentDate, { weekStartsOn: 0 }) };
    }
    return { rangeStart: currentDate, rangeEnd: currentDate };
  }, [currentDate, view]);

  const { sessions, error: sessionsError } = useTeacherSessions(
    teacherId,
    format(rangeStart, 'yyyy-MM-dd'),
    format(rangeEnd, 'yyyy-MM-dd'),
  );

  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);
  const days = useMemo(() => eachDayOfInterval({ start: rangeStart, end: rangeEnd }), [rangeStart, rangeEnd]);

  const monthLeadingEmptyCells = useMemo(
    () => Array.from({ length: monthStart.getDay() }),
    [monthStart],
  );
  const monthTrailingEmptyCells = useMemo(
    () => Array.from({ length: Math.max(0, 6 - monthEnd.getDay()) }),
    [monthEnd],
  );

  const { students } = useTeacherFilteredStudents();
  const resolvedTeacherId = teacherId || auth.currentUser?.uid || '';

  const studentNameById = useMemo(
    () => new Map(students.map((s) => [s.uid, s.fullName || ''])),
    [students],
  );

  const studentCourseLabelById = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((student) => {
      const data = student as any;
      const kidId = data.uid || data.id;
      if (!kidId) return;

      const ids = Array.isArray(data.courseIds) ? data.courseIds.map(String) : [];
      const labels = Array.isArray(data.courseLabels) ? data.courseLabels.map(String) : [];
      const activeId = typeof data.activeCourseId === 'string' ? data.activeCourseId : '';

      let label = '';
      if (activeId) {
        const idx = ids.indexOf(activeId);
        label = (idx >= 0 && labels[idx]) ? labels[idx] : (COURSE_LABEL_BY_ID[activeId] || '');
      }

      if (!label) {
        if (labels.length > 0) label = labels[0];
        else if (ids.length > 0) label = COURSE_LABEL_BY_ID[ids[0]] || ids[0];
      }

      if (!label) {
        const legacy = Array.isArray(data.courseNames)
          ? data.courseNames
          : Array.isArray(data.courses)
            ? data.courses
            : [];
        if (legacy.length > 0) label = String(legacy[0]);
      }

      if (label) map.set(String(kidId), label);
    });
    return map;
  }, [students]);

  const getSessionStudentLabel = useCallback((session?: Partial<TeacherSession>): string => {
    if (!session) return 'Student';
    const row = session as any;
    const firstFromSession =
      toCleanText(row.studentName) ||
      toCleanText(row.kidName) ||
      toCleanText(row.childName) ||
      toCleanText(row.student?.name) ||
      toCleanText(row.student?.fullName) ||
      toCleanText(row.student?.displayName);

    if (firstFromSession) return firstFromSession;

    const listCandidates = [row.studentNames, row.kidNames, row.childNames] as unknown[];
    for (const list of listCandidates) {
      if (!Array.isArray(list)) continue;
      const first = list
        .map((item) => toCleanText(item))
        .find((item) => item.length > 0);
      if (first) return first;
    }

    const kidIds: string[] = Array.isArray(row.kidIds) ? row.kidIds.map((id: unknown) => String(id)) : [];
    const fromLookup = kidIds.map((id) => studentNameById.get(id)).filter(Boolean).join(', ');
    return fromLookup || 'Student';
  }, [studentNameById]);

  const getCourseLabel = (session?: Partial<TeacherSession>): string => {
    if (!session) return '';
    const row = session as any;
    return (
      toCleanText(row.courseLabel) ||
      toCleanText(row.courseName) ||
      toCleanText(row.courseTitle) ||
      toCleanText(row.course?.label) ||
      toCleanText(row.course?.name) ||
      toCleanText(row.course?.title) ||
      toCleanText(row.programLabel) ||
      toCleanText(row.programName) ||
      toCleanText(row.program?.label) ||
      toCleanText(row.program?.name) ||
      toCleanText(row.subject) ||
      ''
    );
  };

  const getSessionCourseLabel = (session?: Partial<TeacherSession>): string => {
    if (!session) return '';
    const direct = getCourseLabel(session);
    if (direct) return direct;
    const row = session as any;
    const kidIds: string[] = Array.isArray(row.kidIds) ? row.kidIds.map((id: unknown) => String(id)) : [];
    return kidIds.map((id) => studentCourseLabelById.get(id)).find(Boolean) || '';
  };

  const truncateLabel = (value: string, max = 18): string => {
    if (!value) return '';
    if (value.length <= max) return value;
    if (max <= 3) return value.slice(0, max);
    return `${value.slice(0, max - 3)}...`;
  };

  const getSessionKidIds = useCallback((session?: Partial<TeacherSession>): string[] => {
    if (!session) return [];
    const row = session as any;
    const fromList = Array.isArray(row.kidIds) ? row.kidIds : [];
    const fromSingles = [row.kidId, row.studentId, row.childId];
    return Array.from(
      new Set(
        [...fromList, ...fromSingles]
          .map((value) => toCleanText(value))
          .filter((value) => value.length > 0),
      ),
    );
  }, []);

  const getPrimarySessionKidId = useCallback(
    (session?: Partial<TeacherSession>): string => getSessionKidIds(session)[0] || '',
    [getSessionKidIds],
  );

  const isAttendanceAllowedNow = useCallback((session?: Partial<TeacherSession> | null): boolean => {
    if (canOverrideAttendanceTime) return true;
    const allowedAt = getAttendanceAllowedAtMillis(session);
    const windowCloseAt = getAttendanceWindowCloseMillis(session);
    if (allowedAt === null || windowCloseAt === null) return false;
    const nowMs = Date.now();
    return nowMs >= allowedAt && nowMs <= windowCloseAt;
  }, [canOverrideAttendanceTime]);

  const tryOpenAttendance = useCallback((session: TeacherSession) => {
    if (!isAttendanceAllowedNow(session)) {
      const allowedAt = getAttendanceAllowedAtMillis(session);
      const windowCloseAt = getAttendanceWindowCloseMillis(session);
      const nowMs = Date.now();
      const message =
        allowedAt === null || windowCloseAt === null
          ? 'Attendance time could not be verified. Please contact admin.'
          : nowMs > windowCloseAt
            ? 'Attendance window has closed. Please contact admin to update this attendance.'
            : `Attendance opens at ${format(new Date(allowedAt), 'h:mm a')}.`;
      toast({
        title: 'Attendance unavailable',
        description: message,
        variant: 'destructive',
      });
      return;
    }
    setSelectedSession(session);
  }, [isAttendanceAllowedNow]);

  const studentFilterOptions = useMemo(() => {
    const byId = new Map<string, { id: string; label: string }>();
    sessions.forEach((session) => {
      const kidId = getPrimarySessionKidId(session);
      if (!kidId) return;
      const label = getSessionStudentLabel(session);
      if (!byId.has(kidId)) {
        byId.set(kidId, {
          id: kidId,
          label: label || studentNameById.get(kidId) || kidId,
        });
      }
    });
    return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [sessions, studentNameById, getPrimarySessionKidId, getSessionStudentLabel]);

  useEffect(() => {
    if (selectedStudentId === 'all') return;
    if (!studentFilterOptions.some((item) => item.id === selectedStudentId)) {
      setSelectedStudentId('all');
    }
  }, [selectedStudentId, studentFilterOptions]);

  const filteredSessions = useMemo(() => {
    if (selectedStudentId === 'all') return sessions;
    return sessions.filter((session) => getSessionKidIds(session).includes(selectedStudentId));
  }, [sessions, selectedStudentId, getSessionKidIds]);

  const attendanceSummary = useMemo(() => {
    let completedPresent = 0;
    let absentMissed = 0;
    let rescheduled = 0;
    let upcoming = 0;
    const todayYmd = format(new Date(), 'yyyy-MM-dd');

    filteredSessions.forEach((session) => {
      const tone = resolveSessionBadgeTone(session);
      if (tone === 'completed') completedPresent += 1;
      if (tone === 'absent') absentMissed += 1;
      if (tone === 'reschedule_requested') rescheduled += 1;
      if (tone === 'scheduled' && String(session.date || '') >= todayYmd) upcoming += 1;
    });

    return { completedPresent, absentMissed, rescheduled, upcoming };
  }, [filteredSessions]);

  const sessionsByDate = useMemo(
    () => filteredSessions.reduce((acc, session) => {
      if (!acc[session.date]) acc[session.date] = [];
      acc[session.date].push(session);
      return acc;
    }, {} as Record<string, TeacherSession[]>),
    [filteredSessions],
  );

  useEffect(() => {
    if (!resolvedTeacherId) {
      setRescheduleCredits([]);
      setRescheduleCreditsLoading(false);
      return;
    }

    setRescheduleCreditsLoading(true);
    const creditsQuery = query(
      collection(db, 'rescheduleCredits'),
      where('teacherId', '==', resolvedTeacherId),
      where('status', '==', 'open'),
    );

    const unsub = onSnapshot(
      creditsQuery,
      (snapshot) => {
        const rows: RescheduleCreditRecord[] = snapshot.docs.map((snap) => {
          const data = (snap.data() || {}) as Record<string, unknown>;
          const durationMins = Math.max(10, Math.min(180, Math.round(toNumberOr(data.durationMins, 35))));
          return {
            creditId: String(data.creditId || snap.id),
            kidId: String(data.kidId || ''),
            status: String(data.status || 'open'),
            sourceSessionId: String(data.sourceSessionId || ''),
            sourceSessionDate: String(data.sourceSessionDate || ''),
            sourceStartTime: String(data.sourceStartTime || ''),
            durationMins,
            updatedAt: data.updatedAt,
          };
        }).filter((row) => row.creditId && row.kidId);

        rows.sort((a, b) => {
          const byUpdated = timestampToMillis(b.updatedAt) - timestampToMillis(a.updatedAt);
          if (byUpdated !== 0) return byUpdated;
          return b.sourceSessionDate.localeCompare(a.sourceSessionDate);
        });

        setRescheduleCredits(rows);
        setRescheduleCreditsLoading(false);
        setMakeupDraftByCredit((prev) => {
          const next: Record<string, MakeupDraft> = {};
          rows.forEach((row) => {
            next[row.creditId] = prev[row.creditId] || {
              date: buildDefaultMakeupDate(),
              startTime: '16:00',
              note: '',
            };
          });
          return next;
        });
      },
      (err) => {
        console.error('rescheduleCredits onSnapshot error', err);
        setRescheduleCredits([]);
        setRescheduleCreditsLoading(false);
      },
    );

    return () => unsub();
  }, [resolvedTeacherId]);

  const updateMakeupDraft = (creditId: string, patch: Partial<MakeupDraft>) => {
    setMakeupDraftByCredit((prev) => ({
      ...prev,
      [creditId]: {
        ...(prev[creditId] || { date: buildDefaultMakeupDate(), startTime: '16:00', note: '' }),
        ...patch,
      },
    }));
  };

  const visibleRescheduleCredits = useMemo(() => {
    if (selectedStudentId === 'all') return rescheduleCredits;
    return rescheduleCredits.filter((credit) => String(credit.kidId || '').trim() === selectedStudentId);
  }, [rescheduleCredits, selectedStudentId]);

  useEffect(() => {
    if (!selectedSession) return;
    if (selectedStudentId === 'all') return;
    const matchesSelected = getSessionKidIds(selectedSession).includes(selectedStudentId);
    if (!matchesSelected) {
      setSelectedSession(null);
    }
  }, [selectedSession, selectedStudentId, getSessionKidIds]);

  const handleCreateMakeupSession = async (credit: RescheduleCreditRecord) => {
    const draft = makeupDraftByCredit[credit.creditId] || {
      date: buildDefaultMakeupDate(),
      startTime: '16:00',
      note: '',
    };

    if (!ISO_DATE_RE.test(draft.date)) {
      toast({
        title: 'Invalid date',
        description: 'Choose a valid date (YYYY-MM-DD).',
        variant: 'destructive',
      });
      return;
    }
    if (!HHMM_RE.test(draft.startTime)) {
      toast({
        title: 'Invalid time',
        description: 'Choose a valid start time (HH:mm).',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSchedulingCreditId(credit.creditId);
      const functions = getFunctions(undefined, 'asia-south1');
      const createMakeupSessionFromCredit = httpsCallable(functions, 'createMakeupSessionFromCredit');
      const response = await createMakeupSessionFromCredit({
        creditId: credit.creditId,
        kidId: credit.kidId,
        date: draft.date,
        startTime: draft.startTime,
        durationMins: credit.durationMins,
        note: draft.note.trim() || undefined,
      });

      const result = (response.data || {}) as { sessionId?: string; alreadyExisted?: boolean };
      setCurrentDate(new Date(`${draft.date}T00:00:00`));
      setView('day');
      toast({
        title: result.alreadyExisted ? 'Makeup session already exists' : 'Makeup session scheduled',
        description: result.sessionId
          ? `Session ${result.sessionId} is ready in your calendar.`
          : 'The reschedule credit was scheduled successfully.',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Unable to schedule makeup session',
        description: err instanceof Error ? err.message : 'Please try another date/time.',
        variant: 'destructive',
      });
    } finally {
      setSchedulingCreditId(null);
    }
  };

  const handleAttendanceSubmit = async (data: { attendance: Record<string, { status: AttendanceStatus; notes?: string; mastery?: string; topics?: string[]; topicUpdates?: TopicUpdatePayload[] }>; sessionNotes: string; meta?: { courseId?: string; courseLabel?: string; attendanceOnly?: boolean } }) => {
    if (!selectedSession) return;
    if (!isAttendanceAllowedNow(selectedSession)) {
      const allowedAt = getAttendanceAllowedAtMillis(selectedSession);
      const windowCloseAt = getAttendanceWindowCloseMillis(selectedSession);
      const nowMs = Date.now();
      const message =
        allowedAt === null || windowCloseAt === null
          ? 'Attendance time could not be verified. Please contact admin.'
          : nowMs > windowCloseAt
            ? 'Attendance window has closed. Please contact admin to update this attendance.'
            : `Attendance opens at ${format(new Date(allowedAt), 'h:mm a')}.`;
      toast({
        title: 'Attendance unavailable',
        description: message,
        variant: 'destructive',
      });
      return;
    }
    try {
      const functions = getFunctions(undefined, 'asia-south1');
      const saveTeacherSessionProgress = httpsCallable(functions, 'saveTeacherSessionProgress');
      const response: any = await saveTeacherSessionProgress({
        sessionId: selectedSession.id,
        attendance: data.attendance,
        sessionNotes: data.sessionNotes,
        meta: {
          courseId: data.meta?.courseId,
          courseLabel: data.meta?.courseLabel,
          attendanceOnly: data.meta?.attendanceOnly === true,
        },
      });
      const hasPresentOrLate = response?.data?.hasPresentOrLate === true;

      if (hasPresentOrLate) {
        await completeSessionViaBackend(selectedSession.id, {
          attendance: data.attendance as Record<string, any>,
          sessionNotes: data.sessionNotes,
        });
        toast({
          title: 'Attendance saved',
          description:
            data.meta?.attendanceOnly === true
              ? 'Attendance updated and session completed.'
              : 'Attendance recorded and session completed.',
        });
      } else {
        toast({
          title: 'Attendance saved',
          description:
            data.meta?.attendanceOnly === true
              ? 'Attendance updated.'
              : 'Attendance and curriculum completion recorded.',
        });
      }
      setSelectedSession(null);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Unable to save attendance',
        description: err instanceof Error ? err.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handlePrev = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week' || view === 'workweek') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week' || view === 'workweek') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => setCurrentDate(new Date());

  const getTitle = () => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy');
    }
    if (view === 'workweek') {
      return `Work week ${format(rangeStart, 'MMM d')} - ${format(rangeEnd, 'MMM d, yyyy')}`;
    }
    if (view === 'week') {
      return `Week of ${format(rangeStart, 'MMM d')} - ${format(rangeEnd, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  };

  return (
    <div className="space-y-6">
      {sessionsError && (
        <Card className="p-4 border border-red-200 bg-red-50 text-red-700">
          <p className="text-sm font-medium">Unable to load sessions.</p>
          <p className="text-xs text-red-600 mt-1">
            {sessionsError.message}
          </p>
          <p className="text-xs text-red-600 mt-1">
            If you’re an admin, deploy the required Firestore indexes for classSessions.
          </p>
        </Card>
      )}

      <Card className="border-slate-200 bg-white/95 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Teacher Schedule</h2>
            <p className="mt-1 text-sm text-slate-500">
              View your sessions and tap any session to mark attendance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={handlePrev}>Prev</Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleToday}>Today</Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleNext}>Next</Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-2">
          <Button className="rounded-full" variant={view === 'day' ? 'default' : 'outline'} onClick={() => setView('day')}>Today</Button>
          <Button className="rounded-full" variant={view === 'week' ? 'default' : 'outline'} onClick={() => setView('week')}>Week</Button>
          <Button className="rounded-full" variant={view === 'month' ? 'default' : 'outline'} onClick={() => setView('month')}>Month</Button>
          <Button className="rounded-full" variant={view === 'workweek' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('workweek')}>
            Work Week
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Student</label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="h-9 w-[240px] bg-white">
                <SelectValue placeholder="All students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                {studentFilterOptions.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-slate-500">{getTitle()}</div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
          <Card className="p-2">
            <div className="text-slate-500">Completed / Present</div>
            <div className="font-semibold text-slate-900">{attendanceSummary.completedPresent}</div>
          </Card>
          <Card className="p-2">
            <div className="text-slate-500">Absent / Missed</div>
            <div className="font-semibold text-slate-900">{attendanceSummary.absentMissed}</div>
          </Card>
          <Card className="p-2">
            <div className="text-slate-500">Rescheduled</div>
            <div className="font-semibold text-slate-900">{attendanceSummary.rescheduled}</div>
          </Card>
          <Card className="p-2">
            <div className="text-slate-500">Upcoming</div>
            <div className="font-semibold text-slate-900">{attendanceSummary.upcoming}</div>
          </Card>
        </div>
      </Card>

      <Card className="border-slate-200 bg-white/95 p-4 shadow-sm md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Open Reschedule Credits</h3>
            <p className="text-xs text-slate-500">
              Schedule one makeup class per student credit.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
              {visibleRescheduleCredits.length} open
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setIsReschedulePanelExpanded((prev) => !prev)}
            >
              {isReschedulePanelExpanded ? 'Close' : 'Expand'}
            </Button>
          </div>
        </div>

        {isReschedulePanelExpanded && (
          <>
            {rescheduleCreditsLoading ? (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Loading credits...
              </div>
            ) : visibleRescheduleCredits.length === 0 ? (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                No open reschedule credits right now.
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {visibleRescheduleCredits.map((credit) => {
                  const draft = makeupDraftByCredit[credit.creditId] || {
                    date: buildDefaultMakeupDate(),
                    startTime: '16:00',
                    note: '',
                  };
                  const studentLabel =
                    studentNameById.get(credit.kidId) ||
                    `Student (${credit.kidId.slice(0, 6)}...)`;

                  return (
                    <div key={credit.creditId} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-medium text-slate-900">{studentLabel}</div>
                        <div className="text-xs text-slate-500">
                          Missed: {credit.sourceSessionDate || '—'}{credit.sourceStartTime ? ` at ${credit.sourceStartTime}` : ''}
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-4">
                        <div>
                          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">Date</label>
                          <Input
                            type="date"
                            value={draft.date}
                            onChange={(event) => updateMakeupDraft(credit.creditId, { date: event.target.value })}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">Time</label>
                          <Input
                            type="time"
                            value={draft.startTime}
                            onChange={(event) => updateMakeupDraft(credit.creditId, { startTime: event.target.value })}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">Note (optional)</label>
                          <Input
                            type="text"
                            placeholder="Optional note"
                            value={draft.note}
                            onChange={(event) => updateMakeupDraft(credit.creditId, { note: event.target.value })}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            className="w-full rounded-lg"
                            onClick={() => handleCreateMakeupSession(credit)}
                            disabled={schedulingCreditId === credit.creditId}
                          >
                            {schedulingCreditId === credit.creditId ? 'Scheduling...' : 'Schedule Makeup'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Card>

      <Card className="border-slate-200 bg-white/95 p-5 shadow-sm md:p-6">
        {view === 'month' && (
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-sky-50/70 via-white to-orange-50/70 p-2.5 shadow-inner">
            <div className="grid grid-cols-7 gap-1.5">
              {MONTH_WEEKDAY_LABELS.map((day, index) => (
                <div
                  key={day}
                  className={`rounded-lg border py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.12em] ${MONTH_WEEKDAY_HEADER_TONE_CLASS[index]}`}
                >
                  {day}
                </div>
              ))}
              {monthLeadingEmptyCells.map((_, idx) => (
                <div key={`month-leading-empty-clean-${idx}`} className="h-14 rounded-lg border border-transparent bg-white/20" aria-hidden="true" />
              ))}
              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const daySessions = sessionsByDate[dateStr] || [];
                const dayOfWeek = day.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const dayCellToneClass = isToday(day)
                  ? 'border-sky-300 bg-gradient-to-br from-sky-100 to-cyan-50 shadow-sm'
                  : daySessions.length > 0
                    ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/80'
                    : isWeekend
                      ? 'border-rose-100 bg-gradient-to-br from-rose-50/75 to-orange-50/70'
                      : 'border-slate-200 bg-white/95';

                return (
                  <button
                    key={day.toString()}
                    type="button"
                    className={`h-14 rounded-lg border px-2 py-1.5 text-left transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm ${dayCellToneClass}`}
                    onClick={() => {
                      setCurrentDate(day);
                      setView('day');
                    }}
                    aria-label={`Open schedule for ${format(day, 'MMMM d, yyyy')}`}
                  >
                    <div className="flex h-full text-left">
                      <div className="text-sm font-semibold leading-none text-slate-900">{format(day, 'd')}</div>
                    </div>
                  </button>
                );
              })}
              {monthTrailingEmptyCells.map((_, idx) => (
                <div key={`month-trailing-empty-clean-${idx}`} className="h-14 rounded-lg border border-transparent bg-white/20" aria-hidden="true" />
              ))}
            </div>
          </div>
        )}

        {(view === 'week' || view === 'workweek') && (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${Math.max(days.length, 1)}, minmax(0, 1fr))` }}
          >
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const daySessions = sessionsByDate[dateStr] || [];
              return (
                <div
                  key={day.toString()}
                  className={`rounded-xl border p-3 ${
                    isToday(day)
                      ? 'border-sky-200 bg-sky-50/50 shadow-sm'
                      : daySessions.length > 0
                        ? 'border-slate-200 bg-white shadow-sm'
                        : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  <div className="mb-2 text-center">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{format(day, 'EEE')}</div>
                    <div className="text-sm font-semibold text-slate-900">{format(day, 'd MMM')}</div>
                  </div>
                  <div className="space-y-2">
                    {daySessions.map((session, idx) => {
                      const kidNames = getSessionStudentLabel(session);
                      const courseLabel = getSessionCourseLabel(session);
                      const badgeTone = resolveSessionBadgeTone(session);
                      return (
                        <button
                          key={session.id || `${dateStr}_${idx}`}
                          type="button"
                          className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs transition hover:opacity-95 ${sessionBadgeToneClass[badgeTone]}`}
                          onClick={() => tryOpenAttendance(session)}
                        >
                          <div className="font-medium">
                            {sessionBadgeToneLabel[badgeTone]} · {formatSessionTimeRange(session, { timeZone: INDIA_TIME_ZONE })}
                          </div>
                          <div className="mt-1 truncate text-[11px]">{kidNames}</div>
                          {courseLabel ? <div className="mt-1 truncate text-[11px] opacity-80">{truncateLabel(courseLabel, 20)}</div> : null}
                        </button>
                      );
                    })}
                    {daySessions.length === 0 ? (
                      <div className="rounded-lg border border-slate-200 bg-white/70 px-2 py-2 text-[11px] text-slate-400">
                        No bookings
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'day' && (
          <div className="space-y-2.5">
            {(sessionsByDate[format(currentDate, 'yyyy-MM-dd')] || []).map((session, idx) => {
              const kidNames = getSessionStudentLabel(session);
              const courseLabel = getSessionCourseLabel(session);
              const badgeTone = resolveSessionBadgeTone(session);

              return (
                <button
                  key={session.id || `day_${idx}`}
                  type="button"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  onClick={() => tryOpenAttendance(session)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {formatSessionTimeRange(session, { timeZone: INDIA_TIME_ZONE })}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">{kidNames}</div>
                      {courseLabel ? <div className="mt-1 text-xs text-slate-500">{truncateLabel(courseLabel, 30)}</div> : null}
                    </div>
                    <Badge variant="outline" className={`border ${sessionBadgeToneClass[badgeTone]}`}>
                      {sessionBadgeToneLabel[badgeTone]}
                    </Badge>
                  </div>
                </button>
              );
            })}
            {(sessionsByDate[format(currentDate, 'yyyy-MM-dd')] || []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No bookings for this day
              </div>
            ) : null}
          </div>
        )}
      </Card>

      <AttendanceForm
        open={Boolean(selectedSession)}
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onSubmit={handleAttendanceSubmit}
        attendanceOnly
      />
    </div>
  );
};
