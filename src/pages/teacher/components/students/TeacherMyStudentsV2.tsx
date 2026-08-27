import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, Timestamp, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../../lib/firebaseConfig';
import { getDocsLogged } from '../../../../lib/firestoreReadLogging';
import { operationalTeacherRecordBelongsTo } from '../../../../lib/teacherIdentity';
import { useAuthStore } from '../../../../store/useAuthStore';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { isEnrollmentOperationallyActive } from '../../../../lib/sessionScheduleIntegrity';

type Enrollment = {
  id: string;
  enrollmentId?: string;
  teacherId?: string;
  assignedTeacherId?: string;
  primaryTeacherId?: string;
  teacherUid?: string;
  teacher_id?: string;
  teacherIds?: string[];
  kidId?: string;
  studentId?: string;
  childId?: string;
  kidIds?: string[];
  studentIds?: string[];
  childIds?: string[];
  childrenIds?: string[];
  courseId?: string;
  courseLabel?: string;
  courseName?: string;
  status?: string;
  archived?: boolean;
  archivedAt?: unknown;
  isArchived?: boolean;
  studentName?: string;
  childName?: string;
  kidName?: string;
  studentSnapshot?: Record<string, unknown>;
  childSnapshot?: Record<string, unknown>;
  kidSnapshot?: Record<string, unknown>;
  parentName?: string;
  [key: string]: any;
};

type ClassSession = {
  id: string;
  teacherId?: string;
  assignedTeacherId?: string;
  primaryTeacherId?: string;
  teacherUid?: string;
  teacher_id?: string;
  teacherIds?: string[];
  kidIds?: string[];
  kidId?: string;
  studentId?: string;
  childId?: string;
  childIds?: string[];
  studentIds?: string[];
  childrenIds?: string[];
  enrollmentId?: string;
  courseId?: string;
  courseLabel?: string;
  courseName?: string;
  studentName?: string;
  childName?: string;
  kidName?: string;
  studentSnapshot?: Record<string, unknown>;
  childSnapshot?: Record<string, unknown>;
  kidSnapshot?: Record<string, unknown>;
  startAt?: any;
  status?: string;
  [key: string]: any;
};

type EnrollmentSummary = {
  enrollmentId: string;
  entityId?: string | null;
  courseId?: string;
  nextSession?: ClassSession | null;
  lastSession?: ClassSession | null;
  totalSessions: number;
  completedCount: number;
  cancelledCount: number;
  studentName?: string;
  courseName?: string;
};

type TeacherAliasField =
  | 'teacherId'
  | 'teacherIds'
  | 'assignedTeacherId'
  | 'primaryTeacherId'
  | 'teacherUid'
  | 'teacher_id';

type TeacherAliasQueryResult<T> = {
  rows: T[];
  deniedAliases: TeacherAliasField[];
};

type QueryError = Error & { code?: string | null };

const WINDOW_DAYS = 60;
const ACTIVE_STATUSES = new Set(['trial', 'active', 'paused', 'enrolled', 'current', 'ongoing']);
const PAST_STATUSES = new Set(['completed', 'discontinued', 'expired', 'cancelled', 'canceled', 'inactive', 'archived', 'ended', 'past']);

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

function normalizeEnrollmentStatus(value?: string | null): string {
  const raw = normalizeStatus(value);
  if (!raw) return 'active';
  if (raw === 'pending_teacher') return 'trial';
  if (raw === 'pending_payment' || raw === 'pending_lp' || raw === 'pending_lp_assignment') return 'active';
  if (raw === 'enrolled' || raw === 'current' || raw === 'ongoing') return 'active';
  if (raw === 'canceled') return 'cancelled';
  return raw;
}

function readName(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readNestedName(value: unknown): string {
  return readName((value as Record<string, unknown> | undefined)?.name);
}

function titleCaseFromId(value?: string | null): string {
  const raw = String(value || '').replace(/[-_]+/g, ' ').trim();
  if (!raw) return '—';
  return raw.replace(/\b\w/g, (m) => m.toUpperCase());
}

function createPermissionDeniedError(message: string): QueryError {
  const error = new Error(message) as QueryError;
  error.code = 'permission-denied';
  return error;
}

function isPermissionDeniedError(error: unknown): boolean {
  const code = typeof (error as QueryError | undefined)?.code === 'string'
    ? String((error as QueryError).code).toLowerCase()
    : '';
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || '').toLowerCase();
  return code.includes('permission-denied') || message.includes('missing or insufficient permissions');
}

