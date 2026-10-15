import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const parentSource = readFileSync(
  join(process.cwd(), 'src/pages/parent/ParentDashboard.tsx'),
  'utf8',
);
const teacherScheduleSource = readFileSync(
  join(process.cwd(), 'src/pages/teacher/components/schedule/ScheduleView.tsx'),
  'utf8',
);
const teacherStudentSource = readFileSync(
  join(process.cwd(), 'src/hooks/useTeacherFilteredData.ts'),
  'utf8',
);

describe('Brick 8 calendar projection routing', () => {
  it('keeps parent Today and Upcoming based on real sorted classSessions only', () => {
    const operationalSlice = parentSource.slice(
      parentSource.indexOf('const todayClassSessions = useMemo'),
      parentSource.indexOf('const classesCalendarMonthLabel = useMemo'),
    );
    expect(operationalSlice).toContain('sortedClassSessions.filter');
    expect(operationalSlice).not.toContain('buildRollingScheduleCalendarProjections');
  });

  it('adds recurrence projections only to the parent calendar month composition', () => {
    const calendarSlice = parentSource.slice(
      parentSource.indexOf('const classesCalendarSessions = useMemo'),
      parentSource.indexOf('const classesCalendarSessionsByDay = useMemo'),
    );
    expect(calendarSlice).toContain('buildRollingScheduleCalendarProjections');
    expect(calendarSlice).toContain('kidSessionsQuery.data');
    expect(calendarSlice).toContain('enrollmentsQuery.data');
    expect(calendarSlice).toContain('return [...realRows, ...projectionRows]');
  });

  it('joins virtual parent timetable classes through enrollment Teams links without materializing sessions', () => {
    expect(parentSource).toContain('Virtual timetable entries use the enrollment Teams link directly.');
    expect(parentSource).toContain('const resolvedJoinUrl = resolveSessionJoinClassUrl(session, activeEnrollmentById);');
    expect(parentSource).toContain('openMeetingLink(resolvedJoinUrl);');
    expect(parentSource).not.toContain('if (isRollingScheduleProjection(session)) return;');
  });

  it('reuses the teacher enrollment query instead of adding another Firestore schedule read', () => {
    expect(teacherStudentSource).toContain('scheduleEnrollments?: TeacherScheduleEnrollment[]');
    expect(teacherStudentSource).toContain('scheduleEnrollments: [row]');
    expect(teacherScheduleSource).toContain('student.scheduleEnrollments || []');
    const scheduleImportsAndSetup = teacherScheduleSource.slice(0, teacherScheduleSource.indexOf('const projectedSessions'));
    expect(scheduleImportsAndSetup).not.toContain("collection(db, 'enrollments')");
  });

  it('shows teacher timetable projections and creates a real session only for submitted attendance', () => {
    expect(teacherScheduleSource).toContain('buildRollingScheduleCalendarProjections');
    expect(teacherScheduleSource).toContain('const displaySessions = useMemo');
    expect(teacherScheduleSource).toContain('[...sessions, ...projectedSessions]');
    expect(teacherScheduleSource).toContain('if (isRollingScheduleProjection(selectedSession)) {');
    expect(teacherScheduleSource).toContain("'ensureTeacherCalendarAttendanceSession'");
    expect(teacherScheduleSource).toContain('attendanceSessionId = materialized.data.sessionId;');
    expect(teacherScheduleSource).toContain('saveTeacherSessionProgress({');
  });
});
