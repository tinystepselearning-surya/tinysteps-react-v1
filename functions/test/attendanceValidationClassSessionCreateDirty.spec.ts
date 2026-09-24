import { describe, expect, it } from 'vitest';
import {
  shouldMarkCreatedClassSessionDirty,
} from '../src/attendanceValidation/classSessionCreateDirtyTrigger';

describe('AVS newly-created historical session dirty routing', () => {
  const now = new Date('2026-09-24T03:30:00.000Z');

  it('queues completed historical sessions on or after the AVS start date', () => {
    expect(shouldMarkCreatedClassSessionDirty(
      { date: '2026-09-23' },
      now,
    )).toBe(true);
    expect(shouldMarkCreatedClassSessionDirty(
      { date: '2026-09-01' },
      now,
    )).toBe(true);
  });

  it('does not queue today or future scheduled materialization', () => {
    expect(shouldMarkCreatedClassSessionDirty(
      { date: '2026-09-24' },
      now,
    )).toBe(false);
    expect(shouldMarkCreatedClassSessionDirty(
      { date: '2026-09-25' },
      now,
    )).toBe(false);
  });

  it('does not queue pre-AVS or unresolved sessions', () => {
    expect(shouldMarkCreatedClassSessionDirty(
      { date: '2026-08-31' },
      now,
    )).toBe(false);
    expect(shouldMarkCreatedClassSessionDirty({}, now)).toBe(false);
  });
});
