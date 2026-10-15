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
  | 'launch-failed';

/**
 * Opens the prepared WhatsApp chat after an explicit Notify action.
 *
 * On the test iPhone the official wa.me URL opened WhatsApp Business with the
 * right parent and message. iOS may route the same URL to personal WhatsApp
 * on a different device: the operator MUST verify Business before tapping
 * send. This method only opens a composer, never sends or marks notified.
 * Browser and Android behavior are unchanged.
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
    // Reuse the exact iPhone-tested wa.me handoff rather than the unsupported
    // whatsapp-business:// scheme. Do not infer app/account identity or send.
    return openIOSWhatsAppChatLink(digits, text);
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
 * tapped a Notify action and confirmed the correct Business account before
 * sending. Opening the URL is NOT proof the message was delivered.
 */
export async function openIOSWhatsAppChatLink(
  phone: string,
  message: string,
): Promise<ReminderLaunchResult> {
  const digits = sanitizeWhatsAppPhone(phone);
  const text = sanitizeWhatsAppMessage(message);
  if (!/^\d{8,15}$/.test(digits)) return 'invalid-phone';
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
