// src/pages/admin/EnrollmentManagement/EnrollmentDetailView.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending_teacher':
        return <Badge variant="secondary">🟡 Pending Teacher</Badge>;
      case 'pending_lp':
        return <Badge variant="secondary">🟡 Pending LP</Badge>;
      case 'active':
        return <Badge variant="default">🟢 Active</Badge>;
      case 'completed':
        return <Badge variant="outline">🔵 Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">🔴 Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">
          Enrollment Details
        </h3>
        <div className="flex items-center gap-3">
          {getStatusBadge(enrollment.status)}
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
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
    </div>
  );
}
