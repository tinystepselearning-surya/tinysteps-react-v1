import {describe, expect, it, vi} from 'vitest';
import {
  LEGACY_14_DAY_SESSION_WRITES_RETIRED,
  assertLegacy14DayWritesNotRetired,
} from '../src/scheduling/legacy14DayCutover';
import {materializeRollingEnrollmentWindowInternal} from '../src/scheduling/rollingScheduleMaterializer';

describe('October 12 retirement of legacy future-session writers', () => {
  it('has a permanent source-level hard stop with no environment override', () => {
    expect(LEGACY_14_DAY_SESSION_WRITES_RETIRED).toBe(true);
    expect(() => assertLegacy14DayWritesNotRetired()).toThrow('Legacy 14-day session generation is retired');
  });

  it('cannot run the shared rolling writer or access Firestore for old 14-day sessions', async () => {
    const db = {
      collection: vi.fn(() => {
        throw new Error('Firestore must not be accessed by the retired materializer');
      }),
    } as any;
    await expect(materializeRollingEnrollmentWindowInternal(db, {
      enrollmentId: 'enrollment-a',
      anchorYmd: '2026-10-12',
      actorId: 'admin',
    })).rejects.toThrow('Legacy 14-day session generation is retired');
    expect(db.collection).not.toHaveBeenCalled();
  });
});
