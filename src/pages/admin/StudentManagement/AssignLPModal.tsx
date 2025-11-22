import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
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

export default function AssignLPModal({ student, onClose, onAssigned }: Props) {
  const [lps, setLps] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [courseMap, setCourseMap] = useState<Record<string, string>>({});
  const [selectedEnrollment, setSelectedEnrollment] = useState<string>('');
  const [selectedLP, setSelectedLP] = useState<string>('');
  const { user } = useAuthStore();
  const [canAssign, setCanAssign] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        const lpQ = query(collection(db, 'users'), where('role', '==', 'learningPartner'));
        const lpSnap = await getDocs(lpQ);
        setLps(lpSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));

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
    // Only Admins can assign LPs to a student
    setCanAssign(user?.role === 'admin');
  }, [user]);

  const handleAssign = async () => {
    if (!selectedEnrollment) return toast({ title: 'Select', description: 'Select enrollment' });
    if (!selectedLP) return toast({ title: 'Select', description: 'Select LP' });

    try {
      const enrRef = doc(db, 'enrollments', selectedEnrollment);
      await updateDoc(enrRef, {
        lpId: selectedLP,
        status: 'active',
        updatedAt: new Date(),
      } as any);

      // Update the kid's lpId
      await updateKid(student.id as string, { lpId: selectedLP } as any);

      // Optionally link LP to parent: simplistic approach - find enrollment parentId and update LP's managed list
      // Skipping complex linking here; can be added later

      toast({ title: 'Assigned', description: 'Learning Partner assigned' });
      onAssigned?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      if ((err as any)?.code === 'permission-denied') {
        toast({ title: 'Permission denied', description: 'You do not have permission to assign a Learning Partner. Please contact an Admin.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: err.message || 'Failed to assign', variant: 'destructive' });
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign Learning Partner for {student.fullName}</DialogTitle>
          <DialogDescription>Assign a Learning Partner to the student’s enrollment. Only Admins can set a Learning Partner for a student.</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
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

          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 border rounded"
              placeholder="Search LP by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <Select value={selectedLP} onValueChange={setSelectedLP}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select LP"/></SelectTrigger>
              <SelectContent>
                {lps.filter(lp => {
                  if (!searchTerm) return true;
                  const s = (lp.name || lp.email || '').toLowerCase();
                  return s.includes(searchTerm.toLowerCase());
                }).map(l => (
                  <SelectItem key={l.uid || l.id} value={l.uid || l.id}>{l.name || l.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!canAssign}>{canAssign ? 'Assign LP' : 'Not Authorized'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
