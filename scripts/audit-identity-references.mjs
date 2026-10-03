#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DEFAULT_PROJECT_ID = 'tinysteps-react-v1';
const DEFAULT_REPORT = 'reports/identity-reference-audit.json';
const DEFAULT_SAMPLE_SIZE = 20;

const SELECT_FIELDS = {
  users: ['uid', 'userId', 'role', 'roles', 'status', 'childIds', 'assignedKids'],
  parents: ['userId', 'status'],
  teachers: ['userId', 'status'],
  learningPartners: ['userId', 'status'],
  admins: ['userId', 'status'],
  kids: [
    'parentId', 'parentIds', 'primaryParentId',
    'teacherId', 'teacherIds', 'lpId',
    'studentId', 'studentUid', 'childId', 'linkedStudentId',
    'status',
  ],
  students: [
    'parentId', 'parentIds', 'primaryParentId',
    'kidId', 'studentId', 'studentUid', 'childId', 'linkedStudentId',
    'status',
  ],
  enrollments: [
    'enrollmentId',
    'kidId', 'kidIds', 'studentId', 'childId',
    'parentId', 'parentIds',
    'teacherId', 'teacherIds',
    'lpId', 'status',
  ],
  classSessions: [
    'enrollmentId',
    'kidId', 'kidIds', 'studentId', 'studentIds', 'childId', 'childIds', 'childrenIds',
    'parentId', 'parentIds',
    'teacherId', 'teacherIds', 'assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id',
    'status',
  ],
  schoolUsers: ['userId', 'schoolIds', 'primarySchoolId', 'status', 'role'],
  schools: ['learningPartnerId', 'currentAcademicYearId', 'status'],
  demoSessions: ['assignedTeacherId', 'completedByTeacherId', 'createdBy', 'lastUpdatedBy', 'status'],
};

function parseArgs(argv) {
  const parsed = {
    projectId:
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.FIREBASE_PROJECT_ID ||
      DEFAULT_PROJECT_ID,
    report: DEFAULT_REPORT,
    sampleSize: DEFAULT_SAMPLE_SIZE,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (key === '--project') parsed.projectId = String(argv[++index] || '').trim();
    else if (key === '--report') parsed.report = String(argv[++index] || '').trim();
    else if (key === '--sample-size') parsed.sampleSize = Number(argv[++index]);
    else if (key === '--help' || key === '-h') parsed.help = true;
    else throw new Error(`Unknown argument: ${key}`);
  }

  if (!parsed.projectId) throw new Error('--project must not be empty');
  if (!parsed.report) throw new Error('--report must not be empty');
  if (!Number.isInteger(parsed.sampleSize) || parsed.sampleSize < 0 || parsed.sampleSize > 100) {
    throw new Error('--sample-size must be an integer from 0 to 100');
  }
  return parsed;
}

export function normalizeId(value) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

export function idList(...values) {
  const output = [];
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const normalized = normalizeId(value);
    if (normalized) output.push(normalized);
  };
  values.forEach(visit);
  return [...new Set(output)];
}

function normalizedRole(value) {
  return normalizeId(value).toLowerCase().replace(/[\s_-]+/g, '');
}

function token(value) {
  return createHash('sha256').update(String(value || '')).digest('hex').slice(0, 12);
}

function row(id, pathValue, data) {
  return { id, path: pathValue, data: data || {} };
}

function mapById(rows) {
  return new Map(rows.map((entry) => [entry.id, entry]));
}

function setOfIds(rows) {
  return new Set(rows.map((entry) => entry.id));
}

function intersectionSize(left, right) {
  let count = 0;
  for (const value of left) if (right.has(value)) count += 1;
  return count;
}

function percentage(part, total) {
  if (!total) return 100;
  return Math.round((Number(part || 0) / total) * 10000) / 100;
}

function mirrorSummary(mirrorRows, usersById, expectedRole, issues) {
  let idMatchesUserId = 0;
  let hasUser = 0;
  let userHasExpectedRole = 0;

  for (const entry of mirrorRows) {
    const declaredUserId = normalizeId(entry.data.userId);
    if (!declaredUserId || declaredUserId === entry.id) idMatchesUserId += 1;
    else issues.add('role_mirror_userId_mismatch', entry, ['userId']);

    const user = usersById.get(entry.id);
    if (user) {
      hasUser += 1;
      const roles = new Set([
        normalizedRole(user.data.role),
        ...idList(user.data.roles).map(normalizedRole),
      ].filter(Boolean));
      if (roles.has(normalizedRole(expectedRole))) userHasExpectedRole += 1;
      else issues.add('role_mirror_user_role_mismatch', entry, ['role', 'roles']);
    } else {
      issues.add('role_mirror_missing_user', entry, ['userId']);
    }
  }

  return {
    total: mirrorRows.length,
    documentIdMatchesUserId: idMatchesUserId,
    matchingUserDocument: hasUser,
    userHasExpectedRole,
  };
}

