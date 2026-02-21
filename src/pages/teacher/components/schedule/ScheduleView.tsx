import React, { useState, useMemo } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { useTeacherSessions } from '../../hooks/useTeacherSessions';
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';
import { AttendanceForm } from '../today-sessions/AttendanceForm';
import { TeacherSession, AttendanceStatus } from '../../../../types/Teacher';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../../../lib/firebaseConfig';
import { useAuthStore } from '../../../../store/useAuthStore';
import { toast } from '@components/hooks/use-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { useProgressPicklists } from '../../../../hooks/useProgressPicklists';

interface ScheduleViewProps {
  teacherId?: string;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ teacherId }) => {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedSession, setSelectedSession] = useState<TeacherSession | null>(null);

  const { config } = useProgressPicklists();

  // Build topic label lookup map
  const topicLabelById = useMemo(() => {
    const map = new Map<string, string>();
    const topics = config?.topics ?? [];
    topics.forEach((topic) => {
      if (topic.id && topic.label) {
        map.set(topic.id, topic.label);
      }
    });
    return map;
  }, [config?.topics]);

  // Calculate date range based on view
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (view === 'month') {
      return { rangeStart: startOfMonth(currentDate), rangeEnd: endOfMonth(currentDate) };
    } else if (view === 'week') {
      return { rangeStart: startOfWeek(currentDate, { weekStartsOn: 0 }), rangeEnd: endOfWeek(currentDate, { weekStartsOn: 0 }) };
    } else {
      // day
      return { rangeStart: currentDate, rangeEnd: currentDate };
    }
  }, [currentDate, view]);

  // Fetch all sessions for the visible range
  const { sessions } = useTeacherSessions(
    teacherId,
    format(rangeStart, 'yyyy-MM-dd'),
    format(rangeEnd, 'yyyy-MM-dd')
  );

  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  // Fetch students for name lookup
  const { students } = useTeacherFilteredStudents();

  // Create quick lookup map: kidId -> studentName
  const studentNameById = useMemo(
    () => new Map(students.map((s) => [s.uid, s.fullName || ''])),
    [students]
  );

  const sessionsByDate = sessions.reduce((acc, session) => {
    if (!acc[session.date]) acc[session.date] = [];
    acc[session.date].push(session);
    return acc;
  }, {} as Record<string, any[]>);

  const handleAttendanceSubmit = async (data: { attendance: Record<string, { status: AttendanceStatus; notes?: string; mastery?: number; topics?: string[] }>; sessionNotes: string }) => {
    if (!selectedSession) return;
    try {
      const batch = writeBatch(db);
      
      // Update session document
      const sessionRef = doc(db, 'sessions', selectedSession.id);
      batch.update(sessionRef, {
        attendance: data.attendance,
        notes: data.sessionNotes,
        status: 'completed',
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ?? null,
      });

      // Write curriculum completion for each kid with topics (only if present/late)
      for (const [kidId, entry] of Object.entries(data.attendance)) {
        const status = entry?.status;
        if (status === 'absent') continue;
        
        const topics = entry?.topics ?? [];
        if (!Array.isArray(topics) || topics.length === 0) continue;

        for (const topicId of topics) {
          if (!topicId) continue;
          const curRef = doc(db, 'students', kidId, 'curriculum', topicId);
          batch.set(curRef, {
            status: 'completed',
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid ?? null,
            source: 'attendance',
            lastSessionId: selectedSession.id,
          }, { merge: true });
        }
      }

      // Write progress docs for each kid with topics (only if present/late)
      for (const [kidId, entry] of Object.entries(data.attendance)) {
        const status = entry?.status;
        if (status === 'absent') continue;
        
        const topics = entry?.topics ?? [];
        if (!Array.isArray(topics) || topics.length === 0) continue;

        // Convert mastery to number (0-100)
        const masteryNum = Number.isFinite(Number(entry.mastery)) ? Number(entry.mastery) : 50;
        
        // Derive scoreBand from mastery
        const scoreBand = masteryNum <= 20 ? '0-20' :
                         masteryNum <= 40 ? '21-40' :
                         masteryNum <= 60 ? '41-60' :
                         masteryNum <= 80 ? '61-80' : '81-100';

        for (const topicId of topics) {
          if (!topicId) continue;
          const progRef = doc(db, 'students', kidId, 'progress', topicId);
          batch.set(progRef, {
            mastery: masteryNum,
            scoreBand: scoreBand,
            teacherRemark: entry.notes ?? '',
            lastEvidence: 'attendance',
            lastSessionId: selectedSession.id,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid ?? null,
            source: 'attendance',
          }, { merge: true });
        }
      }

      await batch.commit();
      toast({ title: 'Attendance saved', description: 'Attendance and curriculum completion recorded.' });
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
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const getTitle = () => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (view === 'week') {
      return `Week of ${format(rangeStart, 'MMM d')} - ${format(rangeEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrev}>Prev</Button>
          <h2 className="text-2xl font-bold">
            {getTitle()}
          </h2>
          <Button variant="outline" size="sm" onClick={handleNext}>Next</Button>
        </div>
        <div className="flex gap-2">
          <Button variant={view === 'month' ? 'default' : 'outline'} onClick={() => setView('month')}>Month</Button>
          <Button variant={view === 'week' ? 'default' : 'outline'} onClick={() => setView('week')}>Week</Button>
          <Button variant={view === 'day' ? 'default' : 'outline'} onClick={() => setView('day')}>Day</Button>
          <Button>Schedule New Session</Button>
        </div>
      </div>

      {view === 'month' && (
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
                    {daySessions.slice(0, 2).map((session, idx) => {
                      // Resolve kid names from kidIds array or fallback to single kidId
                      const kidIds: string[] = session.kidIds?.length ? session.kidIds : [];
                      const kidNames = kidIds
                        .map(id => studentNameById.get(id))
                        .filter(Boolean)
                        .join(', ') || 'Student';
                      
                      const isCompleted = session.status === 'completed';
                      
                      return (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className={`text-xs cursor-pointer hover:bg-secondary/80 ${isCompleted ? 'opacity-70' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSession(session);
                          }}
                        >
                          {isCompleted ? '✓ ' : ''}{session.startTime} · {kidNames}
                        </Badge>
                      );
                    })}
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
      )}

      {view === 'week' && (
        <Card className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const daySessions = sessionsByDate[dateStr] || [];
              return (
                <div key={day.toString()} className={`border rounded p-2 min-h-[150px] ${
                  isToday(day) ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                }`}>
                  <div className="text-center font-semibold mb-2">
                    <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                    <div className="text-sm">{format(day, 'd')}</div>
                  </div>
                  <div className="space-y-1">
                    {daySessions.map((session, idx) => {
                      const kidIds: string[] = session.kidIds?.length ? session.kidIds : [];
                      const kidNames = kidIds
                        .map(id => studentNameById.get(id))
                        .filter(Boolean)
                        .join(', ') || 'Student';
                      
                      const isCompleted = session.status === 'completed';
                      
                      return (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className={`text-xs cursor-pointer hover:bg-secondary/80 w-full justify-start ${isCompleted ? 'opacity-70' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSession(session);
                          }}
                        >
                          <div className="truncate">
                            {isCompleted ? '✓ ' : ''}{session.startTime} · {kidNames}
                          </div>
                        </Badge>
                      );
                    })}
                    {daySessions.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center">No sessions</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {view === 'day' && (
        <Card className="p-6">
          <div className="space-y-2">
            {sessionsByDate[format(currentDate, 'yyyy-MM-dd')]?.length > 0 ? (
              sessionsByDate[format(currentDate, 'yyyy-MM-dd')].map((session, idx) => {
                const kidIds: string[] = session.kidIds?.length ? session.kidIds : [];
                const kidNames = kidIds
                  .map(id => studentNameById.get(id))
                  .filter(Boolean)
                  .join(', ') || 'Student';
                
                // Collect topic labels for completed sessions
                const topicLabels: string[] = [];
                if (session.status === 'completed' && session.attendance) {
                  const topicIds = Object.values(session.attendance)
                    .filter((e: any) => e?.status === 'present' || e?.status === 'late')
                    .flatMap((e: any) => (Array.isArray(e?.topics) ? e.topics : []));
                  
                  // De-dupe while preserving order
                  const uniqueTopicIds = [...new Set(topicIds)];
                  uniqueTopicIds.forEach((id) => {
                    if (id) {
                      topicLabels.push(topicLabelById.get(id) ?? id);
                    }
                  });
                }

                return (
                  <div 
                    key={idx}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{session.startTime} - {session.endTime}</div>
                        <div className="text-sm text-muted-foreground">{kidNames}</div>
                        {session.courseName && (
                          <div className="text-xs text-muted-foreground mt-1">{session.courseName}</div>
                        )}
                      </div>
                      <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                    {topicLabels.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-1 items-center">
                        <span>Topics:</span>
                        {topicLabels.slice(0, 4).map((label, i) => (
                          <span key={i} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                            {label}
                          </span>
                        ))}
                        {topicLabels.length > 4 && (
                          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                            +{topicLabels.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No sessions scheduled for this day
              </div>
            )}
          </div>
        </Card>
      )}

      <AttendanceForm
        open={Boolean(selectedSession)}
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onSubmit={handleAttendanceSubmit}
      />
    </div>
  );
};
