import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Timestamp, collection, documentId, getDocs, query, where } from 'firebase/firestore';
import { type FunctionsError, httpsCallable } from 'firebase/functions';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { useToast } from '@components/hooks/use-toast';
import { db, functions } from '../../lib/firebaseConfig';
import { useAuthStore } from '../../store/useAuthStore';
import {
  AttendanceCorrectionAfterCreateError,
  collectKidIds,
  createMissingSessionAndSaveAttendance,
  normalizeEnrollmentStatus,
  normalizeTimeForLabel,
  toIstDateLabel,
  toIstTimeLabel,
} from './attendanceCorrectionWorkflow';

type AttendanceCorrectionMode = 'existing' | 'create';

type AttendanceCorrectionStatus =
  | 'present'
  | 'absent'
  | 'cancelled'
  | 'rescheduled'
  | 'no_show'
  | 'reschedule_requested'
  | 'late';

type AttendanceCorrectionSession = {
  id: string;
  date: string;
  startTime: string;
  courseLabel: string;
  kidIds: string[];
  attendance: Record<string, unknown>;
};

type AttendanceCorrectionEnrollment = {
  id: string;
  kidId: string;
  kidIds: string[];
  courseLabel: string;
  defaultStartTime: string;
  defaultDurationMins: number;
};

type PendingSessionSelection = {
  sessionId: string;
  kidId: string;
} | null;

type TeacherOption = {
  id: string;
  label: string;
  identityIds: string[];
};

const ATTENDANCE_CORRECTION_STATUS_OPTIONS: AttendanceCorrectionStatus[] = [
  'present',
  'absent',
  'cancelled',
  'rescheduled',
  'no_show',
  'reschedule_requested',
  'late',
];

const TIME_HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toDateMaybe(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'object' && value !== null && typeof (value as { toDate?: unknown }).toDate === 'function') {
    const dt = (value as { toDate: () => Date }).toDate();
    if (dt instanceof Date && !Number.isNaN(dt.getTime())) return dt;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const dt = new Date(value);
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return null;
}

function resolveAttendanceStatus(entry: unknown): string {
  if (typeof entry === 'string') return entry.trim().toLowerCase();
  if (entry && typeof entry === 'object' && typeof (entry as { status?: unknown }).status === 'string') {
    return String((entry as { status: string }).status).trim().toLowerCase();
  }
  return '';
}

function clampDuration(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 35;
  return Math.max(10, Math.min(180, Math.floor(parsed)));
}

function resolveCourseLabel(data: Record<string, unknown>): string {
  const course = data.course && typeof data.course === 'object' && !Array.isArray(data.course)
    ? (data.course as Record<string, unknown>)
    : null;
  return (
    (typeof course?.title === 'string' && course.title.trim()) ||
    (typeof course?.name === 'string' && course.name.trim()) ||
    (typeof data.courseName === 'string' && data.courseName.trim()) ||
    (typeof data.courseLabel === 'string' && data.courseLabel.trim()) ||
    (typeof data.courseId === 'string' && data.courseId.trim()) ||
    'Course'
  );
}

function resolveEnrollmentDefaults(data: Record<string, unknown>): { startTime: string; durationMins: number } {
  const schedule = data.schedule && typeof data.schedule === 'object' && !Array.isArray(data.schedule)
    ? (data.schedule as Record<string, unknown>)
    : {};
  const weeklySlots = Array.isArray(schedule.weeklySlots) ? schedule.weeklySlots : [];
  const firstSlot = weeklySlots.find((entry) => entry && typeof entry === 'object') as Record<string, unknown> | undefined;
  const startTime =
    normalizeTimeForLabel(firstSlot?.time) ||
    normalizeTimeForLabel(schedule.timeHHmm) ||
    normalizeTimeForLabel(data.startTime) ||
    '18:00';
  const durationMins = clampDuration(
    firstSlot?.durationMinutes ??
      firstSlot?.durationMins ??
      schedule.durationMins ??
      data.durationMinutes ??
      data.durationMins ??
      35,
  );
  return { startTime, durationMins };
}

