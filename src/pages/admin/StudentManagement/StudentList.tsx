import React, { useEffect, useMemo, useState } from 'react';
import { onSnapshot, collection, query, orderBy, getDocs, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Button } from '@components/ui/button';
import { toast } from '@components/hooks/use-toast';
import CreateStudentForm from './CreateStudentForm';
import AssignCourseModal from './AssignCourseModal';
import AssignTeacherModal from './AssignTeacherModal';
import AssignLPModal from './AssignLPModal';
import { Student } from '../../../types/Student';
import { User } from '../../../types/User';

const PAGE_SIZE = 25;

interface StudentListProps {
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onAssignCourse: (student: Student) => void;
}

export default function StudentList({ onEdit, onDelete, onAssignCourse }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [parentFilter, setParentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);

  const [assignCourseFor, setAssignCourseFor] = useState<Student | null>(null);
  const [assignTeacherFor, setAssignTeacherFor] = useState<Student | null>(null);
  const [assignLPFor, setAssignLPFor] = useState<Student | null>(null);

  useEffect(() => {
    // load parents list for filters
    const loadParents = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'parent'));
        const snap = await getDocs(q);
        setParents(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as User[]);
      } catch (err) {
        console.error(err);
      }
    };
    loadParents();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'kids'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Student[];
      setStudents(list);
    }, err => console.error(err));
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    let list = students.slice();
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(st => st.fullName.toLowerCase().includes(s) || (st.parentIds || []).some(pid => {
        const p = parents.find(x => x.uid === pid || x.id === pid);
        return p?.email?.toLowerCase().includes(s);
      }));
    }
    if (gradeFilter !== 'all') list = list.filter(s => s.grade === gradeFilter);
    if (statusFilter !== 'all') list = list.filter(s => s.status === statusFilter);
    if (parentFilter !== 'all') list = list.filter(s => (s.parentIds || []).includes(parentFilter));
    return list;
  }, [students, search, gradeFilter, statusFilter, parentFilter, parents]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Students</h2>
        <CreateStudentForm onStudentCreated={() => {/* refresh handled by listener */}} />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search name or parent email" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Grade"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="Pre-K">Pre-K</SelectItem>
              <SelectItem value="KG">KG</SelectItem>
              <SelectItem value="Grade 1">Grade 1</SelectItem>
              <SelectItem value="Grade 2">Grade 2</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={parentFilter} onValueChange={setParentFilter}>
            <SelectTrigger className="w-[250px]"><SelectValue placeholder="Filter by parent"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parents</SelectItem>
              {parents.map(p => (
                <SelectItem key={p.uid || p.id} value={p.uid || p.id}>{p.email} — {p.name || p.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Parents</TableHead>
              <TableHead>DOB</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.fullName}</TableCell>
                <TableCell>
                  {(s.parentIds || []).map(pid => {
                    const p = parents.find(x => x.uid === pid || x.id === pid);
                    return <div key={pid}>{p?.email || pid}</div>;
                  })}
                </TableCell>
                <TableCell>{s.dob}</TableCell>
                <TableCell>{s.grade}</TableCell>
                <TableCell>{s.status}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onAssignCourse(s)}>Assign Course</Button>
                    <Button size="sm" onClick={() => setAssignTeacherFor(s)}>Assign Teacher</Button>
                    <Button size="sm" onClick={() => setAssignLPFor(s)}>Assign LP</Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(s.id)}>Delete</Button>
                    <Button size="sm" variant="secondary" onClick={() => onEdit(s)}>Edit</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between p-4">
          <div>Showing {filtered.length} students</div>
          <div className="space-x-2">
            <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
            <span>Page {page + 1} / {pageCount}</span>
            <Button onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}>Next</Button>
          </div>
        </div>
      </Card>

      {assignCourseFor && <AssignCourseModal student={assignCourseFor} onClose={() => setAssignCourseFor(null)} />}
      {assignTeacherFor && <AssignTeacherModal student={assignTeacherFor} onClose={() => setAssignTeacherFor(null)} />}
      {assignLPFor && <AssignLPModal student={assignLPFor} onClose={() => setAssignLPFor(null)} />}
    </div>
  );
}
