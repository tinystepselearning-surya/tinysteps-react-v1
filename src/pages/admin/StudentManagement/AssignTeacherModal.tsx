import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { updateKid } from '../../../services/kidsService';
import { toast } from '@components/hooks/use-toast';
import { Student } from '../../../types/Student';
import { useAuthStore } from '../../../store/useAuthStore';
import { Enrollment } from '../../../types/Enrollment';

interface Props {
  student: Student;
  onClose: () => void;
  onAssigned?: () => void;
}

export default function AssignTeacherModal({ student, onClose, onAssigned }: Props) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [specialization, setSpecialization] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [courseMap, setCourseMap] = useState<Record<string, string>>({});
  const [selectedEnrollment, setSelectedEnrollment] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const { user } = useAuthStore();
  const [canAssign, setCanAssign] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        const tQ = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const tSnap = await getDocs(tQ);
  setTeachers(tSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));

        const eQ = query(collection(db, 'enrollments'), where('studentId', '==', student.id));
        const eSnap = await getDocs(eQ);
        setEnrollments(eSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Enrollment[]);

        const cSnap = await getDocs(collection(db, 'courses'));
        const cList = cSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setCourses(cList);
        const cMap: Record<string, string> = {};
        cList.forEach(c => cMap[c.id] = c.title || c.name || c.id);
        setCourseMap(cMap);
      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
      }
    };
    load();
  }, [student.id]);

  useEffect(() => {
    const check = async () => {
      if (user?.role === 'admin') return setCanAssign(true);
      if (user?.role === 'learningPartner') {
        const studentDoc = await getDoc(doc(db, 'kids', student.id));
        const lpId = studentDoc.exists() ? (studentDoc.data() as any).lpId : undefined;
        return setCanAssign(lpId === user.uid);
      }
      if (user?.role === 'teacher') {
        // Teacher can update teacher assignment only if they are the same teacher assigned (not typical), but keep false for now
        setCanAssign(false);
      }
      setCanAssign(false);
    };
    check();
  }, [user, student.id]);

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

      // Update the kid's teacherId
      await updateKid(student.id as string, {
        teacherId: selectedTeacher,
      } as any);

      toast({ title: 'Assigned', description: 'Teacher assigned' });
      onAssigned?.();
      onClose();
    } catch (err: any) {
        console.error(err);
        if ((err as any)?.code === 'permission-denied') {
          toast({ title: 'Permission denied', description: 'You do not have permission to assign teachers. Please contact an Admin or the assigned Learning Partner.', variant: 'destructive' });
        } else {
          toast({ title: 'Error', description: err.message || 'Failed to assign', variant: 'destructive' });
        }
      }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign Teacher for {student.fullName}</DialogTitle>
          <DialogDescription>Select an enrollment and a teacher to assign. Admins and Learning Partners can update teacher assignments for students under their supervision.</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 border rounded"
              placeholder="Search teachers by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              value={specialization || '__all__'}
              onValueChange={(v) => setSpecialization(v === '__all__' ? null : v)}
            >
              <SelectTrigger className="w-44"><SelectValue placeholder="Specialization"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {Array.from(new Set(teachers.flatMap(t => (t.specializations || []))))
                  .map((s: any) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={selectedEnrollment} onValueChange={setSelectedEnrollment}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select enrollment (course)"/></SelectTrigger>
              <SelectContent>
                {enrollments.map(e => (
                  <SelectItem key={e.id} value={e.id}>{courseMap[e.courseId] || e.courseId} — {e.status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select teacher"/></SelectTrigger>
              <SelectContent>
                {teachers
                  .filter(t => {
                    if (specialization && !(t.specializations || []).includes(specialization)) return false;
                    if (searchTerm) {
                      const str = (t.name || t.email || '').toLowerCase();
                      return str.includes(searchTerm.toLowerCase());
                    }
                    return true;
                  })
                  .map(t => (
                    <SelectItem key={t.uid || t.id} value={t.uid || t.id}>{t.name || t.email}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!canAssign}>
            {canAssign ? 'Assign Teacher' : 'Not Authorized'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
