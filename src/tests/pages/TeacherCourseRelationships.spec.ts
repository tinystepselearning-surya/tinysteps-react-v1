import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const hookSource = readFileSync(
  join(process.cwd(), 'src/pages/teacher/hooks/useTeacherStudents.ts'),
  'utf8',
);
const listSource = readFileSync(
  join(process.cwd(), 'src/pages/teacher/components/students/StudentsList.tsx'),
  'utf8',
);

describe('teacher course relationship identity', () => {
  it('emits one roster relationship per enrollment instead of choosing one child-level enrollment', () => {
    expect(hookSource).toContain('kidDocs.flatMap');
    expect(hookSource).toContain('return enrollments.map');
    expect(hookSource).toContain('enrollmentId: String(enrollment.id)');
    expect(hookSource).not.toContain('pickMostRecent');
  });

  it('keys rendered teacher roster cards by enrollment relationship', () => {
    expect(listSource).toContain('key={student.enrollmentId}');
  });
});
