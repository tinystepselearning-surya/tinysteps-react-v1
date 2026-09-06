import { describe, expect, it } from 'vitest';
import {
  planAdminPresentCorrectionCompletion,
  resolveSessionEndMsForAttendanceCorrection,
} from '../src/adminAttendanceCorrectionCompletionBridge';

describe('admin attendance correction completion bridge', () => {
  it('bridges Angad-like historical scheduled Present correction into completed', () => {
    const sessionEndMs = resolveSessionEndMsForAttendanceCorrection({
      date: '2026-08-17',
      startTime: '18:00',
      durationMins: 35,
    });

    expect(planAdminPresentCorrectionCompletion({
      newStatus: 'present',
      currentSessionStatus: 'scheduled',
      sessionEndMs,
      nowMs: Date.parse('2026-09-06T16:30:00+05:30'),
    })).toEqual({ shouldComplete: true, reason: 'eligible' });
  });

  it('does nothing when the corrected session is already completed', () => {
    expect(planAdminPresentCorrectionCompletion({
      newStatus: 'present',
      currentSessionStatus: 'completed',
      sessionEndMs: Date.parse('2026-08-17T18:35:00+05:30'),
      nowMs: Date.parse('2026-09-06T16:30:00+05:30'),
    })).toEqual({ shouldComplete: false, reason: 'already_completed' });
  });

  it('does not complete a session before the class has ended', () => {
    expect(planAdminPresentCorrectionCompletion({
      newStatus: 'present',
      currentSessionStatus: 'in_progress',
      sessionEndMs: Date.parse('2026-09-06T17:00:00+05:30'),
      nowMs: Date.parse('2026-09-06T16:30:00+05:30'),
    })).toEqual({ shouldComplete: false, reason: 'future_or_unresolved_session' });
  });

  it('does not complete future sessions from an admin correction', () => {
    expect(planAdminPresentCorrectionCompletion({
      newStatus: 'present',
      currentSessionStatus: 'scheduled',
      sessionEndMs: Date.parse('2026-09-20T18:35:00+05:30'),
      nowMs: Date.parse('2026-09-06T16:30:00+05:30'),
    })).toEqual({ shouldComplete: false, reason: 'future_or_unresolved_session' });
  });

  it('does not auto-complete reschedule or cancellation lifecycle states', () => {
    for (const currentSessionStatus of ['reschedule_requested', 'rescheduled', 'cancelled']) {
      expect(planAdminPresentCorrectionCompletion({
        newStatus: 'present',
        currentSessionStatus,
        sessionEndMs: Date.parse('2026-08-17T18:35:00+05:30'),
        nowMs: Date.parse('2026-09-06T16:30:00+05:30'),
      })).toEqual({ shouldComplete: false, reason: 'blocked_lifecycle_status' });
    }
  });

  it('does not touch non-Present corrections', () => {
    expect(planAdminPresentCorrectionCompletion({
      newStatus: 'absent',
      currentSessionStatus: 'scheduled',
      sessionEndMs: Date.parse('2026-08-17T18:35:00+05:30'),
      nowMs: Date.parse('2026-09-06T16:30:00+05:30'),
    })).toEqual({ shouldComplete: false, reason: 'not_present' });
  });
});
