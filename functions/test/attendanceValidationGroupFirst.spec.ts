import { describe, expect, it, vi } from 'vitest';
import { validateAvsBusinessGroup, persistAvsGroupCases } from '../src/attendanceValidation/groupValidation';
import { FirestoreAv53ShadowStore, type Av53ValidationCaseDocument } from '../src/attendanceValidation/shadowRunner';
import { registry, session, shiftedSameDayEvidence } from './avsGroupFixtures';
import { hashAttendanceEvidenceValue } from '../src/attendanceValidation/teamsEvidenceCollector';
import type { Firestore } from 'firebase-admin/firestore';

const presentId = '0KLPQLCZ7xDy7ksbptnS_20260909_1915';
const extraId = 'pzk1H4bl8fNSwDCWqkXF_20260909_1730';
function row(id: string, present = true, overrides = {}) {
  return { id, data: { ...session({ 'kid-1': { status: present ? 'present' : 'absent' } }, '2026-09-09'),
    startTime: '15:30', endTime: '16:05', joinUrl: 'https://teams.example/meeting', ...overrides } };
}
function evidence(id = presentId, seconds = 3900) {
  const item = JSON.parse(JSON.stringify(shiftedSameDayEvidence(id, `ev_${id}`, seconds)).replaceAll('2026-09-18', '2026-09-09')) as ReturnType<typeof shiftedSameDayEvidence>;
  item.session.joinUrlHash = hashAttendanceEvidenceValue('https://teams.example/meeting');
  return item;
}
async function run(rows = [row(presentId), row(extraId, false)], cached = [evidence()], fresh = vi.fn(async () => evidence())) {
  const persisted = new Map<string, Av53ValidationCaseDocument>();
  // Reproduce the old wrong saved business outcome; normal validation must replace it.
  persisted.set(extraId, { teamsSupportedPresentCount: 2, tinyStepsPresentCount: 1, businessOutcome: 'false_absent' } as Av53ValidationCaseDocument);
  const result = await validateAvsBusinessGroup({ rows, registry, runId: 'regression',
    evidenceBySession: new Map(cached.map((e) => [e.session.classSessionId, e])),
    collectFresh: fresh, saveCases: async (cases) => { cases.forEach((c) => persisted.set(c.id, c)); } });
  return { result, persisted, fresh };
}

