import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import router from './app/routes';
import useRevealAnimations from './hooks/useRevealAnimations';
import { auth } from './lib/firebaseConfig';
import { registerNativePushNotifications } from './lib/pushNotifications';

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
    });

    return () => unsubscribe();
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
