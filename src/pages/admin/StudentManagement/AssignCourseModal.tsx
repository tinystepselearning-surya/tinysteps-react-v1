import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { collection, getDocs, setDoc, doc, serverTimestamp, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { Student } from '../../../types/Student';
import { useAuthStore } from '../../../store/useAuthStore';

interface Props {
  student: Student;
  onClose: () => void;
  onAssigned?: () => void;
}

export default function AssignCourseModal({ student, onClose, onAssigned }: Props) {
  const [courses, setCourses] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const { user } = useAuthStore();
  const [canAssign, setCanAssign] = useState<boolean>(false);
  const defaultCourses = [
    'Early Phonics',
    'Phonics Foundations',
    'Advanced Phonics',
    'Basic Grammar',
    'Advanced Grammar & Writing',
    'Basic Public Speaking (Early Speakers)',
    'Advanced Public Speaking (Young Leaders)',
    'Spoken English & Confident Communication (Adults)'
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'courses'));
        const fetched = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        if (fetched.length === 0) {
          // fallback to default list with slug ids
          const mapped = defaultCourses.map(title => ({ id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), title }));
          setCourses(mapped);
        } else {
          setCourses(fetched);
        }
      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'Failed to load courses', variant: 'destructive' });
      }
    };
    load();
  }, []);

  useEffect(() => {
    const check = async () => {
      if (user?.role === 'admin') return setCanAssign(true);
      if (user?.role === 'learningPartner') {
        const studentDoc = await getDoc(doc(db, 'kids', student.id));
        const lpId = studentDoc.exists() ? (studentDoc.data() as any).lpId : student.lpId;
        return setCanAssign(lpId === user.uid);
      }
      setCanAssign(false);
    };
    check();
  }, [user, student.id]);

  const handleAssign = async () => {
    if (!selected) return toast({ title: 'Select', description: 'Please choose a course' });
    try {
      // Check if enrollment already exists for this course and student
      const existingQ = query(collection(db, 'enrollments'), where('studentId', '==', student.id), where('courseId', '==', selected));
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
        toast({ title: 'Already assigned', description: 'This course is already assigned to the student.', variant: 'destructive' });
        return;
      }

      const enrollmentRef = doc(collection(db, 'enrollments'));

      // read primary parent
      const studentDoc = await getDoc(doc(db, 'kids', student.id));
      const primaryParentId = studentDoc.exists() ? (studentDoc.data() as any).primaryParentId : student.primaryParentId;

      await setDoc(enrollmentRef, {
        studentId: student.id,
        kidIds: [student.id],
        courseId: selected,
        teacherId: null,
        lpId: null,
        parentId: primaryParentId,
        status: 'pending_teacher',
        ratePerSession: 500,
        billingCycle: 'monthly',
        creditsTotal: 0,
        creditsUsed: 0,
        creditsRemaining: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({ title: 'Assigned', description: 'Course assigned to student' });
      onAssigned?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      if ((err as any)?.code === 'permission-denied') {
        toast({ title: 'Permission denied', description: 'You do not have permission to create enrollments. Please contact an Admin or be assigned as a Learning Partner for this student.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: err.message || 'Failed', variant: 'destructive' });
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Course to {student.fullName}</DialogTitle>
          <DialogDescription>Choose a course for this student and create an enrollment. Only Admins and assigned Learning Partners can perform this action.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.title || c.name} — {c.level || c.levelName || ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!canAssign}>
            {canAssign ? 'Assign' : 'Not Authorized'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
