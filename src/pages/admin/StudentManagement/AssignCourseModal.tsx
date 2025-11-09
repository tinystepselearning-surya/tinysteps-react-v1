import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { collection, getDocs, setDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { Student } from '../../../types/Student';

interface Props {
  student: Student;
  onClose: () => void;
  onAssigned?: () => void;
}

export default function AssignCourseModal({ student, onClose, onAssigned }: Props) {
  const [courses, setCourses] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'courses'));
        setCourses(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'Failed to load courses', variant: 'destructive' });
      }
    };
    load();
  }, []);

  const handleAssign = async () => {
    if (!selected) return toast({ title: 'Select', description: 'Please choose a course' });
    try {
      const enrollmentRef = doc(collection(db, 'enrollments'));

      // read primary parent
      const studentDoc = await getDoc(doc(db, 'kids', student.id));
      const primaryParentId = studentDoc.exists() ? (studentDoc.data() as any).primaryParentId : student.primaryParentId;

      await setDoc(enrollmentRef, {
        studentId: student.id,
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
      toast({ title: 'Error', description: err.message || 'Failed', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Course to {student.fullName}</DialogTitle>
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
          <Button onClick={handleAssign}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
