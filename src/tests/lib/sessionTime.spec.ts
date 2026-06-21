import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatIndiaTimeRange,
  formatSessionDate,
  formatSessionDateTimeRange,
  formatSessionTimeRange,
  getViewerTimeZone,
  isSessionTimeFallback,
  resolveSessionTimeRange,
} from '../../lib/sessionTime';

const makeTimestamp = (iso: string) => ({
  toDate: () => new Date(iso),
  toMillis: () => new Date(iso).getTime(),
});

const timestampSession = {
  startAt: makeTimestamp('2026-06-22T02:45:00.000Z'),
  endAt: makeTimestamp('2026-06-22T03:20:00.000Z'),
};

describe('sessionTime', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the viewer timezone from Intl', () => {
    const realDateTimeFormat = Intl.DateTimeFormat;

    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(((...args: ConstructorParameters<typeof Intl.DateTimeFormat>) => {
      if (args.length === 0) {
        return {
          resolvedOptions: () => ({ timeZone: 'Europe/London' }),
        } as Intl.DateTimeFormat;
      }

      return new realDateTimeFormat(...args);
    }) as typeof Intl.DateTimeFormat);

    expect(getViewerTimeZone()).toBe('Europe/London');
  });

  it('formats a timestamp session for an Asia/Kolkata viewer', () => {
    expect(formatSessionDate(timestampSession, { timeZone: 'Asia/Kolkata' })).toBe('Mon 22 Jun');
    expect(formatSessionTimeRange(timestampSession, { timeZone: 'Asia/Kolkata' })).toBe('08:15 - 08:50');
    expect(formatSessionDateTimeRange(timestampSession, { timeZone: 'Asia/Kolkata' })).toBe('Mon 22 Jun · 08:15 - 08:50');
    expect(formatIndiaTimeRange(timestampSession)).toBe('08:15 - 08:50 IST');
  });

  it('formats a timestamp session for an America/New_York viewer on the previous day', () => {
    expect(formatSessionDate(timestampSession, { timeZone: 'America/New_York' })).toBe('Sun 21 Jun');
    expect(formatSessionTimeRange(timestampSession, { timeZone: 'America/New_York' })).toBe('22:45 - 23:20');
  });

  it('formats a timestamp session for a Europe/London viewer', () => {
    expect(formatSessionDate(timestampSession, { timeZone: 'Europe/London' })).toBe('Mon 22 Jun');
    expect(formatSessionTimeRange(timestampSession, { timeZone: 'Europe/London' })).toBe('03:45 - 04:20');
  });

  it('formats a timestamp session for an Australia/Sydney viewer', () => {
    expect(formatSessionDate(timestampSession, { timeZone: 'Australia/Sydney' })).toBe('Mon 22 Jun');
    expect(formatSessionTimeRange(timestampSession, { timeZone: 'Australia/Sydney' })).toBe('12:45 - 13:20');
  });

  it('falls back to India schedule fields without UTC date parsing bugs', () => {
    const legacySession = {
      date: '2026-06-22',
      startTime: '08:15',
      endTime: '08:50',
    };

    expect(isSessionTimeFallback(legacySession)).toBe(true);
    expect(resolveSessionTimeRange(legacySession).source).toBe('legacy_fields');
    expect(formatSessionDate(legacySession, { timeZone: 'America/New_York' })).toBe('Sun 21 Jun');
    expect(formatSessionTimeRange(legacySession, { timeZone: 'America/New_York' })).toBe('22:45 - 23:20');
    expect(formatIndiaTimeRange(legacySession)).toBe('08:15 - 08:50 IST');
  });

  it('uses scheduled timestamps when startAt/endAt are absent', () => {
    const scheduledSession = {
      scheduledStartAt: makeTimestamp('2026-06-22T02:45:00.000Z'),
      scheduledEndAt: makeTimestamp('2026-06-22T03:20:00.000Z'),
    };

    expect(resolveSessionTimeRange(scheduledSession).source).toBe('scheduled_timestamp');
    expect(formatSessionTimeRange(scheduledSession, { timeZone: 'Asia/Kolkata' })).toBe('08:15 - 08:50');
  });

  it('parses serialized Firestore timestamp-like objects with _seconds fields', () => {
    const serializedSession = {
      startAt: { _seconds: 1782096300, _nanoseconds: 0 },
      endAt: { _seconds: 1782098400, _nanoseconds: 0 },
    };

    expect(resolveSessionTimeRange(serializedSession).source).toBe('timestamp');
    expect(formatSessionDate(serializedSession, { timeZone: 'America/New_York' })).toBe('Sun 21 Jun');
    expect(formatSessionTimeRange(serializedSession, { timeZone: 'Asia/Kolkata' })).toBe('08:15 - 08:50');
  });
});