function makeIssueCollector(sampleSize) {
  const counts = {};
  const samples = {};
  const bySource = {};
  const byStatus = {};
  const byFields = {};

  const bump = (bucket, code, key) => {
    if (!bucket[code]) bucket[code] = {};
    bucket[code][key] = (bucket[code][key] || 0) + 1;
  };

  const sourceKind = (source) => {
    const parts = String(source?.path || '').split('/').filter(Boolean);
    if (parts[0] === 'parents' && parts[2] === 'students') return 'parent_students';
    return parts[0] || 'unknown';
  };

  return {
    add(code, source, fields = []) {
      counts[code] = (counts[code] || 0) + 1;
      const normalizedFields = [...new Set(fields)].sort();
      bump(bySource, code, sourceKind(source));
      bump(byStatus, code, normalizeId(source?.data?.status).toLowerCase() || '(missing)');
      bump(byFields, code, normalizedFields.join('+') || '(none)');

      if (!samples[code]) samples[code] = [];
      if (samples[code].length >= sampleSize) return;
      samples[code].push({
        sourceToken: token(source?.path || source?.id || code),
        sourceKind: sourceKind(source),
        status: normalizeId(source?.data?.status).toLowerCase() || null,
        fields: normalizedFields,
      });
    },
    result() {
      const sortNested = (bucket) => Object.fromEntries(
        Object.entries(bucket)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([code, values]) => [
            code,
            Object.fromEntries(Object.entries(values).sort(([a], [b]) => a.localeCompare(b))),
          ]),
      );
      return {
        total: Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0),
        byCode: Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))),
        bySource: sortNested(bySource),
        byStatus: sortNested(byStatus),
        byFields: sortNested(byFields),
        samples: Object.fromEntries(Object.entries(samples).sort(([a], [b]) => a.localeCompare(b))),
      };
    },
  };
}

function checkParentRef(parentId, source, fields, context, issues) {
  if (!parentId) return;
  if (!context.userIds.has(parentId)) issues.add('parent_reference_missing_user', source, fields);
  if (!context.parentIds.has(parentId)) issues.add('parent_reference_missing_parent_mirror', source, fields);
}

function checkTeacherRef(teacherId, source, fields, context, issues) {
  if (!teacherId) return;
  if (!context.userIds.has(teacherId)) issues.add('teacher_reference_missing_user', source, fields);
  if (!context.teacherIds.has(teacherId)) issues.add('teacher_reference_missing_teacher_mirror', source, fields);
}

function checkLearningPartnerRef(lpId, source, fields, context, issues) {
  if (!lpId) return;
  if (!context.userIds.has(lpId)) issues.add('learning_partner_reference_missing_user', source, fields);
  if (!context.learningPartnerIds.has(lpId)) {
    issues.add('learning_partner_reference_missing_role_mirror', source, fields);
  }
}

function learnerTargetKinds(id, context) {
  const kinds = [];
  if (context.kidIds.has(id)) kinds.push('kids');
  if (context.rootStudentIds.has(id)) kinds.push('students');
  if (context.nestedStudentIds.has(id)) kinds.push('parent_students');
  return kinds;
}

function checkLearnerRef(id, source, fields, context, issues) {
  if (!id) return;
  if (learnerTargetKinds(id, context).length === 0) {
    issues.add('learner_reference_missing_all_known_targets', source, fields);
  }
}

function auditExpectedRoleMirrors(users, context, issues) {
  const result = {
    parentUsers: 0,
    parentMirrorPresent: 0,
    teacherUsers: 0,
    teacherMirrorPresent: 0,
    learningPartnerUsers: 0,
    learningPartnerMirrorPresent: 0,
    adminUsers: 0,
    adminMirrorPresent: 0,
  };

  for (const entry of users) {
    const roles = new Set([
      normalizedRole(entry.data.role),
      ...idList(entry.data.roles).map(normalizedRole),
    ].filter(Boolean));

    if (roles.has('parent')) {
      result.parentUsers += 1;
      if (context.parentIds.has(entry.id)) result.parentMirrorPresent += 1;
      else issues.add('user_parent_role_missing_parent_mirror', entry, ['role', 'roles']);
    }
    if (roles.has('teacher')) {
      result.teacherUsers += 1;
      if (context.teacherIds.has(entry.id)) result.teacherMirrorPresent += 1;
      else issues.add('user_teacher_role_missing_teacher_mirror', entry, ['role', 'roles']);
    }
    if (roles.has('learningpartner')) {
      result.learningPartnerUsers += 1;
      if (context.learningPartnerIds.has(entry.id)) result.learningPartnerMirrorPresent += 1;
      else issues.add('user_learningPartner_role_missing_role_mirror', entry, ['role', 'roles']);
    }
    if (roles.has('admin')) {
      result.adminUsers += 1;
      if (context.adminIds.has(entry.id)) result.adminMirrorPresent += 1;
      else issues.add('user_admin_role_missing_admin_mirror', entry, ['role', 'roles']);
    }
  }

  return result;
}

