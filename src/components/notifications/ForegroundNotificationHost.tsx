import { useEffect, useRef, useState } from 'react';
import { CalendarClock, MessageSquare, X } from 'lucide-react';
import {
  dismissForegroundNotification,
  openForegroundNotification,
  subscribeForegroundNotifications,
  type ForegroundNotification,
} from '../../lib/foregroundNotificationState';

const AUTO_DISMISS_MS = 5_000;

const relativeTime = (receivedAtMs: number) => {
  const seconds = Math.max(0, Math.round((Date.now() - receivedAtMs) / 1_000));
  if (seconds < 10) return 'Now';
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
};

export default function ForegroundNotificationHost() {
  const [notification, setNotification] = useState<ForegroundNotification | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearDismissTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startDismissTimer = () => {
    clearDismissTimer();
    if (!notification) return;
    timerRef.current = window.setTimeout(() => {
      dismissForegroundNotification(notification.id);
    }, AUTO_DISMISS_MS);
  };

  useEffect(() => subscribeForegroundNotifications(setNotification), []);

  useEffect(() => {
    startDismissTimer();
    return clearDismissTimer;
    // Timer ownership follows the currently displayed notification.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification?.id]);

  if (!notification) return null;
  const Icon = notification.kind === 'message' ? MessageSquare : CalendarClock;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 top-[calc(env(safe-area-inset-top,0px)+0.5rem)] z-[110] motion-safe:animate-in motion-safe:slide-in-from-top-2"
      onPointerDown={clearDismissTimer}
      onPointerUp={startDismissTimer}
      onFocus={clearDismissTimer}
      onBlur={startDismissTimer}
      data-testid="foreground-notification"
    >
      <div className="mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
          onClick={() => openForegroundNotification(notification)}
          aria-label={`${notification.title}. ${notification.body}`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-semibold text-slate-950">
                {notification.title}
              </span>
              <time className="shrink-0 text-[11px] text-slate-500">
                {relativeTime(notification.receivedAtMs)}
              </time>
            </span>
            <span className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-600">
              {notification.body}
            </span>
          </span>
        </button>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          aria-label="Dismiss notification"
          onClick={() => dismissForegroundNotification(notification.id)}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
