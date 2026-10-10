// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const {authState, invoke} = vi.hoisted(() => ({
  authState: {currentUser: null as {uid: string} | null},
  invoke: vi.fn(),
}));
vi.mock('../../lib/firebaseConfig', () => ({
  auth: authState,
  functions: {},
}));
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) =>
    (request: unknown) => invoke(name, request)),
}));

import {
  clearSessionsManagementSnapshotCache,
  getCachedSessionsManagementRowsForReadLabel,
  getCachedSessionsManagementSnapshot,
  loadSessionsManagementDateSnapshot,
  loadSessionsManagementSnapshot,
  observeSessionsManagementAuthUid,
  refreshSessionsManagementSnapshot,
  subscribeSessionsManagementSnapshotInvalidation,
  type SessionsManagementSnapshotPayload,
} from '../../lib/sessionsManagementSnapshot';

const KEY = 'tinysteps:sessions-management-snapshot:v4';
const OLD_KEY = 'tinysteps:sessions-management-snapshot:v3';

const snapshot = (snapshotId: string): SessionsManagementSnapshotPayload => ({
  schemaVersion: 3,
  snapshotId,
  projectionRevision: 9,
  generatedAt: '2026-10-10T10:00:00Z',
  generatedBy: 'scheduled',
  dateKeys: ['2026-10-10'],
  counts: {overallEnrollments: 1},
  sessions: [{id: snapshotId, data: {date: '2026-10-10'}}],
  enrollments: [{id: snapshotId, data: {status: 'active'}}],
  users: [],
  kids: [],
  students: [],
  courses: [],
});

const errorCode = (code: string) => Object.assign(new Error('Synthetic unavailable authorization'), {code});
const signedIn = (uid: string) => {
  authState.currentUser = {uid};
  observeSessionsManagementAuthUid(uid);
};
const signedOut = () => {
  authState.currentUser = null;
  observeSessionsManagementAuthUid(null);
};
const success = (id: string) => invoke.mockResolvedValue({data: {snapshot: snapshot(id)}});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return {promise, resolve, reject};
}

