// @ts-nocheck
let initialized = false;

const DISABLED_PREFIXES = ['/admin', '/teacher', '/parent', '/kid', '/lp', '/dev'];

function isAllowedPath(path: string) {
  return !DISABLED_PREFIXES.some((p) => path.startsWith(p));
}

function shouldRunAnalytics() {
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

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id);
};

export const initAnalytics = () => {
  // ✅ hard stop for admin/teacher/parent/kid/lp/dev + non-prod + non-domain
  if (!shouldRunAnalytics()) return;

  if (initialized) return;

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;

  loadScript(measurementId);
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
