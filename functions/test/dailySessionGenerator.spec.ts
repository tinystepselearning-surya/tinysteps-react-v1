import {describe, expect, it} from 'vitest';
import {
  childTimeOccupancy,
  dailySessionWritesEnabled,
} from '../src/scheduling/dailySessionGenerator';

describe('nightly Today/Tomorrow scheduling writer protections', () => {
  const date = '2026-10-12';
  const at = '05:00';
  const key = `kid-a|${date}|${at}`;

  it('remains disabled until explicitly enabled', () => {
    expect(dailySessionWritesEnabled({})).toBe(false);
    expect(dailySessionWritesEnabled({DAILY_SESSION_WRITES_ENABLED: 'false'})).toBe(false);
    expect(dailySessionWritesEnabled({DAILY_SESSION_WRITES_ENABLED: 'true'})).toBe(true);
  });

  it('reserves student/date/time for existing scheduled manual and makeup classes', () => {
    const occupied = childTimeOccupancy([
      {id: 'manual-a', data: {
        kidId: 'kid-a', date, startTime: at, status: 'scheduled',
        source: 'manual', isManual: true,
      }},
      {id: 'makeup-b', data: {
        kidIds: ['kid-b'], date, startTime: at, status: 'scheduled',
        source: 'makeup',
      }},
    ]);
    expect([...occupied.get(key) || []]).toEqual(['manual-a']);
    expect([...occupied.get(`kid-b|${date}|${at}`) || []]).toEqual(['makeup-b']);
  });

  it('does not occupy time for cancelled and completed session documents', () => {
    const occupied = childTimeOccupancy([
      {id: 'cancelled', data: {kidId: 'kid-a', date, startTime: at, status: 'cancelled'}},
      {id: 'completed', data: {kidId: 'kid-a', date, startTime: at, status: 'completed'}},
      {id: 'present', data: {kidId: 'kid-a', date, startTime: at, status: 'present'}},
    ]);
    expect(occupied.has(key)).toBe(false);
  });

  it('uses canonical and legacy child identifiers without double counting the same class', () => {
    const occupied = childTimeOccupancy([
      {id: 'legacy-a', data: {
        studentId: 'kid-a', childId: 'kid-a', kidIds: ['kid-a'],
        date, startTime: at, status: 'upcoming',
      }},
      {id: 'legacy-b', data: {
        childId: 'kid-a', date, startTime: at, status: 'reschedule_requested',
      }},
    ]);
    expect([...occupied.get(key) || []].sort()).toEqual(['legacy-a', 'legacy-b']);
  });
});
