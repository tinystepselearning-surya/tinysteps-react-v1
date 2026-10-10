import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  progress: {} as Record<string, unknown>,
  writes: [] as Record<string, unknown>[],
}));

vi.mock('firebase-functions/v2/https', () => ({
  onCall: (_options: unknown, handler: unknown) => handler,
  HttpsError: class extends Error {
    constructor(public code: string, message: string) { super(message); }
  },
}));
const { canonicalAdminGuardMock } = vi.hoisted(() => ({
  canonicalAdminGuardMock: vi.fn(async (_auth: unknown): Promise<void> => undefined),
}));
vi.mock('../../../functions/src/helpers/canonicalAdminGuard', () => ({
  ensureCanonicalAdmin: canonicalAdminGuardMock,
}));
const db = (() => {
  const progressRef = { kind: 'progress' };
  const billingRef = { kind: 'billing' };
  const db = {
    collection: (name: string) => ({
      doc: (id: string) => {
        if (name === 'users') return { get: async () => ({ exists: true, data: () => ({ role: 'parent' }) }) };
        if (name === 'attendanceValidationMonthlyParentProgress') return progressRef;
        if (name === 'parentMonthlyReadModels') return {
          collection: () => ({ doc: () => billingRef }),
        };
        throw new Error(`${name}/${id}`);
      },
    }),
    runTransaction: async (work: (tx: unknown) => Promise<unknown>) => work({
      get: async (ref: unknown) => ref === progressRef
        ? { exists: true, data: () => state.progress }
        : { exists: true, data: () => ({
          billedClassCount: 2, billedAmount: 750, settledAmount: 0, dueAmount: 750,
          chargeIds: ['charge-a', 'charge-b'],
        }) },
      set: (_ref: unknown, data: Record<string, unknown>) => {
        state.writes.push(data);
        state.progress = { ...state.progress, ...data };
      },
    }),
  };
  return db;
})();

import { handleMonthlyParentProgress } from '../../../functions/src/attendanceValidation/monthlyParentProgressCallable';

const call = (workflowAction: 'billing_reviewed' | 'invoice_sent') =>
  handleMonthlyParentProgress({
    auth: { uid: 'admin-1', token: { email: 'admin@example.com' } },
    data: { parentId: 'parent-1', monthKey: '2026-09', workflowAction },
  } as never, db as never);

describe('monthly parent progress callable transaction', () => {
  beforeEach(() => {
    state.progress = { status: 'completed' };
    state.writes = [];
    canonicalAdminGuardMock.mockReset();
    canonicalAdminGuardMock.mockResolvedValue(undefined);
  });

  it('denies monthly workflow before any write when canonical Admin authorization rejects', async () => {
    const denied = Object.assign(new Error('Admin access required'), { code: 'permission-denied' });
    canonicalAdminGuardMock.mockRejectedValueOnce(denied);
    await expect(call('billing_reviewed')).rejects.toBe(denied);
    expect(canonicalAdminGuardMock).toHaveBeenCalledWith(expect.objectContaining({ uid: 'admin-1' }));
    expect(state.writes).toHaveLength(0);
  });

  it('writes billing review once and returns the verified snapshot on retry', async () => {
    const first = await call('billing_reviewed') as { billing: { billedAmount: number } };
    const second = await call('billing_reviewed') as { billing: { billedAmount: number } };
    expect(state.writes).toHaveLength(1);
    expect(first.billing.billedAmount).toBe(750);
    expect(second.billing.billedAmount).toBe(750);
  });

  it('writes invoice sent once and returns the verified snapshot on retry', async () => {
    await call('billing_reviewed');
    state.writes = [];
    const first = await call('invoice_sent') as { billing: { billedAmount: number } };
    const second = await call('invoice_sent') as { billing: { billedAmount: number } };
    expect(state.writes).toHaveLength(1);
    expect(first.billing.billedAmount).toBe(750);
    expect(second.billing.billedAmount).toBe(750);
  });
});
