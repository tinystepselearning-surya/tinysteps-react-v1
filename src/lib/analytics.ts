// @ts-nocheck
import { isPublicAnalyticsPath } from './publicAnalyticsPathPolicy.js';
import { classifyMarketingPath } from './analyticsClassification';
import { analyticsPageContext, safeAnalyticsParameters } from './analyticsPrivacy';

let initialized = false;
let interactionArmed = false;
let scriptQueued = false;
let fallbackTimerId: number | undefined;
let idleLoadTimerId: number | undefined;

// The approved candidate has one fixed web destination. Do not allow a stale
// build variable to silently select the historical stream.
const PRODUCTION_GA_MEASUREMENT_ID = 'G-5RMQVF1HGD';
let lastTrackedPagePath: string | undefined;
const PRODUCTION_CLARITY_ID = 'xl3yemvlms';

const DESKTOP_FALLBACK_DELAY_MS = 18000;
const MOBILE_FALLBACK_DELAY_MS = 12000;
const IDLE_LOAD_TIMEOUT_MS = 9000;

// These routes embed playable child-facing activities. Marketing resource hubs
// remain eligible; direct play surfaces do not emit web analytics.
const PLAY_SURFACES = new Set([
  '/free-letter-sounds-game-for-kids',
  '/free-sound-listening-game-for-kids',
  '/free-word-building-game-for-kids',
  '/free-spelling-game-for-kids',
  '/free-sentence-making-game-for-kids',
  '/free-reading-fluency-game-for-kids',
  '/free-grammar-practice-game-for-kids',
  '/free-speaking-practice-game-for-kids',
  '/free-letter-tracing-game-for-kids',
  '/letter-tracing-with-sounds-game',
  '/free-balloon-pop-phonics-game-for-kids',
  '/free-games/word-meaning-flashcards',
  '/seasonal/christmas-tree',
]);

function isNativeRuntime() {
  if (typeof window === 'undefined') return false;
  try {
    if (window.Capacitor?.isNativePlatform?.()) return true;
  } catch {
    // Fall back to the protocol check.
  }
  return location.protocol === 'capacitor:' || location.protocol === 'ionic:';
}

function shouldRunAnalytics() {
  if (typeof navigator !== 'undefined' && navigator.webdriver) return false;
  if (!import.meta.env.PROD) return false;
  if (location.hostname !== 'tinystepslearning.com') return false;
  if (isNativeRuntime()) return false;
  if (!isPublicAnalyticsPath(location.pathname)) return false;
  if (PLAY_SURFACES.has(location.pathname.toLowerCase().replace(/\/+$/, ''))) return false;
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

// Recheck the current route when the delayed callback actually runs.
// A visitor may have entered a portal or a game in the meantime.
const finishQueuedLoad = (id: string) => {
  if (!shouldRunAnalytics()) {
    scriptQueued = false;
    interactionArmed = false;
    return;
  }
  loadScript(id);
  loadClarity(PRODUCTION_CLARITY_ID);
};

const queueScriptLoad = (id: string) => {
  if (scriptQueued) return;
  scriptQueued = true;

  const win = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };

  if (typeof win.requestIdleCallback === 'function') {
    win.requestIdleCallback(() => {
      finishQueuedLoad(id);
    }, { timeout: IDLE_LOAD_TIMEOUT_MS });
  } else {
    idleLoadTimerId = window.setTimeout(() => {
      idleLoadTimerId = undefined;
      finishQueuedLoad(id);
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

  const measurementId = PRODUCTION_GA_MEASUREMENT_ID;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    ...analyticsPageContext(window.location.href, document.referrer),
  });
  armInteractionLoader(measurementId);
  initialized = true;
};

const ensureInit = () => {
  if (!shouldRunAnalytics()) return false;
  if (!initialized) initAnalytics();
  if (initialized && !scriptQueued) armInteractionLoader(PRODUCTION_GA_MEASUREMENT_ID);
  return initialized;
};

// The SPA route tracker owns manual page views. Query-only changes (e.g.
// opening a form) are not new page views. Leaving and re-entering an eligible
// route is a new visit. Console history tracking must be disabled before release.
export const trackPageView = (path: string) => {
  if (typeof window === 'undefined') return;
  const eligible = shouldRunAnalytics();
  if (import.meta.env.PROD && location.hostname === 'tinystepslearning.com' && !isNativeRuntime()) {
    window['ga-disable-' + PRODUCTION_GA_MEASUREMENT_ID] = !eligible;
  }
  if (!eligible) {
    lastTrackedPagePath = undefined;
    return;
  }
  const pathname = location.pathname;
  if (lastTrackedPagePath === pathname) return;
  lastTrackedPagePath = pathname;
  trackEvent('page_view', { page_path: path });
};

export function trackEvent(name: string, params?: Record<string, any>) {
  try {
    if (typeof window === 'undefined') return;
    if (!ensureInit()) return;
    if (!window.gtag) return;

    window.gtag('event', name, {
      ...safeAnalyticsParameters(withMarketingContext(params), name),
      ...analyticsPageContext(window.location.href, document.referrer),
      send_to: PRODUCTION_GA_MEASUREMENT_ID,
    });
  } catch (err) {
    console.error('[GA ERROR]', err);
  }
}
