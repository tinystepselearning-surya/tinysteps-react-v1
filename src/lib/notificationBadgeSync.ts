const RECONCILE_VERSION = 'phase8-v1';
const RECONCILE_STORAGE_KEY = 'ts_unread_reconcile_version';
const reconcilePromises = new Map<string, Promise<number>>();
const reconciledUsers = new Set<string>();

const reconcileStorageKey = (userId: string) =>
  `${RECONCILE_STORAGE_KEY}:${userId}`;

export const normalizeUnreadMessageTotal = (value: unknown): number => {
  const total = Number(value);
  return Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
};

export const reconcileUnreadMessageBadge = (userId: string): Promise<number> => {
  const existing = reconcilePromises.get(userId);
  if (existing) return existing;
  const promise = callFunction<
    { ok: boolean; unreadMessages: number },
    Record<string, never>
  >('reconcileMyUnreadMessageCount', {})
    .then((result) => {
      const unreadMessages = normalizeUnreadMessageTotal(result.unreadMessages);
      try {
        localStorage.setItem(reconcileStorageKey(userId), RECONCILE_VERSION);
      } catch {
        // Reconciliation still succeeded when local upgrade bookkeeping is unavailable.
      }
      reconciledUsers.add(userId);
      return unreadMessages;
    })
    .finally(() => {
      if (reconcilePromises.get(userId) === promise) {
        reconcilePromises.delete(userId);
      }
    });
  reconcilePromises.set(userId, promise);
  return promise;
};

export const needsUnreadMessageReconciliation = (userId: string): boolean => {
  if (!userId || reconciledUsers.has(userId)) return false;
  try {
    return localStorage.getItem(reconcileStorageKey(userId)) !== RECONCILE_VERSION;
  } catch {
    return true;
  }
};
import { callFunction } from './callFunctions';
