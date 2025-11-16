import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './app/routes';
import CursorAnimation from './components/common/CursorAnimation';
import useRevealAnimations from './hooks/useRevealAnimations';
import useParallaxElements from './hooks/useParallaxElements';
import { useAuth } from './hooks/useAuth';
import { useEffect } from 'react';

function App() {
  useRevealAnimations();
  useParallaxElements();
  const { isLoading } = useAuth();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {
        /* ignore */
      });
    }
  }, []);

  if (isLoading) {
    return (
      <>
        <CursorAnimation />
        <div className="flex min-h-screen items-center justify-center bg-white text-sm text-gray-500">
          Preparing your experience…
        </div>
      </>
    );
  }

  return (
    <>
      <CursorAnimation />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
