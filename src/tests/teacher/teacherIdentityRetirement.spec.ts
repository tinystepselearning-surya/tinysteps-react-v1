import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const OPERATIONAL_ALIAS_QUERY_PATTERNS = [
  /where\(\s*['\"]teacherIds['\"]\s*,\s*['\"]array-contains/,
  /where\(\s*['\"]assignedTeacherId['\"]\s*,/,
  /where\(\s*['\"]primaryTeacherId['\"]\s*,/,
  /where\(\s*['\"]teacherUid['\"]\s*,/,
  /where\(\s*['\"]teacher_id['\"]\s*,/,
] as const;

const ACTIVE_OPERATIONAL_READERS = [
  'src/pages/teacher/hooks/useTeacherSessions.ts',
  'src/pages/teacher/hooks/useUpcomingSessions.ts',
  'src/pages/teacher/components/students/TeacherMyStudentsV2.tsx',
  'src/hooks/useTeacherFilteredData.ts',
  'src/pages/admin/AttendanceCorrectionsAdvancedPanel.tsx',
] as const;

function walkTsFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkTsFiles(fullPath));
    } else if (/\.[cm]?[jt]sx?$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('B5 operational teacher identity retirement', () => {
  it.each(ACTIVE_OPERATIONAL_READERS)('%s contains no operational legacy teacher alias queries', (filePath) => {
    const source = fs.readFileSync(filePath, 'utf8');
    OPERATIONAL_ALIAS_QUERY_PATTERNS.forEach((pattern) => expect(source).not.toMatch(pattern));
  });

  it('keeps kids.teacherIds because child-level multi-course teacher relationships are legitimate', () => {
    const source = fs.readFileSync('src/pages/teacher/hooks/useTeacherStudents.ts', 'utf8');
    expect(source).toContain("where('teacherIds', 'array-contains', teacherId)");
  });

  it('keeps the old generic useSessionsForTeacher hook unreferenced by production code until it is physically deleted', () => {
    const useDataPath = path.normalize('src/hooks/useData.ts');
    const references = walkTsFiles('src')
      .filter((filePath) => path.normalize(filePath) !== useDataPath)
      .filter((filePath) => !path.normalize(filePath).includes(`${path.sep}tests${path.sep}`))
      .filter((filePath) => fs.readFileSync(filePath, 'utf8').includes('useSessionsForTeacher'));

    expect(references).toEqual([]);
  });
});
