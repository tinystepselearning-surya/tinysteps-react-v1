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

  // Your schema uses BOTH
  kidIds?: string[];
  studentId?: string;

  status?: string;
  billingCycle?: string;

  creditsRemaining?: number;
  creditsTotal?: number;
  creditsUsed?: number;

  teacherId?: string;
  parentId?: string;
  lpId?: string | null;

  createdAt?: any;
};

type Kid = {
  id: string;
  name?: string;
  fullName?: string;
  displayName?: string;
};

type Course = {
  id: string;
  name?: string;
  area?: string;
  level?: number;
};

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

  // Firestore "in" query limit: 10 ids
  const batches = chunk(idsUnique, 10);

  const results: T[] = [];
  for (const batch of batches) {
    const q = query(collection(db, colName), where(documentId(), 'in', batch));
    const snap = await getDocs(q);
    snap.forEach((d) => results.push({ id: d.id, ...(d.data() as any) }));
  }
  return results;
}

function prettyCourseId(id?: string) {
  if (!id) return '—';
  // "phonics-foundations" -> "Phonics Foundations"
  return id
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function EnrollmentsList({ reloadKey }: { reloadKey: number }) {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [kidMap, setKidMap] = useState<Record<string, Kid>>({});
  const [courseMap, setCourseMap] = useState<Record<string, Course>>({});

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        // 1) Get enrollments
        const qEnroll = query(collection(db, 'enrollments'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(qEnroll);

        const rows: Enrollment[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

        // 2) Collect kid ids from kidIds[] + studentId
        const kidIds = rows.flatMap((e) => {
          const fromArray = Array.isArray(e.kidIds) ? e.kidIds : [];
          const fromSingle = e.studentId ? [e.studentId] : [];
          return [...fromArray, ...fromSingle];
        });

        const courseIds = rows.map((e) => e.courseId).filter(Boolean) as string[];

        // 3) Fetch kids (✅ your collection name is kids)
        const kids = await fetchDocsByIds<Kid>('kids', kidIds);
        const kidLookup: Record<string, Kid> = {};
        kids.forEach((k) => (kidLookup[k.id] = k));

        // 4) OPTIONAL: fetch courses if the collection exists in your project
        // If 'courses' collection is missing in prod, this will just return [] and we fallback to prettyCourseId.
        let courseLookup: Record<string, Course> = {};
        try {
          const courses = await fetchDocsByIds<Course>('courses', courseIds);
          courseLookup = {};
          courses.forEach((c) => (courseLookup[c.id] = c));
        } catch (e) {
          courseLookup = {};
        }

        if (!alive) return;
        setEnrollments(rows);
        setKidMap(kidLookup);
        setCourseMap(courseLookup);
      } catch (err) {
        console.error('EnrollmentsList load error:', err);
        if (!alive) return;
        setEnrollments([]);
        setKidMap({});
        setCourseMap({});
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
      const kidIds = [
        ...(Array.isArray(e.kidIds) ? e.kidIds : []),
        ...(e.studentId ? [e.studentId] : []),
      ].filter(Boolean);

      const kidNames = kidIds.map((id) => {
        const k = kidMap[id];
        return k?.name || k?.fullName || k?.displayName || id;
      });

      const courseDoc = e.courseId ? courseMap[e.courseId] : undefined;
      const courseName = courseDoc?.name || prettyCourseId(e.courseId);

      return { ...e, kidNames, courseName };
    });
  }, [enrollments, kidMap, courseMap]);

  if (loading) return <div className="py-6 text-sm text-muted-foreground">Loading enrollments…</div>;
  if (!displayRows.length) return <div className="py-6 text-sm text-muted-foreground">No enrollments found.</div>;

  return (
    <div className="space-y-3">
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
          {displayRows.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-medium">{e.courseName}</TableCell>

              <TableCell>
                {e.kidNames?.length ? e.kidNames.join(', ') : '—'}
              </TableCell>

              <TableCell>
                <Badge variant={e.status === 'active' ? 'default' : 'secondary'}>
                  {e.status ?? 'unknown'}
                </Badge>
              </TableCell>

              <TableCell>
                {(e.creditsRemaining ?? 0)} / {(e.creditsTotal ?? 0)}
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {e.billingCycle ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
