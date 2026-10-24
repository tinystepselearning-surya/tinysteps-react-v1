import { beforeEach, describe, expect, it, vi } from 'vitest';

const { canOpenUrlMock, openUrlMock, shareMock, isNativePlatformMock, getPlatformMock } = vi.hoisted(() => ({
  shareMock: vi.fn(),
  canOpenUrlMock: vi.fn(),
  openUrlMock: vi.fn(),
  isNativePlatformMock: vi.fn(),
  getPlatformMock: vi.fn(),
}));
vi.mock('@capacitor/app-launcher', () => ({
  AppLauncher: { canOpenUrl: canOpenUrlMock, openUrl: openUrlMock },
}));
vi.mock('@capacitor/share', () => ({ Share: { share: shareMock } }));
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: isNativePlatformMock, getPlatform: getPlatformMock },
}));
import { openIOSReminderShareSheet, openIOSWhatsAppChatLink, openSessionReminderWhatsApp } from '../../lib/whatsAppBusinessLauncher';

describe('Sessions Management WhatsApp Business handoff', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    isNativePlatformMock.mockReturnValue(true);
    getPlatformMock.mockReturnValue('ios');
    canOpenUrlMock.mockResolvedValue({ value: true });
    openUrlMock.mockResolvedValue({ completed: true });
    shareMock.mockResolvedValue({ activityType: '' });
  });

  it('uses the iPhone-verified official chat link directly with international number and message', async () => {
    const message = 'Hello Anaya!\nClass at 6:30 PM 😊 & Teams';
    expect(await openSessionReminderWhatsApp('+91 98765 43210', message)).toBe('opened');
    expect(canOpenUrlMock).not.toHaveBeenCalled();
    expect(openUrlMock).toHaveBeenCalledOnce();
    const url = openUrlMock.mock.calls[0][0].url as string;
    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://wa.me');
    expect(parsed.pathname).toBe('/919876543210');
    expect(parsed.searchParams.get('text')).toBe(message);
    expect(shareMock).not.toHaveBeenCalled();
  });

  it('does not use unreliable canOpenUrl checks or silently open an alternate scheme', async () => {
    canOpenUrlMock.mockResolvedValue({ value: false });
    openUrlMock.mockResolvedValue({ completed: false });
    const webOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    expect(await openSessionReminderWhatsApp('+91 98765 43210', 'Reminder')).toBe('launch-failed');
    expect(canOpenUrlMock).not.toHaveBeenCalled();
    expect(openUrlMock).toHaveBeenCalledOnce();
    expect((openUrlMock.mock.calls[0][0].url as string)).toMatch(/^https:\/\/wa\.me\//);
    expect(webOpen).not.toHaveBeenCalled();
  });

  it('handles a native handoff exception without claiming a sent reminder', async () => {
    openUrlMock.mockRejectedValue(new Error('Unsupported scheme'));
    expect(await openSessionReminderWhatsApp('+91 98765 43210', 'Reminder')).toBe('launch-failed');
  });

  it('rejects invalid reminders before any app launch', async () => {
    expect(await openSessionReminderWhatsApp('123', 'Reminder')).toBe('invalid-phone');
    expect(await openSessionReminderWhatsApp('+91 98765 43210', ' ')).toBe('invalid-message');
    expect(canOpenUrlMock).not.toHaveBeenCalled();
  });

  it('opens official wa.me recipient-prefilled link on explicit Notify or fallback actions', async () => {
    const message = 'Hello, class today at 5 PM 😊 & please join';
    expect(await openIOSWhatsAppChatLink('+1 (437) 830-1543', message)).toBe('opened');
    const url = openUrlMock.mock.calls[0][0].url as string;
    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://wa.me');
    expect(parsed.pathname).toBe('/14378301543');
    expect(parsed.searchParams.get('text')).toBe(message);
    expect(shareMock).not.toHaveBeenCalled();
    expect(canOpenUrlMock).not.toHaveBeenCalled();
  });

  it('does not imply a Business-only launch or successful delivery from URL acceptance', async () => {
    openUrlMock.mockResolvedValue({ completed: false });
    expect(await openIOSWhatsAppChatLink('+1 (437) 830-1543', 'Reminder')).toBe('launch-failed');
    openUrlMock.mockRejectedValue(new Error('Unable to handle link'));
    expect(await openIOSWhatsAppChatLink('+1 (437) 830-1543', 'Reminder')).toBe('launch-failed');
  });

  it('validates recipient and text before opening any official link', async () => {
    expect(await openIOSWhatsAppChatLink('123', 'Reminder')).toBe('invalid-phone');
    expect(await openIOSWhatsAppChatLink('+91 98765 43210', ' ')).toBe('invalid-message');
    expect(openUrlMock).not.toHaveBeenCalled();
    isNativePlatformMock.mockReturnValue(false);
    expect(await openIOSWhatsAppChatLink('+91 98765 43210', 'Reminder')).toBe('launch-failed');
  });

  it('presents iOS chooser with reminder text and does not pre-select personal WhatsApp', async () => {
    const message = 'Parent reminder: tomorrow 7pm';
    expect(await openIOSReminderShareSheet(message)).toBe(true);
    expect(shareMock).toHaveBeenCalledWith({
      title: 'Tiny Steps class reminder',
      text: message,
    });
    expect(openUrlMock).not.toHaveBeenCalled();
  });

  it('does not treat cancelled or empty iOS shares as sent', async () => {
    shareMock.mockRejectedValue(new Error('User cancelled'));
    expect(await openIOSReminderShareSheet('Reminder')).toBe(false);
    expect(await openIOSReminderShareSheet(' ')).toBe(false);
    expect(shareMock).toHaveBeenCalledOnce();
  });

  it('preserves existing browser wa.me links', async () => {
    isNativePlatformMock.mockReturnValue(false);
    const webOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    expect(await openSessionReminderWhatsApp('+91 98765 43210', 'Hello & thanks')).toBe('opened');
    const link = new URL(webOpen.mock.calls[0][0] as string);
    expect(link.origin).toBe('https://wa.me');
    expect(link.searchParams.get('text')).toBe('Hello & thanks');
    expect(canOpenUrlMock).not.toHaveBeenCalled();
  });
});
