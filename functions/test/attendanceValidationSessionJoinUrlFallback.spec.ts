import { describe, expect, it, vi } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';
import {
  resolveAvsSessionJoinUrl,
  type AvsEnrollmentJoinUrlCache,
} from '../src/attendanceValidation/sessionJoinUrlFallback';

function fakeDb(enrollmentData: Record<string, unknown> | null) {
  const get = vi.fn().mockResolvedValue({
    exists: enrollmentData !== null,
    data: () => enrollmentData ?? undefined,
  });
  const doc = vi.fn(() => ({ get }));
  const collection = vi.fn(() => ({ doc }));
  return {
    db: { collection } as unknown as Firestore,
    get,
    doc,
    collection,
  };
}

describe('AVS enrollment Teams URL fallback', () => {
  it('uses the session URL without any enrollment read', async () => {
    const fake = fakeDb({
      joinUrl: 'https://teams.example/enrollment',
    });

    const result = await resolveAvsSessionJoinUrl(fake.db, {
      enrollmentId: 'enrollment-1',
      joinUrl: 'https://teams.example/session',
    });

    expect(result.source).toBe('session');
    expect(result.joinUrl).toBe('https://teams.example/session');
    expect(result.enrollmentFallbackReadCount).toBe(0);
    expect(fake.collection).not.toHaveBeenCalled();
  });

  it('falls back to the exact linked enrollment when the historical session URL is missing', async () => {
    const fake = fakeDb({
      joinUrl: 'https://teams.example/enrollment',
    });

    const result = await resolveAvsSessionJoinUrl(fake.db, {
      enrollmentId: 'enrollment-1',
      date: '2026-09-21',
    });

    expect(result.source).toBe('enrollment');
    expect(result.joinUrl).toBe('https://teams.example/enrollment');
    expect(result.session.joinUrl).toBe('https://teams.example/enrollment');
    expect(result.enrollmentFallbackReadCount).toBe(1);
    expect(fake.collection).toHaveBeenCalledWith('enrollments');
    expect(fake.doc).toHaveBeenCalledWith('enrollment-1');
    expect(fake.get).toHaveBeenCalledTimes(1);
  });

  it('accepts legacy enrollment meetingLink/classLink aliases', async () => {
    const fake = fakeDb({
      meetingLink: 'https://teams.example/legacy',
    });

    const result = await resolveAvsSessionJoinUrl(fake.db, {
      enrollmentId: 'enrollment-legacy',
    });

    expect(result.source).toBe('enrollment');
    expect(result.joinUrl).toBe('https://teams.example/legacy');
    expect(result.session.joinUrl).toBe('https://teams.example/legacy');
  });

  it('caches one enrollment point-read across multiple missing-link sessions', async () => {
    const fake = fakeDb({
      joinUrl: 'https://teams.example/reused',
    });
    const cache: AvsEnrollmentJoinUrlCache = new Map();

    const first = await resolveAvsSessionJoinUrl(
      fake.db,
      { enrollmentId: 'enrollment-1', date: '2026-09-13' },
      cache,
    );
    const second = await resolveAvsSessionJoinUrl(
      fake.db,
      { enrollmentId: 'enrollment-1', date: '2026-09-21' },
      cache,
    );

    expect(first.enrollmentFallbackReadCount).toBe(1);
    expect(second.enrollmentFallbackReadCount).toBe(0);
    expect(second.source).toBe('enrollment');
    expect(fake.get).toHaveBeenCalledTimes(1);
  });

  it('preserves missing-reference behavior when neither session nor enrollment has a URL', async () => {
    const fake = fakeDb({});

    const result = await resolveAvsSessionJoinUrl(fake.db, {
      enrollmentId: 'enrollment-1',
    });

    expect(result.source).toBe('missing');
    expect(result.joinUrl).toBeNull();
    expect(result.enrollmentFallbackReadCount).toBe(1);
    expect(result.session.joinUrl).toBeUndefined();
  });

  it('does not query enrollments when the session has no enrollmentId', async () => {
    const fake = fakeDb({
      joinUrl: 'https://teams.example/enrollment',
    });

    const result = await resolveAvsSessionJoinUrl(fake.db, {
      date: '2026-09-21',
    });

    expect(result.source).toBe('missing');
    expect(result.enrollmentFallbackReadCount).toBe(0);
    expect(fake.collection).not.toHaveBeenCalled();
  });
});
