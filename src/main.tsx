import React, { type ErrorInfo, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './app';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
// firebase is initialized lazily by protected-route logic to keep
// the public marketing pages lightweight. Avoid importing it here.
import { initSentry } from './lib/sentry';
import { ErrorFallback } from './components/ErrorFallback';
import { initAnalytics } from './lib/analytics';

class RootErrorBoundary extends React.Component<
  { children: ReactNode },
  { error: Error | null; componentStack: string }
> {
  state = { error: null as Error | null, componentStack: '' };

  static getDerivedStateFromError(error: Error) {
    return { error, componentStack: '' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ componentStack: errorInfo.componentStack || '' });
    console.error('[TS_DEBUG] RootErrorBoundary caught error');
    console.error('[TS_DEBUG] Error:', error);
    console.error('[TS_DEBUG] Message:', error?.message);
    console.error('[TS_DEBUG] Component stack:', errorInfo.componentStack);
    console.error('[TS_DEBUG] Last JS URL:', (window as any).__ts_last_js_url);
    console.error('[TS_DEBUG] Location:', window.location.href);
  }

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} componentStack={this.state.componentStack} />;
    }
    return this.props.children;
  }
}

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

if (import.meta.env.DEV) {
  void import('./dev/transferTraceConsole');
}

const scheduleNonCriticalBoot = () => {
  const boot = () => {
    void initSentry();
    initAnalytics();
  };

  if (typeof window === 'undefined') {
    boot();
    return;
  }

  const win = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  const isMobileViewport = window.matchMedia?.('(max-width: 767px)').matches;
  const connection = (navigator as any)?.connection;
  const effectiveType =
    typeof connection?.effectiveType === 'string' ? connection.effectiveType.toLowerCase() : '';
  const isConstrainedNetwork =
    Boolean(connection?.saveData) || effectiveType === 'slow-2g' || effectiveType === '2g';
  const fallbackDelayMs = isMobileViewport
    ? isConstrainedNetwork ? 14000 : 11000
    : isConstrainedNetwork ? 18000 : 15000;

  let hasBooted = false;
  let idleId: number | undefined;
  let timeoutId: number | undefined;

  const removeInteractionListeners = () => {
    window.removeEventListener('pointerdown', onFirstInteraction);
    window.removeEventListener('keydown', onFirstInteraction);
    window.removeEventListener('touchstart', onFirstInteraction);
    window.removeEventListener('scroll', onFirstInteraction);
  };

  const clearTimers = () => {
    if (idleId !== undefined && typeof win.cancelIdleCallback === 'function') {
      win.cancelIdleCallback(idleId);
      idleId = undefined;
    }
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  const scheduleBoot = (idleTimeoutMs: number, timeoutMs: number) => {
    if (hasBooted) return;
    if (typeof win.requestIdleCallback === 'function') {
      idleId = win.requestIdleCallback(() => {
        if (hasBooted) return;
        hasBooted = true;
        boot();
      }, { timeout: idleTimeoutMs });
      return;
    }
    timeoutId = window.setTimeout(() => {
      if (hasBooted) return;
      hasBooted = true;
      boot();
    }, timeoutMs);
  };

  const onFirstInteraction = () => {
    removeInteractionListeners();
    clearTimers();
    scheduleBoot(8000, 1800);
  };

  window.addEventListener('pointerdown', onFirstInteraction, { passive: true, once: true });
  window.addEventListener('keydown', onFirstInteraction, { once: true });
  window.addEventListener('touchstart', onFirstInteraction, { passive: true, once: true });
  window.addEventListener('scroll', onFirstInteraction, { passive: true, once: true });

  timeoutId = window.setTimeout(() => {
    removeInteractionListeners();
    clearTimers();
    scheduleBoot(10000, 2400);
  }, fallbackDelayMs);
};

scheduleNonCriticalBoot();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </QueryClientProvider>
);
