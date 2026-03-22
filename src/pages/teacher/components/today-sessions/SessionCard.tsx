import React, { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { TeacherSession } from '../../../../types/Teacher';
import { format, differenceInMinutes, isAfter, isBefore } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';

interface SessionCardProps {
  session: TeacherSession;
  studentNames?: string[];
  onMarkAttendance: (session: TeacherSession) => void;
  onComplete: (sessionId: string) => Promise<void>;
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

export const SessionCard: React.FC<SessionCardProps> = ({ session, studentNames, onMarkAttendance, onComplete }) => {
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

  const durationMinutes = (() => {
    const explicitCandidates = [
      Number((session as any).durationMins),
      Number((session as any).durationMinutes),
      Number((session as any).duration),
    ];
    const explicit = explicitCandidates.find((value) => Number.isFinite(value) && value > 0);
    if (typeof explicit === 'number') return Math.round(explicit);
    const calculated = differenceInMinutes(sessionEnd, sessionStart);
    return calculated > 0 ? calculated : 30;
  })();

  const now = new Date();
  const timeUntilStart = differenceInMinutes(sessionStart, now);
  const isInProgress = isAfter(now, sessionStart) && isBefore(now, sessionEnd);
  const isCompleted = isAfter(now, sessionEnd);

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

    if (directJoinUrl) {
      openMeetingLink(directJoinUrl);
      return;
    }

    if (!enrollmentId) {
      toast({
        title: 'Meeting link unavailable',
        description: 'No Teams meeting link is configured for this class yet.',
        variant: 'destructive',
      });
      return;
    }

    setIsStartingClass(true);
    try {
      const enrollmentSnap = await getDoc(doc(db, 'enrollments', enrollmentId));
      const data = enrollmentSnap.data() as any;
      const fallbackJoinUrl =
        (typeof data?.joinUrl === 'string' && data.joinUrl.trim()) ||
        (typeof data?.meetingLink === 'string' && data.meetingLink.trim()) ||
        '';

      if (!fallbackJoinUrl) {
        toast({
          title: 'Meeting link unavailable',
          description: 'No Teams meeting link is configured for this enrollment.',
          variant: 'destructive',
        });
        return;
      }

      openMeetingLink(fallbackJoinUrl);
    } catch (err) {
      console.error('Failed to open meeting link', err);
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

  return (
    <Card className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={statusMap[session.status]?.variant || 'secondary'}>
            {statusMap[session.status]?.label || 'Scheduled'}
          </Badge>
          {hasRescheduleRequested && (
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
              Reschedule requested
            </Badge>
          )}
          {timeUntilStart > 0 && timeUntilStart <= 60 && (
            <Badge variant="outline">
              Starts in {timeUntilStart} min
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {format(sessionStart, 'PPPP')} · {(session.startTime || format(sessionStart, 'HH:mm'))}
          {(session.endTime || format(sessionEnd, 'HH:mm'))
            ? ` - ${session.endTime || format(sessionEnd, 'HH:mm')}`
            : ''}
          {' '}({durationMinutes} min)
        </p>
        {courseLabel ? (
          <h3 className="text-lg font-semibold">{courseLabel}</h3>
        ) : (
          <h3 className="text-lg font-semibold">Course</h3>
        )}
        <p className="text-sm">
          <span className="text-muted-foreground">Student: </span>
          <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-900">
            {resolvedStudentNames.length > 0
              ? resolvedStudentNames.join(', ')
              : `${attendanceSummary.total} assigned`}
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Attendance: {attendanceSummary.present + attendanceSummary.absent + attendanceSummary.late + attendanceSummary.rescheduled} of {attendanceSummary.total} marked
        </p>
        <div className="flex gap-2 mt-1">
          <span className="text-green-600">✅ {attendanceSummary.present}</span>
          <span className="text-red-600">❌ {attendanceSummary.absent}</span>
          <span className="text-yellow-600">⏰ {attendanceSummary.late}</span>
          <span className="text-amber-700">Resched {attendanceSummary.rescheduled}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={handleStartClass}
          disabled={isStartingClass}
        >
          {isStartingClass ? 'Opening…' : 'Start Class'}
        </Button>
        <Button onClick={() => onMarkAttendance(session)} variant="secondary">
          Mark Attendance
        </Button>
        {isInProgress && (
          <Button variant="default">
            Start Session
          </Button>
        )}
        {(isCompleted || session.status === 'in_progress') && (
          <Button variant="ghost" onClick={() => onComplete(session.id)}>
            Complete Session
          </Button>
        )}
        <Button variant="outline">
          Add Notes
        </Button>
      </div>
    </Card>
  );
};
