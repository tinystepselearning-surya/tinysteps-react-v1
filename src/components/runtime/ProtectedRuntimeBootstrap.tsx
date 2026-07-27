import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import router from '../../app/routes';
import useAuth from '../../hooks/useAuth';
import AuthBootstrap from '../common/AuthBootstrap';
import ForegroundNotificationHost from '../notifications/ForegroundNotificationHost';
import {
  isNativeCapacitorRuntime,
  runNativeAuthStartupDiagnostics,
} from '../../lib/nativeAuthDiagnostics';
import {
  clearPendingPushOpenRoute,
  getPendingPushDestination,
  getPendingPushOpenRoute,
  OPEN_MESSAGES_FROM_PUSH_EVENT,
} from '../../lib/pushNavigationState';
import {
  needsUnreadMessageReconciliation,
  reconcileUnreadMessageBadge,
} from '../../lib/notificationBadgeSync';

const NativeLayoutDebug = lazy(() => import('../debug/NativeLayoutDebug'));
const NATIVE_DEBUG_STORAGE_KEY = 'ts_native_layout_debug';

/**
 * Owns Firebase Auth and native/private application infrastructure.
 *
 * This module is dynamically imported only for authentication routes, protected
 * application routes, or a real Capacitor runtime. Keeping the boundary in one
 * component preserves the existing single AuthBootstrap listener.
 */
export default function ProtectedRuntimeBootstrap() {
  const { user, authStatus } = useAuth();
  const [showNativeDebug, setShowNativeDebug] = useState(false);
  const [pushEventVersion, setPushEventVersion] = useState(0);
  const navigatingPushKeyRef = useRef<string | null>(null);
  const handledPushKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isNativeCapacitorRuntime()) return;
    let mountCount = 1;
    try {
      const previousCount = Number(sessionStorage.getItem('ts_app_mount_count_v1'));
      mountCount = Number.isFinite(previousCount) && previousCount >= 0 ? previousCount + 1 : 1;
      sessionStorage.setItem('ts_app_mount_count_v1', String(mountCount));
    } catch {
      mountCount = 1;
    }
    console.info('[app-diagnostics] mounted', { count: mountCount });
    void runNativeAuthStartupDiagnostics();
    return () => {
      console.info('[app-diagnostics] unmounted', { count: mountCount });
    };
  }, []);

  const navigateToPendingPush = useCallback(async () => {
    if (authStatus !== 'authenticated') return false;
    const pendingPush = getPendingPushOpenRoute();
    if (!pendingPush) return false;
    const target = getPendingPushDestination(pendingPush);
    const pendingKey = `${pendingPush.createdAtMs}:${target}`;
    if (navigatingPushKeyRef.current === pendingKey || handledPushKeyRef.current === pendingKey) {
      return false;
    }

    const currentLocation = router.state.location;
    const currentPath = `${currentLocation.pathname}${currentLocation.search || ''}${currentLocation.hash || ''}`;
    if (currentPath === target) {
      handledPushKeyRef.current = pendingKey;
      clearPendingPushOpenRoute();
      return true;
    }

    navigatingPushKeyRef.current = pendingKey;
    try {
      await router.navigate(target, { replace: true });
      handledPushKeyRef.current = pendingKey;
      clearPendingPushOpenRoute();
      return true;
    } catch (error) {
      console.warn('[push] failed to navigate to pending destination', {
        errorName: error instanceof Error ? error.name : 'unknown',
      });
      return false;
    } finally {
      if (navigatingPushKeyRef.current === pendingKey) navigatingPushKeyRef.current = null;
    }
  }, [authStatus]);

  useEffect(() => {
    if (!isNativeCapacitorRuntime()) {
      setShowNativeDebug(false);
      return;
    }

    const syncDebugState = () => {
      try {
        setShowNativeDebug(window.localStorage.getItem(NATIVE_DEBUG_STORAGE_KEY) === '1');
      } catch {
        setShowNativeDebug(false);
      }
    };

    syncDebugState();
    const intervalId = window.setInterval(syncDebugState, 1500);
    window.addEventListener('storage', syncDebugState);
    window.addEventListener('focus', syncDebugState);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', syncDebugState);
      window.removeEventListener('focus', syncDebugState);
    };
  }, []);

  useEffect(() => {
    if (!isNativeCapacitorRuntime() || authStatus !== 'authenticated') return;
    const uid = user?.uid?.trim();
    if (!uid) return;
    void import('../../lib/pushNotifications')
      .then(({ registerNativePushNotifications }) => registerNativePushNotifications(uid))
      .catch((error) => console.warn('[push] native initialization failed', error));
  }, [authStatus, user?.uid]);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !user?.uid) return;
    if (!needsUnreadMessageReconciliation(user.uid)) return;
    void reconcileUnreadMessageBadge(user.uid).catch((error) => {
      console.warn('[push] unread reconciliation failed', {
        errorName: error instanceof Error ? error.name : 'unknown',
      });
    });
  }, [authStatus, user?.uid]);

  useEffect(() => {
    const pendingPush = getPendingPushOpenRoute();
    if (!pendingPush) return;
    if (authStatus === 'authenticated') {
      void navigateToPendingPush();
    } else if (authStatus === 'unauthenticated' && !router.state.location.pathname.includes('/login')) {
      void router.navigate('/login', {
        replace: true,
        state: { from: getPendingPushDestination(pendingPush) },
      });
    }
  }, [authStatus, navigateToPendingPush, pushEventVersion]);

  useEffect(() => {
    if (!isNativeCapacitorRuntime()) return;
    const onOpenFromPush = () => setPushEventVersion((version) => version + 1);
    window.addEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, onOpenFromPush);
    return () => window.removeEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, onOpenFromPush);
  }, []);

  return (
    <>
      <AuthBootstrap />
      <ForegroundNotificationHost />
      {showNativeDebug ? (
        <Suspense fallback={null}>
          <NativeLayoutDebug />
        </Suspense>
      ) : null}
    </>
  );
}
