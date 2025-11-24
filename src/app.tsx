import { RouterProvider } from 'react-router-dom';
import router from './app/routes';
// Cursor animation removed for production performance; use default cursor.
import useRevealAnimations from './hooks/useRevealAnimations';
import useParallaxElements from './hooks/useParallaxElements';
import { useEffect } from 'react';

function App() {
  useRevealAnimations();
  useParallaxElements();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {
        /* ignore */
      });
    }
  }, []);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
