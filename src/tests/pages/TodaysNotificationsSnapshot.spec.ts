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
const snapshotClientSource = readFileSync(
  resolve(process.cwd(), 'src/lib/sessionsManagementSnapshot.ts'),
  'utf8',
);
const firestoreRulesSource = readFileSync(
  resolve(process.cwd(), 'firestore.rules'),
  'utf8',
);

const makeSnapshot = (
  overrides: Partial<SessionsManagementSnapshotPayload> = {},
): SessionsManagementSnapshotPayload => ({
  schemaVersion: 3,
  snapshotId: 'snapshot-a',
  projectionRevision: 0,
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
      'tinysteps:sessions-management-snapshot:v3',
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

  it('revalidates the browser snapshot with the live projection revision', () => {
    expect(snapshotClientSource).toContain(
      "const CACHE_KEY = 'tinysteps:sessions-management-snapshot:v3';",
    );
    expect(snapshotClientSource).toContain('knownProjectionRevision');
    expect(snapshotClientSource).toContain(
      'cached?.snapshot.projectionRevision ?? -1',
    );
  });

  it('keeps the cached snapshot when live callable revalidation is temporarily unhealthy', () => {
    expect(snapshotClientSource).toContain(
      '[SessionsManagementSnapshot] live snapshot revalidation failed; using cached snapshot',
    );
    expect(snapshotClientSource).toContain(
      '[SessionsManagementSnapshot] manual refresh failed; keeping cached snapshot',
    );
    expect(snapshotClientSource).toContain('if (cached?.snapshot) {');
    expect(snapshotClientSource).toContain('return cached.snapshot;');
  });

  it('listens to the single admin projection signal and reloads the cached read model', () => {
    expect(pageSource).toContain(
      "doc(db, 'adminSessionsManagement', 'projectionState')",
    );
    expect(pageSource).toContain('onSnapshot(');
    expect(pageSource).toContain('loadSessionsManagementSnapshot()');
    expect(pageSource).toContain('setProjectionRefreshNonce');
  });

  it('rolls the default Tomorrow selection forward when the 04:00 baseline advances', () => {
    expect(pageSource).toContain('const todayDateKeyRef = useRef(todayDateKey);');
    expect(pageSource).toContain('previousTomorrowDateKey');
    expect(pageSource).toContain('nextTomorrowDateKey');
    expect(pageSource).toContain('selected === previousTomorrowDateKey');
  });

  it('allows only admins to read the projection signal from the browser', () => {
    expect(firestoreRulesSource).toContain(
      'match /adminSessionsManagement/projectionState',
    );
    expect(firestoreRulesSource).toContain('allow read: if isAdmin();');
    expect(firestoreRulesSource).toContain(
      'allow create, update, delete: if false;',
    );
  });

  it('renders authoritative rows before secondary profile hydration completes', () => {
    const sessionMarker = pageSource.indexOf('setSessions(nextSessions);');
    const sessionLoadingDone = pageSource.indexOf('setIsLoading(false);', sessionMarker);
    const sessionEnrichment = pageSource.indexOf(
      'const nextUsersMap = await fetchUsersByRefs(',
      sessionMarker,
    );
    expect(sessionMarker).toBeGreaterThan(-1);
    expect(sessionLoadingDone).toBeGreaterThan(sessionMarker);
    expect(sessionEnrichment).toBeGreaterThan(sessionLoadingDone);

    const admissionsMarker = pageSource.indexOf('setEnrollments(nextEnrollments);');
    const admissionsLoadingDone = pageSource.indexOf('setIsLoading(false);', admissionsMarker);
    const admissionsEnrichment = pageSource.indexOf(
      'const [nextUsersMap, nextKidMap, nextCourseMap] = await Promise.all([',
      admissionsMarker,
    );
    expect(admissionsMarker).toBeGreaterThan(-1);
    expect(admissionsLoadingDone).toBeGreaterThan(admissionsMarker);
    expect(admissionsEnrichment).toBeGreaterThan(admissionsLoadingDone);
  });

  it('uses snapshot rows directly for profile lookups before Firestore fallback', () => {
    expect(pageSource).toContain('getCachedSessionsManagementRowsForReadLabel');
    expect(pageSource).toContain(
      "'TodaysNotifications:users-by-doc-id',",
    );
    expect(pageSource).toContain(
      '`TodaysNotifications:fetchDocsByIds:${collectionName}`',
    );
    expect(pageSource).toContain(
      '// A loaded Sessions Management snapshot is authoritative for this screen.',
    );
    expect(pageSource).toContain('if (cachedRows !== null) {');
    expect(pageSource).toContain('return out;');
    expect(pageSource).toContain('return map;');
  });

  it('does not retry the snapshot callable inside the Firestore fallback helpers', () => {
    expect(pageSource).toContain(
      '// We are already on the explicit Firestore fallback path here.',
    );
    expect(pageSource).toContain('const snap = await getDocs(q);');
    expect(pageSource).toContain('const byDocIdSnap = await getDocs(byDocIdQuery);');
    expect(pageSource).toContain('const byUidSnap = await getDocs(byUidQuery);');
    expect(pageSource).toContain(
      "cachedAdmissionRows !== null",
    );
    expect(pageSource).toContain(
      "await getDocs(query(collection(db, 'enrollments')))",
    );
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
