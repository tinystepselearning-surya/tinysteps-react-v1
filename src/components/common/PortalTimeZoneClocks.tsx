import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { INDIA_TIME_ZONE, getViewerTimeZone } from '../../lib/sessionTime';

type PortalTimeZoneClocksProps = {
  /** Saved IANA zone for teachers; parents default to their device's time zone. */
  timeZone?: string;
  zoneSource?: 'profile' | 'device';
  onRefreshTimeZone?: () => void;
};

export const formatPortalClock = (now: Date, timeZone: string) => {
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now);
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(now);
  const abbreviation = timeZone === INDIA_TIME_ZONE ? 'IST' :
    new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
      .formatToParts(now).find(part => part.type === 'timeZoneName')?.value || timeZone;
  return { time, date, abbreviation };
};

/**
 * Two clocks use the same real-world instant. No network request or Firestore
 * listener is required; only this small component re-renders as the time moves.
 */
export default function PortalTimeZoneClocks({
  timeZone,
  zoneSource = 'device',
  onRefreshTimeZone,
}: PortalTimeZoneClocksProps) {
  const [now, setNow] = useState(() => new Date());
  const localZone = timeZone || getViewerTimeZone();

  useEffect(() => {
    const update = () => setNow(new Date());
    const timer = window.setInterval(update, 15_000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  const local = formatPortalClock(now, localZone);
  const india = formatPortalClock(now, INDIA_TIME_ZONE);

  return (
    <section
      aria-label="Current local and India times"
      data-testid="portal-time-zone-clocks"
      className="grid min-w-0 grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white/90 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:gap-3 sm:p-3"
    >
      <div data-testid="portal-local-clock" className="min-w-0 rounded-lg bg-indigo-50/70 px-2.5 py-2 dark:bg-indigo-950/30 sm:px-3">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-200 sm:text-xs">Your local time</p>
          {onRefreshTimeZone && (
            <button
              type="button"
              onClick={onRefreshTimeZone}
              title="Refresh saved time zone"
              aria-label="Refresh saved time zone"
              className="rounded p-1 text-indigo-700 hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-indigo-200 dark:hover:bg-indigo-900"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
        <p className="mt-1 text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 sm:text-lg">
          <time dateTime={now.toISOString()}>{local.time}</time>
          <span className="ml-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">{local.abbreviation}</span>
        </p>
        <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400 sm:text-xs">{local.date}</p>
        <p className="mt-0.5 break-words text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs">
          {localZone} ({zoneSource === 'profile' ? 'saved profile' : 'device'})
        </p>
      </div>
      <div data-testid="portal-india-clock" className="min-w-0 rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-800/70 sm:px-3">
        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 sm:text-xs">India time (IST)</p>
        <p className="mt-1 text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 sm:text-lg">
          <time dateTime={now.toISOString()}>{india.time}</time>
          <span className="ml-1 text-xs font-medium text-slate-600 dark:text-slate-300">IST</span>
        </p>
        <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400 sm:text-xs">{india.date}</p>
        <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs">
          {INDIA_TIME_ZONE}
        </p>
      </div>
    </section>
  );
}
