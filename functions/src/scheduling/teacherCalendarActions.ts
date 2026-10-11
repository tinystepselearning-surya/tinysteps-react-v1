/**
 * Virtual-calendar write boundary.
 *
 * Reading a timetable and joining Teams must not create classSessions.
 * Only a teacher's deliberate attendance submission creates a recurring
 * occurrence on demand. Teacher ad hoc bookings are explicit exceptions and
 * are persisted so they remain visible until attendance is marked.
 *
 * The source flag intentionally defaults OFF until both parent/teacher
 * calendars and integration tests pass.
 */
import * as admin from 'firebase-admin';
import {onCall, HttpsError} from 'firebase-functions/v2/https';
import {resolveCanonicalTeacherIdForWrite} from '../helpers/teacherIdentity';
import {
  buildRollingScheduledSessionPayload,
  normalizeRollingMaterializerSlots,
  rollingSessionId,
  type RollingMaterializationOccurrence,
} from './rollingScheduleMaterializer';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_MINUTES = 330;
const ACTIVE = new Set(['active','enrolled','current','ongoing','pending_payment','pending_lp']);
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const YYYYMMDD = /^(\d{4})-(\d{2})-(\d{2})$/;
const HOUR = 60_000;
type Row = Record<string, unknown>;
const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const personIds = (enrollment: Row): string[] => [
  text(enrollment.kidId),
  ...(Array.isArray(enrollment.kidIds) ? enrollment.kidIds.map(text) : []),
  text(enrollment.studentId), text(enrollment.childId),
].filter(Boolean);

export const virtualCalendarAttendanceEnabled = (
  env: Record<string, string | undefined> = process.env,
): boolean => env.VIRTUAL_CALENDAR_ATTENDANCE_ENABLED === 'true';

export function strictYmd(date: unknown): string {
  const value = text(date);
  const match = YYYYMMDD.exec(value);
  if (!match) throw new HttpsError('invalid-argument','Date must be YYYY-MM-DD');
  const [year, month, day] = match.slice(1).map(Number);
  const check = new Date(Date.UTC(year,month-1,day));
  if (check.getUTCFullYear()!==year || check.getUTCMonth()!==month-1 || check.getUTCDate()!==day) {
    throw new HttpsError('invalid-argument','Invalid calendar date');
  }
  return value;
}

function strictTime(value: unknown): string {
  const result = text(value);
  if (!HHMM.test(result)) throw new HttpsError('invalid-argument','Time must be HH:MM');
  return result;
}

function asDayYmd(value: unknown): string | null {
  if (typeof value === 'string' && YYYYMMDD.test(value)) {
    try {return strictYmd(value);} catch {return null;}
  }
  const asDate = (value as {toDate?: () => Date}|null)?.toDate?.();
  if (!asDate || !Number.isFinite(asDate.getTime())) return null;
  return new Date(asDate.getTime() + IST_MINUTES*HOUR).toISOString().slice(0,10);
}

function enrollmentStartDay(row: Row): string | null {
  for (const v of [row.classesStartDateYmd,row.classesStartDate,row.startDateYmd,row.startDate]) {
    const value = asDayYmd(v);
    if (value) return value;
  }
  return null;
}