async function loadKidNames(kidIds: string[]): Promise<Record<string, string>> {
  const uniqueIds = Array.from(new Set(kidIds.map((id) => String(id || '').trim()).filter(Boolean)));
  const kidMap: Record<string, string> = {};

  for (let i = 0; i < uniqueIds.length; i += 10) {
    const chunk = uniqueIds.slice(i, i + 10);
    if (!chunk.length) continue;
    const kidSnap = await getDocs(query(collection(db, 'kids'), where(documentId(), 'in', chunk)));
    kidSnap.docs.forEach((kidDoc) => {
      const kid = (kidDoc.data() || {}) as Record<string, unknown>;
      const label =
        (typeof kid.fullName === 'string' && kid.fullName.trim()) ||
        (typeof kid.studentName === 'string' && kid.studentName.trim()) ||
        (typeof kid.name === 'string' && kid.name.trim()) ||
        kidDoc.id;
      kidMap[kidDoc.id] = label;
    });
  }

  return kidMap;
}

function formatFunctionsError(err: unknown): { code: string; message: string; details?: unknown } {
  const firebaseError = err as FunctionsError;
  const code = typeof firebaseError?.code === 'string' ? firebaseError.code : 'unknown';
  const message =
    typeof firebaseError?.message === 'string' && firebaseError.message.trim()
      ? firebaseError.message
      : err instanceof Error
        ? err.message
        : 'Please try again.';
  return { code, message, details: firebaseError?.details };
}

