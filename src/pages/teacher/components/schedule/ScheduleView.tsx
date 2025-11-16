import React, { useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { useTeacherSessions } from '../../hooks/useTeacherSessions';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

interface ScheduleViewProps {
  teacherId?: string;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ teacherId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  // For simplicity, use today's sessions, but in reality, need all sessions
  const { sessions } = useTeacherSessions(teacherId, format(currentDate, 'yyyy-MM-dd'));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const sessionsByDate = sessions.reduce((acc, session) => {
    if (!acc[session.date]) acc[session.date] = [];
    acc[session.date].push(session);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setView('month')}>Month</Button>
          <Button variant="outline" onClick={() => setView('week')}>Week</Button>
          <Button variant="outline" onClick={() => setView('day')}>Day</Button>
          <Button>Schedule New Session</Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-semibold">
              {day}
            </div>
          ))}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const daySessions = sessionsByDate[dateStr] || [];
            return (
              <div
                key={day.toString()}
                className={`p-2 border min-h-[100px] ${
                  isToday(day) ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                }`}
              >
                <div className="text-sm font-medium">{format(day, 'd')}</div>
                <div className="space-y-1 mt-1">
                  {daySessions.slice(0, 2).map((session, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {session.startTime} - {session.courseName}
                    </Badge>
                  ))}
                  {daySessions.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{daySessions.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};