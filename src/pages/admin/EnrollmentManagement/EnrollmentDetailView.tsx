// src/pages/admin/EnrollmentManagement/EnrollmentDetailView.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  type DocumentData,
  type DocumentSnapshot,
  doc,
  getDoc,
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
import { useToast } from '@components/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import AssignTeacherModal from './AssignTeacherModal';

interface EnrollmentDetailViewProps {
  enrollmentId: string;
  onClose: () => void;
}

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

  const callTransitionEnrollmentCourse = async () => {
    const newCourseId = window.prompt('Next canonical course ID?')?.trim() || '';
    if (!newCourseId) return;
    const newTeacherId = window.prompt('Next teacher user ID?')?.trim() || '';
    if (!newTeacherId) return;
    const classesStartDate = window.prompt('First class date (YYYY-MM-DD)?')?.trim() || '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(classesStartDate)) {
      toast({ title: 'Invalid start date', variant: 'destructive' });
      return;
    }
    const scheduleText = window.prompt(
      'Next schedule JSON. Example: {"weeklySlots":[{"weekday":2,"time":"18:00","durationMinutes":35}]}',
      '{"weeklySlots":[]}',
    )?.trim() || '';
    let newSchedule: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(scheduleText);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Schedule must be an object');
      newSchedule = parsed as Record<string, unknown>;
      if (!Array.isArray(newSchedule.weeklySlots) || newSchedule.weeklySlots.length === 0) {
        throw new Error('At least one weekly slot is required');
      }
    } catch (error) {
      toast({
        title: 'Invalid schedule',
        description: error instanceof Error ? error.message : 'Enter valid schedule JSON.',
        variant: 'destructive',
      });
      return;
    }
    const reason = window.prompt('Reason for completing this course and starting the next?')?.trim() || '';
    if (!reason) return;
    const operationId =
      window.prompt(
        'Transition operation ID (reuse the same ID to resume a failed transition; leave blank for a new one):',
      )?.trim() || `course-transition-${crypto.randomUUID()}`;
    const summary = [
      `Child: ${resolvedStudentName}`,
      `Current course: ${course?.name || course?.title || enrollment.courseId}`,
      `Current teacher: ${teacher?.name || teacher?.displayName || enrollment.teacherId || 'Unassigned'}`,
      `Next course: ${newCourseId}`,
      `Next teacher: ${newTeacherId}`,
      `Start date: ${classesStartDate}`,
      `Schedule: ${scheduleText}`,
      `Operation ID: ${operationId}`,
      '',
      'Eligible future regular sessions for the current course will be cancelled.',
      'Completed sessions, attendance, billing, earnings and credits remain historical.',
    ].join('\n');
    if (!window.confirm(summary)) return;
    try {
      setActionBusy('transition');
      const fn = httpsCallable(functions, 'transitionEnrollmentCourse');
      await fn({
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
      toast({ title: 'Course transition completed', description: 'Historical records were preserved.' });
      await loadEnrollment();
    } catch (error) {
      toast({
        title: 'Course transition needs attention',
        description: `${extractCallableErrorMessage(error, 'Transition can be resumed.')} Operation ID: ${operationId}`,
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
        <CardContent className="flex flex-wrap gap-2">
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
            onClick={() => void callTransitionEnrollmentCourse()}
            disabled={actionBusy !== null}
          >
            Complete Current Course and Start Next Course
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
