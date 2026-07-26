import type * as admin from 'firebase-admin';
import { describe, expect, it, vi } from 'vitest';
import { deactivateInvalidTokens } from '../src/notifications/pushDelivery';

describe('push invalid-token deactivation', () => {
  it('deactivates invalid tokens and records invalidation timestamps', async () => {
    const set = vi.fn();
    const commit = vi.fn().mockResolvedValue(undefined);
    const doc = vi.fn((id: string) => ({ id }));
    const db = {
      collection: vi.fn(() => ({ doc })),
      batch: vi.fn(() => ({ set, commit })),
    } as unknown as admin.firestore.Firestore;

    await deactivateInvalidTokens(db, ['token-a', 'token-b', 'token-a']);

    expect(commit).toHaveBeenCalledOnce();
    expect(set).toHaveBeenCalledTimes(2);
    expect(set.mock.calls.map(([ref]) => ref.id)).toEqual(['token-a', 'token-b']);
    for (const [, patch, options] of set.mock.calls) {
      expect(patch).toMatchObject({ active: false });
      expect(patch.updatedAt).toBeDefined();
      expect(patch.invalidatedAt).toBeDefined();
      expect(options).toEqual({ merge: true });
    }
  });

  it('does not write when no invalid token was returned', async () => {
    const batch = vi.fn();
    const db = { batch } as unknown as admin.firestore.Firestore;
    await deactivateInvalidTokens(db, []);
    expect(batch).not.toHaveBeenCalled();
  });
});
