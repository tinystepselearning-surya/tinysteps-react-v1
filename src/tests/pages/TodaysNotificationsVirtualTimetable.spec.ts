import {describe,expect,it} from 'vitest';
import {
  buildVirtualReminderSessions,
  selectOperationalReminderSessions,
  type ManualReminderSessionDoc,
} from '../../pages/admin/todaysNotificationsManualData';

const enrollment={
  id:'enr-12',status:'active',kidId:'kid-12',kidIds:['kid-12'],
  teacherId:'teacher-12',courseId:'phonics',parentId:'parent-12',
  kidName:'Student 12',teacherName:'Teacher 12',parentName:'Parent 12',
  joinUrl:'https://teams.microsoft.com/l/meetup-join/example',
  classesStartDateYmd:'2026-10-12',
  schedule:{
    schemaVersion:1,deliveryMode:'rolling',timezone:'Asia/Kolkata',
    weeklySlots:[{weekday:1,time:'17:00',durationMinutes:35},
                 {weekday:2,time:'17:00',durationMinutes:35}],
  },
};
const input=(dateKey:string,realSessions:ManualReminderSessionDoc[]=[])=>({
  enrollments:[enrollment],
  realSessions,
  dateKey,
  todayDateKey:'2026-10-12',
});

describe('Admin Today/Tomorrow virtual timetable reminders',()=>{
  it('shows Monday and Tuesday without writing or reading physical future class records',()=>{
    const monday=buildVirtualReminderSessions(input('2026-10-12'));
    const tuesday=buildVirtualReminderSessions(input('2026-10-13'));
    expect(monday).toHaveLength(1);
    expect(tuesday).toHaveLength(1);
    expect(monday[0]).toMatchObject({
      id:'projection:enr-12_20261012_1700',
      source:'rolling_schedule_projection',status:'scheduled',
      kidId:'kid-12',teacherId:'teacher-12',parentId:'parent-12',
      date:'2026-10-12',startTime:'17:00',endTime:'17:35',
      joinUrl:enrollment.joinUrl,
    });
    expect(selectOperationalReminderSessions(monday,
      {'enr-12':enrollment})).toHaveLength(1);
  });

  it('never duplicates persisted attendance or changed session state',()=>{
    const attended:ManualReminderSessionDoc={
      id:'enr-12_20261012_1700',enrollmentId:'enr-12',
      kidId:'kid-12',kidIds:['kid-12'],teacherId:'teacher-12',
      courseId:'phonics',status:'completed',date:'2026-10-12',
      startTime:'17:00',durationMinutes:35,
      source:'virtual_calendar_attendance',
    };
    expect(buildVirtualReminderSessions(input('2026-10-12',[attended]))).toEqual([]);
    expect(buildVirtualReminderSessions(input('2026-10-13',[attended]))).toHaveLength(1);
  });

  it('stores reminder acknowledgements separately from class session records',()=>{
    const id='projection:enr-12_20261012_1700';
    const flags=new Map([[id,{parentNotified:true,teacherNotified:false}]]);
    const rows=buildVirtualReminderSessions({...input('2026-10-12'),flags});
    expect(rows[0].parentNotified).toBe(true);
    expect(rows[0].teacherNotified).toBe(false);
    expect(rows[0].id).toBe(id);
  });

  it('does not project paused enrollments or days without weekly classes',()=>{
    expect(buildVirtualReminderSessions({
      ...input('2026-10-14'),
      enrollments:[enrollment],
    })).toHaveLength(0);
    expect(buildVirtualReminderSessions({
      ...input('2026-10-12'),
      enrollments:[{...enrollment,status:'paused'}],
    })).toHaveLength(0);
  });
});
