import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('AVS changed-session dirty routing', () => {
  const progress = read('functions/src/saveTeacherSessionProgress.ts');
  const marker = read('functions/src/attendanceValidation/dirtySessionMarker.ts');
  const contract = read('src/lib/attendanceValidationContract.ts');
  const rules = read('firestore.rules');

  it('marks teacher and admin attendance changes only after operational commit', () => {
    expect(progress).toContain('hasAttendanceValidationAttendanceChange');
    expect(progress).toContain("reason: 'teacher_attendance_changed'");
    expect(progress).toContain("reason: 'admin_attendance_correction'");

    const teacherCommit = progress.indexOf('await batch.commit();');
    const teacherMarker = progress.indexOf(
      "reason: 'teacher_attendance_changed'",
    );
    const adminLogger = progress.indexOf(
      "logger.info('adminAttendanceCorrection: applied'",
    );
    const adminCommit = progress.lastIndexOf('await batch.commit();');
    const adminMarker = progress.indexOf(
      "reason: 'admin_attendance_correction'",
    );

    expect(teacherCommit).toBeGreaterThan(-1);
    expect(teacherMarker).toBeGreaterThan(teacherCommit);
    expect(adminCommit).toBeGreaterThan(teacherCommit);
    expect(adminMarker).toBeGreaterThan(adminCommit);
    expect(adminMarker).toBeLessThan(adminLogger);
  });

  it('keeps dirty-marker failures non-blocking for operational attendance', () => {
    expect(progress).toContain(
      "logger.warn('saveTeacherSessionProgress: AVS dirty marker failed'",
    );
    expect(progress).toContain(
      "logger.warn('adminAttendanceCorrection: AVS dirty marker failed'",
    );
  });

  it('uses a validation-owned write-only backend queue with no read-before-write', () => {
    expect(contract).toContain(
      "dirtySessions: 'attendanceValidationDirtySessions'",
    );
    expect(marker).toContain(
      "ATTENDANCE_VALIDATION_DIRTY_SESSIONS_COLLECTION =\n  'attendanceValidationDirtySessions'",
    );
    expect(marker).toContain('.set({');
    expect(marker).not.toContain('.get(');
    expect(marker).not.toContain('.where(');
  });

  it('denies all browser access to dirty markers', () => {
    expect(rules).toContain(
      'match /attendanceValidationDirtySessions/{sessionId}',
    );
    expect(rules).toContain(
      'allow read, create, update, delete: if false;',
    );
  });
});
