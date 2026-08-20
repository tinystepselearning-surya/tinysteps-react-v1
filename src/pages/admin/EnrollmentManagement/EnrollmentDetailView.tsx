// src/pages/admin/EnrollmentManagement/EnrollmentDetailView.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  type DocumentData,
  type DocumentSnapshot,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, functions } from '../../../lib/firebaseConfig';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { useToast } from '@components/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import AssignTeacherModal from './AssignTeacherModal';

interface EnrollmentDetailViewProps {
  enrollmentId: string;
  onClose: () => void;
}

type CourseOption = {
  id: string;
  name?: string;
  title?: string;
  courseName?: string;
  status?: string;
};

type TeacherOption = {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
};

type WeeklySlot = {
  weekday?: number;
  time?: string;
  timeHHmm?: string;
  durationMinutes?: number;
  durationMins?: number;
};

const extractCallableErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as Record<string, unknown> | null;
  if (!err) return fallback;

  const details = err.details;
  if (typeof details === 'string' && details.trim()) return details.trim();
  if (details && typeof details === 'object') {
    const detailMessage = (details as Record<string, unknown>).message;
    if (typeof detailMessage === 'string' && detailMessage.trim()) return detailMessage.trim();
  }

  const message = typeof err.message === 'string' ? err.message.trim() : '';
  if (message && message.toLowerCase() !== 'internal') return message;

  const code = typeof err.code === 'string' ? err.code.trim() : '';
  if (code) return `${fallback} (${code})`;

  return fallback;
};

const isReadableName = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (
    lower === 'unknown' ||
    lower === 'name not found' ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === 'null' ||
    lower === 'undefined'
  ) {
    return false;
  }
  const hasWhitespace = /\s/.test(trimmed);
  const looksLikeLongId =
    !hasWhitespace &&
    ((/^[a-f0-9]{16,}$/i.test(trimmed)) || (/^[A-Za-z0-9_-]{20,}$/.test(trimmed)));
  return !looksLikeLongId;
};

const pickFirstReadableName = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (isReadableName(value)) return String(value).trim();
  }
  return null;
};

const getCourseLabel = (course: CourseOption | null | undefined): string =>
  course?.name || course?.title || course?.courseName || course?.id || 'Untitled course';

const getTeacherLabel = (teacher: TeacherOption | null | undefined): string =>
  teacher?.displayName || teacher?.name || teacher?.email || teacher?.id || 'Choose teacher';

const isValidClassLink = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

const normalizeTransitionSlots = (schedule: unknown): WeeklySlot[] => {
  if (!schedule || typeof schedule !== 'object' || Array.isArray(schedule)) return [];
  const record = schedule as Record<string, unknown>;
  if (Array.isArray(record.weeklySlots)) {
    return record.weeklySlots.filter((slot): slot is WeeklySlot => Boolean(slot && typeof slot === 'object'));
  }

  const weekdays = Array.isArray(record.weekdays)
    ? record.weekdays.filter((day): day is number => Number.isInteger(day) && Number(day) >= 0 && Number(day) <= 6)
    : [];
  const timeHHmm = typeof record.timeHHmm === 'string' ? record.timeHHmm.trim() : '';
  if (!weekdays.length || !/^\d{2}:\d{2}$/.test(timeHHmm)) return [];
  return weekdays.map((weekday) => ({ weekday, time: timeHHmm }));
};

