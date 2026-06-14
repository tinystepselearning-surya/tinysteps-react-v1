import { describe, expect, it } from 'vitest';
import {
  buildRepairEnrollmentFutureSessionsPlan,
  executeRepairEnrollmentFutureSessionsFromSchedule,
} from '../src/createSessionsFromSchedule';

const makeSession = (
  id: string,
  data: Record<string, unknown>,
) => ({
  id,
  ref: { id } as any,
  raw: data,
  financial: undefined,
  startMs: Date.parse(String(data.startAt || '')),
  signature: `${String(data.date || '')}|${String(data.startTime || '')}|${Number(data.durationMinutes || data.durationMins || 35)}|teacher-aditi`,
  slotPattern: `2|${String(data.startTime || '')}|${Number(data.durationMinutes || data.durationMins || 35)}|teacher-aditi`,
});

const baseContext = {
  enrollmentId: 'enr-inayah',
  enrollment: {
    kidId: 'kid-inayah',
    parentId: 'parent-1',
    teacherId: 'teacher-aditi',
    courseId: 'course-phonics',
  },
  weeklySlots: [
    { weekday: 2, timeHHmm: '18:45', hour: 18, minute: 45, durationMinutes: 35 },
  ],
  rangeStartYmd: '2026-06-01',
  rangeEndYmd: '2026-06-30',
  plannedSessionsTarget: 3,
  kidId: 'kid-inayah',
  kidIds: ['kid-inayah'],
  studentId: 'kid-inayah',
  childId: 'kid-inayah',
  parentId: 'parent-1',
  parentIds: ['parent-1'],
  teacherId: 'teacher-aditi',
  teacherIds: ['teacher-aditi'],
  courseId: 'course-phonics',
  feeAmount: 500,
  currency: 'INR',
  joinUrl: 'https://meet.example.com/class',
  studentName: 'Inayah fatima',
  kidName: 'Inayah fatima',
  childName: 'Inayah fatima',
  parentName: 'Parent Fatima',
  teacherName: 'Aditi Naidu',
  teacherEmail: 'aditi@example.com',
  courseName: 'Phonics Foundations',
  configuredSlotPatterns: new Set(['2|18:45|35|teacher-aditi']),
};

describe('repairEnrollmentFutureSessionsFromSchedule planning', () => {
  it('changes future regular sessions from 18:30 to 18:45 while leaving past/completed sessions untouched', () => {
    const plan = buildRepairEnrollmentFutureSessionsPlan({
      context: {
        ...baseContext,
        sessions: [
          makeSession('session-past-completed', {
            enrollmentId: 'enr-inayah',
            teacherId: 'teacher-aditi',
            teacherIds: ['teacher-aditi'],
            assignedTeacherId: 'teacher-aditi',
            primaryTeacherId: 'teacher-aditi',
            teacherUid: 'teacher-aditi',
            teacher_id: 'teacher-aditi',
            kidId: 'kid-inayah',
            kidIds: ['kid-inayah'],
            parentId: 'parent-1',
            parentIds: ['parent-1'],
            courseId: 'course-phonics',
            date: '2026-06-09',
            startTime: '18:30',
            endTime: '19:05',
            durationMinutes: 35,
            startAt: '2026-06-09T13:00:00.000Z',
            status: 'completed',
            attendance: { 'kid-inayah': { status: 'present' } },
          }),
          makeSession('session-old-time', {
            enrollmentId: 'enr-inayah',
            teacherId: 'teacher-aditi',
            teacherIds: ['teacher-aditi'],
            assignedTeacherId: 'teacher-aditi',
            primaryTeacherId: 'teacher-aditi',
            teacherUid: 'teacher-aditi',
            teacher_id: 'teacher-aditi',
            kidId: 'kid-inayah',
            kidIds: ['kid-inayah'],
            parentId: 'parent-1',
            parentIds: ['parent-1'],
            courseId: 'course-phonics',
            date: '2026-06-16',
            startTime: '18:30',
            endTime: '19:05',
            durationMinutes: 35,
            startAt: '2026-06-16T13:00:00.000Z',
            status: 'scheduled',
            attendance: null,
          }),
          makeSession('session-repaired-needs-aliases', {
            enrollmentId: 'enr-inayah',
            teacherId: 'teacher-aditi',
            kidId: 'kid-inayah',
            kidIds: ['kid-inayah'],
            parentId: 'parent-1',
            parentIds: ['parent-1'],
            courseId: 'course-phonics',
            date: '2026-06-23',
            startTime: '18:45',
            endTime: '19:20',
            durationMinutes: 35,
            startAt: '2026-06-23T13:15:00.000Z',
            status: 'scheduled',
            attendance: null,
          }),
        ],
      } as any,
      nowMs: Date.parse('2026-06-15T12:00:00.000Z'),
      repairBatchId: 'repair-batch-1',
      actorUid: 'admin-1',
    });

    expect(plan.plannedSessionsConsumed).toBe(1);
    expect(plan.missingSessionsToCreate.map((entry) => `${entry.date} ${entry.startTime}`)).toContain('2026-06-16 18:45');
    expect(plan.duplicateOldTimeSessions.map((entry) => entry.sessionId)).toContain('session-old-time');
    expect(plan.staleSessionsToUpdate).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sessionId: 'session-repaired-needs-aliases',
          action: 'patch',
        }),
      ]),
    );
    expect(
      plan.duplicateOldTimeSessions.some((entry) => entry.sessionId === 'session-past-completed'),
    ).toBe(false);
    expect(plan.teacherAliasProblems.map((entry) => entry.sessionId)).toContain('session-repaired-needs-aliases');
  });

  it('loads read context before applying writes', async () => {
    const calls: string[] = [];
    await executeRepairEnrollmentFutureSessionsFromSchedule({
      loadContext: async () => {
        calls.push('read');
        return {
          ...baseContext,
          sessions: [],
        } as any;
      },
      dryRun: true,
      actorUid: 'admin-1',
      nowMs: Date.parse('2026-06-15T12:00:00.000Z'),
      repairBatchId: 'repair-batch-2',
      apply: async () => {
        calls.push('write');
      },
    });

    expect(calls).toEqual(['read', 'write']);
  });
});