export function resolveTeacherCalendarOccurrence(args: {
  enrollmentId: string; enrollment: Row; date: string;
  startTime: string; durationMinutes?: number;
}): RollingMaterializationOccurrence {
  const {enrollmentId, enrollment, date, startTime} = args;
  const dayMs = Date.parse(date+'T00:00:00.000Z');
  const weekday = new Date(dayMs).getUTCDay();
  const slots = normalizeRollingMaterializerSlots(enrollment.schedule);
  const slot = args.durationMinutes
    ? {time: startTime, weekday, hour: Number(startTime.slice(0,2)),
       minute: Number(startTime.slice(3,5)), durationMinutes: args.durationMinutes}
    : slots.find(s=>s.weekday===weekday && s.time===startTime);
  if (!slot) throw new HttpsError('failed-precondition','Not a class on this enrollment timetable');
  const startAtUtcMs = dayMs+(slot.hour*60+slot.minute-IST_MINUTES)*HOUR;
  const endAtUtcMs = startAtUtcMs + slot.durationMinutes*HOUR;
  const end = (slot.hour*60+slot.minute+slot.durationMinutes)%1440;
  const endTime = String(Math.floor(end/60)).padStart(2,'0')+':'+String(end%60).padStart(2,'0');
  return {
    date, weekday, startTime, endTime,
    durationMinutes:slot.durationMinutes,
    startAtUtcMs,endAtUtcMs,
    occurrenceKey:date+'|'+startTime+'|'+slot.durationMinutes,
    sessionId:rollingSessionId(enrollmentId,date,startTime),
  };
}

async function assertTeacher(uid: string, db: admin.firestore.Firestore): Promise<void> {
  const snap = await db.collection('users').doc(uid).get();
  const user = snap.data() || {};
  const role = text(user.role).toLowerCase();
  const roles = Array.isArray(user.roles) ? user.roles.map(x=>text(x).toLowerCase()) : [];
  if (!snap.exists || (role!=='teacher' && !roles.includes('teacher')) ||
      (user.status && text(user.status).toLowerCase()!=='active')) {
    throw new HttpsError('permission-denied','Only active Tiny Steps teachers can perform this action');
  }
}

function assertAssignedActive(enrollment: Row, uid: string, date: string): string {
  const teacher = resolveCanonicalTeacherIdForWrite(enrollment);
  if (!teacher.teacherId || teacher.source==='ambiguous_legacy' || teacher.teacherId!==uid) {
    throw new HttpsError('permission-denied','Student not assigned to this teacher');
  }
  const status = text(enrollment.status).toLowerCase();
  if (!ACTIVE.has(status) || enrollment.archived || enrollment.isArchived || enrollment.archivedAt) {
    throw new HttpsError('failed-precondition','Student enrollment is not active');
  }
  const start = enrollmentStartDay(enrollment);
  if (start && date < start) throw new HttpsError('failed-precondition','Class is before enrollment start date');
  const childId = personIds(enrollment)[0];
  if (!childId) throw new HttpsError('failed-precondition','Enrollment has no student');
  if (!text(enrollment.courseId)) throw new HttpsError('failed-precondition','Enrollment has no course');
  return childId;
}


/** Identity stays stable across retries and attendance corrections. */
export const calendarAttendanceClaimId = (
  _enrollmentId: string, childId: string, date: string, startTime: string,
): string => [childId, date.replace(/-/g, ''), startTime.replace(':', '')].join('_');

const attendanceTimeOf = (row: Row): string => {
  const raw = text(row.startTime);
  const match = /^(\\d{1,2}):(\\d{2})(?::\\d{2})?$/.exec(raw);
  if (match && Number(match[1]) < 24 && Number(match[2]) < 60) {
    return match[1].padStart(2,'0') + ':' + match[2];
  }
  const dateLike = row.startAt as {toDate?: () => Date}|null;
  const at = dateLike?.toDate?.();
  if (!at || !Number.isFinite(at.getTime())) return '';
  const shifted = new Date(at.getTime() + IST_MINUTES * HOUR);
  return shifted.toISOString().slice(11,16);
};

const rowBelongsToChild = (row: Row, childId: string): boolean =>
  personIds(row).includes(childId);

