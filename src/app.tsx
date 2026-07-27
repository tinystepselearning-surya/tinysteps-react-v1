import React, { lazy, Suspense, useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './app/routes';
import { Toaster } from './components/ui/toaster';
import useRevealAnimations from './hooks/useRevealAnimations';
import { isAuthEntryRoute, isProtectedAppRoute } from './utils/publicRouteGuards';

const ProtectedRuntimeBootstrap = lazy(
  () => import('./components/runtime/ProtectedRuntimeBootstrap'),
);

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
  const [pathname, setPathname] = useState(() => router.state.location.pathname);

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
    if (typeof router.subscribe !== 'function') return;
    return router.subscribe((state) => setPathname(state.location.pathname));
  }, []);

  const needsProtectedRuntime =
    isNativeCapacitorRuntime() || isProtectedAppRoute(pathname) || isAuthEntryRoute(pathname);

  return (
    <>
      {needsProtectedRuntime ? (
        <Suspense fallback={null}>
          <ProtectedRuntimeBootstrap />
        </Suspense>
      ) : null}
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default App;
