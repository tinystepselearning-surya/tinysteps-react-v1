import React, { useMemo, useState } from 'react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { TeacherSession } from '../../../../types/Teacher';
import { format } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { useAuthStore } from '../../../../store/useAuthStore';

interface SessionCardProps {
  session: TeacherSession;
  studentNames?: string[];
  onMarkAttendance: (session: TeacherSession) => void;
}

const statusMap: Record<
  TeacherSession['status'],
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  scheduled: { label: 'Scheduled', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'outline' },
  reschedule_requested: { label: 'Rescheduled', variant: 'destructive' },
};

export const SessionCard: React.FC<SessionCardProps> = ({ session, studentNames, onMarkAttendance }) => {
  const ATTENDANCE_OPEN_DELAY_MS = 30 * 60 * 1000;
  const ATTENDANCE_CLOSE_WINDOW_MS = 24 * 60 * 60 * 1000;
  const { user } = useAuthStore();
  const [isStartingClass, setIsStartingClass] = useState(false);

  const toDateMaybe = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value?.toDate === 'function') {
      const date = value.toDate();
      if (date instanceof Date && !Number.isNaN(date.getTime())) return date;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
    }
    return null;
  };

  const fromFieldsStart =
    session.date && session.startTime ? new Date(`${session.date}T${session.startTime}`) : null;
  const fromFieldsEnd =
    session.date && session.endTime ? new Date(`${session.date}T${session.endTime}`) : null;
  const startAtFallback = toDateMaybe((session as any).startAt);
  const endAtFallback = toDateMaybe((session as any).endAt);

  const sessionStart =
    fromFieldsStart && !Number.isNaN(fromFieldsStart.getTime())
      ? fromFieldsStart
      : startAtFallback || new Date();

  const sessionEnd =
    fromFieldsEnd && !Number.isNaN(fromFieldsEnd.getTime())
      ? fromFieldsEnd
      : endAtFallback || new Date(sessionStart.getTime() + 30 * 60 * 1000);

  const now = new Date();
  const hasStarted = sessionStart.getTime() <= now.getTime();
  const hasEnded = sessionEnd.getTime() < now.getTime();
  const isLiveNow = hasStarted && !hasEnded;
  const normalizeStartTime = (value: unknown): string | null => {
    const raw = typeof value === 'string' ? value.trim() : '';
    if (!raw) return null;
    const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(raw);
    if (!match) return null;
    const seconds = match[3] || '00';
    return `${match[1]}:${match[2]}:${seconds}`;
  };

  const getSessionStartMillis = (): number | null => {
    if (startAtFallback) return startAtFallback.getTime();
    const dateYmd = typeof session.date === 'string' ? session.date.trim() : '';
    const startTime = normalizeStartTime(session.startTime);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd) || !startTime) return null;
    const parsed = Date.parse(`${dateYmd}T${startTime}+05:30`);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const sessionStartMs = getSessionStartMillis();
  const attendanceAllowedAtMs = sessionStartMs === null ? null : sessionStartMs + ATTENDANCE_OPEN_DELAY_MS;
  const attendanceWindowCloseMs = sessionStartMs === null ? null : sessionStartMs + ATTENDANCE_CLOSE_WINDOW_MS;
  const canOverrideAttendanceTime = String((user as any)?.role || '').trim().toLowerCase() === 'admin';
  const nowMs = Date.now();
  const isAttendanceTimeUnverified =
    !canOverrideAttendanceTime && (attendanceAllowedAtMs === null || attendanceWindowCloseMs === null);
  const isAttendanceTooEarly =
    !canOverrideAttendanceTime && attendanceAllowedAtMs !== null && nowMs < attendanceAllowedAtMs;
  const isAttendanceWindowClosed =
    !canOverrideAttendanceTime && attendanceWindowCloseMs !== null && nowMs > attendanceWindowCloseMs;
  const isAttendanceLocked = isAttendanceTimeUnverified || isAttendanceTooEarly || isAttendanceWindowClosed;
  const attendanceOpensLabel =
    attendanceAllowedAtMs !== null ? format(new Date(attendanceAllowedAtMs), 'h:mm a') : null;

  const getAttendanceStatus = (value: any): string | undefined => {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && typeof value.status === 'string') return value.status;
    return undefined;
  };

  const attendanceSummary = useMemo(() => {
    const attendance = session.attendance || {};
    const statuses = Object.values(attendance)
      .map(getAttendanceStatus)
      .filter(Boolean);
    const present = statuses.filter(s => s === 'present').length;
    const absent = statuses.filter(s => s === 'absent').length;
    const late = statuses.filter(s => s === 'late').length;
    const rescheduled = statuses.filter(s => s === 'reschedule_requested').length;
    return { present, absent, late, rescheduled, total: session.kidIds?.length || 0 };
  }, [session.attendance, session.kidIds]);

  const hasRescheduleRequested = useMemo(() => {
    const attendance = session.attendance || {};
    return (
      session.status === 'reschedule_requested' ||
      Object.values(attendance).some(
        (entry) => getAttendanceStatus(entry) === 'reschedule_requested'
      )
    );
  }, [session.attendance, session.status]);

  const directJoinUrl =
    (typeof session.joinUrl === 'string' && session.joinUrl.trim()) ||
    (typeof session.meetingLink === 'string' && session.meetingLink.trim()) ||
    '';
  const enrollmentIdFromSession =
    (typeof session.enrollmentId === 'string' && session.enrollmentId.trim()) ||
    '';
  const enrollmentIdFromSessionId =
    typeof session.id === 'string' && session.id.includes('_')
      ? session.id.split('_')[0].trim()
      : '';
  const enrollmentId = enrollmentIdFromSession || enrollmentIdFromSessionId;

  const readJoinUrl = (source: any): string =>
    (typeof source?.joinUrl === 'string' && source.joinUrl.trim()) ||
    (typeof source?.meetingLink === 'string' && source.meetingLink.trim()) ||
    '';

  const openMeetingLink = (url: string) => {
    const trimmed = url.trim();
    const isTeamsUrl = /^https?:\/\/([a-z0-9-]+\.)?teams\.microsoft\.com/i.test(trimmed);

    if (isTeamsUrl) {
      const teamsDeepLink = `msteams:${trimmed.replace(/^https?:/, '')}`;
      window.location.assign(teamsDeepLink);
      window.setTimeout(() => {
        window.open(trimmed, '_blank', 'noopener,noreferrer');
      }, 900);
      return;
    }

    window.open(trimmed, '_blank', 'noopener,noreferrer');
  };

  const handleStartClass = async () => {
    if (isStartingClass) return;

    setIsStartingClass(true);
    try {
      let latestEnrollmentJoinUrl = '';
      if (enrollmentId) {
        const enrollmentSnap = await getDoc(doc(db, 'enrollments', enrollmentId));
        latestEnrollmentJoinUrl = readJoinUrl(enrollmentSnap.data());
      }

      // Always prefer live enrollment link so teacher gets freshly updated Teams URLs.
      const resolvedJoinUrl = latestEnrollmentJoinUrl || directJoinUrl;
      if (!resolvedJoinUrl) {
        toast({
          title: 'Meeting link unavailable',
          description: 'No Teams meeting link is configured for this class yet.',
          variant: 'destructive',
        });
        return;
      }

      openMeetingLink(resolvedJoinUrl);
    } catch (err) {
      console.error('Failed to open meeting link', err);
      if (directJoinUrl) {
        openMeetingLink(directJoinUrl);
        return;
      }
      toast({
        title: 'Could not start class',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsStartingClass(false);
    }
  };

  const resolvedStudentNames = useMemo(
    () => (studentNames || []).filter((name) => Boolean(name && name.trim())),
    [studentNames],
  );
  const courseLabel =
    (session as any).courseLabel ||
    session.courseName ||
    (session as any).courseTitle ||
    session.courseId ||
    '';

  const childName =
    resolvedStudentNames.length > 0
      ? resolvedStudentNames.join(', ')
      : `${attendanceSummary.total} assigned`;

  const timeText =
    `${session.startTime || format(sessionStart, 'HH:mm')}${
      (session.endTime || format(sessionEnd, 'HH:mm'))
        ? ` - ${session.endTime || format(sessionEnd, 'HH:mm')}`
        : ''
    }`;

  return (
    <div className="border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50/40">
      <div className="grid grid-cols-[1.15fr_1fr_0.9fr_1.1fr_240px] items-center gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{childName}</div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant={statusMap[session.status]?.variant || 'secondary'}>
              {statusMap[session.status]?.label || 'Scheduled'}
            </Badge>
            {isLiveNow && (
              <Badge className="border border-emerald-300 bg-emerald-100 text-emerald-900">
                Live
              </Badge>
            )}
            {hasRescheduleRequested && (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
                Resched
              </Badge>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-900">{timeText}</div>
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{courseLabel || 'Course'}</div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant={isLiveNow ? 'default' : 'outline'}
            onClick={handleStartClass}
            disabled={isStartingClass}
          >
            {isStartingClass ? 'Opening…' : 'Start Class'}
          </Button>
          <Button
            size="sm"
            onClick={() => onMarkAttendance(session)}
            variant="secondary"
            disabled={isAttendanceLocked}
          >
            Mark Attendance
          </Button>
        </div>
      </div>
      {isAttendanceLocked ? (
        <div className="mt-2 text-right text-xs text-amber-700">
          {isAttendanceTimeUnverified
            ? 'Attendance time could not be verified. Please contact admin.'
            : isAttendanceWindowClosed
              ? 'Attendance window has closed. Please contact admin to update this attendance.'
            : attendanceOpensLabel
              ? `Attendance opens at ${attendanceOpensLabel}`
              : 'Attendance opens 30 minutes after class start'}
        </div>
      ) : null}
    </div>
  );
};
