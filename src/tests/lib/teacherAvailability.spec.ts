import { describe, expect, it } from 'vitest';
import type { DemoSession } from '../../types/models';
import type { TeacherSession } from '../../types/Teacher';
import {
  buildDayGridCells,
  buildDayScheduleSnapshot,
  buildScheduleRangeSnapshots,
  createAvailabilityWindow,
  dateKeyToDate,
  flattenOpenIntervals,
  formatIntervalLabel,
  normalizeTeacherAvailabilityConfig,
  summarizeScheduleRange,
} from '../../lib/teacherAvailability';

describe('teacherAvailability helpers', () => {
  it('reconciles recurring availability with classes, demos, and blocked slots', () => {
    const monday = dateKeyToDate('2026-04-13');
    expect(monday).toBeTruthy();
    if (!monday) return;

    const availabilityConfig = normalizeTeacherAvailabilityConfig({
      timezone: 'Asia/Kolkata',
      slotIntervalMinutes: 30,
      weeklyWindows: [createAvailabilityWindow(1, '17:00', '21:00')],
    });

    const sessions: TeacherSession[] = [
      {
        id: 'class_1',
        teacherId: 'teacher_1',
        courseId: 'phonics',
        courseName: 'Phonics',
        date: '2026-04-13',
        startTime: '17:30',
        endTime: '18:05',
        kidIds: ['kid_1'],
        status: 'scheduled',
      },
    ];

    const demos: DemoSession[] = [
      {
        id: 'demo_1',
        createdBy: 'admin_1',
        parentName: 'Riya',
        childName: 'Aarav',
        childGrade: '2',
        courseInterested: 'Phonics',
        preferredDateTimeText: 'Mon evening',
        status: 'assigned',
        assignedTeacherId: 'teacher_1',
        teacherConfirmedDate: '2026-04-13',
        teacherConfirmedTime: '18:30',
      },
    ];

    const blockedSlots = [
      {
        id: 'block_1',
        startAt: new Date(2026, 3, 13, 19, 30, 0, 0),
        endAt: new Date(2026, 3, 13, 20, 0, 0, 0),
        reason: 'Personal time',
      },
    ];

    const snapshot = buildDayScheduleSnapshot({
      date: monday,
      availabilityConfig,
      sessions,
      demos,
      blockedSlots,
      demoDurationMinutes: 35,
    });

    expect(snapshot.availabilityIntervals).toHaveLength(1);
    expect(snapshot.classIntervals).toHaveLength(1);
    expect(snapshot.demoIntervals).toHaveLength(1);
    expect(snapshot.blockedIntervals).toHaveLength(1);
    expect(snapshot.openIntervals.map((interval) => formatIntervalLabel(interval.startAt, interval.endAt))).toEqual([
      '5:00 PM - 5:30 PM',
      '6:05 PM - 6:30 PM',
      '7:05 PM - 7:30 PM',
      '8:00 PM - 9:00 PM',
    ]);
  });

  it('marks conflicts when demos or classes sit outside published availability', () => {
    const monday = dateKeyToDate('2026-04-13');
    expect(monday).toBeTruthy();
    if (!monday) return;

    const availabilityConfig = normalizeTeacherAvailabilityConfig({
      timezone: 'Asia/Kolkata',
      slotIntervalMinutes: 30,
      weeklyWindows: [createAvailabilityWindow(1, '17:00', '18:00')],
    });

    const demos: DemoSession[] = [
      {
        id: 'demo_conflict',
        createdBy: 'admin_1',
        parentName: 'Nita',
        childName: 'Sara',
        childGrade: '3',
        courseInterested: 'Grammar',
        preferredDateTimeText: 'Mon 6 PM',
        status: 'assigned',
        assignedTeacherId: 'teacher_1',
        teacherConfirmedDate: '2026-04-13',
        teacherConfirmedTime: '18:00',
      },
    ];

    const snapshot = buildDayScheduleSnapshot({
      date: monday,
      availabilityConfig,
      demos,
      demoDurationMinutes: 35,
    });

    const cells = buildDayGridCells({
      day: snapshot,
      slotIntervalMinutes: 30,
      startMinutes: 17 * 60,
      endMinutes: 19 * 60,
    });

    expect(cells.map((cell) => cell.status)).toEqual(['available', 'available', 'conflict', 'conflict']);
    expect(cells[2].conflictReasons).toContain('Demo is outside published availability.');
    expect(
      cells[2].sources.some((source) => source.kind === 'demo' && (source.sourceId || source.id) === 'demo_conflict'),
    ).toBe(true);
  });

  it('summarizes open and occupied slots across a date range', () => {
    const availabilityConfig = normalizeTeacherAvailabilityConfig({
      timezone: 'Asia/Kolkata',
      slotIntervalMinutes: 30,
      weeklyWindows: [
        createAvailabilityWindow(1, '17:00', '18:00'),
        createAvailabilityWindow(2, '17:00', '18:00'),
      ],
    });

    const days = buildScheduleRangeSnapshots({
      startDate: new Date(2026, 3, 13, 0, 0, 0, 0),
      days: 2,
      availabilityConfig,
      sessions: [
        {
          id: 'class_mon',
          teacherId: 'teacher_1',
          courseId: 'phonics',
          date: '2026-04-13',
          startTime: '17:00',
          endTime: '17:30',
          kidIds: ['kid_1'],
          status: 'scheduled',
        },
      ],
    });

    const counts = summarizeScheduleRange({
      days,
      slotIntervalMinutes: 30,
      startMinutes: 17 * 60,
      endMinutes: 18 * 60,
    });

    expect(counts.class).toBe(1);
    expect(counts.available).toBe(3);
    expect(flattenOpenIntervals(days)).toHaveLength(2);
  });

  it('applies minimum notice and buffer constraints to bookable open slots', () => {
    const monday = dateKeyToDate('2026-04-13');
    expect(monday).toBeTruthy();
    if (!monday) return;

    const availabilityConfig = normalizeTeacherAvailabilityConfig({
      timezone: 'Asia/Kolkata',
      slotIntervalMinutes: 30,
      minimumNoticeMinutes: 60,
      bufferBetweenSessionsMinutes: 15,
      weeklyWindows: [createAvailabilityWindow(1, '17:00', '21:00')],
    });

    const sessions: TeacherSession[] = [
      {
        id: 'class_buffered',
        teacherId: 'teacher_1',
        courseId: 'phonics',
        date: '2026-04-13',
        startTime: '18:00',
        endTime: '18:30',
        kidIds: ['kid_1'],
        status: 'scheduled',
      },
    ];

    const snapshot = buildDayScheduleSnapshot({
      date: monday,
      availabilityConfig,
      sessions,
      now: new Date(2026, 3, 13, 16, 30, 0, 0), // 4:30 PM; minimum notice => open starts at 5:30 PM
    });

    const labels = snapshot.openIntervals.map((interval) => formatIntervalLabel(interval.startAt, interval.endAt));
    expect(labels).toEqual(['5:30 PM - 5:45 PM', '6:45 PM - 9:00 PM']);

    const cells = buildDayGridCells({
      day: snapshot,
      slotIntervalMinutes: 30,
      startMinutes: 17 * 60,
      endMinutes: 21 * 60,
    });

    // 5:00 PM slot should be unavailable due to minimum notice.
    expect(cells[0].status).toBe('unavailable');
    // 6:00 PM slot remains class.
    expect(cells[2].status).toBe('class');
    // 7:00 PM slot is bookable again after buffer window.
    expect(cells[4].status).toBe('available');
  });
});
