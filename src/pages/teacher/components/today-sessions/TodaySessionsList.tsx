import React, { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { useTeacherSessions } from '../../hooks/useTeacherSessions';
import { TeacherSession, AttendanceStatus } from '../../../../types/Teacher';
import { SessionCard } from './SessionCard';
import { AttendanceForm } from './AttendanceForm';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../../../lib/firebaseConfig';
import { useAuthStore } from '../../../../store/useAuthStore';
import { toast } from '@components/hooks/use-toast';
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';
import {
  hasPresentOrLateAttendance,
  hasRescheduleAttendance,
  queueCreditConsumed,
  queueRescheduleCreditsForAttendance,
} from '../../../../services/rescheduleCredits';

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

  const handleComplete = async (sessionId: string) => {
    try {
      await completeSessionViaBackend(sessionId);
      toast({ title: 'Session completed', description: 'Session finalized successfully.' });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Unable to complete session',
        description: err instanceof Error ? err.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleAttendanceSubmit = async (data: { attendance: Record<string, { status: AttendanceStatus; notes?: string; mastery?: string; topics?: string[] }>; sessionNotes: string }) => {
    if (!selectedSession) return;
    try {
      const batch = writeBatch(db);
      const hasPresentOrLate = hasPresentOrLateAttendance(data.attendance as Record<string, any>);
      const hasReschedule = hasRescheduleAttendance(data.attendance as Record<string, any>);
      const shouldRequestReschedule = hasReschedule && !hasPresentOrLate;
      
      // Update session document
      const sessionUpdate: Record<string, unknown> = {
        attendance: data.attendance,
        notes: data.sessionNotes,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ?? null,
      };
      if (shouldRequestReschedule) {
        sessionUpdate.status = 'reschedule_requested';
      }
      batch.set(doc(db, 'classSessions', selectedSession.id), sessionUpdate, { merge: true });

      if (hasReschedule) {
        await queueRescheduleCreditsForAttendance({
          batch,
          session: selectedSession as Record<string, any>,
          attendance: data.attendance as Record<string, any>,
          actorUid: user?.uid ?? null,
          sessionNotes: data.sessionNotes,
        });
      }

      const makeupCreditId = String((selectedSession as any)?.makeupCreditId || '').trim();
      if (makeupCreditId && hasPresentOrLate) {
        queueCreditConsumed({
          batch,
          creditId: makeupCreditId,
          consumedSessionId: selectedSession.id,
          actorUid: user?.uid ?? null,
        });
      }

      // Write curriculum completion for each kid with topics (only if present/late)
      for (const [kidId, entry] of Object.entries(data.attendance)) {
        const status = entry?.status;
        if (status !== 'present' && status !== 'late') continue;
        
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
        if (status !== 'present' && status !== 'late') continue;
        
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
