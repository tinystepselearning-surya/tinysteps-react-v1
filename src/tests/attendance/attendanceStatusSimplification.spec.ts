import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

const teacherTypesSource = readSource('src/types/Teacher.ts');
const teacherFormSource = readSource('src/pages/teacher/components/today-sessions/AttendanceForm.tsx');
const adminCorrectionSource = readSource('src/pages/admin/AttendanceCorrectionsAdvancedPanel.tsx');
const historicalCorrectionSource = readSource('src/pages/admin/HistoricalAttendanceMissingSessionPanel.tsx');
const teacherPayControlSource = readSource('src/pages/admin/TeacherPayHandlingControl.tsx');
const parentClassesSource = readSource('src/pages/parent/components/classes/ParentClassesView.tsx');
const teacherEarningsSource = readSource('src/pages/teacher/components/earnings/EarningsSummary.tsx');
const sessionProgressSource = readSource('functions/src/saveTeacherSessionProgress.ts');
const sessionCompletionSource = readSource('functions/src/onSessionComplete.ts');
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

  it('folds historical Late into Present on parent and teacher read surfaces', () => {
    expect(parentClassesSource).toContain('summary.presentSessions + summary.lateSessions');
    expect(parentClassesSource).not.toContain('<dt className="text-xs text-slate-500">Late</dt>');
    expect(teacherEarningsSource).toContain("if (token === 'late') return 'present';");
    expect(teacherEarningsSource).not.toContain("case 'late': return 'Late';");
  });

  it('normalizes older clients that still submit Late into Present before new writes', () => {
    expect(sessionProgressSource).toContain("if (normalized.status === 'late')");
    expect(sessionProgressSource).toContain("return { ...normalized, status: 'present' };");
    expect(sessionProgressSource).toContain("return normalized === 'late' ? 'present' : normalized;");
    expect(sessionCompletionSource).toContain('normalizeIncomingAttendanceMap');
    expect(sessionCompletionSource).toContain('status: "present" as AttendanceStatus');
  });

  it('preserves legacy financial compatibility for already-stored Late records', () => {
    expect(financeStatusSource).toContain("return status === 'present' || status === 'late';");
  });
});
