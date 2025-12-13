// src/pages/admin/EnrollmentManagement/EnrollmentsList.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
import { Eye } from 'lucide-react';

import EnrollmentDetailView from './EnrollmentDetailView';
import AssignTeacherModal from './AssignTeacherModal';
import AssignLPModal from './AssignLPModal';

/* ---------------- helpers ---------------- */

const normalizeId = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (typeof value.id === 'string') return value.id;
    if (typeof value.path === 'string') {
      const parts = value.path.split('/');
      return parts[parts.length - 1] || null;
    }
  }
  return null;
};

const resolveDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value?.toDate === 'function') {
    const d = value.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const statusBadge = (status?: string) => {
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

interface Props {
  reloadKey?: number;
}

export default function EnrollmentsList({ reloadKey }: Props) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, any>>({});
  const [coursesMap, setCoursesMap] = useState<Record<string, any>>({});
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'__all__' | string>('__all__');

  const [viewEnrollment, setViewEnrollment] = useState<any | null>(null);
  const [assignTeacherFor, setAssignTeacherFor] = useState<any | null>(null);
  const [assignLPFor, setAssignLPFor] = useState<any | null>(null);

  /* ---------------- data load ---------------- */

  const fetchEnrollments = useCallback(async () => {
    const snap = await getDocs(query(collection(db, 'enrollments')));

    const items: any[] = [];
    const studentIds = new Set<string>();
    const courseIds = new Set<string>();
    const userIds = new Set<string>();

    snap.forEach((d) => {
      const raw = d.data() as any;

      const studentId =
        normalizeId(raw.studentId) ||
        normalizeId(raw.kidId) ||
        normalizeId(raw.childId) ||
        (Array.isArray(raw.kidIds) ? normalizeId(raw.kidIds[0]) : null);

      const courseId =
        normalizeId(raw.courseId) ||
        normalizeId(raw.course_id) ||
        normalizeId(raw.course);

      if (studentId) studentIds.add(studentId);
      if (courseId) courseIds.add(courseId);
      if (raw.parentId) userIds.add(raw.parentId);
      if (raw.teacherId) userIds.add(raw.teacherId);
      if (raw.lpId) userIds.add(raw.lpId);

      items.push({
        id: d.id,
        ...raw,
        studentId,
        courseId,
      });
    });

    const [kidsSnap, coursesSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, 'kids')),
      getDocs(collection(db, 'courses')),
      getDocs(collection(db, 'users')),
    ]);

    const sMap: Record<string, any> = {};
    kidsSnap.forEach((k) => {
      if (studentIds.has(k.id)) sMap[k.id] = { id: k.id, ...k.data() };
    });

    const cMap: Record<string, any> = {};
    coursesSnap.forEach((c) => {
      if (courseIds.has(c.id)) cMap[c.id] = { id: c.id, ...c.data() };
    });

    const uMap: Record<string, any> = {};
    usersSnap.forEach((u) => {
      if (userIds.has(u.id)) uMap[u.id] = { id: u.id, ...u.data() };
    });

    setEnrollments(items);
    setStudentsMap(sMap);
    setCoursesMap(cMap);
    setUsersMap(uMap);
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments, reloadKey]);

  /* ---------------- filtering (memoized) ---------------- */

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      const student = e.studentId ? studentsMap[e.studentId] : null;
      const studentName =
        student?.name ||
        student?.fullName ||
        e.studentName ||
        '';

      if (
        search &&
        !studentName.toLowerCase().includes(search.toLowerCase())
      )
        return false;

      if (statusFilter !== '__all__' && e.status !== statusFilter)
        return false;

      return true;
    });
  }, [enrollments, studentsMap, search, statusFilter]);

  /* ---------------- actions ---------------- */

  const cancelEnrollment = async (id: string) => {
    if (!confirm('Cancel this enrollment?')) return;
    await updateDoc(doc(db, 'enrollments', id), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
    fetchEnrollments();
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
        <h2 className="text-xl font-semibold">Enrollments</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Search student"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              <SelectItem value="pending_teacher">Pending Teacher</SelectItem>
              <SelectItem value="pending_lp">Pending LP</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
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
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.map((e) => {
                const student = e.studentId
                  ? studentsMap[e.studentId]
                  : null;
                const course = e.courseId
                  ? coursesMap[e.courseId]
                  : null;

                const tp =
                  typeof e.topicProgress === 'object'
                    ? e.topicProgress
                    : {};
                const total = Object.keys(tp).length || 0;
                const completed = Object.values(tp).filter(
                  (t: any) => t?.status === 'completed',
                ).length;
                const progress =
                  total === 0 ? 0 : Math.round((completed / total) * 100);

                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      {student?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {course?.name || 'Unknown Course'}
                    </TableCell>
                    <TableCell>{statusBadge(e.status)}</TableCell>
                    <TableCell>{progress}%</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewEnrollment(e)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {e.status === 'pending_teacher' && (
                        <Button
                          size="sm"
                          onClick={() => setAssignTeacherFor(e)}
                        >
                          Assign Teacher
                        </Button>
                      )}

                      {e.status === 'pending_lp' && (
                        <Button
                          size="sm"
                          onClick={() => setAssignLPFor(e)}
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {viewEnrollment && (
        <EnrollmentDetailView
          enrollmentId={viewEnrollment.id}
          onClose={() => setViewEnrollment(null)}
        />
      )}

      {assignTeacherFor && (
        <AssignTeacherModal
          enrollment={assignTeacherFor}
          onClose={() => {
            setAssignTeacherFor(null);
            fetchEnrollments();
          }}
        />
      )}

      {assignLPFor && (
        <AssignLPModal
          enrollment={assignLPFor}
          onClose={() => {
            setAssignLPFor(null);
            fetchEnrollments();
          }}
        />
      )}
    </div>
  );
}
