import React, { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Badge } from '@components/ui/badge';
import { useUpcomingSessions } from '../../hooks/useUpcomingSessions';
import { TeacherSession } from '../../../../types/Teacher';
import { format, parseISO } from 'date-fns';
import { CanvaLessonPlanModal } from '../lesson-plan/CanvaLessonPlanModal';
import { FileText } from 'lucide-react';

interface UpcomingSessionsViewProps {
  teacherId?: string;
}

export const UpcomingSessionsView: React.FC<UpcomingSessionsViewProps> = ({ teacherId }) => {
  const { sessions, isLoading, error } = useUpcomingSessions(teacherId);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [selectedSession, setSelectedSession] = useState<TeacherSession | null>(null);
  const [isLessonPlanModalOpen, setIsLessonPlanModalOpen] = useState(false);

  const handleViewLessonPlan = (session: TeacherSession) => {
    setSelectedSession(session);
    setIsLessonPlanModalOpen(true);
  };

  const groupedSessions = useMemo(() => {
    const groups: Record<string, TeacherSession[]> = {};
    sessions.forEach((session) => {
      if (!groups[session.date]) {
        groups[session.date] = [];
      }
      groups[session.date].push(session);
    });
    return groups;
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesSearch = session.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           session.date.includes(searchTerm);
      const matchesCourse = !courseFilter || session.courseName === courseFilter;
      return matchesSearch && matchesCourse;
    });
  }, [sessions, searchTerm, courseFilter]);

  const courseOptions = useMemo(() => {
    const courses = new Set(sessions.map(s => s.courseName).filter(Boolean));
    return Array.from(courses) as string[];
  }, [sessions]);

  if (isLoading) {
    return <Card className="p-6"><p>Loading upcoming sessions...</p></Card>;
  }

  if (error) {
    return <Card className="p-6"><p className="text-red-500">{error.message}</p></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Input
          placeholder="Search by course or date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={courseFilter || 'all'}
          onValueChange={(value) => setCourseFilter(value === 'all' ? '' : value)}
        >
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courseOptions.map((course) => (
              <SelectItem key={course} value={course}>
                {course}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {Object.keys(groupedSessions).length === 0 ? (
        <Card className="p-6 text-center">
          <p>No upcoming sessions in the next 7 days.</p>
        </Card>
      ) : (
        Object.entries(groupedSessions)
          .filter(([date]) => filteredSessions.some(s => s.date === date))
          .map(([date, daySessions]) => (
            <div key={date} className="space-y-4">
              <h3 className="text-lg font-semibold">
                {format(parseISO(date), 'EEEE, MMMM d')} ({daySessions.length} sessions)
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {daySessions
                  .filter(session => filteredSessions.includes(session))
                  .map((session) => (
                    <Card key={session.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{session.startTime}</p>
                            <p className="text-sm text-muted-foreground">{session.courseName}</p>
                            <p className="text-sm">{session.kidIds.length} students</p>
                          </div>
                          <Badge variant="secondary">Scheduled</Badge>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {session.lessonPlanUrl && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleViewLessonPlan(session)}
                              className="gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              View Lesson Plan
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            Set Reminder
                          </Button>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          ))
      )}

      {/* Canva Lesson Plan Modal */}
      {selectedSession?.lessonPlanUrl && (
        <CanvaLessonPlanModal
          isOpen={isLessonPlanModalOpen}
          onClose={() => {
            setIsLessonPlanModalOpen(false);
            setSelectedSession(null);
          }}
          lessonPlanUrl={selectedSession.lessonPlanUrl}
          sessionTitle={`${selectedSession.courseName} - ${selectedSession.startTime}`}
          courseName={selectedSession.courseName}
        />
      )}
    </div>
  );
};
