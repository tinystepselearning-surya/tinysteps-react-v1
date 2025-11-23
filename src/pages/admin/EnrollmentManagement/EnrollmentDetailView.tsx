import React, { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
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

  useEffect(() => {
    void loadEnrollment();
  }, [enrollmentId]);

  const loadEnrollment = async () => {
    const eSnap = await getDoc(doc(db, 'enrollments', enrollmentId));
    if (!eSnap.exists()) return;

    const data = { id: eSnap.id, ...(eSnap.data() as any) };
    setEnrollment(data);

    // ---- resolve student id from multiple possible fields ----
    const studentId: string | undefined =
      data.studentId ||
      data.kidId ||
      data.childId ||
      (Array.isArray(data.kidIds) && data.kidIds.length > 0
        ? data.kidIds[0]
        : undefined);

    if (studentId) {
      const s = await getDoc(doc(db, 'kids', studentId));
      setStudent(s.exists() ? { id: s.id, ...s.data() } : null);
    } else {
      setStudent(null);
    }

    // ---- resolve course id from multiple possible fields ----
    const courseId: string | undefined =
      data.courseId || data.course_id || data.course;

    if (courseId) {
      const c = await getDoc(doc(db, 'courses', courseId));
      setCourse(c.exists() ? { id: c.id, ...c.data() } : null);
    } else {
      setCourse(null);
    }

    if (data.teacherId) {
      const t = await getDoc(doc(db, 'users', data.teacherId));
      setTeacher(t.exists() ? { id: t.id, ...t.data() } : null);
    } else {
      setTeacher(null);
    }

    if (data.lpId) {
      const l = await getDoc(doc(db, 'users', data.lpId));
      setLp(l.exists() ? { id: l.id, ...l.data() } : null);
    } else {
      setLp(null);
    }

    if (data.parentId) {
      const p = await getDoc(doc(db, 'users', data.parentId));
      setParent(p.exists() ? { id: p.id, ...p.data() } : null);
    } else {
      setParent(null);
    }
  };

  const toDateOrNull = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    if (typeof value?.toDate === 'function') {
      const d = value.toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d : null;
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (value: any, fallback: string) => {
    const d = toDateOrNull(value);
    return d ? d.toLocaleDateString() : fallback;
  };

  const getStatusBadge = (status: string) => {
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

  const saveNote = async () => {
    if (!enrollment) return;
    if (!note.trim()) {
      toast({
        title: 'Empty note',
        description: 'Please type something before saving.',
      });
      return;
    }

    try {
      const notes =
        (enrollment.notes || '').trim().length > 0
          ? `${enrollment.notes}\n${note}`
          : note;

      await updateDoc(doc(db, 'enrollments', enrollment.id), {
        notes,
        updatedAt: serverTimestamp(),
      });

      setNote('');
      toast({ title: 'Saved', description: 'Note saved' });
      await loadEnrollment();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to save note',
        variant: 'destructive',
      });
    }
  };

  if (!enrollment) return <div>Loading...</div>;

  const topicProgress = enrollment.topicProgress || {};

  const studentName =
    student?.name || student?.displayName || student?.fullName || 'Unknown';
  const studentGrade =
    student?.grade || student?.class || student?.standard || '';

  const courseName =
    course?.name || course?.title || course?.courseName || 'Unknown Course';
  const courseArea = course?.area || course?.track || course?.type || '';

  const parentName =
    parent?.name ||
    parent?.displayName ||
    parent?.fullName ||
    parent?.email ||
    'Unknown Parent';

  const teacherName =
    teacher?.name ||
    teacher?.displayName ||
    teacher?.fullName ||
    'Unassigned';

  const lpName =
    lp?.name || lp?.displayName || lp?.fullName || 'Unassigned';

  const enrollmentStatus: string = enrollment.status || 'unknown';

  const enrollmentDate = formatDate(
    enrollment.enrollmentDate,
    'Unknown',
  );
  const startDate = formatDate(enrollment.startDate, 'Not started');
  const completionDate = formatDate(
    enrollment.completionDate,
    'N/A',
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Enrollment Details</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm flex items-center gap-2">
            Status: {getStatusBadge(enrollmentStatus)}
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Student & Course */}
      <Card>
        <CardHeader>
          <CardTitle>Student &amp; Course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div>
            <strong>Student:</strong>{' '}
            {studentName}
            {studentGrade ? ` – ${studentGrade}` : ''}
          </div>
          <div>
            <strong>Age / DOB:</strong>{' '}
            {student?.age ??
              (student?.dob
                ? formatDate(student.dob, 'Unknown')
                : 'Unknown')}
          </div>
          <div>
            <strong>Course:</strong>{' '}
            {courseName}
            {courseArea ? ` (${courseArea})` : ''}
          </div>
          <div>
            <strong>Teacher:</strong> {teacherName}
          </div>
          <div>
            <strong>Learning Partner:</strong> {lpName}
          </div>
          <div>
            <strong>Parent:</strong> {parentName}
          </div>
        </CardContent>
      </Card>

      {/* Progress by Topic */}
      <Card>
        <CardHeader>
          <CardTitle>Progress by Topic</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(topicProgress).length === 0 ? (
            <div className="text-sm text-gray-500">
              No topic progress yet.
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(topicProgress).map(
                ([topicId, t]: [string, any]) => (
                  <div
                    key={topicId}
                    className="p-2 border rounded text-sm space-y-1"
                  >
                    <div>
                      <strong>Topic:</strong> {t?.name || topicId}
                    </div>
                    <div>
                      Status:{' '}
                      <Badge
                        variant={
                          t?.status === 'completed'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {t?.status || 'unknown'}
                      </Badge>
                    </div>
                    <div>
                      Mastery:{' '}
                      {typeof t?.mastery === 'number'
                        ? `${t.mastery}%`
                        : '0%'}
                    </div>
                    <div>
                      Last Updated:{' '}
                      {t?.lastUpdated
                        ? formatDate(t.lastUpdated, '-')
                        : '-'}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credits & Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Credits &amp; Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div>
            Credits Used:{' '}
            {typeof enrollment.creditsUsed === 'number'
              ? enrollment.creditsUsed
              : 0}
          </div>
          <div>
            Credits Total:{' '}
            {typeof enrollment.creditsTotal === 'number'
              ? enrollment.creditsTotal
              : 0}
          </div>
          <div>
            Credits Remaining:{' '}
            {typeof enrollment.creditsRemaining === 'number'
              ? enrollment.creditsRemaining
              : 0}
          </div>
          <div>Enrollment Date: {enrollmentDate}</div>
          <div>Start Date: {startDate}</div>
          <div>Completion Date: {completionDate}</div>
        </CardContent>
      </Card>

      {/* Admin Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-sm whitespace-pre-line">
            {enrollment.notes || 'No notes'}
          </div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add admin note"
          />
          <div className="flex gap-2 mt-2">
            <Button onClick={saveNote}>Save Note</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
