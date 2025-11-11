// @ts-nocheck
let initialized = false;

const loadScript = (id: string) => {
  if (document.getElementById('ga4-script')) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  script.id = 'ga4-script';
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id);
};

export const initAnalytics = () => {
  if (initialized) return;
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  loadScript(measurementId);
  initialized = true;
};

const ensureInit = () => {
  if (!initialized) initAnalytics();
  return initialized;
};

export const trackPageView = (path: string) => {
  if (!ensureInit()) return;
  window.gtag('event', 'page_view', { page_path: path });
};

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (!ensureInit()) return;
  window.gtag('event', eventName, params || {});
};

