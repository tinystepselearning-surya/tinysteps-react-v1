import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './app/routes';
import CursorAnimation from './components/common/CursorAnimation';

function App() {
  return (
    <>
      <CursorAnimation />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