function auditStudentCompatibility(rows, kind, context, issues) {
  let sameIdKidMatch = 0;
  let explicitAliasKidMatch = 0;
  let withoutKidMapping = 0;
  let parentReferencePresent = 0;
  let nestedPathParentMismatch = 0;

  for (const entry of rows) {
    const sameIdMatch = context.kidIds.has(entry.id);
    if (sameIdMatch) sameIdKidMatch += 1;

    const aliasIds = idList(
      entry.data.kidId,
      entry.data.studentId,
      entry.data.studentUid,
      entry.data.childId,
      entry.data.linkedStudentId,
    ).filter((value) => value !== entry.id);
    const aliasKidMatch = aliasIds.some((value) => context.kidIds.has(value));
    if (!sameIdMatch && aliasKidMatch) explicitAliasKidMatch += 1;

    if (!sameIdMatch && !aliasKidMatch) {
      withoutKidMapping += 1;
      issues.add(`${kind}_student_without_kid_mapping`, entry, [
        'kidId', 'studentId', 'studentUid', 'childId', 'linkedStudentId',
      ]);
    }

    const parentRefs = idList(entry.data.primaryParentId, entry.data.parentId, entry.data.parentIds);
    if (parentRefs.length > 0) parentReferencePresent += 1;
    parentRefs.forEach((value) =>
      checkParentRef(value, entry, ['primaryParentId', 'parentId', 'parentIds'], context, issues));

    if (kind === 'nested') {
      const parts = entry.path.split('/');
      const pathParentId = parts.length >= 4 && parts[0] === 'parents' ? parts[1] : '';
      if (pathParentId) {
        checkParentRef(pathParentId, entry, ['pathParentId'], context, issues);
        const dataParentId = normalizeId(entry.data.parentId);
        if (dataParentId && dataParentId !== pathParentId) {
          nestedPathParentMismatch += 1;
          issues.add('nested_student_parentId_path_mismatch', entry, ['parentId']);
        }
      }
    }
  }

  return {
    total: rows.length,
    sameIdKidMatch,
    explicitAliasKidMatch,
    withoutKidMapping,
    parentReferencePresent,
    nestedPathParentMismatch,
    mappedToKidPct: percentage(sameIdKidMatch + explicitAliasKidMatch, rows.length),
  };
}

function auditKidRelationships(kids, context, issues) {
  let canonicalParentShape = 0;
  let primaryParentIncludedInParentIds = 0;
  let usersChildIdsBacklinkPresent = 0;
  let teacherIdPresent = 0;
  let teacherIdsPresent = 0;

  for (const entry of kids) {
    const primaryParentId = normalizeId(entry.data.primaryParentId);
    const parentId = normalizeId(entry.data.parentId);
    const parentIds = idList(entry.data.parentIds);
    const parents = idList(primaryParentId, parentId, parentIds);

    if (primaryParentId && parentIds.includes(primaryParentId)) primaryParentIncludedInParentIds += 1;
    if (primaryParentId && parentIds.length > 0) canonicalParentShape += 1;

    if (primaryParentId && parentId && primaryParentId !== parentId) {
      issues.add('kid_primaryParentId_parentId_mismatch', entry, ['primaryParentId', 'parentId']);
    }
    if (primaryParentId && parentIds.length > 0 && !parentIds.includes(primaryParentId)) {
      issues.add('kid_primaryParentId_not_in_parentIds', entry, ['primaryParentId', 'parentIds']);
    }

    parents.forEach((value) => checkParentRef(value, entry, ['parentId', 'parentIds', 'primaryParentId'], context, issues));

    const backlinkParents = parents.filter((value) => {
      const user = context.usersById.get(value);
      return idList(user?.data?.childIds).includes(entry.id);
    });
    if (backlinkParents.length > 0) usersChildIdsBacklinkPresent += 1;
    else if (parents.length > 0) issues.add('kid_missing_users_childIds_backlink', entry, ['childIds']);

    const teacherId = normalizeId(entry.data.teacherId);
    const teacherIds = idList(entry.data.teacherIds);
    if (teacherId) teacherIdPresent += 1;
    if (teacherIds.length) teacherIdsPresent += 1;
    if (teacherId && teacherIds.length > 0 && !teacherIds.includes(teacherId)) {
      issues.add('kid_teacherId_not_in_teacherIds', entry, ['teacherId', 'teacherIds']);
    }
    idList(teacherId, teacherIds).forEach((value) =>
      checkTeacherRef(value, entry, ['teacherId', 'teacherIds'], context, issues));

    const lpId = normalizeId(entry.data.lpId);
    if (lpId) checkLearningPartnerRef(lpId, entry, ['lpId'], context, issues);
  }

  return {
    total: kids.length,
    canonicalParentShape,
    primaryParentIncludedInParentIds,
    usersChildIdsBacklinkPresent,
    teacherIdPresent,
    teacherIdsPresent,
  };
}

