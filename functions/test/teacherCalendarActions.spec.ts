import {describe, expect, it} from 'vitest';
import {
  calendarAttendanceClaimId,
  resolveCalendarOccurrenceConflict,
  classIntervalsOverlap,
  hasTeacherVirtualCalendarConflict,
  resolveTeacherCalendarOccurrence,
  strictYmd,
  virtualCalendarAttendanceEnabled,
} from '../src/scheduling/teacherCalendarActions';

const enrolled = (schedule: Record<string,unknown> = {
  timezone:'Asia/Kolkata',
  weeklySlots:[{weekday:1,time:'17:00',durationMinutes:35},
               {weekday:2,time:'18:00',durationMinutes:35}],
}) => ({
  status:'active',teacherId:'teacher-a',kidId:'kid-a',
  courseId:'phonics',classesStartDateYmd:'2026-10-12',schedule,
});

describe('virtual class calendar backend (no Firestore in these tests)',()=>{
  it('defaults all attendance and ad hoc writes OFF until explicitly enabled',()=>{
    expect(virtualCalendarAttendanceEnabled({})).toBe(false);
    expect(virtualCalendarAttendanceEnabled({VIRTUAL_CALENDAR_ATTENDANCE_ENABLED:'false'})).toBe(false);
    expect(virtualCalendarAttendanceEnabled({VIRTUAL_CALENDAR_ATTENDANCE_ENABLED:'true'})).toBe(true);
  });

  it('uses strict calendar dates and refuses rollover or malformed values',()=>{
    expect(strictYmd('2026-10-12')).toBe('2026-10-12');
    for(const value of ['2026-02-29','2026-13-01','2026-10-32','10/12/2026','2026-1-2']){
      expect(()=>strictYmd(value)).toThrow();
    }
  });

  it('reuses exact deterministic session IDs and IST times, including tomorrow',()=>{
    const row=resolveTeacherCalendarOccurrence({
      enrollmentId:'enr-1', enrollment:enrolled(),date:'2026-10-12',startTime:'17:00',
    });
    expect(row.sessionId).toBe('enr-1_20261012_1700');
    expect(new Date(row.startAtUtcMs).toISOString()).toBe('2026-10-12T11:30:00.000Z');
    expect(row.endTime).toBe('17:35');
    expect(row.durationMinutes).toBe(35);
    expect(row.occurrenceKey).toBe('2026-10-12|17:00|35');
  });

  it('does not create sessions on any time outside the weekly timetable',()=>{
    expect(()=>resolveTeacherCalendarOccurrence({
      enrollmentId:'enr-1', enrollment:enrolled(),date:'2026-10-12',startTime:'18:00',
    })).toThrow(/Not a class/);
    expect(()=>resolveTeacherCalendarOccurrence({
      enrollmentId:'enr-1', enrollment:enrolled(),date:'2026-10-14',startTime:'17:00',
    })).toThrow(/Not a class/);
  });

  it('reads legacy weekdays and timeHHmm for enrollment-compatible classes',()=>{
    const row=resolveTeacherCalendarOccurrence({
      enrollmentId:'legacy', enrollment:enrolled({weekdays:[2],timeHHmm:'16:00',durationMins:40}),
      date:'2026-10-13',startTime:'16:00',
    });
    expect(row.sessionId).toBe('legacy_20261013_1600');
    expect(row.durationMinutes).toBe(40);
  });

  it('allows attendance identity irrespective of the wall-clock time',()=>{
    expect(calendarAttendanceClaimId('enr-1','kid-a','2026-10-12','17:00'))
      .toBe('kid-a_20261012_1700');
    expect(calendarAttendanceClaimId('other-course','kid-a','2026-10-12','17:00'))
      .toBe('kid-a_20261012_1700');
  });

  it('reuses one legacy-ID attendance for the same student, date and time',()=>{
    const rows=[{id:'legacy-session-42',data:{
      kidId:'kid-a',date:'2026-10-12',startTime:'17:00:00',
      enrollmentId:'enr-1',teacherId:'teacher-a',courseId:'phonics',status:'completed',
    }}];
    expect(resolveCalendarOccurrenceConflict(rows,{
      enrollmentId:'enr-1',childId:'kid-a',date:'2026-10-12',
      startTime:'17:00',teacherId:'teacher-a',courseId:'phonics',
    })).toEqual({sessionId:'legacy-session-42',conflict:null});
  });

  it('fails closed on two historical IDs for one student/time',()=>{
    const rows=['a','b'].map(id=>({id,data:{
      kidId:'kid-a',date:'2026-10-12',startTime:'17:00',
      enrollmentId:'enr-1',teacherId:'teacher-a',courseId:'phonics',
    }}));
    expect(resolveCalendarOccurrenceConflict(rows,{
      enrollmentId:'enr-1',childId:'kid-a',date:'2026-10-12',
      startTime:'17:00',teacherId:'teacher-a',courseId:'phonics',
    }).conflict).toMatch(/Multiple historical/);
  });

  it('rejects collision with a different enrollment or course',()=>{
    const rows=[{id:'prior',data:{
      kidId:'kid-a',date:'2026-10-12',startTime:'17:00',
      enrollmentId:'other-enrollment',teacherId:'teacher-a',courseId:'grammar',
    }}];
    expect(resolveCalendarOccurrenceConflict(rows,{
      enrollmentId:'enr-1',childId:'kid-a',date:'2026-10-12',
      startTime:'17:00',teacherId:'teacher-a',courseId:'phonics',
    }).conflict).toMatch(/different ownership or course/);
  });

  it('rejects overlapping bookings and accepts adjacent 35-minute classes',()=>{
    expect(classIntervalsOverlap(1020,35,1030,35)).toBe(true);
    expect(classIntervalsOverlap(1020,35,1055,35)).toBe(false);
    expect(hasTeacherVirtualCalendarConflict(
      [enrolled()], 'teacher-a','2026-10-12','17:10',35,
    )).toBe(true);
    expect(hasTeacherVirtualCalendarConflict(
      [enrolled()], 'teacher-a','2026-10-12','17:35',35,
    )).toBe(false);
  });

  it('allows ad hoc times independently of recurring slots while retaining a single occurrence key',()=>{
    const row=resolveTeacherCalendarOccurrence({
      enrollmentId:'enr-1',enrollment:enrolled(),date:'2026-10-14',
      startTime:'20:00',durationMinutes:35,
    });
    expect(row.startTime).toBe('20:00');
    expect(row.endTime).toBe('20:35');
    expect(row.sessionId).toBe('enr-1_20261014_2000');
  });
});
