import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  documentId,
} from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';

type Enrollment = {
  id: string;
  courseId?: string;
  kidIds?: string[];
  studentIds?: string[]; // fallback if your schema uses studentIds
  status?: string;
  creditsRemaining?: number;
  creditsTotal?: number;
  createdAt?: any;
};

type Course = { id: string; name?: string; area?: string; level?: number };
type Student = { id: string; name?: string; fullName?: string; displayName?: string };

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchDocsByIds<T extends { id: string }>(
  colName: string,
  ids: string[],
): Promise<T[]> {
  if (!ids.length) return [];
  const idsUnique = Array.from(new Set(ids)).filter(Boolean);

  // Firestore "in" limit: 10
  const batches = chunk(idsUnique, 10);

  const results: T[] = [];
  for (const batch of batches) {
    const q = query(collection(db, colName), where(documentId(), 'in', batch));
    const snap = await getDocs(q);
    snap.forEach((d) => results.push({ id: d.id, ...(d.data() as any) }));
  }
  return results;
}

export default function EnrollmentsList({ reloadKey }: { reloadKey: number }) {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courseMap, setCourseMap] = useState<Record<string, Course>>({});
  const [studentMap, setStudentMap] = useState<Record<string, Student>>({});

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        // 1) Fetch enrollments
        const qEnroll = query(collection(db, 'enrollments'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(qEnroll);

        const rows: Enrollment[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

        // 2) Collect IDs we need to "join"
        const courseIds = rows.map((e) => e.courseId).filter(Boolean) as string[];

        const kidIds = rows.flatMap((e) => {
          const ids = (e.kidIds ?? e.studentIds ?? []) as string[];
          return Array.isArray(ids) ? ids : [];
        });

        // 3) Fetch referenced docs
        // ✅ Adjust collection names if your schema differs
        const [courses, students] = await Promise.all([
          fetchDocsByIds<Course>('courses', courseIds),
          fetchDocsByIds<Student>('students', kidIds),
        ]);

        const courseLookup: Record<string, Course> = {};
        courses.forEach((c) => (courseLookup[c.id] = c));

        const studentLookup: Record<string, Student> = {};
        students.forEach((s) => (studentLookup[s.id] = s));

        if (!alive) return;
        setEnrollments(rows);
        setCourseMap(courseLookup);
        setStudentMap(studentLookup);
      } catch (err) {
        console.error('EnrollmentsList load error:', err);
        if (!alive) return;
        setEnrollments([]);
        setCourseMap({});
        setStudentMap({});
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const displayRows = useMemo(() => {
    return enrollments.map((e) => {
      const course = e.courseId ? courseMap[e.courseId] : undefined;

      const kidIds = (e.kidIds ?? e.studentIds ?? []) as string[];
      const studentNames =
        kidIds?.map((id) => {
          const s = studentMap[id];
          return s?.name || s?.fullName || s?.displayName || id;
        }) ?? [];

      const courseName = course?.name || e.courseId || '—';
      const courseMeta =
        course ? `${course.area ?? ''}${course.level ? ` • L${course.level}` : ''}`.trim() : '';

      return {
        ...e,
        courseName,
        courseMeta,
        studentNames,
      };
    });
  }, [enrollments, courseMap, studentMap]);

  if (loading) {
    return <div className="py-6 text-sm text-muted-foreground">Loading enrollments…</div>;
  }

  if (!displayRows.length) {
    return <div className="py-6 text-sm text-muted-foreground">No enrollments found.</div>;
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Credits</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {displayRows.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="align-top">
                <div className="font-medium">{e.courseName}</div>
                {e.courseMeta ? (
                  <div className="text-xs text-muted-foreground">{e.courseMeta}</div>
                ) : null}
              </TableCell>

              <TableCell className="align-top">
                <div className="text-sm">
                  {e.studentNames?.length ? e.studentNames.join(', ') : '—'}
                </div>
              </TableCell>

              <TableCell className="align-top">
                <Badge variant={e.status === 'active' ? 'default' : 'secondary'}>
                  {e.status ?? 'unknown'}
                </Badge>
              </TableCell>

              <TableCell className="align-top">
                {(e.creditsRemaining ?? 0)} / {(e.creditsTotal ?? 0)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Debug hint (optional) */}
      {/* <pre className="text-xs bg-muted p-2 rounded">{JSON.stringify(displayRows[0], null, 2)}</pre> */}
    </div>
  );
}