function auditUserChildLinks(users, context, issues) {
  let childLinkCount = 0;
  let resolvedToKids = 0;
  let resolvedOnlyToLegacyStudentShape = 0;

  for (const entry of users) {
    for (const childId of idList(entry.data.childIds)) {
      childLinkCount += 1;
      const kinds = learnerTargetKinds(childId, context);
      if (kinds.includes('kids')) resolvedToKids += 1;
      else if (kinds.length > 0) resolvedOnlyToLegacyStudentShape += 1;
      else issues.add('users_childIds_missing_learner', entry, ['childIds']);
    }

    if (idList(entry.data.assignedKids).length > 0) {
      issues.add('users_assignedKids_legacy_relationship_present', entry, ['assignedKids']);
    }
  }

  return { childLinkCount, resolvedToKids, resolvedOnlyToLegacyStudentShape };
}

function auditEnrollmentReferences(enrollments, context, issues) {
  const learnerTargetUsage = { kids: 0, students: 0, parent_students: 0, missing: 0 };
  let kidIdPresent = 0;
  let studentIdPresent = 0;
  let parentIdPresent = 0;
  let teacherIdPresent = 0;
  let ambiguousLearnerIdentity = 0;
  let ambiguousParentIdentity = 0;
  let ambiguousTeacherIdentity = 0;

  for (const entry of enrollments) {
    const kidId = normalizeId(entry.data.kidId);
    const studentId = normalizeId(entry.data.studentId);
    const childId = normalizeId(entry.data.childId);
    const kidIds = idList(entry.data.kidIds);
    const learnerRefs = idList(kidId, studentId, childId, kidIds);

    if (kidId) kidIdPresent += 1;
    if (studentId) studentIdPresent += 1;

    if (kidId && studentId && kidId !== studentId) {
      ambiguousLearnerIdentity += 1;
      issues.add('enrollment_kidId_studentId_mismatch', entry, ['kidId', 'studentId']);
    }
    if (kidId && kidIds.length > 0 && !kidIds.includes(kidId)) {
      ambiguousLearnerIdentity += 1;
      issues.add('enrollment_kidId_not_in_kidIds', entry, ['kidId', 'kidIds']);
    }
    if (!kidId && !studentId && !childId && kidIds.length > 1) {
      ambiguousLearnerIdentity += 1;
      issues.add('enrollment_multiple_kidIds_without_scalar', entry, ['kidIds']);
    }

    for (const learnerId of learnerRefs) {
      const kinds = learnerTargetKinds(learnerId, context);
      if (!kinds.length) {
        learnerTargetUsage.missing += 1;
        checkLearnerRef(learnerId, entry, ['kidId', 'kidIds', 'studentId', 'childId'], context, issues);
      } else {
        kinds.forEach((kind) => {
          learnerTargetUsage[kind] += 1;
        });
      }
    }

    const parentId = normalizeId(entry.data.parentId);
    const parentIds = idList(entry.data.parentIds);
    if (parentId) parentIdPresent += 1;
    if (!parentId && parentIds.length > 1) {
      ambiguousParentIdentity += 1;
      issues.add('enrollment_multiple_parentIds_without_parentId', entry, ['parentId', 'parentIds']);
    }
    idList(parentId, parentIds).forEach((value) =>
      checkParentRef(value, entry, ['parentId', 'parentIds'], context, issues));

    const teacherId = normalizeId(entry.data.teacherId);
    const teacherIds = idList(entry.data.teacherIds);
    if (teacherId) teacherIdPresent += 1;
    if (!teacherId && teacherIds.length > 1) {
      ambiguousTeacherIdentity += 1;
      issues.add('enrollment_multiple_teacherIds_without_teacherId', entry, ['teacherId', 'teacherIds']);
    }
    idList(teacherId, teacherIds).forEach((value) =>
      checkTeacherRef(value, entry, ['teacherId', 'teacherIds'], context, issues));

    const lpId = normalizeId(entry.data.lpId);
    if (lpId) checkLearningPartnerRef(lpId, entry, ['lpId'], context, issues);
  }

  return {
    total: enrollments.length,
    kidIdPresent,
    studentIdPresent,
    parentIdPresent,
    teacherIdPresent,
    ambiguousLearnerIdentity,
    ambiguousParentIdentity,
    ambiguousTeacherIdentity,
    learnerTargetUsage,
  };
}

