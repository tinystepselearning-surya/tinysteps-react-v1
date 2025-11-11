import React, { useMemo } from 'react';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { ParentSession } from '../../../../types/Parent';

interface UpcomingSessionsListProps {
  sessions: ParentSession[];
}

const groupSessions = (sessions: ParentSession[]) => {
  const groups: Record<string, ParentSession[]> = {};
  sessions.forEach((session) => {
    groups[session.date] ||= [];
    groups[session.date].push(session);
  });
  return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
};

export const UpcomingSessionsList: React.FC<UpcomingSessionsListProps> = ({ sessions }) => {
  const grouped = useMemo(() => groupSessions(sessions), [sessions]);

  if (!sessions.length) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">No upcoming sessions found.</Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Upcoming Sessions</h3>
      {grouped.map(([date, daySessions]) => (
        <div key={date} className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">{date}</p>
          {daySessions.map((session) => (
            <div key={session.id} className="border rounded-lg p-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{session.kidName} · {session.courseName}</p>
                <p className="text-xs text-muted-foreground">{session.startTime} · {session.teacherName || 'Teacher assigned'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={session.status === 'scheduled' ? 'secondary' : 'default'} className="capitalize">
                  {session.status.replace('_', ' ')}
                </Badge>
                <button className="text-sm text-primary underline">Set reminder</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </Card>
  );
};
