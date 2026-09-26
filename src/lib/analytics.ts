// @ts-nocheck
import { isPublicAnalyticsPath } from './publicRouteManifest.js';
import { classifyMarketingPath } from './analyticsClassification';

let initialized = false;
let scriptQueued = false;
let idleLoadTimerId: number | undefined;

const PRODUCTION_GA_MEASUREMENT_ID = 'G-J3TTBH8CN9';
const PRODUCTION_CLARITY_ID = 'xl3yemvlms';
const IDLE_LOAD_TIMEOUT_MS = 9000;

function shouldRunAnalytics() {
  if (typeof navigator !== 'undefined' && navigator.webdriver) return false;
  if (!import.meta.env.PROD) return false;
  if (location.hostname !== 'tinystepslearning.com') return false;
  if (!isPublicAnalyticsPath(location.pathname)) return false;
  return true;
}

function resolveEventPath(params?: Record<string, any>): string {
  const explicitPath = params?.page_path || params?.page || params?.sourcePath;
  if (typeof explicitPath === 'string' && explicitPath.trim()) return explicitPath;
  if (typeof window !== 'undefined') return window.location.pathname;
  return '/';
}

function withMarketingContext(params?: Record<string, any>) {
  const eventParams = params || {};
  const context = classifyMarketingPath(resolveEventPath(eventParams));
  return {
    ...context,
    ...eventParams,
  };
}

const loadScript = (id: string) => {
  if (document.getElementById('ga4-script')) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  script.id = 'ga4-script';
  document.head.appendChild(script);
};

const loadClarity = (id: string) => {
  if (!id || document.getElementById('clarity-script') || !shouldRunAnalytics()) return;
  const clarity = ((...args: unknown[]) => {
    (clarity.q = clarity.q || []).push(args);
  }) as ((...args: unknown[]) => void) & { q?: unknown[][] };
  window.clarity = window.clarity || clarity;
  const script = document.createElement('script');
  script.async = true;
  script.id = 'clarity-script';
  script.src = `https://www.clarity.ms/tag/${id}`;
  document.head.appendChild(script);
};

const queueScriptLoad = (id: string) => {
  if (scriptQueued) return;
  scriptQueued = true;

  const win = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };

  if (typeof win.requestIdleCallback === 'function') {
    win.requestIdleCallback(() => {
      loadScript(id);
      loadClarity(PRODUCTION_CLARITY_ID);
    }, { timeout: IDLE_LOAD_TIMEOUT_MS });
  } else {
    idleLoadTimerId = window.setTimeout(() => {
      idleLoadTimerId = undefined;
      loadScript(id);
      loadClarity(PRODUCTION_CLARITY_ID);
    }, 2200);
  }
};

export const initAnalytics = () => {
  if (!shouldRunAnalytics()) return;
  if (initialized) return;

  const measurementId =
    import.meta.env.VITE_GA_MEASUREMENT_ID || PRODUCTION_GA_MEASUREMENT_ID;
  if (!measurementId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });

  // P2 INP rule: third-party analytics/Clarity loading must never be armed by
  // pointer, touch, keyboard, click, or scroll input. Events can queue in
  // dataLayer while the scripts load independently during browser idle time.
  queueScriptLoad(measurementId);
  initialized = true;
};

const ensureInit = () => {
  if (!shouldRunAnalytics()) return false;
  if (!initialized) initAnalytics();
  return initialized;
};

export const trackPageView = (path: string) => {
  if (!shouldRunAnalytics()) return;
  if (!ensureInit()) return;

  const context = classifyMarketingPath(path);
  window.gtag('event', 'page_view', {
    page_path: path,
    ...context,
  });
};

export function trackEvent(name: string, params?: Record<string, any>) {
  try {
    if (typeof window === 'undefined') return;
    if (!ensureInit()) return;
    if (!window.gtag) return;

    window.gtag('event', name, withMarketingContext(params));
  } catch (err) {
    console.error('[GA ERROR]', err);
  }
}
