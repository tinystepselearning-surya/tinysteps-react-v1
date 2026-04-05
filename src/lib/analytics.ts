// @ts-nocheck
let initialized = false;
let interactionArmed = false;
let scriptQueued = false;
let fallbackTimerId: number | undefined;

const DISABLED_PREFIXES = ['/admin', '/teacher', '/parent', '/kid', '/lp', '/dev'];

function isAllowedPath(path: string) {
  return !DISABLED_PREFIXES.some((p) => path.startsWith(p));
}

function shouldRunAnalytics() {
  // Skip prerender/headless automation contexts.
  if (typeof navigator !== 'undefined' && navigator.webdriver) return false;

  // Only run in production (no GA in local dev)
  if (!import.meta.env.PROD) return false;

  // Only run on your main domain (prevents GA in preview/staging domains)
  if (location.hostname !== 'tinystepslearning.com') return false;

  // Never run on portal routes
  if (!isAllowedPath(location.pathname)) return false;

  return true;
}

const loadScript = (id: string) => {
  if (document.getElementById('ga4-script')) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  script.id = 'ga4-script';
  document.head.appendChild(script);
};

const primeGtagQueue = (id: string) => {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id);
};

const queueScriptLoad = (id: string) => {
  if (scriptQueued) return;
  scriptQueued = true;

  const win = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };

  if (typeof win.requestIdleCallback === 'function') {
    win.requestIdleCallback(() => loadScript(id), { timeout: 1500 });
  } else {
    window.setTimeout(() => loadScript(id), 600);
  }
};

const armInteractionLoader = (id: string) => {
  if (interactionArmed) return;
  interactionArmed = true;

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

  fallbackTimerId = window.setTimeout(() => {
    clearFallbackTimer();
    loadOnInteraction();
  }, 6000);
};

export const initAnalytics = () => {
  // ✅ hard stop for admin/teacher/parent/kid/lp/dev + non-prod + non-domain
  if (!shouldRunAnalytics()) return;

  if (initialized) return;

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
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
  // ✅ double-safety: prevent init if route/domain/env is not allowed
  if (!shouldRunAnalytics()) return false;

  if (!initialized) initAnalytics();
  return initialized;
};

export const trackPageView = (path: string) => {
  if (!shouldRunAnalytics()) return;
  if (!ensureInit()) return;

  window.gtag('event', 'page_view', { page_path: path });
};

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (!shouldRunAnalytics()) return;
  if (!ensureInit()) return;

  window.gtag('event', eventName, params || {});
};