describe('P1 Sessions Management authenticated cache and request isolation', () => {
  beforeEach(() => {
    vi.stubEnv('MODE', 'development');
    invoke.mockReset();
    clearSessionsManagementSnapshotCache();
    window.sessionStorage.clear();
    signedIn('admin-a');
  });

  afterEach(() => {
    clearSessionsManagementSnapshotCache();
    signedOut();
    window.sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('persists a successful snapshot with the current actor and uses revision hints without extra raw reads', async () => {
    success('admin-a-data');
    expect(getCachedSessionsManagementSnapshot()).toBeNull();

    const current = await loadSessionsManagementSnapshot();
    expect(current.snapshotId).toBe('admin-a-data');
    expect(getCachedSessionsManagementRowsForReadLabel('TodaysNotifications:overall-admissions')).toEqual([
      {id: 'admin-a-data', data: {status: 'active'}},
    ]);
    expect(JSON.parse(window.sessionStorage.getItem(KEY) || '{}').ownerUid).toBe('admin-a');

    invoke.mockResolvedValueOnce({data: {unchanged: true}});
    const repeated = await loadSessionsManagementSnapshot();
    expect(repeated.snapshotId).toBe('admin-a-data');
    expect(invoke.mock.calls[1][1]).toEqual({
      knownSnapshotId: 'admin-a-data', knownProjectionRevision: 9,
    });
  });

  it('does not display persisted v4 rows before successful same-actor server revalidation', async () => {
    window.sessionStorage.setItem(KEY, JSON.stringify({
      ownerUid: 'admin-a', snapshot: snapshot('persisted-a'), extraDates: {},
    }));
    expect(getCachedSessionsManagementSnapshot()).toBeNull();
    expect(getCachedSessionsManagementRowsForReadLabel('TodaysNotifications:overall-admissions')).toBeNull();

    invoke.mockResolvedValueOnce({data: {unchanged: true}});
    expect((await loadSessionsManagementSnapshot()).snapshotId).toBe('persisted-a');
    expect(invoke.mock.calls[0][1]).toEqual({
      knownSnapshotId: 'persisted-a', knownProjectionRevision: 9,
    });
    expect(getCachedSessionsManagementSnapshot()?.snapshotId).toBe('persisted-a');
  });

  it('never reads or migrates unscoped v3 cached rows from previous versions', async () => {
    window.sessionStorage.setItem(OLD_KEY, JSON.stringify({
      snapshot: snapshot('old-account'), extraDates: {},
    }));
    expect(getCachedSessionsManagementSnapshot()).toBeNull();
    success('new-authorized');
    await loadSessionsManagementSnapshot();
    expect(invoke.mock.calls[0][1]).toEqual({
      knownSnapshotId: '', knownProjectionRevision: -1,
    });
    expect(window.sessionStorage.getItem(OLD_KEY)).toBeNull();
  });

  it('clears cache on Firebase UID switch and never reuses a previous actor revision', async () => {
    success('a-sensitive');
    await loadSessionsManagementSnapshot();
    signedIn('admin-b');
    expect(getCachedSessionsManagementSnapshot()).toBeNull();
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
    success('b-sensitive');
    expect((await loadSessionsManagementSnapshot()).snapshotId).toBe('b-sensitive');
    expect(invoke.mock.calls[1][1]).toEqual({knownSnapshotId: '', knownProjectionRevision: -1});
    expect(JSON.parse(window.sessionStorage.getItem(KEY) || '{}').ownerUid).toBe('admin-b');
  });

  it('ignores a persisted cache owned by another UID without exposing its contents', async () => {
    window.sessionStorage.setItem(KEY, JSON.stringify({
      ownerUid: 'admin-x', snapshot: snapshot('x-sensitive'), extraDates: {},
    }));
    expect(getCachedSessionsManagementSnapshot()).toBeNull();
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
    success('a');
    expect((await loadSessionsManagementSnapshot()).snapshotId).toBe('a');
  });

  it('notifies UI subscribers immediately for account changes and authorization invalidation', async () => {
    const onInvalidation = vi.fn();
    const unsubscribe = subscribeSessionsManagementSnapshotInvalidation(onInvalidation);
    success('a-sensitive');
    await loadSessionsManagementSnapshot();
    signedIn('admin-b');
    expect(onInvalidation).toHaveBeenCalledTimes(1);
    clearSessionsManagementSnapshotCache();
    expect(onInvalidation).toHaveBeenCalledTimes(2);
    unsubscribe();
    signedOut();
    expect(onInvalidation).toHaveBeenCalledTimes(2);
  });

  it('removes rows immediately on sign-out and does not allow unauthenticated requests', async () => {
    success('a-sensitive');
    await loadSessionsManagementSnapshot();
    signedOut();
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
    expect(getCachedSessionsManagementRowsForReadLabel('TodaysNotifications:overall-admissions')).toBeNull();
    await expect(loadSessionsManagementSnapshot()).rejects.toThrow(/authenticated session/);
  });

  it.each(['functions/permission-denied', 'functions/unauthenticated', 'auth/user-disabled'])(
    'revokes cached rows and fails closed on %s during revalidation',
    async (code) => {
      success('a-sensitive');
      await loadSessionsManagementSnapshot();
      invoke.mockRejectedValueOnce(errorCode(code));
      await expect(loadSessionsManagementSnapshot()).rejects.toMatchObject({code});
      expect(window.sessionStorage.getItem(KEY)).toBeNull();
      expect(getCachedSessionsManagementSnapshot()).toBeNull();
      expect(getCachedSessionsManagementRowsForReadLabel('TodaysNotifications:overall-admissions')).toBeNull();
    },
  );

  it('also clears actor-verified cache when manual refresh is denied', async () => {
    success('a-sensitive');
    await loadSessionsManagementSnapshot();
    invoke.mockRejectedValueOnce(errorCode('functions/permission-denied'));
    await expect(refreshSessionsManagementSnapshot()).rejects.toMatchObject({code: 'functions/permission-denied'});
    expect(getCachedSessionsManagementSnapshot()).toBeNull();
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it('permits a transient outage fallback only after this actor has revalidated the cache', async () => {
    success('a-sensitive');
    await loadSessionsManagementSnapshot();
    invoke.mockRejectedValueOnce(errorCode('functions/unavailable'));
    expect((await loadSessionsManagementSnapshot()).snapshotId).toBe('a-sensitive');
    expect(getCachedSessionsManagementSnapshot()?.snapshotId).toBe('a-sensitive');
  });

  it('does not trust a persisted revision hint for offline display before revalidation', async () => {
    window.sessionStorage.setItem(KEY, JSON.stringify({
      ownerUid: 'admin-a', snapshot: snapshot('a-stale'), extraDates: {},
    }));
    invoke.mockRejectedValueOnce(errorCode('functions/unavailable'));
    await expect(loadSessionsManagementSnapshot()).rejects.toMatchObject({code: 'functions/unavailable'});
    expect(getCachedSessionsManagementSnapshot()).toBeNull();
  });

  it('rejects malformed and unknown failures instead of returning cached sensitive rows', async () => {
    success('a-sensitive');
    await loadSessionsManagementSnapshot();
    invoke.mockRejectedValueOnce(new Error('synthetic response invalid'));
    await expect(loadSessionsManagementSnapshot()).rejects.toThrow('synthetic response invalid');
    expect(getCachedSessionsManagementSnapshot()).toBeNull();
  });

  it('prevents a response from old user A repopulating B and does not erase B in-flight work', async () => {
    const a = deferred<{data: {snapshot: SessionsManagementSnapshotPayload}}>();
    const b = deferred<{data: {snapshot: SessionsManagementSnapshotPayload}}>();
    invoke.mockImplementation((_name: string) => authState.currentUser?.uid === 'admin-a' ? a.promise : b.promise);

    const oldRequest = loadSessionsManagementSnapshot();
    signedIn('admin-b');
    const newRequest = loadSessionsManagementSnapshot();
    a.resolve({data: {snapshot: snapshot('a-sensitive')}});
    await expect(oldRequest).rejects.toThrow(/authentication changed/);

    // Old request finalization must not cancel or replace actor B's promise.
    const coalescedB = loadSessionsManagementSnapshot();
    expect(invoke).toHaveBeenCalledTimes(2);
    b.resolve({data: {snapshot: snapshot('b-sensitive')}});
    const [value, coalescedValue] = await Promise.all([newRequest, coalescedB]);
    expect(value.snapshotId).toBe('b-sensitive');
    expect(coalescedValue.snapshotId).toBe('b-sensitive');
    expect(getCachedSessionsManagementSnapshot()?.snapshotId).toBe('b-sensitive');
    expect(JSON.parse(window.sessionStorage.getItem(KEY) || '{}').ownerUid).toBe('admin-b');
  });

  it('does not publish selected-date results from another actor after an account switch', async () => {
    success('a-sensitive');
    await loadSessionsManagementSnapshot();
    const pendingDate = deferred<{data: {payload: unknown}}>();
    invoke.mockImplementation((name: string) => name === 'getSessionsManagementSnapshot'
      ? Promise.resolve({data: {unchanged: true}}) : pendingDate.promise);
    const oldDate = loadSessionsManagementDateSnapshot('2026-10-17');
    await vi.waitFor(() => expect(invoke.mock.calls.some(call => call[0] === 'getSessionsManagementDateSnapshot')).toBe(true));
    signedIn('admin-b');
    pendingDate.resolve({data: {payload: {snapshotId: 'a-sensitive', dateKey: '2026-10-17', sessions: [], enrollments: [], users: [], kids: [], students: [], courses: []}}});
    await expect(oldDate).rejects.toThrow(/authentication changed/);
    expect(getCachedSessionsManagementSnapshot()).toBeNull();
  });
});
