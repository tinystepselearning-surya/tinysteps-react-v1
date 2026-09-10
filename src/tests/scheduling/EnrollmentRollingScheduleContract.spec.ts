import { describe, expect, it } from 'vitest';
import {
  ROLLING_SCHEDULE_CONTRACT_VERSION,
  ROLLING_SCHEDULE_DELIVERY_MODE,
  ROLLING_SCHEDULE_HORIZON_DAYS,
  ROLLING_SCHEDULE_MATERIALIZATION_VERSION,
  buildCanonicalRollingEnrollmentSchedule,
  buildInitialRollingScheduleMaterializationState,
  normalizeRollingScheduleMaterializationState,
  resolveEnrollmentClassesStartDateYmd,
  resolveEnrollmentRollingScheduleContract,
  resolveRollingScheduleLifecycleState,
  toRollingScheduleConfigInput,
} from '../../lib/scheduling/enrollmentRollingScheduleContract';

describe('enrollment rolling schedule contract', () => {
  it('freezes the permanent rolling contract constants', () => {
    expect(ROLLING_SCHEDULE_CONTRACT_VERSION).toBe(1);
    expect(ROLLING_SCHEDULE_MATERIALIZATION_VERSION).toBe(1);
    expect(ROLLING_SCHEDULE_DELIVERY_MODE).toBe('rolling');
    expect(ROLLING_SCHEDULE_HORIZON_DAYS).toBe(14);
  });

  it('builds a canonical persisted schedule from existing weeklySlots', () => {
    expect(buildCanonicalRollingEnrollmentSchedule({
      timezone: 'Asia/Kolkata',
      revision: 3,
      weeklySlots: [
        { weekday: 6, time: '04:00', durationMinutes: 35 },
        { weekday: 2, time: '04:00', durationMinutes: 35 },
        { weekday: 4, time: '04:00', durationMinutes: 35 },
      ],
      weeksAhead: 20,
      plannedSessions: 60,
      endDateYmd: '2027-01-01',
    })).toEqual({
      schemaVersion: 1,
      deliveryMode: 'rolling',
      timezone: 'Asia/Kolkata',
      revision: 3,
      weeklySlots: [
        { weekday: 2, time: '04:00', durationMinutes: 35 },
        { weekday: 4, time: '04:00', durationMinutes: 35 },
        { weekday: 6, time: '04:00', durationMinutes: 35 },
      ],
    });
  });

  it('converts legacy weekdays/timeHHmm/durationMins without preserving finite stop fields', () => {
    expect(buildCanonicalRollingEnrollmentSchedule({
      weekdays: [6, 2, 4, 2],
      timeHHmm: '18:30',
      durationMins: 40,
      weeksAhead: 4,
      plannedSessions: 12,
      endDateYmd: '2026-10-01',
    })).toEqual({
      schemaVersion: 1,
      deliveryMode: 'rolling',
      timezone: 'Asia/Kolkata',
      revision: 1,
      weeklySlots: [
        { weekday: 2, time: '18:30', durationMinutes: 40 },
        { weekday: 4, time: '18:30', durationMinutes: 40 },
        { weekday: 6, time: '18:30', durationMinutes: 40 },
      ],
    });
  });

  it('marks existing finite fields for migration audit while ignoring them as recurrence truth', () => {
    const resolved = resolveEnrollmentRollingScheduleContract({
      status: 'active',
      classesStartDateYmd: '2026-09-10',
      schedule: {
        timezone: 'Asia/Kolkata',
        weeklySlots: [{ weekday: 4, time: '17:00', durationMinutes: 35 }],
        weeksAhead: 20,
        plannedSessions: 60,
        endDateYmd: '2027-02-01',
      },
    });

    expect(resolved.source).toBe('legacy_compatible');
    expect(resolved.legacyFiniteFieldsPresent).toEqual({
      weeksAhead: true,
      plannedSessions: true,
      endDateYmd: true,
    });
    expect(resolved.schedule).not.toHaveProperty('weeksAhead');
    expect(resolved.schedule).not.toHaveProperty('plannedSessions');
    expect(resolved.schedule).not.toHaveProperty('endDateYmd');
  });

  it('recognizes the explicit canonical rolling shape', () => {
    const resolved = resolveEnrollmentRollingScheduleContract({
      status: 'active',
      schedule: {
        schemaVersion: 1,
        deliveryMode: 'rolling',
        timezone: 'Asia/Kolkata',
        revision: 2,
        weeklySlots: [{ weekday: 1, time: '17:00', durationMinutes: 35 }],
      },
    });

    expect(resolved.source).toBe('canonical_rolling');
    expect(resolved.schedule?.revision).toBe(2);
    expect(resolved.canMaterializeAutomatically).toBe(true);
  });

  it('uses enrollment lifecycle status as the only automatic-materialization switch', () => {
    const schedule = {
      schemaVersion: 1,
      deliveryMode: 'rolling',
      weeklySlots: [{ weekday: 1, time: '17:00', durationMinutes: 35 }],
    };

    expect(resolveEnrollmentRollingScheduleContract({ status: 'active', isActive: false, schedule }).canMaterializeAutomatically)
      .toBe(true);
    expect(resolveEnrollmentRollingScheduleContract({ status: 'paused', isActive: true, schedule }).canMaterializeAutomatically)
      .toBe(false);
    expect(resolveEnrollmentRollingScheduleContract({ status: 'discontinued', isActive: true, schedule }).canMaterializeAutomatically)
      .toBe(false);
  });

  it('normalizes existing active-like, paused, terminal, and unknown lifecycle statuses', () => {
    ['active', 'trial', 'enrolled', 'current', 'ongoing', 'pending_teacher', 'pending_payment', 'pending_lp', '']
      .forEach((status) => expect(resolveRollingScheduleLifecycleState({ status })).toBe('active'));
    expect(resolveRollingScheduleLifecycleState({ status: 'paused' })).toBe('paused');
    ['completed', 'discontinued', 'expired', 'cancelled', 'canceled', 'archived', 'inactive']
      .forEach((status) => expect(resolveRollingScheduleLifecycleState({ status })).toBe('terminal'));
    expect(resolveRollingScheduleLifecycleState({ status: 'something-new' })).toBe('inactive');
  });

  it('treats archived markers as terminal regardless of a stale active status', () => {
    expect(resolveRollingScheduleLifecycleState({ status: 'active', archived: true })).toBe('terminal');
    expect(resolveRollingScheduleLifecycleState({ status: 'active', isArchived: true })).toBe('terminal');
    expect(resolveRollingScheduleLifecycleState({ status: 'active', archivedAt: { seconds: 123 } })).toBe('terminal');
  });

  it('resolves classes start date using current field precedence and accepts Timestamp-like values', () => {
    expect(resolveEnrollmentClassesStartDateYmd({
      classesStartDateYmd: '2026-09-10',
      classesStartDate: new Date('2026-09-15T00:00:00Z'),
      startDateYmd: '2026-09-20',
    })).toBe('2026-09-10');

    expect(resolveEnrollmentClassesStartDateYmd({
      classesStartDate: { seconds: Math.floor(Date.parse('2026-09-09T18:30:00Z') / 1000) },
    })).toBe('2026-09-10');
  });

  it('returns unconfigured when the enrollment has no valid recurring slots', () => {
    const resolved = resolveEnrollmentRollingScheduleContract({
      status: 'active',
      schedule: {},
    });
    expect(resolved.source).toBe('unconfigured');
    expect(resolved.schedule).toBeNull();
    expect(resolved.canMaterializeAutomatically).toBe(false);
  });

  it('keeps the materialization state separate from recurrence truth and pins horizon to 14 days', () => {
    const initial = buildInitialRollingScheduleMaterializationState(5);
    expect(initial).toEqual({
      schemaVersion: 1,
      horizonDays: 14,
      scheduleRevision: 5,
      materializedThroughYmd: null,
      nextOccurrenceYmd: null,
      nextMaterializationDueYmd: null,
    });

    expect(normalizeRollingScheduleMaterializationState({
      schemaVersion: 99,
      horizonDays: 30,
      scheduleRevision: 5,
      materializedThroughYmd: '2026-09-24',
      nextOccurrenceYmd: '2026-09-26',
      nextMaterializationDueYmd: '2026-09-12',
    }, 5)).toEqual({
      schemaVersion: 1,
      horizonDays: 14,
      scheduleRevision: 5,
      materializedThroughYmd: '2026-09-24',
      nextOccurrenceYmd: '2026-09-26',
      nextMaterializationDueYmd: '2026-09-12',
    });
  });

  it('drops malformed materialization dates rather than widening or guessing', () => {
    expect(normalizeRollingScheduleMaterializationState({
      horizonDays: 21,
      materializedThroughYmd: '2026-02-30',
      nextOccurrenceYmd: 'not-a-date',
      nextMaterializationDueYmd: '2026-09-12',
    })).toEqual({
      schemaVersion: 1,
      horizonDays: 14,
      scheduleRevision: 1,
      materializedThroughYmd: null,
      nextOccurrenceYmd: null,
      nextMaterializationDueYmd: '2026-09-12',
    });
  });

  it('converts the canonical enrollment schedule back into recurrence-engine input without finite controls', () => {
    const schedule = buildCanonicalRollingEnrollmentSchedule({
      weeklySlots: [{ weekday: 2, time: '04:00', durationMinutes: 35 }],
      plannedSessions: 1,
      weeksAhead: 1,
    });
    expect(schedule).not.toBeNull();
    expect(toRollingScheduleConfigInput(schedule!)).toEqual({
      timezone: 'Asia/Kolkata',
      weeklySlots: [{ weekday: 2, time: '04:00', durationMinutes: 35 }],
    });
  });

  it('rejects unsupported schedule timezones instead of silently changing class time', () => {
    expect(() => buildCanonicalRollingEnrollmentSchedule({
      timezone: 'America/New_York',
      weeklySlots: [{ weekday: 2, time: '04:00', durationMinutes: 35 }],
    })).toThrow('Unsupported rolling schedule timezone');
  });
});
