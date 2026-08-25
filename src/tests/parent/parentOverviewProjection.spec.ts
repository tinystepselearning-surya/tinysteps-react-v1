import { describe, expect, it } from 'vitest';

import type { ChildCourseProgressProjection } from '../../hooks/useChildCourseProgressProjection';
import type { ParentClassAttendanceReadModel } from '../../lib/parentClassAttendanceProjection';
import {
  buildCanonicalParentOverview,
  selectCanonicalParentOverviewCourse,
} from '../../pages/parent/parentOverviewProjection';

const canonicalCourse: ChildCourseProgressProjection = {
  schemaVersion: 2,
  modelType: 'child_course_progress_v2',
  completionAuthority: 'teacher_lesson_status',
  definitionStatus: 'configured',
  courseId: 'phonics-foundations',
  courseLabel: 'Phonics Foundations',
  totalTopics: 5,
  completedTopics: 2,
  inProgressTopics: 1,
  notStartedTopics: 2,
  overallPct: 40,
  totalStages: 2,
  completedStages: 0,
  stageSummaries: [
    {
      key: 'stage-1',
      label: 'Stage 1 — First sounds',
      order: 1,
      totalTopics: 3,
      completedTopics: 2,
      inProgressTopics: 1,
      notStartedTopics: 0,
      completionPct: 67,
    },
    {
      key: 'stage-2',
      label: 'Stage 2 — More sounds',
      order: 2,
      totalTopics: 2,
      completedTopics: 0,
      inProgressTopics: 0,
      notStartedTopics: 2,
      completionPct: 0,
    },
  ],
  lastUpdatedAtMs: 1234,
};

const classModel: ParentClassAttendanceReadModel = {
  schemaVersion: 3,
  modelType: 'class_attendance_v3',
  childRowsAuthoritative: true,
  byKid: {
    'kid-1': {
      kidId: 'kid-1',
      monthKey: '2026-08',
      totalSessions: 6,
      completedSessions: 2,
      scheduledSessions: 2,
      inProgressSessions: 1,
      cancelledSessions: 0,
      noShowSessions: 0,
      rescheduleRequestedSessions: 1,
      rescheduledSessions: 0,
      otherSessions: 0,
      presentSessions: 1,
      lateSessions: 1,
      absentSessions: 0,
      attendanceMarkedSessions: 2,
      attendanceUnmarkedCompletedSessions: 0,
      attendancePct: 100,
      pendingTimeUnknownSessions: 1,
      pendingSessionStartAtMs: [1000, 3000],
    },
  },
  totals: {
    kidId: 'family',
    monthKey: '2026-08',
    totalSessions: 99,
    completedSessions: 80,
  },
};

describe('Brick P5 parent overview projection', () => {
  it('accepts only the canonical P3 V2 teacher-status completion model', () => {
    expect(
      selectCanonicalParentOverviewCourse(canonicalCourse, 'phonics-foundations'),
    ).toMatchObject({
      courseId: 'phonics-foundations',
      totalTopics: 5,
      completedTopics: 2,
      inProgressTopics: 1,
      notStartedTopics: 2,
      overallPct: 40,
    });

    expect(
      selectCanonicalParentOverviewCourse(
        { ...canonicalCourse, schemaVersion: 1 },
        'phonics-foundations',
      ),
    ).toBeNull();
    expect(
      selectCanonicalParentOverviewCourse(
        { ...canonicalCourse, completionAuthority: 'mastery' },
        'phonics-foundations',
      ),
    ).toBeNull();
  });

  it('rejects a mismatched course rather than silently presenting another course', () => {
    expect(selectCanonicalParentOverviewCourse(canonicalCourse, 'early-phonics')).toBeNull();
  });

  it('rejects projections whose course or stage counts do not reconcile', () => {
    expect(
      selectCanonicalParentOverviewCourse(
        { ...canonicalCourse, completedTopics: 3 },
        'phonics-foundations',
      ),
    ).toBeNull();

    const stageSummaries = [...(canonicalCourse.stageSummaries ?? [])];
    expect(
      selectCanonicalParentOverviewCourse(
        {
          ...canonicalCourse,
          stageSummaries: [
            stageSummaries[0],
            { ...stageSummaries[1], totalTopics: 3, notStartedTopics: 3 },
          ],
        },
        'phonics-foundations',
      ),
    ).toBeNull();
  });

  it('selects current and next stage from canonical lesson states, not mastery', () => {
    const course = selectCanonicalParentOverviewCourse(canonicalCourse, 'phonics-foundations');
    expect(course?.activeStage?.key).toBe('stage-1');
    expect(course?.nextStage?.key).toBe('stage-2');
  });

  it('uses only the selected child P4 row and never family totals', () => {
    const overview = buildCanonicalParentOverview({
      courseProjection: canonicalCourse,
      expectedCourseId: 'phonics-foundations',
      classAttendanceModel: classModel,
      kidId: 'kid-1',
      nowMs: 2000,
    });

    expect(overview.classCounts).toMatchObject({
      total: 6,
      completed: 2,
      upcoming: 1,
      unresolved_past: 1,
      pending_time_unknown: 1,
      reschedule_requested: 1,
      attendance_pct: 100,
    });

    const missingChild = buildCanonicalParentOverview({
      courseProjection: canonicalCourse,
      expectedCourseId: 'phonics-foundations',
      classAttendanceModel: classModel,
      kidId: 'kid-2',
      nowMs: 2000,
    });
    expect(missingChild.classAttendance).toBeNull();
    expect(missingChild.classCounts).toBeNull();
  });

  it('reclassifies pending classes from the same P4 row without another Firestore read', () => {
    const before = buildCanonicalParentOverview({
      courseProjection: canonicalCourse,
      expectedCourseId: 'phonics-foundations',
      classAttendanceModel: classModel,
      kidId: 'kid-1',
      nowMs: 500,
    });
    const later = buildCanonicalParentOverview({
      courseProjection: canonicalCourse,
      expectedCourseId: 'phonics-foundations',
      classAttendanceModel: classModel,
      kidId: 'kid-1',
      nowMs: 4000,
    });

    expect(before.classCounts?.upcoming).toBe(2);
    expect(before.classCounts?.unresolved_past).toBe(0);
    expect(later.classCounts?.upcoming).toBe(0);
    expect(later.classCounts?.unresolved_past).toBe(2);
  });
});
