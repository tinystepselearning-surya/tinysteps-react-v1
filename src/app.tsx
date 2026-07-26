import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { RouterProvider } from 'react-router-dom';
import router from './app/routes';
import { Toaster } from './components/ui/toaster';
import useRevealAnimations from './hooks/useRevealAnimations';
import useAuth from './hooks/useAuth';
import AuthBootstrap from './components/common/AuthBootstrap';
import ForegroundNotificationHost from './components/notifications/ForegroundNotificationHost';
import AndroidNotificationPermissionPrompt from './components/notifications/AndroidNotificationPermissionPrompt';
import {
  isNativeCapacitorRuntime as isNativeAuthDiagnosticRuntime,
  runNativeAuthStartupDiagnostics,
} from './lib/nativeAuthDiagnostics';
import {
  clearPendingPushOpenRoute,
  getPendingPushDestination,
  getPendingPushOpenRoute,
  OPEN_MESSAGES_FROM_PUSH_EVENT,
} from './lib/pushNavigationState';
import {
  needsUnreadMessageReconciliation,
  reconcileUnreadMessageBadge,
} from './lib/notificationBadgeSync';
import {
  clearPendingNativeDeepLink,
  getPendingNativeDeepLink,
  parseNativeDeepLink,
  queuePendingNativeDeepLink,
} from './lib/nativeDeepLinks';
import {
  getTinyStepsNativePlatform,
  isTinyStepsNativeRuntime,
} from './lib/nativePlatform';

const NativeLayoutDebug = lazy(() => import('./components/debug/NativeLayoutDebug'));
const NATIVE_DEBUG_STORAGE_KEY = 'ts_native_layout_debug';

function App() {
  useRevealAnimations();
  const { user, authStatus } = useAuth();
  const [showNativeDebug, setShowNativeDebug] = useState(false);
  const [pushEventVersion, setPushEventVersion] = useState(0);
  const navigatingPushKeyRef = useRef<string | null>(null);
  const handledPushKeyRef = useRef<string | null>(null);
  const handledNativeDeepLinkRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isNativeAuthDiagnosticRuntime()) return;
    let mountCount = 1;
    try {
      const previousCount = Number(sessionStorage.getItem('ts_app_mount_count_v1'));
      mountCount = Number.isFinite(previousCount) && previousCount >= 0
        ? previousCount + 1
        : 1;
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
    if (
      navigatingPushKeyRef.current === pendingKey ||
      handledPushKeyRef.current === pendingKey
    ) {
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
      if (navigatingPushKeyRef.current === pendingKey) {
        navigatingPushKeyRef.current = null;
      }
    }
  }, [authStatus]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const nativePlatform = getTinyStepsNativePlatform();
    const isNativeRuntime = nativePlatform !== null;
    root.classList.toggle('ts-capacitor-native', isNativeRuntime);
    if (nativePlatform) root.dataset.nativePlatform = nativePlatform;
    else delete root.dataset.nativePlatform;

    // Register service worker only in production to avoid caching issues during dev
    if (
      import.meta.env.PROD &&
      'serviceWorker' in navigator &&
      !isNativeRuntime
    ) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {
        /* ignore */
      });
    }

    return () => {
      root.classList.remove('ts-capacitor-native');
      delete root.dataset.nativePlatform;
    };
  }, []);

  useEffect(() => {
    if (!isTinyStepsNativeRuntime()) {
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
    if (!isTinyStepsNativeRuntime()) return;
    if (authStatus !== 'authenticated') return;
    const uid = user?.uid?.trim();
    if (!uid) return;

    void import('./lib/pushNotifications')
      .then(({ registerNativePushNotifications }) => registerNativePushNotifications(uid))
      .catch((error) => {
        console.warn('[push] native initialization failed', error);
      });
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
      return;
    }

    if (
      authStatus === 'unauthenticated' &&
      !router.state.location.pathname.includes('/login')
    ) {
      void router.navigate('/login', {
        replace: true,
        state: { from: getPendingPushDestination(pendingPush) },
      });
    }
  }, [authStatus, navigateToPendingPush, pushEventVersion]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isTinyStepsNativeRuntime()) return;

    const onOpenFromPush = (event: Event) => {
      if (!(event instanceof Event)) return;
      setPushEventVersion((version) => version + 1);
    };

    window.addEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, onOpenFromPush);
    return () => {
      window.removeEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, onOpenFromPush);
    };
  }, []);

  useEffect(() => {
    if (!isTinyStepsNativeRuntime()) return;
    let mounted = true;
    let appUrlHandle: { remove: () => Promise<void> } | null = null;

    const applyDeepLink = async (rawUrl: unknown) => {
      const rawKey = typeof rawUrl === 'string' ? rawUrl.trim() : '';
      if (!rawKey || handledNativeDeepLinkRef.current === rawKey) return;
      const route = parseNativeDeepLink(rawUrl);
      if (!route) return;
      handledNativeDeepLinkRef.current = rawKey;
      queuePendingNativeDeepLink(route);
      if (authStatus !== 'authenticated') {
        if (router.state.location.pathname !== '/login') {
          await router.navigate('/login', { replace: true, state: { from: route } });
        }
        return;
      }
      await router.navigate(route, { replace: true });
      clearPendingNativeDeepLink();
    };

    void CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      void applyDeepLink(url);
    }).then((handle) => {
      if (!mounted) {
        void handle.remove();
        return;
      }
      appUrlHandle = handle;
    }).catch(() => {
      // Ignore an unavailable native bridge in browser tests.
    });
    void CapacitorApp.getLaunchUrl()
      .then((launch) => {
        if (launch?.url) void applyDeepLink(launch.url);
      })
      .catch(() => undefined);

    const pendingRoute = getPendingNativeDeepLink();
    if (pendingRoute && authStatus === 'authenticated') {
      void router.navigate(pendingRoute, { replace: true }).then(() => {
        clearPendingNativeDeepLink();
      });
    }

    return () => {
      mounted = false;
      if (appUrlHandle) void appUrlHandle.remove();
    };
  }, [authStatus]);

  return (
    <>
      <AuthBootstrap />
      <RouterProvider router={router} />
      <ForegroundNotificationHost />
      <AndroidNotificationPermissionPrompt userId={user?.uid} />
      <Toaster />
      {showNativeDebug ? (
        <Suspense fallback={null}>
          <NativeLayoutDebug />
        </Suspense>
      ) : null}
    </>
  );
}

export default App;
