import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';
import {
  buildWhatsAppUrl,
  sanitizeWhatsAppMessage,
  sanitizeWhatsAppPhone,
} from './whatsAppUrl';

export type ReminderLaunchResult =
  | 'opened'
  | 'invalid-phone'
  | 'invalid-message'
  | 'business-unavailable'
  | 'launch-failed';

/**
 * Opens WhatsApp BUSINESS on a native iPhone. Never silently falls back to a
 * personal account, which would send customer messages from the wrong sender.
 *
 * WhatsApp Business' URL scheme is third-party documented, not a Meta API
 * guarantee. A failed launch does NOT prove Business is not installed.
 * Keep the physical dual-install acceptance test as a release gate.
 * Browser and Android behavior is unchanged.
 */
export async function openSessionReminderWhatsApp(
  phone: string,
  message: string,
): Promise<ReminderLaunchResult> {
  const digits = sanitizeWhatsAppPhone(phone);
  const text = sanitizeWhatsAppMessage(message);
  if (!/^\d{8,15}$/.test(digits)) return 'invalid-phone';
  if (!text) return 'invalid-message';

  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
    const url = `whatsapp-business://send?phone=${digits}&text=${encodeURIComponent(text)}`;
    try {
      // iOS canOpenURL() can return false for an undeclared/unsupported query
      // scheme even when a target application is installed. Attempt the
      // Business-only URL directly; never fall back to personal WhatsApp.
      const launched = await AppLauncher.openUrl({ url });
      return launched.completed ? 'opened' : 'business-unavailable';
    } catch {
      return 'launch-failed';
    }
  }

  const url = buildWhatsAppUrl(digits, text);
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  // In browsers, window.open may return null because of noopener even if
  // the navigation succeeded. Do not mark reminders sent from this outcome.
  void opened;
  return 'opened';
}
