import React, { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { useTeacherSessions } from '../../hooks/useTeacherSessions';
import { TeacherSession, AttendanceStatus } from '../../../../types/Teacher';
import { SessionCard } from './SessionCard';
import { AttendanceForm } from './AttendanceForm';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from '@components/hooks/use-toast';
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';
import { useAuthStore } from '../../../../store/useAuthStore';
import { getSessionEndDate, getSessionStartDate } from '../../../../lib/sessionTime';
import {
  ATTENDANCE_FINALISED_MESSAGE,
  getTeacherAttendanceCorrectionCutoffMillis,
} from '../../../../lib/attendanceCorrectionFreeze';
import {
  cleanStudentDisplayName,
  resolveTeacherSessionCourseLabel,
} from '../../utils/resolveTeacherSessionStudentName';

interface TodaySessionsListProps {
  teacherId?: string;
}

type SessionViewFilter = 'all' | 'soon' | 'pending' | 'completed';

export const TodaySessionsList: React.FC<TodaySessionsListProps> = ({ teacherId }) => {
  const ATTENDANCE_OPEN_DELAY_MS = 30 * 60 * 1000;
  const { user } = useAuthStore();
  const { sessions, isLoading, error } = useTeacherSessions(teacherId);
  const { students } = useTeacherFilteredStudents();
  const [selectedSession, setSelectedSession] = useState<TeacherSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewFilter, setViewFilter] = useState<SessionViewFilter>('all');
  const canOverrideAttendanceTime = String((user as any)?.role || '').trim().toLowerCase() === 'admin';

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((student: any) => {
      const name = cleanStudentDisplayName(
        student.fullName ||
        student.studentName ||
        student.displayName ||
        student.name ||
        '',
      );
      if (!name) return;

      if (student.uid) map.set(String(student.uid), String(name));
      if (student.id) map.set(String(student.id), String(name));
      if (student.userId) map.set(String(student.userId), String(name));
    });
    return map;
  }, [students]);

  const completeSessionViaBackend = async (
    sessionId: string,
    payload?: {
      attendance?: Record<string, { status: AttendanceStatus; notes?: string; mastery?: string; topics?: string[] }>;
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

  const handleAttendanceSubmit = async (data: {
    attendance: Record<string, { status: AttendanceStatus; notes?: string; mastery?: string; topics?: string[] }>;
    sessionNotes: string;
    meta?: { attendanceOnly?: boolean };
  }) => {
    if (!selectedSession) return;
    if (!isAttendanceAllowedNow(selectedSession)) {
      const startMs = getSessionStartMillis(selectedSession);
      const correctionCutoffMs = getTeacherAttendanceCorrectionCutoffMillis(selectedSession);
      const nowMs = Date.now();
      toast({
        title: 'Attendance unavailable',
        description:
          startMs === null
            ? 'Attendance time could not be verified. Please contact admin.'
            : correctionCutoffMs !== null && nowMs >= correctionCutoffMs
              ? ATTENDANCE_FINALISED_MESSAGE
              : 'Attendance can be marked 30 minutes after class start.',
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
        meta: { attendanceOnly: data.meta?.attendanceOnly === true },
      });
      const hasPresentOrLate = response?.data?.hasPresentOrLate === true;
      if (hasPresentOrLate) {
        await completeSessionViaBackend(selectedSession.id, {
          attendance: data.attendance,
          sessionNotes: data.sessionNotes,
        });
        toast({ title: 'Attendance saved', description: 'Attendance recorded and session completed.' });
      } else {
        toast({ title: 'Attendance saved', description: 'Attendance recorded.' });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Unable to save attendance',
        description: err instanceof Error ? err.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const orderedSessions = useMemo(() => sessions, [sessions]);

  const getSessionStart = (session: TeacherSession): Date | null => {
    return getSessionStartDate(session);
  };

  const getSessionEnd = (session: TeacherSession, start: Date): Date => {
    const resolved = getSessionEndDate(session);
    if (resolved) return resolved;
    const durationMins = Number((session as any).durationMins) || Number((session as any).durationMinutes) || 30;
    return new Date(start.getTime() + Math.max(durationMins, 30) * 60 * 1000);
  };

  const normalizeStartTime = (value: unknown): string | null => {
    const raw = typeof value === 'string' ? value.trim() : '';
    if (!raw) return null;
    const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(raw);
    if (!match) return null;
    const seconds = match[3] || '00';
    return `${match[1]}:${match[2]}:${seconds}`;
  };

  const getSessionStartMillis = (session: TeacherSession): number | null => {
    const fromStartAt = getSessionStartDate(session);
    if (fromStartAt) return fromStartAt.getTime();
    const dateYmd = typeof session.date === 'string' ? session.date.trim() : '';
    const startTime = normalizeStartTime(session.startTime);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd) || !startTime) return null;
    const parsed = Date.parse(`${dateYmd}T${startTime}+05:30`);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const isAttendanceAllowedNow = (session: TeacherSession): boolean => {
    if (canOverrideAttendanceTime) return true;
    const startMs = getSessionStartMillis(session);
    if (startMs === null) return false;
    const nowMs = Date.now();
    const allowedAtMs = startMs + ATTENDANCE_OPEN_DELAY_MS;
    const correctionCutoffMs = getTeacherAttendanceCorrectionCutoffMillis(session);
    return correctionCutoffMs !== null && nowMs >= allowedAtMs && nowMs < correctionCutoffMs;
  };

  const getKnownNames = (session: TeacherSession): string[] => {
    const inlineNames = [
      ...(Array.isArray((session as any).studentNames) ? (session as any).studentNames : []),
      ...(Array.isArray((session as any).kidNames) ? (session as any).kidNames : []),
      (session as any).studentName,
      (session as any).kidName,
      (session as any).childName,
    ]
      .map((value) => cleanStudentDisplayName(value))
      .filter(Boolean);

    const fromIds = (session.kidIds || [])
      .map((kidId) => studentNameById.get(String(kidId)) || '')
      .map((name) => name.trim())
      .filter(Boolean);

    return Array.from(new Set([...fromIds, ...inlineNames]));
  };

  const sortedSessions = useMemo(() => {
    return [...orderedSessions].sort((a, b) => {
      const aStart = getSessionStart(a);
      const bStart = getSessionStart(b);
      if (aStart && bStart) return aStart.getTime() - bStart.getTime();
      return String(a.startTime || '').localeCompare(String(b.startTime || ''));
    });
  }, [orderedSessions]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const summary = useMemo(() => {
    const nowMs = Date.now();
    let soon = 0;
    let pending = 0;
    let completed = 0;

    sortedSessions.forEach((session) => {
      const start = getSessionStart(session);
      const end = start ? getSessionEnd(session, start) : null;
      const attendanceCount = Object.keys(session.attendance || {}).length;
      const isCompleted =
        session.status === 'completed' ||
        session.status === 'reschedule_requested' ||
        (end ? end.getTime() < nowMs : false);

      if (isCompleted) {
        completed += 1;
      } else {
        if (attendanceCount === 0) pending += 1;
        if (start) {
          const deltaMins = Math.floor((start.getTime() - nowMs) / 60000);
          const isInProgress = start.getTime() <= nowMs && end && end.getTime() >= nowMs;
          if (isInProgress || (deltaMins >= 0 && deltaMins <= 60)) soon += 1;
        }
      }
    });

    return {
      total: sortedSessions.length,
      soon,
      pending,
      completed,
    };
  }, [sortedSessions]);

  const filteredSessions = useMemo(() => {
    const nowMs = Date.now();
    return sortedSessions.filter((session) => {
      const names = getKnownNames(session);
      const haystack = [
        ...names,
        resolveTeacherSessionCourseLabel(session),
        session.courseId,
        session.startTime,
        session.endTime,
      ]
        .filter((value): value is string => typeof value === 'string')
        .join(' ')
        .toLowerCase();

      if (normalizedSearch && !haystack.includes(normalizedSearch)) return false;

      const start = getSessionStart(session);
      const end = start ? getSessionEnd(session, start) : null;
      const attendanceCount = Object.keys(session.attendance || {}).length;
      const isCompleted =
        session.status === 'completed' ||
        session.status === 'reschedule_requested' ||
        (end ? end.getTime() < nowMs : false);

      if (viewFilter === 'completed') return isCompleted;
      if (viewFilter === 'pending') return !isCompleted && attendanceCount === 0;
      if (viewFilter === 'soon') {
        if (!start) return false;
        const deltaMins = Math.floor((start.getTime() - nowMs) / 60000);
        const isInProgress = start.getTime() <= nowMs && end && end.getTime() >= nowMs;
        return !isCompleted && (isInProgress || (deltaMins >= 0 && deltaMins <= 60));
      }
      return true;
    });
  }, [normalizedSearch, sortedSessions, viewFilter]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading today’s sessions...</p>
      </Card>
    );
  }

  if (error) {
    const fallbackMsg = error.message;
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">{fallbackMsg}</p>
      </Card>
    );
  }

  if (!orderedSessions.length) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">No sessions scheduled for today.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white/95 p-3 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Today</div>
              <div className="text-lg font-semibold text-slate-900">{summary.total}</div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-blue-700">Live/Soon</div>
              <div className="text-lg font-semibold text-blue-900">{summary.soon}</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-amber-700">Pending</div>
              <div className="text-lg font-semibold text-amber-900">{summary.pending}</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-emerald-700">Completed</div>
              <div className="text-lg font-semibold text-emerald-900">{summary.completed}</div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by student, course, or time"
              className="h-10 sm:max-w-md"
            />
            <div className="flex flex-wrap items-center gap-2">
              {([
                ['all', `All ${summary.total}`],
                ['soon', `Live/Soon ${summary.soon}`],
                ['pending', `Pending ${summary.pending}`],
                ['completed', `Completed ${summary.completed}`],
              ] as const).map(([key, label]) => (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={viewFilter === key ? 'default' : 'outline'}
                  className="h-8 rounded-full px-3"
                  onClick={() => setViewFilter(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border-slate-200 bg-white/95 shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur">
              <div className="grid grid-cols-[1.15fr_1fr_0.9fr_1.1fr_240px] items-center gap-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Child Name</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Today&apos;s Session Status</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Course</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Actions</div>
              </div>
            </div>

            {filteredSessions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No sessions match your current search/filter.
                </p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  studentNames={getKnownNames(session)}
                  onMarkAttendance={setSelectedSession}
                />
              ))
            )}
          </div>
        </div>
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
