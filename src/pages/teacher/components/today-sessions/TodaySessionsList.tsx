import React, { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { useTeacherSessions } from '../../hooks/useTeacherSessions';
import { TeacherSession, AttendanceStatus } from '../../../../types/Teacher';
import { SessionCard } from './SessionCard';
import { AttendanceForm } from './AttendanceForm';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../../../lib/firebaseConfig';
import { useAuthStore } from '../../../../store/useAuthStore';
import { toast } from '@components/hooks/use-toast';
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';

interface TodaySessionsListProps {
  teacherId?: string;
}


export const TodaySessionsList: React.FC<TodaySessionsListProps> = ({ teacherId }) => {
  const { user } = useAuthStore();
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

  const handleComplete = async (sessionId: string) => {
    try {
      const batch = writeBatch(db);
      const payload = {
        status: 'completed',
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid,
      };
      batch.set(doc(db, 'classSessions', sessionId), payload, { merge: true });
      await batch.commit();
      toast({ title: 'Session updated', description: 'Session marked as completed.' });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Unable to update session',
        description: err instanceof Error ? err.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleAttendanceSubmit = async (data: { attendance: Record<string, { status: AttendanceStatus; notes?: string; mastery?: string; topics?: string[] }>; sessionNotes: string }) => {
    if (!selectedSession) return;
    try {
      const batch = writeBatch(db);
      
      // Update session document
      const sessionUpdate = {
        attendance: data.attendance,
        notes: data.sessionNotes,
        status: 'completed',
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ?? null,
      };
      batch.set(doc(db, 'classSessions', selectedSession.id), sessionUpdate, { merge: true });

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

        for (const topicId of topics) {
          if (!topicId) continue;
          const progRef = doc(db, 'students', kidId, 'progress', topicId);
          const payload: Record<string, any> = {
            teacherRemark: entry.notes ?? '',
            lastEvidence: 'attendance',
            lastSessionId: selectedSession.id,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid ?? null,
            source: 'attendance',
          };
          if (typeof entry.mastery === 'string' && entry.mastery) {
            payload.mastery = entry.mastery;
          }
          batch.set(progRef, payload, { merge: true });
        }
      }

      await batch.commit();
      // Background post-processing (credits, alerts) is handled by the
      // Firestore trigger `onSessionCompleteTrigger` in `functions/`.
      // Avoid calling the callable here to prevent double-processing.
      toast({ title: 'Attendance saved', description: 'Attendance and curriculum completion recorded.' });
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
          onComplete={handleComplete}
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
