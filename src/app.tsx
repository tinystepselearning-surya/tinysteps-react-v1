import React, { useCallback, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './app/routes';
import { Toaster } from './components/ui/toaster';
import NativeLayoutDebug from './components/debug/NativeLayoutDebug';
import useRevealAnimations from './hooks/useRevealAnimations';
import {
  consumePendingPushOpenRoute,
  OPEN_MESSAGES_FROM_PUSH_EVENT,
  queuePendingPushOpenRoute,
} from './lib/pushNavigationState';

const isNativeCapacitorRuntime = () => {
  if (typeof window === 'undefined') return false;

  const cap = (window as any).Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function') {
    try {
      return Boolean(cap.isNativePlatform());
    } catch {
      // Ignore runtime bridge errors and fall back to protocol checks.
    }
  }

  const protocol = window.location.protocol;
  return protocol === 'capacitor:' || protocol === 'ionic:';
};

function App() {
  useRevealAnimations();

  const navigateFromPushPayload = useCallback((route: unknown, threadId: unknown) => {
    const normalizedRoute =
      typeof route === 'string' && route.trim().startsWith('/')
        ? route.trim()
        : '/messages';
    const normalizedThreadId =
      typeof threadId === 'string' && threadId.trim()
        ? threadId.trim()
        : '';

    const targetPath =
      normalizedRoute === '/messages' && normalizedThreadId
        ? `/messages/${encodeURIComponent(normalizedThreadId)}`
        : normalizedRoute;

    try {
      void router.navigate(targetPath);
      return true;
    } catch (error) {
      console.warn('[push] failed to navigate from push payload', error);
      return false;
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const isNativeRuntime = isNativeCapacitorRuntime();
    root.classList.toggle('ts-capacitor-native', isNativeRuntime);

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
    };
  }, []);

  useEffect(() => {
    if (!isNativeCapacitorRuntime()) return;

    let unsubscribeAuth: (() => void) | null = null;
    let cancelled = false;

    const setupNativePush = async () => {
      try {
        const [
          { onAuthStateChanged },
          { auth },
          { registerNativePushNotifications },
        ] = await Promise.all([
          import('firebase/auth'),
          import('./lib/firebaseConfig'),
          import('./lib/pushNotifications'),
        ]);

        if (cancelled) return;

        unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
          const uid = firebaseUser?.uid?.trim();
          if (!uid) return;

          void registerNativePushNotifications(uid);

          const pendingPushOpen = consumePendingPushOpenRoute();
          if (!pendingPushOpen) return;

          const didNavigate = navigateFromPushPayload(
            pendingPushOpen.route,
            pendingPushOpen.threadId,
          );

          if (!didNavigate) {
            queuePendingPushOpenRoute(pendingPushOpen.route, pendingPushOpen.threadId || undefined);
          }
        });
      } catch (error) {
        console.warn('[push] native initialization failed', error);
      }
    };

    void setupNativePush();

    return () => {
      cancelled = true;
      unsubscribeAuth?.();
    };
  }, [navigateFromPushPayload]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isNativeCapacitorRuntime()) return;

    const onOpenFromPush = (event: Event) => {
      void (async () => {
        try {
          const detail =
            typeof CustomEvent === 'function' &&
            event instanceof CustomEvent &&
            event.detail &&
            typeof event.detail === 'object'
              ? (event.detail as { route?: unknown; threadId?: unknown })
              : {};

          const route = detail.route;
          const threadId = detail.threadId;
          const { auth } = await import('./lib/firebaseConfig');

          // If auth has not settled yet, pending route will be consumed on auth ready.
          if (!auth.currentUser) {
            queuePendingPushOpenRoute(
              typeof route === 'string' ? route : '/messages',
              typeof threadId === 'string' ? threadId : undefined,
            );
            return;
          }

          const didNavigate = navigateFromPushPayload(route, threadId);
          if (!didNavigate) {
            queuePendingPushOpenRoute(
              typeof route === 'string' ? route : '/messages',
              typeof threadId === 'string' ? threadId : undefined,
            );
          }
        } catch (error) {
          console.warn('[push] open-messages event handler failed', error);
        }
      })();
    };

    window.addEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, onOpenFromPush);
    return () => {
      window.removeEventListener(OPEN_MESSAGES_FROM_PUSH_EVENT, onOpenFromPush);
    };
  }, [navigateFromPushPayload]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
      <NativeLayoutDebug />
    </>
  );
}

export default App;
