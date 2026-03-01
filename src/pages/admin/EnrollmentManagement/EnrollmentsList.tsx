// src/pages/admin/EnrollmentManagement/EnrollmentsList.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  orderBy,
  writeBatch,
  serverTimestamp,
  updateDoc,
  where,
  documentId,
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
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { useToast } from '@components/hooks/use-toast';

type Enrollment = {
  id: string;
  courseId?: string; // might be slug / code / docId depending on your data
  kidIds?: string[];
  kidNames?: string[]; // if you later store names directly (optional)
  status?: string;
  creditsRemaining?: number;
  creditsTotal?: number;
  billingCycle?: string;
  ratePerSession?: number;
  feePerSession?: number;
  feePerClass?: number;
  teacherPayPerSession?: number;
  teacherId?: string;
};

type KidDoc = {
  id: string;
  // try many possible name fields
  name?: string;
  fullName?: string;
  displayName?: string;
  studentName?: string;
  firstName?: string;
  lastName?: string;

  // possible id link fields
  studentId?: string;
  uid?: string;
};

type CourseDoc = {
  id: string;
  // try many possible title fields
  name?: string;
  title?: string;
  courseName?: string;

  // possible id link fields
  courseId?: string;
  slug?: string;
  code?: string;
};

function chunk<T>(arr: T[], size = 10) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Normalize various ID shapes into a plain doc id string or undefined
function normalizeId(x: any): string | undefined {
  if (!x) return undefined;
  if (typeof x === 'string') {
    const s = x.trim();
    if (!s) return undefined;
    const parts = s.split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : undefined;
  }
  if (typeof x === 'object') {
    // DocumentReference-ish
    if (typeof x.id === 'string' && x.id) return x.id;
    // some libs expose a path string
    if (typeof x.path === 'string' && x.path) {
      const parts = x.path.split('/').filter(Boolean);
      return parts.length ? parts[parts.length - 1] : undefined;
    }
    // fallback: maybe _path or similar internal structure
    if (x._path && Array.isArray(x._path.segments)) {
      const segs = x._path.segments;
      return segs.length ? segs[segs.length - 1] : undefined;
    }
  }
  return undefined;
}