export type ExistingCalendarOccurrence = {id:string; data:Row};
export function resolveCalendarOccurrenceConflict(
  rows: ExistingCalendarOccurrence[],
  args: {enrollmentId:string; childId:string; date:string; startTime:string; teacherId:string; courseId:string},
): {sessionId:string|null; conflict:string|null} {
  const collisions = rows.filter(({data}) =>
    rowBelongsToChild(data,args.childId) && attendanceTimeOf(data)===args.startTime);
  if (collisions.length === 0) return {sessionId:null,conflict:null};
  if (collisions.length > 1) return {sessionId:null,conflict:'Multiple historical sessions for this student/date/time; Admin review required'};
  const only = collisions[0];
  const data=only.data;
  const differentEnrollment = text(data.enrollmentId) && text(data.enrollmentId)!==args.enrollmentId;
  const differentTeacher = text(data.teacherId) && text(data.teacherId)!==args.teacherId;
  const differentCourse = text(data.courseId) && text(data.courseId)!==args.courseId;
  if (differentEnrollment||differentTeacher||differentCourse) {
    return {sessionId:null,conflict:'An existing class for this student/date/time has different ownership or course; Admin review required'};
  }
  if (['cancelled','canceled','withdrawn'].includes(text(data.status).toLowerCase())) {
    return {sessionId:null,conflict:'This class was previously cancelled; Admin review required'};
  }
  return {sessionId:only.id,conflict:null};
}

function assertCalendarSessionIdentity(
  row:Row, enrollmentId:string, uid:string, childId:string, courseId:string,
):void {
  if ((text(row.enrollmentId) && text(row.enrollmentId)!==enrollmentId) ||
      text(row.teacherId)!==uid || !personIds(row).includes(childId) ||
      (text(row.courseId) && text(row.courseId)!==courseId)) {
    throw new HttpsError('failed-precondition','Existing class identity mismatch; Admin review required');
  }
  if (['cancelled','canceled','withdrawn'].includes(text(row.status).toLowerCase())) {
    throw new HttpsError('failed-precondition','Cancelled class cannot be marked as scheduled; Admin review required');
  }
}

