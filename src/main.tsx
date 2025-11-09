import React from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';
import App from './app';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import './lib/firebaseConfig';
import { initSentry } from './lib/sentry';
import * as Sentry from '@sentry/react';
import { ErrorFallback } from './components/ErrorFallback';

initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </QueryClientProvider>
);