function auditSessionReferences(sessions, context, issues) {
  let canonicalTeacherIdPresent = 0;
  let legacyTeacherAliasesPresent = 0;
  let teacherAliasMismatch = 0;
  let enrollmentIdPresent = 0;
  let enrollmentIdMissingTarget = 0;

  for (const entry of sessions) {
    const enrollmentId = normalizeId(entry.data.enrollmentId);
    if (enrollmentId) {
      enrollmentIdPresent += 1;
      if (!context.enrollmentIds.has(enrollmentId)) {
        enrollmentIdMissingTarget += 1;
        issues.add('classSession_enrollmentId_missing_enrollment', entry, ['enrollmentId']);
      }
    }

    const learnerFields = ['kidId', 'kidIds', 'studentId', 'studentIds', 'childId', 'childIds', 'childrenIds'];
    learnerFields.forEach((field) => {
      idList(entry.data[field]).forEach((value) =>
        checkLearnerRef(value, entry, [field], context, issues));
    });

    const parentId = normalizeId(entry.data.parentId);
    if (parentId) checkParentRef(parentId, entry, ['parentId'], context, issues);
    idList(entry.data.parentIds).forEach((value) =>
      checkParentRef(value, entry, ['parentIds'], context, issues));

    const canonicalTeacherId = normalizeId(entry.data.teacherId);
    if (canonicalTeacherId) {
      canonicalTeacherIdPresent += 1;
      checkTeacherRef(canonicalTeacherId, entry, ['teacherId'], context, issues);
    }
    const aliasFields = ['teacherIds', 'assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id'];
    const legacyRefs = idList(...aliasFields.map((field) => entry.data[field]));
    if (legacyRefs.length > 0) legacyTeacherAliasesPresent += 1;

    if (canonicalTeacherId && legacyRefs.some((value) => value !== canonicalTeacherId)) {
      teacherAliasMismatch += 1;
      issues.add('classSession_teacher_alias_mismatch', entry, ['teacherId', ...aliasFields]);
    }

    aliasFields.forEach((field) => {
      idList(entry.data[field]).forEach((value) =>
        checkTeacherRef(value, entry, [field], context, issues));
    });
  }

  return {
    total: sessions.length,
    enrollmentIdPresent,
    enrollmentIdMissingTarget,
    canonicalTeacherIdPresent,
    legacyTeacherAliasesPresent,
    teacherAliasMismatch,
  };
}

function auditSchoolMembership(schoolUsers, context, issues) {
  let documentIdMatchesUserId = 0;
  let userExists = 0;
  let primarySchoolIncluded = 0;

  for (const entry of schoolUsers) {
    const userId = normalizeId(entry.data.userId) || entry.id;
    if (!normalizeId(entry.data.userId) || userId === entry.id) documentIdMatchesUserId += 1;
    else issues.add('schoolUser_documentId_userId_mismatch', entry, ['userId']);

    if (context.userIds.has(userId)) userExists += 1;
    else issues.add('schoolUser_missing_user', entry, ['userId']);

    const schoolIds = idList(entry.data.schoolIds);
    const primarySchoolId = normalizeId(entry.data.primarySchoolId);
    if (primarySchoolId && schoolIds.includes(primarySchoolId)) primarySchoolIncluded += 1;
    else if (primarySchoolId) issues.add('schoolUser_primarySchool_not_in_schoolIds', entry, ['primarySchoolId', 'schoolIds']);

    idList(primarySchoolId, schoolIds).forEach((schoolId) => {
      if (!context.schoolIds.has(schoolId)) {
        issues.add('schoolUser_missing_school', entry, ['primarySchoolId', 'schoolIds']);
      }
    });
  }

  return {
    total: schoolUsers.length,
    documentIdMatchesUserId,
    userExists,
    primarySchoolIncluded,
  };
}