function devLogMyStudents(
  phase: 'debug' | 'info',
  message: string,
  details?: Record<string, unknown>,
) {
  if (!import.meta.env.DEV) return;
  const logger = phase === 'info' ? console.info : console.debug;
  logger(`[TeacherMyStudentsV2] ${message}`, details || {});
}

function extractEntityIds(row: Record<string, unknown> | undefined): string[] {
  if (!row) return [];

  const arrayValues = [
    Array.isArray(row.kidIds) ? row.kidIds : [],
    Array.isArray(row.studentIds) ? row.studentIds : [],
    Array.isArray(row.childIds) ? row.childIds : [],
    Array.isArray(row.childrenIds) ? row.childrenIds : [],
  ];

  return Array.from(
    new Set(
      [
        row.kidId,
        row.studentId,
        row.childId,
        ...arrayValues.flat(),
      ]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  );
}

function resolveEnrollmentEntityId(enrollment: Enrollment): string | null {
  return extractEntityIds(enrollment as Record<string, unknown>)[0] || null;
}

function resolveSessionStudentName(session?: ClassSession | null): string {
  if (!session) return '';
  return (
    readName(session.studentName) ||
    readName(session.childName) ||
    readName(session.kidName) ||
    readNestedName((session as Record<string, unknown>).studentSnapshot) ||
    readNestedName((session as Record<string, unknown>).childSnapshot) ||
    readNestedName((session as Record<string, unknown>).kidSnapshot)
  );
}

function resolveEnrollmentSnapshotName(enrollment: Enrollment): string {
  return (
    readName(enrollment.studentName) ||
    readName(enrollment.childName) ||
    readName(enrollment.kidName) ||
    readNestedName((enrollment as Record<string, unknown>).studentSnapshot) ||
    readNestedName((enrollment as Record<string, unknown>).childSnapshot) ||
    readNestedName((enrollment as Record<string, unknown>).kidSnapshot)
  );
}

function resolveEnrollmentStudentName(enrollment: Enrollment, summary?: EnrollmentSummary | null): string {
  return (
    resolveEnrollmentSnapshotName(enrollment) ||
    readName(summary?.studentName) ||
    'Student name pending'
  );
}

function resolveEnrollmentCourseLabel(enrollment: Enrollment, summary?: EnrollmentSummary | null): string {
  return (
    readName(enrollment.courseName) ||
    readName(enrollment.courseLabel) ||
    readName(summary?.courseName) ||
    titleCaseFromId(enrollment.courseId || summary?.courseId)
  );
}

function resolveEnrollmentDedupKey(enrollment: Enrollment): string {
  return (
    readName(enrollment.id) ||
    readName(enrollment.enrollmentId) ||
    readName(enrollment.kidId) ||
    readName(enrollment.childId) ||
    readName(enrollment.studentId) ||
    `${readName(enrollment.courseId)}::${resolveEnrollmentStudentName(enrollment)}`
  );
}

async function fetchTeacherEnrollments(teacherId: string): Promise<TeacherAliasQueryResult<Enrollment>> {
  const base = collection(db, 'enrollments');
  const merged = new Map<string, Enrollment>();
  const primarySnap = await getDocsLogged(
    'TeacherMyStudentsV2:enrollments:teacherId',
    query(base, where('teacherId', '==', teacherId)),
    { source: 'src/pages/teacher/components/students/TeacherMyStudentsV2.tsx' },
  );

  primarySnap.docs.forEach((docSnap) => {
    const data = { id: docSnap.id, ...(docSnap.data() as any) } as Enrollment;
    if (!operationalTeacherRecordBelongsTo(data as Record<string, unknown>, teacherId)) return;
    const dedupeKey = resolveEnrollmentDedupKey(data);
    merged.set(dedupeKey, { ...merged.get(dedupeKey), ...data });
  });

  devLogMyStudents('debug', 'loaded canonical enrollments', {
    teacherId,
    rows: merged.size,
  });

  return { rows: Array.from(merged.values()), deniedAliases: [] };
}

async function fetchTeacherSessionsWindow(teacherId: string): Promise<TeacherAliasQueryResult<ClassSession>> {
  const now = Date.now();
  const start = Timestamp.fromMillis(now - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const end = Timestamp.fromMillis(now + WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const startMs = start.toMillis();
  const endMs = end.toMillis();
  const base = collection(db, 'classSessions');
  const merged = new Map<string, ClassSession>();

  try {
    const primarySnap = await getDocsLogged(
      'TeacherMyStudentsV2:sessions-window:teacherId',
      query(base, where('teacherId', '==', teacherId), where('startAt', '>=', start), where('startAt', '<=', end)),
      { source: 'src/pages/teacher/components/students/TeacherMyStudentsV2.tsx' },
    );

    primarySnap.docs.forEach((docSnap) => {
      const data = { id: docSnap.id, ...(docSnap.data() as any) } as ClassSession;
      if (!operationalTeacherRecordBelongsTo(data as Record<string, unknown>, teacherId)) return;
      const startAtMs = toMillis(data.startAt);
      if (!startAtMs || startAtMs < startMs || startAtMs > endMs) return;
      merged.set(docSnap.id, data);
    });
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      throw createPermissionDeniedError('Unable to load session history due to permissions');
    }
    throw error;
  }

  devLogMyStudents('debug', 'loaded canonical classSessions window', {
    teacherId,
    rows: merged.size,
  });

  return { rows: Array.from(merged.values()), deniedAliases: [] };
}

export function TeacherMyStudentsV2({ teacherId }: { teacherId?: string }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'active' | 'past'>('active');

  const enrollmentsQuery = useQuery({
    queryKey: ['teacherEnrollments', teacherId],
    enabled: Boolean(teacherId),
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<TeacherAliasQueryResult<Enrollment>> => {
      if (!teacherId) return { rows: [], deniedAliases: [] };
      return fetchTeacherEnrollments(teacherId);
    },
  });

  const sessionsQuery = useQuery({
    queryKey: ['teacherSessionsWindow', teacherId],
    enabled: Boolean(teacherId),
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<TeacherAliasQueryResult<ClassSession>> => {
      if (!teacherId) return { rows: [], deniedAliases: [] };
      return fetchTeacherSessionsWindow(teacherId);
    },
  });

  const enrollmentRows = useMemo(() => {
    const rows = (enrollmentsQuery.data?.rows ?? []) as Enrollment[];
    return rows.map((enrollment) => ({
      ...enrollment,
      resolvedEntityId: resolveEnrollmentEntityId(enrollment),
    }));
  }, [enrollmentsQuery.data]);

  const summaries = useMemo(() => {
    const sessions = (sessionsQuery.data?.rows ?? []) as ClassSession[];
    const now = Date.now();
    const byEnrollment = new Map<string, EnrollmentSummary>();
    const byEntityCourse = new Map<string, EnrollmentSummary>();

    sessions.forEach((session) => {
      const entityId = extractEntityIds(session as Record<string, unknown>)[0] || null;
      const courseId = readName(session.courseId);
      const enrollmentId = readName(session.enrollmentId);
      const key = entityId ? `${entityId}__${courseId}` : '';

      const updateSummary = (summary: EnrollmentSummary) => {
        const startAt = toMillis(session.startAt);
        const status = normalizeStatus(session.status);
        const sessionName = resolveSessionStudentName(session);
        const sessionCourseName =
          readName(session.courseName) ||
          readName(session.courseLabel) ||
          titleCaseFromId(session.courseId);

        summary.totalSessions += 1;
        if (status === 'completed') summary.completedCount += 1;
        if (status === 'cancelled' || status === 'canceled' || status === 'no_show') {
          summary.cancelledCount += 1;
        }
        if (!summary.studentName && sessionName) summary.studentName = sessionName;
        if (!summary.courseName && sessionCourseName) summary.courseName = sessionCourseName;

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
          entityId,
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

      if (key) {
        const existingFallback = byEntityCourse.get(key) || {
          enrollmentId: key,
          entityId,
          courseId,
          totalSessions: 0,
          completedCount: 0,
          cancelledCount: 0,
          nextSession: null,
          lastSession: null,
        };
        updateSummary(existingFallback);
        byEntityCourse.set(key, existingFallback);
      }
    });

    return { byEnrollment, byEntityCourse };
  }, [sessionsQuery.data]);

  const filteredEnrollments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return enrollmentRows.filter((enrollment) => {
      const status = normalizeEnrollmentStatus(enrollment.status);
      const isActive = isEnrollmentOperationallyActive(enrollment as Record<string, unknown>);
      const isPast = !isActive;

      if (tab === 'active' && !isActive) return false;
      if (tab === 'past' && !isPast) return false;

      if (!term) return true;

      const summary =
        summaries.byEnrollment.get(enrollment.id) ||
        (enrollment.resolvedEntityId
          ? summaries.byEntityCourse.get(`${enrollment.resolvedEntityId}__${readName(enrollment.courseId)}`)
          : null);

      const name = resolveEnrollmentStudentName(enrollment, summary).toLowerCase();
      const courseLabel = resolveEnrollmentCourseLabel(enrollment, summary).toLowerCase();
      const parentName = readName(enrollment.parentName).toLowerCase();

      return name.includes(term) || courseLabel.includes(term) || parentName.includes(term);
    });
  }, [enrollmentRows, search, summaries, tab]);

  const devWarnings = useMemo(() => {
    if (!import.meta.env.DEV || user?.role !== 'admin') return null;
    const missingEntityId = enrollmentRows.filter((enrollment) => !enrollment.resolvedEntityId).length;
    const missingStudentName = enrollmentRows.filter((enrollment) => !resolveEnrollmentSnapshotName(enrollment)).length;
    const missingCourseId = enrollmentRows.filter((enrollment) => !readName(enrollment.courseId)).length;

    if (missingEntityId === 0 && missingStudentName === 0 && missingCourseId === 0) return null;
    return { missingEntityId, missingStudentName, missingCourseId };
  }, [enrollmentRows, user?.role]);

  const studentsPermissionDenied = isPermissionDeniedError(enrollmentsQuery.error);
  const sessionsPermissionDenied = isPermissionDeniedError(sessionsQuery.error);
  const isLoading = enrollmentsQuery.isLoading || sessionsQuery.isLoading;

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white/95 p-3 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Students</h2>
              <p className="text-sm text-gray-600">Compact enrollment and class history view.</p>
            </div>
            <div className="w-full md:w-auto md:min-w-[360px]">
              <Input
                placeholder="Search student or course"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('active')}
              className={`h-8 rounded-full px-3 text-xs font-semibold ${
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
              className={`h-8 rounded-full px-3 text-xs font-semibold ${
                tab === 'past'
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-200 bg-white text-gray-700'
              }`}
            >
              Past Students
            </button>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {tab === 'active' ? 'Active' : 'Past'} {filteredEnrollments.length}
            </span>
          </div>
        </div>
      </Card>

      {import.meta.env.DEV && devWarnings ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {devWarnings.missingEntityId > 0 ? `Enrollments missing entity id: ${devWarnings.missingEntityId}. ` : ''}
          {devWarnings.missingStudentName > 0 ? `Enrollments missing snapshot name: ${devWarnings.missingStudentName}. ` : ''}
          {devWarnings.missingCourseId > 0 ? `Enrollments missing courseId: ${devWarnings.missingCourseId}.` : ''}
        </div>
      ) : null}

      {sessionsPermissionDenied ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Session history unavailable due to permissions.
        </div>
      ) : null}

      {isLoading ? (
        <Card className="p-6">
          <div className="text-sm text-gray-600">Loading students...</div>
        </Card>
      ) : studentsPermissionDenied ? (
        <Card className="p-6">
          <div className="text-sm text-gray-600">Unable to load students due to permissions</div>
        </Card>
      ) : filteredEnrollments.length === 0 ? (
        <Card className="p-6">
          <div className="text-sm text-gray-600">
            {tab === 'active' ? 'No active students.' : 'No past students.'}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden border-slate-200 bg-white/95 shadow-sm">
          <div className="overflow-auto">
            <div className="min-w-[1180px]">
              <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur">
                <div className="grid grid-cols-[1.2fr_1fr_0.9fr_1fr_1fr_1fr_240px] items-center gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Student</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Course</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next Class</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Class</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Session Stats</div>
                  <div className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</div>
                </div>
              </div>

              {filteredEnrollments.map((enrollment) => {
                const summary =
                  summaries.byEnrollment.get(enrollment.id) ||
                  (enrollment.resolvedEntityId
                    ? summaries.byEntityCourse.get(`${enrollment.resolvedEntityId}__${readName(enrollment.courseId)}`)
                    : null);
                const name = resolveEnrollmentStudentName(enrollment, summary);
                const parentName = readName(enrollment.parentName);
                const status = normalizeEnrollmentStatus(enrollment.status);
                const isPast = !isEnrollmentOperationallyActive(enrollment as Record<string, unknown>);
                const statusLabel = isPast ? 'Past' : 'Active';
                const rawStatus = enrollment.archived === true || Boolean(enrollment.archivedAt) || enrollment.isArchived === true
                  ? 'archived'
                  : status || 'active';
                const isUnknownStatus = !ACTIVE_STATUSES.has(status) && !PAST_STATUSES.has(status) && status !== '';
                const courseLabel = resolveEnrollmentCourseLabel(enrollment, summary);
                const nextLabel = summary?.nextSession
                  ? formatDateTime(summary.nextSession.startAt)
                  : 'No upcoming class';
                const lastLabel = summary?.lastSession
                  ? formatDateTime(summary.lastSession.startAt)
                  : 'Getting started';

                return (
                  <div key={enrollment.id} className="border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50/40">
                    <div className="grid grid-cols-[1.2fr_1fr_0.9fr_1fr_1fr_1fr_240px] items-center gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{name}</div>
                        <div className="text-xs uppercase tracking-wide text-slate-400">{rawStatus}</div>
                        {parentName ? (
                          <div className="truncate text-xs text-slate-500">Parent: {parentName}</div>
                        ) : null}
                      </div>

                      <div className="min-w-0 truncate text-sm text-slate-800">{courseLabel}</div>

                      <div className="min-w-0">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isPast
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {statusLabel}
                        </span>
                        {isUnknownStatus ? (
                          <div className="mt-1 text-[11px] font-semibold text-amber-600">Unknown</div>
                        ) : null}
                      </div>

                      <div className="min-w-0 truncate text-sm text-slate-700">{nextLabel}</div>
                      <div className="min-w-0 truncate text-sm text-slate-700">{lastLabel}</div>

                      <div className="min-w-0 text-xs text-slate-600">
                        {summary ? (
                          <>
                            <span className="font-medium text-slate-700">{summary.totalSessions}</span> total ·{' '}
                            <span className="font-medium text-slate-700">{summary.completedCount}</span> completed ·{' '}
                            <span className="font-medium text-slate-700">{summary.cancelledCount}</span> cancelled
                          </>
                        ) : (
                          'No classes in current window'
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(
                              `/teacher/students/${enrollment.resolvedEntityId}/topic-progress?from=students&tab=topic${
                                enrollment.courseId ? `&courseId=${encodeURIComponent(enrollment.courseId)}` : ''
                              }&enrollmentId=${encodeURIComponent(enrollment.id)}`,
                              {
                                state:
                                  name && name !== 'Student name pending'
                                    ? { studentName: name }
                                    : undefined,
                              },
                            )
                          }
                          disabled={!enrollment.resolvedEntityId}
                        >
                          Open Topics
                        </Button>
                        <Button size="sm" onClick={() => navigate('/teacher?tab=schedule')}>
                          Schedule
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
    </div>
  );
}