describe('group-first AVS business validation', () => {
  it('replaces stale Teams 2 / Tiny Steps 1 without calling the extra raw row that would fail Graph', async () => {
    const fresh = vi.fn(async () => { throw new Error('meeting_resolution HTTP 400 Graph BadRequest'); });
    const { persisted } = await run(undefined, undefined, fresh);
    expect(fresh).not.toHaveBeenCalled();
    for (const id of [presentId, extraId]) expect(persisted.get(id)).toMatchObject({
      teamsSupportedPresentCount: 1, tinyStepsPresentCount: 1, businessOutcome: 'verified', operationalMutationAllowed: false,
    });
  });
  it.each([[3900, 2, 'verified', 0], [2700, 1, 'false_present', 1]] as const)(
    'two Presents with %i overlap seconds gives Teams %i', async (seconds, teams, outcome, difference) => {
      const { result } = await run([row(presentId), row(extraId)], [evidence(presentId, seconds), evidence(extraId, seconds)]);
      expect(result.cases).toHaveLength(2);
      for (const item of result.cases) expect(item).toMatchObject({ tinyStepsPresentCount: 2, teamsSupportedPresentCount: teams,
        businessOutcome: outcome, businessDifferenceCount: difference });
    });
  it('preserves genuine False Absent for zero Presents', async () => {
    const { result } = await run([row(presentId, false)], [evidence(presentId, 1800)]);
    expect(result.cases[0]).toMatchObject({ tinyStepsPresentCount: 0, teamsSupportedPresentCount: 1, businessOutcome: 'false_absent', businessDifferenceCount: 1 });
  });
  it.each(['cancelled', 'rescheduled'])('excludes a %s slot from zero-Present capacity', async (status) => {
    const { result } = await run([row(presentId, false), row(extraId, false, { status })]);
    expect(result.cases.every((item) => item.teamsSupportedPresentCount === 1)).toBe(true);
  });
  it('combines different enrollments for the same student/teacher/date', async () => {
    const { result } = await run([row(presentId), row(extraId, false, { enrollmentId: 'other-enrollment' })]);
    expect(result.cases.every((item) => item.businessOutcome === 'verified' && item.tinyStepsPresentCount === 1)).toBe(true);
  });
  it('fetches genuinely missing relevant evidence and ignores extra raw rows', async () => {
    const fresh = vi.fn(async () => evidence());
    const { result } = await run(undefined, [], fresh);
    expect(fresh).toHaveBeenCalledTimes(1);
    expect(fresh.mock.calls[0][0].id).toBe(presentId);
    expect(result.cases[0].businessOutcome).toBe('verified');
  });
  it('does not reuse stale evidence after the teacher changes', async () => {
    const fresh = vi.fn(async () => { throw new Error('Graph failed'); });
    const { result } = await run([row(presentId, true, { teacherId: 'new-teacher' })], [evidence()], fresh);
    expect(fresh).toHaveBeenCalledTimes(1);
    expect(result.cases[0].businessOutcome).toBe('not_evaluable');
  });
  it('missing required second evidence cannot turn an incomplete group into False Present', async () => {
    const { result } = await run([row(presentId), row(extraId)], [evidence(presentId, 1800)], vi.fn(async () => { throw new Error('Graph failed'); }));
    expect(result.cases.every((item) => item.businessOutcome === 'not_evaluable')).toBe(true);
  });
  it('rejects a mixed teacher group before collection or persistence', async () => {
    await expect(run([row(presentId), row(extraId, false, { teacherId: 'other' })])).rejects.toThrow('Mixed');
  });
  it('enforces the cap at the Firestore write boundary', async () => {
    const batch = vi.fn();
    const store = new FirestoreAv53ShadowStore({ batch } as unknown as Firestore);
    await expect(store.saveCases([{ tinyStepsPresentCount: 1, teamsSupportedPresentCount: 2 } as Av53ValidationCaseDocument])).rejects.toThrow('invariant');
    expect(batch).not.toHaveBeenCalled();
  });
});

describe('atomic group case persistence', () => {
  it('refuses a changed operational snapshot and never writes operational collections', async () => {
    const writes: string[] = [];
    const deletes: string[] = [];
    const rows = [row(presentId)];
    let current = rows[0].data;
    const db = {
      collection: (name: string) => ({ doc: (id: string) => `${name}/${id}` }),
      runTransaction: async (callback: (transaction: unknown) => Promise<void>) => callback({
        getAll: async () => [{ exists: true, data: () => current }, { exists: true }],
        set: (ref: string) => writes.push(ref),
        delete: (ref: string) => deletes.push(ref),
      }),
    } as unknown as Firestore;
    const { result } = await run(rows);
    await persistAvsGroupCases(db, rows, result.cases);
    expect(writes).toEqual([`attendanceValidationCases/${presentId}`]);
    current = { ...rows[0].data, attendance: { 'kid-1': { status: 'absent' } } };
    await expect(persistAvsGroupCases(db, rows, result.cases)).rejects.toMatchObject({ code: 'aborted' });
    expect(writes).toHaveLength(1);
    expect(deletes).toEqual([`attendanceValidationDirtySessions/${presentId}`]);
    current = rows[0].data;
    const incomplete = await run(rows, [], vi.fn(async () => { throw new Error('Graph unavailable'); }));
    await persistAvsGroupCases(db, rows, incomplete.result.cases);
    expect(deletes).toHaveLength(1);
  });
});
