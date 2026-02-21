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
