#!/usr/bin/env node

import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const write = (path, content) => fs.writeFileSync(path, content);

const replaceOnce = (content, needle, replacement, label) => {
  const first = content.indexOf(needle);
  if (first < 0) throw new Error(`Missing expected source shape: ${label}`);
  if (content.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`Expected exactly one source shape: ${label}`);
  }
  return `${content.slice(0, first)}${replacement}${content.slice(first + needle.length)}`;
};

const replaceRegexOnce = (content, regex, replacement, label) => {
  const matches = [...content.matchAll(regex)];
  if (matches.length !== 1) {
    throw new Error(`Expected one ${label}, found ${matches.length}`);
  }
  return content.replace(regex, replacement);
};

// 1) Shared canonical-first ownership predicate.
{
  const path = 'src/lib/teacherIdentity.ts';
  let content = read(path);
  const anchor = `export const buildCanonicalOperationalTeacherWriteFields = (\n`;
  const helper = `export const operationalTeacherRecordBelongsTo = (\n  record: Record<string, unknown> | undefined,\n  teacherId: unknown,\n): boolean => {\n  const expectedTeacherId = normalizeTeacherIdentityValue(teacherId);\n  if (!record || !expectedTeacherId) return false;\n\n  const canonicalTeacherId = normalizeTeacherIdentityValue(record.teacherId);\n  if (canonicalTeacherId) return canonicalTeacherId === expectedTeacherId;\n\n  return collectLegacyTeacherIdentityRefs(record).includes(expectedTeacherId);\n};\n\n`;
  content = replaceOnce(content, anchor, `${helper}${anchor}`, 'teacher identity write-helper anchor');
  write(path, content);
}

// 2) Shared helper regression tests.
{
  const path = 'src/tests/lib/teacherIdentity.spec.ts';
  let content = read(path);
  content = replaceOnce(
    content,
    `  collectLegacyTeacherIdentityRefs,\n  resolveOperationalTeacherId,\n`,
    `  collectLegacyTeacherIdentityRefs,\n  operationalTeacherRecordBelongsTo,\n  resolveOperationalTeacherId,\n`,
    'teacherIdentity import list',
  );
  const anchor = `  it('preserves legacy resolution for records that do not yet have teacherId', () => {\n`;
  const tests = `  it('uses canonical teacherId as the only owner when stale aliases disagree', () => {\n    const record = {\n      teacherId: 'teacher-b',\n      assignedTeacherId: 'teacher-a',\n      teacherIds: ['teacher-a'],\n    };\n\n    expect(operationalTeacherRecordBelongsTo(record, 'teacher-b')).toBe(true);\n    expect(operationalTeacherRecordBelongsTo(record, 'teacher-a')).toBe(false);\n  });\n\n  it('retains direct legacy ownership compatibility only when canonical teacherId is absent', () => {\n    const record = { assignedTeacherId: 'legacy-teacher' };\n    expect(operationalTeacherRecordBelongsTo(record, 'legacy-teacher')).toBe(true);\n    expect(operationalTeacherRecordBelongsTo(record, 'other-teacher')).toBe(false);\n  });\n\n`;
  content = replaceOnce(content, anchor, `${tests}${anchor}`, 'teacher identity legacy resolution test anchor');
  write(path, content);
}

const ownershipImports = `import {\n  operationalTeacherRecordBelongsTo,\n  resolveOperationalTeacherId,\n} from '../../../lib/teacherIdentity';\n`;

