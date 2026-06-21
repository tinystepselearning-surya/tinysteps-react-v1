import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Badge } from '@components/ui/badge';
import { useUpcomingSessions } from '../../hooks/useUpcomingSessions';
import { INDIA_TIME_ZONE, formatSessionDate, formatSessionTimeRange, getSessionStartDate } from '../../../../lib/sessionTime';
import { TeacherSession } from '../../../../types/Teacher';
import { CanvaLessonPlanModal } from '../lesson-plan/CanvaLessonPlanModal';
import { FileText } from 'lucide-react';
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';
import { useAuthStore } from '../../../../store/useAuthStore';
import { app } from '../../../../lib/firebaseConfig';
import {
  getTeacherSessionEntityIdsByField,
  getTeacherSessionInlineStudentNames as getResolvedInlineStudentNames,
  resolveTeacherSessionStudentName,
  type TeacherSessionStudentNameLookups,
} from '../../utils/resolveTeacherSessionStudentName';

interface UpcomingSessionsViewProps {
  teacherId?: string;
}

export const getSessionInlineStudentNames = (session: TeacherSession): string[] => {
  return getResolvedInlineStudentNames(session as unknown as Record<string, unknown>);
};

export const getSessionStudentLabel = (
  session: TeacherSession,
  lookups?: TeacherSessionStudentNameLookups,
): string => {
  return resolveTeacherSessionStudentName(session, lookups).name;
};

const readLookupName = (row: Record<string, unknown>): string => {
  const values = [
    row.fullName,
    row.studentName,
    row.displayName,
    row.name,
    row.childName,
    row.kidName,
  ];

  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return '';
};