const deriveNextClassDateYmd = (schedule: unknown): string | null => {
  const slots = normalizeTransitionSlots(schedule)
    .map((slot) => {
      const weekday = Number(slot.weekday);
      const time = String(slot.time || slot.timeHHmm || '').trim();
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 || !/^\d{2}:\d{2}$/.test(time)) return null;
      const [hour, minute] = time.split(':').map(Number);
      if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) return null;
      return { weekday, hour, minute };
    })
    .filter((slot): slot is { weekday: number; hour: number; minute: number } => Boolean(slot));

  if (!slots.length) return null;

  const nowIst = new Date(Date.now() + 330 * 60 * 1000);
  const todayWeekday = nowIst.getUTCDay();
  const nowMinutes = nowIst.getUTCHours() * 60 + nowIst.getUTCMinutes();

  let best: { dayOffset: number; minutes: number } | null = null;
  for (const slot of slots) {
    const slotMinutes = slot.hour * 60 + slot.minute;
    let dayOffset = (slot.weekday - todayWeekday + 7) % 7;
    if (dayOffset === 0 && slotMinutes <= nowMinutes) dayOffset = 7;
    if (
      !best ||
      dayOffset < best.dayOffset ||
      (dayOffset === best.dayOffset && slotMinutes < best.minutes)
    ) {
      best = { dayOffset, minutes: slotMinutes };
    }
  }

  if (!best) return null;
  const target = new Date(Date.UTC(
    nowIst.getUTCFullYear(),
    nowIst.getUTCMonth(),
    nowIst.getUTCDate() + best.dayOffset,
  ));
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}-${String(target.getUTCDate()).padStart(2, '0')}`;
};

export default function EnrollmentDetailView({
  enrollmentId,
  onClose,
}: EnrollmentDetailViewProps) {
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [student, setStudent] = useState<any | null>(null);
  const [course, setCourse] = useState<any | null>(null);
  const [teacher, setTeacher] = useState<any | null>(null);
  const [lp, setLp] = useState<any | null>(null);
  const [parent, setParent] = useState<any | null>(null);
  const [note, setNote] = useState('');
  const [showAssignTeacher, setShowAssignTeacher] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [rateEditOpen, setRateEditOpen] = useState(false);
  const [parentRateInput, setParentRateInput] = useState('');
  const [teacherRateInput, setTeacherRateInput] = useState('');
  const [rateSaving, setRateSaving] = useState(false);
  const [courseTransitionOpen, setCourseTransitionOpen] = useState(false);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [courseOptionsLoading, setCourseOptionsLoading] = useState(false);
  const [selectedNextCourseId, setSelectedNextCourseId] = useState('__none__');
  const [changeTeacherForNextCourse, setChangeTeacherForNextCourse] = useState(false);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [teacherOptionsLoading, setTeacherOptionsLoading] = useState(false);
  const [selectedNextTeacherId, setSelectedNextTeacherId] = useState('__none__');
  const [changeClassLinkForNextCourse, setChangeClassLinkForNextCourse] = useState(false);
  const [nextClassLinkInput, setNextClassLinkInput] = useState('');

  const { toast } = useToast();

  /* ---------------- helpers ---------------- */

  const formatMoney = (value: any) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '₹0';
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  };

  const normalizeStatus = (value?: string) => {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return 'active';
    if (raw === 'pending_teacher') return 'trial';
    if (raw === 'pending_payment' || raw === 'pending_lp') return 'active';
    if (raw === 'enrolled' || raw === 'current' || raw === 'ongoing') return 'active';
    if (raw === 'canceled') return 'cancelled';
    return raw;
  };

  const getStatusBadge = (status?: string) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'trial':
        return <Badge variant="secondary">🟡 Legacy Trial</Badge>;
      case 'active':
        return <Badge variant="default">🟢 Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">⏸️ Paused</Badge>;
      case 'completed':
        return <Badge variant="outline">🔵 Completed</Badge>;
      case 'discontinued':
        return <Badge variant="outline">⚪ Discontinued</Badge>;
      case 'expired':
        return <Badge variant="outline">⚪ Expired</Badge>;
      case 'archived':
        return <Badge variant="outline">📦 Archived</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">🔴 Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getCanonicalBucket = (status?: string) => {
    const normalized = normalizeStatus(status);
    if (
      normalized === 'completed' ||
      normalized === 'discontinued' ||
      normalized === 'expired' ||
      normalized === 'cancelled' ||
      normalized === 'archived'
    ) {
      return 'Past';
    }
    if (normalized === 'trial') return 'Legacy Trial';
    if (normalized === 'paused') return 'Paused';
    return 'Active';
  };

  /* ---------------- load enrollment ---------------- */

  const loadEnrollment = useCallback(async () => {
    try {
      const eSnap = await getDoc(
        doc(db, 'enrollments', enrollmentId),
      );

      if (!eSnap.exists()) {
        toast({
          title: 'Enrollment not found',
          description:
            'This enrollment may have been deleted.',
          variant: 'destructive',
        });
        onClose();
        return;
      }

      const data = { id: eSnap.id, ...(eSnap.data() as any) };
      setEnrollment(data);

      const studentId =
        data.kidId ||
        data.studentId ||
        data.childId ||
        (Array.isArray(data.kidIds) ? data.kidIds[0] : null);

      const courseId =
        data.courseId || data.course_id || data.course;

      const loadStudentProfile = async (id: string) => {
        const collectionsToTry = ['kids'];
        for (const collectionName of collectionsToTry) {
          try {
            const snap = await getDoc(doc(db, collectionName, id));
            if (snap.exists()) {
              return { id: snap.id, ...snap.data() } as Record<string, unknown>;
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.debug('[EnrollmentDetail student profile read failed]', {
                collectionName,
                docId: id,
                enrollmentId,
                errorCode: (error as any)?.code || '',
                errorMessage: (error as any)?.message || '',
              });
            }
          }
        }
        return null;
      };

      const fetches = [
        studentId ? loadStudentProfile(String(studentId)) : null,
        courseId
          ? getDoc(doc(db, 'courses', courseId))
          : null,
        data.teacherId
          ? getDoc(doc(db, 'users', data.teacherId))
          : null,
        data.lpId
          ? getDoc(doc(db, 'users', data.lpId))
          : null,
        data.parentId
          ? getDoc(doc(db, 'users', data.parentId))
          : null,
      ];

      const [
        sSnap,
        cSnap,
        tSnap,
        lSnap,
        pSnap,
      ] = (await Promise.all(fetches)) as [
        Record<string, unknown> | null,
        DocumentSnapshot<DocumentData> | null,
        DocumentSnapshot<DocumentData> | null,
        DocumentSnapshot<DocumentData> | null,
        DocumentSnapshot<DocumentData> | null,
      ];

      const enrollmentLevelStudentName = pickFirstReadableName(
        data.studentName,
        data.childName,
        data.kidName,
        data.kid?.name,
        data.student?.name
      );
      setStudent(
        sSnap
          ? {
              ...sSnap,
              resolvedEnrollmentName: enrollmentLevelStudentName,
            }
          : enrollmentLevelStudentName
            ? { resolvedEnrollmentName: enrollmentLevelStudentName }
            : null
      );
      setCourse(cSnap?.exists() ? { id: cSnap.id, ...cSnap.data() } : null);
      setTeacher(tSnap?.exists() ? { id: tSnap.id, ...tSnap.data() } : null);
      setLp(lSnap?.exists() ? { id: lSnap.id, ...lSnap.data() } : null);
      setParent(pSnap?.exists() ? { id: pSnap.id, ...pSnap.data() } : null);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description:
          err?.message || 'Failed to load enrollment',
        variant: 'destructive',
      });
    }
  }, [enrollmentId, onClose, toast]);

  useEffect(() => {
    void loadEnrollment();
  }, [loadEnrollment]);

  /* ---------------- notes ---------------- */

  const saveNote = async () => {
    if (!enrollment || !note.trim()) return;

    try {
      const combined = enrollment.notes
        ? `${enrollment.notes}\n\n${note.trim()}`
        : note.trim();

      await updateDoc(
        doc(db, 'enrollments', enrollment.id),
        {
          notes: combined,
          updatedAt: serverTimestamp(),
        },
      );

      setNote('');
      toast({ title: 'Note saved' });
      await loadEnrollment();
    } catch (err: any) {
      toast({
        title: 'Error',
        description:
          err?.message || 'Failed to save note',
        variant: 'destructive',
      });
    }
  };

  if (!enrollment) {
    return <div className="p-4 text-sm">Loading enrollment…</div>;
  }

  const parentRateRaw =
    enrollment.ratePerSession ??
    enrollment.feePerClass ??
    enrollment.feePerSession ??
    0;
  const teacherRateRaw =
    enrollment.teacherPayPerSession ??
    enrollment.teacherRatePerSession ??
    enrollment.teacherPay ??
    0;
  const parentRate = Number.isFinite(Number(parentRateRaw)) ? Number(parentRateRaw) : 0;
  const teacherRate = Number.isFinite(Number(teacherRateRaw)) ? Number(teacherRateRaw) : 0;
  const resolvedStudentName =
    pickFirstReadableName(
      student?.name,
      student?.fullName,
      student?.studentName,
      student?.displayName,
      student?.childName,
      student?.kidName,
      student?.resolvedEnrollmentName,
      enrollment.studentName,
      enrollment.childName,
      enrollment.kidName,
      enrollment.kid?.name,
      enrollment.student?.name
    ) || 'Name not found';
  const resolvedStudentId =
    String(
      student?.id ||
        enrollment.studentId ||
        enrollment.kidId ||
        enrollment.childId ||
        (Array.isArray(enrollment.kidIds) ? enrollment.kidIds[0] : '') ||
        ''
    ).trim();
  const showStudentIdHint = resolvedStudentName === 'Name not found' && resolvedStudentId.length > 0;
  const enrollmentStatusForDisplay =
    enrollment.archived === true || enrollment.archivedAt ? 'archived' : enrollment.status;

  /* ---------------- UI ---------------- */

  const kidId =
    enrollment.kidId ||
    enrollment.studentId ||
    enrollment.childId ||
    (Array.isArray(enrollment.kidIds) ? enrollment.kidIds[0] : null);

  const currentTeacherId = String(enrollment.teacherId || teacher?.id || '').trim();
  const currentTeacherLabel = currentTeacherId
    ? pickFirstReadableName(
        teacher?.displayName,
        teacher?.name,
        enrollment.teacherDisplayName,
        enrollment.teacherName,
      ) || 'Current teacher'
    : 'No teacher assigned';
  const currentClassLink = [
    enrollment.joinUrl,
    enrollment.meetingLink,
    enrollment.classLink,
  ].find((value) => typeof value === 'string' && value.trim()) as string | undefined;
  const selectableCourseOptions = courseOptions.filter(
    (option) => option.id !== String(enrollment.courseId || ''),
  );
  const selectedNextCourse =
    selectableCourseOptions.find((option) => option.id === selectedNextCourseId) || null;
  const selectableTeacherOptions = teacherOptions.filter((option) => option.id !== currentTeacherId);
  const selectedNextTeacher =
    selectableTeacherOptions.find((option) => option.id === selectedNextTeacherId) || null;
  const trimmedNextClassLink = nextClassLinkInput.trim();
  const nextClassLinkValid = !changeClassLinkForNextCourse || isValidClassLink(trimmedNextClassLink);
  const transitionSelectionsValid =
    selectedNextCourseId !== '__none__' &&
    Boolean(currentTeacherId || (changeTeacherForNextCourse && selectedNextTeacher)) &&
    (!changeTeacherForNextCourse || Boolean(selectedNextTeacher)) &&
    nextClassLinkValid;

  const callSetEnrollmentStatus = async (status: string, reason?: string) => {
    try {
      setActionBusy(status);
      const fn = httpsCallable(functions, 'setEnrollmentStatus');
      await fn({ enrollmentId: enrollment.id, status, reason });
      toast({ title: 'Enrollment updated' });
      await loadEnrollment();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: extractCallableErrorMessage(err, 'Failed to update enrollment'),
        variant: 'destructive',
      });
    } finally {
      setActionBusy(null);
    }
  };

  const callArchiveKid = async () => {
    if (!kidId) {
      toast({ title: 'Missing kidId', variant: 'destructive' });
      return;
    }
    try {
      setActionBusy('archive');
      const fn = httpsCallable(functions, 'archiveKid');
      await fn({ kidId });
      toast({ title: 'Kid archived' });
      await loadEnrollment();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: extractCallableErrorMessage(err, 'Failed to archive kid'),
        variant: 'destructive',
      });
    } finally {
      setActionBusy(null);
    }
  };

  const loadCourseOptions = async () => {
    if (courseOptions.length > 0 || courseOptionsLoading) return;
    try {
      setCourseOptionsLoading(true);
      const snap = await getDocs(collection(db, 'courses'));
      const options = snap.docs
        .map((row) => ({ id: row.id, ...(row.data() as Record<string, unknown>) }) as CourseOption)
        .filter((row) => String(row.status || '').trim().toLowerCase() === 'active')
        .sort((a, b) => getCourseLabel(a).localeCompare(getCourseLabel(b)));
      setCourseOptions(options);
    } catch (error) {
      toast({
        title: 'Courses could not be loaded',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCourseOptionsLoading(false);
    }
  };

  const loadTeacherOptions = async () => {
    if (teacherOptions.length > 0 || teacherOptionsLoading) return;
    try {
      setTeacherOptionsLoading(true);
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'teacher')));
      const options = snap.docs
        .map((row) => ({ id: row.id, ...(row.data() as Record<string, unknown>) }) as TeacherOption)
        .sort((a, b) => getTeacherLabel(a).localeCompare(getTeacherLabel(b)));
      setTeacherOptions(options);
    } catch (error) {
      toast({
        title: 'Teachers could not be loaded',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTeacherOptionsLoading(false);
    }
  };

  const handleOpenCourseTransition = async () => {
    const nextOpen = !courseTransitionOpen;
    setCourseTransitionOpen(nextOpen);
    if (!nextOpen) return;
    setSelectedNextCourseId('__none__');
    setChangeTeacherForNextCourse(!currentTeacherId);
    setSelectedNextTeacherId('__none__');
    setChangeClassLinkForNextCourse(false);
    setNextClassLinkInput('');
    await loadCourseOptions();
    if (!currentTeacherId) await loadTeacherOptions();
  };

  const handleTeacherChangeToggle = async (checked: boolean) => {
    if (!checked && !currentTeacherId) return;
    setChangeTeacherForNextCourse(checked);
    setSelectedNextTeacherId('__none__');
    if (checked) await loadTeacherOptions();
  };

  const callTransitionEnrollmentCourse = async () => {
    const newCourseId = selectedNextCourseId === '__none__' ? '' : selectedNextCourseId.trim();
    if (!newCourseId || !selectedNextCourse) {
      toast({
        title: 'Select the next course',
        description: 'Choose the course the child is moving to.',
        variant: 'destructive',
      });
      return;
    }

    const newTeacherId = changeTeacherForNextCourse
      ? String(selectedNextTeacher?.id || '').trim()
      : currentTeacherId;
    if (!newTeacherId) {
      toast({
        title: 'Select a teacher',
        description: changeTeacherForNextCourse
          ? 'Choose the teacher for the next course.'
          : 'This enrollment has no current teacher. Select one for the next course.',
        variant: 'destructive',
      });
      return;
    }

    if (changeClassLinkForNextCourse && !isValidClassLink(trimmedNextClassLink)) {
      toast({
        title: 'Enter a valid class link',
        description: 'Use a complete http:// or https:// link.',
        variant: 'destructive',
      });
      return;
    }

    const newSchedule = enrollment.schedule;
    if (!newSchedule || typeof newSchedule !== 'object' || Array.isArray(newSchedule)) {
      toast({
        title: 'Class schedule is missing',
        description: 'Please save the current class schedule before moving to the next course.',
        variant: 'destructive',
      });
      return;
    }

    const classesStartDate = deriveNextClassDateYmd(newSchedule);
    if (!classesStartDate) {
      toast({
        title: 'Class schedule is incomplete',
        description: 'The existing schedule needs at least one valid weekly class slot.',
        variant: 'destructive',
      });
      return;
    }

    const nextCourseLabel = getCourseLabel(selectedNextCourse);
    const currentCourseLabel = course?.name || course?.title || enrollment.courseName || enrollment.courseId || 'Current course';
    const nextTeacherLabel = changeTeacherForNextCourse
      ? getTeacherLabel(selectedNextTeacher)
      : currentTeacherLabel;
    const nextClassLink = changeClassLinkForNextCourse ? trimmedNextClassLink : currentClassLink;
    const confirmation = [
      `Move ${resolvedStudentName} from ${currentCourseLabel} to ${nextCourseLabel}?`,
      '',
      `Teacher: ${nextTeacherLabel}${changeTeacherForNextCourse ? ' (changed)' : ' (same)'}`,
      `Class link: ${changeClassLinkForNextCourse ? 'new link will be used' : currentClassLink ? 'same link' : 'no link currently set'}`,
      'Class schedule and rates will continue automatically.',
      'Previous attendance, completed classes, payments and billing history will remain unchanged.',
    ].join('\n');
    if (!window.confirm(confirmation)) return;

    const operationId = `course-transition-${crypto.randomUUID()}`;
    const reason = `Completed ${currentCourseLabel} and moved to ${nextCourseLabel}`;

    try {
      setActionBusy('transition');
      const fn = httpsCallable(functions, 'transitionEnrollmentCourse');
      const response = await fn({
        operationId,
        oldEnrollmentId: enrollment.id,
        newCourseId,
        newTeacherId,
        newSchedule,
        classesStartDate,
        ratePerSession: parentRate,
        teacherPayPerSession: teacherRate,
        creditsTotal: Number(enrollment.creditsTotal || 0),
        currency: enrollment.currency || 'INR',
        billingCycle: enrollment.billingCycle || 'monthly',
        reason,
      });

      const result = (response.data || {}) as Record<string, unknown>;
      const newEnrollmentId = String(result.newEnrollmentId || '').trim();
      let continuitySyncWarning: string | null = null;
      if (newEnrollmentId) {
        const inheritedTeacherName = changeTeacherForNextCourse
          ? pickFirstReadableName(selectedNextTeacher?.displayName, selectedNextTeacher?.name)
          : pickFirstReadableName(
              teacher?.displayName,
              teacher?.name,
              enrollment.teacherName,
              enrollment.teacherDisplayName,
            );
        const inheritedTeacherEmail = changeTeacherForNextCourse
          ? String(selectedNextTeacher?.email || '').trim()
          : String(teacher?.email || enrollment.teacherEmail || '').trim();
        const inheritedFields: Record<string, unknown> = {
          teacherId: newTeacherId,
          teacherIds: [newTeacherId],
          schedule: newSchedule,
          updatedAt: serverTimestamp(),
        };
        if (inheritedTeacherName) inheritedFields.teacherName = inheritedTeacherName;
        if (inheritedTeacherEmail) inheritedFields.teacherEmail = inheritedTeacherEmail;
        if (nextClassLink) {
          inheritedFields.joinUrl = nextClassLink.trim();
        }
        if (changeClassLinkForNextCourse && nextClassLink) {
          inheritedFields.meetingLink = nextClassLink.trim();
          inheritedFields.classLink = nextClassLink.trim();
        } else {
          if (typeof enrollment.meetingLink === 'string' && enrollment.meetingLink.trim()) {
            inheritedFields.meetingLink = enrollment.meetingLink.trim();
          }
          if (typeof enrollment.classLink === 'string' && enrollment.classLink.trim()) {
            inheritedFields.classLink = enrollment.classLink.trim();
          }
        }

        try {
          await updateDoc(doc(db, 'enrollments', newEnrollmentId), inheritedFields);
          const repairFn = httpsCallable(functions, 'repairEnrollmentFutureSessionsFromSchedule');
          await repairFn({ enrollmentId: newEnrollmentId, dryRun: false });
        } catch (syncError) {
          continuitySyncWarning = extractCallableErrorMessage(
            syncError,
            'The new course is active, but teacher/link continuity could not be fully refreshed.',
          );
        }
      } else {
        continuitySyncWarning = 'The course transition completed, but the new enrollment could not be confirmed for continuity checks.';
      }

      if (continuitySyncWarning) {
        toast({
          title: 'Course moved; continuity check needs attention',
          description: continuitySyncWarning,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Moved to next course',
          description: `${nextCourseLabel} is now active. Selected teacher/link choices were applied; previous attendance and payment history were preserved.`,
        });
      }
      setCourseTransitionOpen(false);
      setSelectedNextCourseId('__none__');
      setChangeTeacherForNextCourse(false);
      setSelectedNextTeacherId('__none__');
      setChangeClassLinkForNextCourse(false);
      setNextClassLinkInput('');
      await loadEnrollment();
    } catch (error) {
      toast({
        title: 'Course move could not be completed',
        description: extractCallableErrorMessage(error, 'Please try again. No manual IDs are required.'),
        variant: 'destructive',
      });
    } finally {
      setActionBusy(null);
    }
  };

  const handleStartEditRates = () => {
    if (!enrollment) return;
    const rawParent =
      enrollment.ratePerSession ??
      enrollment.feePerClass ??
      enrollment.feePerSession ??
      0;
    const rawTeacher =
      enrollment.teacherPayPerSession ??
      enrollment.teacherRatePerSession ??
      enrollment.teacherPay ??
      0;
    const parentValue = Number(rawParent);
    const teacherValue = Number(rawTeacher);
    setParentRateInput(
      Number.isFinite(parentValue) && parentValue > 0 ? String(parentValue) : ''
    );
    setTeacherRateInput(
      Number.isFinite(teacherValue) && teacherValue > 0 ? String(teacherValue) : ''
    );
    setRateEditOpen(true);
  };

  const handleSaveRates = async () => {
    if (!enrollment) return;
    const parentRate = Number(parentRateInput);
    if (!Number.isFinite(parentRate) || parentRate <= 0) {
      toast({
        title: 'Invalid parent rate',
        description: 'Enter a valid fee per session.',
        variant: 'destructive',
      });
      return;
    }
    const rawTeacher = Number(teacherRateInput);
    const teacherPayPerSession =
      Number.isFinite(rawTeacher) && rawTeacher > 0 ? rawTeacher : 0;

    try {
      setRateSaving(true);
      await updateDoc(doc(db, 'enrollments', enrollment.id), {
        ratePerSession: parentRate,
        feePerClass: parentRate,
        teacherPayPerSession,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Rates updated' });
      setRateEditOpen(false);
      await loadEnrollment();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to update rates',
        variant: 'destructive',
      });
    } finally {
      setRateSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">
          Enrollment Details
        </h3>
        <div className="flex items-center gap-3">
          {getStatusBadge(enrollmentStatusForDisplay)}
          <Badge variant="outline">Canonical: {getCanonicalBucket(enrollmentStatusForDisplay)}</Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        Raw status: {String(enrollment.status || '—')}
      </div>

      {/* Student & Course */}
      <Card>
        <CardHeader>
          <CardTitle>Student & Course</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <div><strong>Student:</strong> {resolvedStudentName}</div>
          {showStudentIdHint && <div><strong>Student ID:</strong> {resolvedStudentId}</div>}
          <div><strong>Course:</strong> {course?.name || course?.title || 'Unknown'}</div>
          <div><strong>Teacher:</strong> {teacher?.name || 'Unassigned'}</div>
          <div><strong>Learning Partner:</strong> {lp?.name || 'Unassigned'}</div>
          <div><strong>Parent:</strong> {parent?.name || parent?.email || 'Unknown'}</div>
        </CardContent>
      </Card>

      {/* Rates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rates</CardTitle>
          {!rateEditOpen && (
            <Button size="sm" variant="outline" onClick={handleStartEditRates}>
              Edit rates
            </Button>
          )}
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {rateEditOpen ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Parent rate (₹)</label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    placeholder="e.g., 599"
                    value={parentRateInput}
                    onChange={(e) => setParentRateInput(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Teacher rate (₹)</label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="e.g., 300"
                    value={teacherRateInput}
                    onChange={(e) => setTeacherRateInput(e.target.value)}
                  />
                  {(!teacherRateInput || Number(teacherRateInput) <= 0) && (
                    <p className="text-xs text-amber-600">
                      Earnings will be ₹0 until set.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleSaveRates} disabled={rateSaving}>
                  {rateSaving ? 'Saving…' : 'Save rates'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRateEditOpen(false)}
                  disabled={rateSaving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div><strong>Parent rate:</strong> {parentRate > 0 ? formatMoney(parentRate) : '—'}</div>
              <div>
                <strong>Teacher rate:</strong> {teacherRate > 0 ? formatMoney(teacherRate) : '—'}
                {teacherRate <= 0 && (
                  <span className="ml-2 text-xs text-amber-600">Not set</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-line text-sm mb-2">
            {enrollment.notes || 'No notes yet.'}
          </div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note"
          />
          <Button className="mt-2" onClick={saveNote}>
            Save Note
          </Button>
        </CardContent>
      </Card>

      {/* Lifecycle actions */}
      <Card>
        <CardHeader>
          <CardTitle>Lifecycle Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => callSetEnrollmentStatus('active')}
              disabled={actionBusy !== null}
            >
              Mark Active
            </Button>
            <Button
              variant="outline"
              onClick={() => callSetEnrollmentStatus('paused')}
              disabled={actionBusy !== null}
            >
              Pause
            </Button>
            <Button
              variant="outline"
              onClick={() => callSetEnrollmentStatus('active')}
              disabled={actionBusy !== null}
            >
              Resume
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!window.confirm('Mark this enrollment as completed?')) return;
                callSetEnrollmentStatus('completed');
              }}
              disabled={actionBusy !== null}
            >
              Complete
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleOpenCourseTransition()}
              disabled={actionBusy !== null}
            >
              Move to Next Course
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!window.confirm('Discontinue this enrollment?')) return;
                callSetEnrollmentStatus('discontinued');
              }}
              disabled={actionBusy !== null}
            >
              Discontinue
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAssignTeacher(true)}
              disabled={actionBusy !== null}
            >
              Reassign Teacher
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!window.confirm('Archive this kid? This cannot be undone.')) return;
                callArchiveKid();
              }}
              disabled={actionBusy !== null || !kidId}
            >
              Archive Kid
            </Button>
          </div>

          {courseTransitionOpen ? (
            <div className="rounded-xl border bg-slate-50 p-4 space-y-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">Move to the next course</div>
                <div className="mt-1 text-xs text-slate-600">
                  Select the next course. By default, the current teacher, class schedule, rates and class link continue automatically.
                  Previous attendance and payment history stay attached to the completed course.
                </div>
              </div>

              <div className="max-w-xl space-y-1">
                <label className="text-sm font-medium">Next course</label>
                <Select
                  value={selectedNextCourseId}
                  onValueChange={setSelectedNextCourseId}
                  disabled={courseOptionsLoading || actionBusy !== null}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={courseOptionsLoading ? 'Loading courses…' : 'Choose next course'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Choose next course</SelectItem>
                    {selectableCourseOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {getCourseLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!courseOptionsLoading && selectableCourseOptions.length === 0 ? (
                <div className="text-xs text-amber-700">No other active courses are available.</div>
              ) : null}

              <div className="rounded-lg border bg-white p-3 space-y-3">
                <div className="text-sm font-medium text-slate-900">Optional changes</div>

                <label className="flex items-start gap-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={changeTeacherForNextCourse}
                    onChange={(event) => void handleTeacherChangeToggle(event.target.checked)}
                    disabled={actionBusy !== null || !currentTeacherId && changeTeacherForNextCourse}
                  />
                  <span>
                    <span className="font-medium">Change teacher for next course</span>
                    <span className="block text-xs text-slate-500">
                      {currentTeacherId
                        ? `Leave this off to continue with ${currentTeacherLabel}.`
                        : 'A teacher is required for the next course.'}
                    </span>
                  </span>
                </label>

                {changeTeacherForNextCourse ? (
                  <div className="ml-7 max-w-xl space-y-1">
                    <label className="text-sm font-medium">Teacher for next course</label>
                    <Select
                      value={selectedNextTeacherId}
                      onValueChange={setSelectedNextTeacherId}
                      disabled={teacherOptionsLoading || actionBusy !== null}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={teacherOptionsLoading ? 'Loading teachers…' : 'Choose teacher'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Choose teacher</SelectItem>
                        {selectableTeacherOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {getTeacherLabel(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!teacherOptionsLoading && selectableTeacherOptions.length === 0 ? (
                      <div className="text-xs text-amber-700">No alternate teachers are available.</div>
                    ) : null}
                  </div>
                ) : null}

                <label className="flex items-start gap-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={changeClassLinkForNextCourse}
                    onChange={(event) => {
                      setChangeClassLinkForNextCourse(event.target.checked);
                      setNextClassLinkInput('');
                    }}
                    disabled={actionBusy !== null}
                  />
                  <span>
                    <span className="font-medium">Use a different class link</span>
                    <span className="block text-xs text-slate-500">
                      Leave this off to keep the existing class link. Turn it on to add or replace the link for the next course.
                    </span>
                  </span>
                </label>

                {changeClassLinkForNextCourse ? (
                  <div className="ml-7 max-w-xl space-y-1">
                    <label className="text-sm font-medium">New class link</label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={nextClassLinkInput}
                      onChange={(event) => setNextClassLinkInput(event.target.value)}
                      disabled={actionBusy !== null}
                    />
                    {trimmedNextClassLink && !nextClassLinkValid ? (
                      <div className="text-xs text-red-600">Enter a complete http:// or https:// link.</div>
                    ) : null}
                    {currentClassLink ? (
                      <div className="text-xs text-slate-500">The current link remains unchanged unless you confirm the course move.</div>
                    ) : (
                      <div className="text-xs text-slate-500">No existing class link is set; this will add one to the next course.</div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
                <div><strong>Teacher:</strong> {changeTeacherForNextCourse ? getTeacherLabel(selectedNextTeacher) : currentTeacherLabel}</div>
                <div><strong>Class link:</strong> {changeClassLinkForNextCourse ? 'New link' : currentClassLink ? 'Keep current link' : 'No link'}</div>
                <div><strong>Schedule & rates:</strong> Continue unchanged</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => void callTransitionEnrollmentCourse()}
                  disabled={
                    actionBusy !== null ||
                    courseOptionsLoading ||
                    teacherOptionsLoading ||
                    !transitionSelectionsValid
                  }
                >
                  {actionBusy === 'transition' ? 'Moving…' : 'Confirm Course Move'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCourseTransitionOpen(false);
                    setSelectedNextCourseId('__none__');
                    setChangeTeacherForNextCourse(false);
                    setSelectedNextTeacherId('__none__');
                    setChangeClassLinkForNextCourse(false);
                    setNextClassLinkInput('');
                  }}
                  disabled={actionBusy !== null}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {showAssignTeacher ? (
        <AssignTeacherModal
          enrollment={enrollment}
          studentName={resolvedStudentName}
          courseName={course?.name || course?.title || enrollment.courseId || 'Unknown'}
          currentTeacherId={enrollment.teacherId}
          currentTeacherName={
            teacher?.displayName ||
            teacher?.name ||
            enrollment.teacherName ||
            ''
          }
          currentTeacherEmail={teacher?.email || enrollment.teacherEmail || ''}
          onClose={() => {
            setShowAssignTeacher(false);
            void loadEnrollment();
          }}
        />
      ) : null}
    </div>
  );
}
