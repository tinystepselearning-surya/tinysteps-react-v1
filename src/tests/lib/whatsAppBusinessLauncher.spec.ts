import { beforeEach, describe, expect, it, vi } from 'vitest';

const { canOpenUrlMock, openUrlMock, isNativePlatformMock, getPlatformMock } = vi.hoisted(() => ({
  canOpenUrlMock: vi.fn(),
  openUrlMock: vi.fn(),
  isNativePlatformMock: vi.fn(),
  getPlatformMock: vi.fn(),
}));
vi.mock('@capacitor/app-launcher', () => ({
  AppLauncher: { canOpenUrl: canOpenUrlMock, openUrl: openUrlMock },
}));
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: isNativePlatformMock, getPlatform: getPlatformMock },
}));
import { openSessionReminderWhatsApp } from '../../lib/whatsAppBusinessLauncher';

describe('Sessions Management WhatsApp Business handoff', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    isNativePlatformMock.mockReturnValue(true);
    getPlatformMock.mockReturnValue('ios');
    canOpenUrlMock.mockResolvedValue({ value: true });
    openUrlMock.mockResolvedValue({ completed: true });
  });

  it('uses the Business-specific scheme with full international number and encoded text', async () => {
    const message = 'Hello Anaya!\nClass at 6:30 PM 😊 & Teams';
    expect(await openSessionReminderWhatsApp('+91 98765 43210', message)).toBe('opened');
    expect(canOpenUrlMock).toHaveBeenCalledOnce();
    const url = openUrlMock.mock.calls[0][0].url as string;
    expect(url).toMatch(/^whatsapp-business:\/\/send\?/);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('phone')).toBe('919876543210');
    expect(parsed.searchParams.get('text')).toBe(message);
  });

  it('never switches to personal WhatsApp when Business is missing', async () => {
    canOpenUrlMock.mockResolvedValue({ value: false });
    const webOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    expect(await openSessionReminderWhatsApp('+91 98765 43210', 'Reminder')).toBe('business-unavailable');
    expect(openUrlMock).not.toHaveBeenCalled();
    expect(webOpen).not.toHaveBeenCalled();
  });

  it('handles a failed native handoff without claiming a sent reminder', async () => {
    openUrlMock.mockResolvedValue({ completed: false });
    expect(await openSessionReminderWhatsApp('+91 98765 43210', 'Reminder')).toBe('launch-failed');
  });

  it('rejects invalid reminders before any app launch', async () => {
    expect(await openSessionReminderWhatsApp('123', 'Reminder')).toBe('invalid-phone');
    expect(await openSessionReminderWhatsApp('+91 98765 43210', ' ')).toBe('invalid-message');
    expect(canOpenUrlMock).not.toHaveBeenCalled();
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
