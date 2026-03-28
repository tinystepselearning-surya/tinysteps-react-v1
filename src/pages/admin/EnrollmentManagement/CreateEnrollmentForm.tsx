// src/pages/admin/EnrollmentManagement/CreateEnrollmentForm.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';

import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { useToast } from '@components/hooks/use-toast';

type BillingCycle = 'monthly' | 'quarterly' | 'annual';

const BILLING_CYCLE_OPTIONS: BillingCycle[] = ['monthly', 'quarterly', 'annual'];

const monthsForCycle: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  annual: 12,
};

const sessionsPerMonthForFrequency = (freq?: string) => {
  switch (freq) {
    case 'weekly':
      return 4;
    case 'biweekly':
      return 2;
    case 'monthly':
      return 1;
    default:
      return 4;
  }
};

type KidDoc = {
  id: string;
  name?: string;
  fullName?: string;
  displayName?: string;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
};

type CourseDoc = {
  id: string;
  name?: string;
  title?: string;
  status?: string;
  ratePerSession?: number;
  sessionFrequency?: string;
};

interface CreateEnrollmentFormProps {
  onCreated?: () => void;
}

export default function CreateEnrollmentForm({ onCreated }: CreateEnrollmentFormProps) {
  const { toast } = useToast();

  const [students, setStudents] = useState<KidDoc[]>([]);
  const [courses, setCourses] = useState<CourseDoc[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('__none__');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('__none__');

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  /* -------------------- load data -------------------- */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const studentsSnap = await getDocs(collection(db, 'kids'));
        const studentsArr: KidDoc[] = studentsSnap.docs.map((s) => ({
          id: s.id,
          ...(s.data() as any),
        }));
        setStudents(studentsArr);

        const coursesSnap = await getDocs(collection(db, 'courses'));
        const coursesArr: CourseDoc[] = coursesSnap.docs.map((c) => ({
          id: c.id,
          ...(c.data() as any),
        }));

        // NOTE: your course schema uses lowercase status: 'active' | 'inactive' | 'draft'
        setCourses(coursesArr.filter((c) => (c.status ?? '').toLowerCase() === 'active'));
      } catch (err: any) {
        console.error(err);
        toast({
          title: 'Failed to load data',
          description: err?.message || 'Unable to load students/courses from Firestore.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------- derived data -------------------- */
  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const studentLabel = useMemo(() => {
    if (!selectedStudent) return '—';
    return selectedStudent.name || selectedStudent.displayName || selectedStudent.fullName || selectedStudent.id;
  }, [selectedStudent]);

  const courseLabel = useMemo(() => {
    if (!selectedCourse) return '—';
    return selectedCourse.name || selectedCourse.title || selectedCourse.id;
  }, [selectedCourse]);

  const parentLabel = useMemo(() => {
    if (!selectedStudent) return '—';
    return selectedStudent.parentName || selectedStudent.parentEmail || selectedStudent.parentId || 'Unknown';
  }, [selectedStudent]);

  const calculateCredits = () => {
    if (!selectedCourse) return 0;
    const perMonth = sessionsPerMonthForFrequency(selectedCourse.sessionFrequency);
    return perMonth * monthsForCycle[billingCycle];
  };

  const estimatedSessions = calculateCredits();
  const ratePerSession = selectedCourse?.ratePerSession || 0;
  const estimatedTotal = estimatedSessions * ratePerSession;

  /* -------------------- create enrollment -------------------- */
  const handleCreate = async () => {
    if (selectedStudentId === '__none__' || selectedCourseId === '__none__') {
      toast({
        title: 'Missing data',
        description: 'Please select student and course',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedStudent || !selectedCourse) {
      toast({
        title: 'Missing selection',
        description: 'Selected student/course not found in loaded data.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);

      // Prefer canonical parentId; fall back to parentIds[0] and then a fresh kid read.
      let parentId: string | null =
        (selectedStudent as any)?.parentId ??
        (Array.isArray((selectedStudent as any)?.parentIds) ? (selectedStudent as any).parentIds[0] : null) ??
        null;
      let parentIds: string[] = Array.isArray((selectedStudent as any)?.parentIds)
        ? (selectedStudent as any).parentIds.map(String).filter(Boolean)
        : [];

      if (!parentId) {
        const studentSnap = await getDoc(doc(db, 'kids', selectedStudentId));
        if (studentSnap.exists()) {
          const studentData = studentSnap.data() as any;
          parentId = studentData?.parentId ?? (Array.isArray(studentData?.parentIds) ? studentData.parentIds[0] : null);
          if (Array.isArray(studentData?.parentIds)) {
            parentIds = studentData.parentIds.map(String).filter(Boolean);
          }
        }
      }
      if (parentId && !parentIds.includes(parentId)) {
        parentIds.push(parentId);
      }

      const enrollmentRef = doc(collection(db, 'enrollments'));
      const credits = calculateCredits();

      await setDoc(enrollmentRef, {
        // IDs
        enrollmentId: enrollmentRef.id,
        studentId: selectedStudentId,
        kidId: selectedStudentId,
        kidIds: [selectedStudentId],
        courseId: selectedCourseId,
        parentId,
        parentIds,
        teacherId: null,
        teacherIds: [],
        lpId: null,

        // ✅ denormalized labels (THIS FIXES “showing IDs”)
        kidNames: [studentLabel],
        courseName: courseLabel,
        parentLabel: parentLabel,

        // billing / credits
        status: 'trial',
        ratePerSession,
        billingCycle,
        creditsTotal: credits,
        creditsUsed: 0,
        creditsRemaining: credits,

        // future fields
        topicProgress: {},

        // timestamps
        enrollmentDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Enrollment created',
        description: 'Enrollment successfully created',
      });

      onCreated?.();

      // reset
      setStep(1);
      setSelectedStudentId('__none__');
      setSelectedCourseId('__none__');
      setBillingCycle('monthly');
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to create enrollment',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  /* -------------------- UI -------------------- */
  if (loading) {
    return <div className="py-6 text-center">Loading students & courses…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Create Enrollment</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <label className="text-sm font-medium">Select Student</label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select student</SelectItem>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name || s.displayName || s.fullName || 'Unnamed'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-sm text-gray-600">Parent: {parentLabel}</div>

              <Button onClick={() => setStep(2)} disabled={selectedStudentId === '__none__'}>
                Next
              </Button>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <label className="text-sm font-medium">Select Course</label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select course</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {(c.name || c.title || 'Untitled') + ` — ₹${c.ratePerSession || 0}/session`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={selectedCourseId === '__none__'}>
                  Next
                </Button>
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <label className="text-sm font-medium">Billing Cycle</label>
              <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as BillingCycle)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLE_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="border rounded p-3 text-sm space-y-1">
                <div>
                  Student: <strong>{studentLabel}</strong>
                </div>
                <div>
                  Course: <strong>{courseLabel}</strong>
                </div>
                <div>
                  Status: <strong>Trial</strong>
                </div>
                <div>
                  Estimated sessions: <strong>{estimatedSessions}</strong>
                </div>
                <div>
                  Rate/session: ₹<strong>{ratePerSession}</strong>
                </div>
                <div className="font-semibold mt-2">Estimated total: ₹{estimatedTotal}</div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} disabled={creating}>
                  Back
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? 'Creating…' : 'Confirm & Create'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
