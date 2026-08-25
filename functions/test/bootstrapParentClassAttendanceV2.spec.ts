import { describe, expect, it } from 'vitest';

import {
  ATTENDANCE_REPAIR_RETRY_COOLDOWN_MS,
  ATTENDANCE_REPAIR_VERSION,
  currentIndiaAttendanceMonthKey,
  normalizeAttendanceBootstrapSessionKidIdentity,
  shouldClaimAttendanceRepairLock,
  shouldUseAttendanceCompatibilityRepair,
} from '../src/bootstrapParentClassAttendanceV2';
import {
  buildParentMonthClassAttendanceProjection,
  classAttendanceProjectionInvariantErrors,
} from '../src/parentMonthlyAttendanceProjection';

describe('parent class attendance bootstrap V2', () => {
  it('uses the India calendar month at the UTC month boundary', () => {
    expect(currentIndiaAttendanceMonthKey(Date.parse('2026-08-31T17:00:00Z'))).toBe('2026-08');
    expect(currentIndiaAttendanceMonthKey(Date.parse('2026-08-31T20:00:00Z'))).toBe('2026-09');
  });

  it('runs capped compatibility when the bounded query is empty or misses the requested child', () => {
    expect(shouldUseAttendanceCompatibilityRepair({ boundedSessionCount: 0 })).toBe(true);
    expect(shouldUseAttendanceCompatibilityRepair({ boundedSessionCount: 3 })).toBe(false);
    expect(shouldUseAttendanceCompatibilityRepair({ boundedSessionCount: 3, missingIndex: true })).toBe(true);
    expect(
      shouldUseAttendanceCompatibilityRepair({
        boundedSessionCount: 3,
        requestedChildRowPresent: false,
      }),
    ).toBe(true);
    expect(
      shouldUseAttendanceCompatibilityRepair({
        boundedSessionCount: 3,
        requestedChildRowPresent: true,
      }),
    ).toBe(false);
  });

  it('leaves an already-canonical selected-child session unchanged', () => {
    const source = {
      kidId: 'kid-1',
      kidIds: ['kid-1'],
      status: 'scheduled',
      date: '2026-08-25',
      startTime: '12:30',
    };
    const result = normalizeAttendanceBootstrapSessionKidIdentity(
      source,
      'kid-1',
      new Set(['kid-1']),
    );

    expect(result.migrated).toBe(false);
    expect(result.session).toBe(source);
  });

  it('maps a verified legacy student alias to canonical kidId without mutating source', () => {
    const source = {
      studentId: 'legacy-student-1',
      status: 'completed',
      startAt: new Date('2026-08-25T07:00:00Z'),
      attendance: {
        'legacy-student-1': { status: 'present' },
      },
    };
    const result = normalizeAttendanceBootstrapSessionKidIdentity(
      source,
      'kid-1',
      new Set(['kid-1', 'legacy-student-1']),
    );

    expect(result.migrated).toBe(true);
    expect(result.session.kidId).toBe('kid-1');
    expect(result.session.kidIds).toEqual(['kid-1']);
    expect((result.session.attendance as Record<string, unknown>)['kid-1']).toEqual({ status: 'present' });
    expect(source).not.toHaveProperty('kidId');
  });

  it('maps a verified canonical alias id but does not steal an unrelated sibling session', () => {
    const aliasResult = normalizeAttendanceBootstrapSessionKidIdentity(
      { kidId: 'student-doc-id', kidIds: ['student-doc-id'], status: 'scheduled' },
      'kid-1',
      new Set(['kid-1', 'student-doc-id']),
    );
    expect(aliasResult.migrated).toBe(true);
    expect(aliasResult.session.kidIds).toEqual(['kid-1']);

    const sibling = { kidId: 'kid-2', kidIds: ['kid-2'], status: 'scheduled' };
    const siblingResult = normalizeAttendanceBootstrapSessionKidIdentity(
      sibling,
      'kid-1',
      new Set(['kid-1', 'student-doc-id']),
    );
    expect(siblingResult.migrated).toBe(false);
    expect(siblingResult.session).toBe(sibling);
  });

  it('keeps P4 lifecycle and attendance invariants after legacy identity migration', () => {
    const canonicalKidId = 'kid-1';
    const aliases = new Set([canonicalKidId, 'legacy-student-1']);
    const rawSessions = [
      {
        studentId: 'legacy-student-1',
        status: 'completed',
        startAt: new Date('2026-08-20T07:00:00Z'),
        attendance: { 'legacy-student-1': { status: 'present' } },
      },
      {
        kidId: canonicalKidId,
        kidIds: [canonicalKidId],
        status: 'scheduled',
        startAt: new Date('2026-08-26T07:00:00Z'),
      },
    ].map((session) =>
      normalizeAttendanceBootstrapSessionKidIdentity(session, canonicalKidId, aliases).session,
    );

    const projection = buildParentMonthClassAttendanceProjection(
      rawSessions,
      '2026-08',
      Date.parse('2026-08-25T12:00:00Z'),
    );

    expect(classAttendanceProjectionInvariantErrors(projection)).toEqual([]);
    expect(projection.byKid[canonicalKidId]?.totalSessions).toBe(2);
    expect(projection.byKid[canonicalKidId]?.completedSessions).toBe(1);
    expect(projection.byKid[canonicalKidId]?.presentSessions).toBe(1);
  });

  it('makes successful repairs terminal but permits failed repairs after cooldown', () => {
    const now = Date.parse('2026-08-25T17:00:00Z');

    expect(shouldClaimAttendanceRepairLock({}, now)).toBe(true);
    expect(
      shouldClaimAttendanceRepairLock(
        { repairVersion: ATTENDANCE_REPAIR_VERSION, status: 'completed', lastAttemptAtMs: now - 999999 },
        now,
      ),
    ).toBe(false);
    expect(
      shouldClaimAttendanceRepairLock(
        { repairVersion: ATTENDANCE_REPAIR_VERSION, status: 'processing', startedAtMs: now - 60_000 },
        now,
      ),
    ).toBe(false);
    expect(
      shouldClaimAttendanceRepairLock(
        { repairVersion: ATTENDANCE_REPAIR_VERSION, status: 'failed', lastAttemptAtMs: now - 60_000 },
        now,
      ),
    ).toBe(false);
    expect(
      shouldClaimAttendanceRepairLock(
        {
          repairVersion: ATTENDANCE_REPAIR_VERSION,
          status: 'failed',
          lastAttemptAtMs: now - ATTENDANCE_REPAIR_RETRY_COOLDOWN_MS - 1,
        },
        now,
      ),
    ).toBe(true);
  });
});