export const UpcomingSessionsView: React.FC<UpcomingSessionsViewProps> = ({ teacherId }) => {
  const { sessions, isLoading, error, enrollmentsById, entityDocById, deniedLookups } = useUpcomingSessions(teacherId);
  const { students } = useTeacherFilteredStudents();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [selectedSession, setSelectedSession] = useState<TeacherSession | null>(null);
  const [isLessonPlanModalOpen, setIsLessonPlanModalOpen] = useState(false);

  const handleViewLessonPlan = (session: TeacherSession) => {
    setSelectedSession(session);
    setIsLessonPlanModalOpen(true);
  };

  const courseOptions = useMemo(() => {
    const courses = new Set(sessions.map((s) => s.courseName).filter(Boolean));
    return Array.from(courses) as string[];
  }, [sessions]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const shouldDebugNameResolution = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return window.localStorage.getItem('debugTeacherSessionNames') === '1' || params.get('debugNames') === '1';
  }, []);

  const teacherOwnedEntityDocById = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();

    students.forEach((student: any) => {
      const id = String(student?.uid || student?.id || student?.userId || '').trim();
      if (!id) return;

      const row = student as Record<string, unknown>;
      const name = readLookupName(row);
      if (!name) return;

      map.set(id, {
        id,
        name,
        fullName: name,
        displayName: name,
        studentName: name,
        childName: name,
        kidName: name,
      });
    });

    return map;
  }, [students]);

  const combinedEntityDocById = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    entityDocById.forEach((value, key) => map.set(key, value));
    teacherOwnedEntityDocById.forEach((value, key) => map.set(key, value));
    return map;
  }, [entityDocById, teacherOwnedEntityDocById]);

  const resolvedSessions = useMemo(() => {
    return sessions.map((session) => {
      const enrollmentId = typeof session.enrollmentId === 'string' ? session.enrollmentId.trim() : '';
      const enrollment = enrollmentId ? enrollmentsById.get(enrollmentId) : undefined;
      const resolved = resolveTeacherSessionStudentName(session, {
        enrollment,
        entityDocById: combinedEntityDocById,
      });

      return {
        session,
        enrollment,
        resolved,
      };
    });
  }, [combinedEntityDocById, enrollmentsById, sessions]);

  useEffect(() => {
    if (!shouldDebugNameResolution) return;

    console.info('[TinyStepsBuildFingerprint]', {
      buildTime: import.meta.env.VITE_BUILD_TIME,
      appEnv: import.meta.env.MODE,
      firebaseProjectId: app.options.projectId,
      hostname: window.location.hostname,
    });

    console.info('[TeacherUpcomingRuntimeAudit]', {
      hostname: window.location.hostname,
      firebaseProjectId: app.options.projectId,
      authUid: user?.uid || null,
      teacherIdUsed: teacherId || null,
      sessionCount: sessions.length,
      firstFiveSessions: sessions.slice(0, 5).map((session) => ({
        id: session.id,
        enrollmentId: session.enrollmentId,
        date: session.date,
        startTime: session.startTime,
        startAt: (session as any).startAt || null,
        teacherId: session.teacherId,
        teacherIds: session.teacherIds,
        assignedTeacherId: (session as any).assignedTeacherId,
        primaryTeacherId: (session as any).primaryTeacherId,
        teacherUid: (session as any).teacherUid,
        kidId: session.kidId,
        studentId: session.studentId,
        childId: session.childId,
        kidIds: session.kidIds,
        studentIds: session.studentIds,
        childIds: session.childIds,
        childrenIds: session.childrenIds,
        studentName: session.studentName,
        childName: session.childName,
        kidName: session.kidName,
        studentNames: session.studentNames,
        childNames: session.childNames,
        kidNames: session.kidNames,
      })),
      lookupMapSizes: {
        enrollmentsById: enrollmentsById.size,
        entityDocById: combinedEntityDocById.size,
        teacherStudentLookup: teacherOwnedEntityDocById.size,
      },
    });

    resolvedSessions.forEach(({ session, resolved }) => {
      const ids = getTeacherSessionEntityIdsByField(session as unknown as Record<string, unknown>);
      const enrollmentId = typeof session.enrollmentId === 'string' ? session.enrollmentId.trim() : '';
      const enrollment = enrollmentId ? enrollmentsById.get(enrollmentId) : undefined;

      console.info('[TeacherUpcomingNameResolution:RUNTIME]', {
        sessionId: (session as any).id || (session as any).sessionId,
        enrollmentId: session.enrollmentId,
        ids: {
          kidId: ids.kidId,
          studentId: ids.studentId,
          childId: ids.childId,
          kidIds: ids.kidIds,
          studentIds: ids.studentIds,
          childIds: ids.childIds,
          childrenIds: ids.childrenIds,
        },
        embeddedNames: {
          studentName: (session as any).studentName,
          childName: (session as any).childName,
          kidName: (session as any).kidName,
          studentNames: (session as any).studentNames,
          childNames: (session as any).childNames,
          kidNames: (session as any).kidNames,
        },
        enrollmentNameFields: {
          studentName: enrollment?.studentName,
          childName: enrollment?.childName,
          kidName: enrollment?.kidName,
          studentFullName: enrollment?.studentFullName,
          childFullName: enrollment?.childFullName,
          kidFullName: enrollment?.kidFullName,
          name: enrollment?.name,
          displayName: enrollment?.displayName,
        },
        lookupMapSizes: {
          enrollmentsById: enrollmentsById.size,
          entityDocById: combinedEntityDocById.size,
        },
        deniedLookups,
        resolvedName: resolved.name,
        resolvedFrom: resolved.source,
      });
    });
  }, [
    combinedEntityDocById,
    deniedLookups,
    enrollmentsById,
    resolvedSessions,
    sessions,
    shouldDebugNameResolution,
    teacherId,
    teacherOwnedEntityDocById,
    user?.uid,
  ]);

  const filteredSessions = useMemo(() => {
    return [...resolvedSessions]
      .filter(({ session, resolved }) => {
        const displayDate = formatSessionDate(session, {
          timeZone: INDIA_TIME_ZONE,
          dateOptions: { weekday: 'short', day: '2-digit', month: 'short' },
        });
        const displayTime = formatSessionTimeRange(session, { timeZone: INDIA_TIME_ZONE });

        const haystack = [
          session.courseName || '',
          session.date || '',
          displayDate,
          displayTime,
          session.startTime || '',
          session.endTime || '',
          resolved.name,
        ]
          .join(' ')
          .toLowerCase();

        const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
        const matchesCourse = !courseFilter || session.courseName === courseFilter;

        return matchesSearch && matchesCourse;
      })
      .sort((a, b) => {
        const aStart = getSessionStartDate(a.session)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bStart = getSessionStartDate(b.session)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aStart - bStart;
      });
  }, [resolvedSessions, normalizedSearch, courseFilter]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <p>Loading upcoming sessions...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">{error.message}</p>
      </Card>
    );
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
                  <div className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</div>
                </div>
              </div>

              {filteredSessions.map(({ session, resolved }) => {
                const childLabel = resolved.name;

                return (
                  <div
                    key={session.id}
                    className="border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50/40"
                  >
                    <div className="grid grid-cols-[1fr_0.9fr_1.2fr_1fr_0.8fr_260px] items-center gap-3">
                      <div className="text-sm font-medium text-slate-700">
                        {formatSessionDate(session, {
                          timeZone: INDIA_TIME_ZONE,
                          dateOptions: { weekday: 'short', day: '2-digit', month: 'short' },
                        })}
                      </div>

                      <div className="text-sm font-medium text-slate-900">
                        {formatSessionTimeRange(session, { timeZone: INDIA_TIME_ZONE })}
                      </div>

                      <div className="truncate text-sm font-semibold text-slate-900">
                        {childLabel}
                      </div>

                      <div className="truncate text-sm text-slate-800">
                        {session.courseName}
                      </div>

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

      {selectedSession?.lessonPlanUrl && (
        <CanvaLessonPlanModal
          isOpen={isLessonPlanModalOpen}
          onClose={() => {
            setIsLessonPlanModalOpen(false);
            setSelectedSession(null);
          }}
          lessonPlanUrl={selectedSession.lessonPlanUrl}
          sessionTitle={`${selectedSession.courseName} - ${formatSessionTimeRange(selectedSession, { timeZone: INDIA_TIME_ZONE })}`}
          courseName={selectedSession.courseName}
        />
      )}
    </div>
  );
};
