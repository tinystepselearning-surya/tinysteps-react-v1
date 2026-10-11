import {describe,expect,it} from 'vitest';
import {
  isEnrollmentOperationallyActive,
  isScheduleExceptionSession,
  isSessionCanonicalForEnrollment,
  isOperationalManualSession,
} from '../../lib/sessionScheduleIntegrity';

const enrollment={
  id:'enrollment-1', status:'active',
  kidId:'kid-1',kidIds:['kid-1'],teacherId:'teacher-1',courseId:'phonics',
  schedule:{
    schemaVersion:1,deliveryMode:'rolling',timezone:'Asia/Kolkata',
    weeklySlots:[{weekday:1,time:'17:00',durationMinutes:35}],
  },
};

describe('virtual calendar: parent/teacher historical and ad hoc integrity',()=>{
  it('accepts a specifically approved teacher one-off class outside weekly recurrence',()=>{
    const exception={
      id:'enrollment-1_20261014_2000_adhoc',
      enrollmentId:enrollment.id,
      kidId:enrollment.kidId,kidIds:[enrollment.kidId],
      teacherId:enrollment.teacherId,courseId:enrollment.courseId,
      date:'2026-10-14',startTime:'20:00',endTime:'20:35',
      durationMinutes:35,status:'scheduled',
      source:'teacher_ad_hoc',isAdHoc:true,isManual:true,
      manualSessionState:'approved',
    };
    expect(isEnrollmentOperationallyActive(enrollment)).toBe(true);
    expect(isScheduleExceptionSession(exception)).toBe(true);
    expect(isOperationalManualSession(exception)).toBe(true);
    expect(isSessionCanonicalForEnrollment(exception,enrollment)).toBe(true);
    expect(isSessionCanonicalForEnrollment({...exception,manualSessionState:'cancelled'},enrollment)).toBe(false);
  });
  it('retains an absent attendance occurrence as a persisted regular session',()=>{
    const absent={
      id:'enrollment-1_20261012_1700',enrollmentId:enrollment.id,
      kidId:enrollment.kidId,kidIds:[enrollment.kidId],
      teacherId:enrollment.teacherId,courseId:enrollment.courseId,
      date:'2026-10-12',startTime:'17:00',endTime:'17:35',
      durationMinutes:35,status:'scheduled',
      source:'virtual_calendar_attendance',
      attendance:{'kid-1':{status:'absent'}},
    };
    expect(isSessionCanonicalForEnrollment(absent,enrollment)).toBe(true);
    expect(isScheduleExceptionSession(absent)).toBe(false);
  });
  it('treats existing completed regular attendance as historical authority',()=>{
    const present={
      id:'enrollment-1_20261005_1700',enrollmentId:enrollment.id,
      kidId:enrollment.kidId,kidIds:[enrollment.kidId],
      teacherId:enrollment.teacherId,courseId:enrollment.courseId,
      date:'2026-10-05',startTime:'17:00',endTime:'17:35',
      durationMinutes:35,status:'completed',
      source:'rolling_schedule',attendance:{'kid-1':{status:'present'}},
    };
    expect(isSessionCanonicalForEnrollment(present,enrollment)).toBe(true);
  });
});
