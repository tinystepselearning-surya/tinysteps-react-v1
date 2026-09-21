import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  loadManualReminderDayBuckets,
  loadManualReminderSelectedDate,
} from '../../pages/admin/todaysNotificationsManualData';
import type { ManualReminderSessionDoc } from '../../pages/admin/todaysNotificationsManualData';
import {
  clearSessionsManagementSnapshotCacheForTests,
  getCachedSessionsManagementRowsForReadLabel,
} from '../../lib/sessionsManagementSnapshot';
import type {
  SessionsManagementDatePayload,
  SessionsManagementSnapshotPayload,
} from '../../lib/sessionsManagementSnapshot';

const pageSource = readFileSync(
  resolve(process.cwd(), 'src/pages/admin/TodaysNotifications.tsx'),
  'utf8',
);

const makeSnapshot = (
  overrides: Partial<SessionsManagementSnapshotPayload> = {},
): SessionsManagementSnapshotPayload => ({
  schemaVersion: 2,
  snapshotId: 'snapshot-a',
  generatedAt: '2026-08-27T04:00:00.000+05:30',
  generatedBy: 'scheduled',
  dateKeys: ['2026-08-27', '2026-08-28'],
  counts: { overallEnrollments: 1 },
  sessions: [
    {
      id: 'today-1',
      data: {
        enrollmentId: 'enrollment-1',
        date: '2026-08-27',
        status: 'scheduled',
        kidName: 'Kid',
        parentName: 'Parent',
        teacherName: 'Teacher A',
        courseName: 'Phonics',
      },
    },
    {
      id: 'tomorrow-1',
      data: {
        enrollmentId: 'enrollment-1',
        date: '2026-08-28',
        status: 'scheduled',
        kidName: 'Kid',
        parentName: 'Parent',
        teacherName: 'Teacher A',
        courseName: 'Phonics',
      },
    },
  ],
  enrollments: [
    {
      id: 'enrollment-1',
      data: {
        status: 'active',
        teacherId: 'teacher-a',
        kidId: 'kid-1',
        courseId: 'phonics',
      },
    },
  ],
  users: [],
  kids: [],
  students: [],
  courses: [],
  ...overrides,
});

const makeDeps = () => ({
  fetchEnrollmentsByIds: vi.fn(async (_ids: string[]) => ({})),
  fetchSessionsForDate: vi.fn(
    async (_dateKey: string): Promise<ManualReminderSessionDoc[]> => [],
  ),
  readCache: vi.fn((_dateKey: string) => null),
  writeCache: vi.fn((_dateKey: string, _payload: unknown) => undefined),
});

