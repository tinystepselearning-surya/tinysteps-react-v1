import React, { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { useTeacherSessions } from '../../hooks/useTeacherSessions';
import { TeacherSession, AttendanceStatus } from '../../../../types/Teacher';
import { SessionCard } from './SessionCard';
import { AttendanceForm } from './AttendanceForm';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from '@components/hooks/use-toast';
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';

interface TodaySessionsListProps {
  teacherId?: string;
}


export const TodaySessionsList: React.FC<TodaySessionsListProps> = ({ teacherId }) => {
  const { sessions, isLoading, error } = useTeacherSessions(teacherId);
  const { students } = useTeacherFilteredStudents();
  const [selectedSession, setSelectedSession] = useState<TeacherSession | null>(null);

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((student: any) => {
      const name =
        student.fullName ||
        student.studentName ||
        student.displayName ||
        student.name ||
        '';
      if (!name) return;

      if (student.uid) map.set(String(student.uid), String(name));
      if (student.id) map.set(String(student.id), String(name));
      if (student.userId) map.set(String(student.userId), String(name));
    });
    return map;
  }, [students]);

  const completeSessionViaBackend = async (
    sessionId: string,
    payload?: {
      attendance?: Record<string, { status: AttendanceStatus; notes?: string; mastery?: string; topics?: string[] }>;
      sessionNotes?: string;
    },
  ) => {
    const functions = getFunctions(undefined, 'asia-south1');
    const finalizeSession = httpsCallable(functions, 'onSessionComplete');
    await finalizeSession({
      sessionId,
      ...(payload?.attendance ? { attendance: payload.attendance } : {}),
      ...(typeof payload?.sessionNotes === 'string' ? { sessionNotes: payload.sessionNotes } : {}),
    });
  };

  const handleAttendanceSubmit = async (data: { attendance: Record<string, { status: AttendanceStatus; notes?: string; mastery?: string; topics?: string[] }>; sessionNotes: string }) => {
    if (!selectedSession) return;
    try {
      const functions = getFunctions(undefined, 'asia-south1');
      const saveTeacherSessionProgress = httpsCallable(functions, 'saveTeacherSessionProgress');
      const response: any = await saveTeacherSessionProgress({
        sessionId: selectedSession.id,
        attendance: data.attendance,
        sessionNotes: data.sessionNotes,
        meta: { attendanceOnly: false },
      });
      const hasPresentOrLate = response?.data?.hasPresentOrLate === true;
      if (hasPresentOrLate) {
        await completeSessionViaBackend(selectedSession.id, {
          attendance: data.attendance,
          sessionNotes: data.sessionNotes,
        });
        toast({ title: 'Attendance saved', description: 'Attendance recorded and session completed.' });
      } else {
        toast({ title: 'Attendance saved', description: 'Attendance and curriculum completion recorded.' });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Unable to save attendance',
        description: err instanceof Error ? err.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const orderedSessions = useMemo(() => sessions, [sessions]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading today’s sessions...</p>
      </Card>
    );
  }

  if (error) {
    const fallbackMsg = error.message;
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">{fallbackMsg}</p>
      </Card>
    );
  }

  if (!orderedSessions.length) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">No sessions scheduled for today.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orderedSessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          studentNames={session.kidIds
            .map((kidId) => studentNameById.get(String(kidId)))
            .filter((name): name is string => Boolean(name))}
          onMarkAttendance={setSelectedSession}
        />
      ))}
      <AttendanceForm
        open={Boolean(selectedSession)}
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onSubmit={handleAttendanceSubmit}
      />
    </div>
  );
};
