import test from 'node:test';
import assert from 'node:assert/strict';

import { auditAcademicEnrollmentSnapshot } from '../audit-academic-enrollment.mjs';

function entry(collection, id, data = {}) {
  return { id, path: `${collection}/${id}`, data };
}

function snapshot() {
  return {
    courses: [
      entry('courses', 'phonics-foundations', {
        courseId: 'phonics-foundations',
        name: 'Phonics Foundations',
        area: 'Phonics',
        level: 1,
        status: 'active',
        ratePerSession: 400,
        durationMinutes: 35,
        sessionFrequency: 'weekly',
        maxStudentsPerSession: 3,
        topics: ['sounds'],
      }),
    ],
    enrollments: [
      entry('enrollments', 'enr-1', {
        enrollmentId: 'enr-1',
        kidId: 'kid-1',
        studentId: 'kid-1',
        kidIds: ['kid-1'],
        courseId: 'phonics-foundations',
        teacherId: 'teacher-1',
        status: 'active',
        ratePerSession: 400,
        currency: 'INR',
        creditsTotal: 8,
        creditsUsed: 1,
        creditsRemaining: 7,
        schedule: {
          schemaVersion: 1,
          deliveryMode: 'rolling',
          weeklySlots: [{ weekday: 1, time: '16:00', durationMinutes: 35 }],
        },
      }),
    ],
    classSessions: [
      entry('classSessions', 'session-1', {
        enrollmentId: 'enr-1',
        courseId: 'phonics-foundations',
        teacherId: 'teacher-1',
        kidId: 'kid-1',
        kidIds: ['kid-1'],
        date: '2099-01-01',
        status: 'scheduled',
        source: 'rolling_schedule',
        feeAmount: 400,
        currency: 'INR',
      }),
    ],
    operationalEnrollmentKeys: [
      entry('operationalEnrollmentKeys', 'kid-1__phonics-foundations', {
        enrollmentId: 'enr-1',
        kidId: 'kid-1',
        courseId: 'phonics-foundations',
      }),
    ],
    enrollmentCreationOperations: [],
    enrollmentCourseTransitions: [],
    programmes: [],
    curriculumVersions: [],
    deliveryOfferings: [],
    learningGroups: [],
    groupPlacements: [],
    teachingAssignments: [],
    schedulePlans: [],
    schoolStructure: [],
  };
}

test('healthy academic/enrollment snapshot preserves current invariants', () => {
  const report = auditAcademicEnrollmentSnapshot(snapshot(), { sampleSize: 10 });

  assert.equal(report.issues.total, 0);
  assert.equal(report.courses.activeCourses, 1);
  assert.equal(report.enrollments.scheduleSources.canonical_rolling, 1);
  assert.equal(report.operationalKeys.resolved, 1);
  assert.equal(report.sessions.futureMultiLearner, 0);
  assert.equal(report.canonicalCollectionInventory.deliveryOfferings, 0);
});

test('audit surfaces missing academic ownership links and group-shaped sessions', () => {
  const input = snapshot();
  input.enrollments[0].data.courseId = 'missing-course';
  input.classSessions[0].data.enrollmentId = 'missing-enrollment';
  input.classSessions[0].data.kidIds = ['kid-1', 'kid-2'];
  input.operationalEnrollmentKeys[0].data.enrollmentId = 'missing-enrollment';

  const report = auditAcademicEnrollmentSnapshot(input, { sampleSize: 10 });

  assert.equal(report.issues.byCode.enrollment_missing_course, 1);
  assert.equal(report.issues.byCode.future_session_missing_enrollment, 1);
  assert.equal(report.issues.byCode.operational_enrollment_key_missing_enrollment, 1);
  assert.equal(report.sessions.futureMultiLearner, 1);
});

test('course commercial and delivery fields are inventoried separately from academic identity', () => {
  const report = auditAcademicEnrollmentSnapshot(snapshot(), { sampleSize: 10 });

  assert.equal(report.courses.hasEmbeddedPrice, 1);
  assert.equal(report.courses.hasEmbeddedTopics, 1);
  assert.equal(report.courses.hasDeliveryDefaults, 1);
  assert.equal(report.courses.maxStudentsGreaterThanOne, 1);
  assert.match(report.canonicalDecisions.commercialSeparation, /Course\.ratePerSession/);
});
