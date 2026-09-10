import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const studentListSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/StudentManagement/StudentList.tsx'),
  'utf8',
);

const scheduleHandler = studentListSource.slice(
  studentListSource.indexOf('async function handleSaveSchedule'),
  studentListSource.indexOf('async function handleCreateAdHocSession'),
);

const scheduleModal = studentListSource.slice(
  studentListSource.indexOf('{/* ✅ NEW: Schedule Classes Modal */}'),
  studentListSource.indexOf('<Dialog open={!!adHocFor}'),
);

describe('rolling schedule admin cutover', () => {
  it('routes recurring schedule saves through rolling activation or bounded reconciliation', () => {
    expect(scheduleHandler).toContain("'saveRollingEnrollmentSchedule'");
    expect(scheduleHandler).toContain("'reconcileRollingEnrollmentSchedule'");
    expect(scheduleHandler).toContain('isCanonicalRollingEnrollmentForAdmin(selectedEnrollment)');
    expect(scheduleHandler).not.toContain("'saveEnrollmentScheduleAndGenerateSessions'");
    expect(scheduleHandler).not.toContain('weeksAhead');
    expect(scheduleHandler).not.toContain('plannedSessions');
    expect(scheduleHandler).not.toContain('endDate');
  });

  it('uses indefinite enrollment lifecycle controls instead of pause-next-N semantics', () => {
    expect(scheduleHandler).toContain("'setRollingEnrollmentLifecycle'");
    expect(scheduleHandler).toContain("target: 'paused' | 'active' | 'discontinued'");
    expect(scheduleHandler).not.toContain("'pauseEnrollmentUpcomingSessions'");
    expect(scheduleHandler).not.toContain("'resumeEnrollmentSchedule'");
    expect(studentListSource).not.toContain('pauseUpcomingCount');
    expect(scheduleModal).toContain('Pause schedule');
    expect(scheduleModal).toContain('Resume schedule');
    expect(scheduleModal).toContain('Discontinue enrollment');
    expect(scheduleModal).toContain('Pause remains in effect until Resume is selected.');
  });

  it('removes finite scheduling controls and explains continuous 14-day materialization', () => {
    expect(scheduleModal).not.toContain('Generate for (weeks)');
    expect(scheduleModal).not.toContain('Planned classes (optional)');
    expect(scheduleModal).not.toContain('End date (optional)');
    expect(scheduleModal).not.toContain('Pause upcoming classes');
    expect(scheduleModal).toContain('Continuous recurring schedule');
    expect(scheduleModal).toContain('next 14 days operationally materialized');
    expect(scheduleModal).toContain('There is no weeks, planned-class, or end-date cap.');
  });

  it('keeps gradual legacy conversion without deleting historical sessions', () => {
    expect(studentListSource).toContain('schemaVersion?: number');
    expect(studentListSource).toContain('deliveryMode?: string');
    expect(studentListSource).toContain('weeksAhead?: number');
    expect(studentListSource).toContain('plannedSessions?: number');
    expect(studentListSource).toContain('endDateYmd?: string');
    expect(scheduleModal).toContain('Saving once will convert it to continuous scheduling');
    expect(scheduleModal).toContain('no historical sessions are deleted');
    expect(scheduleModal).toContain('Activate Continuous Schedule');
  });

  it('does not scan the full enrollment session history for scheduling modal statistics', () => {
    expect(studentListSource).not.toContain('scheduleLiveStats');
    expect(studentListSource).not.toContain('plannedCoveragePreview');
    expect(studentListSource).not.toContain('plannedTargetForDisplay');
    expect(studentListSource).not.toMatch(
      /where\(['"]enrollmentId['"],\s*['"]==['"],\s*selectedScheduleEnrollment\.id\)/,
    );
  });

  it('routes rolling enrollment discontinuation from the student enrollment action through rolling lifecycle', () => {
    const deleteHandler = studentListSource.slice(
      studentListSource.indexOf('const handleDeleteEnrollment'),
      studentListSource.indexOf('useEffect(() => {', studentListSource.indexOf('const handleDeleteEnrollment')),
    );
    expect(deleteHandler).toContain('isCanonicalRollingEnrollmentForAdmin(enrollmentData)');
    expect(deleteHandler).toContain("'setRollingEnrollmentLifecycle'");
    expect(deleteHandler).toContain("'setEnrollmentStatus'");
    expect(deleteHandler).toContain('Legacy enrollments remain supported');
  });

  it('keeps session mutation authority on backend callables', () => {
    expect(scheduleHandler).not.toContain("setDoc(doc(db, 'classSessions'");
    expect(scheduleHandler).not.toContain("updateDoc(doc(db, 'classSessions'");
    expect(scheduleHandler).not.toContain("deleteDoc(doc(db, 'classSessions'");
  });
});
