import { describe, expect, it } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';
import { adminVerifyAttendanceValidationGroup, verifiedReason, verifyAvsGroupManually } from '../src/attendanceValidation/manualVerificationCallable';
import { session } from './avsGroupFixtures';

function fakeDb() {
  const saved = new Map<string, Record<string, unknown>>();
  const writes: string[] = [];
  saved.set('classSessions/session-1', session({ 'kid-1': { status: 'present' } }, '2026-09-09'));
  saved.set('attendanceValidationCases/session-1', {
    businessOutcome: 'false_present', teamsSupportedPresentCount: 0,
    tinyStepsPresentCount: 1, inputFingerprint: 'fingerprint', evidenceId: 'evidence-1',
  });
  saved.set('attendanceValidationEvidence/evidence-1', { original: true });
  const snapshot = (path: string) => ({ id: path.split('/').at(-1), exists: saved.has(path), data: () => saved.get(path) });
  const ref = (path: string) => ({ path, get: async () => snapshot(path) });
  const db = {
    collection: (name: string) => ({
      doc: (id = 'audit-1') => ref(`${name}/${id}`),
      where: () => ({ where: () => ({ limit: () => ({ get: async () => ({ size: 1,
        docs: [snapshot('classSessions/session-1')] }) }) }) }),
    }),
    runTransaction: async (callback: (tx: unknown) => Promise<void>) => callback({
      getAll: async (...refs: Array<{ path: string }>) => refs.map((item) => snapshot(item.path)),
      create: (item: { path: string }, data: Record<string, unknown>) => { writes.push(item.path); saved.set(item.path, data); },
      update: (item: { path: string }, data: Record<string, unknown>) => {
        writes.push(item.path); saved.set(item.path, { ...saved.get(item.path), ...data });
      },
    }),
  } as unknown as Firestore;
  return { db, saved, writes };
}

describe('manual AVS verification', () => {
  it('requires admin authorization and a bounded nonempty reason', async () => {
    await expect(adminVerifyAttendanceValidationGroup.run({ data: {}, auth: null } as never))
      .rejects.toMatchObject({ code: 'unauthenticated' });
    expect(() => verifiedReason('  ')).toThrow();
    expect(() => verifiedReason('x'.repeat(501))).toThrow();
    expect(verifiedReason('Reviewed and accepted')).toBe('Reviewed and accepted');
  });

  it('writes only resolution audit and AVS case decision, retaining source records and counts', async () => {
    const { db, saved, writes } = fakeDb();
    const beforeSession = saved.get('classSessions/session-1');
    const beforeEvidence = saved.get('attendanceValidationEvidence/evidence-1');
    const result = await verifyAvsGroupManually(db, { classSessionId: 'session-1', kidId: 'kid-1',
      reason: 'Short class remainder compensated next lesson', uid: 'admin-1', name: 'Admin', email: 'admin@example.com' });
    expect(result.status).toBe('manual_verified');
    expect(writes).toEqual(['attendanceValidationResolutions/audit-1', 'attendanceValidationCases/session-1']);
    expect(saved.get('classSessions/session-1')).toEqual(beforeSession);
    expect(saved.get('attendanceValidationEvidence/evidence-1')).toEqual(beforeEvidence);
    expect(saved.get('attendanceValidationCases/session-1')).toMatchObject({
      businessOutcome: 'verified', resolutionDecision: 'manual_verified', sourceBusinessOutcome: 'false_present',
      teamsSupportedPresentCount: 0, tinyStepsPresentCount: 1,
    });
    expect(saved.get('attendanceValidationResolutions/audit-1')).toMatchObject({
      sourceBusinessOutcome: 'false_present', sourceTeamsSupportedPresentCount: 0,
      sourceTinyStepsPresentCount: 1, reason: 'Short class remainder compensated next lesson',
    });
  });
});
