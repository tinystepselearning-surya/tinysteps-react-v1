import ReactDOM from 'react-dom/client';
import './index.css';
import App from './app';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import './lib/firebaseConfig';
import { initSentry } from './lib/sentry';
import * as Sentry from '@sentry/react';
import { ErrorFallback } from './components/ErrorFallback';
import { initAnalytics } from './lib/analytics';

initSentry();
initAnalytics();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </QueryClientProvider>
);