function auditDemoTeacherReferences(demos, context, issues) {
  let assignedTeacherIdPresent = 0;
  let completedByTeacherIdPresent = 0;
  for (const entry of demos) {
    const assigned = normalizeId(entry.data.assignedTeacherId);
    const completed = normalizeId(entry.data.completedByTeacherId);
    if (assigned) {
      assignedTeacherIdPresent += 1;
      checkTeacherRef(assigned, entry, ['assignedTeacherId'], context, issues);
    }
    if (completed) {
      completedByTeacherIdPresent += 1;
      checkTeacherRef(completed, entry, ['completedByTeacherId'], context, issues);
    }
  }
  return { total: demos.length, assignedTeacherIdPresent, completedByTeacherIdPresent };
}

export function auditIdentitySnapshot(snapshot, options = {}) {
  const sampleSize = Number.isInteger(options.sampleSize) ? options.sampleSize : DEFAULT_SAMPLE_SIZE;
  const issues = makeIssueCollector(sampleSize);

  const usersById = mapById(snapshot.users);
  const context = {
    usersById,
    userIds: setOfIds(snapshot.users),
    parentIds: setOfIds(snapshot.parents),
    teacherIds: setOfIds(snapshot.teachers),
    learningPartnerIds: setOfIds(snapshot.learningPartners),
    adminIds: setOfIds(snapshot.admins),
    kidIds: setOfIds(snapshot.kids),
    rootStudentIds: setOfIds(snapshot.students),
    nestedStudentIds: setOfIds(snapshot.nestedStudents),
    enrollmentIds: setOfIds(snapshot.enrollments),
    schoolIds: setOfIds(snapshot.schools),
  };

  let usersUidPresent = 0;
  let usersUidMatchesDocumentId = 0;
  let usersUserIdPresent = 0;
  let usersUserIdMatchesDocumentId = 0;
  let usersRoleArrayContainsRole = 0;
  for (const entry of snapshot.users) {
    const uid = normalizeId(entry.data.uid);
    const userId = normalizeId(entry.data.userId);
    if (uid) {
      usersUidPresent += 1;
      if (uid === entry.id) usersUidMatchesDocumentId += 1;
      else issues.add('users_documentId_uid_mismatch', entry, ['uid']);
    }

    if (userId) {
      usersUserIdPresent += 1;
      if (userId === entry.id) usersUserIdMatchesDocumentId += 1;
      else issues.add('users_documentId_userId_mismatch', entry, ['userId']);
    }

    const role = normalizedRole(entry.data.role);
    const roles = idList(entry.data.roles).map(normalizedRole);
    if (!role || roles.length === 0 || roles.includes(role)) usersRoleArrayContainsRole += 1;
    else issues.add('users_role_roles_mismatch', entry, ['role', 'roles']);
  }

  const nestedStudentParentCounts = new Map();
  snapshot.nestedStudents.forEach((entry) => {
    const parts = entry.path.split('/');
    const parentId = parts.length >= 4 && parts[0] === 'parents' ? parts[1] : '';
    if (!parentId) return;
    if (!nestedStudentParentCounts.has(entry.id)) nestedStudentParentCounts.set(entry.id, new Set());
    nestedStudentParentCounts.get(entry.id).add(parentId);
  });
  let nestedStudentIdsUnderMultipleParents = 0;
  for (const parents of nestedStudentParentCounts.values()) {
    if (parents.size > 1) nestedStudentIdsUnderMultipleParents += 1;
  }

  const expectedRoleMirrors = auditExpectedRoleMirrors(snapshot.users, context, issues);
  const kidRelationships = auditKidRelationships(snapshot.kids, context, issues);
  const rootStudentCompatibility = auditStudentCompatibility(snapshot.students, 'root', context, issues);
  const nestedStudentCompatibility = auditStudentCompatibility(snapshot.nestedStudents, 'nested', context, issues);
  const userChildLinks = auditUserChildLinks(snapshot.users, context, issues);
  const enrollments = auditEnrollmentReferences(snapshot.enrollments, context, issues);
  const classSessions = auditSessionReferences(snapshot.classSessions, context, issues);
  const schoolMembership = auditSchoolMembership(snapshot.schoolUsers, context, issues);
  const demos = auditDemoTeacherReferences(snapshot.demoSessions, context, issues);

  const roleMirrors = {
    parents: mirrorSummary(snapshot.parents, usersById, 'parent', issues),
    teachers: mirrorSummary(snapshot.teachers, usersById, 'teacher', issues),
    learningPartners: mirrorSummary(snapshot.learningPartners, usersById, 'learningPartner', issues),
    admins: mirrorSummary(snapshot.admins, usersById, 'admin', issues),
  };

  const issueResult = issues.result();

  return {
    generatedAt: new Date().toISOString(),
    mode: 'read_only_identity_reference_audit',
    privacy: {
      directContactFieldsRead: false,
      referenceIdsReadInMemory: true,
      rawIdsInReport: false,
      sampleReferences: 'sha256 tokens only',
    },
    counts: {
      users: snapshot.users.length,
      parents: snapshot.parents.length,
      teachers: snapshot.teachers.length,
      learningPartners: snapshot.learningPartners.length,
      admins: snapshot.admins.length,
      kids: snapshot.kids.length,
      students: snapshot.students.length,
      nestedParentStudents: snapshot.nestedStudents.length,
      enrollments: snapshot.enrollments.length,
      classSessions: snapshot.classSessions.length,
      schoolUsers: snapshot.schoolUsers.length,
      schools: snapshot.schools.length,
      demoSessions: snapshot.demoSessions.length,
    },
    authBackedIdentity: {
      usersUidPresent,
      usersUidMatchesDocumentId,
      usersUidMatchPct: percentage(usersUidMatchesDocumentId, usersUidPresent),
      usersUserIdPresent,
      usersUserIdMatchesDocumentId,
      usersUserIdMatchPct: percentage(usersUserIdMatchesDocumentId, usersUserIdPresent),
      usersRoleArrayContainsRoleOrLegacyMissing: usersRoleArrayContainsRole,
      expectedRoleMirrors,
      roleMirrors,
    },
    learners: {
      kids: snapshot.kids.length,
      rootStudents: snapshot.students.length,
      nestedParentStudents: snapshot.nestedStudents.length,
      kidsRootStudentsIdOverlap: intersectionSize(context.kidIds, context.rootStudentIds),
      kidsNestedStudentsIdOverlap: intersectionSize(context.kidIds, context.nestedStudentIds),
      rootStudentsNestedStudentsIdOverlap: intersectionSize(context.rootStudentIds, context.nestedStudentIds),
      nestedStudentIdsUnderMultipleParents,
      kidRelationships,
      rootStudentCompatibility,
      nestedStudentCompatibility,
      userChildLinks,
    },
    operationalReferences: {
      enrollments,
      classSessions,
      schoolMembership,
      demos,
    },
    issues: issueResult,
    decisionSupport: {
      existingAuthBackedPersonIds:
        'If users/{documentId} is consistently 1:1 with uid/userId, preserve the existing document ID value as the initial Person ID for existing people, but stop treating Firebase UID as the semantic owner. Represent Firebase as a separate AuthIdentity mapped to Person.',
      newPersonIds:
        'New Person IDs should be generated by Tiny Steps identity infrastructure and must not be derived from email, phone, or a future authentication-provider subject.',
      learnerIdentity:
        'Treat kids/{kidId} as the canonical learner identity candidate. Root students and parents/{parentId}/students are compatibility/projection namespaces until live overlap and reference coverage are reconciled.',
      guardianRelationship:
        'Move authority from users.childIds plus kids parent aliases to GuardianRelationship. Keep childIds/parent fields only as compatibility projections during migration.',
      teacherRelationship:
        'Preserve canonical teacherId field usage, but model teaching responsibility as TeachingAssignment/SessionStaff rather than arrays and aliases. Legacy teacher alias fields remain compatibility-only.',
      organisationMembership:
        'Convert schoolUsers schoolIds/primarySchoolId arrays into OrganisationMembership/RoleAssignment while preserving existing school and user/person identifier values where verified.',
    },
  };
}

