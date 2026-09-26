import { trackEvent } from './analytics';
import { isPublicAnalyticsPath } from './publicAnalyticsPathPolicy.js';

type EventTimingLike = PerformanceEntry & {
  duration: number;
  interactionId?: number;
  name: string;
  processingEnd: number;
  processingStart: number;
  startTime: number;
  target?: EventTarget | null;
};

type InpCandidate = {
  duration: number;
  eventName: string;
  inputDelay: number;
  interactionId: number;
  presentationDelay: number;
  processingTime: number;
  target: string;
};

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

const MIN_REPORTABLE_DURATION_MS = 80;
const MIN_REPORT_DELTA_MS = 8;
const REPORT_IDLE_TIMEOUT_MS = 3000;
const REPORT_FALLBACK_DELAY_MS = 1200;

const safeToken = (value: string | null | undefined) => {
  if (!value) return '';
  const normalized = value.trim().toLowerCase();
  return /^[a-z][a-z0-9_-]{0,31}$/.test(normalized) ? normalized : '';
};

const safeId = (value: string | null | undefined) => {
  if (!value) return '';
  const normalized = value.trim();
  if (!/^[A-Za-z][A-Za-z0-9:_-]{0,63}$/.test(normalized)) return '';
  // Avoid sending IDs that look dynamically generated or user-derived.
  if (/\d{4,}/.test(normalized)) return '';
  return normalized;
};

export const describeInpTarget = (target: EventTarget | null | undefined): string => {
  if (!(target instanceof Element)) return 'unknown';

  const tag = target.tagName.toLowerCase();
  const id = safeId(target.id);
  const role = safeToken(target.getAttribute('role'));
  const type =
    target instanceof HTMLInputElement || target instanceof HTMLButtonElement
      ? safeToken(target.type)
      : '';
  const cwvId = safeToken(target.getAttribute('data-cwv-id'));

  return [
    tag,
    cwvId ? `[data-cwv-id=${cwvId}]` : '',
    id ? `#${id}` : '',
    role ? `[role=${role}]` : '',
    type ? `[type=${type}]` : '',
  ]
    .join('')
    .slice(0, 120);
};

export const buildInpCandidate = (entry: EventTimingLike): InpCandidate | null => {
  const interactionId = Number(entry.interactionId || 0);
  if (!interactionId || !Number.isFinite(entry.duration) || entry.duration <= 0) return null;

  const inputDelay = Math.max(0, entry.processingStart - entry.startTime);
  const processingTime = Math.max(0, entry.processingEnd - entry.processingStart);
  const presentationDelay = Math.max(0, entry.duration - inputDelay - processingTime);

  return {
    duration: entry.duration,
    eventName: entry.name || 'interaction',
    inputDelay,
    interactionId,
    presentationDelay,
    processingTime,
    target: describeInpTarget(entry.target),
  };
};

const getDeviceClass = () => {
  if (typeof window === 'undefined') return 'unknown';
  return window.matchMedia?.('(max-width: 767px)').matches ? 'mobile' : 'desktop';
};

const getViewportBucket = () => {
  if (typeof window === 'undefined') return 'unknown';
  const width = window.innerWidth;
  if (width <= 390) return 'xs';
  if (width <= 480) return 'sm';
  if (width <= 767) return 'md';
  if (width <= 1199) return 'lg';
  return 'xl';
};

const getConnectionContext = () => {
  const connection = (navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean };
  }).connection;

  return {
    effectiveType:
      typeof connection?.effectiveType === 'string'
        ? connection.effectiveType.toLowerCase()
        : 'unknown',
    saveData: Boolean(connection?.saveData),
  };
};

const shouldObserveInp = () => {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return false;
  if (typeof navigator !== 'undefined' && navigator.webdriver) return false;
  if (!import.meta.env.PROD) return false;
  if (window.location.hostname !== 'tinystepslearning.com') return false;
  if (!isPublicAnalyticsPath(window.location.pathname)) return false;
  return PerformanceObserver.supportedEntryTypes?.includes('event') === true;
};