/** Only explicitly called when teacher submits Present/Absent for a projection. */
export const ensureTeacherCalendarAttendanceSession = onCall(
  {region:REGION, memory:'256MiB', timeoutSeconds:45},
  async (request) => {
    if (!virtualCalendarAttendanceEnabled()) {
      throw new HttpsError('failed-precondition','Virtual attendance is not activated');
    }
    const uid = text(request.auth?.uid);
    if (!uid) throw new HttpsError('unauthenticated','Sign in required');
    const enrollmentId = text(request.data?.enrollmentId);
    if (!/^[A-Za-z0-9_-]{1,120}$/.test(enrollmentId)) {
      throw new HttpsError('invalid-argument','Valid enrollment required');
    }
    const date = strictYmd(request.data?.date);
    const startTime = strictTime(request.data?.startTime);
    const db = admin.firestore();
    await assertTeacher(uid, db);
    const ref = db.collection('enrollments').doc(enrollmentId);
    const sessionId = rollingSessionId(enrollmentId,date,startTime);
    const sessionRef = db.collection('classSessions').doc(sessionId);
    const result = await db.runTransaction(async tx=>{
      const enrollmentSnap = await tx.get(ref);
      if (!enrollmentSnap.exists) throw new HttpsError('not-found','Enrollment not found');
      const enrollment = (enrollmentSnap.data()||{}) as Row;
      const childId = assertAssignedActive(enrollment, uid, date);
      const occurrence = resolveTeacherCalendarOccurrence({enrollmentId,enrollment,date,startTime});
      const claimRef = db.collection('calendarAttendanceClaims')
        .doc(calendarAttendanceClaimId(enrollmentId,childId,date,startTime));
      const [childSnap, claimSnap, sessionSnap, chargeSnap, earningSnap] = await Promise.all([
        tx.get(db.collection('kids').doc(childId)),
        tx.get(claimRef),
        tx.get(sessionRef),
        tx.get(db.collection('billingCharges').doc(sessionId)),
        tx.get(db.collection('teacherEarnings').doc(sessionId)),
      ]);
      if (claimSnap.exists) {
        const existingId = text(claimSnap.data()?.sessionId);
        if (!existingId) throw new HttpsError('failed-precondition','Attendance claim requires Admin repair');
        const existing = existingId===sessionId ? sessionSnap :
          await tx.get(db.collection('classSessions').doc(existingId));
        if (!existing.exists) throw new HttpsError('failed-precondition','Historical attendance claim points to a missing class');
        assertCalendarSessionIdentity((existing.data()||{}) as Row,enrollmentId,uid,childId,text(enrollment.courseId));
        return {sessionId:existingId,created:false};
      }
      if (!childSnap.exists || childSnap.data()?.deleted || childSnap.data()?.isDeleted ||
          childSnap.data()?.archived || childSnap.data()?.isArchived ||
          !['','active'].includes(text(childSnap.data()?.status).toLowerCase())) {
        throw new HttpsError('failed-precondition','Student profile is inactive or missing');
      }
      // Date-only query avoids legacy-ID assumptions and requires no new
      // composite index. It runs only on first attendance, never on calendar view.
      // The bounded scan fails closed rather than silently missing a duplicate.
      const sameDay = await tx.get(db.collection('classSessions')
        .where('date','==',date).limit(251));
      if (sameDay.size > 250) {
        throw new HttpsError('failed-precondition','Daily class identity check exceeded the safe limit; Admin review required');
      }
      const existingRows:ExistingCalendarOccurrence[] = sameDay.docs.map(d=>({
        id:d.id,data:(d.data()||{}) as Row,
      }));
      if (sessionSnap.exists && !existingRows.some(r=>r.id===sessionId)) {
        existingRows.push({id:sessionId,data:(sessionSnap.data()||{}) as Row});
      }
      const found=resolveCalendarOccurrenceConflict(existingRows,{
        enrollmentId,childId,date,startTime,teacherId:uid,courseId:text(enrollment.courseId),
      });
      if (found.conflict) throw new HttpsError('failed-precondition',found.conflict);
      if (found.sessionId) {
        const reused = found.sessionId===sessionId ? sessionSnap :
          await tx.get(db.collection('classSessions').doc(found.sessionId));
        if (!reused.exists) throw new HttpsError('failed-precondition','Existing class disappeared');
        assertCalendarSessionIdentity((reused.data()||{}) as Row,enrollmentId,uid,childId,text(enrollment.courseId));
        tx.create(claimRef,{sessionId:found.sessionId,enrollmentId,childId,date,startTime,
          source:'virtual_calendar_attendance',createdAt:admin.firestore.FieldValue.serverTimestamp()});
        return {sessionId:found.sessionId,created:false};
      }
      if (sessionSnap.exists || chargeSnap.exists || earningSnap.exists) {
        throw new HttpsError('failed-precondition','Class identity or finance exists without valid attendance; Admin review required');
      }
      const schedule = enrollment.schedule as Row|undefined;
      const revision = Number(schedule?.revision || 1);
      const payload = buildRollingScheduledSessionPayload({
        enrollmentId, enrollment, occurrence,
        scheduleRevision:Number.isSafeInteger(revision)&&revision>=1?revision:1,
        actorId:uid,
      });
      tx.create(sessionRef,{...payload,source:'virtual_calendar_attendance'});
      tx.create(claimRef,{sessionId,enrollmentId,childId,date,startTime,
        source:'virtual_calendar_attendance',createdAt:admin.firestore.FieldValue.serverTimestamp()});
      return {sessionId,created:true};
    });
    return {...result,ok:true};
  },
);


const minutesOf = (hhmm:string):number => Number(hhmm.slice(0,2))*60+Number(hhmm.slice(3,5));
export const classIntervalsOverlap = (
  aStart:number,aDuration:number,bStart:number,bDuration:number,
):boolean => aStart < bStart+bDuration && bStart < aStart+aDuration;

