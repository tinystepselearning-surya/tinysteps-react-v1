import { describe, expect, it, vi } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';
import { revalidateAvsGroupCached } from '../src/attendanceValidation/cachedGroupRevalidationCallable';
import { registry, session, shiftedSameDayEvidence } from './avsGroupFixtures';
import { hashAttendanceEvidenceValue } from '../src/attendanceValidation/teamsEvidenceCollector';

const first = 'session-first';
const second = 'session-second';
function makeDb(statuses: Array<'present' | 'absent'>, evidenceIds: string[]) {
  const saved = new Map<string, Record<string, unknown>>();
  const writes: string[] = [];
  const graph = vi.fn();
  [first, second].forEach((id, index) => {
    saved.set(`classSessions/${id}`, {
      ...session({ 'kid-1': { status: statuses[index] } }, '2026-09-09'),
      startTime: '15:30', endTime: '16:05', joinUrl: 'https://teams.example/meeting',
    });
    saved.set(`attendanceValidationCases/${id}`, { evidenceId: evidenceIds[index] ?? null });
    if (evidenceIds[index]) {
      const evidence = JSON.parse(JSON.stringify(shiftedSameDayEvidence(id, evidenceIds[index], 1800))
        .replaceAll('2026-09-18', '2026-09-09'));
      evidence.session.joinUrlHash = hashAttendanceEvidenceValue('https://teams.example/meeting');
      saved.set(`attendanceValidationEvidence/${evidenceIds[index]}`, evidence);
    }
  });
  const snapshot = (path: string) => ({ id: path.split('/').at(-1), exists: saved.has(path),
    data: () => saved.get(path) });
  const ref = (path: string) => ({ path, get: async () => snapshot(path) });
  const db = {
    collection: (name: string) => ({
      doc: (id: string) => ref(`${name}/${id}`),
      where: () => ({ where: () => ({ limit: () => ({ get: async () => ({
        size: 2, docs: [first, second].map((id) => snapshot(`classSessions/${id}`)),
      }) }) }) }),
    }),
    getAll: async (...refs: Array<{ path: string }>) => refs.map((item) => snapshot(item.path)),
    runTransaction: async (callback: (transaction: unknown) => Promise<void>) => callback({
      getAll: async (...refs: Array<{ path: string }>) => refs.map((item) => snapshot(item.path)),
      set: (item: { path: string }, data: Record<string, unknown>) => { saved.set(item.path, data); writes.push(item.path); },
      delete: (item: { path: string }) => saved.delete(item.path),
    }),
  } as unknown as Firestore;
  return { db, saved, writes, graph };
}

describe('cached AVS group revalidation', () => {
  it('corrected False Absent to Present reuses Teams and verifies the group with zero Graph calls', async () => {
    const { db, saved, writes, graph } = makeDb(['present', 'absent'], ['evidence-first', '']);
    const result = await revalidateAvsGroupCached(db, first, 'kid-1', registry);
    expect(result).toMatchObject({ status: 'revalidated', businessOutcome: 'verified',
      teamsSupportedPresentCount: 1, tinyStepsPresentCount: 1, graphLogicalCalls: 0 });
    expect(graph).not.toHaveBeenCalled();
    expect(writes).toEqual([`attendanceValidationCases/${first}`, `attendanceValidationCases/${second}`]);
    expect(saved.get(`attendanceValidationCases/${second}`)).toMatchObject({ businessOutcome: 'verified' });
  });

  it('corrected False Present to Absent rebuilds all siblings from cached Teams', async () => {
    const { db, saved, writes } = makeDb(['present', 'absent'], ['evidence-first', '']);
    const result = await revalidateAvsGroupCached(db, second, 'kid-1', registry);
    expect(result).toMatchObject({ status: 'revalidated', businessOutcome: 'verified', graphLogicalCalls: 0 });
    expect(writes).toHaveLength(2);
    expect(saved.get(`attendanceValidationCases/${first}`)?.tinyStepsPresentCount).toBe(1);
    expect(saved.get(`attendanceValidationCases/${second}`)?.tinyStepsPresentCount).toBe(1);
  });

  it('missing cached Teams evidence requests explicit fresh evidence without persistence or Graph', async () => {
    const { db, writes, graph } = makeDb(['present', 'absent'], ['', '']);
    const result = await revalidateAvsGroupCached(db, first, 'kid-1', registry);
    expect(result).toMatchObject({ status: 'fresh_teams_evidence_required', graphLogicalCalls: 0 });
    expect(writes).toEqual([]);
    expect(graph).not.toHaveBeenCalled();
  });
});
