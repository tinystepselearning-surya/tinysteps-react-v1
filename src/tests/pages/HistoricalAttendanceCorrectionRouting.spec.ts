import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const panelSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/HistoricalAttendanceMissingSessionPanel.tsx'),
  'utf8',
);
const parentSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/AttendanceCorrectionsAdvancedPanel.tsx'),
  'utf8',
);
const functionsIndexSource = readFileSync(join(process.cwd(), 'functions/src/index.ts'), 'utf8');
const callableSource = readFileSync(
  join(process.cwd(), 'functions/src/createAdminHistoricalAttendanceSession.ts'),
  'utf8',
);
const candidatesSource = readFileSync(
  join(process.cwd(), 'functions/src/getAdminHistoricalAttendanceCandidates.ts'),
  'utf8',
);

describe('historical attendance correction routing', () => {
  it('keeps the normal correction workflow intact and exposes historical repair as an optional section', () => {
    expect(parentSource).toContain("httpsCallable<");
    expect(parentSource).toContain("(functions, 'createAdminManualSession')");
    expect(parentSource).toContain('<HistoricalAttendanceMissingSessionPanel />');
    expect(panelSource).toContain('<details');
    expect(panelSource).toContain('Historical / Previous Course — Missing Session');
  });

  it('resolves previous-course and previous-teacher candidates server-side before creating an audited session', () => {
    expect(panelSource).toContain("(functions, 'getAdminHistoricalAttendanceCandidates')");
    expect(panelSource).not.toContain('collectionGroup(');
    expect(candidatesSource).toContain("db.collectionGroup('teacherReassignments')");
    expect(candidatesSource).toContain(".where('oldTeacherId', '==', identity)");
    expect(panelSource).toContain("(functions, 'createAdminHistoricalAttendanceSession')");
    expect(panelSource).toContain("(functions, 'adminAttendanceCorrection')");
    expect(functionsIndexSource).toContain(
      'export { createAdminHistoricalAttendanceSession } from "./createAdminHistoricalAttendanceSession";',
    );
    expect(functionsIndexSource).toContain(
      'export { getAdminHistoricalAttendanceCandidates } from "./getAdminHistoricalAttendanceCandidates";',
    );
  });

  it('does not reactivate old enrollments or regenerate recurring schedules', () => {
    expect(callableSource).not.toContain('setEnrollmentStatus');
    expect(callableSource).not.toContain('repairEnrollmentFutureSessionsFromSchedule');
    expect(callableSource).not.toContain('createSessionsFromSchedule');
    expect(callableSource).toContain("historicalCorrection: true");
    expect(callableSource).toContain("type: 'admin_historical_attendance_session_created'");
    expect(callableSource).toContain('resolveHistoricalEnrollmentCutoffMs');
    expect(callableSource).toContain('isTeacherValidForHistoricalSession');
  });
});
