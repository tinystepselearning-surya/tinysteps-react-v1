import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  collectionGroup,
  getDoc,
  getDocs,
  query,
  where,
  type DocumentReference,
} from 'firebase/firestore';
import { type FunctionsError, httpsCallable } from 'firebase/functions';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { useToast } from '@components/hooks/use-toast';
import { db, functions } from '../../lib/firebaseConfig';
import {
  AttendanceCorrectionAfterCreateError,
  collectKidIds,
  createMissingSessionAndSaveAttendance,
  normalizeEnrollmentStatus,
  normalizeTimeForLabel,
  toIstDateLabel,
} from './attendanceCorrectionWorkflow';

type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'cancelled'
  | 'rescheduled'
  | 'no_show'
  | 'reschedule_requested'
  | 'late';

type TeacherOption = {
  id: string;
  label: string;
  identityIds: string[];
};

type HistoricalEnrollmentOption = {
  id: string;
  kidId: string;
  kidIds: string[];
  courseLabel: string;
  status: string;
  relation: 'previous_course' | 'previous_teacher' | 'paused';
  defaultStartTime: string;
  defaultDurationMins: number;
};

const STATUS_OPTIONS: AttendanceStatus[] = [
  'present',
  'absent',
  'cancelled',
  'rescheduled',
  'no_show',
  'reschedule_requested',
  'late',
];

const TERMINAL = new Set(['completed', 'discontinued', 'expired', 'cancelled', 'archived', 'inactive']);
const TIME_HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function clampDuration(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 35;
  return Math.max(10, Math.min(180, Math.floor(parsed)));
}

function courseLabel(data: Record<string, unknown>): string {
  return clean(data.courseName) || clean(data.courseLabel) || clean(data.courseTitle) || clean(data.courseId) || 'Course';
}

function enrollmentDefaults(data: Record<string, unknown>) {
  const schedule = data.schedule && typeof data.schedule === 'object' && !Array.isArray(data.schedule)
    ? (data.schedule as Record<string, unknown>)
    : {};
  const weeklySlots = Array.isArray(schedule.weeklySlots) ? schedule.weeklySlots : [];
  const firstSlot = weeklySlots.find((entry) => entry && typeof entry === 'object') as Record<string, unknown> | undefined;
  return {
    startTime:
      normalizeTimeForLabel(firstSlot?.time) ||
      normalizeTimeForLabel(schedule.timeHHmm) ||
      normalizeTimeForLabel(data.startTime) ||
      '18:00',
    durationMins: clampDuration(
      firstSlot?.durationMinutes ??
      firstSlot?.durationMins ??
      schedule.durationMins ??
      data.durationMinutes ??
      data.durationMins ??
      35,
    ),
  };
}

function formatError(err: unknown): { code: string; message: string } {
  const firebaseError = err as FunctionsError;
  return {
    code: typeof firebaseError?.code === 'string' ? firebaseError.code : 'unknown',
    message:
      typeof firebaseError?.message === 'string' && firebaseError.message.trim()
        ? firebaseError.message
        : err instanceof Error
          ? err.message
          : 'Please try again.',
  };
}

async function loadKidNames(kidIds: string[]): Promise<Record<string, string>> {
  const uniqueIds = Array.from(new Set(kidIds.map((id) => clean(id)).filter(Boolean)));
  const out: Record<string, string> = {};
  for (const kidId of uniqueIds) {
    try {
      const snap = await getDoc((await import('firebase/firestore')).doc(db, 'kids', kidId));
      if (!snap.exists()) continue;
      const data = snap.data() as Record<string, unknown>;
      out[kidId] = clean(data.fullName) || clean(data.studentName) || clean(data.name) || kidId;
    } catch {
      out[kidId] = kidId;
    }
  }
  return out;
}