/**
 * Installs a tiny Event Timing observer for real-user mobile responsiveness diagnosis.
 *
 * This does not read field values, visible text, aria labels, or user identifiers.
 * Reporting is moved to idle/background time so the observer itself does not add work
 * to the interaction that it is measuring.
 */
export const installInpRum = () => {
  if (!shouldObserveInp()) return () => undefined;

  const win = window as IdleWindow;
  const interactions = new Map<number, InpCandidate>();
  let worstCandidate: InpCandidate | null = null;
  let pendingCandidate: InpCandidate | null = null;
  let lastReportedDuration = 0;
  let idleId: number | undefined;
  let fallbackTimerId: number | undefined;

  const clearScheduledReport = () => {
    if (idleId !== undefined && typeof win.cancelIdleCallback === 'function') {
      win.cancelIdleCallback(idleId);
      idleId = undefined;
    }
    if (fallbackTimerId !== undefined) {
      window.clearTimeout(fallbackTimerId);
      fallbackTimerId = undefined;
    }
  };

  const flush = () => {
    clearScheduledReport();
    const candidate = pendingCandidate;
    pendingCandidate = null;
    if (!candidate) return;
    if (candidate.duration < MIN_REPORTABLE_DURATION_MS) return;
    if (candidate.duration < lastReportedDuration + MIN_REPORT_DELTA_MS) return;

    lastReportedDuration = candidate.duration;
    const connection = getConnectionContext();

    trackEvent('cwv_inp_candidate', {
      metric_name: 'INP',
      metric_value_ms: Math.round(candidate.duration),
      input_delay_ms: Math.round(candidate.inputDelay),
      processing_time_ms: Math.round(candidate.processingTime),
      presentation_delay_ms: Math.round(candidate.presentationDelay),
      interaction_type: candidate.eventName,
      interaction_target: candidate.target,
      interaction_id: candidate.interactionId,
      page_path: window.location.pathname,
      device_class: getDeviceClass(),
      viewport_bucket: getViewportBucket(),
      network_effective_type: connection.effectiveType,
      save_data: connection.saveData ? 1 : 0,
      source_context: 'event_timing_rum',
    });
  };

  const scheduleReport = (candidate: InpCandidate) => {
    pendingCandidate = candidate;
    if (idleId !== undefined || fallbackTimerId !== undefined) return;

    if (typeof win.requestIdleCallback === 'function') {
      idleId = win.requestIdleCallback(flush, { timeout: REPORT_IDLE_TIMEOUT_MS });
    } else {
      fallbackTimerId = window.setTimeout(flush, REPORT_FALLBACK_DELAY_MS);
    }
  };

  const observer = new PerformanceObserver((list) => {
    for (const rawEntry of list.getEntries()) {
      const candidate = buildInpCandidate(rawEntry as EventTimingLike);
      if (!candidate) continue;

      const previous = interactions.get(candidate.interactionId);
      if (previous && previous.duration >= candidate.duration) continue;
      interactions.set(candidate.interactionId, candidate);

      if (!worstCandidate || candidate.duration > worstCandidate.duration) {
        worstCandidate = candidate;
        scheduleReport(candidate);
      }
    }
  });

  try {
    observer.observe({
      type: 'event',
      buffered: true,
      durationThreshold: 40,
    } as PerformanceObserverInit);
  } catch {
    observer.disconnect();
    return () => undefined;
  }

  const onPageHide = () => {
    if (worstCandidate) pendingCandidate = worstCandidate;
    flush();
  };

  window.addEventListener('pagehide', onPageHide, { capture: true });

  return () => {
    observer.disconnect();
    window.removeEventListener('pagehide', onPageHide, { capture: true });
    clearScheduledReport();
    interactions.clear();
  };
};
