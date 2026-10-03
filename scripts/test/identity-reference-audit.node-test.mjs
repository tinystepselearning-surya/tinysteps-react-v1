import test from 'node:test';
import assert from 'node:assert/strict';

import { auditIdentitySnapshot } from '../audit-identity-references.mjs';

function entry(collection, id, data = {}) {
  return { id, path: `${collection}/${id}`, data };
}

function healthySnapshot() {
  const parentId = 'parent-secret-001';
  const teacherId = 'teacher-secret-001';
  const kidId = 'kid-secret-001';

  return {
    users: [
      entry('users', parentId, { uid: parentId, userId: parentId, role: 'parent', roles: ['parent'], childIds: [kidId] }),
      entry('users', teacherId, { uid: teacherId, userId: teacherId, role: 'teacher', roles: ['teacher'] }),
    ],
    parents: [entry('parents', parentId, { userId: parentId })],
    teachers: [entry('teachers', teacherId, { userId: teacherId })],
    learningPartners: [],
    admins: [],
    kids: [
      entry('kids', kidId, {
        parentId,
        parentIds: [parentId],
        primaryParentId: parentId,
        teacherId,
        teacherIds: [teacherId],
      }),
    ],
    students: [],
    nestedStudents: [],
    enrollments: [
      entry('enrollments', 'enrollment-secret-001', {
        enrollmentId: 'enrollment-secret-001',
        kidId,
        kidIds: [kidId],
        parentId,
        parentIds: [parentId],
        teacherId,
        teacherIds: [teacherId],
      }),
    ],
    classSessions: [
      entry('classSessions', 'session-secret-001', {
        enrollmentId: 'enrollment-secret-001',
        kidId,
        parentId,
        teacherId,
      }),
    ],
    schoolUsers: [],
    schools: [],
    demoSessions: [],
  };
}

test('healthy canonical references produce no identity issues', () => {
  const report = auditIdentitySnapshot(healthySnapshot(), { sampleSize: 10 });
  assert.equal(report.issues.total, 0);
  assert.equal(report.authBackedIdentity.usersUidPresent, 2);
  assert.equal(report.authBackedIdentity.usersUidMatchesDocumentId, 2);
  assert.equal(report.authBackedIdentity.usersUidMatchPct, 100);
  assert.equal(report.learners.kidRelationships.usersChildIdsBacklinkPresent, 1);
  assert.equal(report.operationalReferences.enrollments.ambiguousLearnerIdentity, 0);
});

test('ambiguous aliases are surfaced without exposing raw IDs', () => {
  const snapshot = healthySnapshot();
  snapshot.users[0].data.childIds = [];
  snapshot.kids[0].data.parentIds = ['different-parent-secret'];
  snapshot.enrollments[0].data.studentId = 'different-student-secret';
  snapshot.classSessions[0].data.teacherUid = 'different-teacher-secret';

  const report = auditIdentitySnapshot(snapshot, { sampleSize: 10 });

  assert.equal(report.issues.byCode.kid_primaryParentId_not_in_parentIds, 1);
  assert.equal(report.issues.byCode.kid_missing_users_childIds_backlink, 1);
  assert.equal(report.issues.byCode.enrollment_kidId_studentId_mismatch, 1);
  assert.equal(report.issues.byCode.classSession_teacher_alias_mismatch, 1);

  const serialized = JSON.stringify(report);
  for (const rawId of [
    'parent-secret-001',
    'teacher-secret-001',
    'kid-secret-001',
    'different-parent-secret',
    'different-student-secret',
    'different-teacher-secret',
  ]) {
    assert.equal(serialized.includes(rawId), false);
  }
});


test('legacy student namespaces require an explicit kid mapping', () => {
  const snapshot = healthySnapshot();
  snapshot.students = [
    entry('students', 'student-projection-secret', { parentId: 'parent-secret-001' }),
  ];
  snapshot.nestedStudents = [
    {
      id: 'legacy-nested-secret',
      path: 'parents/parent-secret-001/students/legacy-nested-secret',
      data: { parentId: 'parent-secret-001' },
    },
  ];

  const report = auditIdentitySnapshot(snapshot, { sampleSize: 10 });
  assert.equal(report.learners.rootStudentCompatibility.withoutKidMapping, 1);
  assert.equal(report.learners.nestedStudentCompatibility.withoutKidMapping, 1);
  assert.equal(report.issues.byCode.root_student_without_kid_mapping, 1);
  assert.equal(report.issues.byCode.nested_student_without_kid_mapping, 1);
});

test('audit implementation has no awaited Firestore mutation calls', async () => {
  const source = await import('node:fs/promises').then((fs) =>
    fs.readFile(new URL('../audit-identity-references.mjs', import.meta.url), 'utf8'),
  );

  assert.doesNotMatch(
    source,
    /await\s+[^;\n]*\.(?:set|update|delete|create|add)\s*\(/,
  );
  assert.doesNotMatch(source, /\brunTransaction\s*\(/);
  assert.doesNotMatch(source, /\bbulkWriter\s*\(/);
  assert.doesNotMatch(source, /\bwriteBatch\s*\(/);
  assert.doesNotMatch(source, /\bdb\.batch\s*\(/);
});
