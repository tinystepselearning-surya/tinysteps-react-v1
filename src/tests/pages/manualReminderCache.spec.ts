import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MANUAL_REMINDER_CACHE_SCHEMA_VERSION,
  MANUAL_REMINDER_CACHE_SCHEMA_VERSION_KEY,
  buildManualReminderCacheKey,
  isQuotaExceededError,
  migrateManualReminderCache,
  readManualReminderCache,
  removeExpiredManualReminderCaches,
  writeManualReminderCache,
} from '../../pages/admin/manualReminderCache';

describe('manual reminder cache', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('migrates legacy oversized entries without touching unrelated or auth keys', () => {
    localStorage.setItem(buildManualReminderCacheKey('2026-08-03'), JSON.stringify({ todaySessions: [{ large: true }] }));
    localStorage.setItem(buildManualReminderCacheKey('2026-08-04'), JSON.stringify({ tomorrowSessions: [{ large: true }] }));
    localStorage.setItem('ts_active_kid_v1', 'kid-1');
    localStorage.setItem('firebase:authUser:test:[DEFAULT]', 'auth-value');

    expect(migrateManualReminderCache()).toBe(true);

    expect(localStorage.getItem(buildManualReminderCacheKey('2026-08-03'))).toBeNull();
    expect(localStorage.getItem(buildManualReminderCacheKey('2026-08-04'))).toBeNull();
    expect(localStorage.getItem('ts_active_kid_v1')).toBe('kid-1');
    expect(localStorage.getItem('firebase:authUser:test:[DEFAULT]')).toBe('auth-value');
    expect(localStorage.getItem(MANUAL_REMINDER_CACHE_SCHEMA_VERSION_KEY)).toBe(
      MANUAL_REMINDER_CACHE_SCHEMA_VERSION,
    );
  });

  it('keeps at most three valid dated cache entries', () => {
    localStorage.setItem(MANUAL_REMINDER_CACHE_SCHEMA_VERSION_KEY, MANUAL_REMINDER_CACHE_SCHEMA_VERSION);
    ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05'].forEach((dateKey) => {
      localStorage.setItem(buildManualReminderCacheKey(dateKey), '{}');
    });
    localStorage.setItem('ts_manual_class_reminders_cache_not-a-date', 'leave malformed suffix alone');

    expect(removeExpiredManualReminderCaches()).toBe(true);

    const retained = Object.keys(localStorage)
      .filter((key) => /^ts_manual_class_reminders_cache_\d{4}-\d{2}-\d{2}$/.test(key))
      .sort();
    expect(retained).toEqual([
      buildManualReminderCacheKey('2026-08-03'),
      buildManualReminderCacheKey('2026-08-04'),
      buildManualReminderCacheKey('2026-08-05'),
    ]);
  });

  it('removes malformed JSON and returns a safe cache miss', () => {
    localStorage.setItem(MANUAL_REMINDER_CACHE_SCHEMA_VERSION_KEY, MANUAL_REMINDER_CACHE_SCHEMA_VERSION);
    const key = buildManualReminderCacheKey('2026-08-05');
    localStorage.setItem(key, '{not-json');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(readManualReminderCache('2026-08-05')).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('continues safely when localStorage is blocked', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });

    expect(readManualReminderCache('2026-08-05')).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('prunes only dated reminder keys and retries a quota-limited compact write once', () => {
    localStorage.setItem(MANUAL_REMINDER_CACHE_SCHEMA_VERSION_KEY, MANUAL_REMINDER_CACHE_SCHEMA_VERSION);
    localStorage.setItem(buildManualReminderCacheKey('2026-08-03'), '{}');
    localStorage.setItem(buildManualReminderCacheKey('2026-08-04'), '{}');
    localStorage.setItem('ts_active_kid_v1', 'kid-1');
    const originalSetItem = Storage.prototype.setItem;
    let datedWriteAttempts = 0;
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === buildManualReminderCacheKey('2026-08-05')) {
        datedWriteAttempts += 1;
        if (datedWriteAttempts === 1) throw new DOMException('Quota exceeded', 'QuotaExceededError');
      }
      originalSetItem.call(this, key, value);
    });

    expect(writeManualReminderCache('2026-08-05', { session: { notifiedAt: 123 } })).toBe(true);
    expect(datedWriteAttempts).toBe(2);
    expect(localStorage.getItem(buildManualReminderCacheKey('2026-08-03'))).toBeNull();
    expect(localStorage.getItem(buildManualReminderCacheKey('2026-08-04'))).toBeNull();
    expect(localStorage.getItem('ts_active_kid_v1')).toBe('kid-1');
    expect(readManualReminderCache('2026-08-05')).toEqual({ session: { notifiedAt: 123 } });
  });

  it('ignores a repeated quota failure after exactly one retry', () => {
    localStorage.setItem(MANUAL_REMINDER_CACHE_SCHEMA_VERSION_KEY, MANUAL_REMINDER_CACHE_SCHEMA_VERSION);
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Object.assign(new Error('full'), { code: 22 });
    });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(writeManualReminderCache('2026-08-05', {})).toBe(false);
    expect(setItem).toHaveBeenCalledTimes(2);
  });

  it('recognizes quota errors used by Safari, Chromium, Edge, and Firefox', () => {
    expect(isQuotaExceededError({ name: 'QuotaExceededError' })).toBe(true);
    expect(isQuotaExceededError({ name: 'NS_ERROR_DOM_QUOTA_REACHED' })).toBe(true);
    expect(isQuotaExceededError({ code: 22 })).toBe(true);
    expect(isQuotaExceededError({ code: 1014 })).toBe(true);
    expect(isQuotaExceededError({ name: 'SecurityError' })).toBe(false);
  });
});
