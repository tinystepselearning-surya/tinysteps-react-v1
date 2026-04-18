import React, { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { useTeacherSessions } from '../../hooks/useTeacherSessions';
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';
import { AttendanceForm } from '../today-sessions/AttendanceForm';
import { TeacherSession, AttendanceStatus } from '../../../../types/Teacher';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from '@components/hooks/use-toast';
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
  const hasRescheduleRequested =
    session.status === 'reschedule_requested' ||
    attendanceValues.includes('reschedule_requested');
  if (hasRescheduleRequested) return 'reschedule_requested';

  const hasPresentOrLate = attendanceValues.some((value) => value === 'present' || value === 'late');
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'workweek' | 'day'>('month');
  const [selectedSession, setSelectedSession] = useState<TeacherSession | null>(null);

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

  const toCleanText = (value: unknown): string => {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return '';
  };

  const getSessionStudentLabel = (session?: Partial<TeacherSession>): string => {
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
  };

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

  const sessionsByDate = useMemo(
    () => sessions.reduce((acc, session) => {
      if (!acc[session.date]) acc[session.date] = [];
      acc[session.date].push(session);
      return acc;
    }, {} as Record<string, TeacherSession[]>),
    [sessions],
  );

  const handleAttendanceSubmit = async (data: { attendance: Record<string, { status: AttendanceStatus; notes?: string; mastery?: string; topics?: string[]; topicUpdates?: TopicUpdatePayload[] }>; sessionNotes: string; meta?: { courseId?: string; courseLabel?: string; attendanceOnly?: boolean } }) => {
    if (!selectedSession) return;
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

        <p className="mt-3 text-sm text-slate-500">{getTitle()}</p>
      </Card>

      <Card className="border-slate-200 bg-white/95 p-5 shadow-sm md:p-6">
        {view === 'month' && (
          <div className="grid grid-cols-7 gap-2.5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="rounded-xl border border-slate-200 bg-slate-50 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {day}
              </div>
            ))}
            {monthLeadingEmptyCells.map((_, idx) => (
              <div key={`month-leading-empty-clean-${idx}`} className="min-h-[120px] rounded-xl border border-transparent" aria-hidden="true" />
            ))}
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const daySessions = sessionsByDate[dateStr] || [];
              return (
                <div
                  key={day.toString()}
                  className={`min-h-[120px] rounded-xl border p-3 ${
                    isToday(day)
                      ? 'border-sky-200 bg-sky-50/50 shadow-sm'
                      : daySessions.length > 0
                        ? 'border-slate-200 bg-white shadow-sm'
                        : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-900">{format(day, 'd')}</div>
                  <div className="mt-2 space-y-2">
                    {daySessions.slice(0, 3).map((session, idx) => {
                      const kidNames = getSessionStudentLabel(session);
                      const courseLabel = getSessionCourseLabel(session);
                      const badgeTone = resolveSessionBadgeTone(session);
                      return (
                        <button
                          key={session.id || `${dateStr}_${idx}`}
                          type="button"
                          className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs transition hover:opacity-95 ${sessionBadgeToneClass[badgeTone]}`}
                          onClick={() => setSelectedSession(session)}
                        >
                          <div className="font-medium">
                            {sessionBadgeToneLabel[badgeTone]} · {session.startTime}
                          </div>
                          <div className="mt-1 truncate text-[11px]">{kidNames}</div>
                          {courseLabel ? <div className="mt-1 truncate text-[11px] opacity-80">{truncateLabel(courseLabel, 18)}</div> : null}
                        </button>
                      );
                    })}
                    {daySessions.length > 3 ? (
                      <div className="text-[11px] text-slate-500">+{daySessions.length - 3} more</div>
                    ) : null}
                    {daySessions.length === 0 ? <div className="text-[11px] text-slate-400">No bookings</div> : null}
                  </div>
                </div>
              );
            })}
            {monthTrailingEmptyCells.map((_, idx) => (
              <div key={`month-trailing-empty-clean-${idx}`} className="min-h-[120px] rounded-xl border border-transparent" aria-hidden="true" />
            ))}
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
                          onClick={() => setSelectedSession(session)}
                        >
                          <div className="font-medium">
                            {sessionBadgeToneLabel[badgeTone]} · {session.startTime}
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
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{session.startTime} - {session.endTime}</div>
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
