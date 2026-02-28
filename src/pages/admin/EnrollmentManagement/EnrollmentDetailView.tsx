// src/pages/admin/EnrollmentManagement/EnrollmentDetailView.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
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
import { Textarea } from '@components/ui/textarea';
import { useToast } from '@components/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import AssignTeacherModal from './AssignTeacherModal';

interface EnrollmentDetailViewProps {
  enrollmentId: string;
  onClose: () => void;
}

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

  const { toast } = useToast();

  /* ---------------- helpers ---------------- */

  const toDateOrNull = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value?.toDate === 'function') {
      const d = value.toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d : null;
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (value: any, fallback = '—') => {
    const d = toDateOrNull(value);
    return d ? d.toLocaleDateString() : fallback;
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
        return <Badge variant="secondary">🟡 Trial</Badge>;
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
      normalized === 'cancelled'
    ) {
      return 'Past';
    }
    if (normalized === 'trial') return 'Trial';
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
        data.studentId ||
        data.kidId ||
        data.childId ||
        (Array.isArray(data.kidIds) ? data.kidIds[0] : null);

      const courseId =
        data.courseId || data.course_id || data.course;

      const fetches = [
        studentId
          ? getDoc(doc(db, 'kids', studentId))
          : null,
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
      ] = await Promise.all(fetches);

      setStudent(sSnap?.exists() ? { id: sSnap.id, ...sSnap.data() } : null);
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

  const topicProgress =
    typeof enrollment.topicProgress === 'object'
      ? enrollment.topicProgress
      : {};

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
        description: err?.message || 'Failed to update enrollment',
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
        description: err?.message || 'Failed to archive kid',
        variant: 'destructive',
      });
    } finally {
      setActionBusy(null);
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
          {getStatusBadge(enrollment.status)}
          <Badge variant="outline">Canonical: {getCanonicalBucket(enrollment.status)}</Badge>
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
          <div><strong>Student:</strong> {student?.name || student?.fullName || 'Unknown'}</div>
          <div><strong>Course:</strong> {course?.name || course?.title || 'Unknown'}</div>
          <div><strong>Teacher:</strong> {teacher?.name || 'Unassigned'}</div>
          <div><strong>Learning Partner:</strong> {lp?.name || 'Unassigned'}</div>
          <div><strong>Parent:</strong> {parent?.name || parent?.email || 'Unknown'}</div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Topic Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(topicProgress).length === 0 ? (
            <div className="text-sm text-gray-500">
              No progress recorded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(topicProgress).map(
                ([topicId, t]: any) => (
                  <div
                    key={topicId}
                    className="border rounded p-2 text-sm"
                  >
                    <div><strong>{t?.name || topicId}</strong></div>
                    <div>Status: {t?.status || 'unknown'}</div>
                    <div>Mastery: {t?.mastery ?? 0}%</div>
                    <div>Updated: {formatDate(t?.lastUpdated)}</div>
                  </div>
                ),
              )}
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
          onClose={() => {
            setShowAssignTeacher(false);
            void loadEnrollment();
          }}
        />
      ) : null}
    </div>
  );
}
