// src/pages/admin/EnrollmentManagement/EnrollmentsList.tsx
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  collection,
  getDocs,
  query,
  orderBy,
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

type Enrollment = {
  id: string;
  courseId?: string; // might be slug / code / docId depending on your data
  kidIds?: string[];
  kidNames?: string[]; // if you later store names directly (optional)
  status?: string;
  creditsRemaining?: number;
  creditsTotal?: number;
  billingCycle?: string;
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
  if (!ids.length) return {};
  const batches = chunk(ids, 10);

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

  // find missing
  const missing = ids.filter((id) => !byAnyKey[id]);
  if (!missing.length) return byAnyKey;

  // 2) try studentId
  for (const batch of chunk(missing, 10)) {
    const q2 = query(collection(db, 'kids'), where('studentId', 'in', batch));
    const snap = await getDocs(q2);
    snap.docs.forEach(addKid);
  }

  // recompute missing
  const stillMissing = ids.filter((id) => !byAnyKey[id]);
  if (!stillMissing.length) return byAnyKey;

  // 3) try uid
  for (const batch of chunk(stillMissing, 10)) {
    const q3 = query(collection(db, 'kids'), where('uid', 'in', batch));
    const snap = await getDocs(q3);
    snap.docs.forEach(addKid);
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
  if (!ids.length) return {};
  const batches = chunk(ids, 10);

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

  let missing = ids.filter((id) => !byAnyKey[id]);
  if (!missing.length) return byAnyKey;

  // 2) courseId
  for (const batch of chunk(missing, 10)) {
    const q2 = query(collection(db, 'courses'), where('courseId', 'in', batch));
    const snap = await getDocs(q2);
    snap.docs.forEach(addCourse);
  }

  missing = ids.filter((id) => !byAnyKey[id]);
  if (!missing.length) return byAnyKey;

  // 3) slug
  for (const batch of chunk(missing, 10)) {
    const q3 = query(collection(db, 'courses'), where('slug', 'in', batch));
    const snap = await getDocs(q3);
    snap.docs.forEach(addCourse);
  }

  missing = ids.filter((id) => !byAnyKey[id]);
  if (!missing.length) return byAnyKey;

  // 4) id field
  for (const batch of chunk(missing, 10)) {
    const q4 = query(collection(db, 'courses'), where('id', 'in', batch));
    const snap = await getDocs(q4);
    snap.docs.forEach(addCourse);
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

export default function EnrollmentsList({ reloadKey }: { reloadKey: number }) {
  const enrollmentsQuery = useQuery({
    queryKey: ['adminEnrollments', reloadKey],
    queryFn: fetchEnrollments,
  });

  const enrollments = useMemo(() => enrollmentsQuery.data ?? [], [enrollmentsQuery.data]);

  const allKidIds = useMemo(() => {
    const set = new Set<string>();
    enrollments.forEach((e) => (e.kidIds ?? []).forEach((id) => id && set.add(id)));
    return Array.from(set);
  }, [enrollments]);

  const allCourseIds = useMemo(() => {
    const set = new Set<string>();
    enrollments.forEach((e) => e.courseId && set.add(e.courseId));
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
    return name || 'Unknown student';
  };

  const courseLabel = (courseId?: string) => {
    if (!courseId) return '—';
    const c = coursesMap[courseId];
    const name = pickCourseName(c);
    return name || 'Unknown course';
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

  return (
    <div className="space-y-3">
      {(kidsQuery.isLoading || coursesQuery.isLoading) && (
        <div className="text-xs text-muted-foreground">
          Resolving names…
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course</TableHead>
            <TableHead>Student(s)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead>Billing</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {enrollments.map((e) => {
            const kids = (e.kidIds ?? []).map(kidLabel).join(', ');
            const status = e.status ?? 'unknown';

            return (
              <TableRow key={e.id}>
                <TableCell className="font-medium">
                  {courseLabel(e.courseId)}
                </TableCell>

                <TableCell>{kids || '—'}</TableCell>

                <TableCell>
                  <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                    {status}
                  </Badge>
                </TableCell>

                <TableCell>
                  {(e.creditsRemaining ?? 0)} / {(e.creditsTotal ?? 0)}
                </TableCell>

                <TableCell>{e.billingCycle ?? '—'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