describe('Sessions Management authoritative snapshot loading', () => {
  it('uses the current snapshot without raw session or enrollment reads', async () => {
    const deps = makeDeps();
    const loadSnapshot = vi.fn(async () => makeSnapshot());

    const result = await loadManualReminderDayBuckets({
      deps: { ...deps, loadSnapshot },
      todayDateKey: '2026-08-27',
      tomorrowDateKey: '2026-08-28',
    });

    expect(result.source).toBe('snapshot');
    expect(result.todaySessions.map((session) => session.id)).toEqual(['today-1']);
    expect(result.tomorrowSessions.map((session) => session.id)).toEqual(['tomorrow-1']);
    expect(result.enrollmentFallbackReads).toBe(0);
    expect(deps.fetchSessionsForDate).not.toHaveBeenCalled();
    expect(deps.fetchEnrollmentsByIds).not.toHaveBeenCalled();
  });

  it('manual Refresh Sessions publishes and displays the newly rebuilt snapshot', async () => {
    const deps = makeDeps();
    const loadSnapshot = vi.fn(async () => makeSnapshot());
    const refreshSnapshot = vi.fn(async () => makeSnapshot({
      snapshotId: 'snapshot-manual',
      generatedBy: 'manual',
      generatedAt: '2026-08-27T14:30:00.000+05:30',
      sessions: [
        {
          id: 'manual-fresh',
          data: {
            enrollmentId: 'enrollment-1',
            date: '2026-08-27',
            status: 'scheduled',
            kidName: 'Kid',
            parentName: 'Parent',
            teacherName: 'Teacher B',
            courseName: 'Phonics',
          },
        },
      ],
    }));

    const result = await loadManualReminderDayBuckets({
      deps: { ...deps, loadSnapshot, refreshSnapshot },
      forceRefresh: true,
      todayDateKey: '2026-08-27',
      tomorrowDateKey: '2026-08-28',
    });

    expect(refreshSnapshot).toHaveBeenCalledTimes(1);
    expect(loadSnapshot).not.toHaveBeenCalled();
    expect(result.todaySessions.map((session) => session.id)).toEqual(['manual-fresh']);
    expect(deps.fetchSessionsForDate).not.toHaveBeenCalled();
  });

  it('selects Today and Tomorrow from the two-date daily baseline', async () => {
    const deps = makeDeps();
    const rolloverSnapshot = makeSnapshot({
      snapshotId: 'snapshot-before-midnight',
      dateKeys: ['2026-08-27', '2026-08-28'],
      sessions: [
        { id: 'new-today', data: { enrollmentId: 'enrollment-1', date: '2026-08-27', status: 'scheduled' } },
        { id: 'new-tomorrow', data: { enrollmentId: 'enrollment-1', date: '2026-08-28', status: 'scheduled' } },
      ],
    });

    const result = await loadManualReminderDayBuckets({
      deps: { ...deps, loadSnapshot: vi.fn(async () => rolloverSnapshot) },
      todayDateKey: '2026-08-27',
      tomorrowDateKey: '2026-08-28',
    });

    expect(result.todaySessions.map((session) => session.id)).toEqual(['new-today']);
    expect(result.tomorrowSessions.map((session) => session.id)).toEqual(['new-tomorrow']);
  });

  it('uses the snapshot-backed arbitrary-date loader without raw Firestore reads', async () => {
    const deps = makeDeps();
    const payload: SessionsManagementDatePayload = {
      snapshotId: 'snapshot-a',
      dateKey: '2026-09-03',
      sessions: [{ id: 'selected-1', data: { enrollmentId: 'enrollment-1', date: '2026-09-03', status: 'scheduled' } }],
      enrollments: makeSnapshot().enrollments,
      users: [],
      kids: [],
      students: [],
      courses: [],
    };

    const result = await loadManualReminderSelectedDate({
      dateKey: '2026-09-03',
      deps: {
        fetchEnrollmentsByIds: deps.fetchEnrollmentsByIds,
        fetchSessionsForDate: deps.fetchSessionsForDate,
        loadDateSnapshot: vi.fn(async () => payload),
      },
    });

    expect(result.source).toBe('snapshot');
    expect(result.sessions.map((session) => session.id)).toEqual(['selected-1']);
    expect(deps.fetchSessionsForDate).not.toHaveBeenCalled();
    expect(deps.fetchEnrollmentsByIds).not.toHaveBeenCalled();
  });

  it('keeps the UI on the same 04:00 IST operational-day boundary as the backend snapshot', () => {
    expect(pageSource).toContain('const SESSIONS_MANAGEMENT_REFRESH_HOUR = 4;');
    expect(pageSource).toContain('getSessionsManagementBaselineDateKey()');
    expect(pageSource).toContain(
      'SESSIONS_MANAGEMENT_REFRESH_HOUR * 60 * 60 * 1000',
    );
  });

  it('counts every operational admission even when profile lookups are incomplete', () => {
    expect(pageSource).toContain('const operationalAdmissionsCount = useMemo(');
    expect(pageSource).toContain('{operationalAdmissionsCount}');
    expect(pageSource).toContain("'Student unavailable'");
    expect(pageSource).toContain("'Parent unavailable'");
  });

  it('keeps zero Overall Admissions authoritative instead of exposing session-only enrollment rows', () => {
    clearSessionsManagementSnapshotCacheForTests();
    window.sessionStorage.setItem(
      'tinysteps:sessions-management-snapshot:v2',
      JSON.stringify({
        snapshot: makeSnapshot({
          counts: { overallEnrollments: 0 },
          enrollments: [
            {
              id: 'session-only-enrollment',
              data: { status: 'completed' },
            },
          ],
        }),
        extraDates: {},
      }),
    );

    expect(
      getCachedSessionsManagementRowsForReadLabel(
        'TodaysNotifications:overall-admissions',
      ),
    ).toEqual([]);

    clearSessionsManagementSnapshotCacheForTests();
  });

  it('falls back to bounded Firestore reads if the snapshot service is unavailable', async () => {
    const deps = makeDeps();
    deps.fetchSessionsForDate.mockImplementation(async (dateKey: string) => [
      {
        id: `fallback-${dateKey}`,
        date: dateKey,
        status: 'scheduled',
        kidName: 'Kid',
        parentName: 'Parent',
        teacherName: 'Teacher',
        courseName: 'Course',
      },
    ]);

    const result = await loadManualReminderDayBuckets({
      deps: {
        ...deps,
        loadSnapshot: vi.fn(async () => {
          throw new Error('snapshot unavailable');
        }),
      },
      todayDateKey: '2026-08-27',
      tomorrowDateKey: '2026-08-28',
    });

    expect(result.source).toBe('firestore');
    expect(deps.fetchSessionsForDate).toHaveBeenCalledTimes(2);
    expect(result.todaySessions[0].id).toBe('fallback-2026-08-27');
  });
});