export default function HistoricalAttendanceMissingSessionPanel() {
  const { toast } = useToast();
  const saveInFlight = useRef(false);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [enrollments, setEnrollments] = useState<HistoricalEnrollmentOption[]>([]);
  const [kidNames, setKidNames] = useState<Record<string, string>>({});
  const [kidId, setKidId] = useState('');
  const [enrollmentId, setEnrollmentId] = useState('');
  const [date, setDate] = useState(toIstDateLabel(new Date()));
  const [startTime, setStartTime] = useState('18:00');
  const [durationMins, setDurationMins] = useState(35);
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [reason, setReason] = useState('');
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingTeachers(true);
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'teacher')));
        if (cancelled) return;
        const options = snap.docs
          .map((docSnap) => {
            const data = docSnap.data() as Record<string, unknown>;
            const uid = clean(data.uid) || docSnap.id;
            return {
              id: uid,
              label: clean(data.fullName) || clean(data.displayName) || clean(data.name) || clean(data.email) || uid,
              identityIds: Array.from(new Set([uid, docSnap.id].filter(Boolean))),
            };
          })
          .sort((a, b) => a.label.localeCompare(b.label));
        setTeachers(options);
        setTeacherId((current) => current || options[0]?.id || '');
      } catch (error) {
        if (!cancelled) {
          toast({
            title: 'Unable to load teachers',
            description: error instanceof Error ? error.message : 'Please try again.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setLoadingTeachers(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [toast]);

  const selectedTeacherIdentities = useMemo(
    () => teachers.find((option) => option.id === teacherId)?.identityIds ?? [],
    [teacherId, teachers],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!teacherId || selectedTeacherIdentities.length === 0) {
        setEnrollments([]);
        setKidNames({});
        return;
      }
      setLoadingEnrollments(true);
      try {
        const enrollmentMap = new Map<string, Record<string, unknown>>();
        const previousTeacherEnrollmentIds = new Set<string>();

        const currentQueries = selectedTeacherIdentities.flatMap((identity) => [
          query(collection(db, 'enrollments'), where('teacherId', '==', identity)),
          query(collection(db, 'enrollments'), where('teacherIds', 'array-contains', identity)),
        ]);
        for (const planned of currentQueries) {
          try {
            const snap = await getDocs(planned);
            snap.docs.forEach((docSnap) => enrollmentMap.set(docSnap.id, docSnap.data() as Record<string, unknown>));
          } catch (error) {
            console.warn('Historical attendance current-teacher enrollment query failed', error);
          }
        }

        for (const identity of selectedTeacherIdentities) {
          try {
            const historySnap = await getDocs(
              query(collectionGroup(db, 'teacherReassignments'), where('oldTeacherId', '==', identity)),
            );
            const refs = new Map<string, DocumentReference>();
            historySnap.docs.forEach((historyDoc) => {
              const enrollmentRef = historyDoc.ref.parent.parent;
              if (enrollmentRef) refs.set(enrollmentRef.id, enrollmentRef);
            });
            for (const enrollmentRef of refs.values()) {
              previousTeacherEnrollmentIds.add(enrollmentRef.id);
              if (enrollmentMap.has(enrollmentRef.id)) continue;
              const enrollmentSnap = await getDoc(enrollmentRef);
              if (enrollmentSnap.exists()) {
                enrollmentMap.set(enrollmentSnap.id, enrollmentSnap.data() as Record<string, unknown>);
              }
            }
          } catch (error) {
            console.warn('Historical attendance reassignment history query failed', error);
          }
        }

        if (cancelled) return;
        const rows = Array.from(enrollmentMap.entries())
          .map(([id, data]): HistoricalEnrollmentOption | null => {
            const normalizedStatus = normalizeEnrollmentStatus(data.status);
            const isTerminal = TERMINAL.has(normalizedStatus);
            const isPreviousTeacher = previousTeacherEnrollmentIds.has(id);
            const isPaused = normalizedStatus === 'paused';
            if (!isTerminal && !isPreviousTeacher && !isPaused) return null;
            const kidIds = collectKidIds(data);
            const canonicalKidId = kidIds[0] || '';
            if (!canonicalKidId) return null;
            const defaults = enrollmentDefaults(data);
            return {
              id,
              kidId: canonicalKidId,
              kidIds,
              courseLabel: courseLabel(data),
              status: normalizedStatus,
              relation: isPreviousTeacher ? 'previous_teacher' : isTerminal ? 'previous_course' : 'paused',
              defaultStartTime: defaults.startTime,
              defaultDurationMins: defaults.durationMins,
            };
          })
          .filter((row): row is HistoricalEnrollmentOption => Boolean(row))
          .sort((a, b) => `${a.courseLabel}-${a.status}`.localeCompare(`${b.courseLabel}-${b.status}`));

        const names = await loadKidNames(rows.flatMap((row) => row.kidIds));
        if (!cancelled) {
          setEnrollments(rows);
          setKidNames(names);
        }
      } catch (error) {
        if (!cancelled) {
          setEnrollments([]);
          setKidNames({});
          toast({
            title: 'Unable to load previous enrollments',
            description: error instanceof Error ? error.message : 'Please try again.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setLoadingEnrollments(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [selectedTeacherIdentities, teacherId, toast]);

  const kidOptions = useMemo(() => {
    const ids = Array.from(new Set(enrollments.flatMap((row) => row.kidIds)));
    return ids.map((id) => ({ id, label: kidNames[id] || id })).sort((a, b) => a.label.localeCompare(b.label));
  }, [enrollments, kidNames]);

  const enrollmentOptions = useMemo(
    () => enrollments.filter((row) => !kidId || row.kidIds.includes(kidId)),
    [enrollments, kidId],
  );

  useEffect(() => {
    if (!kidOptions.length) {
      setKidId('');
      return;
    }
    if (!kidId || !kidOptions.some((option) => option.id === kidId)) setKidId(kidOptions[0].id);
  }, [kidId, kidOptions]);

  useEffect(() => {
    if (!enrollmentOptions.length) {
      setEnrollmentId('');
      return;
    }
    if (!enrollmentId || !enrollmentOptions.some((option) => option.id === enrollmentId)) {
      setEnrollmentId(enrollmentOptions[0].id);
    }
  }, [enrollmentId, enrollmentOptions]);

  useEffect(() => {
    const selected = enrollments.find((row) => row.id === enrollmentId);
    if (!selected) return;
    setStartTime(selected.defaultStartTime);
    setDurationMins(selected.defaultDurationMins);
  }, [enrollmentId, enrollments]);

  const selectedEnrollment = enrollments.find((row) => row.id === enrollmentId) || null;

  const handleCreateAndCorrect = async () => {
    if (saveInFlight.current) return;
    if (!teacherId || !kidId || !selectedEnrollment || !date || !TIME_HHMM_RE.test(startTime)) {
      toast({
        title: 'Incomplete selection',
        description: 'Choose the historical teacher, student, course, date, and time.',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedEnrollment.kidIds.includes(kidId)) {
      toast({ title: 'Enrollment mismatch', description: 'Selected student is not part of this course record.', variant: 'destructive' });
      return;
    }
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      toast({ title: 'Reason required', description: 'Explain why this historical attendance record is being created.', variant: 'destructive' });
      return;
    }

    saveInFlight.current = true;
    setSaving(true);
    let createdSessionId = '';
    try {
      const createFn = httpsCallable<
        { enrollmentId: string; teacherId: string; date: string; startTime: string; durationMins: number; reason: string },
        { ok: boolean; sessionId: string; alreadyExisted?: boolean; historical?: boolean }
      >(functions, 'createAdminHistoricalAttendanceSession');
      const correctionFn = httpsCallable<
        { sessionId: string; kidId: string; newStatus: AttendanceStatus; reason: string },
        { ok: boolean; correctionId?: string }
      >(functions, 'adminAttendanceCorrection');

      const created = await createMissingSessionAndSaveAttendance({
        createSession: async () => {
          const response = await createFn({
            enrollmentId: selectedEnrollment.id,
            teacherId,
            date,
            startTime,
            durationMins: clampDuration(durationMins),
            reason: trimmedReason,
          });
          return response.data;
        },
        saveAttendance: (sessionId) => correctionFn({ sessionId, kidId, newStatus: status, reason: trimmedReason }),
      });
      createdSessionId = created.sessionId;
      setReason('');
      toast({
        title: created.alreadyExisted ? 'Historical session found & corrected' : 'Historical attendance created',
        description: `${selectedEnrollment.courseLabel} • ${date} • ${status}. Previous course/teacher identity was preserved.`,
      });
    } catch (error) {
      if (error instanceof AttendanceCorrectionAfterCreateError) createdSessionId = error.sessionId;
      const formatted = formatError(
        error instanceof AttendanceCorrectionAfterCreateError ? error.originalError : error,
      );
      toast({
        title: createdSessionId ? 'Historical session preserved; attendance needs retry' : 'Historical correction could not be created',
        description: `${formatted.code}: ${formatted.message}`,
        variant: 'destructive',
      });
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  };

  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-slate-900">
        Historical / Previous Course — Missing Session
      </summary>
      <div className="mt-3 space-y-4">
        <p className="text-xs text-slate-600">
          Use this only when an old session is completely missing after a course or teacher change. It creates one audited historical session only; it never reactivates the old enrollment or restarts its schedule.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Teacher who taught that class</label>
            <select
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
              value={teacherId}
              onChange={(event) => setTeacherId(event.target.value)}
              disabled={loadingTeachers || saving}
            >
              {teachers.length === 0 ? (
                <option value="">{loadingTeachers ? 'Loading teachers...' : 'No teachers found'}</option>
              ) : teachers.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Historical class date</label>
            <Input
              type="date"
              value={date}
              max={toIstDateLabel(new Date())}
              onChange={(event) => setDate(event.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Student</label>
            <select
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
              value={kidId}
              onChange={(event) => setKidId(event.target.value)}
              disabled={loadingEnrollments || saving || kidOptions.length === 0}
            >
              {kidOptions.length === 0 ? (
                <option value="">{loadingEnrollments ? 'Loading previous records...' : 'No previous course/teacher records found'}</option>
              ) : kidOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Previous enrollment / course</label>
            <select
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
              value={enrollmentId}
              onChange={(event) => setEnrollmentId(event.target.value)}
              disabled={loadingEnrollments || saving || enrollmentOptions.length === 0}
            >
              {enrollmentOptions.length === 0 ? (
                <option value="">No eligible previous enrollment</option>
              ) : enrollmentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.courseLabel} • {option.status.replace(/_/g, ' ')}
                  {option.relation === 'previous_teacher' ? ' • previous teacher' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Start time</label>
            <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} disabled={saving} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Duration (mins)</label>
            <Input
              type="number"
              min={10}
              max={180}
              value={durationMins}
              onChange={(event) => setDurationMins(Number(event.target.value))}
              disabled={saving}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Attendance status</label>
            <select
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value as AttendanceStatus)}
              disabled={saving}
            >
              {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Reason (required)</label>
          <Textarea
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why is this historical class missing, and what should the attendance be?"
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {selectedEnrollment
              ? `${selectedEnrollment.courseLabel} • ${selectedEnrollment.status.replace(/_/g, ' ')}`
              : 'Select a previous course record.'}
          </div>
          <Button onClick={handleCreateAndCorrect} disabled={saving || !selectedEnrollment}>
            {saving ? 'Creating & Correcting...' : 'Create Historical Session & Save Attendance'}
          </Button>
        </div>
      </div>
    </details>
  );
}
