import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, documentId, getDocs, query, Timestamp, where } from 'firebase/firestore';
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
  status?: string;
  [key: string]: any;
};

type Enrollment = {
  id: string;
  teacherId?: string;
  kidId?: string;
  studentId?: string;
  kidIds?: string[];
  courseId?: string;
  courseLabel?: string;
  courseName?: string;
  status?: string;
  [key: string]: any;
};

type Course = {
  id: string;
  label?: string;
  name?: string;
  title?: string;
  [key: string]: any;
};

type ClassSession = {
  id: string;
  teacherId?: string;
  kidIds?: string[];
  kidId?: string;
  enrollmentId?: string;
  courseId?: string;
  courseLabel?: string;
  courseName?: string;
  startAt?: any;
  status?: string;
  [key: string]: any;
};

type EnrollmentSummary = {
  enrollmentId: string;
  kidId?: string | null;
  courseId?: string;
  nextSession?: ClassSession | null;
  lastSession?: ClassSession | null;
  totalSessions: number;
  completedCount: number;
  cancelledCount: number;
};

const WINDOW_DAYS = 60;
const ACTIVE_STATUSES = new Set(['trial', 'active', 'paused', 'enrolled', 'current']);
const PAST_STATUSES = new Set(['completed', 'discontinued', 'expired', 'cancelled', 'canceled']);
const ARCHIVED_KID_STATUSES = new Set(['archived', 'inactive', 'test']);

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

function normalizeStatus(value?: string | null): string {
  return String(value || '').trim().toLowerCase();
}

function titleCaseFromId(value?: string | null): string {
  const raw = String(value || '').replace(/[-_]+/g, ' ').trim();
  if (!raw) return '—';
  return raw.replace(/\b\w/g, (m) => m.toUpperCase());
}

