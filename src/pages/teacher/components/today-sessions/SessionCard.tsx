import React from 'react';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { TeacherSession } from '../../../../types/Teacher';
import { format } from 'date-fns';

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
  const startLabel = session.startTime;
  const endLabel = session.endTime;
  const status = statusMap[session.status];
  const joinDisabled = !session.joinUrl;

  return (
    <Card className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <p className="text-sm text-muted-foreground">
          {format(new Date(`${session.date}T${session.startTime}`), 'PPPP')} · {startLabel} - {endLabel}
        </p>
        <h3 className="text-lg font-semibold">{session.courseName || 'Course'}</h3>
        <p className="text-sm text-muted-foreground">
          Students: {session.kidIds?.length ?? 0}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={status?.variant || 'secondary'}>{status?.label || 'Scheduled'}</Badge>
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
        {session.status !== 'completed' && (
          <Button variant="ghost" onClick={() => onComplete(session.id)}>
            Complete Session
          </Button>
        )}
      </div>
    </Card>
  );
};
