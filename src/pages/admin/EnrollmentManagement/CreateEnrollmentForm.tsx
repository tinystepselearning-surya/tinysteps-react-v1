import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Input } from '@components/ui/input';
import { toast } from '@components/hooks/use-toast';

const monthsForCycle = { monthly: 1, quarterly: 3, annual: 12 };
const sessionsPerMonthForFrequency = (freq: string) => {
  switch (freq) {
    case 'weekly': return 4;
    case 'biweekly': return 2;
    case 'monthly': return 1;
    default: return 4;
  }
};

export default function CreateEnrollmentForm({ onCreated }: { onCreated?: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [step, setStep] = useState(1);

  useEffect(() => { fetchStudents(); fetchCourses(); }, []);

  const fetchStudents = async () => {
    const snap = await getDocs(collection(db, 'kids'));
    const arr: any[] = [];
    snap.forEach(s => arr.push({ id: s.id, ...s.data() }));
    setStudents(arr);
  };

  const fetchCourses = async () => {
    const snap = await getDocs(collection(db, 'courses'));
    const arr: any[] = [];
    snap.forEach(c => arr.push({ id: c.id, ...c.data() }));
    setCourses(arr.filter(c => c.status === 'active'));
  };

  const parentForStudent = useMemo(() => {
    if (!selectedStudent) return null;
    return students.find(s => s.id === selectedStudent)?.parentId || null;
  }, [selectedStudent, students]);

  const selectedCourseData = useMemo(() => courses.find(c => c.id === selectedCourse), [selectedCourse, courses]);

  const calculateCredits = () => {
    if (!selectedCourseData) return 0;
    const sessionsPerMonth = sessionsPerMonthForFrequency(selectedCourseData.sessionFrequency || 'weekly');
    const months = monthsForCycle[billingCycle];
    return sessionsPerMonth * months;
  };

  const handleCreate = async () => {
    if (!selectedStudent || !selectedCourse) {
      toast({ title: 'Error', description: 'Select student and course', variant: 'destructive' });
      return;
    }

    try {
      const studentDoc = await getDoc(doc(db, 'kids', selectedStudent));
      const parentId = studentDoc.exists() ? studentDoc.data()?.parentId : null;

      const enrollmentRef = doc(collection(db, 'enrollments'));
      const credits = calculateCredits();
      await setDoc(enrollmentRef, {
        studentId: selectedStudent,
        courseId: selectedCourse,
        parentId: parentId || null,
        teacherId: null,
        lpId: null,
        status: 'pending_teacher',
        ratePerSession: selectedCourseData.ratePerSession || 0,
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
      setStep(1); setSelectedCourse(null); setSelectedStudent(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to create enrollment', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Enrollment</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Select Student</label>
              <Select onValueChange={(v) => setSelectedStudent(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.grade})</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedStudent && (
                <div className="text-sm text-gray-600">Parent: {students.find(s => s.id === selectedStudent)?.parentName || 'Unknown'}</div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} disabled={!selectedStudent}>Next</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Select Course</label>
              <Select onValueChange={(v) => setSelectedCourse(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} — ₹{c.ratePerSession}/session</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCourseData && (
                <div className="p-2 border rounded">
                  <div><strong>Prerequisites:</strong> {selectedCourseData.prerequisites?.join(', ') || 'None'}</div>
                  <div><strong>Rate/session:</strong> ₹{selectedCourseData.ratePerSession}</div>
                  <div><strong>Session Frequency:</strong> {selectedCourseData.sessionFrequency}</div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)} disabled={!selectedCourse}>Next</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Billing Cycle</label>
              <Select onValueChange={(v: any) => setBillingCycle(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select billing cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>

              <div className="p-2 border rounded">
                <div>Estimated sessions: {calculateCredits()}</div>
                <div>Estimated cost per session: ₹{selectedCourseData?.ratePerSession || 0}</div>
                <div className="mt-2 font-semibold">Estimated total sessions: {calculateCredits()}</div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={handleCreate}>Confirm & Create</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
