import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './app/routes';
import useRevealAnimations from './hooks/useRevealAnimations';

function App() {
  useRevealAnimations();
  useEffect(() => {
    // Register service worker only in production to avoid caching issues during dev
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {
        /* ignore */
      });
    }
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
