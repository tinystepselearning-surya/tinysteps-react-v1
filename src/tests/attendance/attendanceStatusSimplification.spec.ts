import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

const teacherTypesSource = readSource('src/types/Teacher.ts');
const teacherFormSource = readSource('src/pages/teacher/components/today-sessions/AttendanceForm.tsx');
const adminCorrectionSource = readSource('src/pages/admin/AttendanceCorrectionsAdvancedPanel.tsx');
const historicalCorrectionSource = readSource('src/pages/admin/HistoricalAttendanceMissingSessionPanel.tsx');
const teacherPayControlSource = readSource('src/pages/admin/TeacherPayHandlingControl.tsx');
const financeStatusSource = readSource('functions/src/helpers/status.ts');

describe('AS0 attendance status simplification', () => {
  it('defines only Present, Absent and Reschedule Requested as new teacher write statuses', () => {
    expect(teacherTypesSource).toContain(
      "export type AttendanceWriteStatus = 'present' | 'absent' | 'reschedule_requested';",
    );
  });

  it('keeps legacy Late readable without making it a new write status', () => {
    expect(teacherTypesSource).toContain("export type LegacyAttendanceStatus = AttendanceWriteStatus | 'late';");
    expect(teacherFormSource).toContain("if (status === 'late') return 'present';");
  });

  it('removes Late from the teacher attendance selector', () => {
    expect(teacherFormSource).toContain(
      "const STATUS_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'reschedule_requested'];",
    );
    expect(teacherFormSource).not.toContain("['present', 'absent', 'late', 'reschedule_requested']");
  });

  it('limits the standard admin correction selector to Present, Absent and Rescheduled', () => {
    expect(adminCorrectionSource).toContain(
      "type AttendanceCorrectionStatus = 'present' | 'absent' | 'rescheduled';",
    );
    expect(adminCorrectionSource).toContain("'present',\n  'absent',\n  'rescheduled',");
    expect(adminCorrectionSource).not.toContain("| 'late';");
  });

  it('limits historical missing-session attendance to Present, Absent and Rescheduled', () => {
    expect(historicalCorrectionSource).toContain(
      "type AttendanceStatus = 'present' | 'absent' | 'rescheduled';",
    );
    expect(historicalCorrectionSource).toContain(
      "const STATUS_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'rescheduled'];",
    );
  });

  it('removes Late from teacher-payment-facing copy', () => {
    expect(teacherPayControlSource).toContain('Required for Present attendance corrections.');
    expect(teacherPayControlSource).not.toContain('Present or Late');
  });

  it('preserves legacy financial compatibility for already-stored Late records', () => {
    expect(financeStatusSource).toContain("return status === 'present' || status === 'late';");
  });
});
