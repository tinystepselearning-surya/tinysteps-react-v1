import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { Button } from '@components/ui/button';
  import { Input } from '@components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Badge } from '@components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { Eye, Edit } from 'lucide-react';
import EnrollmentDetailView from './EnrollmentDetailView';
import AssignTeacherModal from './AssignTeacherModal';
import AssignLPModal from './AssignLPModal';

// ---- helpers ----

// Works for: plain string ids, Firestore DocumentReference, or objects with `id` / `path`
const normalizeId = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;

  if (typeof value === 'object') {
    if (typeof (value as any).id === 'string') {
      return (value as any).id;
    }
    if (typeof (value as any).path === 'string') {
      const parts = (value as any).path.split('/');
      return parts[parts.length - 1] || null;
    }
  }
  return null;
};

const resolveDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value.toDate === 'function') {
    const d = value.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export default function EnrollmentsList() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, any>>({});
  const [coursesMap, setCoursesMap] = useState<Record<string, any>>({});
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});

  const [filters, setFilters] = useState({
    course: '',
    parent: '',
    teacher: '',
    lp: '',
    status: '',
  });
  const [search, setSearch] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState<any | null>(
    null,
  );
  const [assignTeacherFor, setAssignTeacherFor] = useState<any | null>(null);
  const [assignLPFor, setAssignLPFor] = useState<any | null>(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    const qRef = query(collection(db, 'enrollments'));
    const snap = await getDocs(qRef);

    const items: any[] = [];
    const userIds = new Set<string>();
    const studentIds = new Set<string>();
    const courseIds = new Set<string>();

    snap.forEach((d) => {
      const raw = d.data() as any;

      // ---- normalize student ids from multiple possible fields ----
      const studentIdCandidates: string[] = [];

      [
        raw.studentId,
        raw.kidId,
        raw.childId,
        raw.studentRef,
        raw.kidRef,
      ].forEach((v) => {
        const id = normalizeId(v);
        if (id) studentIdCandidates.push(id);
      });

      if (Array.isArray(raw.kidIds)) {
        raw.kidIds.forEach((v: any) => {
          const id = normalizeId(v);
          if (id) studentIdCandidates.push(id);
        });
      }

      studentIdCandidates.forEach((id) => studentIds.add(id));

      // ---- normalize course ids from multiple possible fields ----
      const courseIdCandidates: string[] = [];
      [raw.courseId, raw.course_id, raw.course, raw.courseRef].forEach((v) => {
        const id = normalizeId(v);
        if (id) courseIdCandidates.push(id);
      });
      courseIdCandidates.forEach((id) => courseIds.add(id));

      // ---- parents / teachers / LPs (these are usually plain strings) ----
      if (raw.parentId) userIds.add(raw.parentId);
      if (raw.teacherId) userIds.add(raw.teacherId);
      if (raw.lpId) userIds.add(raw.lpId);

      const canonicalStudentId = studentIdCandidates[0] || null;
      const canonicalCourseId = courseIdCandidates[0] || null;

      const normalized = {
        id: d.id,
        ...raw,
        // overwrite with normalized string ids so the rest of the UI can rely on them
        studentId: canonicalStudentId ?? raw.studentId,
        courseId: canonicalCourseId ?? raw.courseId,
      };

      items.push(normalized);
    });

    // ---- fetch students ----
    const sMap: Record<string, any> = {};
    if (studentIds.size > 0) {
      const studentsSnap = await getDocs(collection(db, 'kids'));
      studentsSnap.forEach((s) => {
        if (studentIds.has(s.id)) {
          sMap[s.id] = { id: s.id, ...(s.data() as any) };
        }
      });
    }

    // ---- fetch courses ----
    const cMap: Record<string, any> = {};
    if (courseIds.size > 0) {
      const coursesSnap = await getDocs(collection(db, 'courses'));
      coursesSnap.forEach((c) => {
        if (courseIds.has(c.id)) {
          cMap[c.id] = { id: c.id, ...(c.data() as any) };
        }
      });
    }

    // ---- fetch users (parents / teachers / LPs) ----
    const uMap: Record<string, any> = {};
    if (userIds.size > 0) {
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((u) => {
        if (userIds.has(u.id)) {
          uMap[u.id] = { id: u.id, ...(u.data() as any) };
        }
      });
    }

    setStudentsMap(sMap);
    setCoursesMap(cMap);
    setUsersMap(uMap);
    setEnrollments(items);
  };

  const getBadge = (status: string) => {
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

  const openAssignTeacher = (enrollment: any) => setAssignTeacherFor(enrollment);
  const openAssignLP = (enrollment: any) => setAssignLPFor(enrollment);

  const cancelEnrollment = async (id: string) => {
    if (!confirm('Cancel this enrollment?')) return;
    await updateDoc(doc(db, 'enrollments', id), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
    fetchEnrollments();
  };

  const filtered = enrollments.filter((e) => {
    const student =
      (e.studentId && studentsMap[e.studentId]) ||
      (e.kidId && studentsMap[e.kidId]) ||
      (e.childId && studentsMap[e.childId]) ||
      (Array.isArray(e.kidIds) && e.kidIds.length > 0
        ? studentsMap[normalizeId(e.kidIds[0]) as string]
        : undefined);

    const studentNameFromObj =
      student?.fullName ||
      student?.name ||
      student?.displayName ||
      student?.childName ||
      '';

    const studentNameFromEnrollment =
      e.studentName || e.kidName || e.childName || e.name || '';

    const combined = (
      studentNameFromObj || studentNameFromEnrollment
    ).toLowerCase();

    if (search && !combined.includes(search.toLowerCase())) return false;
    if (filters.course && e.courseId !== filters.course) return false;
    if (filters.parent && e.parentId !== filters.parent) return false;
    if (filters.teacher && e.teacherId !== filters.teacher) return false;
    if (filters.lp && e.lpId !== filters.lp) return false;
    if (filters.status && e.status !== filters.status) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Enrollments</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Search by student name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>LP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => {
                // ---- resolve student & course objects ----
                const student =
                  (e.studentId && studentsMap[e.studentId]) ||
                  (e.kidId && studentsMap[e.kidId]) ||
                  (e.childId && studentsMap[e.childId]) ||
                  (Array.isArray(e.kidIds) && e.kidIds.length > 0
                    ? studentsMap[normalizeId(e.kidIds[0]) as string]
                    : undefined);

                const course =
                  (e.courseId && coursesMap[e.courseId]) ||
                  (e.course_id && coursesMap[e.course_id]) ||
                  (e.course && coursesMap[e.course]);

                const parent = usersMap[e.parentId];
                const teacher = usersMap[e.teacherId];
                const lp = usersMap[e.lpId];

                const studentName =
                  student?.fullName ||
                  student?.name ||
                  student?.displayName ||
                  student?.childName ||
                  e.studentName ||
                  e.kidName ||
                  e.childName ||
                  e.name ||
                  'Unknown';

                const courseName =
                  course?.name ||
                  course?.title ||
                  course?.courseName ||
                  e.courseName ||
                  e.courseTitle ||
                  e.course ||
                  'Unknown Course';

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

                // ---- progress percent ----
                const tp =
                  e.topicProgress && typeof e.topicProgress === 'object'
                    ? e.topicProgress
                    : {};
                const totalTopicsFromProgress = Object.keys(tp).length;
                const totalTopicsFromCourse = Array.isArray(course?.topics)
                  ? course.topics.length
                  : 0;
                const totalTopics =
                  totalTopicsFromProgress || totalTopicsFromCourse;
                const completed = Object.values(tp).filter(
                  (t: any) => t && t.status === 'completed',
                ).length;
                const progressPct =
                  totalTopics === 0
                    ? 0
                    : Math.round((completed / totalTopics) * 100);

                // ---- duration days ----
                const enrollmentDate = resolveDate(e.enrollmentDate);
                const startDate = resolveDate(e.startDate) || enrollmentDate;
                let durationDays: number | string = '-';
                if (startDate) {
                  const diffMs =
                    new Date().getTime() - startDate.getTime();
                  if (!isNaN(diffMs)) {
                    durationDays =
                      diffMs >= 0
                        ? Math.ceil(
                            diffMs / (1000 * 60 * 60 * 24),
                          )
                        : 0;
                  }
                }

                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      {studentName}
                    </TableCell>
                    <TableCell>{courseName}</TableCell>
                    <TableCell>{parentName}</TableCell>
                    <TableCell>{teacherName}</TableCell>
                    <TableCell>{lpName}</TableCell>
                    <TableCell>{getBadge(e.status)}</TableCell>
                    <TableCell>{progressPct}%</TableCell>
                    <TableCell>{durationDays}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedEnrollment(e)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedEnrollment(e)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {e.status === 'pending_teacher' && (
                          <Button
                            size="sm"
                            onClick={() => openAssignTeacher(e)}
                          >
                            Assign Teacher
                          </Button>
                        )}
                        {e.status === 'pending_lp' && (
                          <Button
                            size="sm"
                            onClick={() => openAssignLP(e)}
                          >
                            Assign LP
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelEnrollment(e.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedEnrollment && (
        <div className="mt-4">
          <EnrollmentDetailView
            enrollmentId={selectedEnrollment.id}
            onClose={() => setSelectedEnrollment(null)}
          />
        </div>
      )}

      {assignTeacherFor && (
        <AssignTeacherModal
          student={{ id: assignTeacherFor.studentId, fullName: '' } as any}
          onClose={() => {
            setAssignTeacherFor(null);
            fetchEnrollments();
          }}
          onAssigned={fetchEnrollments}
        />
      )}

      {assignLPFor && (
        <AssignLPModal
          student={{ id: assignLPFor.studentId, fullName: '' } as any}
          onClose={() => {
            setAssignLPFor(null);
            fetchEnrollments();
          }}
          onAssigned={fetchEnrollments}
        />
      )}
    </div>
  );
}