async function fetchEnrollments(): Promise<Enrollment[]> {
  const qy = query(collection(db, 'enrollments'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

/**
 * Kids:
 * 1) docId IN kidIds
 * 2) studentId IN kidIds (if your kid doc id is different)
 * 3) uid IN kidIds (if you store auth uid inside kid doc)
 */
async function fetchKidsByIds(ids: string[]): Promise<Record<string, KidDoc>> {
  // defensively normalize incoming ids (support paths, refs, objects)
  const normalized = (ids ?? []).map(normalizeId).filter(Boolean) as string[];
  if (!normalized.length) return {};
  const batches = chunk(normalized, 10);

  const byAnyKey: Record<string, KidDoc> = {};
  const addKid = (d: any) => {
    const kid = { id: d.id, ...(d.data() as any) } as KidDoc;
    byAnyKey[kid.id] = kid;
    if (kid.studentId) byAnyKey[kid.studentId] = kid;
    if (kid.uid) byAnyKey[kid.uid] = kid;
  };

  // 1) try docId
  for (const batch of batches) {
    const q1 = query(collection(db, 'kids'), where(documentId(), 'in', batch));
    const snap = await getDocs(q1);
    snap.docs.forEach(addKid);
  }

  // find missing (against normalized list)
  const missing = normalized.filter((id) => !byAnyKey[id]);
  if (!missing.length) return byAnyKey;

  // 2) try studentId
  for (const batch of chunk(missing, 10)) {
    const q2 = query(collection(db, 'kids'), where('studentId', 'in', batch));
    const snap = await getDocs(q2);
    snap.docs.forEach(addKid);
  }
  const stillMissing = normalized.filter((id) => !byAnyKey[id]);
  if (!stillMissing.length) return byAnyKey;

  // 3) try uid
  for (const batch of chunk(stillMissing, 10)) {
    const q3 = query(collection(db, 'kids'), where('uid', 'in', batch));
    const snap = await getDocs(q3);
    snap.docs.forEach(addKid);
  }
  // final unresolved kid ids
  const unresolved = normalized.filter((id) => !byAnyKey[id]);
  if (import.meta.env?.DEV && unresolved.length) {
    console.debug('Unresolved kidIds:', unresolved.slice(0, 20));
  }

  return byAnyKey;
}
/**
 * Courses:
 * 1) docId IN courseIds
 * 2) courseId IN courseIds
 * 3) slug IN courseIds
 * 4) id IN courseIds
 */
async function fetchCoursesByIds(ids: string[]): Promise<Record<string, CourseDoc>> {
  // defensively normalize incoming ids (support paths, refs, objects)
  const normalized = (ids ?? []).map(normalizeId).filter(Boolean) as string[];
  if (!normalized.length) return {};
  const batches = chunk(normalized, 10);

  const byAnyKey: Record<string, CourseDoc> = {};
  const addCourse = (d: any) => {
    const course = { id: d.id, ...(d.data() as any) } as CourseDoc;
    byAnyKey[course.id] = course;
    if (course.courseId) byAnyKey[course.courseId] = course;
    if (course.slug) byAnyKey[course.slug] = course;
    if (course.code) byAnyKey[course.code] = course;
  };

  // 1) docId
  for (const batch of batches) {
    const q1 = query(collection(db, 'courses'), where(documentId(), 'in', batch));
    const snap = await getDocs(q1);
    snap.docs.forEach(addCourse);
  }

  let missing = normalized.filter((id) => !byAnyKey[id]);
  if (!missing.length) return byAnyKey;

  // 2) courseId
  for (const batch of chunk(missing, 10)) {
    const q2 = query(collection(db, 'courses'), where('courseId', 'in', batch));
    const snap = await getDocs(q2);
    snap.docs.forEach(addCourse);
  }

  missing = normalized.filter((id) => !byAnyKey[id]);
  if (!missing.length) return byAnyKey;

  // 2b) try code field (some courses use `code`)
  for (const batch of chunk(missing, 10)) {
    const q2b = query(collection(db, 'courses'), where('code', 'in', batch));
    const snap = await getDocs(q2b);
    snap.docs.forEach(addCourse);
  }

  missing = normalized.filter((id) => !byAnyKey[id]);
  if (!missing.length) return byAnyKey;

  // 3) slug
  for (const batch of chunk(missing, 10)) {
    const q3 = query(collection(db, 'courses'), where('slug', 'in', batch));
    const snap = await getDocs(q3);
    snap.docs.forEach(addCourse);
  }

  missing = normalized.filter((id) => !byAnyKey[id]);
  if (!missing.length) return byAnyKey;

  // 4) id field
  for (const batch of chunk(missing, 10)) {
    const q4 = query(collection(db, 'courses'), where('id', 'in', batch));
    const snap = await getDocs(q4);
    snap.docs.forEach(addCourse);
  }

  // final unresolved ids
  const unresolved = normalized.filter((id) => !byAnyKey[id]);
  if (import.meta.env?.DEV && unresolved.length) {
    console.debug('Unresolved courseIds:', unresolved.slice(0, 20));
  }

  return byAnyKey;
}

function pickKidName(k?: KidDoc) {
  if (!k) return '';
  if (k.name) return k.name;
  if (k.fullName) return k.fullName;
  if (k.displayName) return k.displayName;
  if (k.studentName) return k.studentName;
  const fn = [k.firstName, k.lastName].filter(Boolean).join(' ').trim();
  if (fn) return fn;
  return '';
}

function pickCourseName(c?: CourseDoc) {
  if (!c) return '';
  return c.name || c.title || c.courseName || '';
}

function normalizeEnrollmentStatus(value: any): string {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'active';
  if (raw === 'pending_teacher') return 'trial';
  if (raw === 'pending_payment' || raw === 'pending_lp') return 'active';
  if (raw === 'enrolled' || raw === 'current' || raw === 'ongoing') return 'active';
  if (raw === 'canceled') return 'cancelled';
  return raw;
}

export default function EnrollmentsList({ reloadKey }: { reloadKey: number }) {
  const [statusTab, setStatusTab] = useState<'active' | 'past'>('active');
  const [editOpen, setEditOpen] = useState(false);
  const [editEnrollment, setEditEnrollment] = useState<Enrollment | null>(null);
  const [editStatus, setEditStatus] = useState('active');
  const [editParentRate, setEditParentRate] = useState('');
  const [editTeacherRate, setEditTeacherRate] = useState('');
  const [editTeacherId, setEditTeacherId] = useState('');
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState<Array<{ id: string; name?: string; email?: string }>>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((u: any) =>
            u.role === 'teacher' || (Array.isArray(u.roles) && u.roles.includes('teacher'))
          )
          .map((u: any) => ({ id: u.id, name: u.displayName || u.name, email: u.email }));
        setTeachers(rows);
      } catch (err) {
        console.warn('[EnrollmentsList] Failed to load teachers', err);
      }
    };
    void loadTeachers();
  }, []);
  const enrollmentsQuery = useQuery({
    queryKey: ['adminEnrollments', reloadKey],
    queryFn: fetchEnrollments,
  });

  const enrollments = useMemo(() => enrollmentsQuery.data ?? [], [enrollmentsQuery.data]);
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      const status = normalizeEnrollmentStatus(e.status);
      const isPast =
        status === 'completed' ||
        status === 'discontinued' ||
        status === 'expired' ||
        status === 'cancelled' ||
        status === 'archived';
      const isActive = !isPast;
      return statusTab === 'active' ? isActive : isPast;
    });
  }, [enrollments, statusTab]);

  const allKidIds = useMemo(() => {
    const set = new Set<string>();
    enrollments.forEach((e) =>
      (e.kidIds ?? [])
        .map(normalizeId)
        .filter(Boolean)
        .forEach((id) => id && set.add(id)),
    );
    return Array.from(set);
  }, [enrollments]);

  const allCourseIds = useMemo(() => {
    const set = new Set<string>();
    enrollments.forEach((e) => {
      const id = normalizeId(e.courseId);
      if (id) set.add(id);
    });
    return Array.from(set);
  }, [enrollments]);

  const kidsQuery = useQuery({
    queryKey: ['kidsByIds', allKidIds.join('|')],
    queryFn: () => fetchKidsByIds(allKidIds),
    enabled: allKidIds.length > 0,
  });

  const coursesQuery = useQuery({
    queryKey: ['coursesByIds', allCourseIds.join('|')],
    queryFn: () => fetchCoursesByIds(allCourseIds),
    enabled: allCourseIds.length > 0,
  });

  const kidsMap = kidsQuery.data ?? {};
  const coursesMap = coursesQuery.data ?? {};

  const kidLabel = (kidId: string) => {
    const k = kidsMap[kidId];
    const name = pickKidName(k);
    return name || `Unknown student (${kidId})`;
  };

  const courseLabel = (courseId?: string) => {
    if (!courseId) return '—';
    const c = coursesMap[courseId];
    const name = pickCourseName(c);
    return name || `Unknown course (${courseId})`;
  };

  if (enrollmentsQuery.isLoading) {
    return <div className="py-6 text-center">Loading enrollments…</div>;
  }

  if (enrollmentsQuery.isError) {
    return (
      <div className="py-6 text-center text-red-600">
        Failed to load enrollments.
      </div>
    );
  }

  const openEdit = (enrollment: Enrollment) => {
    const rawParent =
      enrollment.ratePerSession ??
      enrollment.feePerSession ??
      enrollment.feePerClass ??
      0;
    const rawTeacher =
      enrollment.teacherPayPerSession ?? 0;
    const parentValue = Number(rawParent);
    const teacherValue = Number(rawTeacher);

    setEditEnrollment(enrollment);
    setEditStatus(normalizeEnrollmentStatus(enrollment.status));
    setEditParentRate(Number.isFinite(parentValue) ? String(parentValue) : '');
    setEditTeacherRate(Number.isFinite(teacherValue) ? String(teacherValue) : '');
    setEditTeacherId(enrollment.teacherId || '');
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editEnrollment) return;
    const parentRate = Number(editParentRate);
    if (!Number.isFinite(parentRate) || parentRate <= 0) {
      toast({
        title: 'Invalid fee',
        description: 'Enter a valid fee per session.',
        variant: 'destructive',
      });
      return;
    }
    const teacherRate = Number(editTeacherRate);
    const teacherPayPerSession = Number.isFinite(teacherRate) ? teacherRate : 0;

    try {
      setSaving(true);
      await updateDoc(doc(db, 'enrollments', editEnrollment.id), {
        status: editStatus,
        ratePerSession: parentRate,
        feePerSession: parentRate,
        feePerClass: parentRate,
        teacherPayPerSession,
        teacherId: editTeacherId || null,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Enrollment updated' });
      setEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['adminEnrollments'], exact: false });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to update enrollment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (enrollment: Enrollment) => {
    try {
      setSaving(true);
      await updateDoc(doc(db, 'enrollments', enrollment.id), {
        status: 'archived',
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Enrollment archived' });
      await queryClient.invalidateQueries({ queryKey: ['adminEnrollments'], exact: false });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to archive enrollment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getDeletePlan = async (enrollmentId: string) => {
    const [chargesSnap, paymentsSnap, sessionsSnap] = await Promise.all([
      getDocs(query(collection(db, 'billingCharges'), where('enrollmentId', '==', enrollmentId), limit(1))),
      getDocs(query(collection(db, 'payments'), where('enrollmentId', '==', enrollmentId), limit(1))),
      getDocs(query(collection(db, 'classSessions'), where('enrollmentId', '==', enrollmentId))),
    ]);

    if (!chargesSnap.empty || !paymentsSnap.empty) {
      return {
        allowed: false,
        reason: 'Enrollment has billing activity. Archive instead.',
        sessionIds: [] as string[],
      };
    }

    const sessions = sessionsSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      status: String(docSnap.data()?.status || '').toLowerCase(),
    }));
    const hasCompleted = sessions.some((s) => s.status === 'completed');
    if (hasCompleted) {
      return {
        allowed: false,
        reason: 'Enrollment has completed sessions. Archive instead.',
        sessionIds: [] as string[],
      };
    }

    return { allowed: true, reason: '', sessionIds: sessions.map((s) => s.id) };
  };

  const handleDelete = async (enrollment: Enrollment) => {
    let plan: { allowed: boolean; reason: string; sessionIds: string[] };
    try {
      plan = await getDeletePlan(enrollment.id);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to check delete eligibility',
        variant: 'destructive',
      });
      return;
    }
    if (!plan.allowed) {
      toast({
        title: 'Cannot delete enrollment',
        description: plan.reason,
        variant: 'destructive',
      });
      return;
    }
    const confirm = window.prompt(
      'Type DELETE to permanently remove this enrollment (and any unbilled sessions).'
    );
    if (confirm !== 'DELETE') return;

    try {
      setSaving(true);
      if (plan.sessionIds.length) {
        const batches = chunk(plan.sessionIds, 450);
        for (const batchIds of batches) {
          const batch = writeBatch(db);
          batchIds.forEach((sessionId) => {
            batch.delete(doc(db, 'classSessions', sessionId));
          });
          await batch.commit();
        }
      }
      await deleteDoc(doc(db, 'enrollments', enrollment.id));
      toast({
        title: 'Enrollment deleted',
        description: plan.sessionIds.length
          ? 'Removed scheduled sessions with no billing.'
          : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['adminEnrollments'], exact: false });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to delete enrollment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {(kidsQuery.isLoading || coursesQuery.isLoading) && (
        <div className="text-xs text-muted-foreground">
          Resolving names…
        </div>
      )}

      {filteredEnrollments.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          {statusTab === 'active' ? 'No active enrollments.' : 'No past enrollments.'}
        </div>
      ) : (
        <Table className="w-full table-fixed text-sm">
        <TableHeader>
          <TableRow>
            <TableHead colSpan={6}>
              <div className="flex flex-wrap items-center gap-2 py-1">
                <button
                  type="button"
                  onClick={() => setStatusTab('active')}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    statusTab === 'active'
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusTab('past')}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    statusTab === 'past'
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  Past
                </button>
              </div>
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="px-3 py-2 text-xs font-semibold w-[200px]">Course</TableHead>
            <TableHead className="px-3 py-2 text-xs font-semibold w-[200px]">Student(s)</TableHead>
            <TableHead className="px-3 py-2 text-xs font-semibold w-[110px]">Status</TableHead>
            <TableHead className="px-3 py-2 text-xs font-semibold w-[100px]">Credits</TableHead>
            <TableHead className="px-3 py-2 text-xs font-semibold w-[100px]">Billing</TableHead>
            <TableHead className="px-3 py-2 text-xs font-semibold w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredEnrollments.map((e) => {
            const kids = (e.kidIds ?? []).map(kidLabel).join(', ');
            const rawStatus = e.status ?? 'unknown';
            const status = normalizeEnrollmentStatus(rawStatus);
            const badgeVariant =
              status === 'active' || status === 'trial' || status === 'paused'
                ? 'default'
                : status === 'cancelled'
                  ? 'destructive'
                  : status === 'completed' || status === 'discontinued' || status === 'expired'
                    ? 'outline'
                    : 'secondary';

            return (
              <TableRow key={e.id}>
                <TableCell className="px-3 py-2 font-medium">
                  <div className="max-w-[200px] truncate" title={courseLabel(e.courseId)}>
                    {courseLabel(e.courseId)}
                  </div>
                </TableCell>

                <TableCell className="px-3 py-2">
                  <div className="max-w-[200px] truncate" title={kids || ''}>
                    {kids || '—'}
                  </div>
                </TableCell>

                <TableCell className="px-3 py-2">
                  <Badge variant={badgeVariant} title={rawStatus !== status ? `raw: ${rawStatus}` : undefined}>
                    {status}
                  </Badge>
                </TableCell>

                <TableCell className="px-3 py-2">
                  {(e.creditsRemaining ?? 0)} / {(e.creditsTotal ?? 0)}
                </TableCell>

                <TableCell className="px-3 py-2">{e.billingCycle ?? '—'}</TableCell>

                <TableCell className="px-3 py-2">
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => openEdit(e)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="secondary" className="h-7 px-2 text-xs" onClick={() => handleArchive(e)} disabled={saving}>
                      Archive
                    </Button>
                    <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => handleDelete(e)} disabled={saving}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Enrollment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Fee per session (₹)</label>
                <Input
                  type="number"
                  step="1"
                  value={editParentRate}
                  onChange={(e) => setEditParentRate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Teacher pay per session (₹)</label>
                <Input
                  type="number"
                  step="1"
                  value={editTeacherRate}
                  onChange={(e) => setEditTeacherRate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Teacher</label>
              <Select value={editTeacherId || '__none__'} onValueChange={(v) => setEditTeacherId(v === '__none__' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name || t.email || t.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
