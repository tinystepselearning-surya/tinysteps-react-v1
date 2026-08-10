import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { TeacherSession, AttendanceStatus } from '../../../../types/Teacher';
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../store/useAuthStore';
import { INDIA_TIME_ZONE, formatSessionTimeRange, getSessionStartDate } from '../../../../lib/sessionTime';
import {
  ATTENDANCE_FINALISED_MESSAGE,
  getTeacherAttendanceCorrectionCutoffMillis,
} from '../../../../lib/attendanceCorrectionFreeze';

interface AttendanceFormProps {
  open: boolean;
  session: TeacherSession | null;
  onClose: () => void;
  onSubmit: (data: {
    attendance: Record<string, { status: AttendanceStatus; notes?: string }>;
    sessionNotes: string;
    meta?: { courseId?: string; courseLabel?: string; attendanceOnly?: boolean };
  }) => Promise<void>;
  /**
   * Kept for backwards compatibility with existing callers.
   * Attendance is now always attendance-only; lesson progress is updated from
   * the dedicated Topic Progress page so stale curriculum config cannot write progress.
   */
  attendanceOnly?: boolean;
}

type AttendanceOutcome = AttendanceStatus | 'reschedule_requested' | '';

type AttendanceEntryState = {
  status: AttendanceOutcome;
  notes?: string;
};

const STATUS_OPTIONS: AttendanceOutcome[] = ['present', 'absent', 'late', 'reschedule_requested'];

const COURSE_ID_ALIASES: Record<string, string> = {
  'phonics-foundation': 'phonics-foundations',
  'phonics-foundations': 'phonics-foundations',
  foundational: 'phonics-foundations',
  foundation: 'phonics-foundations',
  'phonics-brush-up': 'early-phonics',
  'phonics-early': 'early-phonics',
  'early-phonics': 'early-phonics',
  early: 'early-phonics',
  'phonics-advanced': 'advanced-phonics',
  'advanced-phonics': 'advanced-phonics',
  advanced: 'advanced-phonics',
  'grammar-essentials': 'basic-grammar',
  'grammar-mastery': 'advanced-grammar',
  'intermediate-grammar': 'basic-grammar',
  'public-speaking-foundations': 'basic-public-speaking',
  'public-speaking-excellence': 'advanced-public-speaking',
  'intermediate-public-speaking': 'basic-public-speaking',
};

const COURSE_NAME_TO_ID: Record<string, string> = {
  'phonics foundations': 'phonics-foundations',
  'phonics foundation': 'phonics-foundations',
  'foundation phonics': 'phonics-foundations',
  'early phonics': 'early-phonics',
  'advanced phonics': 'advanced-phonics',
  'basic grammar': 'basic-grammar',
  'intermediate grammar': 'basic-grammar',
  'advanced grammar': 'advanced-grammar',
  'public speaking (basic)': 'basic-public-speaking',
  'public speaking (intermediate)': 'basic-public-speaking',
  'public speaking (advanced)': 'advanced-public-speaking',
  'public speaking foundations': 'basic-public-speaking',
  'public speaking excellence': 'advanced-public-speaking',
};

const COURSE_LABEL_BY_ID: Record<string, string> = {
  'phonics-foundations': 'Foundation Phonics',
  'early-phonics': 'Early Phonics',
  'advanced-phonics': 'Advanced Phonics',
  'basic-grammar': 'Basic Grammar',
  'advanced-grammar': 'Advanced Grammar',
  'basic-public-speaking': 'Public Speaking (Basic)',
  'advanced-public-speaking': 'Public Speaking (Advanced)',
};

const normalizeCourseId = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const key = trimmed.toLowerCase();
  return COURSE_ID_ALIASES[key] || trimmed;
};

const mapCourseNameToId = (value?: string | null): string | null => {
  if (!value) return null;
  const key = String(value).trim().toLowerCase();
  return COURSE_NAME_TO_ID[key] || null;
};