// 3) Today / Schedule session reader: canonical realtime only.
{
  const path = 'src/pages/teacher/hooks/useTeacherSessions.ts';
  let content = read(path);
  content = replaceOnce(
    content,
    `import {\n  buildCanonicalTeacherSessionQuery,\n  fetchTeacherSessionAliasFallbacks,\n  makeTeacherFallbackCacheKey,\n  mergeAndDedupeSessionDocs,\n} from './teacherSessionOwnership';\n`,
    `import {\n  buildCanonicalTeacherSessionQuery,\n  mergeAndDedupeSessionDocs,\n} from './teacherSessionOwnership';\n${ownershipImports}`,
    'useTeacherSessions ownership imports',
  );
  content = replaceRegexOnce(
    content,
    /const normalizeTeacherIds = \(doc: any\): string\[\] => \{[\s\S]*?const resolveTeacherId = \(doc: any\): string => \{\n  return normalizeTeacherIds\(doc\)\[0\] \|\| '';\n\};\n/,
    `const sessionBelongsToTeacher = (doc: any, teacherId: string): boolean =>\n  operationalTeacherRecordBelongsTo(doc as Record<string, unknown>, teacherId);\n\nconst resolveTeacherId = (doc: any): string =>\n  resolveOperationalTeacherId(doc as Record<string, unknown>);\n`,
    'useTeacherSessions local alias ownership helpers',
  );
  content = replaceOnce(
    content,
    `    const fallbackCache = new Map<string, TeacherSession[]>();\n    const fallbackCacheKey = makeTeacherFallbackCacheKey(teacherKey, \`${'${start}::${end}'}\`);\n    let fallbackPromise: Promise<void> | null = null;\n`,
    '',
    'useTeacherSessions fallback state',
  );
  content = replaceOnce(
    content,
    `        ...Array.from(liveDocsBySource.values()).map((sourceRows) => sourceRows.values()),\n        (fallbackCache.get(fallbackCacheKey) || []).values(),\n`,
    `        ...Array.from(liveDocsBySource.values()).map((sourceRows) => sourceRows.values()),\n`,
    'useTeacherSessions merged fallback rows',
  );
  content = replaceRegexOnce(
    content,
    /    const ensureFallbackRows = \(\) => \{[\s\S]*?\n    \};\n\n    devLogTeacherQuery\('useTeacherSessions', 'listen',/,
    `    devLogTeacherQuery('useTeacherSessions', 'listen',`,
    'useTeacherSessions ensureFallbackRows block',
  );
  content = replaceOnce(content, `        ensureFallbackRows();\n`, '', 'useTeacherSessions fallback invocation');
  write(path, content);
}

// 4) Upcoming sessions: canonical realtime only.
{
  const path = 'src/pages/teacher/hooks/useUpcomingSessions.ts';
  let content = read(path);
  content = replaceOnce(
    content,
    `import {\n  buildCanonicalTeacherSessionQuery,\n  fetchTeacherSessionAliasFallbacks,\n  makeTeacherFallbackCacheKey,\n  mergeAndDedupeSessionDocs,\n} from './teacherSessionOwnership';\n`,
    `import {\n  buildCanonicalTeacherSessionQuery,\n  mergeAndDedupeSessionDocs,\n} from './teacherSessionOwnership';\n${ownershipImports}`,
    'useUpcomingSessions ownership imports',
  );
  content = replaceRegexOnce(
    content,
    /const normalizeTeacherIds = \(doc: any\): string\[\] => \{[\s\S]*?const sessionBelongsToTeacher = \(doc: any, teacherId: string\): boolean => \{\n  if \(!teacherId\) return false;\n  return normalizeTeacherIds\(doc\)\.includes\(teacherId\);\n\};\n/,
    `const normalizeTeacherIds = (doc: any): string[] => {\n  const resolvedTeacherId = resolveOperationalTeacherId(doc as Record<string, unknown>);\n  return resolvedTeacherId ? [resolvedTeacherId] : [];\n};\n\nconst resolveTeacherId = (doc: any): string =>\n  resolveOperationalTeacherId(doc as Record<string, unknown>);\n\nconst sessionBelongsToTeacher = (doc: any, teacherId: string): boolean =>\n  operationalTeacherRecordBelongsTo(doc as Record<string, unknown>, teacherId);\n`,
    'useUpcomingSessions local alias ownership helpers',
  );
  content = replaceOnce(
    content,
    `    const fallbackCache = new Map<string, TeacherSession[]>();\n    const fallbackCacheKey = makeTeacherFallbackCacheKey(teacherId, targetDate);\n    let fallbackPromise: Promise<void> | null = null;\n`,
    '',
    'useUpcomingSessions fallback state',
  );
  content = replaceOnce(
    content,
    `        ...Array.from(liveDocsBySource.values()).map((rows) => rows.values()),\n        (fallbackCache.get(fallbackCacheKey) || []).values(),\n`,
    `        ...Array.from(liveDocsBySource.values()).map((rows) => rows.values()),\n`,
    'useUpcomingSessions merged fallback rows',
  );
  content = replaceRegexOnce(
    content,
    /    const listeners: Array<\(\) => void> = \[\];\n    const ensureFallbackRows = \(\) => \{[\s\S]*?\n    \};\n\n    const attachListener =/,
    `    const listeners: Array<() => void> = [];\n\n    const attachListener =`,
    'useUpcomingSessions ensureFallbackRows block',
  );
  content = replaceOnce(
    content,
    `          if (sourceKey === 'primary') {\n            ensureFallbackRows();\n          }\n`,
    '',
    'useUpcomingSessions fallback invocation',
  );
  write(path, content);
}

// 5) My Students: teacherId-only enrollment/session collection queries.
{
  const path = 'src/pages/teacher/components/students/TeacherMyStudentsV2.tsx';
  let content = read(path);
  content = replaceOnce(
    content,
    `import { fetchTeacherSessionAliasFallbacks } from '../../hooks/teacherSessionOwnership';\n`,
    `import { operationalTeacherRecordBelongsTo } from '../../../../lib/teacherIdentity';\n`,
    'TeacherMyStudents alias helper import',
  );
  content = replaceRegexOnce(
    content,
    /function normalizeTeacherIds\(row: Record<string, unknown> \| undefined\): string\[\] \{[\s\S]*?\n\}\n\nfunction titleCaseFromId/,
    `function titleCaseFromId`,
    'TeacherMyStudents normalizeTeacherIds helper',
  );
  content = replaceRegexOnce(
    content,
    /function isIndexError\(error: unknown\): boolean \{[\s\S]*?\n\}\n\nfunction devLogMyStudents/,
    `function devLogMyStudents`,
    'TeacherMyStudents isIndexError helper',
  );
  content = replaceRegexOnce(
    content,
    /async function fetchTeacherEnrollments\(teacherId: string\): Promise<TeacherAliasQueryResult<Enrollment>> \{[\s\S]*?\n\}\n\nasync function fetchTeacherSessionsWindow/,
    `async function fetchTeacherEnrollments(teacherId: string): Promise<TeacherAliasQueryResult<Enrollment>> {\n  const base = collection(db, 'enrollments');\n  const merged = new Map<string, Enrollment>();\n  const primarySnap = await getDocsLogged(\n    'TeacherMyStudentsV2:enrollments:teacherId',\n    query(base, where('teacherId', '==', teacherId)),\n    { source: 'src/pages/teacher/components/students/TeacherMyStudentsV2.tsx' },\n  );\n\n  primarySnap.docs.forEach((docSnap) => {\n    const data = { id: docSnap.id, ...(docSnap.data() as any) } as Enrollment;\n    if (!operationalTeacherRecordBelongsTo(data as Record<string, unknown>, teacherId)) return;\n    const dedupeKey = resolveEnrollmentDedupKey(data);\n    merged.set(dedupeKey, { ...merged.get(dedupeKey), ...data });\n  });\n\n  devLogMyStudents('debug', 'loaded canonical enrollments', {\n    teacherId,\n    rows: merged.size,\n  });\n\n  return { rows: Array.from(merged.values()), deniedAliases: [] };\n}\n\nasync function fetchTeacherSessionsWindow`,
    'TeacherMyStudents enrollment reader',
  );
  content = replaceRegexOnce(
    content,
    /async function fetchTeacherSessionsWindow\(teacherId: string\): Promise<TeacherAliasQueryResult<ClassSession>> \{[\s\S]*?\n\}\n\nexport function TeacherMyStudentsV2/,
    `async function fetchTeacherSessionsWindow(teacherId: string): Promise<TeacherAliasQueryResult<ClassSession>> {\n  const now = Date.now();\n  const start = Timestamp.fromMillis(now - WINDOW_DAYS * 24 * 60 * 60 * 1000);\n  const end = Timestamp.fromMillis(now + WINDOW_DAYS * 24 * 60 * 60 * 1000);\n  const startMs = start.toMillis();\n  const endMs = end.toMillis();\n  const base = collection(db, 'classSessions');\n  const merged = new Map<string, ClassSession>();\n\n  try {\n    const primarySnap = await getDocsLogged(\n      'TeacherMyStudentsV2:sessions-window:teacherId',\n      query(base, where('teacherId', '==', teacherId), where('startAt', '>=', start), where('startAt', '<=', end)),\n      { source: 'src/pages/teacher/components/students/TeacherMyStudentsV2.tsx' },\n    );\n\n    primarySnap.docs.forEach((docSnap) => {\n      const data = { id: docSnap.id, ...(docSnap.data() as any) } as ClassSession;\n      if (!operationalTeacherRecordBelongsTo(data as Record<string, unknown>, teacherId)) return;\n      const startAtMs = toMillis(data.startAt);\n      if (!startAtMs || startAtMs < startMs || startAtMs > endMs) return;\n      merged.set(docSnap.id, data);\n    });\n  } catch (error) {\n    if (isPermissionDeniedError(error)) {\n      throw createPermissionDeniedError('Unable to load session history due to permissions');\n    }\n    throw error;\n  }\n\n  devLogMyStudents('debug', 'loaded canonical classSessions window', {\n    teacherId,\n    rows: merged.size,\n  });\n\n  return { rows: Array.from(merged.values()), deniedAliases: [] };\n}\n\nexport function TeacherMyStudentsV2`,
    'TeacherMyStudents session reader',
  );
  write(path, content);
}

// 6) Filtered-student selector: canonical enrollment query only.
{
  const path = 'src/hooks/useTeacherFilteredData.ts';
  let content = read(path);
  content = replaceOnce(
    content,
    `import { fetchTeacherSessionAliasFallbacks } from '../pages/teacher/hooks/teacherSessionOwnership';\n`,
    `import { operationalTeacherRecordBelongsTo } from '../lib/teacherIdentity';\n`,
    'useTeacherFilteredData alias helper import',
  );
  content = replaceRegexOnce(
    content,
    /const normalizeTeacherIds = \(row: Record<string, unknown> \| undefined\): string\[\] => \{[\s\S]*?\n\};\n\nconst extractEntityIds/,
    `const extractEntityIds`,
    'useTeacherFilteredData normalizeTeacherIds',
  );
  content = replaceOnce(
    content,
    `  const deniedAliases: string[] = [];\n\n`,
    '',
    'useTeacherFilteredData deniedAliases state',
  );
  content = replaceOnce(
    content,
    `      if (!normalizeTeacherIds(row).includes(teacherId)) return;\n`,
    `      if (!operationalTeacherRecordBelongsTo(row, teacherId)) return;\n`,
    'useTeacherFilteredData ownership filter',
  );
  content = replaceRegexOnce(
    content,
    /\n  const teacherIdsFallback = await fetchTeacherSessionAliasFallbacks<EnrollmentRow>\([\s\S]*?\n  mergeRows\(teacherIdsFallback\.rows\);\n\n  if \(merged\.size === 0\) \{[\s\S]*?\n  \}\n/,
    `\n`,
    'useTeacherFilteredData alias fallbacks',
  );
  content = replaceOnce(
    content,
    `    deniedAliases,\n`,
    '',
    'useTeacherFilteredData debug deniedAliases',
  );
  write(path, content);
}

// 7) Teacher students: keep legitimate kids.teacherIds fallback, cut enrollment aliases.
{
  const path = 'src/pages/teacher/hooks/useTeacherStudents.ts';
  let content = read(path);
  content = replaceOnce(
    content,
    `import { fetchTeacherSessionAliasFallbacks } from './teacherSessionOwnership';\n`,
    `import { operationalTeacherRecordBelongsTo } from '../../../lib/teacherIdentity';\n`,
    'useTeacherStudents alias helper import',
  );
  content = replaceRegexOnce(
    content,
    /const normalizeTeacherIds = \(row: Record<string, unknown> \| undefined\): string\[\] => \{[\s\S]*?\n\};\n\nconst fetchTeacherStudents/,
    `const fetchTeacherStudents`,
    'useTeacherStudents normalizeTeacherIds helper',
  );
  content = replaceRegexOnce(
    content,
    /\n  if \(enrollmentDocsById\.size === 0\) \{\n    const fallback = await fetchTeacherSessionAliasFallbacks[\s\S]*?\n  \}\n\n  enrollmentDocsById\.forEach/,
    `\n\n  enrollmentDocsById.forEach`,
    'useTeacherStudents enrollment alias fallback',
  );
  content = replaceOnce(
    content,
    `      normalizeTeacherIds(enrollment as Record<string, unknown>).includes(teacherId),\n`,
    `      operationalTeacherRecordBelongsTo(enrollment as Record<string, unknown>, teacherId),\n`,
    'useTeacherStudents enrollment ownership filter',
  );
  write(path, content);
}

// 8) Source-level guard: active teacher readers must not reintroduce alias collection queries.
{
  const path = 'src/tests/teacher/teacherReadCutover.spec.ts';
  fs.mkdirSync('src/tests/teacher', { recursive: true });
  const content = `import fs from 'node:fs';\nimport { describe, expect, it } from 'vitest';\n\nconst ACTIVE_TEACHER_READERS = [\n  'src/pages/teacher/hooks/useTeacherSessions.ts',\n  'src/pages/teacher/hooks/useUpcomingSessions.ts',\n  'src/pages/teacher/components/students/TeacherMyStudentsV2.tsx',\n  'src/hooks/useTeacherFilteredData.ts',\n  'src/pages/teacher/hooks/useTeacherStudents.ts',\n] as const;\n\nconst LEGACY_ALIAS_QUERY_PATTERNS = [\n  /where\\(\\s*['\\\"]teacherIds['\\\"]/,\n  /where\\(\\s*['\\\"]assignedTeacherId['\\\"]/,\n  /where\\(\\s*['\\\"]primaryTeacherId['\\\"]/,\n  /where\\(\\s*['\\\"]teacherUid['\\\"]/,\n  /where\\(\\s*['\\\"]teacher_id['\\\"]/,\n] as const;\n\ndescribe('B4 canonical teacher collection reads', () => {\n  it.each(ACTIVE_TEACHER_READERS)('%s does not call the legacy alias collection fallback helper', (path) => {\n    const source = fs.readFileSync(path, 'utf8');\n    expect(source).not.toContain('fetchTeacherSessionAliasFallbacks');\n  });\n\n  it.each(ACTIVE_TEACHER_READERS)('%s does not query operational legacy teacher aliases', (path) => {\n    const source = fs.readFileSync(path, 'utf8');\n    LEGACY_ALIAS_QUERY_PATTERNS.forEach((pattern) => expect(source).not.toMatch(pattern));\n  });\n\n  it('preserves kids.teacherIds because child-level multi-teacher relationships are legitimate', () => {\n    const source = fs.readFileSync('src/pages/teacher/hooks/useTeacherStudents.ts', 'utf8');\n    expect(source).toContain("where('teacherIds', 'array-contains', teacherId)");\n    expect(source).toContain('kids-by-teacherIds-fallback');\n  });\n});\n`;
  write(path, content);
}

console.log('B4 canonical teacher read cutover patch applied successfully.');
