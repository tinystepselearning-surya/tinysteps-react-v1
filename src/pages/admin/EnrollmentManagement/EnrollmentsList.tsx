import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Badge } from '@components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { Eye, Edit, UserPlus, X } from 'lucide-react';
import EnrollmentDetailView from './EnrollmentDetailView';
import AssignTeacherModal from './AssignTeacherModal';
import AssignLPModal from './AssignLPModal';

export default function EnrollmentsList() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, any>>({});
  const [coursesMap, setCoursesMap] = useState<Record<string, any>>({});
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});

  const [filters, setFilters] = useState({ course: '', parent: '', teacher: '', lp: '', status: '' });
  const [search, setSearch] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState<any | null>(null);
  const [assignTeacherFor, setAssignTeacherFor] = useState<any | null>(null);
  const [assignLPFor, setAssignLPFor] = useState<any | null>(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    const q = query(collection(db, 'enrollments'));
    const snap = await getDocs(q);
  const items: any[] = [];
    const userIds = new Set<string>();
    const studentIds = new Set<string>();
    const courseIds = new Set<string>();

    snap.forEach((d) => {
      const data = { id: d.id, ...(d.data() as any) };
      items.push(data);
  // Enrollment documents may use "studentId" (singular) OR "kidIds" (array)
  if (data.studentId) studentIds.add(data.studentId);
  if (Array.isArray(data.kidIds)) data.kidIds.forEach((k: string) => studentIds.add(k));
      if (data.parentId) userIds.add(data.parentId);
      if (data.teacherId) userIds.add(data.teacherId);
      if (data.lpId) userIds.add(data.lpId);
      if (data.courseId) courseIds.add(data.courseId);
    });

    // fetch students
    const sMap: Record<string, any> = {};
    if (studentIds.size > 0) {
      const studentsSnap = await getDocs(collection(db, 'kids'));
      studentsSnap.forEach(s => {
        if (studentIds.has(s.id)) sMap[s.id] = { id: s.id, ...(s.data() as any) };
      });
    }

    // fetch courses
    const cMap: Record<string, any> = {};
    if (courseIds.size > 0) {
      const coursesSnap = await getDocs(collection(db, 'courses'));
      coursesSnap.forEach(c => {
        if (courseIds.has(c.id)) cMap[c.id] = { id: c.id, ...(c.data() as any) };
      });
    }

    // fetch users (parents/teachers/lps)
    const uMap: Record<string, any> = {};
    if (userIds.size > 0) {
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach(u => {
        if (userIds.has(u.id)) uMap[u.id] = { id: u.id, ...(u.data() as any) };
      });
    }

    setStudentsMap(sMap);
    setCoursesMap(cMap);
    setUsersMap(uMap);
    setEnrollments(items);
  };

  const getBadge = (status: string) => {
    switch (status) {
      case 'pending_teacher': return <Badge variant="secondary">🟡 Pending Teacher</Badge>;
      case 'pending_lp': return <Badge variant="secondary">🟡 Pending LP</Badge>;
      case 'active': return <Badge variant="default">🟢 Active</Badge>;
      case 'completed': return <Badge variant="outline">🔵 Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive">🔴 Cancelled</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  const openAssignTeacher = (enrollment: any) => setAssignTeacherFor(enrollment);
  const openAssignLP = (enrollment: any) => setAssignLPFor(enrollment);

  const cancelEnrollment = async (id: string) => {
    if (!confirm('Cancel this enrollment?')) return;
    await updateDoc(doc(db, 'enrollments', id), { status: 'cancelled', updatedAt: serverTimestamp() });
    fetchEnrollments();
  };

  const filtered = enrollments.filter(e => {
    const student = studentsMap[e.studentId] || (Array.isArray(e.kidIds) && e.kidIds.length > 0 ? studentsMap[e.kidIds[0]] : undefined);
  if (search && !(student?.name || '').toLowerCase().includes(search.toLowerCase())) return false;
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
          <Input placeholder="Search by student name" value={search} onChange={(e) => setSearch(e.target.value)} />
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
              {filtered.map(e => {
                // Enrollment doc may store kid id as 'studentId' or as an array under 'kidIds'
                const student = studentsMap[e.studentId] || (Array.isArray(e.kidIds) && e.kidIds.length > 0 ? studentsMap[e.kidIds[0]] : undefined);
                // Course ID could be stored as 'courseId' or as 'course_id' in some schemas; support both
                const course = coursesMap[e.courseId] || coursesMap[e.course_id];
                const parent = usersMap[e.parentId];
                const teacher = usersMap[e.teacherId];
                const lp = usersMap[e.lpId];

                // progress percent
                const tp =
                  e.topicProgress && typeof e.topicProgress === 'object'
                    ? e.topicProgress
                    : {};
                const totalTopicsFromProgress = Object.keys(tp).length;
                const totalTopicsFromCourse = Array.isArray(course?.topics)
                  ? course.topics.length
                  : 0;
                const totalTopics = totalTopicsFromProgress || totalTopicsFromCourse;
                const completed = Object.values(tp).filter(
                  (t: any) => t && t.status === 'completed'
                ).length;
                const progressPct = totalTopics === 0 ? 0 : Math.round((completed / totalTopics) * 100);

                // duration days
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

                const enrollmentDate = resolveDate(e.enrollmentDate);
                const startDate = resolveDate(e.startDate) || enrollmentDate;
                let durationDays: number | string = '-';
                if (startDate) {
                  const diffMs = new Date().getTime() - startDate.getTime();
                  if (!isNaN(diffMs)) {
                    durationDays =
                      diffMs >= 0
                        ? Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                        : 0;
                  }
                }

                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{student?.name || 'Unknown'}</TableCell>
                    <TableCell>{course?.name || 'Unknown Course'}</TableCell>
                    <TableCell>{parent?.name || parent?.email || 'Unknown Parent'}</TableCell>
                    <TableCell>{teacher?.name || 'Unassigned'}</TableCell>
                    <TableCell>{lp?.name || 'Unassigned'}</TableCell>
                    <TableCell>{getBadge(e.status)}</TableCell>
                    <TableCell>{progressPct}%</TableCell>
                    <TableCell>{durationDays}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedEnrollment(e)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedEnrollment(e)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {e.status === 'pending_teacher' && (
                          <Button size="sm" onClick={() => openAssignTeacher(e)}>Assign Teacher</Button>
                        )}
                        {e.status === 'pending_lp' && (
                          <Button size="sm" onClick={() => openAssignLP(e)}>Assign LP</Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => cancelEnrollment(e.id)}>Cancel</Button>
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
          <EnrollmentDetailView enrollmentId={selectedEnrollment.id} onClose={() => setSelectedEnrollment(null)} />
        </div>
      )}

      {assignTeacherFor && (
        <AssignTeacherModal enrollment={assignTeacherFor} onClose={() => { setAssignTeacherFor(null); fetchEnrollments(); }} />
      )}

      {assignLPFor && (
        <AssignLPModal enrollment={assignLPFor} onClose={() => { setAssignLPFor(null); fetchEnrollments(); }} />
      )}
    </div>
  );
}
