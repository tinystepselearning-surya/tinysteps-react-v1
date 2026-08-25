import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const ACTIVE_TEACHER_READERS = [
  'src/pages/teacher/hooks/useTeacherSessions.ts',
  'src/pages/teacher/hooks/useUpcomingSessions.ts',
  'src/pages/teacher/components/students/TeacherMyStudentsV2.tsx',
  'src/hooks/useTeacherFilteredData.ts',
  'src/pages/teacher/hooks/useTeacherStudents.ts',
] as const;

const LEGACY_ALIAS_QUERY_PATTERNS = [
  /where\(\s*['\"]teacherIds['\"]/,
  /where\(\s*['\"]assignedTeacherId['\"]/,
  /where\(\s*['\"]primaryTeacherId['\"]/,
  /where\(\s*['\"]teacherUid['\"]/,
  /where\(\s*['\"]teacher_id['\"]/,
] as const;

describe('B4 canonical teacher collection reads', () => {
  it.each(ACTIVE_TEACHER_READERS)('%s does not call the legacy alias collection fallback helper', (path) => {
    const source = fs.readFileSync(path, 'utf8');
    expect(source).not.toContain('fetchTeacherSessionAliasFallbacks');
  });

  it.each(ACTIVE_TEACHER_READERS)('%s does not query operational legacy teacher aliases', (path) => {
    const source = fs.readFileSync(path, 'utf8');
    LEGACY_ALIAS_QUERY_PATTERNS.forEach((pattern) => expect(source).not.toMatch(pattern));
  });

  it('preserves kids.teacherIds because child-level multi-teacher relationships are legitimate', () => {
    const source = fs.readFileSync('src/pages/teacher/hooks/useTeacherStudents.ts', 'utf8');
    expect(source).toContain("where('teacherIds', 'array-contains', teacherId)");
    expect(source).toContain('kids-by-teacherIds-fallback');
  });
});
