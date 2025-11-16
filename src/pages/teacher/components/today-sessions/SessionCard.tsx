import React, { useMemo } from 'react';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { TeacherSession } from '../../../../types/Teacher';
import { format, differenceInMinutes, isAfter, isBefore } from 'date-fns';

interface SessionCardProps {
  session: TeacherSession;
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
};

export const SessionCard: React.FC<SessionCardProps> = ({ session, onMarkAttendance, onComplete }) => {
  const now = new Date();
  const sessionStart = new Date(`${session.date}T${session.startTime}`);
  const sessionEnd = new Date(`${session.date}T${session.endTime}`);

  const timeUntilStart = differenceInMinutes(sessionStart, now);
  const isInProgress = isAfter(now, sessionStart) && isBefore(now, sessionEnd);
  const isCompleted = isAfter(now, sessionEnd);

  const attendanceSummary = useMemo(() => {
    const attendance = session.attendance || {};
    const present = Object.values(attendance).filter(s => s === 'present').length;
    const absent = Object.values(attendance).filter(s => s === 'absent').length;
    const late = Object.values(attendance).filter(s => s === 'late').length;
    return { present, absent, late, total: session.kidIds?.length || 0 };
  }, [session.attendance, session.kidIds]);

  const joinDisabled = !session.joinUrl;

  return (
    <Card className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={statusMap[session.status]?.variant || 'secondary'}>
            {statusMap[session.status]?.label || 'Scheduled'}
          </Badge>
          {timeUntilStart > 0 && timeUntilStart <= 60 && (
            <Badge variant="outline">
              Starts in {timeUntilStart} min
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {format(sessionStart, 'PPPP')} · {session.startTime} - {session.endTime} (30 min)
        </p>
        <h3 className="text-lg font-semibold">{session.courseName || 'Course'}</h3>
        <p className="text-sm text-muted-foreground">
          Students: {attendanceSummary.present + attendanceSummary.absent + attendanceSummary.late} of {attendanceSummary.total} present
        </p>
        <div className="flex gap-2 mt-1">
          <span className="text-green-600">✅ {attendanceSummary.present}</span>
          <span className="text-red-600">❌ {attendanceSummary.absent}</span>
          <span className="text-yellow-600">⏰ {attendanceSummary.late}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (session.joinUrl) {
              window.open(session.joinUrl, '_blank', 'noopener,noreferrer');
            }
          }}
          disabled={joinDisabled}
        >
          Join on Zoom
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
