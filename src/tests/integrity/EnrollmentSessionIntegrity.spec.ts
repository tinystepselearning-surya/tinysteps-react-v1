import { describe, expect, it } from 'vitest';
import { doesEnrollmentOccupyCourseSlot } from '../../lib/sessionScheduleIntegrity';
import { selectOperationalReminderSessions } from '../../pages/admin/todaysNotificationsManualData';

const enrollment = (
  id: string,
  courseId: string,
  teacherId: string,
  status = 'active',
  weeklySlots = [{ weekday: 1, time: '17:00', durationMinutes: 35 }],
) => ({
  id,
  status,
  kidId: 'kid-1',
  kidIds: ['kid-1'],
  courseId,
  teacherId,
  teacherIds: [teacherId],
  schedule: { weeklySlots },
});

const session = (
  id: string,
  enrollmentId: string,
  courseId: string,
  teacherId: string,
  startTime = '17:00',
) => ({
  id,
  enrollmentId,
  courseId,
  teacherId,
  kidId: 'kid-1',
  kidIds: ['kid-1'],
  date: '2026-07-20',
  startTime,
  durationMinutes: 35,
  status: 'scheduled',
});

describe('cross-system enrollment and session integrity', () => {
  it('preserves simultaneous courses even when the child and time overlap', () => {
    const phonics = enrollment('enr-phonics', 'phonics', 'teacher-a');
    const grammar = enrollment('enr-grammar', 'grammar', 'teacher-b');
    const visible = selectOperationalReminderSessions([
      session('session-phonics', phonics.id, 'phonics', 'teacher-a'),
      session('session-grammar', grammar.id, 'grammar', 'teacher-b'),
    ], { [phonics.id]: phonics, [grammar.id]: grammar });

    expect(visible.map((row) => row.id)).toEqual(['session-phonics', 'session-grammar']);
  });

  it('hides completed-course projections without affecting the next course', () => {
    const foundations = enrollment('enr-foundations', 'foundations', 'teacher-a', 'completed');
    const earlyPhonics = enrollment('enr-early', 'early-phonics', 'teacher-b');
    const visible = selectOperationalReminderSessions([
      session('old-foundations', foundations.id, 'foundations', 'teacher-a'),
      session('current-early', earlyPhonics.id, 'early-phonics', 'teacher-b'),
    ], { [foundations.id]: foundations, [earlyPhonics.id]: earlyPhonics });

    expect(visible.map((row) => row.id)).toEqual(['current-early']);
  });

  it('keeps two valid weekly slots and excludes an obsolete third slot', () => {
    const advanced = enrollment('enr-advanced', 'advanced-phonics', 'teacher-a', 'active', [
      { weekday: 1, time: '11:15', durationMinutes: 35 },
      { weekday: 1, time: '12:00', durationMinutes: 35 },
    ]);
    const visible = selectOperationalReminderSessions([
      session('valid-1115', advanced.id, 'advanced-phonics', 'teacher-a', '11:15'),
      session('stale-1150', advanced.id, 'advanced-phonics', 'teacher-a', '11:50'),
      session('valid-1200', advanced.id, 'advanced-phonics', 'teacher-a', '12:00'),
    ], { [advanced.id]: advanced });

    expect(visible.map((row) => row.id)).toEqual(['valid-1115', 'valid-1200']);
  });

  it('does not let cancellation of one course release another course identity', () => {
    expect(doesEnrollmentOccupyCourseSlot({ status: 'cancelled', courseId: 'grammar' })).toBe(false);
    expect(doesEnrollmentOccupyCourseSlot({ status: 'active', courseId: 'phonics' })).toBe(true);
  });

  it('shows approved manual exceptions and hides withdrawn copies', () => {
    const phonics = enrollment('enr-phonics', 'phonics', 'teacher-a');
    const manualBase = {
      ...session('manual-approved', phonics.id, 'phonics', 'teacher-a', '19:00'),
      source: 'admin_manual',
      isAdHoc: true,
      manualSessionState: 'approved',
    };
    const visible = selectOperationalReminderSessions([
      manualBase,
      { ...manualBase, id: 'manual-withdrawn', manualSessionState: 'withdrawn' },
    ], { [phonics.id]: phonics });

    expect(visible.map((row) => row.id)).toEqual(['manual-approved']);
  });
});
