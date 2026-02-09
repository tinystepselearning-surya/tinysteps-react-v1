import React, { useEffect, useMemo, useState } from 'react';
import {
  onSnapshot,
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../../lib/firebaseConfig';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Button } from '@components/ui/button';
import { toast } from '@components/hooks/use-toast';
import AssignCourseModal from './AssignCourseModal';
import AssignTeacherModal from './AssignTeacherModal';
import AssignLPModal from './AssignLPModal';
import { Student } from '../../../types/Student';
import { useEnrollmentsForStudents } from '../../../hooks/useData';
import { User } from '../../../types/User';
import { useAuthStore } from '../../../store/useAuthStore';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';

const PAGE_SIZE = 25;

interface StudentListProps {
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onAssignCourse: (student: Student) => void;
}

type EnrollmentLite = {
  id: string;
  status?: string;
  courseId?: string;
  course?: { title?: string };
  teacherId?: string;
  teacher?: { name?: string; email?: string; uid?: string; id?: string };
  feePerClass?: number;
  currency?: string;
  joinUrl?: string;
  schedule?: {
    timezone?: string;
    weekdays?: number[];
    timeHHmm?: string;
    durationMins?: number;
  };
  startDate?: any; // Timestamp
};

function computeAgeYearsFromDob(dob?: string): number | null {
  try {
    if (!dob) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
    if (!m) return null;

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;

    const birth = new Date(y, mo - 1, d);
    if (Number.isNaN(birth.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const hasHadBirthdayThisYear =
      now.getMonth() > birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    if (!hasHadBirthdayThisYear) age -= 1;

    return age >= 0 && age <= 30 ? age : null;
  } catch {
    return null;
  }
}

function displayAgeYears(s: any): string {
  const direct = s?.ageYears ?? s?.age;
  if (typeof direct === 'number' && Number.isFinite(direct)) return String(direct);

  const legacyDob = s?.dob ?? s?.birthdate;
  const fromDob = computeAgeYearsFromDob(legacyDob);
  return fromDob != null ? String(fromDob) : '—';
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODateOnly(iso: string): Date | null {
  // iso: YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  const dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatYMDCompact(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function safeNumber(v: any, fallback = 0): number {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

function enrollmentLabel(e: EnrollmentLite): string {
  const courseTitle = e.course?.title || e.courseId || 'Course';
  const teacher = e.teacher?.name || e.teacher?.email || e.teacherId || '';
  const fee = safeNumber(e.feePerClass, 0);
  const feeText = fee > 0 ? ` — ₹${fee}/class` : '';
  return `${courseTitle}${teacher ? ` — ${teacher}` : ''}${feeText}`;
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

  // ✅ NEW: schedule modal state
  const [scheduleFor, setScheduleFor] = useState<Student | null>(null);
  const [scheduleEnrollmentId, setScheduleEnrollmentId] = useState<string>('');
  const [enrollmentStartDate, setEnrollmentStartDate] = useState<string>(toISODate(new Date()));
  const [classesStartDate, setClassesStartDate] = useState<string>(toISODate(new Date()));
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri default
  const [timeHHmm, setTimeHHmm] = useState<string>('18:00');
  const [durationMins, setDurationMins] = useState<number>(35);
  const [feePerClass, setFeePerClass] = useState<number>(0);
  const [generateWeeks, setGenerateWeeks] = useState<number>(8);
  const [endDate, setEndDate] = useState<string>(''); // optional
  const [meetingLink, setMeetingLink] = useState<string>(''); // optional (Zoom/Meet)
  const [savingSchedule, setSavingSchedule] = useState<boolean>(false);

  const { user } = useAuthStore();

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!window.confirm('Delete this enrollment?')) return;
    try {
      await import('firebase/firestore').then(({ deleteDoc, doc }) =>
        deleteDoc(doc(db, 'enrollments', enrollmentId))
      );
      toast({ title: 'Enrollment removed' });
      enrollmentsQuery.refetch();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to delete enrollment', variant: 'destructive' });
    }
  };

  useEffect(() => {
    // load parents list for filters
    const loadParents = async () => {
      try {
        const q = query(collection(db, 'users'));
        const snap = await getDocs(q);
        const allUsers = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as User[];
        setParents(allUsers.filter(u => u.role === 'parent'));
      } catch (err) {
        console.error('parents load error', err);
      }
    };
    loadParents();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'kids'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Student[];
        setStudents(list);
      },
      err => console.error(err)
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    let list = students.slice();

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(st =>
        (st.fullName || '').toLowerCase().includes(s) ||
        (st.parentIds || []).some(pid => {
          const p = parents.find(x => (x as any).uid === pid || x.id === pid);
          return (p?.email || '').toLowerCase().includes(s);
        })
      );
    }

    if (gradeFilter !== 'all') list = list.filter(s => s.grade === gradeFilter);
    if (statusFilter !== 'all') list = list.filter(s => (s as any).status === statusFilter);
    if (parentFilter !== 'all') list = list.filter(s => (s.parentIds || []).includes(parentFilter));

    return list;
  }, [students, search, gradeFilter, statusFilter, parentFilter, parents]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pagedStudentIds = paged.map(s => s.id);

  const enrollmentsQuery = useEnrollmentsForStudents(pagedStudentIds);

  const enrollmentsByStudent = useMemo(() => {
    const map: Record<string, EnrollmentLite[]> = {};
    if (!enrollmentsQuery.data) return map;
    (enrollmentsQuery.data as any[]).forEach((e: any) => {
      const sid = e.studentId || e.kidId || (e.kidIds && e.kidIds[0]);
      if (!sid) return;
      if (!map[sid]) map[sid] = [];
      map[sid].push(e as EnrollmentLite);
    });
    return map;
  }, [enrollmentsQuery.data]);

  const canAdminAct =
    user?.role === 'admin' || (user?.role === 'learningPartner');

  function openScheduleModal(student: Student) {
    const enrolls = enrollmentsByStudent[student.id] || [];
    if (enrolls.length === 0) {
      toast({
        title: 'No enrollment found',
        description: 'Assign a course first, then schedule recurring classes.',
        variant: 'destructive',
      });
      return;
    }

    const first = enrolls[0];

    setScheduleFor(student);
    setScheduleEnrollmentId(first.id);

    const today = new Date();
    const todayISO = toISODate(today);

    // default dates
    setEnrollmentStartDate(todayISO);
    setClassesStartDate(todayISO);

    // defaults from enrollment if already set
    setWeekdays(first.schedule?.weekdays?.length ? first.schedule.weekdays : [1, 3, 5]);
    setTimeHHmm(first.schedule?.timeHHmm || '18:00');
    setDurationMins(safeNumber(first.schedule?.durationMins, 35));
    setFeePerClass(safeNumber(first.feePerClass, 0));
    setGenerateWeeks(8);
    setEndDate('');
    setMeetingLink(first.joinUrl || '');
  }

  async function handleSaveSchedule() {
    if (!scheduleFor) return;

    const enrolls = enrollmentsByStudent[scheduleFor.id] || [];
    const selectedEnrollment = enrolls.find(e => e.id === scheduleEnrollmentId);

    if (!scheduleEnrollmentId || !selectedEnrollment) {
      toast({ title: 'Select an enrollment', variant: 'destructive' });
      return;
    }

    const enrollStart = parseISODateOnly(enrollmentStartDate);
    const classStart = parseISODateOnly(classesStartDate);
    if (!enrollStart || !classStart) {
      toast({ title: 'Invalid start date', variant: 'destructive' });
      return;
    }

    if (!timeHHmm || !/^\d{2}:\d{2}$/.test(timeHHmm)) {
      toast({ title: 'Invalid time', description: 'Use HH:MM format.', variant: 'destructive' });
      return;
    }

    if (!Array.isArray(weekdays) || weekdays.length === 0) {
      toast({ title: 'Pick at least one weekday', variant: 'destructive' });
      return;
    }

    const fee = safeNumber(feePerClass, 0);
    if (fee <= 0) {
      toast({ title: 'Fee per class required', description: 'Enter a fee > 0.', variant: 'destructive' });
      return;
    }

    const dur = Math.max(10, Math.min(180, safeNumber(durationMins, 35)));
    const weeks = Math.max(1, Math.min(52, safeNumber(generateWeeks, 8)));

    setSavingSchedule(true);
    try {
      // 1) Update enrollment with start date + fee + schedule
      const enrollmentRef = doc(db, 'enrollments', scheduleEnrollmentId);
      await updateDoc(enrollmentRef, {
        startDate: Timestamp.fromDate(enrollStart),
        feePerClass: fee,
        currency: 'INR',
        joinUrl: meetingLink ? meetingLink : null,
        schedule: {
          timezone: 'Asia/Kolkata',
          weekdays,
          timeHHmm,
          durationMins: dur,
        },
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || null,
      });

      // 2) Call Cloud Function to generate sessions
      const functions = getFunctions(undefined, 'asia-south1');
      const createSessionsFromSchedule = httpsCallable<
        { enrollmentId: string; weeksAhead?: number },
        { created: number; skipped: number; rangeStart: string; rangeEnd: string }
      >(functions, 'createSessionsFromSchedule');

      const result = await createSessionsFromSchedule({
        enrollmentId: scheduleEnrollmentId,
        weeksAhead: weeks,
      });

      const { created, skipped } = result.data;

      toast({
        title: 'Schedule saved',
        description: `✅ Created ${created} sessions (${skipped} already existed)`,
      });

      setScheduleFor(null);
      enrollmentsQuery.refetch();
    } catch (err: any) {
      console.error('Error saving schedule:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save schedule / create sessions.',
        variant: 'destructive',
      });
    } finally {
      setSavingSchedule(false);
    }
  }

  function toggleWeekday(day: number) {
    setWeekdays(prev => (prev.includes(day) ? prev.filter(x => x !== day) : [...prev, day].sort((a, b) => a - b)));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Students</h2>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search name or parent email"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
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
                <SelectItem key={(p as any).uid || p.id} value={(p as any).uid || p.id}>
                  {p.email} — {p.name || p.email}
                </SelectItem>
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
              <TableHead>Age</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrollments</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paged.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.fullName}</TableCell>

                <TableCell>
                  {(s.parentIds || []).map(pid => {
                    const p = parents.find(x => (x as any).uid === pid || x.id === pid);
                    return <div key={pid}>{p?.email || pid}</div>;
                  })}
                </TableCell>

                {/* ✅ Age instead of DOB */}
                <TableCell>{displayAgeYears(s)}</TableCell>

                <TableCell>{s.grade}</TableCell>
                <TableCell>{(s as any).status}</TableCell>

                {/* ✅ Enrollments in its own column */}
                <TableCell>
                  {enrollmentsByStudent[s.id] && enrollmentsByStudent[s.id].length > 0 ? (
                    <div className="space-y-1">
                      {enrollmentsByStudent[s.id].map((e: any) => (
                        <div key={e.id} className="text-sm flex items-center justify-between">
                          <div>
                            <strong>{e.course?.title || e.courseId}</strong>
                            {e.teacher && ` — ${e.teacher.name || e.teacher.email}`}
                            {` — ${e.status}`}
                            {safeNumber(e.feePerClass, 0) > 0 ? ` — ₹${e.feePerClass}/class` : ''}
                          </div>
                          <div className="ml-4">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteEnrollment(e.id)}
                              disabled={
                                !(
                                  user?.role === 'admin' ||
                                  (user?.role === 'learningPartner' && ((s as any).lpId === user.uid))
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">No enrollments</div>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => onAssignCourse(s)}
                      disabled={
                        !(
                          user?.role === 'admin' ||
                          (user?.role === 'learningPartner' && ((s as any).lpId === user.uid))
                        )
                      }
                    >
                      Assign Course
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setAssignTeacherFor(s)}
                      disabled={
                        !(
                          user?.role === 'admin' ||
                          (user?.role === 'learningPartner' && ((s as any).lpId === user.uid))
                        )
                      }
                    >
                      Assign Teacher
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setAssignLPFor(s)}
                      disabled={!(user?.role === 'admin')}
                    >
                      {user?.role === 'admin' ? 'Assign LP' : 'Not Authorized'}
                    </Button>

                    {/* ✅ NEW: Schedule Classes */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openScheduleModal(s)}
                      disabled={
                        !(
                          user?.role === 'admin' ||
                          (user?.role === 'learningPartner' && ((s as any).lpId === user.uid))
                        )
                      }
                    >
                      Schedule Classes
                    </Button>

                    <Button size="sm" variant="destructive" onClick={() => onDelete(s.id)}>
                      Delete
                    </Button>

                    <Button size="sm" variant="secondary" onClick={() => onEdit(s)}>
                      Edit
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between p-4">
          <div>Showing {filtered.length} students</div>
          <div className="space-x-2">
            <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              Prev
            </Button>
            <span>Page {page + 1} / {pageCount}</span>
            <Button onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}>
              Next
            </Button>
          </div>
        </div>
      </Card>

      {assignCourseFor && (
        <AssignCourseModal
          student={assignCourseFor}
          onClose={() => setAssignCourseFor(null)}
          onAssigned={() => {
            setAssignCourseFor(null);
            enrollmentsQuery.refetch();
          }}
        />
      )}

      {assignTeacherFor && (
        <AssignTeacherModal
          student={assignTeacherFor}
          onClose={() => setAssignTeacherFor(null)}
          onAssigned={() => {
            setAssignTeacherFor(null);
            enrollmentsQuery.refetch();
          }}
        />
      )}

      {assignLPFor && (
        <AssignLPModal
          student={assignLPFor}
          onClose={() => setAssignLPFor(null)}
          onAssigned={() => {
            setAssignLPFor(null);
            enrollmentsQuery.refetch();
          }}
        />
      )}

      {/* ✅ NEW: Schedule Classes Modal */}
      <Dialog open={!!scheduleFor} onOpenChange={(open) => !open && setScheduleFor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Schedule Classes {scheduleFor?.fullName ? `— ${scheduleFor.fullName}` : ''}
            </DialogTitle>
          </DialogHeader>

          {scheduleFor ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium mb-1">Enrollment (Course)</div>
                  <Select value={scheduleEnrollmentId} onValueChange={setScheduleEnrollmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select enrollment" />
                    </SelectTrigger>
                    <SelectContent>
                      {(enrollmentsByStudent[scheduleFor.id] || []).map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {enrollmentLabel(e)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-500 mt-1">
                    Tip: Assign course + teacher first if needed.
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Fee per class (₹)</div>
                  <Input
                    type="number"
                    min={0}
                    value={feePerClass}
                    onChange={(e) => setFeePerClass(safeNumber(e.target.value, 0))}
                    placeholder="e.g., 599"
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Enrollment start date</div>
                  <Input
                    type="date"
                    value={enrollmentStartDate}
                    onChange={(e) => setEnrollmentStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Classes start date</div>
                  <Input
                    type="date"
                    value={classesStartDate}
                    onChange={(e) => setClassesStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Time (HH:MM)</div>
                  <Input
                    type="time"
                    value={timeHHmm}
                    onChange={(e) => setTimeHHmm(e.target.value)}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Duration (minutes)</div>
                  <Input
                    type="number"
                    min={10}
                    max={180}
                    value={durationMins}
                    onChange={(e) => setDurationMins(safeNumber(e.target.value, 35))}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Generate for (weeks)</div>
                  <Input
                    type="number"
                    min={1}
                    max={52}
                    value={generateWeeks}
                    onChange={(e) => setGenerateWeeks(safeNumber(e.target.value, 8))}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    We will create future sessions in Firestore → sessions.
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">End date (optional)</div>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    If set, it overrides “weeks”.
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-sm font-medium mb-1">Weekdays</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { d: 0, label: 'Sun' },
                      { d: 1, label: 'Mon' },
                      { d: 2, label: 'Tue' },
                      { d: 3, label: 'Wed' },
                      { d: 4, label: 'Thu' },
                      { d: 5, label: 'Fri' },
                      { d: 6, label: 'Sat' },
                    ].map(w => (
                      <Button
                        key={w.d}
                        type="button"
                        size="sm"
                        variant={weekdays.includes(w.d) ? 'default' : 'outline'}
                        onClick={() => toggleWeekday(w.d)}
                      >
                        {w.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-sm font-medium mb-1">Zoom / Meet link (optional)</div>
                  <Input
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Note: Sessions are created with deterministic IDs so re-saving won’t duplicate. Existing sessions are skipped.
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setScheduleFor(null)} disabled={savingSchedule}>
              Cancel
            </Button>
            <Button onClick={handleSaveSchedule} disabled={savingSchedule}>
              {savingSchedule ? 'Saving...' : 'Save Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