async function readCollection(db, name, fields) {
  const query = fields?.length ? db.collection(name).select(...fields) : db.collection(name);
  const snap = await query.get();
  return snap.docs.map((docSnap) => row(docSnap.id, docSnap.ref.path, docSnap.data()));
}

async function readNestedStudents(db) {
  try {
    const snap = await db.collectionGroup('students').select(...SELECT_FIELDS.students).get();
    return {
      mode: 'collection_group',
      rows: snap.docs
        .filter((docSnap) => docSnap.ref.path.split('/').length > 2)
        .map((docSnap) => row(docSnap.id, docSnap.ref.path, docSnap.data())),
    };
  } catch (error) {
    const parents = await readCollection(db, 'parents', ['userId']);
    const output = [];
    const concurrency = 10;
    for (let index = 0; index < parents.length; index += concurrency) {
      const chunk = parents.slice(index, index + concurrency);
      const results = await Promise.all(
        chunk.map(async (parent) => {
          const snap = await db
            .collection('parents')
            .doc(parent.id)
            .collection('students')
            .select(...SELECT_FIELDS.students)
            .get();
          return snap.docs.map((docSnap) => row(docSnap.id, docSnap.ref.path, docSnap.data()));
        }),
      );
      results.forEach((rows) => output.push(...rows));
    }
    return {
      mode: 'per_parent_fallback',
      fallbackReason: error instanceof Error ? error.message.slice(0, 160) : String(error).slice(0, 160),
      rows: output,
    };
  }
}