export function hasTeacherVirtualCalendarConflict(
  enrollments:Row[], uid:string, date:string, startTime:string, durationMinutes:number,
):boolean {
  const weekday=new Date(date+'T00:00:00.000Z').getUTCDay();
  const start=minutesOf(startTime);
  return enrollments.some(enrollment=>{
    const resolved=resolveCanonicalTeacherIdForWrite(enrollment);
    if (resolved.teacherId!==uid || resolved.source==='ambiguous_legacy') return false;
    if (!ACTIVE.has(text(enrollment.status).toLowerCase()) ||
        enrollment.archived || enrollment.isArchived || enrollment.archivedAt) return false;
    const effective=enrollmentStartDay(enrollment);
    if (effective && effective>date) return false;
    return normalizeRollingMaterializerSlots(enrollment.schedule).some(slot=>
      slot.weekday===weekday &&
      classIntervalsOverlap(start,durationMinutes,minutesOf(slot.time),slot.durationMinutes));
  });
}

type AdHocDayReservation = {sessionId:string; childId:string; startTime:string; durationMinutes:number};
function conflictsWithReservation(
  reservations:AdHocDayReservation[],startTime:string,durationMinutes:number,
):boolean {
  return reservations.some(r=>classIntervalsOverlap(
    minutesOf(startTime),durationMinutes,minutesOf(r.startTime),r.durationMinutes));
}
/** One-off classes are explicit calendar exceptions, never recurrence edits. */
export const createTeacherCalendarAdHocSession = onCall(
  {region:REGION,memory:'256MiB',timeoutSeconds:45},
  async(request)=>{
    if (!virtualCalendarAttendanceEnabled()) {
      throw new HttpsError('failed-precondition','Teacher ad hoc booking is not activated');
    }
    const uid=text(request.auth?.uid);
    if (!uid) throw new HttpsError('unauthenticated','Sign in required');
    const enrollmentId=text(request.data?.enrollmentId);
    if (!/^[A-Za-z0-9_-]{1,120}$/.test(enrollmentId)) {
      throw new HttpsError('invalid-argument','Valid enrollment required');
    }
    const date=strictYmd(request.data?.date);
    const startTime=strictTime(request.data?.startTime);
    const durationMinutes=35; // one-off classes use the standard Tiny Steps duration
    if (request.data?.durationMinutes !== undefined && Number(request.data.durationMinutes)!==35) {
      throw new HttpsError('invalid-argument','Ad hoc classes must be 35 minutes');
    }
    const db=admin.firestore();
    await assertTeacher(uid,db);
    const enrollmentRef=db.collection('enrollments').doc(enrollmentId);
    const sessionId=rollingSessionId(enrollmentId,date,startTime)+'_adhoc';
    const sessionRef=db.collection('classSessions').doc(sessionId);
    const result=await db.runTransaction(async tx=>{
      const enrSnap=await tx.get(enrollmentRef);
      if (!enrSnap.exists) throw new HttpsError('not-found','Enrollment not found');
      const enrollment=(enrSnap.data()||{}) as Row;
      const childId=assertAssignedActive(enrollment,uid,date);
      const occurrence=resolveTeacherCalendarOccurrence({enrollmentId,enrollment,date,startTime,durationMinutes});
      const teacherDayRef=db.collection('calendarTeacherAdHocDays').doc(uid+'_'+date);
      const studentDayRef=db.collection('calendarStudentAdHocDays').doc(childId+'_'+date);
      const [childSnap,existing,regular,charge,earning,teacherDay,studentDay,sameDay,teacherEnrollments,legacyEnrollments,uidEnrollments]=await Promise.all([
        tx.get(db.collection('kids').doc(childId)),
        tx.get(sessionRef),
        tx.get(db.collection('classSessions').doc(rollingSessionId(enrollmentId,date,startTime))),
        tx.get(db.collection('billingCharges').doc(sessionId)),
        tx.get(db.collection('teacherEarnings').doc(sessionId)),
        tx.get(teacherDayRef),
        tx.get(studentDayRef),
        tx.get(db.collection('classSessions').where('date','==',date).limit(251)),
        tx.get(db.collection('enrollments').where('teacherId','==',uid).limit(251)),
        tx.get(db.collection('enrollments').where('teacherUid','==',uid).limit(251)),
        tx.get(db.collection('enrollments').where('teacherUserId','==',uid).limit(251)),
      ]);
      if (existing.exists) {
        assertCalendarSessionIdentity((existing.data()||{}) as Row,enrollmentId,uid,childId,text(enrollment.courseId));
        return {sessionId,created:false};
      }
      if (!childSnap.exists || childSnap.data()?.deleted || childSnap.data()?.isDeleted ||
          childSnap.data()?.archived || childSnap.data()?.isArchived ||
          !['','active'].includes(text(childSnap.data()?.status).toLowerCase())) {
        throw new HttpsError('failed-precondition','Student profile is inactive or missing');
      }
      if (sameDay.size>250 || teacherEnrollments.size>250 ||
          legacyEnrollments.size>250 || uidEnrollments.size>250) {
        throw new HttpsError('failed-precondition','Calendar conflict coverage incomplete; Admin review required');
      }
      const currentStart=minutesOf(startTime);
      // Both past and future persisted bookings count. Never double-book a
      // teacher or child simply because an earlier class was completed.
      const existingOverlap=sameDay.docs.some(d=>{
        const data=d.data() as Row;
        if (['cancelled','canceled','withdrawn'].includes(text(data.status).toLowerCase())) return false;
        const teacherId=text(data.teacherId);
        if (teacherId!==uid && !rowBelongsToChild(data,childId)) return false;
        const otherStart=attendanceTimeOf(data);
        if (!otherStart) return true; // fail closed for incomplete history
        const duration=Number(data.durationMinutes||data.durationMins||35);
        return classIntervalsOverlap(currentStart,35,minutesOf(otherStart),
          Number.isFinite(duration)&&duration>0?duration:35);
      });
      if (existingOverlap || regular.exists || charge.exists || earning.exists) {
        throw new HttpsError('failed-precondition','This time conflicts with an existing class or finance record');
      }
      const schedules=new Map<string,Row>();
      for (const snapshot of [teacherEnrollments,legacyEnrollments,uidEnrollments]) {
        snapshot.docs.forEach(d=>schedules.set(d.id,d.data() as Row));
      }
      if (!schedules.has(enrollmentId)) schedules.set(enrollmentId,enrollment);
      if (hasTeacherVirtualCalendarConflict([...schedules.values()],uid,date,startTime,35)) {
        throw new HttpsError('failed-precondition','Time overlaps an existing scheduled class');
      }
      const asReservations=(snap:admin.firestore.DocumentSnapshot):AdHocDayReservation[]=>{
        const raw=snap.data()?.reservations;
        return Array.isArray(raw) ? raw as AdHocDayReservation[] : [];
      };
      const teacherSlots=asReservations(teacherDay),studentSlots=asReservations(studentDay);
      if (conflictsWithReservation(teacherSlots,startTime,35) ||
          conflictsWithReservation(studentSlots,startTime,35)) {
        throw new HttpsError('failed-precondition','An ad hoc class already occupies this time');
      }
      const reservation:AdHocDayReservation={sessionId,childId,startTime,durationMinutes:35};
      const payload=buildRollingScheduledSessionPayload({
        enrollmentId,enrollment,occurrence,scheduleRevision:0,actorId:uid,
      });
      tx.create(sessionRef,{
        ...payload,source:'teacher_ad_hoc',
        isAdHoc:true,isManual:true,
        manualSessionState:'approved',
        manualSessionApprovedAt:admin.firestore.FieldValue.serverTimestamp(),
        manualSessionApprovedBy:uid,
        notes:'Teacher-created ad hoc class',
        scheduleDeliveryMode:'ad_hoc',
      });
      // Two stable day documents serialize concurrent ad hoc attempts.
      tx.set(teacherDayRef,{reservations:[...teacherSlots,reservation],
        updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});
      tx.set(studentDayRef,{reservations:[...studentSlots,reservation],
        updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});
      return {sessionId,created:true};
    });
    return {...result,ok:true};
  },
);
