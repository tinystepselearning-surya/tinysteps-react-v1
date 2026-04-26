import React, { useCallback, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import router from './app/routes';
import { Toaster } from './components/ui/toaster';
import useRevealAnimations from './hooks/useRevealAnimations';
import { auth } from './lib/firebaseConfig';
import {
  consumePendingPushOpenRoute,
  OPEN_MESSAGES_FROM_PUSH_EVENT,
  queuePendingPushOpenRoute,
  registerNativePushNotifications,
} from './lib/pushNotifications';

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

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
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

    return () => unsubscribe();
  }, [navigateFromPushPayload]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onOpenFromPush = (event: Event) => {
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
    </>
  );
}

export default App;
