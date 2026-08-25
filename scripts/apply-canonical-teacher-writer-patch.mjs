#!/usr/bin/env node

import fs from 'node:fs';

const replacements = [];

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function write(path, content) {
  fs.writeFileSync(path, content, 'utf8');
}

function replaceOnce(path, before, after, label) {
  const source = read(path);
  const count = source.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: expected exactly one match in ${path}, found ${count}`);
  }
  write(path, source.replace(before, after));
  replacements.push(label);
}

function replaceRegexOnce(path, pattern, after, label) {
  const source = read(path);
  const matches = source.match(pattern);
  if (!matches) {
    throw new Error(`${label}: expected one regex match in ${path}, found 0`);
  }
  const withoutFirst = source.replace(pattern, '');
  if (pattern.test(withoutFirst)) {
    throw new Error(`${label}: regex matched more than once in ${path}`);
  }
  write(path, source.replace(pattern, after));
  replacements.push(label);
}

// Cloud Function: regular schedule generation and repair.
replaceOnce(
  'functions/src/createSessionsFromSchedule.ts',
  'import {ensureAdmin} from "./helpers/adminGuard";\n',
  'import {ensureAdmin} from "./helpers/adminGuard";\nimport {buildCanonicalTeacherWriteFields, resolveCanonicalTeacherIdForWrite} from "./helpers/teacherIdentity";\n',
  'schedule-generator helper import',
);
replaceRegexOnce(
  'functions/src/createSessionsFromSchedule.ts',
  /function resolveEnrollmentTeacherIdentity\(enrollment: EnrollmentDoc\): \{ teacherId: string \| null; teacherIds: string\[\] \} \{[\s\S]*?\n\}\n\nfunction removeUndefinedDeep/,
  `function resolveEnrollmentTeacherIdentity(enrollment: EnrollmentDoc): { teacherId: string | null; teacherIds: string[] } {\n  const resolution = resolveCanonicalTeacherIdForWrite(enrollment as Record<string, unknown>);\n  if (resolution.source === "ambiguous_legacy") {\n    throw new HttpsError(\n      "failed-precondition",\n      "Enrollment has conflicting legacy teacher identities. Repair canonical teacherId before generating sessions.",\n    );\n  }\n  const teacherId = resolution.teacherId;\n  return { teacherId, teacherIds: teacherId ? [teacherId] : [] };\n}\n\nfunction removeUndefinedDeep`,
  'schedule-generator canonical resolver',
);
replaceOnce(
  'functions/src/createSessionsFromSchedule.ts',
  `      teacherId,\n      ...(teacherIds.length > 0 ? {teacherIds} : {}),\n      ...(teacherName ? {teacherName} : {}),\n      ...(teacherEmail ? {teacherEmail} : {}),\n      ...(teacherId ? {assignedTeacherId: teacherId, primaryTeacherId: teacherId, teacherUid: teacherId, teacher_id: teacherId} : {}),\n`,
  `      teacherId,\n      ...(teacherId ? buildCanonicalTeacherWriteFields(teacherId) : {}),\n      ...(teacherName ? {teacherName} : {}),\n      ...(teacherEmail ? {teacherEmail} : {}),\n`,
  'schedule-generator session aliases',
);
replaceOnce(
  'functions/src/createSessionsFromSchedule.ts',
  `    teacherId: context.teacherId,\n    ...(context.teacherIds.length > 0 ? { teacherIds: context.teacherIds } : {}),\n    ...(context.teacherId ? {\n      assignedTeacherId: context.teacherId,\n      primaryTeacherId: context.teacherId,\n      teacherUid: context.teacherId,\n      teacher_id: context.teacherId,\n    } : {}),\n`,
  `    teacherId: context.teacherId,\n    ...(context.teacherId ? buildCanonicalTeacherWriteFields(context.teacherId) : {}),\n`,
  'schedule-repair session aliases',
);

// Cloud Function: teacher-created makeup session.
replaceOnce(
  'functions/src/createMakeupSessionFromCredit.ts',
  "import * as logger from 'firebase-functions/logger';\n",
  "import * as logger from 'firebase-functions/logger';\nimport { buildCanonicalTeacherWriteFields } from './helpers/teacherIdentity';\n",
  'makeup helper import',
);
replaceOnce(
  'functions/src/createMakeupSessionFromCredit.ts',
  `        teacherId,\n        teacherIds: [teacherId],\n        ...(teacherName ? {teacherName} : {}),\n        ...(teacherEmail ? {teacherEmail} : {}),\n        assignedTeacherId: teacherId,\n        primaryTeacherId: teacherId,\n        teacherUid: teacherId,\n        teacher_id: teacherId,\n`,
  `        ...buildCanonicalTeacherWriteFields(teacherId),\n        ...(teacherName ? {teacherName} : {}),\n        ...(teacherEmail ? {teacherEmail} : {}),\n`,
  'makeup canonical aliases',
);

// Cloud Function: historical attendance correction. Alternate doc/UID identities remain validation-only.
replaceOnce(
  'functions/src/createAdminHistoricalAttendanceSession.ts',
  "import { normalizeEnrollmentStatus } from './helpers/status';\n",
  "import { normalizeEnrollmentStatus } from './helpers/status';\nimport { buildCanonicalTeacherWriteFields } from './helpers/teacherIdentity';\n",
  'historical helper import',
);
replaceOnce(
  'functions/src/createAdminHistoricalAttendanceSession.ts',
  `      teacherId: teacherIdentity.teacherId,\n      teacherIds: teacherIdentity.identityIds,\n      assignedTeacherId: teacherIdentity.teacherId,\n      primaryTeacherId: teacherIdentity.teacherId,\n      teacherUid: teacherIdentity.teacherId,\n      teacher_id: teacherIdentity.teacherId,\n`,
  `      ...buildCanonicalTeacherWriteFields(teacherIdentity.teacherId),\n`,
  'historical canonical aliases',
);

// Cloud Function: transferred-session snapshot repair.
replaceOnce(
  'functions/src/repairTransferredTeacherSessionSnapshots.ts',
  "import { ensureAdmin } from './helpers/adminGuard';\n",
  "import { ensureAdmin } from './helpers/adminGuard';\nimport { buildCanonicalTeacherWriteFields } from './helpers/teacherIdentity';\n",
  'transfer-repair helper import',
);
replaceOnce(
  'functions/src/repairTransferredTeacherSessionSnapshots.ts',
  `      teacherId: toTeacherUid,\n      teacherIds: [toTeacherUid],\n      assignedTeacherId: toTeacherUid,\n      primaryTeacherId: toTeacherUid,\n      teacherUid: toTeacherUid,\n      teacher_id: toTeacherUid,\n`,
  `      ...buildCanonicalTeacherWriteFields(toTeacherUid),\n`,
  'transfer-repair canonical aliases',
);

// Core enrollment lifecycle and teacher reassignment.
replaceOnce(
  'functions/src/lifecycle.ts',
  "import { repairEnrollmentFutureSessionsFromScheduleInternal } from './createSessionsFromSchedule';\n",
  "import { repairEnrollmentFutureSessionsFromScheduleInternal } from './createSessionsFromSchedule';\nimport {\n  buildCanonicalTeacherWriteFields,\n  buildEnrollmentTeacherWriteFields,\n  resolveCanonicalTeacherIdForWrite,\n} from './helpers/teacherIdentity';\n",
  'lifecycle helper import',
);
replaceOnce(
  'functions/src/lifecycle.ts',
  `      teacherId,\n      teacherIds: teacherId ? [teacherId] : [],\n      lpId: assignedLpId,\n`,
  `      ...buildEnrollmentTeacherWriteFields(teacherId),\n      lpId: assignedLpId,\n`,
  'enrollment creation canonical identity',
);
replaceOnce(
  'functions/src/lifecycle.ts',
  `    teacherId: teacher.teacherId,\n    teacherIds: teacher.teacherIds,\n    teacherName: teacher.teacherName,\n    teacherDisplayName: teacher.teacherDisplayName,\n    teacherEmail: teacher.teacherEmail,\n    assignedTeacherId: teacher.teacherId,\n    primaryTeacherId: teacher.teacherId,\n    teacherUid: teacher.teacherId,\n    teacher_id: teacher.teacherId,\n`,
  `    ...buildCanonicalTeacherWriteFields(teacher.teacherId),\n    teacherName: teacher.teacherName,\n    teacherDisplayName: teacher.teacherDisplayName,\n    teacherEmail: teacher.teacherEmail,\n`,
  'lifecycle session repair aliases',
);
replaceOnce(
  'functions/src/lifecycle.ts',
  `  const teacherIds = toStringList(enrollment.teacherIds);\n  const teacherId = toOptionalId(enrollment.teacherId) || teacherIds[0] || null;\n  if (!kidId || !courseId || !teacherId) {\n`,
  `  const teacherResolution = resolveCanonicalTeacherIdForWrite(enrollment);\n  if (teacherResolution.source === 'ambiguous_legacy') {\n    throw new HttpsError(\n      'failed-precondition',\n      'Enrollment has conflicting legacy teacher identities. Repair canonical teacherId before creating a manual session.',\n    );\n  }\n  const teacherId = teacherResolution.teacherId;\n  if (!kidId || !courseId || !teacherId) {\n`,
  'manual-session canonical resolver',
);
replaceOnce(
  'functions/src/lifecycle.ts',
  `    const canonicalTeacherIds = Array.from(new Set([teacherId, ...teacherIds]));\n`,
  ``,
  'manual-session remove mixed teacher aliases',
);
replaceOnce(
  'functions/src/lifecycle.ts',
  `      teacherId,\n      teacherIds: canonicalTeacherIds,\n      assignedTeacherId: teacherId,\n      primaryTeacherId: teacherId,\n      teacherUid: teacherId,\n      teacher_id: teacherId,\n`,
  `      ...buildCanonicalTeacherWriteFields(teacherId),\n`,
  'manual-session canonical aliases',
);
replaceOnce(
  'functions/src/lifecycle.ts',
  `  const enrollmentPatch: Record<string, unknown> = {\n    teacherId: newTeacherId,\n    teacherIds,\n    teacherName: newTeacherName,\n    teacherEmail: newTeacherEmail || null,\n    teacherDisplayName: newTeacherDisplayName || newTeacherName,\n    assignedTeacherId: newTeacherId,\n    primaryTeacherId: newTeacherId,\n    teacherUid: newTeacherId,\n    teacher_id: newTeacherId,\n`,
  `  const enrollmentPatch: Record<string, unknown> = {\n    ...buildCanonicalTeacherWriteFields(newTeacherId),\n    teacherName: newTeacherName,\n    teacherEmail: newTeacherEmail || null,\n    teacherDisplayName: newTeacherDisplayName || newTeacherName,\n`,
  'teacher reassignment enrollment aliases',
);

// Client: admin-approved one-off session request.
replaceOnce(
  'src/pages/admin/StudentManagement/StudentList.tsx',
  "import { doesSessionMatchEnrollmentSchedule } from '../../../lib/sessionScheduleIntegrity';\n",
  "import { doesSessionMatchEnrollmentSchedule } from '../../../lib/sessionScheduleIntegrity';\nimport { buildCanonicalOperationalTeacherWriteFields } from '../../../lib/teacherIdentity';\n",
  'student-list helper import',
);
replaceOnce(
  'src/pages/admin/StudentManagement/StudentList.tsx',
  `        teacherId: req.teacherId,\n        ...(req.teacherId ? {\n          teacherIds: [req.teacherId],\n          assignedTeacherId: req.teacherId,\n          primaryTeacherId: req.teacherId,\n          teacherUid: req.teacherId,\n          teacher_id: req.teacherId,\n        } : {}),\n`,
  `        ...buildCanonicalOperationalTeacherWriteFields(req.teacherId),\n`,
  'admin-approved session canonical aliases',
);

// Client: next-course enrollment inheritance keeps only canonical enrollment fields.
replaceOnce(
  'src/pages/admin/EnrollmentManagement/EnrollmentDetailView.tsx',
  "import { db, functions } from '../../../lib/firebaseConfig';\n",
  "import { db, functions } from '../../../lib/firebaseConfig';\nimport { buildCanonicalEnrollmentTeacherWriteFields } from '../../../lib/teacherIdentity';\n",
  'enrollment-detail helper import',
);
replaceOnce(
  'src/pages/admin/EnrollmentManagement/EnrollmentDetailView.tsx',
  `        const inheritedFields: Record<string, unknown> = {\n          teacherId: newTeacherId,\n          teacherIds: [newTeacherId],\n          schedule: newSchedule,\n`,
  `        const inheritedFields: Record<string, unknown> = {\n          ...buildCanonicalEnrollmentTeacherWriteFields(newTeacherId),\n          schedule: newSchedule,\n`,
  'course-transition canonical enrollment identity',
);

console.log(`Applied ${replacements.length} guarded canonical teacher writer transformations.`);
for (const label of replacements) console.log(`- ${label}`);