export function TeacherMyStudentsV2({ teacherId }: { teacherId?: string }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'active' | 'past'>('active');

  const enrollmentsQuery = useQuery({
    queryKey: ['teacherEnrollments', teacherId],
    enabled: Boolean(teacherId),
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    queryFn: async (): Promise<Enrollment[]> => {
      if (!teacherId) return [];
      const snap = await getDocs(
        query(collection(db, 'enrollments'), where('teacherId', '==', teacherId))
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

  const enrollmentRows = useMemo(() => {
    const rows = (enrollmentsQuery.data ?? []) as Enrollment[];
    return rows.map((enr) => {
      const resolvedKidId = enr.kidId || enr.studentId || (enr.kidIds && enr.kidIds[0]) || null;
      return { ...enr, resolvedKidId };
    });
  }, [enrollmentsQuery.data]);

  const enrollmentKidIds = useMemo(() => {
    const ids = new Set<string>();
    enrollmentRows.forEach((enr) => {
      if (enr.resolvedKidId) ids.add(enr.resolvedKidId);
    });
    return Array.from(ids);
  }, [enrollmentRows]);

  const kidsQuery = useQuery({
    queryKey: ['teacherEnrollmentKids', teacherId, enrollmentKidIds.join('|')],
    enabled: Boolean(teacherId) && enrollmentKidIds.length > 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    queryFn: async (): Promise<Kid[]> => {
      if (!teacherId || enrollmentKidIds.length === 0) return [];
      const kidsCol = collection(db, 'kids');
      const chunks: string[][] = [];
      for (let i = 0; i < enrollmentKidIds.length; i += 10) {
        chunks.push(enrollmentKidIds.slice(i, i + 10));
      }
      const results = new Map<string, Kid>();
      await Promise.all(
        chunks.map(async (chunk) => {
          const snap = await getDocs(query(kidsCol, where(documentId(), 'in', chunk)));
          snap.docs.forEach((d) => results.set(d.id, { id: d.id, ...(d.data() as any) }));
        }),
      );
      return Array.from(results.values());
    },
  });

  const courseIds = useMemo(() => {
    const ids = new Set<string>();
    enrollmentRows.forEach((enr) => {
      if (enr.courseId) ids.add(enr.courseId);
    });
    return Array.from(ids);
  }, [enrollmentRows]);

  const coursesQuery = useQuery({
    queryKey: ['teacherEnrollmentCourses', courseIds.join('|')],
    enabled: courseIds.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    queryFn: async (): Promise<Course[]> => {
      if (courseIds.length === 0) return [];
      const coursesCol = collection(db, 'courses');
      const chunks: string[][] = [];
      for (let i = 0; i < courseIds.length; i += 10) {
        chunks.push(courseIds.slice(i, i + 10));
      }
      const results = new Map<string, Course>();
      await Promise.all(
        chunks.map(async (chunk) => {
          const snap = await getDocs(query(coursesCol, where(documentId(), 'in', chunk)));
          snap.docs.forEach((d) => results.set(d.id, { id: d.id, ...(d.data() as any) }));
        }),
      );
      return Array.from(results.values());
    },
  });

  const summaries = useMemo(() => {
    const sessions = (sessionsQuery.data ?? []) as ClassSession[];
    const now = Date.now();
    const byEnrollment = new Map<string, EnrollmentSummary>();
    const byKidCourse = new Map<string, EnrollmentSummary>();

    sessions.forEach((session) => {
      const kidId = session.kidIds?.[0] || session.kidId;
      const courseId = session.courseId;
      const enrollmentId = session.enrollmentId;
      if (!kidId) return;

      const startAt = toMillis(session.startAt);
      const status = String(session.status || '').toLowerCase();
      const key = `${kidId}__${courseId || ''}`;

      const updateSummary = (summary: EnrollmentSummary) => {
        summary.totalSessions += 1;
        if (status === 'completed') summary.completedCount += 1;
        if (status === 'cancelled' || status === 'canceled' || status === 'no_show') {
          summary.cancelledCount += 1;
        }
        if (startAt >= now) {
          const currentNext = summary.nextSession ? toMillis(summary.nextSession.startAt) : Infinity;
          if (startAt < currentNext) summary.nextSession = session;
        } else {
          const currentLast = summary.lastSession ? toMillis(summary.lastSession.startAt) : 0;
          if (startAt > currentLast) summary.lastSession = session;
        }
      };

      if (enrollmentId) {
        const existing = byEnrollment.get(enrollmentId) || {
          enrollmentId,
          kidId,
          courseId,
          totalSessions: 0,
          completedCount: 0,
          cancelledCount: 0,
          nextSession: null,
          lastSession: null,
        };
        updateSummary(existing);
        byEnrollment.set(enrollmentId, existing);
      }

      const existingFallback = byKidCourse.get(key) || {
        enrollmentId: key,
        kidId,
        courseId,
        totalSessions: 0,
        completedCount: 0,
        cancelledCount: 0,
        nextSession: null,
        lastSession: null,
      };
      updateSummary(existingFallback);
      byKidCourse.set(key, existingFallback);
    });

    return { byEnrollment, byKidCourse };
  }, [sessionsQuery.data]);

  const kidsMap = useMemo(() => {
    const map = new Map<string, Kid>();
    (kidsQuery.data ?? []).forEach((kid) => map.set(kid.id, kid as Kid));
    return map;
  }, [kidsQuery.data]);

  const coursesMap = useMemo(() => {
    const map = new Map<string, Course>();
    (coursesQuery.data ?? []).forEach((course) => map.set(course.id, course as Course));
    return map;
  }, [coursesQuery.data]);

  const filteredEnrollments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enrollmentRows.filter((enr) => {
      const status = normalizeStatus(enr.status);
      const isPast = PAST_STATUSES.has(status);
      const isActive = ACTIVE_STATUSES.has(status) || status === '' || (!isPast && !ACTIVE_STATUSES.has(status));

      if (!enr.resolvedKidId) return false;
      const kid = kidsMap.get(enr.resolvedKidId);
      if (!kid) return false;
      const kidStatus = normalizeStatus(kid.status);
      const isArchived = Boolean(kidStatus && ARCHIVED_KID_STATUSES.has(kidStatus));
      if (tab === 'active' && (isArchived || !isActive)) return false;
      if (tab === 'past' && !isArchived && !isPast) return false;

      if (!term) return true;
      const courseLabel =
        enr.courseLabel ||
        enr.courseName ||
        coursesMap.get(enr.courseId || '')?.label ||
        coursesMap.get(enr.courseId || '')?.name ||
        coursesMap.get(enr.courseId || '')?.title ||
        titleCaseFromId(enr.courseId);
      const name = (kid?.fullName || kid?.displayName || kid?.name || '').toLowerCase();
      return name.includes(term) || courseLabel.toLowerCase().includes(term);
    });
  }, [enrollmentRows, kidsMap, coursesMap, search, tab]);

  const devWarnings = useMemo(() => {
    if (!import.meta.env.DEV) return null;
    const missingKidId = enrollmentRows.filter((enr) => !enr.resolvedKidId).length;
    const missingKid = enrollmentRows.filter((enr) => enr.resolvedKidId && !kidsMap.has(enr.resolvedKidId)).length;
    const missingCourse = enrollmentRows.filter((enr) => !enr.courseId).length;
    if (missingKidId === 0 && missingKid === 0 && missingCourse === 0) return null;
    return { missingKidId, missingKid, missingCourse };
  }, [enrollmentRows, kidsMap]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Students</h2>
          <p className="text-sm text-gray-600">Based on enrollments and course history.</p>
        </div>
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search students or courses"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('active')}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            tab === 'active'
              ? 'bg-blue-600 text-white'
              : 'border border-gray-200 bg-white text-gray-700'
          }`}
        >
          Active Students
        </button>
        <button
          type="button"
          onClick={() => setTab('past')}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            tab === 'past'
              ? 'bg-blue-600 text-white'
              : 'border border-gray-200 bg-white text-gray-700'
          }`}
        >
          Past Students
        </button>
      </div>

      {import.meta.env.DEV && devWarnings ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {devWarnings.missingKidId > 0 ? `Enrollments missing kidId: ${devWarnings.missingKidId}. ` : ''}
          {devWarnings.missingKid > 0 ? `Enrollments missing kid docs: ${devWarnings.missingKid}. ` : ''}
          {devWarnings.missingCourse > 0 ? `Enrollments missing courseId: ${devWarnings.missingCourse}.` : ''}
        </div>
      ) : null}

      {enrollmentsQuery.isLoading || kidsQuery.isLoading ? (
        <div className="text-sm text-gray-600">Loading students...</div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="text-sm text-gray-600">
          {tab === 'active' ? 'No active students.' : 'No past students.'}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEnrollments.map((enr) => {
            const kid = enr.resolvedKidId ? kidsMap.get(enr.resolvedKidId) : undefined;
            const name = kid?.fullName || kid?.displayName || kid?.name || 'Unnamed student';
            const status = normalizeStatus(enr.status);
            const isPast = PAST_STATUSES.has(status);
            const statusLabel = isPast ? 'Past' : 'Active';
            const rawStatus = status || 'active';
            const isUnknownStatus = !ACTIVE_STATUSES.has(status) && !PAST_STATUSES.has(status) && status !== '';
            const kidStatus = normalizeStatus(kid?.status);
            const isArchived = Boolean(kidStatus && ARCHIVED_KID_STATUSES.has(kidStatus));
            const courseLabel =
              enr.courseLabel ||
              enr.courseName ||
              coursesMap.get(enr.courseId || '')?.label ||
              coursesMap.get(enr.courseId || '')?.name ||
              coursesMap.get(enr.courseId || '')?.title ||
              titleCaseFromId(enr.courseId);
            const summary =
              (enr.id && summaries.byEnrollment.get(enr.id)) ||
              (enr.resolvedKidId && summaries.byKidCourse.get(`${enr.resolvedKidId}__${enr.courseId || ''}`)) ||
              null;
            const nextLabel = summary?.nextSession
              ? formatDateTime(summary.nextSession.startAt)
              : 'No upcoming class';
            const lastLabel = summary?.lastSession
              ? formatDateTime(summary.lastSession.startAt)
              : 'Getting started';

            return (
              <div key={enr.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold text-gray-900">{name}</div>
                    <div className="mt-1 text-sm text-gray-600">Course: {courseLabel}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      <span className="inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                        {isArchived ? 'Past' : statusLabel}
                      </span>
                      <span className="ml-2 text-[11px] uppercase tracking-wide text-gray-400">{rawStatus}</span>
                      {isUnknownStatus ? (
                        <span className="ml-2 text-[11px] font-semibold text-amber-600">Unknown status</span>
                      ) : null}
                    </div>
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
                      onClick={() =>
                        navigate(
                          `/teacher/students/${enr.resolvedKidId}/topic-progress?from=students&tab=topic${
                            enr.courseId ? `&courseId=${encodeURIComponent(enr.courseId)}` : ''
                          }&enrollmentId=${encodeURIComponent(enr.id)}`
                        )
                      }
                      disabled={!enr.resolvedKidId}
                    >
                      Open Topics
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
