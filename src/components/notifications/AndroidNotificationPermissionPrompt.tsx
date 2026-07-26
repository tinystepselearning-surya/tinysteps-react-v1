import { useEffect, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { BellRing, Settings, X } from 'lucide-react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Button } from '../ui/button';
import {
  ANDROID_NOTIFICATION_PERMISSION_EVENT,
  dismissAndroidNotificationPermissionPrompt,
  hasHandledAndroidNotificationPermissionPrompt,
  requestAndroidNotificationPermissionAndRegister,
} from '../../lib/pushNotifications';

type NotificationSettingsPlugin = {
  open(): Promise<void>;
};

const NotificationSettings = registerPlugin<NotificationSettingsPlugin>(
  'NotificationSettings',
);

type Props = {
  userId?: string | null;
};

export default function AndroidNotificationPermissionPrompt({ userId }: Props) {
  const [state, setState] = useState<'hidden' | 'prompt' | 'denied'>('hidden');

  useEffect(() => {
    if (
      !userId ||
      !Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() !== 'android'
    ) {
      setState('hidden');
      return;
    }

    let mounted = true;
    void PushNotifications.checkPermissions().then((permission) => {
      if (!mounted) return;
      if (
        permission.receive === 'prompt' &&
        !hasHandledAndroidNotificationPermissionPrompt()
      ) {
        setState('prompt');
      }
    }).catch(() => undefined);

    const onPermissionState = (event: Event) => {
      const nextState = (event as CustomEvent<{ state?: string }>).detail?.state;
      if (nextState === 'prompt' || nextState === 'denied') setState(nextState);
    };
    window.addEventListener(
      ANDROID_NOTIFICATION_PERMISSION_EVENT,
      onPermissionState,
    );
    return () => {
      mounted = false;
      window.removeEventListener(
        ANDROID_NOTIFICATION_PERMISSION_EVENT,
        onPermissionState,
      );
    };
  }, [userId]);

  if (!userId || state === 'hidden') return null;

  return (
    <aside
      className="fixed inset-x-3 bottom-[calc(var(--ts-mobile-tabbar-reserve)+0.75rem)] z-[100] mx-auto max-w-md rounded-2xl border border-orange-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      role="dialog"
      aria-label="Notification permission"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
          <BellRing className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-slate-950 dark:text-white">
            {state === 'prompt' ? 'Stay on track' : 'Notifications are off'}
          </h2>
          <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
            {state === 'prompt'
              ? 'Enable Tiny Steps alerts for new messages and your 15-minute class reminders.'
              : 'You can enable Tiny Steps messages and class reminders in Android settings.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {state === 'prompt' ? (
              <Button
                type="button"
                className="ts-native-press min-h-12 bg-orange-600 text-white hover:bg-orange-700"
                onClick={() => {
                  void requestAndroidNotificationPermissionAndRegister(userId).then(
                    (result) => setState(result === 'granted' ? 'hidden' : 'denied'),
                  );
                }}
              >
                Enable notifications
              </Button>
            ) : (
              <Button
                type="button"
                className="ts-native-press min-h-12"
                onClick={() => void NotificationSettings.open()}
              >
                <Settings className="mr-2 h-4 w-4" />
                Open settings
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="ts-native-press min-h-12"
              onClick={() => {
                dismissAndroidNotificationPermissionPrompt();
                setState('hidden');
              }}
            >
              Not now
            </Button>
          </div>
        </div>
        <button
          type="button"
          className="ts-native-press flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-slate-500"
          aria-label="Dismiss notification prompt"
          onClick={() => {
            dismissAndroidNotificationPermissionPrompt();
            setState('hidden');
          }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}
