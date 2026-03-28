import ReactDOM from 'react-dom/client';
import './index.css';
import App from './app';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
// firebase is initialized lazily by protected-route logic to keep
// the public marketing pages lightweight. Avoid importing it here.
import { initSentry } from './lib/sentry';
import * as Sentry from '@sentry/react';
import { ErrorFallback } from './components/ErrorFallback';
import { initAnalytics } from './lib/analytics';

const shouldEnableLazyDebug =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  (window as any).__TS_ENABLE_LAZY_DEBUG__ === true;

if (shouldEnableLazyDebug) {
  if (!(window as any).__ts_lazy_debug) {
    (window as any).__ts_lazy_debug = true;
    (window as any).__ts_last_js_url = null;

    // Track fetch-based chunk loads only when explicitly debugging.
    const origFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      try {
        const url = String(args?.[0] ?? '');
        if (url.includes('.js')) {
          (window as any).__ts_last_js_url = url;
          console.log('[TS_DEBUG] Lazy chunk loading via fetch:', url);
        }
      } catch {
        // Ignore instrumentation failures.
      }
      return origFetch(...args);
    };

    // Track <script> chunk loads (Vite dynamic import).
    const origCreate = document.createElement.bind(document);
    document.createElement = ((tagName: any, options?: any) => {
      const el = origCreate(tagName, options) as any;
      if (String(tagName).toLowerCase() === 'script') {
        const desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
        if (desc?.set) {
          Object.defineProperty(el, 'src', {
            set(v) {
              try {
                if (String(v).includes('.js')) {
                  (window as any).__ts_last_js_url = String(v);
                  console.log('[TS_DEBUG] Lazy chunk loading via script:', String(v));
                }
              } catch {
                // Ignore instrumentation failures.
              }
              return desc.set!.call(this, v);
            },
            get() {
              return desc.get!.call(this);
            },
          });
        }
      }
      return el;
    }) as any;

    window.addEventListener('error', (e) => {
      console.error('[TS_DEBUG] Error event - last JS:', (window as any).__ts_last_js_url);
      console.error('[TS_DEBUG] Error message:', e.message);
    });
  }
}

initSentry();
initAnalytics();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <Sentry.ErrorBoundary 
      fallback={(props) => <ErrorFallback error={props.error as Error} componentStack={props.componentStack} />}
      onError={(error, componentStack) => {
        console.error('[TS_DEBUG] Sentry ErrorBoundary caught error');
        console.error('[TS_DEBUG] Error:', error);
        console.error('[TS_DEBUG] Message:', (error as Error)?.message);
        console.error('[TS_DEBUG] Component stack:', componentStack);
        console.error('[TS_DEBUG] Last JS URL:', (window as any).__ts_last_js_url);
        console.error('[TS_DEBUG] Location:', window.location.href);
      }}
    >
      <App />
    </Sentry.ErrorBoundary>
  </QueryClientProvider>
);