async function collectSnapshot(db) {
  const [
    users,
    parents,
    teachers,
    learningPartners,
    admins,
    kids,
    students,
    enrollments,
    classSessions,
    schoolUsers,
    schools,
    demoSessions,
    nestedStudentsResult,
  ] = await Promise.all([
    readCollection(db, 'users', SELECT_FIELDS.users),
    readCollection(db, 'parents', SELECT_FIELDS.parents),
    readCollection(db, 'teachers', SELECT_FIELDS.teachers),
    readCollection(db, 'learningPartners', SELECT_FIELDS.learningPartners),
    readCollection(db, 'admins', SELECT_FIELDS.admins),
    readCollection(db, 'kids', SELECT_FIELDS.kids),
    readCollection(db, 'students', SELECT_FIELDS.students),
    readCollection(db, 'enrollments', SELECT_FIELDS.enrollments),
    readCollection(db, 'classSessions', SELECT_FIELDS.classSessions),
    readCollection(db, 'schoolUsers', SELECT_FIELDS.schoolUsers),
    readCollection(db, 'schools', SELECT_FIELDS.schools),
    readCollection(db, 'demoSessions', SELECT_FIELDS.demoSessions),
    readNestedStudents(db),
  ]);

  return {
    users,
    parents,
    teachers,
    learningPartners,
    admins,
    kids,
    students,
    nestedStudents: nestedStudentsResult.rows,
    nestedStudentsReadMode: nestedStudentsResult.mode,
    nestedStudentsFallbackReason: nestedStudentsResult.fallbackReason || null,
    enrollments,
    classSessions,
    schoolUsers,
    schools,
    demoSessions,
  };
}

async function writeReport(reportPath, payload) {
  const absolute = path.resolve(process.cwd(), reportPath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return absolute;
}

function printSummary(report, reportPath) {
  const { counts, issues, operationalReferences, learners } = report;
  console.log('\n=== Tiny Steps Identity & References Audit ===');
  console.log(`Project: ${report.projectId}`);
  console.log(`Source: ${report.source}`);
  console.log(`Users: ${counts.users}; parents: ${counts.parents}; teachers: ${counts.teachers}; kids: ${counts.kids}`);
  console.log(`Enrollments: ${counts.enrollments}; classSessions: ${counts.classSessions}`);
  console.log(`Kids ↔ root students ID overlap: ${learners.kidsRootStudentsIdOverlap}`);
  console.log(`Kids ↔ nested parent students ID overlap: ${learners.kidsNestedStudentsIdOverlap}`);
  console.log(`Enrollment ambiguous learner identities: ${operationalReferences.enrollments.ambiguousLearnerIdentity}`);
  console.log(`ClassSession teacher alias mismatches: ${operationalReferences.classSessions.teacherAliasMismatch}`);
  console.log(`Issues detected: ${issues.total}`);
  console.log(`Report: ${reportPath}`);
  console.log('Read-only audit complete. No Firestore writes were performed.\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage:
  npm run audit:identity-references
  node scripts/audit-identity-references.mjs --project tinysteps-react-v1 --report reports/identity-reference-audit.json

Requires Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS.
The script only issues Firestore reads. It does not read names, email addresses, phone numbers, notes, or financial fields.
Raw document IDs are not written to the report; issue samples use SHA-256 tokens.`);
    return;
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
      projectId: args.projectId,
    });
  }

  const db = getFirestore();
  const snapshot = await collectSnapshot(db);
  const audit = auditIdentitySnapshot(snapshot, { sampleSize: args.sampleSize });
  const report = {
    ...audit,
    projectId: args.projectId,
    source: process.env.FIRESTORE_EMULATOR_HOST ? 'firestore_emulator' : 'firestore',
    nestedStudentsReadMode: snapshot.nestedStudentsReadMode,
    nestedStudentsFallbackReason: snapshot.nestedStudentsFallbackReason,
  };
  const reportPath = await writeReport(args.report, report);
  printSummary(report, reportPath);
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error('Identity/reference audit failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
