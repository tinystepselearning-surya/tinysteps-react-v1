import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';
import { Share } from '@capacitor/share';
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

/**
 * Presents an iOS share sheet. The operator must explicitly choose WhatsApp
 * Business, select/verify the recipient and send. Resolving does not establish
 * delivery; callers must never write 'notified' state from this result.
 */
export async function openIOSReminderShareSheet(message: string): Promise<boolean> {
  const text = sanitizeWhatsAppMessage(message);
  if (!text) return false;
  try {
    await Share.share({ title: 'Tiny Steps class reminder', text });
    return true;
  } catch {
    // User cancelled or the OS could not present the share sheet.
    return false;
  }
}

/**
 * Official WhatsApp Click-to-Chat route for iOS.
 *
 * This DOES NOT select a specific WhatsApp installation. iOS may show a
 * chooser, open Messenger, open Business, or open the browser, depending on
 * installed apps and user preferences. Only invoke after the operator has
 * explicitly chosen this option and seen the Business-account warning.
 * Opening the URL is NOT proof the message was delivered.
 */
export async function openIOSWhatsAppChatLink(
  phone: string,
  message: string,
): Promise<ReminderLaunchResult> {
  const digits = sanitizeWhatsAppPhone(phone);
  const text = sanitizeWhatsAppMessage(message);
  if (!/^\\d{8,15}$/.test(digits)) return 'invalid-phone';
  if (!text) return 'invalid-message';
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return 'launch-failed';
  }

  const url = buildWhatsAppUrl(digits, text);
  try {
    const result = await AppLauncher.openUrl({ url });
    // completed means iOS accepted the URL, not that Business opened/sent.
    return result.completed ? 'opened' : 'launch-failed';
  } catch {
    return 'launch-failed';
  }
}
