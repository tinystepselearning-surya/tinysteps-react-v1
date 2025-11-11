import React, { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { useTeacherSessions } from '../../hooks/useTeacherSessions';
import { TeacherSession } from '../../../../types/Teacher';
import { SessionCard } from './SessionCard';
import { AttendanceForm } from './AttendanceForm';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, functions } from '../../../../lib/firebaseConfig';
import { useAuthStore } from '../../../../store/useAuthStore';
import { toast } from '@components/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';

interface TodaySessionsListProps {
  teacherId?: string;
}

export const TodaySessionsList: React.FC<TodaySessionsListProps> = ({ teacherId }) => {
  const { user } = useAuthStore();
  const { sessions, isLoading, error } = useTeacherSessions(teacherId);
  const [selectedSession, setSelectedSession] = useState<TeacherSession | null>(null);

  const handleComplete = async (sessionId: string) => {
    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        status: 'completed',
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid,
      });
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

  const handleAttendanceSubmit = async (
    attendance: Record<string, { status: 'present' | 'absent' | 'late'; notes?: string }>
  ) => {
    if (!selectedSession) return;
    try {
      await updateDoc(doc(db, 'sessions', selectedSession.id), {
        attendance,
        status: 'completed',
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid,
      });
      try {
        const markComplete = httpsCallable(functions, 'onSessionComplete');
        await markComplete({ sessionId: selectedSession.id });
      } catch (fnErr) {
        console.warn('onSessionComplete callable unavailable', fnErr);
        const message =
          fnErr instanceof Error
            ? fnErr.message
            : (fnErr as { message?: string })?.message || 'Background processing failed.';
        toast({
          title: 'Post-processing failed',
          description: message,
          variant: 'destructive',
        });
      }
      toast({ title: 'Attendance saved', description: 'All attendance entries stored.' });
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
    return (
      <Card className="p-6">
        <p className="text-sm text-red-500">{error.message}</p>
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
