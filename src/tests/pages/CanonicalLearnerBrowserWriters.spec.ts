import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) =>
  readFileSync(join(process.cwd(), path), 'utf8');

const inlineManagement = read(
  'src/pages/admin/StudentManagement/StudentManagement.tsx',
);
const editStudent = read(
  'src/pages/admin/StudentManagement/EditStudentForm.tsx',
);
const assignLp = read(
  'src/pages/admin/StudentManagement/AssignLPModal.tsx',
);
const kidsService = read('src/services/kidsService.ts');

describe('Wave 1 R4 browser learner writers', () => {
  it('routes the inline learner create path through adminCreateStudent', () => {
    expect(inlineManagement).toContain(
      "httpsCallable(functions, 'adminCreateStudent')",
    );
    expect(inlineManagement).not.toContain(
      "addDoc(collection(db, 'kids')",
    );
  });

  it('routes learner profile edits through adminUpdateStudent', () => {
    expect(editStudent).toContain(
      "httpsCallable(functions, 'adminUpdateStudent')",
    );
    expect(editStudent).not.toContain('updateKid(');
    expect(editStudent).not.toContain(
      "from '../../../services/kidsService'",
    );
  });

  it('keeps archive transitions on the lifecycle callable after canonical profile edits', () => {
    const updateIndex = editStudent.indexOf(
      "httpsCallable(functions, 'adminUpdateStudent')",
    );
    const archiveIndex = editStudent.indexOf(
      "httpsCallable(functions, 'archiveKid')",
    );
    expect(updateIndex).toBeGreaterThanOrEqual(0);
    expect(archiveIndex).toBeGreaterThan(updateIndex);
  });

  it('keeps learning-partner ownership on enrollment only', () => {
    expect(assignLp).toContain(
      "doc(db, 'enrollments', selectedEnrollment)",
    );
    expect(assignLp).not.toContain('updateKid(');
    expect(assignLp).not.toContain(
      "from '../../../services/kidsService'",
    );
  });

  it('retires browser learner create/update methods from kidsService', () => {
    expect(kidsService).not.toContain(
      'export async function createKid',
    );
    expect(kidsService).not.toContain(
      'export async function updateKid',
    );
    expect(kidsService).not.toContain('setDoc(');
  });
});
