import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearPendingNativeDeepLink,
  getPendingNativeDeepLink,
  parseNativeDeepLink,
  queuePendingNativeDeepLink,
} from '../../lib/nativeDeepLinks';

describe('native Android deep links', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('accepts only supported production and app-scheme destinations', () => {
    expect(
      parseNativeDeepLink(
        'https://tinystepslearning.com/parent?tab=classes&kidId=kid_1',
      ),
    ).toBe('/parent?tab=classes&kidId=kid_1');
    expect(
      parseNativeDeepLink(
        'com.tinystepslearning.app://open/messages/thread-1',
      ),
    ).toBe('/messages/thread-1');
  });

  it('rejects foreign origins, unsafe IDs and unsupported parent tabs', () => {
    expect(
      parseNativeDeepLink('https://example.com/parent?tab=classes'),
    ).toBeNull();
    expect(
      parseNativeDeepLink('https://tinystepslearning.com/messages/%2Fadmin'),
    ).toBeNull();
    expect(
      parseNativeDeepLink('https://tinystepslearning.com/parent?tab=admin'),
    ).toBeNull();
  });

  it('normalizes role-safe class and learning-partner destinations', () => {
    expect(
      parseNativeDeepLink(
        'https://tinystepslearning.com/teacher?tab=today',
      ),
    ).toBe('/teacher?tab=today');
    expect(
      parseNativeDeepLink(
        'com.tinystepslearning.app://open/learning-partner/dashboard',
      ),
    ).toBe('/learning-partner/dashboard');
  });

  it('persists a pending destination through process recreation', () => {
    queuePendingNativeDeepLink('/parent?tab=insights');
    expect(getPendingNativeDeepLink()).toBe('/parent?tab=insights');
    clearPendingNativeDeepLink();
    expect(getPendingNativeDeepLink()).toBeNull();
  });

  it('expires stale pending destinations', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-26T12:00:00Z'));
    queuePendingNativeDeepLink('/parent?tab=classes');
    vi.setSystemTime(new Date('2026-07-26T12:11:00Z'));
    expect(getPendingNativeDeepLink()).toBeNull();
  });
});
