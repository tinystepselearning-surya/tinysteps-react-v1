// @ts-nocheck
import { isPublicAnalyticsPath } from './publicAnalyticsPathPolicy.js';
import { classifyMarketingPath } from './analyticsClassification';

let initialized = false;
let interactionArmed = false;
let scriptQueued = false;
let fallbackTimerId: number | undefined;
let idleLoadTimerId: number | undefined;

const PRODUCTION_GA_MEASUREMENT_ID = 'G-J3TTBH8CN9';
const PRODUCTION_CLARITY_ID = 'xl3yemvlms';

const DESKTOP_FALLBACK_DELAY_MS = 18000;
const MOBILE_FALLBACK_DELAY_MS = 12000;
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

const armInteractionLoader = (id: string) => {
  if (interactionArmed) return;
  interactionArmed = true;
  const isMobileViewport = window.matchMedia?.('(max-width: 767px)').matches;
  const connection = (navigator as any)?.connection;
  const effectiveType =
    typeof connection?.effectiveType === 'string' ? connection.effectiveType.toLowerCase() : '';
  const isConstrainedNetwork =
    Boolean(connection?.saveData) || effectiveType === 'slow-2g' || effectiveType === '2g';
  const fallbackDelayMs = isMobileViewport ? MOBILE_FALLBACK_DELAY_MS : DESKTOP_FALLBACK_DELAY_MS;

  const clearFallbackTimer = () => {
    if (fallbackTimerId !== undefined) {
      window.clearTimeout(fallbackTimerId);
      fallbackTimerId = undefined;
    }
  };

  const loadOnInteraction = () => {
    clearFallbackTimer();
    queueScriptLoad(id);
    window.removeEventListener('scroll', loadOnInteraction);
    window.removeEventListener('click', loadOnInteraction);
    window.removeEventListener('touchstart', loadOnInteraction);
    window.removeEventListener('pointerdown', loadOnInteraction);
    window.removeEventListener('keydown', loadOnInteraction);
  };

  window.addEventListener('scroll', loadOnInteraction, { once: true, passive: true });
  window.addEventListener('click', loadOnInteraction, { once: true, passive: true });
  window.addEventListener('touchstart', loadOnInteraction, { once: true, passive: true });
  window.addEventListener('pointerdown', loadOnInteraction, { once: true, passive: true });
  window.addEventListener('keydown', loadOnInteraction, { once: true, passive: true });

  if (!isConstrainedNetwork) {
    fallbackTimerId = window.setTimeout(() => {
      clearFallbackTimer();
      loadOnInteraction();
    }, fallbackDelayMs);
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
  armInteractionLoader(measurementId);
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
