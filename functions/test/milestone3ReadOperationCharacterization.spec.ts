import {describe, expect, it} from 'vitest';
import type * as admin from 'firebase-admin';
import {loadCurrentAuthAccessPrincipal} from '../src/schoolOS/identity/authAccessAuthorization';
import {
  loadParentPaymentBackfillPayments,
  loadParentPaymentBackfillParentScopedData,
} from '../src/parentPaymentBackfillDryRun';

// Counts SDK calls against synthetic in-memory results, never billed reads.
type FakeRef = {
  collection: (name: string) => FakeRef;
  doc: (id: string) => FakeRef;
  where: () => FakeRef;
  limit: (n: number) => FakeRef;
  get: () => Promise<unknown>;
};
function recordingDb() {
  const calls: Array<{path: string; limit: number | null}> = [];
  function ref(path: string, cap: number | null = null): FakeRef {
    return {
      collection: (name: string) => ref(`${path}/${name}`),
      doc: (id: string) => ref(`${path}/${id}`),
      where: () => ref(path, cap),
      limit: (n: number) => ref(path, n),
      get: async () => {
        calls.push({path, limit: cap});
        if (path.startsWith('authAccessReadModels/')) return {
          exists: true, data: () => ({schemaVersion: 1, authority: 'canonical-derived',
            firebaseUid: 'actor', personId: 'person', personStatus: 'active',
            authStatus: 'active', accessActive: true, globalRoles: ['admin'],
            schoolAdminOrganisationIds: [], sourceAuthIdentityId: 'auth-synthetic'}),
        };
        const docs = path === 'payments' ? [1, 2, 3].slice(0, cap ?? 3).map(n => ({
          id: `payment-${n}`, data: () => ({paidAt: {toMillis: () => n}}),
        })) : [];
        return {docs, exists: false, data: () => ({})};
      },
    };
  }
  return {calls, db: {collection: (name: string) => ref(name)} as unknown as admin.firestore.Firestore};
}

describe('M3 mock SDK operation characterization (not production billing)', () => {
  it('does one UID get per principal load and does not deduplicate sequential loads', async () => {
    const {db, calls} = recordingDb();
    await loadCurrentAuthAccessPrincipal({db, firebaseUid: 'actor'});
    expect(calls).toHaveLength(1);
    await loadCurrentAuthAccessPrincipal({db, firebaseUid: 'actor'});
    expect(calls).toEqual(Array(2).fill({path: 'authAccessReadModels/actor', limit: null}));
  });

  it('characterizes parent payments fetched without a server cap despite output limit', async () => {
    const {db, calls} = recordingDb();
    const result = await loadParentPaymentBackfillPayments(db, 'parent', null, null, 1);
    expect(result).toHaveLength(1);
    expect(calls).toEqual([
      {path: 'payments', limit: null},
      {path: 'payments/payment-1/allocations', limit: null},
    ]);
  });

  it('characterizes the global payment query cap separately from allocation queries', async () => {
    const {db, calls} = recordingDb();
    await loadParentPaymentBackfillPayments(db, null, null, null, 1);
    expect(calls[0]).toEqual({path: 'payments', limit: 1});
    expect(calls[1]).toEqual({path: 'payments/payment-1/allocations', limit: null});
  });

  it('counts five parent-scoped get operations, with three uncapped query paths', async () => {
    const {db, calls} = recordingDb();
    await loadParentPaymentBackfillParentScopedData(db, ['parent']);
    expect(calls).toEqual([
      {path: 'billingCharges', limit: null},
      {path: 'parentWallets/parent', limit: null},
      {path: 'parentWallets/parent/transactions', limit: null},
      {path: 'parentMonthlyReadModels/parent/months', limit: null},
      {path: 'users/parent', limit: null},
    ]);
  });
});
