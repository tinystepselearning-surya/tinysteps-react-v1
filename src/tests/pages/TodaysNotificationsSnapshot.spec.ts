import { describe, expect, it, vi } from 'vitest';
import {
  loadManualReminderDayBuckets,
  loadManualReminderSelectedDate,
} from '../../pages/admin/todaysNotificationsManualData';
import type {
  SessionsManagementDatePayload,
  SessionsManagementSnapshotPayload,
} from '../../lib/sessionsManagementSnapshot';

const makeSnapshot = (
  overrides: Partial<SessionsManagementSnapshotPayload> = {},
): SessionsManagementSnapshotPayload => ({
  schemaVersion: 1,
  snapshotId: 'snapshot-a',
  generatedAt: '2026-08-27T04:00:00.000+05:30',
  generatedBy: 'scheduled',
  dateKeys: ['2026-08-27', '2026-08-28', '2026-08-29'],
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
  fetchEnrollmentsByIds: vi.fn(async () => ({})),
  fetchSessionsForDate: vi.fn(async () => []),
  readCache: vi.fn(() => null),
  writeCache: vi.fn(),
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

  it('selects Today and Tomorrow by requested dates so the pre-4am midnight rollover stays correct', async () => {
    const deps = makeDeps();
    const rolloverSnapshot = makeSnapshot({
      snapshotId: 'snapshot-before-midnight',
      dateKeys: ['2026-08-26', '2026-08-27', '2026-08-28'],
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
