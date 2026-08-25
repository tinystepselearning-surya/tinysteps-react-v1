import { describe, expect, it } from 'vitest';

import {
  buildWhatsAppUrl,
  sanitizeWhatsAppMessage,
  sanitizeWhatsAppPhone,
} from '../../lib/whatsAppUrl';

describe('WhatsApp click-to-chat URL', () => {
  it('builds a non-empty prefilled basic message', () => {
    const message = 'Hello! Your Tiny Steps class is today.';
    const url = new URL(buildWhatsAppUrl('+91 98765 43210', message));

    expect(url.origin).toBe('https://wa.me');
    expect(url.pathname).toBe('/919876543210');
    expect(url.searchParams.get('text')).toBe(message);
    expect(url.href).toContain(`text=${encodeURIComponent(message)}`);
  });

  it('preserves multiline reminder text', () => {
    const message = `Hello!

Quick reminder: Aarav has Tiny Steps class today at 6:30 PM.

Please join on time.

- Tiny Steps`;
    const url = new URL(buildWhatsAppUrl('+1 (555) 123-4567', message));

    expect(url.pathname).toBe('/15551234567');
    expect(url.searchParams.get('text')).toBe(message);
    expect(url.href).toContain('%0A%0A');
  });

  it('encodes punctuation and preserves Unicode names and emojis', () => {
    const message = "Riya & Anaya — Parent's class is at 6:30 PM (+05:30) 😊";
    const url = new URL(buildWhatsAppUrl('+44 7700 900123', message));

    expect(url.pathname).toBe('/447700900123');
    expect(url.searchParams.get('text')).toBe(message);
    expect(url.href).toContain('%26');
    expect(url.href).toContain('%2B05%3A30');
    expect(url.href).toContain('%F0%9F%98%8A');
  });

  it.each([
    ['+91 98765 43210', '919876543210'],
    ['+1 (555) 123-4567', '15551234567'],
    ['+44 7700 900123', '447700900123'],
    ['+971 50 123 4567', '971501234567'],
  ])('normalizes international phone %s', (phone, expectedDigits) => {
    expect(sanitizeWhatsAppPhone(phone)).toBe(expectedDigits);
    expect(new URL(buildWhatsAppUrl(phone, 'Reminder')).pathname).toBe(`/${expectedDigits}`);
  });

  it('normalizes line endings and removes invalid control/replacement characters only', () => {
    expect(sanitizeWhatsAppMessage('Hello\r\n\r\n\r\nAarav\u0000 😊\uFFFD')).toBe(
      'Hello\n\nAarav 😊',
    );
  });

  it('refuses to build a URL when phone or message is empty', () => {
    expect(buildWhatsAppUrl('', 'Reminder')).toBe('');
    expect(buildWhatsAppUrl('+91 98765 43210', '   ')).toBe('');
  });
});
