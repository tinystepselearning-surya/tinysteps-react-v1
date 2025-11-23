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
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@components/ui/card';
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

const monthsForCycle: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  annual: 12,
};

const sessionsPerMonthForFrequency = (freq: string | undefined) => {
  switch (freq) {
    case 'weekly':
      return 4;
    case 'biweekly':
      return 2;
    case 'monthly':
      return 1;
    default:
      return 4; // sensible default
  }
};

interface CreateEnrollmentFormProps {
  onCreated?: () => void;
}

export default function CreateEnrollmentForm({
  onCreated,
}: CreateEnrollmentFormProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | undefined>();
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>();
  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>('monthly');
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      // students
      const sSnap = await getDocs(collection(db, 'kids'));
      const sArr: any[] = [];
      sSnap.forEach((s) => sArr.push({ id: s.id, ...s.data() }));
      setStudents(sArr);

      // courses (only active)
      const cSnap = await getDocs(collection(db, 'courses'));
      const cArr: any[] = [];
      cSnap.forEach((c) => cArr.push({ id: c.id, ...c.data() }));
      setCourses(cArr.filter((c) => c.status === 'active'));
    };

    void load();
  }, []);

  const selectedStudentObj = useMemo(
    () => students.find((s) => s.id === selectedStudent) || null,
    [selectedStudent, students],
  );

  const parentForStudent = useMemo(() => {
    if (!selectedStudentObj) return null;
    return (
      selectedStudentObj.parentId ||
      selectedStudentObj.parentEmail ||
      selectedStudentObj.parentName ||
      null
    );
  }, [selectedStudentObj]);

  const selectedCourseData = useMemo(
    () => courses.find((c) => c.id === selectedCourse),
    [selectedCourse, courses],
  );

  const calculateCredits = () => {
    if (!selectedCourseData) return 0;
    const sessionsPerMonth = sessionsPerMonthForFrequency(
      selectedCourseData.sessionFrequency || 'weekly',
    );
    const months = monthsForCycle[billingCycle];
    return sessionsPerMonth * months;
  };

  const handleCreate = async () => {
    if (!selectedStudent || !selectedCourse) {
      toast({
        title: 'Error',
        description: 'Select student and course',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);

      // Fetch latest student data to ensure parentId is correct
      const studentDoc = await getDoc(doc(db, 'kids', selectedStudent));
      const parentId = studentDoc.exists()
        ? (studentDoc.data() as any)?.parentId
        : null;

      const enrollmentRef = doc(collection(db, 'enrollments'));
      const credits = calculateCredits();

      await setDoc(enrollmentRef, {
        // canonical fields for new docs
        studentId: selectedStudent,
        kidIds: [selectedStudent], // keeps multi-kid flexibility later
        courseId: selectedCourse,
        parentId: parentId || null,
        teacherId: null,
        lpId: null,
        status: 'pending_teacher',
        ratePerSession: selectedCourseData?.ratePerSession || 0,
        billingCycle,
        creditsTotal: credits,
        creditsUsed: 0,
        creditsRemaining: credits,
        topicProgress: {},
        enrollmentDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({ title: 'Success', description: 'Enrollment created' });
      onCreated?.();

      // reset form
      setStep(1);
      setSelectedCourse(undefined);
      setSelectedStudent(undefined);
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

  const prerequisitesText =
    selectedCourseData &&
    (Array.isArray(selectedCourseData.prerequisites)
      ? selectedCourseData.prerequisites.join(', ')
      : selectedCourseData.prerequisites || 'None');

  const estimatedSessions = calculateCredits();
  const estimatedRate = selectedCourseData?.ratePerSession || 0;
  const estimatedTotal = estimatedSessions * estimatedRate;

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Create Enrollment</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 1: Student */}
          {step === 1 && (
            <div className="space-y-4">
              <label className="text-sm font-medium">
                Select Student
              </label>
              <Select
                value={selectedStudent}
                onValueChange={(v) => setSelectedStudent(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {(s.name ||
                        s.displayName ||
                        s.fullName ||
                        'Unnamed') + (s.grade ? ` (${s.grade})` : '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedStudentObj && (
                <div className="text-sm text-gray-600">
                  Parent:{' '}
                  {selectedStudentObj.parentName ||
                    selectedStudentObj.parentEmail ||
                    parentForStudent ||
                    'Unknown'}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedStudent}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Course */}
          {step === 2 && (
            <div className="space-y-4">
              <label className="text-sm font-medium">
                Select Course
              </label>
              <Select
                value={selectedCourse}
                onValueChange={(v) => setSelectedCourse(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name || c.title || 'Untitled'} — ₹
                      {c.ratePerSession || 0}/session
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCourseData && (
                <div className="p-2 border rounded text-sm space-y-1">
                  <div>
                    <strong>Prerequisites:</strong>{' '}
                    {prerequisitesText}
                  </div>
                  <div>
                    <strong>Rate/session:</strong> ₹
                    {selectedCourseData.ratePerSession || 0}
                  </div>
                  <div>
                    <strong>Session Frequency:</strong>{' '}
                    {selectedCourseData.sessionFrequency || 'weekly'}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!selectedCourse}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Billing + Summary */}
          {step === 3 && (
            <div className="space-y-4">
              <label className="text-sm font-medium">
                Billing Cycle
              </label>
              <Select
                value={billingCycle}
                onValueChange={(v: BillingCycle) =>
                  setBillingCycle(v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select billing cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>

              <div className="p-2 border rounded text-sm space-y-1">
                <div>
                  Estimated sessions: <strong>{estimatedSessions}</strong>
                </div>
                <div>
                  Cost per session: ₹
                  <strong>{estimatedRate}</strong>
                </div>
                <div className="mt-2 font-semibold">
                  Estimated total value:{' '}
                  <span>₹{estimatedTotal}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={creating}
                >
                  Back
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? 'Creating…' : 'Confirm & Create'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
