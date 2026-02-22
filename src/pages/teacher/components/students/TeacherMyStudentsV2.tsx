import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../../lib/firebaseConfig';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';

type Kid = {
  id: string;
  fullName?: string;
  displayName?: string;
  name?: string;
  parentName?: string;
  [key: string]: any;
};

type ClassSession = {
  id: string;
  teacherId?: string;
  kidIds?: string[];
  kidId?: string;
  courseId?: string;
  courseLabel?: string;
  courseName?: string;
  startAt?: any;
  status?: string;
  [key: string]: any;
};

type KidSummary = {
  kidId: string;
  courseId?: string;
  courseLabel?: string;
  nextSession?: ClassSession | null;
  lastSession?: ClassSession | null;
  totalSessions: number;
  completedCount: number;
  cancelledCount: number;
};

const WINDOW_DAYS = 60;

function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return 0;
}

function formatDateTime(value: any): string {
  const ms = toMillis(value);
  if (!ms) return '—';
  return new Date(ms).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function TeacherMyStudentsV2({ teacherId }: { teacherId?: string }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const kidsQuery = useQuery({
    queryKey: ['teacherKidsV2', teacherId],
    enabled: Boolean(teacherId),
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    queryFn: async (): Promise<Kid[]> => {
      if (!teacherId) return [];
      const snap = await getDocs(
        query(collection(db, 'kids'), where('teacherIds', 'array-contains', teacherId))
      );
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    },
  });

  const sessionsQuery = useQuery({
    queryKey: ['teacherSessionsWindow', teacherId],
    enabled: Boolean(teacherId),
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    queryFn: async (): Promise<ClassSession[]> => {
      if (!teacherId) return [];
      const now = Date.now();
      const start = Timestamp.fromMillis(now - WINDOW_DAYS * 24 * 60 * 60 * 1000);
      const end = Timestamp.fromMillis(now + WINDOW_DAYS * 24 * 60 * 60 * 1000);

      const base = collection(db, 'classSessions');
      try {
        const q = query(
          base,
          where('teacherId', '==', teacherId),
          where('startAt', '>=', start),
          where('startAt', '<=', end)
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      } catch (err: any) {
        const message = String(err?.message || '');
        if (
          err?.code === 'failed-precondition' ||
          /requires an index|index is currently building/i.test(message)
        ) {
          const fallbackSnap = await getDocs(query(base, where('teacherId', '==', teacherId)));
          const all = fallbackSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
          return all.filter((session) => {
            const startAt = toMillis(session.startAt);
            return startAt >= start.toMillis() && startAt <= end.toMillis();
          });
        }
        throw err;
      }
    },
  });

  const summaries = useMemo(() => {
    const sessions = (sessionsQuery.data ?? []) as ClassSession[];
    const now = Date.now();
    const map = new Map<string, KidSummary>();

    sessions.forEach((session) => {
      const kidId = session.kidIds?.[0] || session.kidId;
      if (!kidId) return;
      const existing = map.get(kidId) || {
        kidId,
        totalSessions: 0,
        completedCount: 0,
        cancelledCount: 0,
        nextSession: null,
        lastSession: null,
      };
      const startAt = toMillis(session.startAt);
      existing.totalSessions += 1;
      const status = String(session.status || '').toLowerCase();
      if (status === 'completed') existing.completedCount += 1;
      if (status === 'cancelled' || status === 'canceled' || status === 'no_show') {
        existing.cancelledCount += 1;
      }
      if (startAt >= now) {
        const currentNext = existing.nextSession ? toMillis(existing.nextSession.startAt) : Infinity;
        if (startAt < currentNext) existing.nextSession = session;
      } else {
        const currentLast = existing.lastSession ? toMillis(existing.lastSession.startAt) : 0;
        if (startAt > currentLast) existing.lastSession = session;
      }
      map.set(kidId, existing);
    });

    map.forEach((entry) => {
      const best = entry.nextSession || entry.lastSession;
      entry.courseId = best?.courseId;
      entry.courseLabel =
        best?.courseLabel || best?.courseName || best?.courseId || undefined;
    });

    return map;
  }, [sessionsQuery.data]);

  const kids = (kidsQuery.data ?? []) as Kid[];
  const filteredKids = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return kids;
    return kids.filter((kid) => {
      const name = (kid.fullName || kid.displayName || kid.name || '').toLowerCase();
      return name.includes(term);
    });
  }, [kids, search]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Students</h2>
          <p className="text-sm text-gray-600">
            Based on assigned students and class sessions.
          </p>
        </div>
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search students"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {kidsQuery.isLoading ? (
        <div className="text-sm text-gray-600">Loading students...</div>
      ) : kids.length === 0 ? (
        <div className="text-sm text-gray-600">No students assigned yet.</div>
      ) : (
        <div className="grid gap-4">
          {filteredKids.map((kid) => {
            const name = kid.fullName || kid.displayName || kid.name || 'Unnamed student';
            const summary = summaries.get(kid.id);
            const courseLabel = summary?.courseLabel || '—';
            const nextLabel = summary?.nextSession ? formatDateTime(summary.nextSession.startAt) : 'No upcoming class';
            const lastLabel = summary?.lastSession ? formatDateTime(summary.lastSession.startAt) : 'Not started yet';

            return (
              <div
                key={kid.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold text-gray-900">{name}</div>
                    <div className="mt-1 text-sm text-gray-600">Course: {courseLabel}</div>
                    <div className="mt-1 text-sm text-gray-600">Next class: {nextLabel}</div>
                    <div className="mt-1 text-sm text-gray-600">Last class: {lastLabel}</div>
                    {summary ? (
                      <div className="mt-2 text-xs text-gray-500">
                        Sessions: {summary.totalSessions} • Completed: {summary.completedCount} • Cancelled: {summary.cancelledCount}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-gray-500">
                        No classes scheduled yet in this window.
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/teacher/students/${kid.id}/topic-progress`)}
                    >
                      Open Topics
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/teacher/students/${kid.id}/topic-progress`)}
                    >
                      Weekly Insights
                    </Button>
                    <Button onClick={() => navigate('/teacher?tab=schedule')}>Schedule</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
