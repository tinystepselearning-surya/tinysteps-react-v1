import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import {
  collection,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { Student } from '../../../types/Student';
import { useAuthStore } from '../../../store/useAuthStore';

interface Props {
  student: Student;
  onClose: () => void;
  onAssigned?: () => void;
}

type Course = {
  id: string;
  name?: string;
  title?: string;
  level?: string;
  levelName?: string;
  status?: string;
  ratePerSession?: number;
  sessionFrequency?: string;
};

const defaultCourses = [
  'Early Phonics',
  'Phonics Foundations',
  'Advanced Phonics',
  'Basic Grammar',
  'Advanced Grammar & Writing',
  'Basic Public Speaking (Early Speakers)',
  'Advanced Public Speaking (Young Leaders)',
  'Spoken English & Confident Communication (Adults)',
];

// simple helper to estimate credits for a monthly cycle
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

export default function AssignCourseModal({
  student,
  onClose,
  onAssigned,
}: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [canAssign, setCanAssign] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  const { user } = useAuthStore();

  // Derive a safe display name without touching unknown typed fields
  const studentName =
    (student as any).fullName ||
    (student as any).name ||
    (student as any).displayName ||
    student.id;

  // Load courses
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'courses'));
        const fetched: Course[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        if (fetched.length === 0) {
          // Fallback: build in-memory default list with slug ids
          const mapped: Course[] = defaultCourses.map((title) => ({
            id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            title,
            status: 'active',
          }));
          setCourses(mapped);
        } else {
          // Prefer only active courses; if none explicitly active, show all
          const active = fetched.filter(
            (c) => !c.status || c.status === 'active',
          );
          setCourses(active.length ? active : fetched);
        }
      } catch (err) {
        console.error(err);
        toast({
          title: 'Error',
          description: 'Failed to load courses',
          variant: 'destructive',
        });
      }
    };

    void load();
  }, []);

  // Who can assign? Admin OR LP assigned to this student
  useEffect(() => {
    if (!user || !student) return;

    const check = async () => {
      if (user.role === 'admin') {
        setCanAssign(true);
        return;
      }

      if (user.role === 'learningPartner') {
        try {
          const studentDoc = await getDoc(doc(db, 'kids', student.id));
          const data = studentDoc.exists()
            ? (studentDoc.data() as any)
            : (student as any);

          const lpId = data.lpId || data.primaryLpId || (student as any).lpId;
          setCanAssign(lpId === user.uid);
          return;
        } catch (err) {
          console.error(err);
          setCanAssign(false);
          return;
        }
      }

      setCanAssign(false);
    };

    void check();
  }, [user, student]);

  const handleAssign = async () => {
    if (!selected) {
      toast({
        title: 'Select a course',
        description: 'Please choose a course before assigning.',
      });
      return;
    }

    if (!canAssign) {
      toast({
        title: 'Not authorized',
        description:
          'You do not have permission to assign a course to this student.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      // Prevent duplicate enrollment for same student + course
      const existingQ = query(
        collection(db, 'enrollments'),
        where('studentId', '==', student.id),
        where('courseId', '==', selected),
      );
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
        toast({
          title: 'Already assigned',
          description:
            'This course is already assigned to the student.',
          variant: 'destructive',
        });
        return;
      }

      // Read primary parent from kid doc
      const studentDoc = await getDoc(doc(db, 'kids', student.id));
      const studentData = studentDoc.exists()
        ? (studentDoc.data() as any)
        : (student as any);

      const primaryParentId =
        studentData.primaryParentId ||
        studentData.parentId ||
        (student as any).primaryParentId ||
        (student as any).parentId ||
        null;

      const selectedCourse = courses.find((c) => c.id === selected);
      const ratePerSession = selectedCourse?.ratePerSession ?? 0;
      const sessionFrequency =
        selectedCourse?.sessionFrequency || 'weekly';
      const sessionsPerMonth =
        sessionsPerMonthForFrequency(sessionFrequency);
      const billingCycle: 'monthly' = 'monthly';
      const creditsTotal = sessionsPerMonth; // 1-month worth of sessions

      const enrollmentRef = doc(collection(db, 'enrollments'));

      await setDoc(enrollmentRef, {
        studentId: student.id,
        kidIds: [student.id],
        courseId: selected,
        teacherId: null,
        lpId: null,
        parentId: primaryParentId,
        status: 'pending_teacher',
        ratePerSession,
        billingCycle,
        creditsTotal,
        creditsUsed: 0,
        creditsRemaining: creditsTotal,
        topicProgress: {},
        enrollmentDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user?.uid || null,
      });

      toast({
        title: 'Assigned',
        description: 'Course assigned to student.',
      });
      onAssigned?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'permission-denied') {
        toast({
          title: 'Permission denied',
          description:
            'You do not have permission to create enrollments. Please contact an Admin or be assigned as a Learning Partner for this student.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: err.message || 'Failed to assign course',
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Assign Course to {studentName}
          </DialogTitle>
          <DialogDescription>
            Choose a course for this student and create an enrollment.
            Only Admins and the assigned Learning Partner can perform
            this action.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {(c.title || c.name || 'Untitled Course') +
                    (c.level || c.levelName
                      ? ` — ${c.level || c.levelName}`
                      : '')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!canAssign && (
            <p className="text-xs text-red-500">
              You are not authorized to assign courses for this
              student.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!canAssign || saving}>
            {saving
              ? 'Assigning…'
              : canAssign
              ? 'Assign'
              : 'Not Authorized'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
