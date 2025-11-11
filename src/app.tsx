import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './app/routes';
import CursorAnimation from './components/common/CursorAnimation';
import useRevealAnimations from './hooks/useRevealAnimations';
import useParallaxElements from './hooks/useParallaxElements';

function App() {
  useRevealAnimations();
  useParallaxElements();

  return (
    <>
      <CursorAnimation />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