const normalizeAttendanceStatus = (value: unknown): AttendanceOutcome => {
  if (!value) return '';
  if (typeof value === 'string') {
    return STATUS_OPTIONS.includes(value as AttendanceOutcome) ? (value as AttendanceOutcome) : '';
  }
  if (typeof value === 'object' && value !== null && typeof (value as { status?: unknown }).status === 'string') {
    const status = (value as { status: string }).status;
    return STATUS_OPTIONS.includes(status as AttendanceOutcome) ? (status as AttendanceOutcome) : '';
  }
  return '';
};

export const AttendanceForm: React.FC<AttendanceFormProps> = (props) => {
  const { open, session, onClose, onSubmit } = props;
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<Record<string, AttendanceEntryState>>({});
  const [sessionNotes, setSessionNotes] = useState('');
  const [kidNameById, setKidNameById] = useState<Record<string, string>>({});
  const [enrollmentCourseId, setEnrollmentCourseId] = useState<string | null>(null);
  const canOverrideAttendanceTime = String((user as any)?.role || '').trim().toLowerCase() === 'admin';

  const { students } = useTeacherFilteredStudents();

  const kidNameFromHookById = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((student) => {
      const name = student.fullName
        || (student as any).studentName
        || (student as any).name
        || (student as any).displayName
        || (student as any).email
        || '';
      if (name && student.uid) map.set(student.uid, name);
      if (name && (student as any).id) map.set((student as any).id, name);
      if (name && (student as any).userId) map.set((student as any).userId, name);
    });
    return map;
  }, [students]);

  const kidIds = useMemo(
    () => (session?.kidIds?.length ? session.kidIds : []),
    [session],
  );

  const enrollmentId = useMemo(
    () => (session as any)?.enrollmentId as string | undefined,
    [session],
  );

  const directCourseId = useMemo(
    () => normalizeCourseId(session?.courseId),
    [session?.courseId],
  );
  const sessionCourseLabel = session?.courseName || (session as any)?.courseLabel || null;
  const nameCourseId = useMemo(
    () => mapCourseNameToId(sessionCourseLabel),
    [sessionCourseLabel],
  );
  const effectiveCourseId = directCourseId || enrollmentCourseId || nameCourseId || '';
  const effectiveCourseLabel =
    sessionCourseLabel
    || (effectiveCourseId ? COURSE_LABEL_BY_ID[effectiveCourseId] : '')
    || effectiveCourseId
    || '';

  useEffect(() => {
    let cancelled = false;

    const resolveEnrollmentCourse = async () => {
      if (!session || directCourseId || !enrollmentId) {
        setEnrollmentCourseId(null);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'enrollments', enrollmentId));
        const data = snap.exists() ? (snap.data() as any) : null;
        const next = normalizeCourseId(
          data?.courseId
          || data?.courseName
          || data?.courseLabel
          || data?.course?.id
          || data?.course?.name,
        );
        if (!cancelled) setEnrollmentCourseId(next);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[AttendanceForm] enrollment course fetch failed', err);
        }
        if (!cancelled) setEnrollmentCourseId(null);
      }
    };

    void resolveEnrollmentCourse();
    return () => {
      cancelled = true;
    };
  }, [session, directCourseId, enrollmentId]);

  useEffect(() => {
    if (!session) {
      setFormState({});
      setSessionNotes('');
      return;
    }

    const attendance = (session.attendance as any) || {};
    const allPresentByDefault =
      kidIds.length > 0
      && kidIds.every((kidId) => normalizeAttendanceStatus(attendance?.[kidId]) === 'present')
      && session.status !== 'completed'
      && session.status !== 'in_progress';

    const defaults: Record<string, AttendanceEntryState> = {};
    kidIds.forEach((kidId) => {
      defaults[kidId] = {
        status: allPresentByDefault ? '' : normalizeAttendanceStatus(attendance?.[kidId]),
        notes: typeof attendance?.[kidId]?.notes === 'string' ? attendance[kidId].notes : '',
      };
    });
    setFormState(defaults);
    setSessionNotes(session.notes || '');
  }, [session, kidIds]);

  useEffect(() => {
    if (!session || kidIds.length === 0) return;
    let cancelled = false;

    const fetchMissingNames = async () => {
      const missingKidIds = kidIds.filter(
        (kidId) => !kidNameFromHookById.has(kidId) && !kidNameById[kidId],
      );
      if (missingKidIds.length === 0) return;

      const fetchedNames: Record<string, string> = {};
      await Promise.all(
        missingKidIds.map(async (kidId) => {
          try {
            const kidDocSnap = await getDoc(doc(db, 'kids', kidId));
            if (!kidDocSnap.exists() || cancelled) return;
            const data = kidDocSnap.data();
            fetchedNames[kidId] = data.fullName
              || data.studentName
              || data.name
              || data.displayName
              || 'Student';
          } catch (err) {
            if (import.meta.env.DEV) {
              console.warn(`[AttendanceForm] Failed to fetch name for kid ${kidId}`, err);
            }
          }
        }),
      );

      if (!cancelled && Object.keys(fetchedNames).length > 0) {
        setKidNameById((prev) => ({ ...prev, ...fetchedNames }));
      }
    };

    void fetchMissingNames();
    return () => {
      cancelled = true;
    };
  }, [session, kidIds, kidNameFromHookById, kidNameById]);

  const getSessionStartMillis = (): number | null => {
    const fromStartAt = session ? getSessionStartDate(session) : null;
    if (fromStartAt) return fromStartAt.getTime();

    const dateYmd = typeof session?.date === 'string' ? session.date.trim() : '';
    const rawTime = typeof session?.startTime === 'string' ? session.startTime.trim() : '';
    const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(rawTime);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd) || !match) return null;
    const parsed = Date.parse(`${dateYmd}T${match[1]}:${match[2]}:${match[3] || '00'}+05:30`);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const getAttendanceAllowedAtMillis = (): number | null => {
    const startMs = getSessionStartMillis();
    return startMs === null ? null : startMs + 30 * 60 * 1000;
  };

  const attendanceCorrectionCutoffMs = session
    ? getTeacherAttendanceCorrectionCutoffMillis(session)
    : null;
  const isAttendanceFinalised =
    !canOverrideAttendanceTime
    && attendanceCorrectionCutoffMs !== null
    && Date.now() >= attendanceCorrectionCutoffMs;

  const handleChange = (kidId: string, status: AttendanceOutcome) => {
    setFormState((prev) => ({
      ...prev,
      [kidId]: { ...prev[kidId], status },
    }));
  };

  const handleNotesChange = (kidId: string, notes: string) => {
    setFormState((prev) => ({
      ...prev,
      [kidId]: { ...prev[kidId], notes },
    }));
  };

  const hasMissingStatus = useMemo(
    () => kidIds.some((kidId) => !formState[kidId]?.status),
    [kidIds, formState],
  );

  const buildTopicProgressUrl = (kidId: string) => {
    const params = new URLSearchParams();
    const tabParam = new URLSearchParams(location.search).get('tab');
    const fromParam = tabParam === 'today' ? 'today' : tabParam === 'schedule' ? 'schedule' : 'sessions';
    const returnTo = `${location.pathname}${location.search}`;

    params.set('from', fromParam);
    params.set('tab', 'topic');
    params.set('returnTo', returnTo);
    if (effectiveCourseId) params.set('courseId', effectiveCourseId);
    if (enrollmentId) params.set('enrollmentId', enrollmentId);

    return `/teacher/students/${kidId}/topic-progress?${params.toString()}`;
  };

  const handleSubmit = async () => {
    if (!session) return;
    if (hasMissingStatus) {
      toast({
        title: 'Select attendance status',
        description: 'Please choose Present/Absent/Late/Reschedule for each student.',
        variant: 'destructive',
      });
      return;
    }

    if (!canOverrideAttendanceTime) {
      const allowedAt = getAttendanceAllowedAtMillis();
      const correctionCutoffAt = getTeacherAttendanceCorrectionCutoffMillis(session);
      const nowMs = Date.now();
      if (allowedAt === null || correctionCutoffAt === null) {
        toast({
          title: 'Attendance unavailable',
          description: 'Attendance time could not be verified. Please contact admin.',
          variant: 'destructive',
        });
        return;
      }
      if (nowMs < allowedAt) {
        toast({
          title: 'Attendance unavailable',
          description: `Attendance opens at ${new Date(allowedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`,
          variant: 'destructive',
        });
        return;
      }
      if (nowMs >= correctionCutoffAt) {
        toast({
          title: 'Attendance unavailable',
          description: ATTENDANCE_FINALISED_MESSAGE,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const attendance: Record<string, { status: AttendanceStatus; notes?: string }> = {};
      kidIds.forEach((kidId) => {
        const entry = formState[kidId];
        if (!entry?.status) return;
        attendance[kidId] = {
          status: entry.status as AttendanceStatus,
          notes: entry.notes || '',
        };
      });

      await onSubmit({
        attendance,
        sessionNotes,
        meta: {
          courseId: effectiveCourseId || undefined,
          courseLabel: effectiveCourseLabel || undefined,
          attendanceOnly: true,
        },
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
          <DialogDescription>
            Mark attendance and class notes here. Lesson-wise progress is updated separately from the canonical Topic Progress page.
          </DialogDescription>
        </DialogHeader>

        {!session ? (
          <p className="text-sm text-muted-foreground">Select a session to mark attendance.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">{session.courseName || session.courseId || 'Course'}</p>
              <p className="text-xs text-muted-foreground">
                {formatSessionTimeRange(session, { timeZone: INDIA_TIME_ZONE })}
              </p>
            </div>

            {isAttendanceFinalised ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {ATTENDANCE_FINALISED_MESSAGE}
              </p>
            ) : null}

            <fieldset disabled={isAttendanceFinalised} className="space-y-4 disabled:opacity-60">
              {kidIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students assigned to this session.</p>
              ) : (
                kidIds.map((kidId) => {
                  const displayName = kidNameFromHookById.get(kidId)
                    || kidNameById[kidId]
                    || `Student (${kidId.slice(0, 6)}…)`;
                  const selectedStatus = formState[kidId]?.status;
                  const isRescheduleRequested = selectedStatus === 'reschedule_requested';
                  const isAbsent = selectedStatus === 'absent';
                  const canOpenProgress = !isRescheduleRequested && !isAbsent;

                  return (
                    <div key={kidId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gray-200 rounded-full" />
                          <Label className="font-medium">{displayName}</Label>
                        </div>
                        <Select
                          value={formState[kidId]?.status ?? ''}
                          onValueChange={(value) => handleChange(kidId, value as AttendanceOutcome)}
                        >
                          <SelectTrigger className="w-[170px]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {canOpenProgress ? (
                        <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(buildTopicProgressUrl(kidId))}
                          >
                            Open Topics & Lesson Feedback
                          </Button>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Use the lesson-progress page for curriculum selection, skill ratings, strengths, practice areas, and parent feedback.
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Lesson progress is not updated for absent or reschedule-requested attendance.
                        </p>
                      )}

                      <div className="space-y-1">
                        <Label>{isAbsent || isRescheduleRequested ? 'Reason (optional)' : 'Class note (optional)'}</Label>
                        <Textarea
                          placeholder={isAbsent || isRescheduleRequested ? 'Add reason (optional)' : 'Add class note (optional)'}
                          value={formState[kidId]?.notes || ''}
                          onChange={(event) => handleNotesChange(kidId, event.target.value)}
                        />
                      </div>
                    </div>
                  );
                })
              )}

              <div>
                <Label>Class feedback (optional)</Label>
                <Textarea
                  placeholder="How was the session? Any issues?"
                  value={sessionNotes}
                  onChange={(event) => setSessionNotes(event.target.value)}
                  rows={3}
                />
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isAttendanceFinalised || isSubmitting || kidIds.length === 0 || hasMissingStatus}
              >
                {isSubmitting ? 'Saving...' : 'Save & Close'}
              </Button>
            </div>
            {hasMissingStatus ? (
              <p className="text-xs text-amber-600">Select attendance status for all students to save.</p>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