export default function AttendanceCorrectionsAdvancedPanel() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const saveInFlightRef = useRef(false);
  const [mode, setMode] = useState<AttendanceCorrectionMode>('existing');
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedDate, setSelectedDate] = useState(toIstDateLabel(new Date()));

  const [sessionRows, setSessionRows] = useState<AttendanceCorrectionSession[]>([]);
  const [existingKidNameById, setExistingKidNameById] = useState<Record<string, string>>({});
  const [selectedKidId, setSelectedKidId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');

  const [enrollmentRows, setEnrollmentRows] = useState<AttendanceCorrectionEnrollment[]>([]);
  const [createKidNameById, setCreateKidNameById] = useState<Record<string, string>>({});
  const [selectedCreateKidId, setSelectedCreateKidId] = useState('');
  const [selectedCreateEnrollmentId, setSelectedCreateEnrollmentId] = useState('');
  const [createStartTime, setCreateStartTime] = useState('18:00');
  const [createDurationMins, setCreateDurationMins] = useState(35);

  const [newStatus, setNewStatus] = useState<AttendanceCorrectionStatus>('present');
  const [reason, setReason] = useState('');
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingSessionSelection, setPendingSessionSelection] = useState<PendingSessionSelection>(null);

  useEffect(() => {
    let cancelled = false;
    const loadTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'teacher')));
        if (cancelled) return;
        const optionMap = new Map<string, TeacherOption>();
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const fullName =
            typeof data.fullName === 'string' && data.fullName.trim()
              ? data.fullName.trim()
              : typeof data.name === 'string' && data.name.trim()
                ? data.name.trim()
                : '';
          const email = typeof data.email === 'string' ? data.email.trim() : '';
          const uid = typeof data.uid === 'string' && data.uid.trim() ? data.uid.trim() : docSnap.id;
          optionMap.set(uid, {
            id: uid,
            label: fullName || email || uid,
            identityIds: Array.from(new Set([uid, docSnap.id].filter(Boolean))),
          });
        });
        const options = Array.from(optionMap.values()).sort((a, b) => a.label.localeCompare(b.label));
        setTeacherOptions(options);
        setSelectedTeacherId((current) => current || options[0]?.id || '');
      } catch (err) {
        console.error('Failed to load teacher options', err);
        if (!cancelled) {
          toast({
            title: 'Unable to load teachers',
            description: err instanceof Error ? err.message : 'Please try again.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setLoadingTeachers(false);
      }
    };

    void loadTeachers();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const selectedTeacherIdentityIds = useMemo(
    () => teacherOptions.find((option) => option.id === selectedTeacherId)?.identityIds ?? [],
    [selectedTeacherId, teacherOptions],
  );

  useEffect(() => {
    let cancelled = false;

    const loadSessions = async () => {
      if (!selectedTeacherId || selectedTeacherIdentityIds.length === 0 || !selectedDate) {
        setSessionRows([]);
        setExistingKidNameById({});
        return;
      }

      setLoadingSessions(true);
      try {
        const sessionMap = new Map<string, Record<string, unknown>>();
        const mergeDocs = (docs: Array<{ id: string; data: () => unknown }>) => {
          docs.forEach((docSnap) => {
            sessionMap.set(docSnap.id, (docSnap.data() || {}) as Record<string, unknown>);
          });
        };

        const primaryQueries = selectedTeacherIdentityIds.flatMap((teacherIdentityId) => [
          query(
            collection(db, 'classSessions'),
            where('teacherId', '==', teacherIdentityId),
            where('date', '==', selectedDate),
          ),
          query(
            collection(db, 'classSessions'),
            where('teacherIds', 'array-contains', teacherIdentityId),
            where('date', '==', selectedDate),
          ),
        ]);

        for (const plannedQuery of primaryQueries) {
          try {
            const snap = await getDocs(plannedQuery);
            mergeDocs(snap.docs);
          } catch (queryErr) {
            console.warn('Attendance correction date query failed, continuing fallback', queryErr);
          }
        }

        if (sessionMap.size === 0) {
          const dayStart = new Date(`${selectedDate}T00:00:00+05:30`);
          const nextDayStart = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
          const boundedQueries = selectedTeacherIdentityIds.flatMap((teacherIdentityId) => [
            query(
              collection(db, 'classSessions'),
              where('teacherId', '==', teacherIdentityId),
              where('startAt', '>=', Timestamp.fromDate(dayStart)),
              where('startAt', '<', Timestamp.fromDate(nextDayStart)),
            ),
            query(
              collection(db, 'classSessions'),
              where('teacherIds', 'array-contains', teacherIdentityId),
              where('startAt', '>=', Timestamp.fromDate(dayStart)),
              where('startAt', '<', Timestamp.fromDate(nextDayStart)),
            ),
          ]);
          for (const plannedQuery of boundedQueries) {
            try {
              const snap = await getDocs(plannedQuery);
              mergeDocs(snap.docs);
            } catch (queryErr) {
              console.warn('Attendance correction bounded query failed, continuing fallback', queryErr);
            }
          }
        }

        if (sessionMap.size === 0) {
          const fallbackQueries = selectedTeacherIdentityIds.flatMap((teacherIdentityId) => [
            query(collection(db, 'classSessions'), where('teacherId', '==', teacherIdentityId)),
            query(collection(db, 'classSessions'), where('teacherIds', 'array-contains', teacherIdentityId)),
          ]);
          for (const plannedQuery of fallbackQueries) {
            try {
              const snap = await getDocs(plannedQuery);
              mergeDocs(snap.docs);
            } catch (queryErr) {
              console.warn('Attendance correction teacher fallback query failed', queryErr);
            }
          }
        }
        if (cancelled) return;

        const rows = Array.from(sessionMap.entries())
          .map(([id, data]): AttendanceCorrectionSession => {
            const startAtDate = toDateMaybe(data.startAt);
            const date =
              (typeof data.date === 'string' && data.date.trim()) ||
              (startAtDate ? toIstDateLabel(startAtDate) : '');
            const startTime =
              normalizeTimeForLabel(data.startTime) ||
              (startAtDate ? toIstTimeLabel(startAtDate) : '');
            const kidIds = collectKidIds(data);
            const attendance =
              data.attendance && typeof data.attendance === 'object' && !Array.isArray(data.attendance)
                ? (data.attendance as Record<string, unknown>)
                : {};
            return {
              id,
              date,
              startTime,
              courseLabel: resolveCourseLabel(data),
              kidIds,
              attendance,
            };
          })
          .filter((row) => row.date === selectedDate)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        const kidMap = await loadKidNames(rows.flatMap((row) => row.kidIds));
        if (!cancelled) {
          setSessionRows(rows);
          setExistingKidNameById(kidMap);
        }
      } catch (err) {
        console.error('Failed to load attendance correction sessions', err);
        if (!cancelled) {
          setSessionRows([]);
          setExistingKidNameById({});
          toast({
            title: 'Unable to load sessions',
            description: err instanceof Error ? err.message : 'Please try again.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setLoadingSessions(false);
      }
    };

    void loadSessions();
    return () => {
      cancelled = true;
    };
  }, [selectedTeacherId, selectedTeacherIdentityIds, selectedDate, reloadKey, toast]);

  useEffect(() => {
    let cancelled = false;

    const loadEnrollments = async () => {
      if (!selectedTeacherId || selectedTeacherIdentityIds.length === 0) {
        setEnrollmentRows([]);
        setCreateKidNameById({});
        return;
      }

      setLoadingEnrollments(true);
      try {
        const enrollmentMap = new Map<string, Record<string, unknown>>();
        const queries = selectedTeacherIdentityIds.flatMap((teacherIdentityId) => [
          query(collection(db, 'enrollments'), where('teacherId', '==', teacherIdentityId)),
          query(collection(db, 'enrollments'), where('teacherIds', 'array-contains', teacherIdentityId)),
        ]);
        for (const plannedQuery of queries) {
          try {
            const snap = await getDocs(plannedQuery);
            snap.docs.forEach((docSnap) => {
              enrollmentMap.set(docSnap.id, (docSnap.data() || {}) as Record<string, unknown>);
            });
          } catch (queryErr) {
            console.warn('Attendance correction enrollment query failed', queryErr);
          }
        }
        if (cancelled) return;

        const rows = Array.from(enrollmentMap.entries())
          .map(([id, data]): AttendanceCorrectionEnrollment | null => {
            const status = normalizeEnrollmentStatus(data.status);
            if (status !== 'active' && status !== 'trial') return null;
            const kidIds = collectKidIds(data);
            const kidId = kidIds[0] || '';
            if (!kidId) return null;
            const defaults = resolveEnrollmentDefaults(data);
            return {
              id,
              kidId,
              kidIds,
              courseLabel: resolveCourseLabel(data),
              defaultStartTime: defaults.startTime,
              defaultDurationMins: defaults.durationMins,
            };
          })
          .filter((row): row is AttendanceCorrectionEnrollment => Boolean(row))
          .sort((a, b) => a.courseLabel.localeCompare(b.courseLabel));

        const kidMap = await loadKidNames(rows.flatMap((row) => row.kidIds));
        if (!cancelled) {
          setEnrollmentRows(rows);
          setCreateKidNameById(kidMap);
        }
      } catch (err) {
        console.error('Failed to load attendance correction enrollments', err);
        if (!cancelled) {
          setEnrollmentRows([]);
          setCreateKidNameById({});
          toast({
            title: 'Unable to load enrollments',
            description: err instanceof Error ? err.message : 'Please try again.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setLoadingEnrollments(false);
      }
    };

    void loadEnrollments();
    return () => {
      cancelled = true;
    };
  }, [selectedTeacherId, selectedTeacherIdentityIds, reloadKey, toast]);

  const kidOptions = useMemo(() => {
    const ids = Array.from(new Set(sessionRows.flatMap((row) => row.kidIds)));
    return ids
      .map((id) => ({ id, label: existingKidNameById[id] || id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [existingKidNameById, sessionRows]);

  const sessionOptions = useMemo(() => {
    const filtered = selectedKidId
      ? sessionRows.filter((row) => row.kidIds.includes(selectedKidId))
      : sessionRows;
    return filtered.map((row) => ({
      id: row.id,
      label: `${row.startTime || '--:--'} • ${row.courseLabel} • ${row.id.slice(0, 8)}`,
      attendance: row.attendance,
    }));
  }, [selectedKidId, sessionRows]);

  const createKidOptions = useMemo(() => {
    const ids = Array.from(new Set(enrollmentRows.flatMap((row) => row.kidIds)));
    return ids
      .map((id) => ({ id, label: createKidNameById[id] || id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [createKidNameById, enrollmentRows]);

  const createEnrollmentOptions = useMemo(
    () => enrollmentRows.filter((row) => !selectedCreateKidId || row.kidIds.includes(selectedCreateKidId)),
    [enrollmentRows, selectedCreateKidId],
  );

  useEffect(() => {
    if (!kidOptions.length) {
      setSelectedKidId('');
      return;
    }
    if (!selectedKidId || !kidOptions.some((option) => option.id === selectedKidId)) {
      setSelectedKidId(kidOptions[0].id);
    }
  }, [kidOptions, selectedKidId]);

  useEffect(() => {
    if (!sessionOptions.length) {
      setSelectedSessionId('');
      return;
    }
    if (!selectedSessionId || !sessionOptions.some((option) => option.id === selectedSessionId)) {
      setSelectedSessionId(sessionOptions[0].id);
    }
  }, [selectedSessionId, sessionOptions]);

  useEffect(() => {
    if (!createKidOptions.length) {
      setSelectedCreateKidId('');
      return;
    }
    if (!selectedCreateKidId || !createKidOptions.some((option) => option.id === selectedCreateKidId)) {
      setSelectedCreateKidId(createKidOptions[0].id);
    }
  }, [createKidOptions, selectedCreateKidId]);

  useEffect(() => {
    if (!createEnrollmentOptions.length) {
      setSelectedCreateEnrollmentId('');
      return;
    }
    if (
      !selectedCreateEnrollmentId ||
      !createEnrollmentOptions.some((option) => option.id === selectedCreateEnrollmentId)
    ) {
      setSelectedCreateEnrollmentId(createEnrollmentOptions[0].id);
    }
  }, [createEnrollmentOptions, selectedCreateEnrollmentId]);

  useEffect(() => {
    const selected = enrollmentRows.find((row) => row.id === selectedCreateEnrollmentId);
    if (!selected) return;
    setCreateStartTime(selected.defaultStartTime);
    setCreateDurationMins(selected.defaultDurationMins);
  }, [enrollmentRows, selectedCreateEnrollmentId]);

  useEffect(() => {
    if (!pendingSessionSelection) return;
    const found = sessionRows.some(
      (row) => row.id === pendingSessionSelection.sessionId && row.kidIds.includes(pendingSessionSelection.kidId),
    );
    if (!found) return;
    setSelectedKidId(pendingSessionSelection.kidId);
    setSelectedSessionId(pendingSessionSelection.sessionId);
    setPendingSessionSelection(null);
  }, [pendingSessionSelection, sessionRows]);

  const selectedSession = useMemo(
    () => sessionOptions.find((option) => option.id === selectedSessionId) || null,
    [selectedSessionId, sessionOptions],
  );

  const previousStatus = selectedSession && selectedKidId
    ? resolveAttendanceStatus(selectedSession.attendance[selectedKidId]) || 'not_marked'
    : 'not_marked';

  const saveCorrection = async (sessionId: string, kidId: string, trimmedReason: string) => {
    const correctionFn = httpsCallable<
      { sessionId: string; kidId: string; newStatus: AttendanceCorrectionStatus; reason: string },
      { ok: boolean; correctionId?: string }
    >(functions, 'adminAttendanceCorrection');
    return correctionFn({ sessionId, kidId, newStatus, reason: trimmedReason });
  };

  const handleSaveExisting = async () => {
    if (saveInFlightRef.current) return;
    if (!selectedTeacherId || !selectedKidId || !selectedSessionId) {
      toast({
        title: 'Incomplete selection',
        description: 'Choose teacher, student, and session before saving.',
        variant: 'destructive',
      });
      return;
    }
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      toast({
        title: 'Reason required',
        description: 'Please add a reason for this attendance correction.',
        variant: 'destructive',
      });
      return;
    }

    saveInFlightRef.current = true;
    setSaving(true);
    try {
      await saveCorrection(selectedSessionId, selectedKidId, trimmedReason);
      toast({
        title: 'Attendance corrected',
        description: 'Attendance correction saved with audit trail.',
      });
      setReason('');
      setReloadKey((value) => value + 1);
    } catch (err) {
      const error = formatFunctionsError(err);
      console.error('Failed to save attendance correction', error);
      toast({
        title: 'Unable to save correction',
        description: `${error.code}: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
    }
  };

  const handleCreateAndSave = async () => {
    if (saveInFlightRef.current) return;
    const selectedEnrollment = enrollmentRows.find((row) => row.id === selectedCreateEnrollmentId);
    if (!selectedTeacherId || !selectedDate || !selectedCreateKidId || !selectedEnrollment) {
      toast({
        title: 'Incomplete selection',
        description: 'Choose teacher, student, and enrollment before creating the session.',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedEnrollment.kidIds.includes(selectedCreateKidId)) {
      toast({
        title: 'Enrollment mismatch',
        description: 'The selected student is not part of this enrollment.',
        variant: 'destructive',
      });
      return;
    }
    if (!TIME_HHMM_RE.test(createStartTime)) {
      toast({ title: 'Invalid start time', description: 'Choose a valid HH:mm time.', variant: 'destructive' });
      return;
    }
    const durationMins = clampDuration(createDurationMins);
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      toast({
        title: 'Reason required',
        description: 'Explain why this missing session is being created and corrected.',
        variant: 'destructive',
      });
      return;
    }

    let createdSessionId = '';
    saveInFlightRef.current = true;
    setSaving(true);
    try {
      const createFn = httpsCallable<
        { enrollmentId: string; date: string; startTime: string; durationMins: number; reason: string },
        { ok: boolean; sessionId: string; alreadyExisted?: boolean }
      >(functions, 'createAdminManualSession');

      const created = await createMissingSessionAndSaveAttendance({
        createSession: async () => {
          const result = await createFn({
            enrollmentId: selectedEnrollment.id,
            date: selectedDate,
            startTime: createStartTime,
            durationMins,
            reason: trimmedReason,
          });
          return result.data;
        },
        saveAttendance: (sessionId) => saveCorrection(sessionId, selectedCreateKidId, trimmedReason),
      });
      createdSessionId = created.sessionId;

      setPendingSessionSelection({ sessionId: createdSessionId, kidId: selectedCreateKidId });
      setMode('existing');
      setReason('');
      setReloadKey((value) => value + 1);
      toast({
        title: 'Session created & attendance saved',
        description: `Created an approved ad hoc session for ${selectedDate} at ${createStartTime} and saved ${newStatus} attendance with an audit trail.`,
      });
    } catch (err) {
      if (err instanceof AttendanceCorrectionAfterCreateError) {
        createdSessionId = err.sessionId;
      }
      const error = formatFunctionsError(
        err instanceof AttendanceCorrectionAfterCreateError ? err.originalError : err,
      );
      console.error('Failed to create missing session and save attendance', {
        ...error,
        createdSessionId: createdSessionId || null,
      });

      if (createdSessionId) {
        setPendingSessionSelection({ sessionId: createdSessionId, kidId: selectedCreateKidId });
        setMode('existing');
        setReloadKey((value) => value + 1);
        toast({
          title: 'Session created; attendance needs retry',
          description: `${error.code}: ${error.message}. The new session is preserved and will appear under Correct Existing Session so attendance can be retried safely.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Unable to create missing session',
          description: `${error.code}: ${error.message}`,
          variant: 'destructive',
        });
      }
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
    }
  };

  const isAdmin = Boolean(user && user.role === 'admin');

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h3 className="text-lg font-semibold">Attendance Corrections</h3>
        <p className="text-sm text-slate-600">
          Correct an existing session or create a missing one-off session and record attendance in the same admin workflow.
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        <Button
          type="button"
          size="sm"
          variant={mode === 'existing' ? 'default' : 'ghost'}
          onClick={() => setMode('existing')}
          disabled={saving}
        >
          Correct Existing Session
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'create' ? 'default' : 'ghost'}
          onClick={() => setMode('create')}
          disabled={saving}
        >
          Create Missing Session
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Teacher</label>
          <select
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
            value={selectedTeacherId}
            onChange={(event) => setSelectedTeacherId(event.target.value)}
            disabled={loadingTeachers || saving}
          >
            {teacherOptions.length === 0 ? (
              <option value="">{loadingTeachers ? 'Loading teachers...' : 'No teachers found'}</option>
            ) : (
              teacherOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Session Date</label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      {mode === 'existing' ? (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Student</label>
              <select
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                value={selectedKidId}
                onChange={(event) => setSelectedKidId(event.target.value)}
                disabled={loadingSessions || saving || kidOptions.length === 0}
              >
                {kidOptions.length === 0 ? (
                  <option value="">{loadingSessions ? 'Loading students...' : 'No students for selected filters'}</option>
                ) : (
                  kidOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Session</label>
              <select
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                value={selectedSessionId}
                onChange={(event) => setSelectedSessionId(event.target.value)}
                disabled={loadingSessions || saving || sessionOptions.length === 0}
              >
                {sessionOptions.length === 0 ? (
                  <option value="">{loadingSessions ? 'Loading sessions...' : 'No sessions found'}</option>
                ) : (
                  sessionOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Previous Status</label>
              <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm">
                {previousStatus}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">New Status</label>
              <select
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                value={newStatus}
                onChange={(event) => setNewStatus(event.target.value as AttendanceCorrectionStatus)}
                disabled={saving}
              >
                {ATTENDANCE_CORRECTION_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            This creates an approved ad hoc session only. It does not change the student's recurring weekly schedule. Attendance is then saved through the same audited admin correction pipeline.
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Student</label>
              <select
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                value={selectedCreateKidId}
                onChange={(event) => setSelectedCreateKidId(event.target.value)}
                disabled={loadingEnrollments || saving || createKidOptions.length === 0}
              >
                {createKidOptions.length === 0 ? (
                  <option value="">
                    {loadingEnrollments ? 'Loading students...' : 'No active/trial students for this teacher'}
                  </option>
                ) : (
                  createKidOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Enrollment / Course</label>
              <select
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                value={selectedCreateEnrollmentId}
                onChange={(event) => setSelectedCreateEnrollmentId(event.target.value)}
                disabled={loadingEnrollments || saving || createEnrollmentOptions.length === 0}
              >
                {createEnrollmentOptions.length === 0 ? (
                  <option value="">{loadingEnrollments ? 'Loading enrollments...' : 'No operational enrollment found'}</option>
                ) : (
                  createEnrollmentOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.courseLabel}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Start Time</label>
              <Input
                type="time"
                value={createStartTime}
                onChange={(event) => setCreateStartTime(event.target.value)}
                disabled={saving}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Duration (mins)</label>
              <Input
                type="number"
                min={10}
                max={180}
                value={createDurationMins}
                onChange={(event) => setCreateDurationMins(Number(event.target.value))}
                disabled={saving}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">New Status</label>
              <select
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                value={newStatus}
                onChange={(event) => setNewStatus(event.target.value as AttendanceCorrectionStatus)}
                disabled={saving}
              >
                {ATTENDANCE_CORRECTION_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Reason (required)</label>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={
            mode === 'existing'
              ? 'Explain why this correction is needed.'
              : 'Explain why this missing session is being created and attendance recorded.'
          }
          rows={3}
          disabled={saving}
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={mode === 'existing' ? handleSaveExisting : handleCreateAndSave}
          disabled={saving || !isAdmin}
        >
          {saving
            ? mode === 'existing'
              ? 'Saving...'
              : 'Creating & Saving...'
            : mode === 'existing'
              ? 'Save Correction'
              : 'Create Session & Save Attendance'}
        </Button>
      </div>
    </Card>
  );
}
