import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { Student } from '../../../types/Student';
import { Enrollment } from '../../../types/Enrollment';

interface Props {
  student: Student;
  onClose: () => void;
  onAssigned?: () => void;
}

export default function AssignTeacherModal({ student, onClose, onAssigned }: Props) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const tQ = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const tSnap = await getDocs(tQ);
        setTeachers(tSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));

        const eQ = query(collection(db, 'enrollments'), where('studentId', '==', student.id));
        const eSnap = await getDocs(eQ);
        setEnrollments(eSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Enrollment[]);
      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
      }
    };
    load();
  }, [student.id]);

  const handleAssign = async () => {
    if (!selectedEnrollment) return toast({ title: 'Select', description: 'Select enrollment' });
    if (!selectedTeacher) return toast({ title: 'Select', description: 'Select teacher' });

    try {
      const enrRef = doc(db, 'enrollments', selectedEnrollment);
      await updateDoc(enrRef, {
        teacherId: selectedTeacher,
        status: 'pending_payment',
        updatedAt: new Date(),
      } as any);

      toast({ title: 'Assigned', description: 'Teacher assigned' });
      onAssigned?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.message || 'Failed to assign', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign Teacher for {student.fullName}</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <Select value={selectedEnrollment} onValueChange={setSelectedEnrollment}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select enrollment (course)"/></SelectTrigger>
              <SelectContent>
                {enrollments.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.courseId} — {e.status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select teacher"/></SelectTrigger>
              <SelectContent>
                {teachers.map(t => (
                  <SelectItem key={t.uid || t.id} value={t.uid || t.id}>{t.name || t.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAssign}>Assign Teacher</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
