import { describe, expect, it } from 'vitest';
import {
  applySessionsManagementProjectionDeltas,
  isOperationalSessionsManagementEnrollment,
  type SessionsManagementProjectionDelta,
  type SessionsManagementProjectionSnapshot,
} from '../src/helpers/sessionsManagementProjection';

const baseSnapshot = (
  overrides: Partial<SessionsManagementProjectionSnapshot> = {},
): SessionsManagementProjectionSnapshot => ({
  dateKeys: ['2026-09-21', '2026-09-22'],
  counts: {
    sessions: 0,
    todaySessions: 0,
    tomorrowSessions: 0,
    enrollments: 0,
    overallEnrollments: 0,
    users: 0,
    kids: 0,
    students: 0,
    courses: 0,
  },
  sourceStats: {},
  sessions: [],
  enrollments: [],
  users: [],
  kids: [],
  students: [],
  courses: [],
  ...overrides,
});

describe('Sessions Management live delta projection', () => {
  it('adds a new operational enrollment to Overall Admissions without a baseline rebuild', () => {
    const delta: SessionsManagementProjectionDelta = {
      entityType: 'enrollment',
      entityId: 'enrollment-1',
      operation: 'upsert',
      revision: 1,
      eventTimeMs: 1,
      row: {
        id: 'enrollment-1',
        data: {
          status: 'active',
          kidId: 'kid-1',
          parentId: 'parent-1',
        },
      },
      related: {
        kids: [{ id: 'kid-1', data: { name: 'Student' } }],
        users: [{ id: 'parent-1', data: { name: 'Parent' } }],
      },
    };

    const projected = applySessionsManagementProjectionDeltas(
      baseSnapshot(),
      [delta],
      1,
    );

    expect(projected.counts.overallEnrollments).toBe(1);
    expect(projected.enrollments.map((row) => row.id)).toEqual(['enrollment-1']);
    expect(projected.kids.map((row) => row.id)).toEqual(['kid-1']);
    expect(projected.users.map((row) => row.id)).toEqual(['parent-1']);
    expect(projected.projectionRevision).toBe(1);
  });

  it('updates Today and Tomorrow counts from session upserts and removals', () => {
    const projected = applySessionsManagementProjectionDeltas(
      baseSnapshot(),
      [
        {
          entityType: 'session',
          entityId: 'today-1',
          operation: 'upsert',
          revision: 1,
          eventTimeMs: 1,
          row: {
            id: 'today-1',
            data: { date: '2026-09-21', enrollmentId: 'enrollment-1' },
          },
        },
        {
          entityType: 'session',
          entityId: 'tomorrow-1',
          operation: 'upsert',
          revision: 2,
          eventTimeMs: 2,
          row: {
            id: 'tomorrow-1',
            data: { date: '2026-09-22', enrollmentId: 'enrollment-1' },
          },
        },
        {
          entityType: 'session',
          entityId: 'today-1',
          operation: 'remove',
          revision: 3,
          eventTimeMs: 3,
        },
      ],
      3,
    );

    expect(projected.sessions.map((row) => row.id)).toEqual(['tomorrow-1']);
    expect(projected.counts.sessions).toBe(1);
    expect(projected.counts.todaySessions).toBe(0);
    expect(projected.counts.tomorrowSessions).toBe(1);
  });

  it('applies deltas in revision order so a later enrollment removal wins a rebuild race', () => {
    const projected = applySessionsManagementProjectionDeltas(
      baseSnapshot(),
      [
        {
          entityType: 'enrollment',
          entityId: 'enrollment-1',
          operation: 'remove',
          revision: 2,
          eventTimeMs: 2,
        },
        {
          entityType: 'session',
          entityId: 'today-1',
          operation: 'upsert',
          revision: 1,
          eventTimeMs: 1,
          row: {
            id: 'today-1',
            data: { date: '2026-09-21', enrollmentId: 'enrollment-1' },
          },
          related: {
            enrollments: [
              {
                id: 'enrollment-1',
                data: { status: 'active', kidId: 'kid-1' },
              },
            ],
          },
        },
      ],
      2,
    );

    expect(projected.counts.overallEnrollments).toBe(0);
    expect(projected.enrollments).toEqual([]);
    expect(projected.sessions.map((row) => row.id)).toEqual(['today-1']);
  });

  it('does not promote paused or terminal enrollment rows into Overall Admissions', () => {
    const projected = applySessionsManagementProjectionDeltas(
      baseSnapshot(),
      [
        {
          entityType: 'session',
          entityId: 'today-1',
          operation: 'upsert',
          revision: 1,
          eventTimeMs: 1,
          row: {
            id: 'today-1',
            data: { date: '2026-09-21', enrollmentId: 'enrollment-paused' },
          },
          related: {
            enrollments: [
              {
                id: 'enrollment-paused',
                data: { status: 'paused' },
              },
            ],
          },
        },
      ],
      1,
    );

    expect(projected.counts.overallEnrollments).toBe(0);
    expect(projected.enrollments.map((row) => row.id)).toEqual([
      'enrollment-paused',
    ]);
  });

  it('keeps legacy operational enrollment aliases aligned with the admin read model', () => {
    expect(isOperationalSessionsManagementEnrollment({ status: 'pending_teacher' })).toBe(true);
    expect(isOperationalSessionsManagementEnrollment({ status: 'pending_payment' })).toBe(true);
    expect(isOperationalSessionsManagementEnrollment({ status: 'pending_lp' })).toBe(true);
    expect(isOperationalSessionsManagementEnrollment({ status: 'pending_lp_assignment' })).toBe(true);
    expect(isOperationalSessionsManagementEnrollment({ status: 'enrolled' })).toBe(true);
    expect(isOperationalSessionsManagementEnrollment({ status: 'current' })).toBe(true);
    expect(isOperationalSessionsManagementEnrollment({ status: 'ongoing' })).toBe(true);
    expect(isOperationalSessionsManagementEnrollment({ status: 'paused' })).toBe(false);
    expect(isOperationalSessionsManagementEnrollment({ status: 'cancelled' })).toBe(false);
  });
});
