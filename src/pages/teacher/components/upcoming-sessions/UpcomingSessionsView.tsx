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
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';

interface UpcomingSessionsViewProps {
  teacherId?: string;
}

export const UpcomingSessionsView: React.FC<UpcomingSessionsViewProps> = ({ teacherId }) => {
  const { sessions, isLoading, error } = useUpcomingSessions(teacherId);
  const { students } = useTeacherFilteredStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [selectedSession, setSelectedSession] = useState<TeacherSession | null>(null);
  const [isLessonPlanModalOpen, setIsLessonPlanModalOpen] = useState(false);

  const handleViewLessonPlan = (session: TeacherSession) => {
    setSelectedSession(session);
    setIsLessonPlanModalOpen(true);
  };

  const formatSessionDate = (rawDate: string, pattern: string) => {
    try {
      return format(parseISO(rawDate), pattern);
    } catch {
      return rawDate || '-';
    }
  };

  const courseOptions = useMemo(() => {
    const courses = new Set(sessions.map(s => s.courseName).filter(Boolean));
    return Array.from(courses) as string[];
  }, [sessions]);

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s: any) => {
      const id = s.uid || s.id;
      const name = s.fullName || s.studentName || s.displayName || s.name || '';
      if (id && name) map.set(String(id), String(name));
    });
    return map;
  }, [students]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredSessions = useMemo(() => {
    const resolveStudentNames = (session: TeacherSession) =>
      (session.kidIds || [])
        .map((id) => studentNameById.get(String(id)))
        .filter((name): name is string => Boolean(name && name.trim()));

    return [...sessions]
      .filter((session) => {
        const studentNames = resolveStudentNames(session);
        const displayDate = (() => {
          return formatSessionDate(session.date, 'EEE, dd MMM');
        })();

        const haystack = [
          session.courseName || '',
          session.date || '',
          displayDate,
          session.startTime || '',
          session.endTime || '',
          ...studentNames,
        ]
          .join(' ')
          .toLowerCase();

        const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
        const matchesCourse = !courseFilter || session.courseName === courseFilter;
        return matchesSearch && matchesCourse;
      })
      .sort((a, b) => {
        const aKey = `${a.date || ''}T${a.startTime || '00:00'}`;
        const bKey = `${b.date || ''}T${b.startTime || '00:00'}`;
        return aKey.localeCompare(bKey);
      });
  }, [sessions, studentNameById, normalizedSearch, courseFilter]);

  if (isLoading) {
    return <Card className="p-6"><p>Loading upcoming sessions...</p></Card>;
  }

  if (error) {
    return <Card className="p-6"><p className="text-muted-foreground">{error.message}</p></Card>;
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white/95 p-3 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Input
            placeholder="Search by child, course, date, or time"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 md:max-w-md"
          />
          <Select
            value={courseFilter || 'all'}
            onValueChange={(value) => setCourseFilter(value === 'all' ? '' : value)}
          >
            <SelectTrigger className="h-10 md:w-[240px]">
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
          <Badge variant="outline" className="h-8 w-fit px-3 text-xs font-medium">
            Upcoming {filteredSessions.length}
          </Badge>
        </div>
      </Card>

      {filteredSessions.length === 0 ? (
        <Card className="p-6 text-center">
          <p>No upcoming sessions in the next 7 days.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-slate-200 bg-white/95 shadow-sm">
          <div className="overflow-auto">
            <div className="min-w-[1050px]">
              <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur">
                <div className="grid grid-cols-[1fr_0.9fr_1.2fr_1fr_0.8fr_260px] items-center gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Child Name</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Course</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Actions</div>
                </div>
              </div>

              {filteredSessions.map((session) => {
                const childNames = (session.kidIds || [])
                  .map((id) => studentNameById.get(String(id)))
                  .filter((name): name is string => Boolean(name && name.trim()));

                const childLabel =
                  childNames.length > 0 ? childNames.join(', ') : `${session.kidIds?.length || 0} students`;

                return (
                  <div key={session.id} className="border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50/40">
                    <div className="grid grid-cols-[1fr_0.9fr_1.2fr_1fr_0.8fr_260px] items-center gap-3">
                      <div className="text-sm font-medium text-slate-700">
                        {formatSessionDate(session.date, 'EEE, dd MMM')}
                      </div>
                      <div className="text-sm font-medium text-slate-900">
                        {session.startTime}
                        {session.endTime ? ` - ${session.endTime}` : ''}
                      </div>
                      <div className="truncate text-sm font-semibold text-slate-900">{childLabel}</div>
                      <div className="truncate text-sm text-slate-800">{session.courseName}</div>
                      <div>
                        <Badge variant="secondary">Scheduled</Badge>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        {session.lessonPlanUrl ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleViewLessonPlan(session)}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Plan
                          </Button>
                        ) : null}
                        <Button size="sm" variant="outline">
                          Set Reminder
                        </Button>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
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
