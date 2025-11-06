import { useState, useEffect } from "react";
import { getTeacherSessions, getTodaySessions, getUpcomingTeacherSessions } from "../services/sessionService";
import type { Session } from "../types/student";

interface UseTeacherSessionsResult {
  sessions: Session[];
  todaySessions: Session[];
  upcomingSessions: Session[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTeacherSessions(teacherId: string | null): UseTeacherSessionsResult {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSessions = async () => {
    if (!teacherId) {
      setSessions([]);
      setTodaySessions([]);
      setUpcomingSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [allSessions, todayData, upcomingData] = await Promise.all([
        getTeacherSessions(teacherId),
        getTodaySessions(teacherId),
        getUpcomingTeacherSessions(teacherId, 5),
      ]);

      setSessions(allSessions);
      setTodaySessions(todayData);
      setUpcomingSessions(upcomingData);
    } catch (err) {
      console.error("Error in useTeacherSessions:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch sessions"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [teacherId]);

  return {
    sessions,
    todaySessions,
    upcomingSessions,
    loading,
    error,
    refetch: fetchSessions,
  };
}
